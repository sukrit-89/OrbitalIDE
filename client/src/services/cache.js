const STORAGE_KEYS = {
  DEPLOYED_CONTRACT: 'orbital_deployed_contract',
  TRANSACTIONS: 'orbital_transactions',
  EVENT_CURSORS: 'orbital_event_cursors',
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

export function readEventCursor(contractId) {
  if (!contractId) return null;
  const cursors = readJson(STORAGE_KEYS.EVENT_CURSORS, {});
  return cursors[contractId] || null;
}

export function writeEventCursor(contractId, cursor) {
  if (!contractId || !cursor) return;
  const cursors = readJson(STORAGE_KEYS.EVENT_CURSORS, {});
  cursors[contractId] = cursor;
  writeJson(STORAGE_KEYS.EVENT_CURSORS, cursors);
}

export { STORAGE_KEYS };
