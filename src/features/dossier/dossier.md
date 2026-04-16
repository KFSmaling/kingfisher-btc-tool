# Module: Dossier (Het Dossier)

## Scope
Upload en indexeer brondocumenten per canvas. Beheert de volledige RAG-pipeline.
Componenten nog in App.js (`MasterImporterPanel`) — extractie gepland voor Sprint 5.

## Bestanden
```
src/features/dossier/
└── dossier.md               — dit bestand

src/shared/services/
├── dossier.service.js        — CRUD voor canvas_uploads
└── embedding.service.js      — RAG pipeline (indexeren, embedden, zoeken)
```

## DB-tabellen
- **canvas_uploads**: file_name, raw_text, canvas_id, user_id, block_key, created_at
- **document_chunks**: parent|child chunks met pgvector embeddings (1536 dims)
  - parent: ~1000 chars context, geen embedding
  - child: ~200 chars, embedding vector(1536), parent_id FK
- **import_jobs**: status tracking per upload (queued → uploading → reading → indexing → done|error)

## RAG Pipeline
```
Upload (PDF/PPTX/TXT/CSV)
  → extractFileText (client-side, JSZip/pdfjs)
  → saveCanvasUpload (canvas_uploads tabel)
  → indexDocumentChunks
      → parent chunks (1000 chars, 200 overlap)
      → child chunks (200 chars, 50 overlap) → /api/embed → vector(1536)
      → opgeslagen in document_chunks
```

## Supabase RPC (handmatig aanmaken in SQL Editor)
```sql
CREATE OR REPLACE FUNCTION match_document_chunks(
  query_embedding vector(1536),
  match_canvas_id uuid,
  match_count int DEFAULT 5
) RETURNS TABLE (id uuid, content text, file_name text, page_number int, distance float)
```

## Aandachtspunten
- Upload altijd vanuit het juiste actieve canvas (canvas_id wordt meegestuurd)
- page_number wordt geëxtraheerd uit [Slide X] / [Pagina X] markers in tekst
- Documenten zijn canvas-specifiek — niet gedeeld tussen canvassen
- Delete cascade: canvas_uploads verwijderen cascade naar document_chunks via FK
