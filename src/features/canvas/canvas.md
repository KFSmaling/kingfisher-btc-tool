# Module: Canvas Dashboard

## Scope
Hoofd-UI: canvas-selector, 7-blok grid, block-panels, consistentie-check, tips, project-info.
App.js is de orchestrator; alle UI-componenten zitten in deze feature-module.

## Bestanden
```
src/features/canvas/
├── index.js                          — public API (barrel)
└── components/
    ├── BlockCard.jsx                 — dashboard kaart per BTC-blok
    │   exports: BlockCard (default), BLOCKS, PILLAR_SUBTABS, PRINCIPLES_SUBTABS,
    │            EXAMPLE_BULLETS, STATUS_COLORS, STATUS_BADGE_KEYS,
    │            SEV_COLOR, SEV_TEXT, scoreBlock, getBlockStatus, runConsistencyCheck
    ├── BlockPanel.jsx                — sliding side-panel (Extract / Review / Canvas tabs)
    ├── TipsModal.jsx                 — tips & tricks modal (NL + EN per blok)
    │   exports: TipsModal (default), TIPS_DATA
    ├── ConsistencyModal.jsx          — consistentie-analyse modal met scores per blok
    ├── CanvasMenu.jsx                — canvas-selector dropdown (nieuw/hernoemen/verwijderen)
    ├── ProjectInfoSidebar.jsx        — project-metadata sidebar (klant, branche, status)
    └── StrategyStatusBlock.jsx       — strategie-kaart op dashboard (status monitor + Verdiep-knop)
```

## DB-tabellen
- **canvases**: id, user_id, name, blocks jsonb, data jsonb, updated_at + meta-velden
  - `blocks`: `{ docs, insights, bullets }` per block_key
  - `data`: `{ [blockKey]: { details: { manual, ai_insights } } }`
  - meta: client_name, author_name, industry, transformation_type, org_size, project_status, project_description
- **block_definitions**: key, label_nl, label_en, ai_prompt, sort_order, is_active

Service: `src/shared/services/canvas.service.js`

## BTC-blokken (BLOCKS constante in BlockCard.jsx)
| id | layout | subTabs |
|---|---|---|
| strategy | wide | geen (eigen Werkblad via DeepDiveOverlay) |
| principles | wide | PRINCIPLES_SUBTABS (generic/customers/processes/people/technology) |
| customers | quarter | PILLAR_SUBTABS (current/tobe/change) |
| processes | quarter | PILLAR_SUBTABS |
| people | quarter | PILLAR_SUBTABS |
| technology | quarter | PILLAR_SUBTABS |
| portfolio | wide | geen |

Labels worden via `useLang()` / `t(block.titleKey)` opgehaald — IP-beschermd in block_definitions tabel.

## Canvas state (in App.js — AppInner)
```js
scope:          string          // canvas naam
docs:           { [blockKey]: string[] }
insights:       { [blockKey]: Insight[] }
bullets:        { [blockKey]: Bullet[] }
meta:           { client_name, author_name, industry, transformation_type, org_size, project_status, project_description }
activeCanvasId: string | null
canvases:       Canvas[]        // lijst van gebruikerscanvassen incl. canvas_uploads count
```

## Autosave
Debounced 1500ms na elke wijziging → `upsertCanvas(id, { scope, docs, insights, bullets, meta })`

## Scoring & consistentie
`scoreBlock(bullets)` — 0-100 score op basis van aantal + specificiteit bullets  
`runConsistencyCheck(bullets)` — detecteert inconsistenties tussen blokken  
Beide functies zitten in `BlockCard.jsx` en worden geïmporteerd door `ConsistencyModal.jsx` en `App.js`

## Props contract (BlockCard)
```jsx
<BlockCard block={Block} status={string} bullets={Bullet[]} insightCount={number} onClick={fn} />
```

## Props contract (BlockPanel)
```jsx
<BlockPanel
  block={Block} docs={string[]} insights={Insight[]} bullets={Bullet[]}
  canvasId={string} userId={string}
  onClose={fn} onDocsChange={fn} onInsightAccept={fn} onInsightReject={fn}
  onMoveToBullets={fn} onDeleteBullet={fn} onAddBullet={fn} onShowTips={fn}
/>
```

## Aandachtspunten
- `StrategyStatusBlock` toont executive_summary uit `data.strategy.details.manual` — dit veld wordt gevuld vanuit het Strategie Werkblad
- Canvas verwijderen cascade: canvases → canvas_uploads → document_chunks (FK CASCADE)
- Canvas-selector toont aanmaakdatum + doc-count (`canvas_uploads(id)` meegeladen)
