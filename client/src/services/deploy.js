/**
 * deploy.js - Soroban Contract Deployment Service
 * 
 * Handles deployment of Soroban smart contracts to Stellar Testnet
 * Includes WASM upload, contract installation, and instance creation
 */

import * as StellarSdk from '@stellar/stellar-sdk';
import { Server as SorobanServer } from '@stellar/stellar-sdk/rpc';
import { signTransaction } from './wallet';
import { getExplorerTxUrl, getHorizonUrl, getSorobanRpcUrl } from './endpoints';

// Soroban RPC Server for Testnet
const sorobanServer = new SorobanServer(getSorobanRpcUrl());

// Horizon server for account loading
const horizonServer = new StellarSdk.Horizon.Server(getHorizonUrl());

// Network configuration
const NETWORK_PASSPHRASE = StellarSdk.Networks.TESTNET;

/**
 * Check whether a simulation response is an error across SDK versions.
 *
 * @param {any} simulateResponse
 * @returns {boolean}
 */
function isSimulationErrorResponse(simulateResponse) {
    const checker =
        SorobanServer?.Api?.isSimulationError ||
        StellarSdk?.SorobanRpc?.Api?.isSimulationError ||
        StellarSdk?.rpc?.Api?.isSimulationError;

    if (typeof checker === 'function') {
        return checker(simulateResponse);
    }

    return !!(simulateResponse && typeof simulateResponse === 'object' && simulateResponse.error);
}

/**
 * Assemble and normalize a transaction with simulation data across SDK versions.
 *
 * @param {import('@stellar/stellar-sdk').Transaction} transaction
 * @param {any} simulateResponse
 * @returns {Promise<import('@stellar/stellar-sdk').Transaction>}
 */
async function assembleTransactionCompat(transaction, simulateResponse) {
    const assembleFn =
        StellarSdk?.SorobanRpc?.assembleTransaction ||
        StellarSdk?.rpc?.assembleTransaction;

    let preparedTransaction;

    if (typeof assembleFn === 'function') {
        preparedTransaction = assembleFn(transaction, simulateResponse);
    } else if (typeof sorobanServer?.prepareTransaction === 'function') {
        preparedTransaction = sorobanServer.prepareTransaction(transaction);
    } else {
        throw new Error('Soroban transaction assembly is not available in the installed stellar-sdk version.');
    }

    if (preparedTransaction && typeof preparedTransaction.then === 'function') {
        preparedTransaction = await preparedTransaction;
    }

    // Some SDK variants return a TransactionBuilder from assembleTransaction.
    if (preparedTransaction && typeof preparedTransaction.build === 'function') {
        preparedTransaction = preparedTransaction.build();
    }

    if (!preparedTransaction || typeof preparedTransaction.toXDR !== 'function') {
        throw new Error('Failed to prepare transaction in a signable format.');
    }

    return preparedTransaction;
}

/**
 * Normalize a loose type label for UI and argument conversion.
 *
 * @param {string} typeLabel
 * @returns {string}
 */
function normalizeTypeLabel(typeLabel) {
    if (!typeLabel || typeof typeLabel !== 'string') {
        return 'unknown';
    }

    return typeLabel.trim();
}

/**
 * Normalize function parameter metadata shape.
 *
 * @param {any} param
 * @param {number} index
 * @returns {{name: string, type: string, label: string}}
 */
function normalizeFunctionParam(param, index) {
    if (typeof param === 'string') {
        const parts = param.split(':');
        const name = (parts[0] || `arg${index + 1}`).trim();
        const type = normalizeTypeLabel(parts.slice(1).join(':') || 'unknown');
        return {
            name,
            type,
            label: `${name}: ${type}`,
        };
    }

    if (param && typeof param === 'object') {
        const name = typeof param.name === 'string' && param.name
            ? param.name.trim()
            : `arg${index + 1}`;
        const type = normalizeTypeLabel(param.type || 'unknown');
        const label = typeof param.label === 'string' && param.label
            ? param.label
            : `${name}: ${type}`;

        return {
            name,
            type,
            label,
        };
    }

    return {
        name: `arg${index + 1}`,
        type: 'unknown',
        label: `arg${index + 1}: unknown`,
    };
}

/**
 * Normalize contract function metadata into a single shape used by the UI.
 *
 * @param {any[]} functions
 * @returns {Array<{name: string, params: Array<{name: string, type: string, label: string}>, returns: string, description: string}>}
 */
