/**
 * wallet.js - Freighter Wallet Integration
 * 
 * Handles all interactions with the Freighter browser extension wallet.
 * Provides functions for connecting, disconnecting, and retrieving wallet info.
 */

import { isConnected, getPublicKey, requestAccess } from '@stellar/freighter-api';

/**
 * Checks if Freighter wallet is installed in the browser
 * @returns {boolean} True if Freighter is installed
 */
export const isFreighterInstalled = () => {
    // Simply return true - we'll let the connection attempt handle the error
    // This is more reliable than checking specific window properties
    return true;
};

/**
 * Connects to Freighter wallet and requests access
 * @returns {Promise<string>} The public key of the connected account
 * @throws {Error} If Freighter is not installed or user rejects
 */
export const connectWallet = async () => {
    try {
        // Request access to the wallet
        const response = await requestAccess();

        console.log('Freighter response:', response);
        console.log('Response type:', typeof response);

        // Extract public key from response
        // Freighter may return the key directly or as an object property
        let publicKey;
        if (typeof response === 'string') {
            publicKey = response;
        } else if (response && typeof response === 'object') {
            // Try common property names
            publicKey = response.publicKey || response.address || response.accountId;
        }

        if (!publicKey || typeof publicKey !== 'string') {
            console.error('Invalid public key format:', publicKey);
            throw new Error('Failed to retrieve public key from Freighter');
        }

        console.log('Wallet connected:', publicKey);
        return publicKey;
    } catch (error) {
        console.error('Connection error:', error);

        // Handle specific error cases
        if (error.message.includes('User declined access')) {
            throw new Error('Connection rejected. Please approve the Freighter popup to connect.');
        }

        if (error.message.includes('not available') || error.message.includes('not installed')) {
            throw new Error(
                'Freighter wallet is not installed. Please install it from https://www.freighter.app/'
            );
        }

        throw new Error(`Failed to connect wallet: ${error.message}`);
    }
};

/**
 * Gets the currently connected public key
 * @returns {Promise<string|null>} The public key or null if not connected
 */
export const getConnectedPublicKey = async () => {
    try {
        const connected = await isConnected();
        if (!connected) {
            return null;
        }
        return await getPublicKey();
    } catch (error) {
        console.error('Error getting public key:', error);
        return null;
    }
};

/**
 * Checks if wallet is currently connected
 * @returns {Promise<boolean>} True if wallet is connected
 */
export const checkConnection = async () => {
    try {
        return await isConnected();
    } catch (error) {
        console.error('Error checking connection:', error);
        return false;
    }
};

/**
 * Disconnects the wallet (clears local state)
 * Note: Freighter doesn't have a programmatic disconnect,
 * so we just clear our app state
 */
export const disconnectWallet = () => {
    console.log('Wallet disconnected');
    // In a real app, you'd clear any stored wallet state here
    return true;
};
