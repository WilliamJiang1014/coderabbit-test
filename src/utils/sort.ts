/**
 * Safe sort-field resolution via allowlist.
 * Column names never come directly from raw user input.
 */
export const SORT_COLUMNS = {
  name: 'username',
  email: 'email',
  created: 'created_at',
} as const;

export type SortKey = keyof typeof SORT_COLUMNS;

export function isSortKey(value: unknown): value is SortKey {
  return typeof value === 'string' && value in SORT_COLUMNS;
}

/** Build an ORDER BY clause from a typed allowlist key. */
export function orderByClause(key: SortKey, direction: 'ASC' | 'DESC'): string {
  return `ORDER BY ${SORT_COLUMNS[key]} ${direction}`;
}

/** Non-cryptographic shuffle for display ordering only. */
export function shuffleForDisplay<T>(items: T[]): T[] {
  const copy = items.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = copy[i];
    copy[i] = copy[j];
    copy[j] = tmp;
  }
  return copy;
}
