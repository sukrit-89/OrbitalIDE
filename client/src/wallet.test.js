import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@stellar/freighter-api', () => ({
  isConnected: vi.fn(),
  getAddress: vi.fn(),
  requestAccess: vi.fn(),
  signTransaction: vi.fn(),
}));

import * as freighter from '@stellar/freighter-api';
import {
  WalletErrorType,
  connectWallet,
  disconnectWallet,
  signTransaction,
} from './wallet';

describe('wallet error handling', () => {
  beforeEach(() => {
    disconnectWallet();
  });

  it('rejects unsupported wallet providers with NOT_INSTALLED', async () => {
    await expect(connectWallet('xbull')).rejects.toMatchObject({
      type: WalletErrorType.NOT_INSTALLED,
    });
  });

  it('maps rejected connection to USER_REJECTED', async () => {
    freighter.requestAccess.mockRejectedValueOnce(new Error('User rejected request'));

    await expect(connectWallet('freighter')).rejects.toMatchObject({
      type: WalletErrorType.USER_REJECTED,
    });
  });

  it('maps signing failures for underfunded accounts to INSUFFICIENT_BALANCE', async () => {
    freighter.requestAccess.mockResolvedValueOnce('GTESTPUBLICKEY123');
    freighter.signTransaction.mockRejectedValueOnce(new Error('underfunded account'));

    await connectWallet('freighter');

    await expect(signTransaction('AAAA', 'Test SDF Network ; September 2015')).rejects.toMatchObject({
      type: WalletErrorType.INSUFFICIENT_BALANCE,
    });
  });
});
