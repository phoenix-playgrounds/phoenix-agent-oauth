import { Logger } from '@nestjs/common';
import { spawn, type ChildProcess } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { AuthConnection, LogoutConnection } from './strategy.types';
import { INTERRUPTED_MESSAGE, type AgentStrategy } from './strategy.types';
import { runAuthProcess } from './auth-process-helper';

const DEFAULT_CODEX_HOME = join(process.env.HOME ?? '/home/node', '.codex');
const CODEX_BIN_NAME = process.platform === 'win32' ? 'codex.cmd' : 'codex';

function getCodexHome(): string {
  return process.env.SESSION_DIR ?? DEFAULT_CODEX_HOME;
}

function getCodexCommand(): string {
  try {
    const pkgPath = require.resolve('@openai/codex/package.json');
    const nodeModules = join(pkgPath, '..', '..', '..');
    const binPath = join(nodeModules, '.bin', CODEX_BIN_NAME);
    if (existsSync(binPath)) return binPath;
    const binPathUnix = join(nodeModules, '.bin', 'codex');
    if (existsSync(binPathUnix)) return binPathUnix;
  } catch {
    /* @openai/codex not installed */
  }
  const cwd = process.cwd();
  const localBin = join(cwd, 'node_modules', '.bin', CODEX_BIN_NAME);
  if (existsSync(localBin)) return localBin;
  const localBinUnix = join(cwd, 'node_modules', '.bin', 'codex');
  if (existsSync(localBinUnix)) return localBinUnix;
  return 'codex';
}

export class OpenaiCodexStrategy implements AgentStrategy {
  private readonly logger = new Logger(OpenaiCodexStrategy.name);
  private activeAuthProcess: ReturnType<typeof spawn> | null = null;
  private currentConnection: AuthConnection | null = null;
  private authCancel: (() => void) | null = null;
  private currentStreamProcess: ChildProcess | null = null;
  private streamInterrupted = false;

  ensureSettings(): void {
    const codexHome = getCodexHome();
    if (!existsSync(codexHome)) {
      mkdirSync(codexHome, { recursive: true });
    }
  }

