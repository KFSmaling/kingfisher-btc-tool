# DATABASE.md — BTC Tool Supabase Schema

> Gegenereerd op 2026-04-22 uit `supabase/migrations/`.  
> Bijwerken bij elke nieuwe migration.

---

## Extensies

| Extensie | Doel |
|----------|------|
| `vector` (pgvector) | Vectoropslag voor embedding-search |

---

## Gedeelde functies & triggers

| Naam | Type | Doel |
|------|------|------|
| `update_updated_at()` | Trigger function | Zet `updated_at = now()` bij elke UPDATE |
| `search_document_chunks(query_embedding, canvas_id_filter, match_count)` | RPC | Vector similarity search op `document_chunks` — geeft `id, content, metadata, parent_id, similarity` |

---

## Tabellen

### `canvases`

| Kolom | Type | Constraints |
|-------|------|-------------|
| `id` | `uuid` | **PK**, DEFAULT `gen_random_uuid()` |
| `user_id` | `uuid` | NOT NULL, FK → `auth.users(id)` ON DELETE CASCADE |
| `name` | `text` | NOT NULL, DEFAULT `'Nieuw Canvas'` |
| `blocks` | `jsonb` | NOT NULL, DEFAULT `'{}'` |
| `data` | `jsonb` | NOT NULL, DEFAULT `'{}'` |
| `client_name` | `text` | |
| `author_name` | `text` | |
| `industry` | `text` | |
| `transformation_type` | `text` | |
| `org_size` | `text` | |
| `project_status` | `text` | |
| `project_description` | `text` | |
| `created_at` | `timestamptz` | DEFAULT `now()` |
| `updated_at` | `timestamptz` | DEFAULT `now()`, beheerd door trigger |

**Trigger:** `canvases_updated_at` → `update_updated_at()`  
**RLS:** `"Eigen canvassen"` FOR ALL — `USING (user_id = auth.uid())`

---

### `canvas_uploads`

| Kolom | Type | Constraints |
|-------|------|-------------|
| `id` | `uuid` | **PK**, DEFAULT `gen_random_uuid()` |
| `user_id` | `uuid` | FK → `auth.users(id)` ON DELETE CASCADE |
| `canvas_id` | `uuid` | FK → `canvases(id)` ON DELETE CASCADE |
| `file_name` | `text` | NOT NULL |
| `raw_text` | `text` | |
| `content` | `jsonb` | |
| `block_key` | `text` | |
| `language` | `text` | DEFAULT `'nl'` |
| `created_at` | `timestamptz` | DEFAULT `now()` |

**Unique:** `(canvas_id, file_name)`  
**RLS:** `"Eigen uploads"` FOR ALL — `USING (user_id = auth.uid())`

---

### `document_chunks`

| Kolom | Type | Constraints |
|-------|------|-------------|
| `id` | `uuid` | **PK**, DEFAULT `gen_random_uuid()` |
| `upload_id` | `uuid` | FK → `canvas_uploads(id)` ON DELETE CASCADE |
| `canvas_id` | `uuid` | FK → `canvases(id)` ON DELETE CASCADE |
| `parent_id` | `uuid` | FK → `document_chunks(id)` ON DELETE CASCADE |
| `chunk_type` | `text` | NOT NULL, CHECK `IN ('parent', 'child')` |
| `content` | `text` | NOT NULL |
| `embedding` | `vector(1536)` | |
| `metadata` | `jsonb` | DEFAULT `'{}'` |
| `created_at` | `timestamptz` | DEFAULT `now()` |

**Indexes:**
- `document_chunks_canvas_idx` op `(canvas_id)`
- `document_chunks_embedding_idx` — `ivfflat (embedding vector_cosine_ops)` lists=100

**RLS:** `"Eigen chunks"` FOR ALL — `USING (canvas_id IN (SELECT id FROM canvases WHERE user_id = auth.uid()))`

---

### `import_jobs`

| Kolom | Type | Constraints |
|-------|------|-------------|
| `id` | `uuid` | **PK**, DEFAULT `gen_random_uuid()` |
| `canvas_id` | `uuid` | FK → `canvases(id)` ON DELETE CASCADE |
| `user_id` | `uuid` | FK → `auth.users(id)` ON DELETE CASCADE |
| `file_name` | `text` | NOT NULL |
| `file_type` | `text` | |
| `status` | `text` | NOT NULL, DEFAULT `'queued'`, CHECK `IN ('queued','processing','done','error')` |
| `progress` | `int` | DEFAULT `0` |
| `error_msg` | `text` | |
| `created_at` | `timestamptz` | DEFAULT `now()` |
| `updated_at` | `timestamptz` | DEFAULT `now()`, beheerd door trigger |

**Trigger:** `import_jobs_updated_at` → `update_updated_at()`  
**RLS:** `"Eigen import jobs"` FOR ALL — `USING (user_id = auth.uid())`

---

### `strategy_core`

| Kolom | Type | Constraints |
|-------|------|-------------|
| `id` | `uuid` | **PK**, DEFAULT `gen_random_uuid()` |
| `canvas_id` | `uuid` | NOT NULL, FK → `canvases(id)` ON DELETE CASCADE, UNIQUE |
| `missie` | `text` | DEFAULT `''` |
| `visie` | `text` | DEFAULT `''` |
| `ambitie` | `text` | DEFAULT `''` |
| `kernwaarden` | `jsonb` | DEFAULT `'[]'` |
| `samenvatting` | `text` | DEFAULT `''` |
| `analysis` | `jsonb` | — AI strategisch advies (`recommendations[]`) |
| `updated_at` | `timestamptz` | DEFAULT `now()` |

