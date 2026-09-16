const TOGGLE_KEY = 'newProjectDiet_trackerMacroEditorOpen';

function getOpenState() {
  const saved = localStorage.getItem(TOGGLE_KEY);
  return saved === null ? true : saved === 'true';
}

function setOpenState(open) {
  localStorage.setItem(TOGGLE_KEY, String(open));
}

function format(value) {
  return Number(value || 0).toFixed(1);
}

export function createTrackerManualModule({ legacy }) {
  function getGoalSettings() {
    return legacy.getGoalSettings?.() || { protGkg:2, grassiGkg:1, carboGkg:2 };
  }

  function updateMacro(field, value) {
    legacy.updateTrackerMacro?.(field, value);
    render();
  }

  function changeMacro(field, delta) {
    const settings = getGoalSettings();
    const current = Number(settings[field]) || 0;
    const max = field === 'carboGkg' ? 15 : 10;
    updateMacro(field, Math.min(max, Math.max(.1, Number((current + delta).toFixed(1)))));
  }

  function macroControl(label, field, max) {
    const settings = getGoalSettings();
    return `<label class="tracker-module-macro-field">${label} (g/kg)<div class="tracker-module-stepper"><input type="number" inputmode="decimal" min="0.1" max="${max}" step="0.1" value="${format(settings[field])}" aria-label="${label} grammi per kg"><button type="button" class="tracker-module-step" data-field="${field}" data-delta="0.1" aria-label="Aumenta ${label}">+</button><button type="button" class="tracker-module-step" data-field="${field}" data-delta="-0.1" aria-label="Diminuisci ${label}">−</button></div></label>`;
  }

  function render() {
    const panel = document.getElementById('tracker-results-panel');
    if (!panel) return;
    const open = getOpenState();
    panel.innerHTML = `<div class="tracker-module-header"><div><h2>I Tuoi Numeri</h2><p>Modifica solo i target macro del Tracker Manuale.</p></div><label class="tracker-module-toggle"><span>Target macro</span><input type="checkbox" id="tracker-module-toggle-input" ${open ? 'checked' : ''} aria-expanded="${open}"><span class="tracker-toggle-ui"></span></label></div>${open ? `<div class="tracker-module-editor"><div class="tracker-module-macro-grid">${macroControl('Proteine','protGkg',10)}${macroControl('Grassi','grassiGkg',10)}${macroControl('Carboidrati','carboGkg',15)}</div></div>` : ''}`;
    const toggle = document.getElementById('tracker-module-toggle-input');
    toggle?.addEventListener('change', event => { setOpenState(event.target.checked); render(); });
    panel.querySelectorAll('.tracker-module-step').forEach(button => button.addEventListener('click', () => changeMacro(button.dataset.field, Number(button.dataset.delta))));
    panel.querySelectorAll('.tracker-module-macro-field input').forEach(input => input.addEventListener('change', () => updateMacro(input.closest('label').querySelector('.tracker-module-step').dataset.field, input.value)));
  }

  function mount() {
    render();
    document.querySelector('.hm-link[data-page="tracker"]')?.addEventListener('click', () => setTimeout(render, 0));
  }

  return { id:'tracker', label:'Tracker Manuale', status:'modular', mount, render };
}
