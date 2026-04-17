import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AgentAuthGuard } from '../auth/agent-auth.guard';
import { AgentConfigStoreService } from './agent-config-store.service';
import type { AgentConfig } from '@shared/types';

@Controller('group-chat')
@UseGuards(AgentAuthGuard)
export class GroupChatController {
  constructor(private readonly agentConfigStore: AgentConfigStoreService) {}

  @Get('agents')
  getAgents(): AgentConfig[] {
    return this.agentConfigStore.getAll();
  }

  @Post('agents')
  @HttpCode(HttpStatus.OK)
  upsertAgent(@Body() body: Partial<AgentConfig> & { id?: string }): AgentConfig {
    return this.agentConfigStore.upsert(body);
  }

  @Delete('agents/:id')
  removeAgent(@Param('id') id: string): { removed: boolean } {
    return { removed: this.agentConfigStore.remove(id) };
  }

  @Patch('agents/:id/enabled')
  @HttpCode(HttpStatus.OK)
  setEnabled(
    @Param('id') id: string,
    @Body() body: { enabled: boolean },
  ): AgentConfig | null {
    return this.agentConfigStore.setEnabled(id, body.enabled);
  }
}
