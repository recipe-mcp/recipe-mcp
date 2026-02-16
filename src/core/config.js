/**
 * Shared config storage.
 * Stores adapter credentials, preferences, and license info
 * in ~/.config/recipe-mcp/config.json
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';

const CONFIG_DIR = join(homedir(), '.config', 'recipe-mcp');
const CONFIG_FILE = join(CONFIG_DIR, 'config.json');

function readConfig() {
  try {
    return JSON.parse(readFileSync(CONFIG_FILE, 'utf8'));
  } catch {
    return {};
  }
}

function writeConfig(data) {
  mkdirSync(CONFIG_DIR, { recursive: true });
  writeFileSync(CONFIG_FILE, JSON.stringify(data, null, 2));
}

export function configGet(key) {
  return readConfig()[key] ?? null;
}

export function configSet(key, value) {
  const data = readConfig();
  data[key] = value;
  writeConfig(data);
}

export function configDelete(key) {
  const data = readConfig();
  delete data[key];
  writeConfig(data);
}

/**
 * Adapter-scoped config helpers.
 * e.g. configGetAdapter('nyt', 'token') reads config['adapters']['nyt']['token']
 */
export function configGetAdapter(adapterKey, key) {
  const data = readConfig();
  return data?.adapters?.[adapterKey]?.[key] ?? null;
}

export function configSetAdapter(adapterKey, key, value) {
  const data = readConfig();
  if (!data.adapters) data.adapters = {};
  if (!data.adapters[adapterKey]) data.adapters[adapterKey] = {};
  data.adapters[adapterKey][key] = value;
  writeConfig(data);
}

export function configDeleteAdapter(adapterKey, key) {
  const data = readConfig();
  if (data?.adapters?.[adapterKey]) {
    delete data.adapters[adapterKey][key];
    writeConfig(data);
  }
}
