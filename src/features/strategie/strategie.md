# Module: Strategie Werkblad

## Scope
Vervangt DeepDiveOverlay voor blockId="strategy". Geladen via React.lazy vanuit App.js.
Volledig zelfstandig — geen state-afhankelijkheid van App.js.

## Bestanden
```
src/features/strategie/
├── StrategieWerkblad.jsx   — hoofdcomponent + KsfKpiRow, ThemaAccordeon, AnalyseSection, WerkbladTextField
├── services/
│   └── strategy.service.js — CRUD voor strategy_core, analysis_items, strategic_themes, ksf_kpi
└── index.js                — public API: export { StrategieWerkblad }
```

## DB-tabellen (eigen)
- **strategy_core** (1:1 per canvas): missie, visie, ambitie, kernwaarden jsonb
- **analysis_items** (N per canvas): type extern|intern, content, tag, sort_order
- **strategic_themes** (max 7 per canvas): title, sort_order
- **ksf_kpi** (max 3+3 per thema): type ksf|kpi, description, current_value, target_value

Schema: zie `supabase-sprint4b.sql` in repo root

## AI-endpoints
- `/api/strategy` (Claude Sonnet) — `mode=themes` | `mode=ksf_kpi`
- `/api/magic` (gedeeld) — veld-specifieke RAG-suggesties via Supabase RPC
- `/api/improve` (gedeeld) — herschrijf-presets (4 stijlen)

## Props contract
```jsx
<StrategieWerkblad
  canvasId={string}      // verplicht — UUID van actief canvas
  onClose={fn}           // sluit overlay
  onManualSaved={fn}     // callback na autosave (optioneel)
/>
```

## State shape (StrategieWerkblad)
```js
core:         { missie, visie, ambitie, kernwaarden[] }
items:        AnalysisItem[]           // extern + intern gecombineerd
themas:       StrategicTheme[]         // incl. ksf_kpi[] per thema, max 7
drafts:       { [fieldKey]: string }   // amber overlay — nooit committed zonder acceptatie
magic:        { [fieldKey]: { loading, suggestion, citations, noChunks, error } }
themaDraft:   { loading, loadingMsg, lines[] } | null
ksfKpiDrafts: { [themaId]: { loading, loadingMsg, ksf[], kpi[] } }
```

## Gedeelde dependencies
- `src/shared/components/WandButton.jsx`
- `src/shared/components/MagicResult.jsx` (incl. useTypewriter hook)
- `src/shared/components/TagPill.jsx` (incl. EXTERN_TAGS, INTERN_TAGS)
- `src/shared/services/embedding.service.js` (searchDocumentChunks)
- `src/i18n.js` (useLang)

## Bekende beperkingen / aandachtspunten
- Draft state is niet persistent (browser refresh = weg)
- Full Draft autopilot doet geen Executie-velden (alleen Identiteit + Analyse)
- ksf_kpi max 3+3 enforcement zit client-side; server-side is er geen CHECK constraint
- Autosave via debounce (500ms) — snelle tik + sluit kan data missen
- Magic Staff werkt alleen als canvas geïndexeerde chunks heeft in document_chunks
