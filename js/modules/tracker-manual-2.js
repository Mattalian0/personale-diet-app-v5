const STORAGE_KEY = 'newProjectDiet_trackerManual2_v1';
const MEALS = ['Colazione', 'Merenda 1', 'Pranzo', 'Merenda 2', 'Cena'];

function readRows() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    return saved && typeof saved === 'object' ? saved : Object.fromEntries(MEALS.map(meal => [meal, []]));
  } catch (error) {
    return Object.fromEntries(MEALS.map(meal => [meal, []]));
  }
}
function saveRows(rows) { localStorage.setItem(STORAGE_KEY, JSON.stringify(rows)); }
function foods() { return window.DietLegacy?.getFoods?.() || []; }
function profileWeight() { return Number(window.DietLegacy?.getProfile?.()?.peso) || 0; }
function goalSettings() { return window.DietLegacy?.getGoalSettings?.() || { protGkg:2, grassiGkg:1, carboGkg:2 }; }
function foodByName(name) { return foods().find(food => food.name === name); }
function nutrition(food, grams) { const factor = (Number(grams) || 0) / 100; return { kcal:factor * (food?.kcal || 0), protein:factor * (food?.prot || 0), carbs:factor * (food?.carbo || 0), fat:factor * (food?.grassi || 0) }; }

