import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mockConnectWallet = vi.fn();
const mockCompileContract = vi.fn();
const mockDeployContract = vi.fn();
const mockInvokeContract = vi.fn();
const mockGetContractFunctions = vi.fn();
const mockGetContractEvents = vi.fn();

vi.mock('@monaco-editor/react', () => ({
  default: () => <div data-testid="mock-editor" />,
}));

vi.mock('./Landing', () => ({
  default: function MockLanding({ onEnterIDE }) {
    return (
      <button type="button" onClick={onEnterIDE}>
        Enter IDE
      </button>
    );
  },
}));

vi.mock('./services/wallet', () => ({
  connectWallet: (...args) => mockConnectWallet(...args),
  getAvailableWallets: () => [{ id: 'freighter', name: 'Freighter', icon: '', url: '' }],
  getConnectedPublicKey: vi.fn(() => null),
  checkConnection: vi.fn(async () => false),
}));

vi.mock('./services/ai', () => ({
  getApiKey: vi.fn(() => ''),
  setApiKey: vi.fn(),
  isConfigured: vi.fn(() => false),
  chatWithAI: vi.fn(),
  explainCode: vi.fn(),
  debugCode: vi.fn(),
  improveCode: vi.fn(),
  generateContract: vi.fn(),
  completeCode: vi.fn(),
}));

vi.mock('./services/compiler', () => ({
  compileContract: (...args) => mockCompileContract(...args),
  CompilationStatus: {
    SUCCESS: 'success',
    ERROR: 'error',
  },
}));

vi.mock('./contracts/examples', () => ({
  getExamplesList: () => [
    {
      id: 'counter',
      name: 'Counter',
      description: 'Simple counter',
      difficulty: 'Beginner',
    },
  ],
  getExample: () => ({
    name: 'Counter',
    description: 'Simple counter',
    code: '#![no_std]\nuse soroban_sdk::{contract, contractimpl, Env};',
    functions: [
      { name: 'increment', params: [], returns: 'i32', description: 'Inc' },
      { name: 'get_count', params: [], returns: 'i32', description: 'Read' },
    ],
  }),
}));

vi.mock('./services/deploy', () => ({
  deployContract: (...args) => mockDeployContract(...args),
  getContractEvents: (...args) => mockGetContractEvents(...args),
  getContractFunctions: (...args) => mockGetContractFunctions(...args),
  invokeContract: (...args) => mockInvokeContract(...args),
  getExplorerUrl: vi.fn((hash) => `https://stellar.expert/explorer/testnet/tx/${hash}`),
  normalizeFunctionDefinitions: vi.fn((functions) => functions || []),
}));

import App from './App';

