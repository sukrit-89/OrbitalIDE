const STORAGE_KEYS = {
  DEPLOYED_CONTRACT: 'orbital_deployed_contract',
  TRANSACTIONS: 'orbital_transactions',
};

function hasStorage() {
  return typeof window !== 'undefined' && !!window.localStorage;
}

export function readJson(key, fallback) {
  if (!hasStorage()) return fallback;

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function writeJson(key, value) {
  if (!hasStorage()) return;

  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage write errors (quota/private mode)
  }
}

export function readCachedDeployState() {
  return {
    deployedContract: readJson(STORAGE_KEYS.DEPLOYED_CONTRACT, null),
    transactions: readJson(STORAGE_KEYS.TRANSACTIONS, []),
  };
}

export function writeCachedDeployState({ deployedContract, transactions }) {
  writeJson(STORAGE_KEYS.DEPLOYED_CONTRACT, deployedContract || null);
  writeJson(STORAGE_KEYS.TRANSACTIONS, Array.isArray(transactions) ? transactions.slice(0, 50) : []);
}

export { STORAGE_KEYS };