export function normalizeFunctionDefinitions(functions) {
    if (!Array.isArray(functions)) {
        return [];
    }

    return functions
        .map((fn, fnIndex) => {
            const name = typeof fn?.name === 'string' && fn.name ? fn.name : `function_${fnIndex + 1}`;
            const params = Array.isArray(fn?.params)
                ? fn.params.map((param, paramIndex) => normalizeFunctionParam(param, paramIndex))
                : [];

            return {
                name,
                params,
                returns: normalizeTypeLabel(fn?.returns || 'void'),
                description: typeof fn?.description === 'string' ? fn.description : '',
            };
        })
        .filter((fn) => !!fn.name);
}

/**
 * Explicit enum map from XDR discriminant name → readable type label.
 * This avoids fragile string manipulation and handles all Soroban primitives.
 * Complex nested UDTs (Vec, Map, Struct, Enum, Tuple) fall back to a safe
 * lower-cased strip — this is acceptable at Yellow/Orange belt level.
 */
const SPEC_TYPE_MAP = {
    scSpecTypeU32: 'u32',
    scSpecTypeI32: 'i32',
    scSpecTypeU64: 'u64',
    scSpecTypeI64: 'i64',
    scSpecTypeU128: 'u128',
    scSpecTypeI128: 'i128',
    scSpecTypeU256: 'u256',
    scSpecTypeI256: 'i256',
    scSpecTypeBool: 'bool',
    scSpecTypeVoid: 'void',
    scSpecTypeError: 'error',
    scSpecTypeBytes: 'bytes',
    scSpecTypeString: 'string',
    scSpecTypeSymbol: 'symbol',
    scSpecTypeAddress: 'address',
    scSpecTypeBytesN: 'bytesN',
    scSpecTypeOption: 'option',
    scSpecTypeResult: 'result',
    scSpecTypeVec: 'vec',
    scSpecTypeMap: 'map',
    scSpecTypeTuple: 'tuple',
    scSpecTypeUdt: 'udt',
};

/**
 * Convert XDR spec type to a readable label for the interaction panel.
 *
 * @param {any} typeDef
 * @returns {string}
 */
function specTypeToLabel(typeDef) {
    try {
        const switchValue = typeDef?.switch?.();
        const switchName = switchValue?.name || switchValue?.toString?.() || '';

        if (!switchName) {
            return 'unknown';
        }

        // Fast-path: exact match in the enum map.
        if (SPEC_TYPE_MAP[switchName]) {
            return SPEC_TYPE_MAP[switchName];
        }

        // Fallback: strip the "scSpecType" prefix for any future/unmapped types.
        const stripped = switchName.replace(/^scSpecType/, '');
        return stripped && stripped !== switchName ? stripped.toLowerCase() : 'unknown';
    } catch {
        return 'unknown';
    }
}

/**
 * Deploy a Soroban contract from WASM binary
 * 
 * @param {Uint8Array} wasmBuffer - Compiled WASM binary
 * @param {string} sourcePublicKey - Deployer's public key
 * @returns {Promise<{contractId: string, wasmHash: string, transactionHash: string}>}
 */
export async function deployContract(wasmBuffer, sourcePublicKey) {
    try {
        console.log('Starting contract deployment...');
        console.log('WASM size:', wasmBuffer.length, 'bytes');

        // Step 1: Upload WASM code
        console.log('Step 1: Uploading WASM to network...');
        const uploadResult = await uploadContractWasm(wasmBuffer, sourcePublicKey);
        console.log('WASM uploaded, hash:', uploadResult.wasmHash);

        // Step 2: Deploy contract instance
        console.log('Step 2: Deploying contract instance...');
        const deployResult = await deployContractInstance(uploadResult.wasmHash, sourcePublicKey);
        console.log('Contract deployed, ID:', deployResult.contractId);

        return {
            contractId: deployResult.contractId,
            wasmHash: uploadResult.wasmHash,
            uploadTxHash: uploadResult.transactionHash,
            deployTxHash: deployResult.transactionHash,
        };

    } catch (error) {
        console.error('Deployment error:', error);
        throw new Error(`Contract deployment failed: ${error.message}`);
    }
}

/**
 * Upload WASM code to the network
 * 
 * @param {Uint8Array} wasmBuffer - WASM binary
 * @param {string} sourcePublicKey - Source account public key
 * @returns {Promise<{wasmHash: string, transactionHash: string}>}
 */
