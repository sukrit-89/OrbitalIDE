const DEFAULTS = {
  COMPILER_BASE_URL: 'http://localhost:3001',
  SOROBAN_RPC_URL: 'https://soroban-testnet.stellar.org',
  HORIZON_URL: 'https://horizon-testnet.stellar.org',
  STELLAR_EXPLORER_BASE_URL: 'https://stellar.expert/explorer/testnet',
  GROQ_API_URL: 'https://api.groq.com/openai/v1/chat/completions',
  SOROBAN_DOCS_URL: 'https://soroban.stellar.org/docs',
  FRIENDBOT_URL: 'https://friendbot.stellar.org/',
  GROQ_CONSOLE_URL: 'https://console.groq.com',
};

function trimSlash(value) {
  return String(value || '').replace(/\/+$/, '');
}

function compilerBaseFromEnv() {
  const raw = import.meta.env.VITE_COMPILER_URL || DEFAULTS.COMPILER_BASE_URL;
  const withoutSlash = trimSlash(raw);
  return withoutSlash.endsWith('/compile')
    ? withoutSlash.slice(0, -'/compile'.length)
    : withoutSlash;
}

export function getCompilerBaseUrl() {
  return compilerBaseFromEnv();
}

export function getCompilerCompileUrl() {
  return `${compilerBaseFromEnv()}/compile`;
}

export function getCompilerHealthUrl() {
  return `${compilerBaseFromEnv()}/health`;
}

export function getSorobanRpcUrl() {
  return trimSlash(import.meta.env.VITE_SOROBAN_RPC_URL || DEFAULTS.SOROBAN_RPC_URL);
}

export function getHorizonUrl() {
  return trimSlash(import.meta.env.VITE_HORIZON_URL || DEFAULTS.HORIZON_URL);
}

export function getGroqApiUrl() {
  return import.meta.env.VITE_GROQ_API_URL || DEFAULTS.GROQ_API_URL;
}

function getExplorerBaseUrl() {
  return trimSlash(import.meta.env.VITE_STELLAR_EXPLORER_BASE_URL || DEFAULTS.STELLAR_EXPLORER_BASE_URL);
}

export function getExplorerTxUrl(hash) {
  return `${getExplorerBaseUrl()}/tx/${hash}`;
}

export function getExplorerContractUrl(contractId) {
  return `${getExplorerBaseUrl()}/contract/${contractId}`;
}

export function getExplorerHomeUrl() {
  return getExplorerBaseUrl();
}

export const EXTERNAL_LINKS = {
  sorobanDocs: import.meta.env.VITE_SOROBAN_DOCS_URL || DEFAULTS.SOROBAN_DOCS_URL,
  friendbot: import.meta.env.VITE_FRIENDBOT_URL || DEFAULTS.FRIENDBOT_URL,
  groqConsole: import.meta.env.VITE_GROQ_CONSOLE_URL || DEFAULTS.GROQ_CONSOLE_URL,
};
