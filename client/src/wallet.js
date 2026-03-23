/**
 * wallet.js - Multi-Wallet Integration
 * 
 * Supports multiple Stellar wallets using stellar-wallet-kit adapters.
 * Freighter remains the default path for reliability.
 */

import { isConnected, getPublicKey, requestAccess, signTransaction as freighterSign } from '@stellar/freighter-api';

let currentPublicKey = null;
let connectedWalletId = 'freighter';
let connectedAdapter = null;
let walletKitAdaptersPromise = null;

const WALLETCONNECT_PROJECT_ID = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || '';

async function getWalletKitAdapters() {
    if (!walletKitAdaptersPromise) {
        walletKitAdaptersPromise = import('stellar-wallet-kit')
            .then((mod) => mod.createWalletAdapters({ walletConnectProjectId: WALLETCONNECT_PROJECT_ID }))
            .catch(() => ({}));
    }

    return walletKitAdaptersPromise;
}

/**
 * Error types for wallet operations (Yellow Belt Requirement)
 */
export const WalletErrorType = {
    NOT_INSTALLED: 'WALLET_NOT_INSTALLED',
    USER_REJECTED: 'USER_REJECTED',
    INSUFFICIENT_BALANCE: 'INSUFFICIENT_BALANCE',
    NETWORK_ERROR: 'NETWORK_ERROR',
    UNKNOWN: 'UNKNOWN_ERROR',
};

/**
 * Gets available wallet options
 * @returns {Array} List of supported wallets with their info
 */
export const getAvailableWallets = () => {
    return [
        {
            id: 'freighter',
            name: 'Freighter',
            icon: '🔐',
            url: 'https://www.freighter.app/',
        },
        {
            id: 'albedo',
            name: 'Albedo',
            icon: '⚡',
            url: 'https://albedo.link/',
        },
        {
            id: 'walletconnect',
            name: 'WalletConnect',
            icon: '📱',
            url: 'https://walletconnect.com/',
        },
        {
            id: 'lobstr',
            name: 'LOBSTR',
            icon: '⭐',
            url: 'https://lobstr.co/',
        },
        {
            id: 'xbull',
            name: 'xBull',
            icon: '🐂',
            url: 'https://xbull.app/',
        },
        {
            id: 'rabet',
            name: 'Rabet',
            icon: '🦊',
            url: 'https://rabet.io/',
        },
    ];
};

/**
 * Connects to wallet (currently Freighter, extensible for others)
 * @param {string} walletId - ID of the wallet to connect
 * @returns {Promise<string>} The public key of the connected account
 * @throws {Error} With specific error type
 */
export const connectWallet = async (walletId = 'freighter') => {
    try {
        console.log('Connecting to wallet:', walletId);

        if (walletId === 'xbull' || walletId === 'rabet') {
            const error = new Error(`${walletId} integration coming soon! Please use Freighter, Albedo, WalletConnect, or LOBSTR.`);
            error.type = WalletErrorType.NOT_INSTALLED;
            throw error;
        }

        connectedAdapter = null;

        if (walletId !== 'freighter') {
            const adapters = await getWalletKitAdapters();
            const adapter = adapters?.[walletId];

            if (!adapter) {
                const error = new Error(`${walletId} adapter is unavailable in this build.`);
                error.type = WalletErrorType.NOT_INSTALLED;
                throw error;
            }

            const available = await adapter.isAvailable();
            if (!available && walletId !== 'albedo') {
                const error = new Error(`${walletId} wallet not available on this device/browser.`);
                error.type = WalletErrorType.NOT_INSTALLED;
                throw error;
            }

            const response = await adapter.connect();
            const publicKey = response?.publicKey || response?.address;

            if (!publicKey || typeof publicKey !== 'string') {
                const error = new Error('Failed to retrieve public key from wallet');
                error.type = WalletErrorType.UNKNOWN;
                throw error;
            }

            currentPublicKey = publicKey;
            connectedWalletId = walletId;
            connectedAdapter = adapter;

            console.log('Wallet connected successfully:', publicKey);
            return publicKey;
        }

        // Request access to Freighter
        console.log('Requesting access to Freighter...');
        const response = await requestAccess();
        console.log('Freighter response:', response);

        let publicKey;
        if (typeof response === 'string') {
            publicKey = response;
        } else if (response && typeof response === 'object') {
            publicKey = response.publicKey || response.address || response.accountId;
        }

        if (!publicKey || typeof publicKey !== 'string') {
            const error = new Error('Failed to retrieve public key from wallet');
            error.type = WalletErrorType.UNKNOWN;
            throw error;
        }

        currentPublicKey = publicKey;
        connectedWalletId = walletId;
        connectedAdapter = null;

        console.log('Wallet connected successfully:', publicKey);
        return publicKey;
    } catch (error) {
        console.error('Connection error:', error);

        // Categorize error types (Yellow Belt Requirement: 3+ error types)
        if (error.type) {
            throw error;
        }
        
        if (error.message?.includes('User declined') || 
            error.message?.includes('rejected') ||
            error.message?.includes('User canceled')) {
            const err = new Error('Connection rejected. Please approve the wallet popup to connect.');
            err.type = WalletErrorType.USER_REJECTED;
            throw err;
        }

        if (error.message?.includes('not installed') || 
            error.message?.includes('not available') ||
            error.message?.includes('not found')) {
            const err = new Error('Wallet not installed. Please install Freighter from https://www.freighter.app/');
            err.type = WalletErrorType.NOT_INSTALLED;
            throw err;
        }

        const err = new Error(`Failed to connect wallet: ${error.message}`);
        err.type = WalletErrorType.UNKNOWN;
        throw err;
    }
};

