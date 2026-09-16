import { storage } from './core/storage.js';
import { createState, saveState, updateState, getActiveProfile } from './core/state.js';
import { nutrition } from './nutrition/calculations.js';
import { router } from './core/router.js';
import { registerCoreModules } from './modules/registry.js';
import { createTrackerManualModule } from './modules/tracker-manual.js';
import { createTrackerManual2Module } from './modules/tracker-manual-2.js';
import { createMobileNavModule } from './modules/mobile-nav.js';

const legacy = window.DietLegacy || {};
const foods = () => legacy.getFoods?.() || [];
const foodResolver = foodId => foods().find(food => (food.id || `food-${String(food.name).toLowerCase().replace(/[^a-z0-9]+/g, '-')}`) === foodId || `food-${String(food.name).toLowerCase().replace(/[^a-z0-9]+/g, '-')}` === foodId) || null;
const state = createState({ profile:legacy.getProfile?.() || {}, weightHistory:legacy.getProfile?.()?.weightHistory || [] });
const modules = registerCoreModules();
const trackerManualModule = createTrackerManualModule({ legacy });
const trackerManual2Module = createTrackerManual2Module();
const mobileNavModule = createMobileNavModule();
router.registerModule(trackerManualModule);
router.registerModule(trackerManual2Module);
trackerManualModule.mount();
trackerManual2Module.mount();
mobileNavModule.mount();
window.TrackerManual2 = trackerManual2Module;

const DietApp = Object.freeze({
  version: 'modular-v1',
  storage,
  state: { current:state, save:saveState, update:updateState, activeProfile:() => getActiveProfile(state) },
  nutrition: { ...nutrition, foodResolver },
  router,
  modules,
  legacy
});

window.DietApp = DietApp;
document.documentElement.dataset.modularArchitecture = 'ready';
document.documentElement.dataset.modularVersion = DietApp.version;
window.dispatchEvent(new CustomEvent('dietapp:ready', { detail: { version:DietApp.version, modules } }));
