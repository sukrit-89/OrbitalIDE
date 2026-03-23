import { describe, expect, it } from 'vitest';
import * as StellarSdk from '@stellar/stellar-sdk';
import { normalizeContractEvent } from './deploy';

describe('event normalization', () => {
  it('normalizes topic and value from ScVal to native', () => {
    const event = {
      id: 'event-1',
      type: 'contract',
      contractId: { toString: () => 'CCONTRACT123' },
      ledger: 12345,
      ledgerClosedAt: '2026-03-23T00:00:00Z',
      txHash: 'abc123',
      topic: [StellarSdk.nativeToScVal('increment', { type: 'symbol' })],
      value: StellarSdk.nativeToScVal(7, { type: 'u32' }),
    };

    const normalized = normalizeContractEvent(event);

    expect(normalized.contractId).toBe('CCONTRACT123');
    expect(normalized.topicNative).toEqual(['increment']);
    expect(normalized.valueNative).toBe(7);
    expect(normalized.txHash).toBe('abc123');
  });

  it('falls back safely when values cannot be converted', () => {
    const normalized = normalizeContractEvent({
      id: 'event-2',
      type: 'contract',
      contractId: 'CFALLBACK',
      ledger: 1,
      ledgerClosedAt: '2026-03-23T00:00:00Z',
      txHash: 'hash2',
      topic: [null],
      value: null,
    });

    expect(normalized.topicNative).toEqual([null]);
    expect(normalized.valueNative).toBe(null);
  });
});
