const PREFIX = 'newProjectDiet_';

export function readJson(key, fallback = null) {
  try {
    const raw = localStorage.getItem(`${PREFIX}${key}`);
    return raw ? JSON.parse(raw) : fallback;
  } catch (error) {
    return fallback;
  }
}

export function writeJson(key, value) {
  localStorage.setItem(`${PREFIX}${key}`, JSON.stringify(value));
}

export function remove(key) {
  localStorage.removeItem(`${PREFIX}${key}`);
}

export const storage = Object.freeze({ readJson, writeJson, remove });