async function uploadContractWasm(wasmBuffer, sourcePublicKey) {
    try {
        // Load source account
        const sourceAccount = await horizonServer.loadAccount(sourcePublicKey);

        // Create upload contract operation
        const operation = StellarSdk.Operation.uploadContractWasm({
            wasm: wasmBuffer,
        });

        // Build transaction
        const transaction = new StellarSdk.TransactionBuilder(sourceAccount, {
            fee: StellarSdk.BASE_FEE,
            networkPassphrase: NETWORK_PASSPHRASE,
        })
            .addOperation(operation)
            .setTimeout(30)
            .build();

        // Simulate first to get resource requirements
        console.log('Simulating upload transaction...');
        const simulateResponse = await sorobanServer.simulateTransaction(transaction);

        if (isSimulationErrorResponse(simulateResponse)) {
            throw new Error(`Simulation failed: ${simulateResponse.error}`);
        }

        // Prepare transaction with simulation results
        const preparedTransaction = await assembleTransactionCompat(
            transaction,
            simulateResponse
        );

        // Sign with Freighter
        console.log('Requesting signature from wallet...');
        const signedXdr = await signTransaction(preparedTransaction.toXDR(), NETWORK_PASSPHRASE);

        // Extract signed XDR
        const signedTxXdr = signedXdr.signedTxXdr || signedXdr;
        const signedTx = StellarSdk.TransactionBuilder.fromXDR(signedTxXdr, NETWORK_PASSPHRASE);

        // Submit transaction
        console.log('Submitting upload transaction...');
        const sendResponse = await sorobanServer.sendTransaction(signedTx);

        // Wait for confirmation
        console.log('Waiting for transaction confirmation...');
        const result = await waitForTransaction(sendResponse.hash);

        if (result.status !== 'SUCCESS') {
            throw new Error(`Upload failed: ${result.status}`);
        }

        // Calculate WASM hash
        const wasmHash = StellarSdk.hash(wasmBuffer);
        const wasmHashHex = wasmHash.toString('hex');

        return {
            wasmHash: wasmHashHex,
            transactionHash: sendResponse.hash,
        };

    } catch (error) {
        if (error.message?.includes('User declined')) {
            throw new Error('Transaction rejected by user');
        }
        throw error;
    }
}

/**
 * Deploy a contract instance from uploaded WASM
 * 
 * @param {string} wasmHash - Hash of uploaded WASM
 * @param {string} sourcePublicKey - Source account public key
 * @returns {Promise<{contractId: string, transactionHash: string}>}
 */
async function deployContractInstance(wasmHash, sourcePublicKey) {
    try {
        // Load source account
        const sourceAccount = await horizonServer.loadAccount(sourcePublicKey);

        // Create deploy contract operation
        const operation = StellarSdk.Operation.createCustomContract({
            wasmHash: hexToUint8Array(wasmHash),
            address: new StellarSdk.Address(sourcePublicKey),
        });

        // Build transaction
        const transaction = new StellarSdk.TransactionBuilder(sourceAccount, {
            fee: StellarSdk.BASE_FEE,
            networkPassphrase: NETWORK_PASSPHRASE,
        })
            .addOperation(operation)
            .setTimeout(30)
            .build();

        // Simulate transaction
        console.log('Simulating deploy transaction...');
        const simulateResponse = await sorobanServer.simulateTransaction(transaction);

        if (isSimulationErrorResponse(simulateResponse)) {
            throw new Error(`Simulation failed: ${simulateResponse.error}`);
        }

        // Prepare transaction
        const preparedTransaction = await assembleTransactionCompat(
            transaction,
            simulateResponse
        );

        // Sign with Freighter
        console.log('Requesting signature from wallet...');
        const signedXdr = await signTransaction(preparedTransaction.toXDR(), NETWORK_PASSPHRASE);

        // Extract signed XDR
        const signedTxXdr = signedXdr.signedTxXdr || signedXdr;
        const signedTx = StellarSdk.TransactionBuilder.fromXDR(signedTxXdr, NETWORK_PASSPHRASE);

        // Submit transaction
        console.log('Submitting deploy transaction...');
        const sendResponse = await sorobanServer.sendTransaction(signedTx);

        // Wait for confirmation
        console.log('Waiting for transaction confirmation...');
        const result = await waitForTransaction(sendResponse.hash);

        if (result.status !== 'SUCCESS') {
            throw new Error(`Deploy failed: ${result.status}`);
        }

        // Extract contract ID from result
        const contractId = extractContractId(result);

        return {
            contractId,
            transactionHash: sendResponse.hash,
        };

    } catch (error) {
        if (error.message?.includes('User declined')) {
            throw new Error('Transaction rejected by user');
        }
        throw error;
    }
}