export function createTrackerManual2Module() {
  let rows = readRows();
  const gramsPerKg = grams => { const weight = profileWeight(); return weight > 0 ? Number((Number(grams || 0) / weight).toFixed(2)) : 0; };
  const update = (meal,index,field,value) => { if (!rows[meal]?.[index]) return; rows[meal][index][field] = field === 'grams' ? Math.max(0,Number(value)||0) : value; saveRows(rows); render(); };
  const adjust = (meal,index,delta) => { const item=rows[meal]?.[index]; if (!item) return; update(meal,index,'grams',Math.max(0,Math.round(((Number(item.grams)||0)+delta)/5)*5)); };
  const remove = (meal,index) => { rows[meal].splice(index,1); saveRows(rows); render(); };
  const add = meal => { rows[meal].push({food:foods()[0]?.name||'',grams:100}); saveRows(rows); render(); };
  const totals = () => MEALS.reduce((total,meal) => rows[meal].reduce((sum,item) => { const n=nutrition(foodByName(item.food),item.grams); return {kcal:sum.kcal+n.kcal,protein:sum.protein+n.protein,carbs:sum.carbs+n.carbs,fat:sum.fat+n.fat}; },total),{kcal:0,protein:0,carbs:0,fat:0});
  const percent = (value,target) => target > 0 ? Math.min(100,Math.round(value / target * 100)) : 0;
  function renderSticky(total, settings) {
    const bar = document.getElementById('sticky-totals-tracker2'); const inner = document.getElementById('sticky-totals-tracker2-inner');
    if (!bar || !inner) return;
    const weight = profileWeight();
    const targets = { kcal:Number(settings.targetKcal)||0, prot:weight * (Number(settings.protGkg)||0), grassi:weight * (Number(settings.grassiGkg)||0), carbo:weight * (Number(settings.carboGkg)||0) };
    const donut = (label,current,target,color,unit) => { const pct=target>0?Math.min(current/target,1.5):0; const r=30,cx=36,cy=36,stroke=6,circ=2*Math.PI*r,dash=Math.min(pct,1)*circ; const display=`${Math.round(current)}${unit||''}`; const targetDisplay=`${target.toFixed(0)}${unit||''}`; return `<div class="sticky-donut"><svg viewBox="0 0 72 72" width="72" height="72"><circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="${stroke}"/><circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${pct>1.05?'#ff4444':pct>=.95?'#44ff88':color}" stroke-width="${stroke}" stroke-dasharray="${dash.toFixed(1)} ${circ.toFixed(1)}" stroke-linecap="round" transform="rotate(-90 ${cx} ${cy})"/><text x="${cx}" y="${cy-2}" text-anchor="middle" fill="white" font-size="11" font-weight="bold">${display}</text><text x="${cx}" y="${cy+10}" text-anchor="middle" fill="rgba(255,255,255,.5)" font-size="7">/ ${targetDisplay}</text></svg><div class="sticky-donut-label">${label}</div></div>`; };
    const diff=Math.round(total.kcal-targets.kcal); const kcColor=Math.abs(diff)<=50?'#44ff88':diff>50?'#ff4444':'#ffaa33';
    inner.innerHTML=donut(`Kcal (${diff>=0?'+':''}${diff})`,total.kcal,targets.kcal,kcColor,'')+donut('Proteine',total.protein,targets.prot,'#4fc3f7','g')+donut('Grassi',total.fat,targets.grassi,'#ffb74d','g')+donut('Carboidrati',total.carbs,targets.carbo,'#81c784','g');
    bar.classList.toggle('show', document.getElementById('page-tracker2')?.classList.contains('active'));
  }
  const card = (label, grams, target) => `<article class="tracker2-macro-card"><div class="tracker2-macro-label">${label}</div><div class="tracker2-macro-value">${gramsPerKg(grams).toFixed(2)} g/kg</div><div class="tracker2-macro-target">target: ${(Number(target)||0).toFixed(2)} g/kg · ${percent(gramsPerKg(grams),Number(target)||0)}%</div><div class="tracker2-progress"><span style="width:${percent(gramsPerKg(grams),Number(target)||0)}%"></span></div></article>`;

  function render() {
    const root=document.getElementById('tracker2-content'); if (!root) return;
    window.DietLegacy?.renderProfileTargets?.('tracker2-profile-targets');
    const total=totals(); const settings=goalSettings(); const weight=profileWeight(); renderSticky(total, settings); const macroKcal=total.protein*4+total.carbs*4+total.fat*9; const cPct=macroKcal?Math.round(total.carbs*4/macroKcal*100):0; const pPct=macroKcal?Math.round(total.protein*4/macroKcal*100):0; const fPct=macroKcal?Math.round(total.fat*9/macroKcal*100):0;
    root.innerHTML = `<section class="tracker2-numbers"><h2>I Tuoi Numeri</h2><p class="sub-desc">Totali raggiunti dagli alimenti inseriti, espressi in grammi per kg di peso corporeo.</p><div class="tracker2-macro-grid">${card('Proteine',total.protein,settings.protGkg)}${card('Grassi',total.fat,settings.grassiGkg)}${card('Carboidrati',total.carbs,settings.carboGkg)}</div><div class="tracker2-distribution"><span style="width:${cPct}%">C ${cPct}%</span><span style="width:${pPct}%">P ${pPct}%</span><span style="width:${fPct}%">G ${fPct}%</span></div><div class="tracker2-profile-line"><span>Peso profilo: <strong>${weight.toFixed(1)} kg</strong></span><span>Totale: <strong>${Math.round(total.kcal)} kcal</strong></span></div></section>${MEALS.map(meal => `<section class="tracker2-meal"><header><h3>${meal}</h3><span>${rows[meal].length} alimenti</span></header>${rows[meal].map((item,index) => { const food=foodByName(item.food); const n=nutrition(food,item.grams); return `<div class="tracker2-row"><select data-action="food" data-meal="${meal}" data-index="${index}" aria-label="Alimento">${foods().map(option => `<option value="${option.name}" ${option.name===item.food?'selected':''}>${option.name}</option>`).join('')}</select><div class="tracker2-grams"><input type="number" inputmode="decimal" min="0" step="5" value="${item.grams}" data-action="grams" data-meal="${meal}" data-index="${index}" aria-label="Grammi"><button type="button" data-action="plus" data-meal="${meal}" data-index="${index}" aria-label="Aumenta grammi">+</button><button type="button" data-action="minus" data-meal="${meal}" data-index="${index}" aria-label="Diminuisci grammi">−</button></div><span>${gramsPerKg(item.grams).toFixed(2)} g/kg</span><span>${Math.round(n.kcal)} kcal</span><span>P ${n.protein.toFixed(1)}g</span><span>C ${n.carbs.toFixed(1)}g</span><button type="button" class="tracker2-remove" data-action="remove" data-meal="${meal}" data-index="${index}" aria-label="Rimuovi alimento">×</button></div>`;}).join('')}<button type="button" class="tracker2-add" data-action="add" data-meal="${meal}">+ Aggiungi alimento</button></section>`).join('')}`;
    root.querySelectorAll('[data-action]').forEach(control => control.addEventListener('change', event => { const el=event.currentTarget; const meal=el.dataset.meal; const index=Number(el.dataset.index); if(el.dataset.action==='food') update(meal,index,'food',el.value); if(el.dataset.action==='grams') update(meal,index,'grams',el.value); }));
    root.querySelectorAll('[data-action="plus"]').forEach(button => button.addEventListener('click',()=>adjust(button.dataset.meal,Number(button.dataset.index),5)));
    root.querySelectorAll('[data-action="minus"]').forEach(button => button.addEventListener('click',()=>adjust(button.dataset.meal,Number(button.dataset.index),-5)));
    root.querySelectorAll('[data-action="remove"]').forEach(button => button.addEventListener('click',()=>remove(button.dataset.meal,Number(button.dataset.index))));
    root.querySelectorAll('[data-action="add"]').forEach(button => button.addEventListener('click',()=>add(button.dataset.meal)));
  }
  function mount(){ render(); document.querySelectorAll('.hm-link').forEach(link => link.addEventListener('click', () => setTimeout(() => renderSticky(totals(), goalSettings()), 0))); }
  return {id:'tracker-manual-2',label:'Tracker Manuale 2',status:'modular',mount,render};
}
