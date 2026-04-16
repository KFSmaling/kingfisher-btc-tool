# Module: Dossier (Het Dossier)

## Scope
Upload en indexeer brondocumenten per canvas. Beheert de volledige RAG-pipeline.
Wordt getoond als modal overlay vanuit App.js (`showDossier` state).

## Bestanden
```
src/features/dossier/
├── index.js                              — public API (barrel)
└── components/
    └── MasterImporterPanel.jsx           — upload UI + dossier-lijst + indexering
        exports: MasterImporterPanel (default), IMPORT_PHASES, extractFileText
```

## DB-tabellen
- **canvas_uploads**: file_name, raw_text, canvas_id, user_id, block_key, created_at
- **document_chunks**: parent|child chunks met pgvector embeddings (1536 dims)
  - parent: ~1000 chars context, geen embedding, page_number
  - child: ~200 chars, embedding vector(1536), parent_id FK, page_number
- **import_jobs**: status tracking per upload (queued → uploading → reading → indexing → done|error)

Service: `src/shared/services/dossier.service.js` + `src/shared/services/embedding.service.js`

## RAG Pipeline (in MasterImporterPanel.jsx)
```
Upload (PDF / PPTX / TXT / CSV)
  → extractFileText(file)           — client-side, JSZip (PPTX) / pdfjs (PDF)
  → createImportJob                 — status tracking in import_jobs
  → uploadDocumentToStorage         — opslag in Supabase Storage bucket 'documents'
  → saveCanvasUpload                — raw_text + metadata in canvas_uploads, geeft uploadId terug
  → indexDocumentChunks(uploadId, canvasId, rawText)
      → parent chunks (~1000 chars, 200 overlap) — opgeslagen zonder embedding
      → child chunks (~200 chars, 50 overlap)
          → /api/embed (OpenAI text-embedding-3-small, 1536 dims)
          → opgeslagen in document_chunks met embedding vector
  → updateImportJob(status: done)
  → refreshFiles()                  — herlaad canvas_uploads lijst
```

## page_number extractie
Tijdens `indexDocumentChunks` worden `[Slide X]` en `[Pagina X]` markers herkend via regex:
```js
const match = text.match(/\[(Slide|Pagina|Page|Notes)\s+(\d+)\]/i);
```
Zowel parent als child chunks krijgen een `page_number` kolom. Gebruikt in Magic Staff bronattributie.

## Supabase RPC (handmatig aanmaken in SQL Editor)
```sql
CREATE OR REPLACE FUNCTION match_document_chunks(
  query_embedding vector(1536),
  match_canvas_id uuid,
  match_count int DEFAULT 5
) RETURNS TABLE (id uuid, content text, file_name text, page_number int, distance float)
LANGUAGE sql STABLE AS $$
  SELECT dc.id, dc.content, cu.file_name, dc.page_number,
         (dc.embedding <=> query_embedding)::float AS distance
  FROM document_chunks dc
  LEFT JOIN canvas_uploads cu ON dc.upload_id = cu.id
  WHERE dc.chunk_type = 'child'
    AND dc.canvas_id = match_canvas_id
    AND dc.embedding IS NOT NULL
  ORDER BY dc.embedding <=> query_embedding
  LIMIT match_count;
$$;
```

## Props contract (MasterImporterPanel)
```jsx
<MasterImporterPanel canvasId={string} userId={string} onClose={fn} />
```

## IMPORT_PHASES (faseringsconstante)
```js
{ queued, uploading, reading, indexing, done, error }
// elk heeft: label, pct (0-100), color (Tailwind bg-*)
```

## Ondersteunde bestandstypen
| type | parser |
|---|---|
| .pdf | pdfjs-dist — tekst per pagina met `[Pagina X]` marker |
| .pptx | JSZip — slide XML + notes met `[Slide X]` / `[Notes X]` marker |
| .txt | TextDecoder UTF-8 |
| .csv | TextDecoder UTF-8 |

## Aandachtspunten
- Upload altijd vanuit het juiste actieve canvas (canvas_id wordt meegestuurd bij elke stap)
- Documenten zijn canvas-specifiek — niet gedeeld tussen canvassen
- Delete cascade: `canvas_uploads` verwijderen cascade naar `document_chunks` via FK
- Magic Staff werkt alleen als canvas geïndexeerde chunks heeft (`countIndexedChunks`)
- raw_text wordt afgekapt op 10.000 chars in canvas_uploads; volledige tekst gaat naar document_chunks
