import { useState, useCallback } from 'react';
import { Plus, Trash2, ToggleLeft, ToggleRight, Pencil, Check, X, Users } from 'lucide-react';
import type { AgentConfig } from '@shared/types';

interface GroupAgentsPanelProps {
  agents: AgentConfig[];
  onUpsert: (agent: Partial<AgentConfig> & { id?: string }) => void;
  onRemove: (id: string) => void;
  onToggle: (id: string, enabled: boolean) => void;
}

interface AgentFormState {
  name: string;
  emoji: string;
  systemPrompt: string;
  model: string;
}

const EMPTY_FORM: AgentFormState = { name: '', emoji: '🤖', systemPrompt: '', model: '' };

function agentAccentColor(agentId: string): string {
  let hash = 0;
  for (let i = 0; i < agentId.length; i++) {
    hash = (hash * 31 + agentId.charCodeAt(i)) >>> 0;
  }
  return `hsl(${hash % 360}, 65%, 55%)`;
}

function AgentRow({
  agent,
  onUpsert,
  onRemove,
  onToggle,
}: {
  agent: AgentConfig;
  onUpsert: (a: Partial<AgentConfig> & { id?: string }) => void;
  onRemove: (id: string) => void;
  onToggle: (id: string, enabled: boolean) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<AgentFormState>({
    name: agent.name,
    emoji: agent.emoji,
    systemPrompt: agent.systemPrompt,
    model: agent.model ?? '',
  });

  const accent = agentAccentColor(agent.id);

  const save = useCallback(() => {
    onUpsert({ id: agent.id, ...form, ...(form.model ? { model: form.model } : { model: undefined }) });
    setEditing(false);
  }, [agent.id, form, onUpsert]);

  const cancel = useCallback(() => {
    setForm({ name: agent.name, emoji: agent.emoji, systemPrompt: agent.systemPrompt, model: agent.model ?? '' });
    setEditing(false);
  }, [agent]);

  if (editing) {
    return (
      <div
        className="rounded-xl border border-white/10 bg-white/5 p-3 space-y-2"
        style={{ borderLeftColor: accent, borderLeftWidth: 3 }}
      >
        <div className="flex gap-2">
          <input
            type="text"
            value={form.emoji}
            onChange={(e) => setForm((f) => ({ ...f, emoji: e.target.value }))}
            className="w-12 text-center rounded-lg border border-white/15 bg-white/10 text-sm p-1 text-foreground"
            placeholder="🤖"
            maxLength={4}
          />
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className="flex-1 rounded-lg border border-white/15 bg-white/10 text-sm p-1 text-foreground placeholder:text-muted-foreground"
            placeholder="Agent name"
          />
        </div>
        <textarea
          value={form.systemPrompt}
          onChange={(e) => setForm((f) => ({ ...f, systemPrompt: e.target.value }))}
          className="w-full rounded-lg border border-white/15 bg-white/10 text-xs p-2 text-foreground placeholder:text-muted-foreground resize-none"
          rows={4}
          placeholder="System prompt…"
        />
        <input
          type="text"
          value={form.model}
          onChange={(e) => setForm((f) => ({ ...f, model: e.target.value }))}
          className="w-full rounded-lg border border-white/15 bg-white/10 text-xs p-1 text-foreground placeholder:text-muted-foreground"
          placeholder="Model override (optional)"
        />
        <div className="flex gap-2 justify-end">
          <button
            type="button"
            onClick={cancel}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs text-muted-foreground hover:text-foreground hover:bg-white/10"
          >
            <X className="size-3" /> Cancel
          </button>
          <button
            type="button"
            onClick={save}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium text-white bg-violet-600 hover:bg-violet-500"
          >
            <Check className="size-3" /> Save
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex items-start gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 transition-opacity ${agent.enabled ? '' : 'opacity-50'}`}
      style={{ borderLeftColor: accent, borderLeftWidth: 3 }}
    >
      <span className="text-xl leading-none mt-0.5 select-none">{agent.emoji}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground truncate" style={{ color: accent }}>{agent.name}</p>
        <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{agent.systemPrompt}</p>
        {agent.model && (
          <p className="text-[10px] text-muted-foreground/70 mt-0.5">Model: {agent.model}</p>
        )}
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <button
          type="button"
          onClick={() => onToggle(agent.id, !agent.enabled)}
          className="p-1 rounded text-muted-foreground hover:text-foreground"
          title={agent.enabled ? 'Disable agent' : 'Enable agent'}
          aria-label={agent.enabled ? 'Disable agent' : 'Enable agent'}
        >
          {agent.enabled
            ? <ToggleRight className="size-4 text-violet-400" />
            : <ToggleLeft className="size-4" />}
        </button>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="p-1 rounded text-muted-foreground hover:text-foreground"
          title="Edit agent"
          aria-label="Edit agent"
        >
          <Pencil className="size-3.5" />
        </button>
        <button
          type="button"
          onClick={() => onRemove(agent.id)}
          className="p-1 rounded text-muted-foreground hover:text-red-400"
          title="Remove agent"
          aria-label="Remove agent"
        >
          <Trash2 className="size-3.5" />
        </button>
      </div>
    </div>
  );
}

export function GroupAgentsPanel({ agents, onUpsert, onRemove, onToggle }: GroupAgentsPanelProps) {
  const [addingNew, setAddingNew] = useState(false);
  const [newForm, setNewForm] = useState<AgentFormState>(EMPTY_FORM);

  const saveNew = useCallback(() => {
    if (!newForm.name.trim()) return;
    onUpsert({ ...newForm, ...(newForm.model ? { model: newForm.model } : {}) });
    setNewForm(EMPTY_FORM);
    setAddingNew(false);
  }, [newForm, onUpsert]);

  return (
    <div className="flex flex-col gap-2 p-3 h-full overflow-y-auto">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <Users className="size-4 text-violet-400" />
          <span className="text-sm font-semibold text-foreground">Group Agents</span>
        </div>
        <button
          type="button"
          onClick={() => setAddingNew((v) => !v)}
          className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-violet-600/20 hover:bg-violet-600/30 text-violet-300 border border-violet-500/30"
          aria-label="Add new agent"
          id="group-chat-add-agent-btn"
        >
          <Plus className="size-3" /> Add
        </button>
      </div>

      {addingNew && (
        <div className="rounded-xl border border-violet-500/30 bg-violet-500/5 p-3 space-y-2">
          <div className="flex gap-2">
            <input
              type="text"
              value={newForm.emoji}
              onChange={(e) => setNewForm((f) => ({ ...f, emoji: e.target.value }))}
              className="w-12 text-center rounded-lg border border-white/15 bg-white/10 text-sm p-1 text-foreground"
              placeholder="🤖"
              maxLength={4}
            />
            <input
              type="text"
              value={newForm.name}
              onChange={(e) => setNewForm((f) => ({ ...f, name: e.target.value }))}
              className="flex-1 rounded-lg border border-white/15 bg-white/10 text-sm p-1 text-foreground placeholder:text-muted-foreground"
              placeholder="Agent name"
            />
          </div>
          <textarea
            value={newForm.systemPrompt}
            onChange={(e) => setNewForm((f) => ({ ...f, systemPrompt: e.target.value }))}
            className="w-full rounded-lg border border-white/15 bg-white/10 text-xs p-2 text-foreground placeholder:text-muted-foreground resize-none"
            rows={4}
            placeholder="System prompt…"
          />
          <input
            type="text"
            value={newForm.model}
            onChange={(e) => setNewForm((f) => ({ ...f, model: e.target.value }))}
            className="w-full rounded-lg border border-white/15 bg-white/10 text-xs p-1 text-foreground placeholder:text-muted-foreground"
            placeholder="Model override (optional)"
          />
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => { setAddingNew(false); setNewForm(EMPTY_FORM); }}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs text-muted-foreground hover:text-foreground hover:bg-white/10"
            >
              <X className="size-3" /> Cancel
            </button>
            <button
              type="button"
              onClick={saveNew}
              disabled={!newForm.name.trim()}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium text-white bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:pointer-events-none"
            >
              <Check className="size-3" /> Add
            </button>
          </div>
        </div>
      )}

      {agents.length === 0 && !addingNew && (
        <p className="text-xs text-muted-foreground text-center py-6">No agents yet. Add one above.</p>
      )}

      <div className="space-y-2">
        {agents.map((agent) => (
          <AgentRow
            key={agent.id}
            agent={agent}
            onUpsert={onUpsert}
            onRemove={onRemove}
            onToggle={onToggle}
          />
        ))}
      </div>

      <p className="text-[10px] text-muted-foreground/50 text-center mt-2">
        {agents.filter((a) => a.enabled).length} of {agents.length} agents active
      </p>
    </div>
  );
}
