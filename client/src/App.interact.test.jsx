import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mockGetContractFunctions = vi.fn();
const mockGetContractEvents = vi.fn();
const mockInvokeContract = vi.fn();

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
  connectWallet: vi.fn(),
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
  compileContract: vi.fn(),
  CompilationStatus: {
    SUCCESS: 'success',
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
  deployContract: vi.fn(),
  getContractEvents: (...args) => mockGetContractEvents(...args),
  getContractFunctions: (...args) => mockGetContractFunctions(...args),
  invokeContract: (...args) => mockInvokeContract(...args),
  getExplorerUrl: vi.fn((hash) => `https://stellar.expert/explorer/testnet/tx/${hash}`),
  normalizeFunctionDefinitions: vi.fn((functions) => functions || []),
}));

import App from './App';

describe('Interact panel function discovery', () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    window.localStorage.clear();

    window.localStorage.setItem(
      'orbital_deployed_contract',
      JSON.stringify({
        id: 'CCONTRACT123',
        name: 'Counter',
        deployedAt: '2026-03-23T00:00:00.000Z',
      })
    );
    window.localStorage.setItem('orbital_transactions', JSON.stringify([]));

    mockGetContractEvents.mockResolvedValue({
      events: [],
      cursor: null,
      latestLedger: 123,
    });

    mockInvokeContract.mockResolvedValue({
      result: { ok: true },
      transactionHash: 'tx123',
    });
  });

  it('uses discovered functions from on-chain spec when available', async () => {
    mockGetContractFunctions.mockResolvedValueOnce([
      {
        name: 'hello',
        params: [{ name: 'to', type: 'Symbol', label: 'to: Symbol' }],
        returns: 'Vec<Symbol>',
        description: 'Hello greeting',
      },
    ]);

    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Enter IDE' }));

    // Wait for deployed contract to be loaded from cache
    await waitFor(() => {
      expect(screen.getByTestId('nav-interact-btn')).not.toHaveAttribute('disabled');
    });
    fireEvent.click(screen.getByTestId('nav-interact-btn'));

    expect(await screen.findByText(/Functions: On-chain spec/i)).toBeInTheDocument();
    expect(await screen.findByRole('option', { name: /hello\(\) → Vec<Symbol>/i })).toBeInTheDocument();

    await waitFor(() => {
      expect(mockGetContractFunctions).toHaveBeenCalledWith('CCONTRACT123');
    });
  });

  it('falls back to example metadata when discovery fails', async () => {
    mockGetContractFunctions.mockRejectedValueOnce(new Error('spec unavailable'));

    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Enter IDE' }));

    // Wait for deployed contract to be loaded from cache
    await waitFor(() => {
      expect(screen.getByTestId('nav-interact-btn')).not.toHaveAttribute('disabled');
    });
    fireEvent.click(screen.getByTestId('nav-interact-btn'));

    expect(await screen.findByText(/Functions: Example metadata fallback/i)).toBeInTheDocument();
    expect(await screen.findByText(/spec unavailable/i)).toBeInTheDocument();
    expect(await screen.findByRole('option', { name: /increment\(\) → i32/i })).toBeInTheDocument();
  });

  it('validates raw call args and blocks execute on invalid JSON', async () => {
    mockGetContractFunctions.mockResolvedValueOnce([]);

    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Enter IDE' }));
    
    // Wait for deployed contract to be loaded from cache
    await waitFor(() => {
      expect(screen.getByTestId('nav-interact-btn')).not.toHaveAttribute('disabled');
    });
    fireEvent.click(screen.getByTestId('nav-interact-btn'));

    fireEvent.click(screen.getByLabelText(/Use Raw Call Mode/i));

    fireEvent.change(screen.getByLabelText(/Function Name/i), {
      target: { value: 'increment' },
    });
    fireEvent.change(screen.getByLabelText(/Raw JSON Args/i), {
      target: { value: '{not-json}' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Execute Raw Call/i }));

    const validationMessages = await screen.findAllByText(/Raw args must be valid JSON array/i);
    expect(validationMessages.length).toBeGreaterThan(0);
    expect(mockInvokeContract).not.toHaveBeenCalled();
  });

  it('executes raw call with valid args', async () => {
    mockGetContractFunctions.mockResolvedValueOnce([]);

    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Enter IDE' }));
    
    // Wait for deployed contract to be loaded from cache
    await waitFor(() => {
      expect(screen.getByTestId('nav-interact-btn')).not.toHaveAttribute('disabled');
    });
    fireEvent.click(screen.getByTestId('nav-interact-btn'));

    fireEvent.click(screen.getByLabelText(/Use Raw Call Mode/i));

    fireEvent.change(screen.getByLabelText(/Function Name/i), {
      target: { value: 'increment' },
    });
    fireEvent.change(screen.getByLabelText(/Raw JSON Args/i), {
      target: { value: '[]' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Execute Raw Call/i }));

    await waitFor(() => {
      expect(mockInvokeContract).toHaveBeenCalled();
    });
    // Check that the result is displayed (the result value is stringified JSON)
    expect(await screen.findByText(/"ok":/i)).toBeInTheDocument();
  });
});
