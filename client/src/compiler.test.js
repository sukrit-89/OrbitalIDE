import { describe, expect, it, vi } from 'vitest';
import {
  CompilationStatus,
  checkCompilerAvailability,
  compileContract,
} from './services/compiler';

describe('compiler service integration', () => {
  it('loads precompiled wasm for known example contracts', async () => {
    const bytes = new Uint8Array([0, 97, 115, 109]);

    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      arrayBuffer: async () => bytes.buffer,
    });

    const result = await compileContract('ignored source', 'counter');

    expect(result.status).toBe(CompilationStatus.SUCCESS);
    expect(result.wasm).toBeInstanceOf(Uint8Array);
    expect(result.wasm[0]).toBe(0);
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledWith('/wasm/counter.wasm');
  });

  it('falls back to backend compile when precompiled wasm is missing', async () => {
    const wasmBase64 = Buffer.from(new Uint8Array([1, 2, 3, 4])).toString('base64');

    global.fetch = vi
      .fn()
      .mockResolvedValueOnce({ ok: false })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ wasm: wasmBase64, size: 4, compiledIn: 120 }),
      });

    const result = await compileContract('#[contract] #[contractimpl] use soroban_sdk;', 'counter');

    expect(result.status).toBe(CompilationStatus.SUCCESS);
    expect(Array.from(result.wasm)).toEqual([1, 2, 3, 4]);
    expect(result.size).toBe(4);
    expect(result.compiledIn).toBe(120);
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it('returns compiler service hint when backend is unreachable', async () => {
    global.fetch = vi.fn().mockRejectedValueOnce(new TypeError('fetch failed'));

    const result = await compileContract('#[contract] #[contractimpl] use soroban_sdk;', null);

    expect(result.status).toBe(CompilationStatus.ERROR);
    expect(result.error).toContain('Compiler service not reachable');
  });

  it('reports compiler availability from /health endpoint', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ready: true, rust: 'rustc 1.93.0', stellarCli: 'stellar 25', activeCompilations: 0 }),
    });

    const status = await checkCompilerAvailability();

    expect(status.available).toBe(true);
    expect(status.rust).toContain('rustc');
    expect(status.stellarCli).toContain('stellar');
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch.mock.calls[0][0]).toContain('/health');
  });
});
