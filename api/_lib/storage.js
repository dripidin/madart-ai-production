const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '../..');
const DATA_DIR = path.join(ROOT_DIR, 'data');

const memoryCache = new Map();
const memoryFallbackOnly = new Set();

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function readJson(filename, fallback) {
  const filePath = path.join(DATA_DIR, filename);
  if (memoryFallbackOnly.has(filename) && memoryCache.has(filename)) {
    return JSON.parse(JSON.stringify(memoryCache.get(filename)));
  }
  try {
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, 'utf8');
      const parsed = JSON.parse(raw);
      memoryCache.set(filename, parsed);
      return JSON.parse(JSON.stringify(parsed));
    }
  } catch (err) {
    console.warn(`[storage] Failed reading ${filename}:`, err.message);
    if (memoryCache.has(filename)) {
      return JSON.parse(JSON.stringify(memoryCache.get(filename)));
    }
  }
  return JSON.parse(JSON.stringify(fallback));
}

function writeJson(filename, value) {
  const snapshot = JSON.parse(JSON.stringify(value));
  memoryCache.set(filename, snapshot);
  const filePath = path.join(DATA_DIR, filename);
  try {
    ensureDir(DATA_DIR);
    fs.writeFileSync(filePath, JSON.stringify(snapshot, null, 2), 'utf8');
    memoryFallbackOnly.delete(filename);
    return { persisted: true };
  } catch (err) {
    console.warn(`[storage] Read-only fallback writing ${filename}:`, err.message);
    memoryFallbackOnly.add(filename);
    return { persisted: false, memoryOnly: true };
  }
}

const DEFAULT_SECRETS = {
  gemini: { enabled: false, apiKey: '' },
};

function readSecrets() {
  const data = readJson('secrets.json', DEFAULT_SECRETS);
  return {
    gemini: { ...DEFAULT_SECRETS.gemini, ...(data.gemini || {}) },
  };
}

function maskSecretValue(val) {
  if (!val || typeof val !== 'string') return '';
  if (val.length <= 4) return '••••';
  return '••••' + val.slice(-4);
}

function isMaskedPlaceholder(val) {
  return typeof val === 'string' && val.startsWith('••••');
}

function getMaskedSecrets(secrets) {
  return {
    gemini: {
      enabled: Boolean(secrets.gemini?.enabled),
      apiKey: maskSecretValue(secrets.gemini?.apiKey),
      hasKey: Boolean(secrets.gemini?.apiKey),
    },
  };
}

module.exports = {
  ROOT_DIR,
  DATA_DIR,
  ensureDir,
  readJson,
  writeJson,
  readSecrets,
  maskSecretValue,
  isMaskedPlaceholder,
  getMaskedSecrets,
};
