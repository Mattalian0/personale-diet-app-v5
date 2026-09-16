import { registerModule } from '../core/router.js';

const moduleDefinitions = [
  { id:'dashboard', label:'Dashboard', legacyPage:'home' },
  { id:'profile', label:'Profilo', legacyPage:'giornaliero' },
  { id:'daily-plan', label:'Piano Giornaliero', legacyPage:'giornaliero' },
  { id:'weekly-plan', label:'Piano Settimanale', legacyPage:'settimanale' },
  { id:'tracker', label:'Tracker Manuale', legacyPage:'tracker' },
  { id:'tracker-manual-2', label:'Tracker Manuale 2', legacyPage:'tracker2' },
  { id:'mobile-nav', label:'Mobile Navigation', feature:'mobile-navigation' },
  { id:'choice-plan', label:'Piano a Scelte', legacyPage:'scelte' },
  { id:'foods', label:'Gestione Alimenti', legacyPage:'alimenti' },
  { id:'templates', label:'Template', feature:'templates' },
  { id:'shopping-list', label:'Lista della Spesa', feature:'shopping-list' },
  { id:'weight-trend', label:'Trend Peso', feature:'weight-trend' },
  { id:'backup', label:'Backup', feature:'backup' }
];

export function registerCoreModules() {
  moduleDefinitions.forEach(module => registerModule({ ...module, status:'legacy-adapter' }));
  return moduleDefinitions;
}