describe('deploy and invoke integration flow', () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    window.localStorage.clear();

    mockConnectWallet.mockResolvedValue('GTESTPUBLICKEY123');

    mockCompileContract.mockResolvedValue({
      status: 'success',
      wasm: new Uint8Array([0, 97, 115, 109]),
    });

    mockDeployContract.mockResolvedValue({
      contractId: 'CCONTRACT123',
      wasmHash: 'abc123',
      deployTxHash: 'tx-deploy-1',
    });

    mockInvokeContract.mockResolvedValue({
      result: 1,
      transactionHash: 'tx-invoke-1',
    });

    mockGetContractFunctions.mockRejectedValue(new Error('spec unavailable'));

    mockGetContractEvents.mockResolvedValue({
      events: [],
      cursor: null,
      latestLedger: 123,
    });
  });

  it('deploys contract through compile and deploy pipeline', async () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Enter IDE' }));

    fireEvent.click(screen.getByRole('button', { name: /Connect Wallet/i }));
    await waitFor(() => expect(mockConnectWallet).toHaveBeenCalled());

    // Click Deploy tab to enter deploy panel
    fireEvent.click(screen.getByTestId('panel-tab-deploy'));
    
    // Wait for component to be ready and click deploy button
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Deploy to Testnet/i })).not.toBeDisabled();
    });
    fireEvent.click(screen.getByRole('button', { name: /Deploy to Testnet/i }));

    await waitFor(() => {
      expect(mockCompileContract).toHaveBeenCalled();
      expect(mockDeployContract).toHaveBeenCalled();
    });

    expect(await screen.findByText(/CCONTRACT123/i)).toBeInTheDocument();
  });

  it('invokes function after deployment metadata is available', async () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Enter IDE' }));

    fireEvent.click(screen.getByRole('button', { name: /Connect Wallet/i }));
    await waitFor(() => expect(mockConnectWallet).toHaveBeenCalled());

    // Click Deploy tab to enter deploy panel
    fireEvent.click(screen.getByTestId('panel-tab-deploy'));
    
    // Wait for component to be ready and click deploy button
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Deploy to Testnet/i })).not.toBeDisabled();
    });
    fireEvent.click(screen.getByRole('button', { name: /Deploy to Testnet/i }));

    await waitFor(() => {
      expect(mockDeployContract).toHaveBeenCalled();
    });

    // Click Interact tab using data-testid to avoid ambiguity
    fireEvent.click(screen.getByTestId('panel-tab-interact'));
    fireEvent.change(screen.getAllByRole('combobox').at(-1), {
      target: { value: 'increment' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Execute Function/i }));

    await waitFor(() => {
      expect(mockInvokeContract).toHaveBeenCalledWith('CCONTRACT123', 'increment', [], 'GTESTPUBLICKEY123');
    });
  });

  it('shows invoke error state when contract call fails', async () => {
    mockInvokeContract.mockRejectedValueOnce(new Error('Transaction rejected by user'));

    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Enter IDE' }));

    fireEvent.click(screen.getByRole('button', { name: /Connect Wallet/i }));
    await waitFor(() => expect(mockConnectWallet).toHaveBeenCalled());

    // Click Deploy tab to enter deploy panel
    fireEvent.click(screen.getByTestId('panel-tab-deploy'));
    
    // Wait for component to be ready and click deploy button
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Deploy to Testnet/i })).not.toBeDisabled();
    });
    fireEvent.click(screen.getByRole('button', { name: /Deploy to Testnet/i }));

    await waitFor(() => {
      expect(mockDeployContract).toHaveBeenCalled();
    });

    // Click Interact tab using data-testid to avoid ambiguity
    fireEvent.click(screen.getByTestId('panel-tab-interact'));
    fireEvent.change(screen.getAllByRole('combobox').at(-1), {
      target: { value: 'increment' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Execute Function/i }));

    expect(await screen.findByText(/Transaction rejected by user/i)).toBeInTheDocument();
  });

  it('shows error state when RPC times out during contract invocation', async () => {
    mockInvokeContract.mockRejectedValueOnce(new Error('Transaction confirmation timeout'));

    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Enter IDE' }));

    fireEvent.click(screen.getByRole('button', { name: /Connect Wallet/i }));
    await waitFor(() => expect(mockConnectWallet).toHaveBeenCalled());

    // Click Deploy tab to enter deploy panel
    fireEvent.click(screen.getByTestId('panel-tab-deploy'));
    
    // Wait for component to be ready and click deploy button
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Deploy to Testnet/i })).not.toBeDisabled();
    });
    fireEvent.click(screen.getByRole('button', { name: /Deploy to Testnet/i }));

    await waitFor(() => {
      expect(mockDeployContract).toHaveBeenCalled();
    });

    // Click Interact tab using data-testid to avoid ambiguity
    fireEvent.click(screen.getByTestId('panel-tab-interact'));
    fireEvent.change(screen.getAllByRole('combobox').at(-1), {
      target: { value: 'increment' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Execute Function/i }));

    // The UI must surface the timeout error — not silently swallow it.
    expect(await screen.findByText(/Transaction confirmation timeout/i)).toBeInTheDocument();
    // Invoke must have been attempted exactly once (no silent retry).
    expect(mockInvokeContract).toHaveBeenCalledTimes(1);
  });
});
