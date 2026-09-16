import { readJson, writeJson } from './storage.js';

const STATE_KEY = 'modularState_v1';

const defaults = {
  schemaVersion: 1,
  activeProfileId: 'local',
  profiles: {},
  settings: { theme: 'system' },
  history: []
};

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

export function createState(legacy = {}) {
  const saved = readJson(STATE_KEY, null);
  const state = saved && typeof saved === 'object' ? { ...clone(defaults), ...saved } : clone(defaults);
  if (!state.profiles.local) {
    state.profiles.local = {
      id: 'local',
      profile: legacy.profile || {},
      targets: legacy.targets || {},
      weightHistory: legacy.weightHistory || []
    };
  }
  return state;
}

export function saveState(state) {
  writeJson(STATE_KEY, state);
  return state;
}

export function updateState(state, updater) {
  const next = clone(state);
  updater(next);
  return saveState(next);
}

export function getActiveProfile(state) {
  return state.profiles[state.activeProfileId] || null;
}

export const stateStore = Object.freeze({ createState, saveState, updateState, getActiveProfile });
