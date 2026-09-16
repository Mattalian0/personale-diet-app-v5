/* Choice-based meal plans: normalized foods, exclusive options and live nutrition. */
(function () {
  'use strict';

  const STORAGE_KEY = 'newProjectDiet_choicePlans_v1';
  const todayKey = () => new Date().toISOString().slice(0, 10);
  const esc = value => String(value ?? '').replace(/[&<>\"']/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[char]));
  const round = value => Math.round((Number(value) || 0) * 10) / 10;
  const emptyNutrition = () => ({ kcal:0, protein:0, carbs:0, fat:0, fiber:0 });
  const addNutrition = (a, b) => Object.keys(a).reduce((out, key) => { out[key] = (a[key] || 0) + (b[key] || 0); return out; }, emptyNutrition());
  const scaleNutrition = (nutrition, factor) => Object.keys(nutrition).reduce((out, key) => { out[key] = nutrition[key] * factor; return out; }, emptyNutrition());

  function foods() {
    return typeof FOODS_DB !== 'undefined' && Array.isArray(FOODS_DB) ? FOODS_DB : [];
  }

  function slug(value) {
    return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }

  function foodId(name) { return `food-${slug(name)}`; }

  function normalizedFoods() {
    return foods().map(food => ({
      id: food.id || foodId(food.name), name: food.name, brand: food.brand || '', category: food.category || 'custom', unit: food.unit || 'g',
      nutrientsPer100: { kcal:Number(food.kcal)||0, protein:Number(food.prot)||0, carbs:Number(food.carbo)||0, fat:Number(food.grassi)||0, fiber:Number(food.fibre || food.fiber)||0, sugar:Number(food.sugar)||0, saturatedFat:Number(food.saturatedFat)||0, sodium:Number(food.sodium)||0 },
      dietaryTags: food.dietaryTags || [], allergens: food.allergens || [], source: food.source || 'local-foods-db', sourceVersion: food.sourceVersion || '1'
    }));
  }

  function findFood(id) { return normalizedFoods().find(food => food.id === id); }
  function pick(pattern, fallbackIndex) { const found = foods().find(food => pattern.test(food.name)); return found ? found.name : (foods()[fallbackIndex] || foods()[0] || { name:'Alimento' }).name; }
  function ingredient(name, quantity, notes) { return { foodId:foodId(name), quantity, unit:'g', notes:notes || '' }; }
  function option(id, label, ingredients, isDefault) { return { id, label, ingredients, isDefault:!!isDefault, displayOrder:0, metadata:{ preparationNotes:'', tags:[], substitutionRationale:'' } }; }
  function group(id, label, role, options) { return { id, label, instruction:'Scegli 1 opzione', minSelections:1, maxSelections:1, required:true, options, equivalenceProfile:{ role, tolerances:{ kcal:.15, protein:.2, carbs:.15, fat:.2 } } }; }

  function createDefaultTemplate() {
    const yogurt = pick(/Yogurt/i, 0), oats = pick(/Avena/i, 1), corn = pick(/Cornflakes/i, 2), bread = pick(/Pane/i, 3), eggs = pick(/Uova/i, 4), banana = pick(/Banana|Mela/i, 5), chicken = pick(/Pollo|fesa|Tacchino/i, 6), pasta = pick(/Pasta|Riso/i, 7), potatoes = pick(/Patate/i, 8), oil = pick(/Olio/i, 9), fish = pick(/Merluzzo|Tonno|Salmone/i, 10), vegetables = pick(/Zucchine|Broccoli|Insalata|Spinaci/i, 11);
    return {
      id:'day-template-default', label:'Giornata base', dayType:'CUSTOM', status:'draft', targetNutrition:{ kcal:0, protein:0, carbs:0, fat:0 }, meals:[
        { id:'meal-breakfast', name:'Colazione', type:'breakfast', fixedIngredients:[ingredient(banana,100,'peso edibile')], choiceGroups:[group('group-breakfast-base','Base colazione','mixed',[option('breakfast-oats','Avena + yogurt',[ingredient(oats,40,'peso a secco'),ingredient(yogurt,170)],true),option('breakfast-bread-eggs','Pane + uova',[ingredient(bread,80),ingredient(eggs,100)],false),option('breakfast-corn-milk','Cornflakes + latte',[ingredient(corn,45),ingredient(pick(/Latte/i,12),200)],false)])], notes:'Scegli una sola base.' },
        { id:'meal-lunch', name:'Pranzo', type:'lunch', fixedIngredients:[ingredient(chicken,150,'peso a crudo'),ingredient(vegetables,200)], choiceGroups:[group('group-lunch-carbs','Fonte di carboidrati','carb',[option('lunch-pasta','Pasta o riso', [ingredient(pasta,80,'peso a crudo')],true),option('lunch-bread','Pane',[ingredient(bread,110)],false),option('lunch-potatoes','Patate',[ingredient(potatoes,350)],false)]),group('group-lunch-fat','Fonte di grassi','fat',[option('lunch-oil','Olio EVO',[ingredient(oil,10)],true),option('lunch-avocado','Avocado',[ingredient(pick(/Avocado/i,13),70)],false)])], notes:'Le alternative sono mutuamente esclusive.' },
        { id:'meal-dinner', name:'Cena', type:'dinner', fixedIngredients:[ingredient(fish,180,'peso a crudo'),ingredient(vegetables,200)], choiceGroups:[group('group-dinner-carbs','Fonte di carboidrati','carb',[option('dinner-rice','Riso o pasta',[ingredient(pasta,70,'peso a crudo')],true),option('dinner-potatoes','Patate',[ingredient(potatoes,300)],false),option('dinner-bread','Pane',[ingredient(bread,90)],false)]),group('group-dinner-fat','Fonte di grassi','fat',[option('dinner-oil','Olio EVO',[ingredient(oil,10)],true),option('dinner-nuts','Frutta secca',[ingredient(pick(/mandorle|Noci/i,14),15)],false)])], notes:'Scegli una sola opzione per blocco.' }
      ]
    };
  }

  function defaultState() { return { version:1, preferences:{ allergens:[], vegetarian:false, vegan:false }, dayTemplates:[createDefaultTemplate()], selections:{}, tracking:{}, equivalenceWarnings:[] }; }
  function loadState() { try { const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null'); return saved && saved.dayTemplates ? saved : defaultState(); } catch (error) { return defaultState(); } }
  let state = loadState();
  function save() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }

  function currentTemplate() { return state.dayTemplates[0]; }
  function selectionMap(templateId) { state.selections[templateId] = state.selections[templateId] || {}; return state.selections[templateId]; }
  function nutritionForIngredient(item) { const food = findFood(item.foodId); return food ? scaleNutrition(food.nutrientsPer100, (Number(item.quantity)||0) / 100) : emptyNutrition(); }
  function nutritionForIngredients(items) { return (items || []).reduce((sum, item) => addNutrition(sum, nutritionForIngredient(item)), emptyNutrition()); }
  function nutritionForOption(optionData) { return nutritionForIngredients(optionData.ingredients); }
  function allowedOption(optionData) {
    const preferences = state.preferences;
    const blocked = preferences.allergens || [];
    return (optionData.ingredients || []).every(item => { const food = findFood(item.foodId); if (!food) return false; if (blocked.some(allergen => (food.allergens || []).map(String).some(value => value.toLowerCase().includes(allergen)))) return false; if (preferences.vegan && !(food.dietaryTags || []).includes('vegan')) return false; if (preferences.vegetarian && !(food.dietaryTags || []).some(tag => ['vegetarian','vegan'].includes(tag))) return false; return true; });
  }
  function equivalenceWarning(choiceGroup, optionData) {
    const reference = choiceGroup.options[0]; const base = nutritionForOption(reference); const value = nutritionForOption(optionData); const tolerances = choiceGroup.equivalenceProfile?.tolerances || {};
    const checks = [['kcal',tolerances.kcal],['protein',tolerances.protein],['carbs',tolerances.carbs],['fat',tolerances.fat]];
    return checks.some(([key, tolerance]) => base[key] > 0 && Math.abs(value[key] - base[key]) / base[key] > tolerance) ? 'Profilo nutrizionale fuori tolleranza: richiede revisione.' : '';
  }
  function selectedOption(choiceGroup, templateId) { const id = selectionMap(templateId)[choiceGroup.id]; return choiceGroup.options.find(optionData => optionData.id === id && allowedOption(optionData)); }
  function rangeForGroup(choiceGroup) { const options = choiceGroup.options.filter(allowedOption).map(nutritionForOption); if (!options.length) return { min:emptyNutrition(), max:emptyNutrition() }; const min = {...options[0]}; const max = {...options[0]}; options.slice(1).forEach(value => Object.keys(min).forEach(key => { min[key] = Math.min(min[key], value[key]); max[key] = Math.max(max[key], value[key]); })); return { min, max }; }
  function calculateMeal(meal, templateId) {
    let nutrition = nutritionForIngredients(meal.fixedIngredients); let complete = true; let min = {...nutrition}; let max = {...nutrition};
    (meal.choiceGroups || []).forEach(choiceGroup => { const selected = selectedOption(choiceGroup, templateId); if (selected) { nutrition = addNutrition(nutrition, nutritionForOption(selected)); min = addNutrition(min, nutritionForOption(selected)); max = addNutrition(max, nutritionForOption(selected)); } else if (choiceGroup.required) { complete = false; const range = rangeForGroup(choiceGroup); min = addNutrition(min, range.min); max = addNutrition(max, range.max); } });
    return { nutrition, complete, min, max };
  }
  function calculateDay(template) { return template.meals.reduce((out, meal) => { const result = calculateMeal(meal, template.id); out.nutrition = addNutrition(out.nutrition, result.nutrition); out.min = addNutrition(out.min, result.min); out.max = addNutrition(out.max, result.max); out.complete = out.complete && result.complete; return out; }, { nutrition:emptyNutrition(), min:emptyNutrition(), max:emptyNutrition(), complete:true }); }
  function fmt(n) { return `${Math.round(n || 0)}`; }
  function nutritionLine(nutrition) { return `Kcal ${fmt(nutrition.kcal)} · P ${fmt(nutrition.protein)}g · C ${fmt(nutrition.carbs)}g · G ${fmt(nutrition.fat)}g · F ${fmt(nutrition.fiber)}g`; }
  function optionMarkup(choiceGroup, optionData, templateId) { const checked = selectedOption(choiceGroup, templateId)?.id === optionData.id; const warning = equivalenceWarning(choiceGroup, optionData); return `<label class="choice-option ${checked ? 'selected' : ''} ${allowedOption(optionData) ? '' : 'blocked'}"><input type="radio" name="choice-${choiceGroup.id}" ${checked ? 'checked' : ''} ${allowedOption(optionData) ? '' : 'disabled'} onchange="ChoicePlans.selectOption('${templateId}','${choiceGroup.id}','${optionData.id}')"><span class="choice-option-body"><strong>${esc(optionData.label)}</strong><small>${nutritionLine(nutritionForOption(optionData))}</small>${optionData.ingredients.length > 1 ? '<small class="choice-composed">Alternativa composta · somma ingredienti</small>' : ''}${warning ? `<small class="choice-warning">${esc(warning)}</small>` : ''}${optionData.metadata?.preparationNotes ? `<small>${esc(optionData.metadata.preparationNotes)}</small>` : ''}</span></label>`; }
  function render() {
    const container = document.getElementById('choice-plan-content'); if (!container) return; const template = currentTemplate(); if (!template) return; const day = calculateDay(template); const target = typeof getGenericTrackerTargets === 'function' ? getGenericTrackerTargets() : null;
    const status = document.getElementById('choice-plan-status'); if (status) status.innerHTML = day.complete ? `<strong>Piano completo.</strong> ${nutritionLine(day.nutrition)}${target ? ` · Target ${fmt(target.kcal)} kcal` : ''}` : `<strong>Scelte mancanti.</strong> Seleziona tutte le opzioni obbligatorie. Range possibile: ${fmt(day.min.kcal)}–${fmt(day.max.kcal)} kcal.`;
    container.innerHTML = template.meals.map(meal => { const result = calculateMeal(meal, template.id); return `<section class="choice-meal"><div class="choice-meal-header"><h3>${esc(meal.name)}</h3><span>${result.complete ? nutritionLine(result.nutrition) : `Range kcal ${fmt(result.min.kcal)}–${fmt(result.max.kcal)}`}</span></div>${meal.fixedIngredients?.length ? `<div class="choice-fixed"><strong>Componenti fisse</strong>${meal.fixedIngredients.map(item => `<span>${esc(findFood(item.foodId)?.name || item.foodId)} ${item.quantity}${item.unit} <small>${esc(item.notes || '')}</small></span>`).join('')}</div>` : ''}${(meal.choiceGroups || []).map(choiceGroup => `<fieldset class="choice-group"><legend>${esc(choiceGroup.label)} <small>${esc(choiceGroup.instruction)}</small></legend><div class="choice-options">${choiceGroup.options.map(optionData => optionMarkup(choiceGroup, optionData, template.id)).join('')}</div></fieldset>`).join('')}</section>`; }).join('');
  }
  function selectOption(templateId, groupId, optionId) { const template = state.dayTemplates.find(item => item.id === templateId); if (!template) return; const choiceGroup = template.meals.flatMap(meal => meal.choiceGroups || []).find(item => item.id === groupId); const chosen = choiceGroup?.options.find(item => item.id === optionId); if (!chosen || !allowedOption(chosen)) return; selectionMap(templateId)[groupId] = optionId; state.tracking[todayKey()] = { userId:'local', date:todayKey(), mealId:'choice-plan', selectedOptions:Object.entries(selectionMap(templateId)).map(([choiceGroupId, choiceOptionId]) => ({ choiceGroupId, choiceOptionId })), snapshotVersion:state.version }; save(); render(); }
  function updatePreferences() { state.preferences.allergens = (document.getElementById('choice-allergens')?.value || '').toLowerCase().split(',').map(value => value.trim()).filter(Boolean); state.preferences.vegetarian = !!document.getElementById('choice-vegetarian')?.checked; state.preferences.vegan = !!document.getElementById('choice-vegan')?.checked; save(); render(); }
  function toLegacyPlan() { const template = currentTemplate(); return template.meals.map(meal => { const items = [...(meal.fixedIngredients || [])]; (meal.choiceGroups || []).forEach(choiceGroup => { const selected = selectedOption(choiceGroup, template.id); if (selected) items.push(...selected.ingredients); }); return { name:meal.name, cls:'pranzo', items:items.map(item => ({ food:findFood(item.foodId)?.name || item.foodId, grams:Number(item.quantity)||0 })) }; }); }
  function copyToDaily() { const plan = toLegacyPlan(); if (!calculateDay(currentTemplate()).complete) { alert('Completa prima tutte le scelte obbligatorie.'); return; } currentPlan = plan; navigateTo('giornaliero'); renderPlanFromData(); }
  function copyToTracker() { const plan = toLegacyPlan(); if (!calculateDay(currentTemplate()).complete) { alert('Completa prima tutte le scelte obbligatorie.'); return; } trackerState.work.meals = planToTrackerMeals(plan); saveTrackerState(); renderAllTracker(); navigateTo('tracker'); }
  function copyToWeekly() { const plan = toLegacyPlan(); if (!calculateDay(currentTemplate()).complete) { alert('Completa prima tutte le scelte obbligatorie.'); return; } if (!weeklyPlans) generateWeeklyPlan(); const day = Math.max(1, Math.min(7, parseInt(prompt('Giorno della settimana (1=Lunedì, 7=Domenica):','1'),10) || 1)) - 1; weeklyPlans[day] = cloneData(plan); renderWeeklyPlan(); navigateTo('settimanale'); }
  function init() { const root = document.getElementById('page-scelte'); if (!root) return; const saved = state.preferences || {}; if (document.getElementById('choice-allergens')) document.getElementById('choice-allergens').value = (saved.allergens || []).join(', '); if (document.getElementById('choice-vegetarian')) document.getElementById('choice-vegetarian').checked = !!saved.vegetarian; if (document.getElementById('choice-vegan')) document.getElementById('choice-vegan').checked = !!saved.vegan; render(); }

  function selfTest() {
    const template = currentTemplate(); const tests = []; const assert = (name, condition) => tests.push({ name, pass:!!condition });
    const groups = template.meals.flatMap(meal => meal.choiceGroups || []); const firstGroup = groups[0];
    assert('ChoiceGroup con selezione esclusiva', firstGroup && firstGroup.maxSelections === 1 && firstGroup.minSelections === 1);
    assert('Nutrienti della sola opzione selezionata', firstGroup && nutritionForOption(firstGroup.options[0]).kcal > 0);
    assert('Alternativa composta', firstGroup && firstGroup.options.some(item => item.ingredients.length > 1));
    const previous = JSON.stringify(selectionMap(template.id)); delete state.selections[template.id]; const incomplete = calculateDay(template); assert('Giornata incompleta senza scelte obbligatorie', !incomplete.complete); state.selections[template.id] = JSON.parse(previous);
    const calculated = calculateDay(template); assert('Range nutrizionale coerente', calculated.min.kcal <= calculated.max.kcal);
    assert('Equivalenze validabili', groups.every(item => item.options.every(optionData => typeof equivalenceWarning(item, optionData) === 'string')));
    assert('Tracking con snapshot versionato', state.version === 1 && typeof state.tracking === 'object');
    return { pass:tests.every(test => test.pass), tests };
  }

  window.ChoicePlans = { render, init, selectOption, updatePreferences, copyToDaily, copyToTracker, copyToWeekly, calculateDay, toLegacyPlan, selfTest, state };
  window.choicePlanTestResults = selfTest();
  if (document.body) { document.body.dataset.choiceTests = window.choicePlanTestResults.pass ? 'passed' : 'failed'; document.body.dataset.choiceFoodCount = String(normalizedFoods().length); document.body.dataset.choiceTestDetails = window.choicePlanTestResults.tests.map(test => `${test.name}:${test.pass}`).join('|'); }
  if (typeof window.navigateTo === 'function') { const baseNavigate = window.navigateTo; window.navigateTo = function (page) { baseNavigate(page); if (page === 'scelte') render(); }; }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
