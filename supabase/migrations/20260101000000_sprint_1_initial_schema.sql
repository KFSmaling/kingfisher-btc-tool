-- ============================================================
-- Sprint 1 — Initieel schema
-- Business Transformation Canvas — Kingfisher & Partners
-- ============================================================

-- Vereist: pgvector extensie voor embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- ── canvases ─────────────────────────────────────────────────
-- Hoofdtabel: één canvas per project per gebruiker
CREATE TABLE IF NOT EXISTS canvases (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name                text NOT NULL DEFAULT 'Nieuw Canvas',
  blocks              jsonb NOT NULL DEFAULT '{}'::jsonb,
  data                jsonb NOT NULL DEFAULT '{}'::jsonb,

  -- Project metadata
  client_name         text,
  author_name         text,
  industry            text,
  transformation_type text,
  org_size            text,
  project_status      text,
  project_description text,

  created_at          timestamptz DEFAULT now(),
  updated_at          timestamptz DEFAULT now()
);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER canvases_updated_at
  BEFORE UPDATE ON canvases
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS
ALTER TABLE canvases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Eigen canvassen"
  ON canvases FOR ALL
  USING (user_id = auth.uid());

-- ── canvas_uploads ────────────────────────────────────────────
-- Geüploade documenten gekoppeld aan canvas + blok
CREATE TABLE IF NOT EXISTS canvas_uploads (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  canvas_id  uuid REFERENCES canvases(id) ON DELETE CASCADE,
  file_name  text NOT NULL,
  raw_text   text,
  content    jsonb,
  block_key  text,
  language   text DEFAULT 'nl',
  created_at timestamptz DEFAULT now(),

  UNIQUE (user_id, file_name)
);

ALTER TABLE canvas_uploads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Eigen uploads"
  ON canvas_uploads FOR ALL
  USING (user_id = auth.uid());

-- ── document_chunks ───────────────────────────────────────────
-- Parent-child chunking voor RAG pipeline (pgvector)
CREATE TABLE IF NOT EXISTS document_chunks (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  upload_id    uuid REFERENCES canvas_uploads(id) ON DELETE CASCADE,
  canvas_id    uuid REFERENCES canvases(id) ON DELETE CASCADE,
  parent_id    uuid REFERENCES document_chunks(id) ON DELETE CASCADE,
  chunk_type   text NOT NULL CHECK (chunk_type IN ('parent', 'child')),
  content      text NOT NULL,
  embedding    vector(1536),
  metadata     jsonb DEFAULT '{}'::jsonb,
  created_at   timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS document_chunks_canvas_idx
  ON document_chunks(canvas_id);

CREATE INDEX IF NOT EXISTS document_chunks_embedding_idx
  ON document_chunks USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

ALTER TABLE document_chunks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Eigen chunks"
  ON document_chunks FOR ALL
  USING (canvas_id IN (
    SELECT id FROM canvases WHERE user_id = auth.uid()
  ));

-- ── import_jobs ───────────────────────────────────────────────
-- Bijhouden van import-voortgang per document
CREATE TABLE IF NOT EXISTS import_jobs (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  canvas_id  uuid REFERENCES canvases(id) ON DELETE CASCADE,
  user_id    uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name  text NOT NULL,
  file_type  text,
  status     text NOT NULL DEFAULT 'queued'
             CHECK (status IN ('queued','processing','done','error')),
  progress   int DEFAULT 0,
  error_msg  text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TRIGGER import_jobs_updated_at
  BEFORE UPDATE ON import_jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE import_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Eigen import jobs"
  ON import_jobs FOR ALL
  USING (user_id = auth.uid());

-- ── RPC: vector similarity search ────────────────────────────
-- Gebruikt door /api/extract voor RAG-retrieval
CREATE OR REPLACE FUNCTION search_document_chunks(
  query_embedding vector(1536),
  canvas_id_filter uuid,
  match_count int DEFAULT 10
)
RETURNS TABLE (
  id        uuid,
  content   text,
  metadata  jsonb,
  parent_id uuid,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    dc.id,
    dc.content,
    dc.metadata,
    dc.parent_id,
    1 - (dc.embedding <=> query_embedding) AS similarity
  FROM document_chunks dc
  WHERE
    dc.canvas_id  = canvas_id_filter
    AND dc.chunk_type = 'child'
    AND dc.embedding IS NOT NULL
  ORDER BY dc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
