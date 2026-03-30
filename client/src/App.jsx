import { useState, useEffect, useRef } from 'react';
import './App.css';
import { useEventPolling } from './hooks/useEventPolling';
import Editor from '@monaco-editor/react';
import * as StellarSdk from '@stellar/stellar-sdk';
import {
  Code2,
  Rocket,
  Zap,
  History,
  Bot,
  Lightbulb,
  Bug,
  Sparkles,
  Settings,
  ArrowRight,
  ArrowLeft,
  X,
  Coins,
  Image,
  Package,
  BookOpen,
  Target,
  Link
} from 'lucide-react';
import {
  connectWallet,
  getAvailableWallets,
  getConnectedPublicKey,
  checkConnection
} from './services/wallet';
import { getExamplesList, getExample } from './contracts/examples';
import * as AI from './services/ai';
import * as Compiler from './services/compiler';
import {
  deployContract,
  getContractFunctions,
  invokeContract,
  getExplorerUrl,
  normalizeFunctionDefinitions,
} from './services/deploy';
import { readCachedDeployState, writeCachedDeployState } from './services/cache';
import { EXTERNAL_LINKS, getExplorerContractUrl, getExplorerHomeUrl, getExplorerTxUrl } from './services/endpoints';
import Landing from './Landing';

function App() {
  // App state
  const [showLanding, setShowLanding] = useState(true);

  // Render landing page or IDE
  if (showLanding) {
    return <Landing onEnterIDE={() => setShowLanding(false)} />;
  }

  return <IDE onBackToLanding={() => setShowLanding(true)} />;
}