/**
 * Wait for transaction to be confirmed on the network
 * 
 * @param {string} hash - Transaction hash
 * @returns {Promise<object>} Transaction result
 */
async function waitForTransaction(hash) {
    const maxAttempts = 30; // 30 seconds timeout
    let attempts = 0;

    while (attempts < maxAttempts) {
        try {
            const txResult = await sorobanServer.getTransaction(hash);

            if (txResult.status === 'NOT_FOUND') {
                // Transaction not yet processed
                await new Promise(resolve => setTimeout(resolve, 1000));
                attempts++;
                continue;
            }

            return txResult;

        } catch (err) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            attempts++;
        }
    }

    throw new Error('Transaction confirmation timeout');
}

/**
 * Extract contract ID from deployment result
 * 
 * @param {object} result - Transaction result
 * @returns {string} Contract ID
 */
function extractContractId(result) {
    try {
        // The contract ID is in the transaction result
        const returnValue = result.returnValue;
        
        if (returnValue) {
            const contractAddress = StellarSdk.Address.fromScVal(returnValue);
            return contractAddress.toString();
        }

        throw new Error('Contract ID not found in result');

    } catch (error) {
        throw new Error(`Failed to extract contract ID: ${error.message}`);
    }
}

/**
 * Get contract specification and available functions
 * 
 * @param {string} contractId - Contract ID
 * @returns {Promise<Array>} List of contract functions
 */
export async function getContractFunctions(contractId) {
    try {
        console.log('Fetching contract spec for:', contractId);

        if (!contractId || typeof contractId !== 'string') {
            throw new Error('contractId is required');
        }

        const wasmBytes = await sorobanServer.getContractWasmByContractId(contractId);
        const spec = StellarSdk.contract.Spec.fromWasm(wasmBytes);

        const discoveredFunctions = spec.funcs()
            .map((fn) => {
                const name = fn?.name?.()?.toString?.() || fn?.name?.toString?.() || '';
                if (!name || name.startsWith('__')) {
                    return null;
                }

                const inputs = Array.isArray(fn?.inputs?.()) ? fn.inputs() : [];
                const outputs = Array.isArray(fn?.outputs?.()) ? fn.outputs() : [];

                const params = inputs.map((input, index) => {
                    const inputName = input?.name?.()?.toString?.() || input?.name?.toString?.() || `arg${index + 1}`;
                    const inputType = specTypeToLabel(input?.type?.());

                    return {
                        name: inputName,
                        type: inputType,
                        label: `${inputName}: ${inputType}`,
                    };
                });

                const outputLabels = outputs.map((output) => specTypeToLabel(output));
                const returns = outputLabels.length === 0
                    ? 'void'
                    : outputLabels.length === 1
                        ? outputLabels[0]
                        : `(${outputLabels.join(', ')})`;

                const description = fn?.doc ? String(fn.doc()) : '';

                return {
                    name,
                    params,
                    returns,
                    description,
                };
            })
            .filter(Boolean);

        return normalizeFunctionDefinitions(discoveredFunctions);

    } catch (error) {
        console.error('Error fetching contract functions:', error);
        throw new Error(`Failed to get contract functions: ${error.message}`);
    }
}

/**
 * Invoke a contract function
 * 
 * @param {string} contractId - Contract ID
 * @param {string} functionName - Function to call
 * @param {Array} args - Function arguments
 * @param {string} sourcePublicKey - Caller's public key
 * @returns {Promise<{result: any, transactionHash: string}>}
 */
