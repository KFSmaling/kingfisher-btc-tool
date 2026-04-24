# Schema Inventaris — BTC Tool

> Feitelijke inventaris op basis van alle migraties in `supabase/migrations/`.  
> Geen voorstel voor wijzigingen.  
> Gegenereerd: 2026-04-24

---

## 1. Tabellen met een `user_id` kolom

Drie tabellen hebben een directe `user_id` kolom:

| Tabel | Type | Constraint |
|-------|------|-----------|
| `canvases` | `uuid NOT NULL` | `REFERENCES auth.users(id) ON DELETE CASCADE` |
| `canvas_uploads` | `uuid` (nullable) | `REFERENCES auth.users(id) ON DELETE CASCADE` |
| `import_jobs` | `uuid` | `REFERENCES auth.users(id) ON DELETE CASCADE` |

Alle andere tabellen (`strategy_core`, `analysis_items`, `strategic_themes`, `ksf_kpi`, `guidelines`, `guideline_analysis`, `document_chunks`, `app_config`) hebben **geen** `user_id` kolom. Ze zijn aan een canvas gekoppeld via `canvas_id`, of in het geval van `ksf_kpi` via `theme_id`.

---

## 2. RLS policies per tabel

### Directe `user_id`-check

| Tabel | Policy | Expressie |
|-------|--------|-----------|
| `canvases` | "Eigen canvassen" | `user_id = auth.uid()` |
| `canvas_uploads` | "Eigen uploads" | `user_id = auth.uid()` |
| `import_jobs` | "Eigen import jobs" | `user_id = auth.uid()` |

### Indirecte check via canvas-join

| Tabel | Policy | Expressie |
|-------|--------|-----------|
| `document_chunks` | "Eigen chunks" | `canvas_id IN (SELECT id FROM canvases WHERE user_id = auth.uid())` |
| `strategy_core` | "Own canvas" | `canvas_id IN (SELECT id FROM canvases WHERE user_id = auth.uid())` |
| `analysis_items` | "Own canvas" | `canvas_id IN (SELECT id FROM canvases WHERE user_id = auth.uid())` |
| `strategic_themes` | "Own canvas" | `canvas_id IN (SELECT id FROM canvases WHERE user_id = auth.uid())` |
| `guidelines` | "eigen guidelines" | `canvas_id IN (SELECT id FROM canvases WHERE user_id = auth.uid())` |
| `guideline_analysis` | "eigen guideline_analysis" | `canvas_id IN (SELECT id FROM canvases WHERE user_id = auth.uid())` |

### Indirecte check via theme → canvas join (twee niveaus)

| Tabel | Policy | Expressie |
|-------|--------|-----------|
| `ksf_kpi` | "Own theme" | `theme_id IN (SELECT st.id FROM strategic_themes st JOIN canvases c ON st.canvas_id = c.id WHERE c.user_id = auth.uid())` |

### Role/email-gebaseerde toegang (geen user_id-check)

| Tabel | Policy | Toegang |
|-------|--------|---------|
| `app_config` | "Alleen lezen voor ingelogde users" | SELECT voor alle `authenticated` users |
| `app_config` | "Admin schrijfrechten" | UPDATE alleen voor `auth.email() = 'smaling.kingfisher@icloud.com'` |

`app_config` heeft geen INSERT-policy — inserts lopen via migraties, niet via de app.

---

## 3. Aanwezigheid van `tenant_id` of vergelijkbaar

**Geen enkele tabel heeft een `tenant_id`, `org_id`, `organisation_id` of vergelijkbare multi-tenant kolom.**

Het huidige isolatiemodel is volledig user-gebaseerd: elke rij is direct of indirect eigendom van één `auth.users`-rij. Er is geen groepering van users onder een organisatie of tenant.

---

## 4. Seed- en testdata

Alle seed-data zit uitsluitend in de `app_config` tabel. Er zijn geen seed-scripts voor `canvases`, `guidelines` of andere gebruikersdata.

### Overzicht per migratiebestand

