import { beforeEach, describe, expect, it } from 'vitest';
import {
  readEventCursor,
  readCachedDeployState,
  readJson,
  STORAGE_KEYS,
  writeEventCursor,
  writeCachedDeployState,
  writeJson,
} from './services/cache';

describe('cache helpers', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('returns fallback when key is missing', () => {
    expect(readJson('missing_key', { ok: false })).toEqual({ ok: false });
  });

  it('writes and reads JSON values', () => {
    const payload = { contractId: 'C123', count: 2 };
    writeJson(STORAGE_KEYS.DEPLOYED_CONTRACT, payload);

    expect(readJson(STORAGE_KEYS.DEPLOYED_CONTRACT, null)).toEqual(payload);
  });

  it('stores transaction history with max 50 entries', () => {
    const txs = Array.from({ length: 60 }, (_, i) => ({ hash: `tx-${i}` }));

    writeCachedDeployState({
      deployedContract: { id: 'CABC' },
      transactions: txs,
    });

    const state = readCachedDeployState();
    expect(state.deployedContract.id).toBe('CABC');
    expect(state.transactions).toHaveLength(50);
    expect(state.transactions[0].hash).toBe('tx-0');
    expect(state.transactions[49].hash).toBe('tx-49');
  });

  it('persists event cursor per contract', () => {
    writeEventCursor('CONE', 'cursor-1');
    writeEventCursor('CTWO', 'cursor-2');

    expect(readEventCursor('CONE')).toBe('cursor-1');
    expect(readEventCursor('CTWO')).toBe('cursor-2');
    expect(readEventCursor('CUNKNOWN')).toBe(null);
  });
});
