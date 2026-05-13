import type { Paginated } from '@dk/shared';

export function paginate<T>(
  items: T[],
  total: number,
  page: number,
  pageSize: number,
): Paginated<T> {
  return { items, total, page, pageSize };
}

export function parseSort(
  sort: string | undefined,
  fallback: Record<string, 1 | -1> = { createdAt: -1 },
): Record<string, 1 | -1> {
  if (!sort) return fallback;
  const [field, dir] = sort.split(':');
  if (!field) return fallback;
  const direction: 1 | -1 = dir === 'asc' ? 1 : -1;
  return { [field]: direction };
}