**RLS:** `"Own canvas"` FOR ALL  
— `USING (canvas_id IN (SELECT id FROM canvases WHERE user_id = auth.uid()))`  
— `WITH CHECK (canvas_id IN (SELECT id FROM canvases WHERE user_id = auth.uid()))`

---

### `analysis_items`

| Kolom | Type | Constraints |
|-------|------|-------------|
| `id` | `uuid` | **PK**, DEFAULT `gen_random_uuid()` |
| `canvas_id` | `uuid` | NOT NULL, FK → `canvases(id)` ON DELETE CASCADE |
| `type` | `text` | NOT NULL, CHECK `IN ('extern', 'intern')` |
| `content` | `text` | NOT NULL, DEFAULT `''` |
| `tag` | `text` | NOT NULL, DEFAULT `'niet_relevant'`, CHECK `IN ('kans','sterkte','bedreiging','zwakte','niet_relevant')` |
| `sort_order` | `int` | NOT NULL, DEFAULT `0` |
| `created_at` | `timestamptz` | DEFAULT `now()` |

**RLS:** `"Own canvas"` FOR ALL  
— `USING + WITH CHECK (canvas_id IN (SELECT id FROM canvases WHERE user_id = auth.uid()))`

---

### `strategic_themes`

| Kolom | Type | Constraints |
|-------|------|-------------|
| `id` | `uuid` | **PK**, DEFAULT `gen_random_uuid()` |
| `canvas_id` | `uuid` | NOT NULL, FK → `canvases(id)` ON DELETE CASCADE |
| `title` | `text` | NOT NULL, DEFAULT `''` |
| `sort_order` | `int` | NOT NULL, DEFAULT `0` |
| `created_at` | `timestamptz` | DEFAULT `now()` |

**RLS:** `"Own canvas"` FOR ALL  
— `USING + WITH CHECK (canvas_id IN (SELECT id FROM canvases WHERE user_id = auth.uid()))`

---

### `ksf_kpi`

| Kolom | Type | Constraints |
|-------|------|-------------|
| `id` | `uuid` | **PK**, DEFAULT `gen_random_uuid()` |
| `theme_id` | `uuid` | NOT NULL, FK → `strategic_themes(id)` ON DELETE CASCADE |
| `type` | `text` | NOT NULL, CHECK `IN ('ksf', 'kpi')` |
| `description` | `text` | NOT NULL, DEFAULT `''` |
| `current_value` | `text` | DEFAULT `''` |
| `target_value` | `text` | DEFAULT `''` |
| `sort_order` | `int` | NOT NULL, DEFAULT `0` |
| `created_at` | `timestamptz` | DEFAULT `now()` |

**RLS:** `"Own theme"` FOR ALL — via join: `theme_id → strategic_themes.canvas_id → canvases.user_id = auth.uid()`  
— met expliciete `WITH CHECK`

---

### `app_config`

| Kolom | Type | Constraints |
|-------|------|-------------|
| `key` | `text` | **PK** |
| `value` | `text` | NOT NULL |
| `category` | `text` | NOT NULL, CHECK `IN ('prompt', 'label', 'setting')` |
| `description` | `text` | |
| `updated_at` | `timestamptz` | DEFAULT `now()`, beheerd door trigger |

**Trigger:** `app_config_updated_at` → `update_updated_at()`  
**RLS:** `"Alleen lezen voor ingelogde users"` FOR SELECT TO authenticated — `USING (true)`  
_(Schrijftoegang alleen via migrations / service-account)_

---

### `guidelines`

| Kolom | Type | Constraints |
|-------|------|-------------|
| `id` | `uuid` | **PK**, DEFAULT `gen_random_uuid()` |
| `canvas_id` | `uuid` | NOT NULL, FK → `canvases(id)` |
| `segment` | `text` | NOT NULL, CHECK `IN ('generiek','klanten','organisatie','it')` |
| `title` | `text` | NOT NULL, DEFAULT `''` |
| `description` | `text` | DEFAULT `''` |
| `implications` | `jsonb` | DEFAULT `'{"stop":"","start":"","continue":""}'` |
| `linked_themes` | `jsonb` | DEFAULT `'[]'` — array van `strategic_themes.id` |
| `sort_order` | `int` | DEFAULT `0` |
| `created_at` | `timestamptz` | DEFAULT `now()` |

**RLS:** `"eigen guidelines"` FOR ALL — `USING (canvas_id IN (SELECT id FROM canvases WHERE user_id = auth.uid()))`

---

### `guideline_analysis`

| Kolom | Type | Constraints |
|-------|------|-------------|
| `id` | `uuid` | **PK**, DEFAULT `gen_random_uuid()` |
| `canvas_id` | `uuid` | NOT NULL, FK → `canvases(id)`, UNIQUE |
| `recommendations` | `jsonb` | DEFAULT `'[]'` — array van `{type, title, text}` |
| `updated_at` | `timestamptz` | DEFAULT `now()` |

**RLS:** `"eigen guideline_analysis"` FOR ALL — `USING (canvas_id IN (SELECT id FROM canvases WHERE user_id = auth.uid()))`

---

## Relatiediagram (tekst)

```
auth.users
  └─► canvases
        ├─► canvas_uploads
        │     └─► document_chunks (ook FK naar canvases)
        ├─► import_jobs
        ├─► strategy_core          (UNIQUE per canvas)
        ├─► analysis_items
        ├─► strategic_themes
        │     └─► ksf_kpi
        ├─► guidelines
        └─► guideline_analysis     (UNIQUE per canvas)

app_config (standalone — geen FK)
```

---

## Verwijdervolgorde (handmatig, bij cascade-problemen)

```
document_chunks
→ canvas_uploads
→ guideline_analysis
→ guidelines
→ ksf_kpi
→ strategic_themes
→ analysis_items
→ strategy_core
→ import_jobs
→ canvases
```
