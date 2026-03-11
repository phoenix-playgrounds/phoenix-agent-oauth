import * as fs from 'node:fs';
import * as path from 'node:path';

/**
 * Loads pre-authenticated credentials from AGENT_CREDENTIALS_JSON.
 * Used when Phoenix attaches a stored Agent to a Playground.
 * Writes files into SESSION_DIR (e.g. agent_token.txt, oauth_creds.json).
 * No-op if env vars are unset or empty.
 */
export function loadInjectedCredentials(): boolean {
  const raw = process.env.AGENT_CREDENTIALS_JSON;
  if (!raw?.trim()) {
    return false;
  }

  const sessionDir = process.env.SESSION_DIR;
  if (!sessionDir) {
    console.warn(
      '[CREDENTIALS] AGENT_CREDENTIALS_JSON is set but SESSION_DIR is not. Skipping injection.'
    );
    return false;
  }

  let credentialFiles: Record<string, string>;
  try {
    credentialFiles = JSON.parse(raw) as Record<string, string>;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[CREDENTIALS] Failed to parse AGENT_CREDENTIALS_JSON:', message);
    return false;
  }

  if (
    !credentialFiles ||
    typeof credentialFiles !== 'object' ||
    Array.isArray(credentialFiles)
  ) {
    console.error(
      '[CREDENTIALS] AGENT_CREDENTIALS_JSON must be a JSON object { filename: content }'
    );
    return false;
  }

  const entries = Object.entries(credentialFiles);
  if (entries.length === 0) {
    console.warn('[CREDENTIALS] AGENT_CREDENTIALS_JSON is empty object. Skipping.');
    return false;
  }

  if (!fs.existsSync(sessionDir)) {
    fs.mkdirSync(sessionDir, { recursive: true });
    console.log(`[CREDENTIALS] Created session directory: ${sessionDir}`);
  }

  let injectedCount = 0;
  for (const [filename, content] of entries) {
    const safeName = path.basename(filename);
    if (safeName !== filename) {
      console.warn(`[CREDENTIALS] Skipping suspicious filename: ${filename}`);
      continue;
    }
    try {
      fs.writeFileSync(path.join(sessionDir, safeName), content, { mode: 0o600 });
      injectedCount++;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[CREDENTIALS] Failed to write ${path.join(sessionDir, safeName)}:`, message);
    }
  }

  if (injectedCount > 0) {
    console.log(`[CREDENTIALS] Injected ${injectedCount} credential file(s) from stored Agent.`);
  }
  return injectedCount > 0;
}
