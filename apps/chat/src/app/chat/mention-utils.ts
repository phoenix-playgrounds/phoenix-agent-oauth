export const AT_MENTION_REGEX = /(@[^\s@]+)/g;

export function isLikelyFile(path: string): boolean {
  const segment = path.split('/').pop() ?? '';
  return segment.includes('.') && /\.(md|tsx?|jsx?|json|css|html|yml|yaml|txt|svg)$/i.test(segment);
}

export function pathDisplayName(path: string): string {
  return path.split('/').pop() ?? path;
}
