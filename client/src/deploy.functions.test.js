import { describe, expect, it } from 'vitest';
import { normalizeFunctionDefinitions } from './services/deploy';

describe('function metadata normalization', () => {
  it('normalizes legacy string params into object params', () => {
    const result = normalizeFunctionDefinitions([
      {
        name: 'transfer',
        params: ['from: Address', 'amount: i128'],
        returns: 'void',
        description: 'Transfer tokens',
      },
    ]);

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('transfer');
    expect(result[0].params).toEqual([
      { name: 'from', type: 'Address', label: 'from: Address' },
      { name: 'amount', type: 'i128', label: 'amount: i128' },
    ]);
    expect(result[0].returns).toBe('void');
  });

  it('keeps object params and fills defaults safely', () => {
    const result = normalizeFunctionDefinitions([
      {
        name: 'set_value',
        params: [{ name: 'value', type: 'u32' }, {}],
      },
    ]);

    expect(result[0].params[0]).toEqual({
      name: 'value',
      type: 'u32',
      label: 'value: u32',
    });

    expect(result[0].params[1]).toEqual({
      name: 'arg2',
      type: 'unknown',
      label: 'arg2: unknown',
    });

    expect(result[0].returns).toBe('void');
    expect(result[0].description).toBe('');
  });

  it('returns an empty array for invalid inputs', () => {
    expect(normalizeFunctionDefinitions(null)).toEqual([]);
    expect(normalizeFunctionDefinitions(undefined)).toEqual([]);
    expect(normalizeFunctionDefinitions({})).toEqual([]);
  });
});