export async function invokeContract(contractId, functionName, args, sourcePublicKey) {
    try {
        console.log('Invoking contract function:', functionName);

        // Load source account
        const sourceAccount = await horizonServer.loadAccount(sourcePublicKey);

        // Create contract instance
        const contract = new StellarSdk.Contract(contractId);

        // Build contract call operation
        const operation = contract.call(functionName, ...args);

        // Build transaction
        const transaction = new StellarSdk.TransactionBuilder(sourceAccount, {
            fee: StellarSdk.BASE_FEE,
            networkPassphrase: NETWORK_PASSPHRASE,
        })
            .addOperation(operation)
            .setTimeout(30)
            .build();

        // Simulate transaction
        console.log('Simulating contract call...');
        const simulateResponse = await sorobanServer.simulateTransaction(transaction);

        if (isSimulationErrorResponse(simulateResponse)) {
            throw new Error(`Simulation failed: ${simulateResponse.error}`);
        }

        // Prepare transaction
        const preparedTransaction = await assembleTransactionCompat(
            transaction,
            simulateResponse
        );

        // Sign with Freighter
        console.log('Requesting signature from wallet...');
        const signedXdr = await signTransaction(preparedTransaction.toXDR(), NETWORK_PASSPHRASE);

        // Extract signed XDR
        const signedTxXdr = signedXdr.signedTxXdr || signedXdr;
        const signedTx = StellarSdk.TransactionBuilder.fromXDR(signedTxXdr, NETWORK_PASSPHRASE);

        // Submit transaction
        console.log('Submitting contract call...');
        const sendResponse = await sorobanServer.sendTransaction(signedTx);

        // Wait for confirmation
        console.log('Waiting for transaction confirmation...');
        const result = await waitForTransaction(sendResponse.hash);

        if (result.status !== 'SUCCESS') {
            throw new Error(`Contract call failed: ${result.status}`);
        }

        // Parse result
        const returnValue = result.returnValue;
        const parsedResult = returnValue ? StellarSdk.scValToNative(returnValue) : null;

        return {
            result: parsedResult,
            transactionHash: sendResponse.hash,
        };

    } catch (error) {
        if (error.message?.includes('User declined')) {
            throw new Error('Transaction rejected by user');
        }
        throw error;
    }
}

/**
 * Convert ScVal to native JS value without throwing.
 *
 * @param {import('@stellar/stellar-sdk').xdr.ScVal} scVal
 * @returns {any}
 */
function scValToNativeSafe(scVal) {
    try {
        return StellarSdk.scValToNative(scVal);
    } catch {
        return null;
    }
}

/**
 * Normalize Soroban event response into UI-friendly shape.
 *
 * @param {object} eventResponse
 * @returns {object}
 */
export function normalizeContractEvent(eventResponse) {
    const contractId = eventResponse.contractId?.toString?.() || eventResponse.contractId || null;

    return {
        id: eventResponse.id,
        type: eventResponse.type,
        contractId,
        ledger: eventResponse.ledger,
        ledgerClosedAt: eventResponse.ledgerClosedAt,
        txHash: eventResponse.txHash,
        topicNative: Array.isArray(eventResponse.topic)
            ? eventResponse.topic.map((topicVal) => scValToNativeSafe(topicVal))
            : [],
        valueNative: scValToNativeSafe(eventResponse.value),
    };
}

/**
 * Fetch contract events with cursor-based pagination.
 *
 * @param {string} contractId
 * @param {{cursor?: string|null, limit?: number}} options
 * @returns {Promise<{events: object[], cursor: string, latestLedger: number}>}
 */
export async function getContractEvents(contractId, { cursor = null, limit = 20 } = {}) {
    if (!contractId) {
        throw new Error('contractId is required to fetch events');
    }

    const filters = [{ type: 'contract', contractIds: [contractId] }];
    let request;

    if (cursor) {
        request = { filters, cursor, limit };
    } else {
        const latestLedger = await sorobanServer.getLatestLedger();
        const sequence = latestLedger?.sequence || 1;
        const startLedger = Math.max(1, sequence - 200);
        request = { filters, startLedger, limit };
    }

    const response = await sorobanServer.getEvents(request);
    return {
        events: (response.events || []).map(normalizeContractEvent),
        cursor: response.cursor,
        latestLedger: response.latestLedger,
    };
}

/**
 * Get Stellar Explorer URL for a transaction
 * 
 * @param {string} hash - Transaction hash
 * @returns {string} URL to view transaction
 */
export function getExplorerUrl(hash) {
    return getExplorerTxUrl(hash);
}

/**
 * Convert hex string to Uint8Array
 * 
 * @param {string} hex - Hex string
 * @returns {Uint8Array} Byte array
 */
function hexToUint8Array(hex) {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
        bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
    }
    return bytes;
}
