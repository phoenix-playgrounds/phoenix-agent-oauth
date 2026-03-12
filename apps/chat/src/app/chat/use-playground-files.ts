import { useCallback, useEffect, useState } from 'react';
import { getApiUrl, getAuthTokenForRequest } from '../api-url';

export interface PlaygroundEntryItem {
  path: string;
  name: string;
  type: 'file' | 'directory';
}

interface PlaygroundEntry {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: PlaygroundEntry[];
}

function flattenEntries(entries: PlaygroundEntry[]): PlaygroundEntryItem[] {
  const out: PlaygroundEntryItem[] = [];
  for (const e of entries) {
    out.push({ path: e.path, name: e.name, type: e.type });
    if (e.type === 'directory' && e.children?.length) {
      out.push(...flattenEntries(e.children));
    }
  }
  return out;
}

function sortEntries(items: PlaygroundEntryItem[]): PlaygroundEntryItem[] {
  return [...items].sort((a, b) => {
    if (a.type !== b.type) return a.type === 'directory' ? -1 : 1;
    return a.path.localeCompare(b.path);
  });
}

export function usePlaygroundFiles(): {
  entries: PlaygroundEntryItem[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
} {
  const [entries, setEntries] = useState<PlaygroundEntryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    const base = getApiUrl();
    const url = base ? `${base}/api/playgrounds` : '/api/playgrounds';
    const token = getAuthTokenForRequest();
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    try {
      const res = await fetch(url, { headers });
      if (res.status === 401) {
        setEntries([]);
        return;
      }
      if (!res.ok) throw new Error('Failed to load playgrounds');
      const data = (await res.json()) as PlaygroundEntry[];
      const list = Array.isArray(data) ? data : [];
      setEntries(sortEntries(flattenEntries(list)));
    } catch (e) {
      setEntries([]);
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return { entries, loading, error, refetch };
}
