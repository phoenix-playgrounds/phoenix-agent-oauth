import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AgentThinkingSidebar } from './agent-thinking-sidebar';

describe('AgentThinkingSidebar', () => {
  it('renders Agent Thinking heading when expanded', () => {
    render(
      <AgentThinkingSidebar isCollapsed={false} onToggle={vi.fn()} />
    );
    expect(screen.getByRole('heading', { name: 'Agent Thinking' })).toBeTruthy();
  });

  it('renders Model (default) button when expanded', () => {
    render(
      <AgentThinkingSidebar isCollapsed={false} onToggle={vi.fn()} />
    );
    expect(screen.getByRole('button', { name: 'Model (default)' })).toBeTruthy();
  });

  it('shows Processing when isStreaming is true', () => {
    render(
      <AgentThinkingSidebar isCollapsed={false} onToggle={vi.fn()} isStreaming />
    );
    expect(screen.getByText('Processing')).toBeTruthy();
  });

  it('shows Idle when isStreaming is false', () => {
    render(
      <AgentThinkingSidebar isCollapsed={false} onToggle={vi.fn()} />
    );
    expect(screen.getByText('Idle')).toBeTruthy();
  });

  it('does not show heading or Model button when collapsed', () => {
    render(
      <AgentThinkingSidebar isCollapsed onToggle={vi.fn()} />
    );
    expect(screen.queryByRole('heading', { name: 'Agent Thinking' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Model (default)' })).toBeNull();
  });

  it('calls onToggle when sidebar toggle is clicked', () => {
    const onToggle = vi.fn();
    render(
      <AgentThinkingSidebar isCollapsed={false} onToggle={onToggle} />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Collapse thinking panel' }));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('shows expand label when collapsed', () => {
    const onToggle = vi.fn();
    render(
      <AgentThinkingSidebar isCollapsed onToggle={onToggle} />
    );
    expect(screen.getByRole('button', { name: 'Expand thinking panel' })).toBeTruthy();
  });
});