| Bestand | Inhoud |
|---------|--------|
| `20260420000000_sprint_4d_app_config.sql` | Initiële `app_config` structuur + basis UI-labels (`label.app.*`, `label.werkblad.*`, `label.section.*`) + `setting.autosave.delay_ms` |
| `20260420140000_sprint_4d_seed_prompts.sql` | Alle AI-prompts voor Magic Staff (`prompt.magic.*`), strategische thema's (`prompt.strategy.themes`), KSF/KPI (`prompt.strategy.ksf_kpi`), tekst-verbeter opties (`prompt.improve.*`), documentvalidatie (`prompt.validate`) |
| `20260420150000_fix_admin_email.sql` | Admin-e-mail gecorrigeerd naar `smaling.kingfisher@icloud.com` |
| `20260421060000_add_guidelines.sql` | Eerste poging guideline-prompts (miste `category` kolom — gerold terug) |
| `20260421080000_add_guidelines_retry.sql` | Definitieve guideline-prompts: `prompt.guideline.generate`, `prompt.guideline.advies`, `prompt.guideline.implications` |
| `20260421090000_seed_labels.sql` | Uitgebreide set UI-labels: `label.strat.*`, `label.richtl.*`, `label.werkblad.richtlijnen`, `label.footer.tagline` |
| `20260421110000_add_samenvatting_seed_all_labels.sql` | Herhaalde seed van alle labels (veilig via `ON CONFLICT DO NOTHING`) + `label.strat.field.samenvatting` |
| `20260421120000_seed_samenvatting_prompt.sql` | Prompt voor strategische samenvatting: `prompt.strategy.samenvatting` |
| `20260421010000_seed_general_knowledge_prompt.sql` | (Niet gelezen — vermoedelijk nog een prompt-variant) |
| `20260423120000_seed_auto_tag_prompt.sql` | Auto-tag prompt `prompt.strategy.auto_tag` + knop-label `label.strat.autotag.button` |

### Huidige `app_config` categorieën

| Categorie | Sleutel-prefix | Inhoud |
|-----------|---------------|--------|
| `label` | `label.app.*`, `label.strat.*`, `label.richtl.*`, `label.werkblad.*`, `label.footer.*` | UI-teksten, configureerbaar per klant |
| `prompt` | `prompt.magic.*`, `prompt.strategy.*`, `prompt.guideline.*`, `prompt.improve.*`, `prompt.validate` | AI system-prompts |
| `setting` | `setting.autosave.delay_ms` | Applicatie-instellingen |

### Testdata voor gebruikersdata

Geen. Er zijn geen `INSERT`-statements voor `canvases`, `guidelines`, `strategy_core` of andere user-specifieke tabellen in de migraties. Testcanvassen worden handmatig aangemaakt via de UI.

---

## Volledige tabellenlijst (volgorde van aanmaken)

| Tabel | Aangemaakt in | Primaire sleutel | user_id? | canvas_id? |
|-------|--------------|-----------------|----------|-----------|
| `canvases` | sprint_1 | `id` (uuid) | ✅ direct | — |
| `canvas_uploads` | sprint_1 | `id` (uuid) | ✅ direct | `canvas_id` (fk) |
| `document_chunks` | sprint_1 | `id` (uuid) | ❌ | `canvas_id` (fk) |
| `import_jobs` | sprint_1 | `id` (uuid) | ✅ direct | `canvas_id` (fk) |
| `strategy_core` | sprint_4b | `id` (uuid), UNIQUE `canvas_id` | ❌ | `canvas_id` NOT NULL |
| `analysis_items` | sprint_4b | `id` (uuid) | ❌ | `canvas_id` NOT NULL |
| `strategic_themes` | sprint_4b | `id` (uuid) | ❌ | `canvas_id` NOT NULL |
| `ksf_kpi` | sprint_4b | `id` (uuid) | ❌ | ❌ (via `theme_id`) |
| `app_config` | sprint_4d | `key` (text) | ❌ | ❌ (global) |
| `guidelines` | sprint_8 | `id` (uuid) | ❌ | `canvas_id` NOT NULL |
| `guideline_analysis` | sprint_8 | `id` (uuid), UNIQUE `canvas_id` | ❌ | `canvas_id` NOT NULL |
