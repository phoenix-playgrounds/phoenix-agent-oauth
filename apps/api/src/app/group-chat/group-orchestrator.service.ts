import { Injectable, Logger } from '@nestjs/common';
import type { AgentConfig } from '@shared/types';
import { WS_EVENT } from '@shared/ws-constants';
import { AgentConfigStoreService } from './agent-config-store.service';
import { MessageStoreService } from '../message-store/message-store.service';
import { ModelStoreService } from '../model-store/model-store.service';
import { StrategyRegistryService } from '../strategies/strategy-registry.service';
import { ChatPromptContextService } from '../orchestrator/chat-prompt-context.service';
import { FibeSyncService } from '../fibe-sync/fibe-sync.service';
import type { OutboundEvent } from '../orchestrator/orchestrator.service';
import type { Subject } from 'rxjs';

@Injectable()
export class GroupOrchestratorService {
  private readonly logger = new Logger(GroupOrchestratorService.name);
  isProcessing = false;

  constructor(
    private readonly agentConfigStore: AgentConfigStoreService,
    private readonly messageStore: MessageStoreService,
    private readonly modelStore: ModelStoreService,
    private readonly strategyRegistry: StrategyRegistryService,
    private readonly chatPromptContext: ChatPromptContextService,
    private readonly fibeSync: FibeSyncService,
  ) {}

  async handleGroupMessage(
    text: string,
    outbound$: Subject<OutboundEvent>,
  ): Promise<void> {
    const send = (type: string, data: Record<string, unknown> = {}): void => {
      outbound$.next({ type, data });
    };

    const agents = this.agentConfigStore.getEnabled();
    if (!agents.length) {
      this.logger.warn('No enabled agents for group chat');
      return;
    }

    this.isProcessing = true;

    try {
      // Store the user message once
      const userMessage = this.messageStore.add('user', text);
      send(WS_EVENT.MESSAGE, userMessage as unknown as Record<string, unknown>);

      // Broadcast current agents list
      send(WS_EVENT.GROUP_AGENTS_UPDATED, { agents: this.agentConfigStore.getAll() });

      // Run each agent sequentially
      for (const agent of agents) {
        await this.runAgent(agent, text, send);
      }

      // Sync after all agents have responded
      void this.fibeSync.syncMessages(() => JSON.stringify(this.messageStore.all()));
    } finally {
      this.isProcessing = false;
    }
  }

  getAgents(): AgentConfig[] {
    return this.agentConfigStore.getAll();
  }

  private async runAgent(
    agent: AgentConfig,
    userText: string,
    send: (type: string, data?: Record<string, unknown>) => void,
  ): Promise<void> {
    const strategy = this.strategyRegistry.resolveStrategy();
    const model = agent.model ?? this.modelStore.get();
    let accumulated = '';

    send(WS_EVENT.GROUP_AGENT_STREAM_START, {
      agentId: agent.id,
      agentName: agent.name,
      agentEmoji: agent.emoji,
      model,
    });

    try {
      // Build prompt — without multi-turn history injection for now (keeps it simple)
      const fullPrompt = await this.chatPromptContext.buildFullPrompt(
        userText,
        [], // no images
        null, // no audio
        undefined, // no attachments
        undefined, // no history injection
      );

      await strategy.executePromptStreaming(
        fullPrompt,
        model,
        (chunk: string) => {
          accumulated += chunk;
          send(WS_EVENT.GROUP_AGENT_STREAM_CHUNK, { agentId: agent.id, text: chunk });
        },
        undefined,
        agent.systemPrompt || undefined,
      );

      // Finalise: store message + emit full agent message
      const storedMsg = this.messageStore.add(
        'assistant',
        accumulated,
        undefined,
        model,
        { agentId: agent.id, agentName: agent.name, agentEmoji: agent.emoji },
      );

      send(WS_EVENT.GROUP_AGENT_STREAM_END, { agentId: agent.id });
      send(WS_EVENT.GROUP_AGENT_MESSAGE, {
        ...storedMsg,
        agentId: agent.id,
        agentName: agent.name,
        agentEmoji: agent.emoji,
      } as unknown as Record<string, unknown>);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(`Agent ${agent.name} failed: ${message}`);
      send(WS_EVENT.GROUP_AGENT_STREAM_END, { agentId: agent.id, error: message });
    }
  }
}
