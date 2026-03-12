import { describe, it, expect } from 'vitest';
import {
  getAtMentionState,
  valueAfterAtMatchesEntry,
} from './file-mention-dropdown';

describe('valueAfterAtMatchesEntry', () => {
  const entries = [
    { path: 'examples', name: 'examples', type: 'directory' as const },
    { path: 'zcss/docs', name: 'docs', type: 'directory' as const },
  ];

  it('returns false when value has no @', () => {
    expect(valueAfterAtMatchesEntry('hello', entries)).toBe(false);
  });

  it('returns false when token after @ is empty', () => {
    expect(valueAfterAtMatchesEntry('@', entries)).toBe(false);
  });

  it('returns true when token after @ matches entry path', () => {
    expect(valueAfterAtMatchesEntry('@examples', entries)).toBe(true);
  });

  it('returns true when token after @ matches entry name', () => {
    expect(valueAfterAtMatchesEntry('@docs', entries)).toBe(true);
  });

  it('returns true when token matches full path', () => {
    expect(valueAfterAtMatchesEntry('@zcss/docs', entries)).toBe(true);
  });

  it('returns false when token is partial and matches no entry', () => {
    expect(valueAfterAtMatchesEntry('@ex', entries)).toBe(false);
  });

  it('uses only the first token when value has space after @', () => {
    expect(valueAfterAtMatchesEntry('@examples foo', entries)).toBe(true);
  });

  it('returns false for empty entries', () => {
    expect(valueAfterAtMatchesEntry('@examples', [])).toBe(false);
  });
});

describe('getAtMentionState', () => {
  it('returns show false when no @ before cursor', () => {
    const r = getAtMentionState('hello world', 5);
    expect(r.show).toBe(false);
  });

  it('returns show true and query when @ at cursor and no space after', () => {
    const r = getAtMentionState('hi @', 4);
    expect(r.show).toBe(true);
    expect(r.query).toBe('');
    expect(r.replaceStart).toBe(3);
  });

  it('returns show true and query from text after @ when path part is incomplete', () => {
    const r = getAtMentionState('see @src', 8);
    expect(r.show).toBe(true);
    expect(r.query).toBe('src');
    expect(r.replaceStart).toBe(4);
  });

  it('returns show false when space appears after @', () => {
    const r = getAtMentionState('@foo bar', 8);
    expect(r.show).toBe(false);
  });

  it('returns show false when cursor at end and value ends with complete path (has slash)', () => {
    const r = getAtMentionState('@src/components', 15);
    expect(r.show).toBe(false);
  });

  it('returns show false when cursor at end and path part contains trailing slash', () => {
    const r = getAtMentionState('see @src/', 9);
    expect(r.show).toBe(false);
  });

  it('returns show false when cursor at end and value ends with file extension', () => {
    const r = getAtMentionState('@src/app.ts', 11);
    expect(r.show).toBe(false);
  });

  it('returns show true when cursor in middle of @ mention', () => {
    const r = getAtMentionState('@src/app', 7);
    expect(r.show).toBe(true);
    expect(r.query).toBe('src/ap');
  });

  it('uses last @ before cursor for query', () => {
    const r = getAtMentionState('@a @b', 6);
    expect(r.show).toBe(true);
    expect(r.query).toBe('b');
    expect(r.replaceStart).toBe(3);
  });
});
