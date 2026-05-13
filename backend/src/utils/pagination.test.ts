import { paginate, parseSort } from './pagination.js';

describe('paginate', () => {
  it('packages items + counters into a Paginated<T>', () => {
    const items = [1, 2, 3];
    expect(paginate(items, 30, 1, 10)).toEqual({
      items,
      total: 30,
      page: 1,
      pageSize: 10,
    });
  });
});

describe('parseSort', () => {
  it('returns the fallback when sort is undefined', () => {
    expect(parseSort(undefined)).toEqual({ createdAt: -1 });
  });

  it('respects a custom fallback', () => {
    expect(parseSort(undefined, { name: 1 })).toEqual({ name: 1 });
  });

  it('parses "field:asc"', () => {
    expect(parseSort('name:asc')).toEqual({ name: 1 });
  });

  it('parses "field:desc"', () => {
    expect(parseSort('createdAt:desc')).toEqual({ createdAt: -1 });
  });

  it('treats omitted direction as desc', () => {
    expect(parseSort('createdAt')).toEqual({ createdAt: -1 });
  });

  it('falls back when given an empty string', () => {
    expect(parseSort('')).toEqual({ createdAt: -1 });
  });
});
