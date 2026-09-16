const modules = new Map();

export function registerModule(module) {
  if (!module?.id) throw new Error('A module needs an id');
  modules.set(module.id, Object.freeze({ ...module }));
}

export function getModule(id) {
  return modules.get(id) || null;
}

export function listModules() {
  return [...modules.values()];
}

export function activateModule(id, context = {}) {
  const module = getModule(id);
  if (!module) return false;
  module.mount?.(context);
  return true;
}

export const router = Object.freeze({ registerModule, getModule, listModules, activateModule });
