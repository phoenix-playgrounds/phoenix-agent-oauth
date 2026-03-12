import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import {
  SCROLL_AT_BOTTOM_THRESHOLD_PX,
  isScrollAtBottom,
  useScrollToBottom,
} from './use-scroll-to-bottom';

describe('isScrollAtBottom', () => {
  it('returns true when scroll is at bottom (distance zero)', () => {
    expect(
      isScrollAtBottom(1000, 400, 600, 80)
    ).toBe(true);
  });

  it('returns true when within threshold', () => {
    expect(isScrollAtBottom(1000, 320, 600, 80)).toBe(true);
  });

  it('returns false when above threshold', () => {
    expect(isScrollAtBottom(1000, 300, 600, 80)).toBe(false);
  });

  it('uses default threshold when not provided', () => {
    expect(
      isScrollAtBottom(1000, 0, 1000)
    ).toBe(true);
    expect(
      isScrollAtBottom(1000, 0, 1000 - SCROLL_AT_BOTTOM_THRESHOLD_PX - 1)
    ).toBe(false);
  });

  it('returns true when content fits (no scroll)', () => {
    expect(isScrollAtBottom(500, 0, 500, 80)).toBe(true);
  });
});

describe('useScrollToBottom', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns refs, state, and callbacks', () => {
    const { result } = renderHook(() => useScrollToBottom([]));
    expect(result.current.scrollRef).toBeDefined();
    expect(result.current.endRef).toBeDefined();
    expect(result.current.isAtBottom).toBe(true);
    expect(typeof result.current.scrollToBottom).toBe('function');
    expect(typeof result.current.onScroll).toBe('function');
    expect(typeof result.current.markJustSent).toBe('function');
  });

  it('markJustSent does not throw', () => {
    const { result } = renderHook(() => useScrollToBottom([]));
    act(() => {
      result.current.markJustSent();
    });
    expect(result.current.markJustSent).toBeDefined();
  });

  it('scrollToBottom does not throw when refs are null', () => {
    const { result } = renderHook(() => useScrollToBottom([]));
    act(() => {
      result.current.scrollToBottom('smooth');
    });
    expect(result.current.isAtBottom).toBe(true);
  });

  it('onScroll does not throw when scrollRef is null', () => {
    const { result } = renderHook(() => useScrollToBottom([]));
    act(() => {
      result.current.onScroll();
    });
  });
});