  executeAuth(connection: AuthConnection): void {
    this.currentConnection = connection;
    this.ensureSettings();
    connection.sendAuthManualToken();

    let authUrlExtracted = false;
    let deviceCodeExtracted = false;
    const codexHome = getCodexHome();
    const env = { ...process.env, CODEX_HOME: codexHome };

    const codexCmd = getCodexCommand();
    const { process: proc, cancel } = runAuthProcess(codexCmd, ['login', '--device-auth'], {
      env,
      onData: (output) => {
        // eslint-disable-next-line no-control-regex -- strip ANSI escape codes
        const clean = output.replace(/\x1b\[[0-9;]*m/g, '');
        const urlMatch = clean.match(/https:\/\/[^\s"'>]+/);
        if (urlMatch && !authUrlExtracted) {
          authUrlExtracted = true;
          this.currentConnection?.sendAuthUrlGenerated(urlMatch[0]);
        }
        const codeMatch = clean.match(/\b([A-Z0-9]{3,5}-[A-Z0-9]{3,5})\b/);
        if (codeMatch && !deviceCodeExtracted) {
          deviceCodeExtracted = true;
          this.currentConnection?.sendDeviceCode(codeMatch[1]);
        }
      },
      onClose: (code) => {
        if (this.currentConnection) {
          if (code === 0) {
            this.currentConnection.sendAuthSuccess();
          } else {
            this.currentConnection.sendAuthStatus('unauthenticated');
          }
        }
        this.activeAuthProcess = null;
        this.currentConnection = null;
      },
      onError: (err) => {
        this.activeAuthProcess = null;
        this.authCancel = null;
        const isNotFound = (err as NodeJS.ErrnoException)?.code === 'ENOENT';
        if (isNotFound) {
          this.logger.warn(
            'Codex CLI not found on PATH. Use "Paste API Key or Token" in the dialog to sign in with an API key.'
          );
        } else {
          this.logger.error('Codex Auth Process error', err);
        }
      },
    });

    this.activeAuthProcess = proc;
    this.authCancel = cancel;
  }

  cancelAuth(): void {
    this.authCancel?.();
    this.authCancel = null;
    this.activeAuthProcess = null;
    this.currentConnection = null;
  }

  submitAuthCode(code: string): void {
    const trimmed = (code ?? '').trim();
    if (!trimmed) return;

    const looksLikeApiKey = trimmed.startsWith('sk-') || trimmed.length > 40;
    if (looksLikeApiKey && this.currentConnection) {
      this.authCancel?.();
      this.authCancel = null;
      this.activeAuthProcess = null;
      const authFile = join(getCodexHome(), 'auth.json');
      try {
        writeFileSync(authFile, JSON.stringify({ api_key: trimmed }), { mode: 0o600 });
        this.currentConnection.sendAuthSuccess();
      } catch (err) {
        this.logger.error('Failed to write Codex auth.json', err);
        this.currentConnection.sendAuthStatus('unauthenticated');
      }
      this.currentConnection = null;
      return;
    }

    if (this.activeAuthProcess?.stdin) {
      this.activeAuthProcess.stdin.write(trimmed + '\n');
    }
  }

  clearCredentials(): void {
    const authFile = join(getCodexHome(), 'auth.json');
    if (existsSync(authFile)) {
      unlinkSync(authFile);
    }
  }

  executeLogout(connection: LogoutConnection): void {
    const env = { ...process.env, CODEX_HOME: getCodexHome() };
    const logoutProcess = spawn(getCodexCommand(), ['logout'], {
      env,
      shell: false,
    });

    const handleOutput = (data: Buffer | string) => {
      connection.sendLogoutOutput(data.toString());
    };

    logoutProcess.stdout?.on('data', handleOutput);
    logoutProcess.stderr?.on('data', handleOutput);

    logoutProcess.on('close', () => {
      this.clearCredentials();
      connection.sendLogoutSuccess();
    });

    logoutProcess.on('error', () => {
      this.clearCredentials();
      connection.sendLogoutSuccess();
    });
  }

  checkAuthStatus(): Promise<boolean> {
    return new Promise((resolve) => {
      const authFile = join(getCodexHome(), 'auth.json');
      if (!existsSync(authFile)) {
        resolve(false);
        return;
      }
      try {
        const content = readFileSync(authFile, 'utf8');
        const auth = JSON.parse(content) as { access_token?: string; token?: string; api_key?: string };
        resolve(Boolean(auth?.access_token ?? auth?.token ?? auth?.api_key));
      } catch {
        resolve(false);
      }
    });
  }

  interruptAgent(): void {
    this.streamInterrupted = true;
    this.currentStreamProcess?.kill();
  }

  executePromptStreaming(
    prompt: string,
    _model: string,
    onChunk: (chunk: string) => void,
    callbacks?: import('./strategy.types').StreamingCallbacks,
    systemPrompt?: string
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      this.streamInterrupted = false;
      const playgroundDir = join(process.cwd(), 'playground');
      if (!existsSync(playgroundDir)) {
        mkdirSync(playgroundDir, { recursive: true });
      }

      const effectivePrompt = systemPrompt ? `${systemPrompt}\n${prompt}` : prompt;
      const codexCmd = getCodexCommand();
      const codexArgs = ['exec', '--yolo', effectivePrompt];
      const env = { ...process.env, CODEX_HOME: getCodexHome() };

      const codexProcess = spawn(codexCmd, codexArgs, {
        env,
        cwd: playgroundDir,
        shell: false,
      });
      this.currentStreamProcess = codexProcess;

      let errorResult = '';

      codexProcess.stdout?.on('data', (data: Buffer | string) => {
        onChunk(data.toString());
      });

      codexProcess.stderr?.on('data', (data: Buffer | string) => {
        const text = data.toString();
        errorResult += text;
        if (callbacks?.onReasoningChunk) {
          callbacks.onReasoningChunk(text);
        } else {
          onChunk(text);
        }
      });

      codexProcess.on('close', (code) => {
        this.currentStreamProcess = null;
        callbacks?.onReasoningEnd?.();
        if (this.streamInterrupted) {
          reject(new Error(INTERRUPTED_MESSAGE));
          return;
        }
        if (code !== 0 && code !== null) {
          reject(new Error(errorResult.trim() || `Process exited with code ${code}`));
        } else {
          resolve();
        }
      });

      codexProcess.on('error', (err) => {
        this.currentStreamProcess = null;
        reject(err);
      });
    });
  }
}
