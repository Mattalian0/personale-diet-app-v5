# New Project Diet v5 — Modular Architecture

PWA statica per piano alimentare, tracker macro, generazione pasti e gestione database alimenti.

## Novita v2.4

- Modularizzazione in `css/styles.css`, `js/foods-db.js` e `js/app.js`
- Dashboard iniziale con riepilogo giornaliero
- Setup guidato iniziale
- Azioni rapide
- Backup export/import JSON
- Lista spesa automatica dal piano settimanale
- Auto adjust calorie basato sul trend peso settimanale
- Template pasti salvabili e riutilizzabili
- Copia Piano Giornaliero nel Tracker Manuale
- Usa Tracker Manuale come Piano Giornaliero
- Template giornata completa salvabili e caricabili
- Sostituzioni equivalenti anche nel Tracker Manuale
- Campo modificabile per kcal OFF rispetto agli ON
- Generazione piani ON/OFF con tolleranza kcal ±50
- Dashboard con profilo, giorni ON settimanali e target ON/OFF modificabili
- Setup guidato rimosso: profilo e giorni ON gestiti direttamente in Dashboard
- Target kcal Piano Giornaliero basato sui macro manuali ON/OFF
- Piano Settimanale editabile con chart macro per giornata aperta
- Sostituzioni ed eliminazione alimento/pasto nel Piano Settimanale
- Import giornaliero da singolo giorno settimanale ed export PDF settimana
- Aggiunta alimento, spostamento tra pasti e copia giorno nel Piano Settimanale
- Service worker aggiornato per cache dei nuovi asset
- Layout ottimizzato per iPhone: safe-area, viewport-fit=cover, tastiera numerica e touch target da 44px
- Tema chiaro/scuro con rilevamento preferenza di sistema e scelta manuale
- Storico peso con grafico SVG locale e base per auto-adjust
- Fibra alimentare inclusa nel CRUD del database
- Undo/redo locale per azioni distruttive e import/export JSON con validazione
- Tracker Manuale unificato con stepper grammature touch da 44px e profilo/calcolo replicato dalla Dashboard

## Pubblicazione GitHub Pages

Carica tutti i file di questa cartella nella root del repository e abilita GitHub Pages da `Settings > Pages`.

La app resta completamente statica: non richiede backend, build step o dipendenze esterne. Tutti i dati personali restano nel localStorage del browser e non vengono inviati a server.

## Struttura

```text
index.html
css/styles.css
js/foods-db.js
js/app.js
manifest.json
sw.js
icons/
README.md
```

## Verifica manuale rapida

- Apri la dashboard e verifica il giorno ON/OFF e i target.
- Aggiungi un alimento con fibre, modificalo, cercalo e rimuovilo; prova subito Undo.
- Inserisci un alimento nel tracker e controlla kcal e macro residue.
- Genera un piano giornaliero e settimanale, modifica una grammatura e genera la lista spesa.
- Registra almeno due pesi e verifica il grafico del trend.
- Esporta il backup, prova un JSON malformato e verifica il messaggio d’errore; poi importa il backup valido.
- Attiva/disattiva il tema e verifica il comportamento offline dopo il primo caricamento.

## Backup dati

Da `Gestione Alimenti` o dalla dashboard puoi esportare/importare un backup JSON con profilo, tracker, alimenti, calendario, piani settimanali e template.
