# Module: Canvas Dashboard

## Scope
Hoofd-UI: canvas-selector, 7-blok grid, block-panels, upload-flow, autosave.
Nog volledig in App.js — extractie gepland voor Sprint 5+.

## Bestanden
```
src/features/canvas/
└── canvas.md               — dit bestand

src/shared/services/
└── canvas.service.js       — CRUD voor canvases + block_definitions
```

## DB-tabellen
- **canvases**: id, user_id, name, blocks jsonb, data jsonb, updated_at, + meta-velden
  - `blocks`: { docs, insights, bullets } per block_key
  - `data`: { [blockKey]: { details: { manual, ai_insights } } }
  - meta: client_name, author_name, industry, transformation_type, org_size, project_status, project_description
- **block_definitions**: key, label_nl, label_en, ai_prompt, sort_order, is_active

## Canvas state (in App.js)
```js
scope:    string       // canvas naam
docs:     { [blockKey]: string[] }
insights: { [blockKey]: string[] }
bullets:  { [blockKey]: string[] }
meta:     { client_name, author_name, ... }
activeCanvasId: string | null
canvases: Canvas[]     // lijst van gebruikerscanvassen
```

## Autosave
Debounced 1500ms na elke wijziging → `upsertCanvas(id, { scope, docs, insights, bullets, meta })`
Canvas wordt aangemaakt met `createCanvas` en daarna alleen nog geüpdated.

## Block-keys (7 BTC-blokken)
Worden dynamisch geladen via `fetchBlockDefinitions()` uit `block_definitions` tabel.
Volgorde bepaald door `sort_order`. Labels IP-beschermd in DB, niet in source.

## Canvas verwijderen
- Trash-icon op hover in canvas-dropdown (niet voor actief canvas)
- Inline bevestigingsbalk met canvasnaam + waarschuwing
- `deleteCanvas` cascade: verwijdert canvas → canvas_uploads → document_chunks (via FK CASCADE)
- Auto-switch naar volgend canvas na verwijdering
