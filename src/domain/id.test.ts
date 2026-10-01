import { expect, it, vi } from 'vitest';
import { newId } from './id';

it('creates distinct UUIDs when randomUUID is unavailable over local HTTP', () => {
  const original = globalThis.crypto;
  vi.stubGlobal('crypto', { getRandomValues: original.getRandomValues.bind(original) });
  try {
    const ids = Array.from({ length: 100 }, newId);
    expect(new Set(ids).size).toBe(100);
    for (const id of ids)
      expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  } finally {
    vi.unstubAllGlobals();
  }
});