function IDE({ onBackToLanding }) {
  // Wallet state
  const [publicKey, setPublicKey] = useState('');
  const [selectedWalletId, setSelectedWalletId] = useState('freighter');
  const [loading, setLoading] = useState(false);

  // Editor state
  const [selectedExample, setSelectedExample] = useState('counter');
  const [code, setCode] = useState('');
  const [activePanel, setActivePanel] = useState('editor'); // 'editor' | 'deploy' | 'interact'

  // Contract state
  const [deployedContract, setDeployedContract] = useState(null);
  const [deployStatus, setDeployStatus] = useState(null);
  const [transactions, setTransactions] = useState([]);

  // Interaction state
  const [selectedFunction, setSelectedFunction] = useState(null);
  const [availableFunctions, setAvailableFunctions] = useState([]);
  const [functionParams, setFunctionParams] = useState({});
  const [functionParamErrors, setFunctionParamErrors] = useState({});
  const [rawCallMode, setRawCallMode] = useState(false);
  const [rawFunctionName, setRawFunctionName] = useState('');
  const [rawArgsJson, setRawArgsJson] = useState('[]');
  const [rawCallError, setRawCallError] = useState('');
  const [callResult, setCallResult] = useState(null);
  const [eventSync, setEventSync] = useState({ live: false, lastLedger: null, error: null });
  const [eventCursor, setEventCursor] = useState(null);
  const [functionDiscovery, setFunctionDiscovery] = useState({ loading: false, source: 'example', error: null });

  // AI state
  const [apiKey, setApiKey] = useState('');
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [aiChatMessages, setAiChatMessages] = useState([]);
  const [aiInput, setAiInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiAction, setAiAction] = useState(null); // null | 'explain' | 'debug' | 'improve'
  const [completionSuggestion, setCompletionSuggestion] = useState(null);
  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const eventCursorRef = useRef(null);
  const pollTimerRef = useRef(null);
  const wallets = getAvailableWallets();

  const applyFallbackFunctions = (errorMessage = null) => {
    const exampleFallback = normalizeFunctionDefinitions(getExample(selectedExample)?.functions || []);
    setAvailableFunctions(exampleFallback);
    setSelectedFunction((prev) => exampleFallback.find((fn) => fn.name === prev?.name) || null);
    setFunctionParams({});
    setFunctionParamErrors({});
    setFunctionDiscovery({ loading: false, source: 'example', error: errorMessage });
  };

  const discoverContractFunctions = async (contractId) => {
    if (!contractId) return;

    setFunctionDiscovery({ loading: true, source: 'network', error: null });

    try {
      const discovered = await getContractFunctions(contractId);

      if (discovered.length > 0) {
        setAvailableFunctions(discovered);
        setSelectedFunction((prev) => discovered.find((fn) => fn.name === prev?.name) || null);
        setFunctionParams({});
        setFunctionParamErrors({});
        setFunctionDiscovery({ loading: false, source: 'network', error: null });
        return;
      }

      applyFallbackFunctions('No callable functions were found in contract spec.');
    } catch (error) {
      applyFallbackFunctions(error.message);
    }
  };

  // Restore cached deploy-related UI state.
  useEffect(() => {
    const cached = readCachedDeployState();
    if (cached.deployedContract) {
      setDeployedContract(cached.deployedContract);
    }
    if (Array.isArray(cached.transactions) && cached.transactions.length > 0) {
      setTransactions(cached.transactions);
    }
  }, []);

  // Persist deploy-related state for basic session continuity.
  useEffect(() => {
    writeCachedDeployState({ deployedContract, transactions });
  }, [deployedContract, transactions]);

  useEffect(() => {
    eventCursorRef.current = eventCursor;
  }, [eventCursor]);

  // Live contract event polling — extracted into useEventPolling hook.
  // Deploy + wallet hooks pending extraction.
  useEventPolling({
    deployedContract,
    setEventCursor,
    eventCursorRef,
    setEventSync,
    setTransactions,
    setCallResult,
  });

  // Check for existing wallet connection on mount
  useEffect(() => {
    const checkWalletConnection = async () => {
      try {
        const connected = await checkConnection();
        if (connected) {
          const key = getConnectedPublicKey();
          if (key) {
            setPublicKey(key);
            console.log('Wallet reconnected:', key);
          }
        }
      } catch (error) {
        console.error('Error checking wallet connection:', error);
      }
    };

    checkWalletConnection();
  }, []);

  // Load initial example on mount
  useEffect(() => {
    const example = getExample(selectedExample);
    if (example && example.code) {
      setCode(example.code);
    }

    const fallbackFunctions = normalizeFunctionDefinitions(example?.functions || []);
    setAvailableFunctions(fallbackFunctions);
    setSelectedFunction(null);
    setFunctionParams({});
    setFunctionParamErrors({});
    setRawCallMode(false);
    setRawFunctionName('');
    setRawArgsJson('[]');
    setRawCallError('');
    setFunctionDiscovery({ loading: false, source: 'example', error: null });
  }, [selectedExample]);

  // Discover deployed contract functions from on-chain WASM spec.
  useEffect(() => {
    if (!deployedContract?.id) {
      return;
    }

    discoverContractFunctions(deployedContract.id);
  }, [deployedContract?.id, selectedExample]);

  const handleConnect = async () => {
    try {
      setLoading(true);
      const key = await connectWallet(selectedWalletId);
      setPublicKey(key);
    } catch (error) {
      console.error('Connect error:', error);
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleExampleChange = (exampleId) => {
    setSelectedExample(exampleId);
    const example = getExample(exampleId);
    if (example && example.code) {
      setCode(example.code);
    }
    setSelectedFunction(null);
    setFunctionParamErrors({});
    setRawCallMode(false);
    setRawFunctionName('');
    setRawArgsJson('[]');
    setRawCallError('');
    setCallResult(null);
  };

  const getTypeKind = (typeLabel = '') => {
    const t = String(typeLabel).toLowerCase();

    if (t === 'bool' || t === 'boolean') return 'bool';
    if (t === 'address') return 'address';
    if (t === 'symbol') return 'symbol';
    if (t === 'bytes' || t === 'bytearray') return 'bytes';
    if (t === 'string') return 'string';
    if (t === 'u32' || t === 'i32' || t === 'u64' || t === 'i64' || t === 'u128' || t === 'i128') return 'integer';
    if (t.startsWith('vec<') || t.startsWith('map<') || t.startsWith('tuple<') || t.includes('vec') || t.includes('map') || t.includes('tuple') || t.includes('struct') || t.includes('enum') || t.includes('udt')) return 'json';

    return 'text';
  };

  const validateParamValue = (param, value) => {
    const required = value !== undefined && value !== null ? String(value).trim() : '';
    if (required === '') {
      return 'This parameter is required.';
    }

    const typeKind = getTypeKind(param.type);
    const normalizedType = String(param.type || '').toLowerCase();

    if (typeKind === 'bool') {
      const boolValue = required.toLowerCase();
      if (!['true', 'false', '1', '0'].includes(boolValue)) {
        return 'Use true or false.';
      }
      return null;
    }

    if (typeKind === 'address') {
      try {
        new StellarSdk.Address(required);
      } catch {
        return 'Invalid Stellar address.';
      }
      return null;
    }

    if (typeKind === 'integer') {
      if (!/^-?\d+$/.test(required)) {
        return 'Enter a whole number.';
      }
      if (normalizedType.startsWith('u') && required.startsWith('-')) {
        return 'Unsigned integer must be zero or positive.';
      }
      return null;
    }

    if (typeKind === 'json') {
      try {
        JSON.parse(required);
      } catch {
        return 'Enter valid JSON for this parameter type.';
      }
      return null;
    }

    if (typeKind === 'bytes') {
      try {
        const parsed = JSON.parse(required);
        if (!Array.isArray(parsed) || parsed.some((value) => !Number.isInteger(value) || value < 0 || value > 255)) {
          return 'Bytes input must be JSON array of integers 0-255.';
        }
      } catch {
        return 'Bytes input must be JSON array of integers 0-255.';
      }
      return null;
    }

    return null;
  };

  const validateFunctionArgs = (func, params) => {
    const errors = {};

    (func?.params || []).forEach((param) => {
      const value = params[param.name];
      const maybeError = validateParamValue(param, value);
      if (maybeError) {
        errors[param.name] = maybeError;
      }
    });

    return errors;
  };

  const parseRawArgsToScVals = (jsonInput) => {
    let parsed;

    try {
      parsed = JSON.parse(jsonInput);
    } catch {
      throw new Error('Raw args must be valid JSON array.');
    }

    if (!Array.isArray(parsed)) {
      throw new Error('Raw args must be a JSON array.');
    }

    return parsed.map((arg) => {
      if (arg && typeof arg === 'object' && !Array.isArray(arg) && typeof arg.__type === 'string') {
        const typedValue = arg.value;
        const typedKind = arg.__type.toLowerCase();

        if (typedKind === 'address') {
          return new StellarSdk.Address(String(typedValue)).toScVal();
        }

        if (typedKind === 'symbol') {
          return StellarSdk.nativeToScVal(String(typedValue), { type: 'symbol' });
        }

        if (typedKind === 'string') {
          return StellarSdk.nativeToScVal(String(typedValue), { type: 'string' });
        }

        if (typedKind === 'bool' || typedKind === 'boolean') {
          return StellarSdk.nativeToScVal(Boolean(typedValue));
        }

        if (typedKind === 'bytes' || typedKind === 'bytearray') {
          if (!Array.isArray(typedValue)) {
            throw new Error('Typed bytes value must be an array of numbers.');
          }
          const byteArray = Uint8Array.from(typedValue);
          return StellarSdk.nativeToScVal(byteArray, { type: 'bytes' });
        }

        if (['u32', 'i32', 'u64', 'i64'].includes(typedKind)) {
          const numeric = Number(typedValue);
          if (!Number.isInteger(numeric)) {
            throw new Error(`Typed ${typedKind} value must be an integer.`);
          }
          return StellarSdk.nativeToScVal(numeric, { type: typedKind });
        }

        if (['u128', 'i128'].includes(typedKind)) {
          return StellarSdk.nativeToScVal(BigInt(typedValue), { type: typedKind });
        }

        return StellarSdk.nativeToScVal(typedValue);
      }

      return StellarSdk.nativeToScVal(arg);
    });
  };

  const handleDeploy = async () => {
    if (!publicKey) {
      alert('Please connect your wallet first');
      return;
    }

    try {
      setLoading(true);
      setDeployStatus({ status: 'pending', message: 'Step 1/4: Compiling contract...', progress: 10 });

      // Step 1: Compile Rust to WASM
      console.log('Compiling contract:', selectedExample || 'custom');
      const compilationResult = await Compiler.compileContract(code, selectedExample);

      if (compilationResult.status !== Compiler.CompilationStatus.SUCCESS) {
        throw new Error(compilationResult.error || 'Compilation failed');
      }

      if (!compilationResult.wasm) {
        setDeployStatus({
          status: 'error',
          message: 'Compilation produced no WASM binary.\n\n' +
            'Make sure the compiler service is running:\n' +
            '  cd server && npm start'
        });
        setLoading(false);
        return;
      }

      const wasmSize = compilationResult.wasm.length;
      setDeployStatus({ status: 'pending', message: `Step 2/4: Uploading WASM (${(wasmSize / 1024).toFixed(1)} KB)...`, progress: 35 });

      // Step 2-3: Deploy contract to Stellar
      console.log('Deploying contract to Stellar Testnet...');
      setDeployStatus({ status: 'pending', message: 'Step 3/4: Deploying contract instance...', progress: 60 });
      const deployResult = await deployContract(compilationResult.wasm, publicKey);

      setDeployStatus({ status: 'pending', message: 'Step 4/4: Confirming on network...', progress: 85 });

      const example = selectedExample ? getExample(selectedExample) : null;
      const contractName = (example && example.name) ? example.name : 'Custom Contract';

      setDeployedContract({
        id: deployResult.contractId,
        name: contractName,
        deployedAt: new Date().toISOString(),
        wasmHash: deployResult.wasmHash
      });

      setDeployStatus({
        status: 'success',
        message: 'Contract deployed successfully!',
        contractId: deployResult.contractId,
        progress: 100
      });

      setTransactions([{
        type: 'deploy',
        contractId: deployResult.contractId,
        timestamp: new Date().toISOString(),
        hash: deployResult.deployTxHash,
        explorerUrl: getExplorerUrl(deployResult.deployTxHash)
      }, ...transactions]);

      setActivePanel('interact');
    } catch (error) {
      setDeployStatus({
        status: 'error',
        message: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCallFunction = async () => {
    if (!deployedContract) {
      alert('Please deploy a contract first');
      return;
    }

    try {
      let functionName = '';
      let args = [];

      if (rawCallMode) {
        setFunctionParamErrors({});
        setRawCallError('');

        functionName = rawFunctionName.trim();
        if (!functionName) {
          setRawCallError('Function name is required in raw mode.');
          setCallResult({
            status: 'error',
            message: 'Provide a function name before executing raw call.',
          });
          return;
        }

        try {
          args = parseRawArgsToScVals(rawArgsJson || '[]');
        } catch (error) {
          setRawCallError(error.message);
          setCallResult({
            status: 'error',
            message: error.message,
          });
          return;
        }
      } else {
        if (!selectedFunction) return;

        const validationErrors = validateFunctionArgs(selectedFunction, functionParams);
        setFunctionParamErrors(validationErrors);
        setRawCallError('');

        if (Object.keys(validationErrors).length > 0) {
          setCallResult({
            status: 'error',
            message: 'Fix parameter validation errors before executing.',
          });
          return;
        }

        functionName = selectedFunction.name;
        args = prepareFunctionArgs(selectedFunction, functionParams);
      }

      setLoading(true);
      setCallResult({ status: 'pending', message: 'Calling function...' });

      console.log('Invoking contract function:', functionName, 'with args:', args);

      // Call the contract on-chain
      const result = await invokeContract(
        deployedContract.id,
        functionName,
        args,
        publicKey
      );

      setCallResult({
        status: 'success',
        result: JSON.stringify(result.result, null, 2)
      });

      setTransactions([{
        type: 'invoke',
        function: functionName,
        params: rawCallMode ? { raw: rawArgsJson } : functionParams,
        result: result.result,
        timestamp: new Date().toISOString(),
        hash: result.transactionHash,
        explorerUrl: getExplorerUrl(result.transactionHash)
      }, ...transactions]);

    } catch (error) {
      setCallResult({
        status: 'error',
        message: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  // Helper: Prepare function arguments for Soroban contract calls
  const toScValFromInput = (value, typeLabel) => {
    const normalizedType = (typeLabel || '').toLowerCase();

    if (normalizedType === 'bool' || normalizedType === 'boolean') {
      const boolValue = String(value).trim().toLowerCase();
      return StellarSdk.nativeToScVal(boolValue === 'true' || boolValue === '1');
    }

    if (normalizedType === 'u32' || normalizedType === 'i32') {
      return StellarSdk.nativeToScVal(parseInt(value, 10), { type: normalizedType });
    }

    if (normalizedType === 'u64' || normalizedType === 'i64' || normalizedType === 'u128' || normalizedType === 'i128') {
      return StellarSdk.nativeToScVal(BigInt(value), { type: normalizedType });
    }

    if (normalizedType === 'string') {
      return StellarSdk.nativeToScVal(value, { type: 'string' });
    }

    if (normalizedType === 'symbol') {
      return StellarSdk.nativeToScVal(value, { type: 'symbol' });
    }

    if (normalizedType === 'bytes' || normalizedType === 'bytearray') {
      const parsed = JSON.parse(value);
      return StellarSdk.nativeToScVal(Uint8Array.from(parsed), { type: 'bytes' });
    }

    if (normalizedType === 'address') {
      return new StellarSdk.Address(value).toScVal();
    }

    if (normalizedType.startsWith('vec<') || normalizedType.includes('vec')) {
      const parsed = JSON.parse(value);
      return StellarSdk.nativeToScVal(parsed);
    }

    if (normalizedType.startsWith('map<') || normalizedType.startsWith('tuple<') || normalizedType.includes('map') || normalizedType.includes('tuple') || normalizedType.includes('struct') || normalizedType.includes('enum') || normalizedType.includes('udt')) {
      const parsed = JSON.parse(value);
      return StellarSdk.nativeToScVal(parsed);
    }

    return StellarSdk.nativeToScVal(value);
  };

  const prepareFunctionArgs = (func, params) => {
    // Convert parameters to Soroban ScVal format
    const args = [];

    if (func.params && func.params.length > 0) {
      func.params.forEach(param => {
        const value = params[param.name];

        if (value !== undefined && value !== '') {
          args.push(toScValFromInput(value, param.type));
        }
      });
    }

    return args;
  };

  const handleRetryFunctionDiscovery = async () => {
    if (!deployedContract?.id || functionDiscovery.loading) {
      return;
    }

    await discoverContractFunctions(deployedContract.id);
  };

  // AI Functions
  useEffect(() => {
    const savedKey = AI.getApiKey();
    setApiKey(savedKey);
  }, []);

  const handleSaveApiKey = () => {
    AI.setApiKey(apiKey);
    setShowApiKeyModal(false);
    if (aiChatMessages.length === 0) {
      setAiChatMessages([{
        role: 'assistant',
        content: '👋 Hi! I\'m your AI coding assistant. I can help you:\n\n• Answer questions about Soroban & Rust\n• Generate smart contracts from descriptions\n• Explain code in simple terms\n• Debug and fix issues\n• Suggest improvements\n\nWhat would you like to build today?'
      }]);
    }
  };

  const handleAiChat = async () => {
    if (!aiInput.trim()) return;
    if (!AI.isConfigured()) {
      setShowApiKeyModal(true);
      return;
    }

    const userMessage = aiInput.trim();
    setAiInput('');

    const newMessages = [...aiChatMessages, { role: 'user', content: userMessage }];
    setAiChatMessages(newMessages);
    setAiLoading(true);

    try {
      const conversationHistory = newMessages.slice(-10); // Keep last 10 messages
      const response = await AI.chatWithAI(userMessage, conversationHistory);

      setAiChatMessages([...newMessages, { role: 'assistant', content: response }]);
    } catch (error) {
      setAiChatMessages([...newMessages, {
        role: 'assistant',
        content: `❌ Error: ${error.message}`
      }]);
    } finally {
      setAiLoading(false);
    }
  };

  const handleExplainCode = async () => {
    if (!AI.isConfigured()) {
      setShowApiKeyModal(true);
      return;
    }

    const selectedText = editorRef.current?.getSelection();
    const selectedCode = selectedText ? editorRef.current.getModel().getValueInRange(selectedText) : null;
    const codeToExplain = selectedCode || code;

    setAiAction('explain');
    setAiLoading(true);
    setActivePanel('ai');

    try {
      const explanation = await AI.explainCode(codeToExplain, selectedCode ? 'selected code' : null);
      setAiChatMessages([...aiChatMessages,
      { role: 'user', content: `Explain this code:\n\`\`\`rust\n${codeToExplain.substring(0, 200)}${codeToExplain.length > 200 ? '...' : ''}\n\`\`\`` },
      { role: 'assistant', content: explanation }
      ]);
    } catch (error) {
      setAiChatMessages([...aiChatMessages, {
        role: 'assistant',
        content: `❌ Error: ${error.message}`
      }]);
    } finally {
      setAiLoading(false);
      setAiAction(null);
    }
  };

  const handleDebugCode = async () => {
    if (!AI.isConfigured()) {
      setShowApiKeyModal(true);
      return;
    }

    setAiAction('debug');
    setAiLoading(true);
    setActivePanel('ai');

    try {
      const debugInfo = await AI.debugCode(code);
      setAiChatMessages([...aiChatMessages,
      { role: 'user', content: 'Debug this contract and find potential issues' },
      { role: 'assistant', content: debugInfo }
      ]);
    } catch (error) {
      setAiChatMessages([...aiChatMessages, {
        role: 'assistant',
        content: `❌ Error: ${error.message}`
      }]);
    } finally {
      setAiLoading(false);
      setAiAction(null);
    }
  };

  const handleImproveCode = async () => {
    if (!AI.isConfigured()) {
      setShowApiKeyModal(true);
      return;
    }

    setAiAction('improve');
    setAiLoading(true);
    setActivePanel('ai');

    try {
      const improvements = await AI.improveCode(code);
      setAiChatMessages([...aiChatMessages,
      { role: 'user', content: 'Review and suggest improvements for this contract' },
      { role: 'assistant', content: improvements }
      ]);
    } catch (error) {
      setAiChatMessages([...aiChatMessages, {
        role: 'assistant',
        content: `❌ Error: ${error.message}`
      }]);
    } finally {
      setAiLoading(false);
      setAiAction(null);
    }
  };

  const handleGenerateContract = async (description) => {
    if (!AI.isConfigured()) {
      setShowApiKeyModal(true);
      return;
    }

    setAiLoading(true);
    setActivePanel('ai');

    try {
      const newContract = await AI.generateContract(description);
      setCode(newContract);
      setSelectedExample(null); // Clear selected example for AI-generated code
      setAiChatMessages([...aiChatMessages,
      { role: 'user', content: `Generate a contract: ${description}` },
      { role: 'assistant', content: `✅ Contract generated! I've loaded it into the editor. Here's what I created:\n\n${newContract}` }
      ]);
      setActivePanel('editor');
    } catch (error) {
      setAiChatMessages([...aiChatMessages, {
        role: 'assistant',
        content: `❌ Error: ${error.message}`
      }]);
    } finally {
      setAiLoading(false);
    }
  };

  const handleEditorMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // Add inline completion provider
    monaco.languages.registerInlineCompletionsProvider('rust', {
      provideInlineCompletions: async (model, position, context, token) => {
        if (!AI.isConfigured()) return { items: [] };

        try {
          const codeBefore = model.getValueInRange({
            startLineNumber: Math.max(1, position.lineNumber - 10),
            startColumn: 1,
            endLineNumber: position.lineNumber,
            endColumn: position.column,
          });

          const codeAfter = model.getValueInRange({
            startLineNumber: position.lineNumber,
            startColumn: position.column,
            endLineNumber: Math.min(model.getLineCount(), position.lineNumber + 3),
            endColumn: model.getLineMaxColumn(Math.min(model.getLineCount(), position.lineNumber + 3)),
          });

          const completion = await AI.completeCode(codeBefore, codeAfter);

          return {
            items: [{
              insertText: completion,
              range: {
                startLineNumber: position.lineNumber,
                startColumn: position.column,
                endLineNumber: position.lineNumber,
                endColumn: position.column,
              },
            }],
          };
        } catch (error) {
          return { items: [] };
        }
      },
      freeInlineCompletions: () => { },
    });
  };

  const examples = getExamplesList();
  const currentExample = selectedExample ? getExample(selectedExample) : null;

  return (
    <div className="ide-shell">

      {/* ── Header ─────────────────────────────────────────── */}
      <header className="ide-header">
        <div className="header-brand">
          <div className="header-logo">
            <svg width="18" height="18" viewBox="0 0 38 38" fill="none">
              <circle cx="19" cy="19" r="9" stroke="white" strokeWidth="2.5" fill="none" />
              <circle cx="19" cy="4" r="2.5" fill="white" />
              <circle cx="19" cy="34" r="2.5" fill="white" />
              <circle cx="4" cy="19" r="2.5" fill="white" />
              <circle cx="34" cy="19" r="2.5" fill="white" />
            </svg>
          </div>
          <div>
            <div className="header-title">Orbital IDE</div>
            <div className="header-subtitle">Soroban · Testnet</div>
          </div>
        </div>

        <div className="header-center">
          <button onClick={() => setActivePanel('editor')} className={`header-nav-btn ${activePanel === 'editor' ? 'active' : ''}`}>
            <Code2 size={14} /> Editor
          </button>
          <button onClick={() => setActivePanel('deploy')} className={`header-nav-btn ${activePanel === 'deploy' ? 'active' : ''}`}>
            <Rocket size={14} /> Deploy
          </button>
          <button onClick={() => setActivePanel('interact')} className={`header-nav-btn ${activePanel === 'interact' ? 'active' : ''}`} disabled={!deployedContract} data-testid="nav-interact-btn">
            <Zap size={14} /> Interact
          </button>
          <button onClick={() => setActivePanel('transactions')} className={`header-nav-btn ${activePanel === 'transactions' ? 'active' : ''}`}>
            <History size={14} /> History
          </button>
          <button onClick={() => setActivePanel('ai')} className={`header-nav-btn ${activePanel === 'ai' ? 'active' : ''}`}>
            <Bot size={14} /> AI
          </button>
        </div>

        <div className="header-right">
          {!publicKey ? (
            <>
              <select
                className="wallet-select"
                style={{ width: 140 }}
                value={selectedWalletId}
                onChange={(e) => setSelectedWalletId(e.target.value)}
                disabled={loading}
              >
                {wallets.map((w) => (
                  <option key={w.id} value={w.id}>{w.icon} {w.name}</option>
                ))}
              </select>
              <button onClick={handleConnect} disabled={loading} className="btn btn-primary btn-sm">
                {loading ? <><span className="spinner" />&nbsp;Connecting</> : 'Connect Wallet'}
              </button>
            </>
          ) : (
            <div className="wallet-chip">
              <span className="wallet-dot" />
              {publicKey.slice(0, 4)}…{publicKey.slice(-4)}
            </div>
          )}
          <button onClick={onBackToLanding} className="btn btn-ghost btn-sm" title="Back to landing">
            <ArrowLeft size={14} />
          </button>
        </div>
      </header>

      {/* ── Body ───────────────────────────────────────────── */}
      <div className="ide-body">

        {/* ── Sidebar ──────────────────────────────────────── */}
        <aside className="ide-sidebar">
          <div className="sidebar-section">
            <div className="sidebar-label">Contract Examples</div>
          </div>
          <div className="sidebar-examples">
            {examples.map((ex) => (
              <div
                key={ex.id}
                className={`example-card ${selectedExample === ex.id ? 'active' : ''}`}
                onClick={() => handleExampleChange(ex.id)}
              >
                <div className="example-name">{ex.name}</div>
                <div className="example-desc">{ex.description}</div>
                <span className={`difficulty-badge difficulty-${(ex.difficulty || 'beginner').toLowerCase()}`}>
                  {ex.difficulty}
                </span>
              </div>
            ))}
          </div>

          {deployedContract && (
            <div className="sidebar-section" style={{ borderTop: '1px solid var(--border)' }}>
              <div className="sidebar-label">Active Contract</div>
              <div className="contract-card" style={{ margin: 0 }}>
                <div className="contract-label">{deployedContract.name}</div>
                <div className="contract-id">{deployedContract.id.slice(0, 12)}…</div>
                <a href={getExplorerContractUrl(deployedContract.id)} target="_blank" rel="noopener noreferrer" className="link" style={{ display: 'block', marginTop: 6 }}>
                  Explorer →
                </a>
              </div>
            </div>
          )}
        </aside>

        {/* ── Editor ───────────────────────────────────────── */}
        <div className="ide-editor">
          <div className="editor-toolbar">
            <span className="editor-filename">
              {currentExample ? `${currentExample.name.toLowerCase().replace(/ /g, '_')}.rs` : 'custom_contract.rs'}
            </span>
            <span className="editor-lang-tag">Rust · Soroban</span>
            <div style={{ flex: 1 }} />
            <button onClick={handleExplainCode} className="btn btn-ghost btn-sm" disabled={aiLoading} title="AI Explain">
              <Lightbulb size={13} /> Explain
            </button>
            <button onClick={handleDebugCode} className="btn btn-ghost btn-sm" disabled={aiLoading} title="AI Debug">
              <Bug size={13} /> Debug
            </button>
            <button onClick={handleImproveCode} className="btn btn-ghost btn-sm" disabled={aiLoading} title="AI Improve">
              <Sparkles size={13} /> Improve
            </button>
            <button onClick={() => setActivePanel('deploy')} className="btn btn-primary btn-sm">
              <Rocket size={13} /> Deploy
            </button>
          </div>
          <div className="editor-wrap">
            <Editor
              height="100%"
              defaultLanguage="rust"
              value={code}
              onChange={(value) => setCode(value)}
              onMount={handleEditorMount}
              theme="vs-dark"
              options={{
                minimap: { enabled: false },
                fontSize: 13,
                fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                lineNumbers: 'on',
                roundedSelection: false,
                scrollBeyondLastLine: false,
                automaticLayout: true,
                inlineSuggest: { enabled: true },
                quickSuggestions: false,
                padding: { top: 12, bottom: 12 },
              }}
            />
          </div>
        </div>

        {/* ── Right Panel ──────────────────────────────────── */}
        <div className="ide-panel">

          {/* Panel Tabs */}
          <div className="panel-tabs">
            {[
              { id: 'deploy', icon: <Rocket size={13} />, label: 'Deploy' },
              { id: 'interact', icon: <Zap size={13} />, label: 'Interact' },
              { id: 'transactions', icon: <History size={13} />, label: 'History' },
              { id: 'ai', icon: <Bot size={13} />, label: 'AI' },
            ].map(({ id, icon, label }) => (
              <button
                key={id}
                data-testid={`panel-tab-${id}`}
                className={`panel-tab ${activePanel === id ? 'active' : ''}`}
                onClick={() => setActivePanel(id)}
                disabled={id === 'interact' && !deployedContract}
              >
                {icon} {label}
              </button>
            ))}
          </div>

          {/* ── Deploy Panel ────────────────────────────── */}
          {activePanel === 'deploy' && (
            <div className="panel-content">
              <div className="section-header">Deploy to Testnet</div>

              {/* Info row */}
              <div className="alert alert-info" style={{ marginBottom: 14 }}>
                <div>
                  <strong>{currentExample ? currentExample.name : 'Custom Contract'}</strong>
                  {' · '}Stellar Testnet
                  {publicKey && <><br /><span style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>{publicKey.slice(0, 8)}…{publicKey.slice(-8)}</span></>}
                </div>
              </div>

              {!publicKey && (
                <div className="alert alert-warning" style={{ marginBottom: 12 }}>
                  Connect your wallet in the header to deploy.
                </div>
              )}

              <button
                onClick={handleDeploy}
                disabled={loading || !publicKey}
                className="btn btn-primary w-full btn-lg"
                style={{ width: '100%', justifyContent: 'center' }}
              >
                {loading
                  ? <><span className="spinner" /> Deploying…</>
                  : <><Rocket size={15} /> Deploy to Testnet</>
                }
              </button>

              {/* Progress steps */}
              {deployStatus && (
                <>
                  <div className="deploy-steps" style={{ marginTop: 14 }}>
                    {[
                      { label: 'Compile contract', pct: 25 },
                      { label: 'Upload WASM', pct: 50 },
                      { label: 'Deploy instance', pct: 75 },
                      { label: 'Confirm on-chain', pct: 100 },
                    ].map(({ label, pct }) => {
                      const progress = deployStatus.progress || 0;
                      const isDone = progress >= pct;
                      const isActive = progress >= pct - 25 && !isDone && deployStatus.status === 'pending';
                      return (
                        <div key={label} className={`deploy-step ${isDone ? 'done' : isActive ? 'active' : ''}`}>
                          <div className="step-icon">{isDone ? '✓' : isActive ? '↻' : (pct / 25)}</div>
                          {label}
                        </div>
                      );
                    })}
                  </div>

                  {deployStatus.status !== 'pending' && (
                    <div className={`alert alert-${deployStatus.status === 'success' ? 'success' : 'error'}`} style={{ marginTop: 10 }}>
                      <pre>{deployStatus.message}</pre>
                    </div>
                  )}

                  {deployStatus.contractId && (
                    <div className="contract-card">
                      <div className="contract-label">✓ Contract Deployed</div>
                      <div className="contract-id">{deployStatus.contractId}</div>
                    </div>
                  )}

                  {deployStatus.progress != null && (
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${deployStatus.progress}%` }} />
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* ── Interact Panel ──────────────────────────── */}
          {activePanel === 'interact' && (
            <div className="panel-content">
              {!deployedContract ? (
                <div className="empty-state">
                  <div className="empty-icon"><Zap size={20} color="var(--text-muted)" /></div>
                  <h4>No Contract Deployed</h4>
                  <p>Deploy a contract first to interact with it.</p>
                  <button onClick={() => setActivePanel('deploy')} className="btn btn-primary btn-sm" style={{ marginTop: 8 }}>
                    Go to Deploy
                  </button>
                </div>
              ) : (
                <>
                  {/* Event sync */}
                  <div className={`event-sync ${eventSync.live ? 'live' : 'offline'}`}>
                    <span className={`wallet-dot`} style={{ background: eventSync.live ? 'var(--success)' : 'var(--text-muted)' }} />
                    {eventSync.live ? `Live · Ledger ${eventSync.lastLedger || '—'}` : 'Reconnecting…'}
                  </div>

                  {/* Function discovery badge */}
                  {!functionDiscovery.loading && (
                    <div className={`discovery-badge ${functionDiscovery.source === 'network' ? 'network' : 'example'}`}>
                      {functionDiscovery.source === 'network' ? '⬡ Functions: On-chain spec' : '⚠ Functions: Example metadata fallback'}
                    </div>
                  )}
                  {functionDiscovery.error && (
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>{functionDiscovery.error} —{' '}
                      <button onClick={handleRetryFunctionDiscovery} className="btn btn-ghost btn-sm" disabled={functionDiscovery.loading} style={{ padding: '2px 8px', fontSize: 11 }}>
                        Retry
                      </button>
                    </div>
                  )}

                  {/* Raw call toggle */}
                  <label className="toggle-row">
                    <input
                      type="checkbox"
                      aria-label="Use Raw Call Mode"
                      checked={rawCallMode}
                      onChange={(e) => {
                        const enabled = e.target.checked;
                        setRawCallMode(enabled);
                        setRawCallError('');
                        setFunctionParamErrors({});
                        setCallResult(null);
                        if (!enabled) { setRawFunctionName(''); setRawArgsJson('[]'); }
                      }}
                    />
                    Use Raw Call Mode
                  </label>

                  {rawCallMode ? (
                    <div className="raw-call-section">
                      <div className="section-header">Raw Contract Call</div>
                      <div className="param-item" style={{ marginBottom: 8 }}>
                        <label className="param-label" htmlFor="raw-function-name">Function Name</label>
                        <input
                          id="raw-function-name"
                          type="text"
                          className={`param-input ${rawCallError && !rawFunctionName.trim() ? 'error' : ''}`}
                          placeholder="e.g. increment"
                          value={rawFunctionName}
                          onChange={(e) => setRawFunctionName(e.target.value)}
                        />
                      </div>
                      <div className="param-item" style={{ marginBottom: 8 }}>
                        <label className="param-label" htmlFor="raw-json-args">Raw JSON Args</label>
                        <textarea
                          id="raw-json-args"
                          aria-label="Raw JSON Args"
                          className={`param-input ${rawCallError ? 'error' : ''}`}
                          placeholder='[] or [{"__type":"address","value":"G..."}]'
                          rows={4}
                          value={rawArgsJson}
                          onChange={(e) => setRawArgsJson(e.target.value)}
                          style={{ resize: 'vertical' }}
                        />
                      </div>
                      {rawCallError && <div className="param-error" style={{ marginBottom: 8 }}>{rawCallError}</div>}
                      <button onClick={handleCallFunction} disabled={loading} className="btn btn-accent w-full" style={{ width: '100%', justifyContent: 'center' }}>
                        {loading ? <><span className="spinner" /> Calling…</> : <><Zap size={13} /> Execute Raw Call</>}
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="fn-select-wrap">
                        <select
                          className="fn-select"
                          value={selectedFunction?.name || ''}
                          onChange={(e) => {
                            const func = availableFunctions.find((f) => f.name === e.target.value);
                            setSelectedFunction(func);
                            setFunctionParams({});
                            setFunctionParamErrors({});
                            setCallResult(null);
                          }}
                        >
                          <option value="">— Choose a function —</option>
                          {availableFunctions.map((fn) => (
                            <option key={fn.name} value={fn.name}>{fn.name}() → {fn.returns}</option>
                          ))}
                        </select>
                      </div>

                      {selectedFunction && selectedFunction.params.length > 0 && (
                        <div className="param-group">
                          {selectedFunction.params.map((param, idx) => (
                            <div key={idx} className="param-item">
                              <label className="param-label">
                                {param.name}
                                <span className="type-badge">{param.type}</span>
                              </label>
                              {getTypeKind(param.type) === 'bool' ? (
                                <select
                                  className={`param-input ${functionParamErrors[param.name] ? 'error' : ''}`}
                                  value={functionParams[param.name] || ''}
                                  onChange={(e) => setFunctionParams({ ...functionParams, [param.name]: e.target.value })}
                                >
                                  <option value="">— Select —</option>
                                  <option value="true">true</option>
                                  <option value="false">false</option>
                                </select>
                              ) : getTypeKind(param.type) === 'json' ? (
                                <textarea
                                  className={`param-input ${functionParamErrors[param.name] ? 'error' : ''}`}
                                  placeholder={`JSON for ${param.type}`}
                                  value={functionParams[param.name] || ''}
                                  onChange={(e) => setFunctionParams({ ...functionParams, [param.name]: e.target.value })}
                                  rows={3}
                                  style={{ resize: 'vertical' }}
                                />
                              ) : (
                                <input
                                  type="text"
                                  inputMode={getTypeKind(param.type) === 'integer' ? 'numeric' : 'text'}
                                  className={`param-input ${functionParamErrors[param.name] ? 'error' : ''}`}
                                  placeholder={`Enter ${param.type}`}
                                  value={functionParams[param.name] || ''}
                                  onChange={(e) => setFunctionParams({ ...functionParams, [param.name]: e.target.value })}
                                />
                              )}
                              {functionParamErrors[param.name] && (
                                <div className="param-error">{functionParamErrors[param.name]}</div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {selectedFunction && (
                        <button onClick={handleCallFunction} disabled={loading} className="btn btn-primary w-full" style={{ width: '100%', justifyContent: 'center' }}>
                          {loading ? <><span className="spinner" /> Calling…</> : <><Zap size={13} /> Execute Function</>}
                        </button>
                      )}
                    </>
                  )}

                  {callResult && (
                    <div className={`result-box ${callResult.status}`} style={{ marginTop: 12 }}>
                      {callResult.result ?? callResult.message}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* ── History Panel ───────────────────────────── */}
          {activePanel === 'transactions' && (
            <div className="panel-content">
              <div className="section-header">Transaction History</div>
              {transactions.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon"><History size={20} color="var(--text-muted)" /></div>
                  <h4>No Transactions Yet</h4>
                  <p>Deploy and interact with a contract to see activity here.</p>
                </div>
              ) : (
                <div className="history-list">
                  {transactions.map((tx, idx) => (
                    <div key={idx} className="history-item">
                      <div className="history-header">
                        <div className="history-type">
                          <span className={`type-dot ${tx.type}`} />
                          {tx.type === 'deploy' ? <Rocket size={12} /> : tx.type === 'event' ? <Sparkles size={12} /> : <Zap size={12} />}
                          {tx.type}
                          {tx.function && ` · ${tx.function}()`}
                        </div>
                        <span className="history-time">{new Date(tx.timestamp).toLocaleTimeString()}</span>
                      </div>
                      {tx.contractId && <div className="contract-id" style={{ marginTop: 4, fontSize: 10 }}>{tx.contractId.slice(0, 16)}…</div>}
                      {tx.result != null && (
                        <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 3 }}>
                          Result: {JSON.stringify(tx.result)}
                        </div>
                      )}
                      {(tx.explorerUrl || tx.hash) && (
                        <a href={tx.explorerUrl || getExplorerTxUrl(tx.hash)} target="_blank" rel="noopener noreferrer" className="history-hash">
                          {(tx.hash || '').slice(0, 12)}… ↗
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── AI Panel ────────────────────────────────── */}
          {activePanel === 'ai' && (
            <div className="panel-content" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div className="section-header" style={{ margin: 0 }}><Bot size={13} /> AI Assistant</div>
                <button onClick={() => setShowApiKeyModal(true)} className="btn btn-ghost btn-sm">
                  <Settings size={12} /> {AI.isConfigured() ? 'Key Set ✓' : 'Add Key'}
                </button>
              </div>

              {!AI.isConfigured() && !aiChatMessages.length && (
                <div className="alert alert-info" style={{ marginBottom: 12 }}>
                  Add a free Groq API key to unlock AI features.{' '}
                  <a href={EXTERNAL_LINKS.groqConsole} target="_blank" rel="noopener noreferrer" className="link">console.groq.com</a>
                </div>
              )}

              <div className="ai-actions">
                <button className="ai-action-btn" onClick={handleExplainCode} disabled={aiLoading || !AI.isConfigured()}>
                  <Lightbulb size={13} /> Explain Code
                </button>
                <button className="ai-action-btn" onClick={handleDebugCode} disabled={aiLoading || !AI.isConfigured()}>
                  <Bug size={13} /> Debug Code
                </button>
                <button className="ai-action-btn" onClick={handleImproveCode} disabled={aiLoading || !AI.isConfigured()}>
                  <Sparkles size={13} /> Improve
                </button>
                <button className="ai-action-btn" onClick={() => {
                  const desc = 'a token contract with transfer and mint';
                  if (AI.isConfigured()) handleGenerateContract(desc);
                  else setShowApiKeyModal(true);
                }} disabled={aiLoading}>
                  <ArrowRight size={13} /> Generate
                </button>
              </div>

              <div className="ai-panel">
                <div className="ai-messages">
                  {aiChatMessages.map((msg, idx) => (
                    <div key={idx} className={`msg msg-${msg.role}`}>
                      <pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontFamily: 'var(--font-ui)' }}>{msg.content}</pre>
                    </div>
                  ))}
                  {aiLoading && (
                    <div className="msg msg-assistant">
                      <span className="spinner" style={{ marginRight: 6 }} /> Thinking…
                    </div>
                  )}
                </div>

                <div className="ai-input-row">
                  <textarea
                    className="ai-input"
                    value={aiInput}
                    onChange={(e) => setAiInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAiChat(); } }}
                    placeholder={AI.isConfigured() ? 'Ask about Soroban…' : 'Configure API key first…'}
                    disabled={!AI.isConfigured() || aiLoading}
                    rows={2}
                  />
                  <button onClick={handleAiChat} disabled={!aiInput.trim() || aiLoading || !AI.isConfigured()} className="btn btn-primary btn-sm">
                    ↗
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* ── Status Bar ─────────────────────────────────────── */}
      <div className="ide-statusbar">
        <span className="status-item ok">◉ Stellar Testnet</span>
        {deployedContract && (
          <span className="status-item ok">
            Contract: {deployedContract.id.slice(0, 8)}…
          </span>
        )}
        {eventSync.live && deployedContract && (
          <span className="status-item ok">⬡ Events Live · Ledger {eventSync.lastLedger}</span>
        )}
        <span style={{ flex: 1 }} />
        <span className="status-item">
          <a href={getExplorerHomeUrl()} target="_blank" rel="noopener noreferrer">Stellar Expert ↗</a>
        </span>
        <span className="status-item">
          <a href={EXTERNAL_LINKS.friendbot} target="_blank" rel="noopener noreferrer">Get Test XLM ↗</a>
        </span>
      </div>

      {/* ── API Key Modal ───────────────────────────────────── */}
      {showApiKeyModal && (
        <div className="modal-overlay" onClick={() => setShowApiKeyModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-title" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <Settings size={18} /> AI Configuration
            </div>
            <div className="modal-desc">
              Enter your Groq API key to enable AI coding assistance.
              Get a free key at{' '}
              <a href={EXTERNAL_LINKS.groqConsole} target="_blank" rel="noopener noreferrer" className="link">
                console.groq.com
              </a>
            </div>
            <input
              id="api-key"
              type="password"
              className="form-input"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="gsk_…"
              autoFocus
            />
            <div className="modal-actions">
              <button onClick={() => setShowApiKeyModal(false)} className="btn btn-secondary">Cancel</button>
              <button onClick={handleSaveApiKey} disabled={!apiKey.trim()} className="btn btn-primary">
                Save & Enable AI
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}


export default App;
