import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { ConfigService } from '../config/config.service';
import type { AgentConfig } from '@shared/types';

const DEFAULT_AGENTS: AgentConfig[] = [
  {
    id: 'agent-developer',
    name: 'Developer',
    emoji: '🛠️',
    systemPrompt:
      'You are an expert software developer. Your role is to analyse the user request and provide concrete implementation steps, code snippets, or architectural decisions. Be technically precise and concise.',
    enabled: true,
  },
  {
    id: 'agent-tester',
    name: 'Tester',
    emoji: '🧪',
    systemPrompt:
      'You are a QA engineer. Your role is to analyse the user request and describe concrete test cases, edge cases to consider, and potential quality risks. Focus on testability and coverage.',
    enabled: true,
  },
  {
    id: 'agent-manager',
    name: 'Manager',
    emoji: '📧',
    systemPrompt:
      'You are a technical project manager. Your role is to analyse the user request and produce a brief status summary, identify blockers, estimate effort, and suggest next steps from a project management perspective.',
    enabled: true,
  },
  {
    id: 'agent-architect',
    name: 'Architect',
    emoji: '🏗️',
    systemPrompt:
      'You are a software architect. Your role is to analyse the user request and provide high-level architectural guidance: patterns, trade-offs, scalability concerns, and design decisions.',
    enabled: false,
  },
];

@Injectable()
export class AgentConfigStoreService {
  private readonly logger = new Logger(AgentConfigStoreService.name);
  private readonly agentsPath: string;
  private agents: AgentConfig[] = [];

  constructor(private readonly config: ConfigService) {
    const dataDir = this.config.getConversationDataDir();
    this.agentsPath = join(dataDir, 'agents.json');
    this.ensureDataDir();
    this.agents = this.load();
  }

  getAll(): AgentConfig[] {
    return this.agents;
  }

  getEnabled(): AgentConfig[] {
    return this.agents.filter((a) => a.enabled);
  }

  upsert(agent: Partial<AgentConfig> & { id?: string }): AgentConfig {
    const existing = agent.id ? this.agents.find((a) => a.id === agent.id) : undefined;
    if (existing) {
      Object.assign(existing, agent);
      this.persist();
      return existing;
    }
    const newAgent: AgentConfig = {
      id: randomUUID(),
      name: agent.name ?? 'Agent',
      emoji: agent.emoji ?? '🤖',
      systemPrompt: agent.systemPrompt ?? '',
      enabled: agent.enabled ?? true,
      ...(agent.model ? { model: agent.model } : {}),
    };
    this.agents.push(newAgent);
    this.persist();
    return newAgent;
  }

  remove(id: string): boolean {
    const before = this.agents.length;
    this.agents = this.agents.filter((a) => a.id !== id);
    if (this.agents.length !== before) {
      this.persist();
      return true;
    }
    return false;
  }

  setEnabled(id: string, enabled: boolean): AgentConfig | null {
    const agent = this.agents.find((a) => a.id === id);
    if (!agent) return null;
    agent.enabled = enabled;
    this.persist();
    return agent;
  }

  private persist(): void {
    try {
      writeFileSync(this.agentsPath, JSON.stringify(this.agents, null, 2), 'utf8');
    } catch (err) {
      this.logger.error('Failed to persist agents.json', err);
    }
  }

  private ensureDataDir(): void {
    const dataDir = this.config.getConversationDataDir();
    if (!existsSync(dataDir)) {
      mkdirSync(dataDir, { recursive: true });
    }
  }

  private load(): AgentConfig[] {
    if (!existsSync(this.agentsPath)) {
      this.logger.log('agents.json not found — seeding defaults');
      return [...DEFAULT_AGENTS];
    }
    try {
      const raw = readFileSync(this.agentsPath, 'utf8');
      return JSON.parse(raw) as AgentConfig[];
    } catch (err) {
      this.logger.error('Failed to parse agents.json, using defaults', err);
      return [...DEFAULT_AGENTS];
    }
  }
}