/**
 * Signs a transaction using the connected wallet
 * @param {string} xdr - Transaction XDR to sign
 * @param {string} networkPassphrase - Network passphrase
 * @returns {Promise<string>} Signed transaction XDR
 * @throws {Error} With specific error type
 */
export const signTransaction = async (xdr, networkPassphrase) => {
    try {
        if (!currentPublicKey) {
            const error = new Error('Wallet not connected');
            error.type = WalletErrorType.UNKNOWN;
            throw error;
        }

        console.log('Requesting transaction signature...');

        let signedResponse;

        if (connectedWalletId !== 'freighter' && connectedAdapter) {
            signedResponse = await connectedAdapter.signTransaction(xdr, {
                network: 'TESTNET',
                networkPassphrase,
                accountToSign: currentPublicKey,
            });
        } else {
            signedResponse = await freighterSign(xdr, {
                network: 'TESTNET',
                networkPassphrase,
                accountToSign: currentPublicKey,
            });
        }

        const signedXdr = signedResponse.signedTxXdr || signedResponse;

        console.log('Transaction signed successfully');
        return signedXdr;
    } catch (error) {
        console.error('Signing error:', error);

        // Error categorization (Yellow Belt Requirement)
        if (error.message?.includes('User declined') || 
            error.message?.includes('rejected')) {
            const err = new Error('Transaction rejected. You declined to sign the transaction.');
            err.type = WalletErrorType.USER_REJECTED;
            throw err;
        }

        if (error.message?.includes('insufficient') || 
            error.message?.includes('underfunded')) {
            const err = new Error('Insufficient balance to complete this transaction.');
            err.type = WalletErrorType.INSUFFICIENT_BALANCE;
            throw err;
        }

        if (error.type) {
            throw error;
        }

        const err = new Error(`Failed to sign transaction: ${error.message}`);
        err.type = WalletErrorType.UNKNOWN;
        throw err;
    }
};

/**
 * Gets the currently connected public key
 * @returns {string|null} The public key or null if not connected
 */
export const getConnectedPublicKey = () => {
    return currentPublicKey;
};

/**
 * Gets the ID of the currently connected wallet
 * @returns {string|null} Wallet ID or null if not connected
 */
export const getConnectedWalletId = () => {
    return connectedWalletId;
};

/**
 * Checks if a wallet is currently connected
 * @returns {boolean} True if wallet is connected
 */
export const checkConnection = async () => {
    try {
        if (connectedWalletId !== 'freighter' && connectedAdapter) {
            const pubKey = await connectedAdapter.getPublicKey();
            if (pubKey) {
                currentPublicKey = pubKey;
                return true;
            }
        }

        const connected = await isConnected();
        if (connected) {
            const pubKey = await getPublicKey();
            if (pubKey) {
                currentPublicKey = pubKey;
                connectedWalletId = 'freighter';
                connectedAdapter = null;
                return true;
            }
        }
        return false;
    } catch (error) {
        console.error('Error checking connection:', error);
        return false;
    }
};

/**
 * Disconnects the wallet (clears local state)
 * Note: This clears the app state. The wallet extension itself remains active.
 */
export const disconnectWallet = () => {
    console.log('Wallet disconnected');
    currentPublicKey = null;
    connectedWalletId = null;
    connectedAdapter = null;
    return true;
};

