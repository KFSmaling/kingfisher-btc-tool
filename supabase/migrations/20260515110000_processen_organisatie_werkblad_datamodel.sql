-- ============================================================
-- 11.M C1 — RFC-005 Processen & Organisatie-werkblad datamodel
--
-- 14 tabellen + triggers + RLS-policies in één migratie.
-- Volgorde respecteert FK-afhankelijkheden:
--   pr_*  (Bedrijfsprocessen) — 2 tabellen
--   org_* (Lijnorganisatie)   — 3 tabellen
--   vo_*  (Veranderorganisatie) — 4 tabellen
--   gov_* (Besturing)         — 2 tabellen
--   po_*  (cross-cutting)     — 5 tabellen (incl. 2 events-tabellen append-only)
--
-- Triggers:
--   - update_updated_at (hergebruik bestaand) op alle tabellen met updated_at
--   - validate_pr_processes_value_streams  — value_stream_ids array-FK-validatie
--   - validate_pr_process_step_link        — cross-canvas-validatie
--   - pr_process_steps_max_per_process     — max 7 stappen per proces (modelleer-3)
--   - validate_org_pdi_link                — matrix-rij cross-canvas-validatie
--   - validate_vo_value_team_bu            — BU-koppeling cross-canvas-validatie
--   - validate_po_pain_point_coupling      — polymorphic 5 target-types
--   - po_pp_recompute_is_floating          — is_floating sync bij coupling-changes
--   - po_pp_recompute_coverage_status      — coverage-status sync (intent-link-changes)
--   - po_intent_status_change_coverage_sync — coverage sync bij status-change
--   - validate_po_intent_pain_link         — cross-canvas-validatie
--   - po_intent_sync_current_status        — audit-event → status-update
--   - validate_po_input_suggestion_target  — polymorphic target-validatie
--
-- RLS: alle 14 tabellen ENABLE ROW LEVEL SECURITY met
--   tenant + eigenaar/tenant_admin-pattern (anker cd_*-policies).
-- Append-only voor po_improvement_intent_events + po_input_suggestion_events:
--   SELECT + INSERT policies only.
--
-- Idempotent: CREATE TABLE IF NOT EXISTS, CREATE OR REPLACE FUNCTION,
-- DROP TRIGGER/POLICY IF EXISTS + CREATE.
-- ============================================================

-- ============================================================
-- §4 Sub-tab 1.1 Bedrijfsprocessen (pr_*)
-- ============================================================

-- 4.1 pr_processes
CREATE TABLE IF NOT EXISTS pr_processes (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  canvas_id       uuid NOT NULL REFERENCES canvases(id)  ON DELETE CASCADE,
  tenant_id       uuid NOT NULL REFERENCES tenants(id)   ON DELETE RESTRICT,
  archetype       text NOT NULL CHECK (archetype IN ('besturend', 'primair', 'ondersteunend')),
  name            text NOT NULL CHECK (length(name) BETWEEN 1 AND 200),
  description     text,
  archetype_data  jsonb NOT NULL DEFAULT '{}'::jsonb,
  sub_items       jsonb NOT NULL DEFAULT '[]'::jsonb,
  value_stream_ids uuid[] NOT NULL DEFAULT ARRAY[]::uuid[],
  sort_order      int  NOT NULL DEFAULT 0,
  is_draft        boolean NOT NULL DEFAULT false,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT pr_processes_canvas_archetype_name_unique UNIQUE (canvas_id, archetype, name)
);

CREATE INDEX IF NOT EXISTS pr_processes_canvas_archetype_idx
  ON pr_processes (canvas_id, archetype, sort_order);
CREATE INDEX IF NOT EXISTS pr_processes_archetype_data_gin_idx
  ON pr_processes USING GIN (archetype_data);
CREATE INDEX IF NOT EXISTS pr_processes_value_streams_gin_idx
  ON pr_processes USING GIN (value_stream_ids);

DROP TRIGGER IF EXISTS pr_processes_updated_at ON pr_processes;
CREATE TRIGGER pr_processes_updated_at
  BEFORE UPDATE ON pr_processes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 4.1.a value_stream_ids array-FK-validatie (RFC-004 §5.2 pattern)
CREATE OR REPLACE FUNCTION validate_pr_processes_value_streams()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  stream_count int;
  array_count  int;
BEGIN
  IF NEW.value_stream_ids IS NULL OR array_length(NEW.value_stream_ids, 1) IS NULL THEN
    RETURN NEW;
  END IF;
  array_count := array_length(NEW.value_stream_ids, 1);
  SELECT count(*) INTO stream_count
  FROM canvas_value_streams
  WHERE id = ANY (NEW.value_stream_ids)
    AND canvas_id = NEW.canvas_id;
  IF stream_count <> array_count THEN
    RAISE EXCEPTION 'pr_processes.value_stream_ids bevat ongeldige of cross-canvas value-stream-ids';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS pr_processes_validate_value_streams ON pr_processes;
CREATE TRIGGER pr_processes_validate_value_streams
  BEFORE INSERT OR UPDATE ON pr_processes
  FOR EACH ROW EXECUTE FUNCTION validate_pr_processes_value_streams();

-- 4.2 pr_process_steps (max 7 per proces — modelleer-principe 3)
CREATE TABLE IF NOT EXISTS pr_process_steps (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  process_id  uuid NOT NULL REFERENCES pr_processes(id) ON DELETE CASCADE,
  canvas_id   uuid NOT NULL REFERENCES canvases(id)     ON DELETE CASCADE,
  tenant_id   uuid NOT NULL REFERENCES tenants(id)      ON DELETE RESTRICT,
  name        text NOT NULL CHECK (length(name) BETWEEN 1 AND 100),
  description text,
  sort_order  int  NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS pr_process_steps_process_idx
  ON pr_process_steps (process_id, sort_order);

DROP TRIGGER IF EXISTS pr_process_steps_updated_at ON pr_process_steps;
CREATE TRIGGER pr_process_steps_updated_at
  BEFORE UPDATE ON pr_process_steps
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 4.2.a cross-canvas-validatie + max-7-validatie
CREATE OR REPLACE FUNCTION validate_pr_process_step_link()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  proc_canvas uuid; proc_tenant uuid; step_count int;
BEGIN
  SELECT canvas_id, tenant_id INTO proc_canvas, proc_tenant
  FROM pr_processes WHERE id = NEW.process_id;
  IF proc_canvas IS NULL THEN
    RAISE EXCEPTION 'pr_process_steps verwijst naar onbekend pr_processes.id %', NEW.process_id;
  END IF;
  IF NEW.canvas_id IS DISTINCT FROM proc_canvas
     OR NEW.tenant_id IS DISTINCT FROM proc_tenant THEN
    RAISE EXCEPTION 'cross-canvas/tenant niet toegestaan tussen pr_process_steps en pr_processes';
  END IF;
  -- Max-7-stappen per proces (modelleer-principe 3)
  -- Bij INSERT: count + 1; bij UPDATE op process_id: count zonder current row
  IF TG_OP = 'INSERT' THEN
    SELECT count(*) INTO step_count
    FROM pr_process_steps WHERE process_id = NEW.process_id;
    IF step_count >= 7 THEN
      RAISE EXCEPTION 'maximaal 7 processtappen per proces toegestaan (modelleer-principe 3)';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS pr_process_steps_validate ON pr_process_steps;
CREATE TRIGGER pr_process_steps_validate
  BEFORE INSERT OR UPDATE ON pr_process_steps
  FOR EACH ROW EXECUTE FUNCTION validate_pr_process_step_link();

-- ============================================================
-- §5 Sub-tab 1.2 Lijnorganisatie (org_*)
-- ============================================================

-- 5.1 org_structuring_doorsnede (canvas-config, 1 rij per canvas)
CREATE TABLE IF NOT EXISTS org_structuring_doorsnede (
  canvas_id  uuid PRIMARY KEY REFERENCES canvases(id) ON DELETE CASCADE,
  tenant_id  uuid NOT NULL REFERENCES tenants(id)   ON DELETE RESTRICT,
  doorsnede  text NOT NULL CHECK (doorsnede IN ('functioneel', 'productgericht', 'geografisch', 'marktgericht')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS org_structuring_doorsnede_updated_at ON org_structuring_doorsnede;
CREATE TRIGGER org_structuring_doorsnede_updated_at
  BEFORE UPDATE ON org_structuring_doorsnede
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 5.2 org_departments
CREATE TABLE IF NOT EXISTS org_departments (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  canvas_id   uuid NOT NULL REFERENCES canvases(id) ON DELETE CASCADE,
  tenant_id   uuid NOT NULL REFERENCES tenants(id)  ON DELETE RESTRICT,
  name        text NOT NULL CHECK (length(name) BETWEEN 1 AND 100),
  description text,
  sort_order  int  NOT NULL DEFAULT 0,
  is_draft    boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT org_departments_canvas_name_unique UNIQUE (canvas_id, name)
);

CREATE INDEX IF NOT EXISTS org_departments_canvas_idx
  ON org_departments (canvas_id, sort_order);

DROP TRIGGER IF EXISTS org_departments_updated_at ON org_departments;
CREATE TRIGGER org_departments_updated_at
  BEFORE UPDATE ON org_departments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 5.3 org_process_department_intensity (M:N)
CREATE TABLE IF NOT EXISTS org_process_department_intensity (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  process_id          uuid NOT NULL REFERENCES pr_processes(id)    ON DELETE CASCADE,
  department_id       uuid NOT NULL REFERENCES org_departments(id) ON DELETE CASCADE,
  canvas_id           uuid NOT NULL REFERENCES canvases(id)        ON DELETE CASCADE,
  tenant_id           uuid NOT NULL REFERENCES tenants(id)         ON DELETE RESTRICT,
  intensity           text NOT NULL DEFAULT 'involved' CHECK (intensity IN ('involved')),
  process_owner_text  text,
  created_at          timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT org_pdi_unique UNIQUE (process_id, department_id)
);

CREATE INDEX IF NOT EXISTS org_pdi_canvas_idx
  ON org_process_department_intensity (canvas_id);

-- 5.3.a cross-canvas-validatie (matrix-rij ↔ process + department)
CREATE OR REPLACE FUNCTION validate_org_pdi_link()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  proc_canvas uuid; proc_tenant uuid;
  dept_canvas uuid; dept_tenant uuid;
BEGIN
  SELECT canvas_id, tenant_id INTO proc_canvas, proc_tenant
  FROM pr_processes WHERE id = NEW.process_id;
  SELECT canvas_id, tenant_id INTO dept_canvas, dept_tenant
  FROM org_departments WHERE id = NEW.department_id;
  IF proc_canvas IS NULL OR dept_canvas IS NULL THEN
    RAISE EXCEPTION 'org_process_department_intensity verwijst naar onbekende process/department-id';
  END IF;
  IF proc_canvas IS DISTINCT FROM dept_canvas
     OR NEW.canvas_id IS DISTINCT FROM proc_canvas
     OR NEW.tenant_id IS DISTINCT FROM proc_tenant THEN
    RAISE EXCEPTION 'cross-canvas/tenant niet toegestaan in org_process_department_intensity';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS org_pdi_validate ON org_process_department_intensity;
CREATE TRIGGER org_pdi_validate
  BEFORE INSERT OR UPDATE ON org_process_department_intensity
  FOR EACH ROW EXECUTE FUNCTION validate_org_pdi_link();

-- ============================================================
-- §6 Sub-tab 1.3 Veranderorganisatie (vo_*)
-- ============================================================

-- 6.1 vo_change_approach (canvas-config)
CREATE TABLE IF NOT EXISTS vo_change_approach (
  canvas_id  uuid PRIMARY KEY REFERENCES canvases(id) ON DELETE CASCADE,
  tenant_id  uuid NOT NULL REFERENCES tenants(id)   ON DELETE RESTRICT,
  text_md    text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS vo_change_approach_updated_at ON vo_change_approach;
CREATE TRIGGER vo_change_approach_updated_at
  BEFORE UPDATE ON vo_change_approach
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 6.2 vo_business_units
CREATE TABLE IF NOT EXISTS vo_business_units (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  canvas_id   uuid NOT NULL REFERENCES canvases(id) ON DELETE CASCADE,
  tenant_id   uuid NOT NULL REFERENCES tenants(id)  ON DELETE RESTRICT,
  name        text NOT NULL CHECK (length(name) BETWEEN 1 AND 100),
  description text,
  sort_order  int  NOT NULL DEFAULT 0,
  is_draft    boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT vo_business_units_canvas_name_unique UNIQUE (canvas_id, name)
);

CREATE INDEX IF NOT EXISTS vo_business_units_canvas_idx
  ON vo_business_units (canvas_id, sort_order);

DROP TRIGGER IF EXISTS vo_business_units_updated_at ON vo_business_units;
CREATE TRIGGER vo_business_units_updated_at
  BEFORE UPDATE ON vo_business_units
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 6.3 vo_value_teams (optionele BU-koppeling)
CREATE TABLE IF NOT EXISTS vo_value_teams (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  canvas_id        uuid NOT NULL REFERENCES canvases(id) ON DELETE CASCADE,
  tenant_id        uuid NOT NULL REFERENCES tenants(id)  ON DELETE RESTRICT,
  business_unit_id uuid REFERENCES vo_business_units(id) ON DELETE SET NULL,
  name             text NOT NULL CHECK (length(name) BETWEEN 1 AND 100),
  description      text,
  relation_tags    text[] NOT NULL DEFAULT ARRAY[]::text[],
  sort_order       int  NOT NULL DEFAULT 0,
  is_draft         boolean NOT NULL DEFAULT false,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS vo_value_teams_canvas_idx
  ON vo_value_teams (canvas_id, sort_order);
CREATE INDEX IF NOT EXISTS vo_value_teams_bu_idx
  ON vo_value_teams (business_unit_id);

DROP TRIGGER IF EXISTS vo_value_teams_updated_at ON vo_value_teams;
CREATE TRIGGER vo_value_teams_updated_at
  BEFORE UPDATE ON vo_value_teams
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 6.3.a BU-koppeling cross-canvas-validatie
CREATE OR REPLACE FUNCTION validate_vo_value_team_bu()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  bu_canvas uuid; bu_tenant uuid;
BEGIN
  IF NEW.business_unit_id IS NULL THEN
    RETURN NEW;
  END IF;
  SELECT canvas_id, tenant_id INTO bu_canvas, bu_tenant
  FROM vo_business_units WHERE id = NEW.business_unit_id;
  IF bu_canvas IS NULL THEN
    RAISE EXCEPTION 'vo_value_teams verwijst naar onbekend vo_business_units.id %', NEW.business_unit_id;
  END IF;
  IF NEW.canvas_id IS DISTINCT FROM bu_canvas
     OR NEW.tenant_id IS DISTINCT FROM bu_tenant THEN
    RAISE EXCEPTION 'cross-canvas/tenant niet toegestaan tussen vo_value_teams en vo_business_units';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS vo_value_teams_validate_bu ON vo_value_teams;
CREATE TRIGGER vo_value_teams_validate_bu
  BEFORE INSERT OR UPDATE ON vo_value_teams
  FOR EACH ROW EXECUTE FUNCTION validate_vo_value_team_bu();

-- 6.4 vo_schets_uploads (metadata; storage-bucket separaat)
CREATE TABLE IF NOT EXISTS vo_schets_uploads (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  canvas_id      uuid NOT NULL REFERENCES canvases(id) ON DELETE CASCADE,
  tenant_id      uuid NOT NULL REFERENCES tenants(id)  ON DELETE RESTRICT,
  file_name      text NOT NULL,
  storage_path   text NOT NULL,
  mime_type      text NOT NULL CHECK (mime_type IN ('image/png', 'image/jpeg')),
  file_size_bytes int NOT NULL CHECK (file_size_bytes <= 5242880),
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS vo_schets_uploads_canvas_idx
  ON vo_schets_uploads (canvas_id);

-- ============================================================
-- §7 Sub-tab 1.4 Besturing (gov_*)
-- ============================================================

-- 7.1 gov_steering_model (canvas-config)
CREATE TABLE IF NOT EXISTS gov_steering_model (
  canvas_id            uuid PRIMARY KEY REFERENCES canvases(id) ON DELETE CASCADE,
  tenant_id            uuid NOT NULL REFERENCES tenants(id)   ON DELETE RESTRICT,
  model                text NOT NULL CHECK (model IN ('hierarchisch', 'functioneel', 'klant_leverancier', 'tijdelijke_coordinatie')),
  text_md              text NOT NULL DEFAULT '',
  coordination_aspects text[] NOT NULL DEFAULT ARRAY[]::text[],
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS gov_steering_model_updated_at ON gov_steering_model;
CREATE TRIGGER gov_steering_model_updated_at
  BEFORE UPDATE ON gov_steering_model
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 7.2 gov_control_processes
CREATE TABLE IF NOT EXISTS gov_control_processes (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  canvas_id     uuid NOT NULL REFERENCES canvases(id) ON DELETE CASCADE,
  tenant_id     uuid NOT NULL REFERENCES tenants(id)  ON DELETE RESTRICT,
  name          text NOT NULL CHECK (length(name) BETWEEN 1 AND 100),
  description   text,
  control_type  text NOT NULL CHECK (control_type IN ('jaarplan', 'mis_rapportage', 'bijsturing')),
  sort_order    int  NOT NULL DEFAULT 0,
  is_draft      boolean NOT NULL DEFAULT false,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT gov_control_processes_canvas_name_unique UNIQUE (canvas_id, name)
);

CREATE INDEX IF NOT EXISTS gov_control_processes_canvas_idx
  ON gov_control_processes (canvas_id, control_type, sort_order);

DROP TRIGGER IF EXISTS gov_control_processes_updated_at ON gov_control_processes;
CREATE TRIGGER gov_control_processes_updated_at
  BEFORE UPDATE ON gov_control_processes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- §8 Fase 2 Pijnpunten (cross-cutting po_*)
-- ============================================================

-- 8.1 po_pain_points (met coverage-status materialized column)
CREATE TABLE IF NOT EXISTS po_pain_points (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  canvas_id             uuid NOT NULL REFERENCES canvases(id) ON DELETE CASCADE,
  tenant_id             uuid NOT NULL REFERENCES tenants(id)  ON DELETE RESTRICT,
  text_md               text NOT NULL,
  is_strategic_anchor   boolean NOT NULL DEFAULT false,
  is_floating           boolean NOT NULL DEFAULT true,
  coverage_status       text NOT NULL DEFAULT 'open' CHECK (coverage_status IN ('open', 'covered', 'motivated_no_action')),
  no_action_motivation  text,
  is_draft              boolean NOT NULL DEFAULT false,
  sort_order            int  NOT NULL DEFAULT 0,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT po_pp_motivation_required CHECK (
    (coverage_status = 'motivated_no_action'
     AND no_action_motivation IS NOT NULL
     AND length(no_action_motivation) >= 20)
    OR coverage_status IN ('open', 'covered')
  )
);

CREATE INDEX IF NOT EXISTS po_pain_points_canvas_idx
  ON po_pain_points (canvas_id, sort_order);
CREATE INDEX IF NOT EXISTS po_pain_points_coverage_idx
  ON po_pain_points (canvas_id, coverage_status);
CREATE INDEX IF NOT EXISTS po_pain_points_tenant_idx
  ON po_pain_points (tenant_id);

DROP TRIGGER IF EXISTS po_pain_points_updated_at ON po_pain_points;
CREATE TRIGGER po_pain_points_updated_at
  BEFORE UPDATE ON po_pain_points
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 8.2 po_pain_point_couplings (polymorphic, 5 target-tables)
CREATE TABLE IF NOT EXISTS po_pain_point_couplings (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pain_point_id uuid NOT NULL REFERENCES po_pain_points(id) ON DELETE CASCADE,
  target_table  text NOT NULL CHECK (target_table IN ('pr_processes', 'org_departments', 'vo_business_units', 'vo_value_teams', 'gov_control_processes')),
  target_id     uuid NOT NULL,
  tenant_id     uuid NOT NULL REFERENCES tenants(id)  ON DELETE RESTRICT,
  canvas_id     uuid NOT NULL REFERENCES canvases(id) ON DELETE CASCADE,
  created_at    timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT po_ppc_unique UNIQUE (pain_point_id, target_table, target_id)
);

CREATE INDEX IF NOT EXISTS po_ppc_pain_idx
  ON po_pain_point_couplings (pain_point_id);
CREATE INDEX IF NOT EXISTS po_ppc_target_idx
  ON po_pain_point_couplings (target_table, target_id);
CREATE INDEX IF NOT EXISTS po_ppc_canvas_idx
  ON po_pain_point_couplings (canvas_id);

-- 8.3 Polymorphic-FK-validatie via dynamic EXECUTE (RFC-001 §3.4 pattern)
CREATE OR REPLACE FUNCTION validate_po_pain_point_coupling()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  target_canvas uuid; target_tenant uuid; q text;
BEGIN
  IF NEW.target_table NOT IN ('pr_processes', 'org_departments', 'vo_business_units', 'vo_value_teams', 'gov_control_processes') THEN
    RAISE EXCEPTION 'Onbekende target_table: %', NEW.target_table;
  END IF;
  q := format('SELECT canvas_id, tenant_id FROM %I WHERE id = $1', NEW.target_table);
  EXECUTE q INTO target_canvas, target_tenant USING NEW.target_id;
  IF target_canvas IS NULL THEN
    RAISE EXCEPTION 'target_id % bestaat niet in %', NEW.target_id, NEW.target_table;
  END IF;
  IF NEW.canvas_id IS DISTINCT FROM target_canvas
     OR NEW.tenant_id IS DISTINCT FROM target_tenant THEN
    RAISE EXCEPTION 'cross-canvas/tenant niet toegestaan in po_pain_point_couplings';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS po_ppc_validate ON po_pain_point_couplings;
CREATE TRIGGER po_ppc_validate
  BEFORE INSERT OR UPDATE ON po_pain_point_couplings
  FOR EACH ROW EXECUTE FUNCTION validate_po_pain_point_coupling();

-- 8.4 is_floating-recompute trigger
CREATE OR REPLACE FUNCTION po_pp_recompute_is_floating()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  UPDATE po_pain_points
  SET is_floating = NOT EXISTS (
    SELECT 1 FROM po_pain_point_couplings
    WHERE pain_point_id = COALESCE(NEW.pain_point_id, OLD.pain_point_id)
  )
  WHERE id = COALESCE(NEW.pain_point_id, OLD.pain_point_id);
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS po_ppc_recompute_floating ON po_pain_point_couplings;
CREATE TRIGGER po_ppc_recompute_floating
  AFTER INSERT OR DELETE ON po_pain_point_couplings
  FOR EACH ROW EXECUTE FUNCTION po_pp_recompute_is_floating();

-- ============================================================
-- §9 Fase 3 Verbeteracties + Coverage-discipline
-- ============================================================

-- 9.1 po_improvement_intents (2-staps state-machine + dismissed)
CREATE TABLE IF NOT EXISTS po_improvement_intents (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  canvas_id         uuid NOT NULL REFERENCES canvases(id) ON DELETE CASCADE,
  tenant_id         uuid NOT NULL REFERENCES tenants(id)  ON DELETE RESTRICT,
  title             text NOT NULL CHECK (length(title) BETWEEN 1 AND 100),
  intent_md         text NOT NULL CHECK (length(intent_md) BETWEEN 50 AND 2000),
  current_status    text NOT NULL DEFAULT 'concept' CHECK (current_status IN ('concept', 'definitief', 'dismissed')),
  source_type       text NOT NULL CHECK (source_type IN ('ai_algemeen', 'ai_cluster', 'ai_paradox', 'ai_positionering', 'ai_overstijgend', 'eigen')),
  ai_generated_at   timestamptz,
  is_user_edited    boolean NOT NULL DEFAULT false,
  sort_order        int  NOT NULL DEFAULT 0,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS po_intents_canvas_status_idx
  ON po_improvement_intents (canvas_id, current_status, sort_order);
CREATE INDEX IF NOT EXISTS po_intents_source_type_idx
  ON po_improvement_intents (canvas_id, source_type);

DROP TRIGGER IF EXISTS po_improvement_intents_updated_at ON po_improvement_intents;
CREATE TRIGGER po_improvement_intents_updated_at
  BEFORE UPDATE ON po_improvement_intents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 9.2 po_intent_pain_point_links (relatie verbeteractie → pijnpunt bron)
CREATE TABLE IF NOT EXISTS po_intent_pain_point_links (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  intent_id     uuid NOT NULL REFERENCES po_improvement_intents(id) ON DELETE CASCADE,
  pain_point_id uuid NOT NULL REFERENCES po_pain_points(id)         ON DELETE CASCADE,
  tenant_id     uuid NOT NULL REFERENCES tenants(id)  ON DELETE RESTRICT,
  canvas_id     uuid NOT NULL REFERENCES canvases(id) ON DELETE CASCADE,
  created_at    timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT po_ippl_unique UNIQUE (intent_id, pain_point_id)
);

CREATE INDEX IF NOT EXISTS po_ippl_intent_idx
  ON po_intent_pain_point_links (intent_id);
CREATE INDEX IF NOT EXISTS po_ippl_pain_idx
  ON po_intent_pain_point_links (pain_point_id);

-- 9.2.a cross-canvas-validatie intent ↔ pijnpunt
CREATE OR REPLACE FUNCTION validate_po_intent_pain_link()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  intent_canvas uuid; intent_tenant uuid;
  pain_canvas uuid; pain_tenant uuid;
BEGIN
  SELECT canvas_id, tenant_id INTO intent_canvas, intent_tenant
  FROM po_improvement_intents WHERE id = NEW.intent_id;
  SELECT canvas_id, tenant_id INTO pain_canvas, pain_tenant
  FROM po_pain_points WHERE id = NEW.pain_point_id;
  IF intent_canvas IS NULL OR pain_canvas IS NULL THEN
    RAISE EXCEPTION 'po_intent_pain_point_links verwijst naar onbekende intent/pain-id';
  END IF;
  IF intent_canvas IS DISTINCT FROM pain_canvas
     OR NEW.canvas_id IS DISTINCT FROM intent_canvas
     OR NEW.tenant_id IS DISTINCT FROM intent_tenant THEN
    RAISE EXCEPTION 'cross-canvas/tenant niet toegestaan in po_intent_pain_point_links';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS po_ippl_validate ON po_intent_pain_point_links;
CREATE TRIGGER po_ippl_validate
  BEFORE INSERT OR UPDATE ON po_intent_pain_point_links
  FOR EACH ROW EXECUTE FUNCTION validate_po_intent_pain_link();

-- 9.3 Coverage-discipline triggers
CREATE OR REPLACE FUNCTION po_pp_recompute_coverage_status()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  affected_pain_id uuid;
  has_active_intent boolean;
  current_coverage text;
BEGIN
  affected_pain_id := COALESCE(NEW.pain_point_id, OLD.pain_point_id);
  -- Behoud 'motivated_no_action' — consultant-decision blijft staan
  SELECT coverage_status INTO current_coverage
  FROM po_pain_points WHERE id = affected_pain_id;
  IF current_coverage = 'motivated_no_action' THEN
    RETURN NULL;
  END IF;
  -- Check of pijnpunt ≥1 niet-dismissed verbeteractie als bron heeft
  SELECT EXISTS (
    SELECT 1
    FROM po_intent_pain_point_links link
    JOIN po_improvement_intents intent ON intent.id = link.intent_id
    WHERE link.pain_point_id = affected_pain_id
      AND intent.current_status IN ('concept', 'definitief')
  ) INTO has_active_intent;
  UPDATE po_pain_points
  SET coverage_status = CASE WHEN has_active_intent THEN 'covered' ELSE 'open' END
  WHERE id = affected_pain_id;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS po_ippl_recompute_coverage ON po_intent_pain_point_links;
CREATE TRIGGER po_ippl_recompute_coverage
  AFTER INSERT OR UPDATE OR DELETE ON po_intent_pain_point_links
  FOR EACH ROW EXECUTE FUNCTION po_pp_recompute_coverage_status();

-- 9.3.a intent-status-change sync coverage_status van gekoppelde pijnpunten
CREATE OR REPLACE FUNCTION po_intent_status_change_coverage_sync()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.current_status IS DISTINCT FROM OLD.current_status THEN
    UPDATE po_pain_points pp
    SET coverage_status = CASE
      WHEN pp.coverage_status = 'motivated_no_action' THEN 'motivated_no_action'
      WHEN EXISTS (
        SELECT 1 FROM po_intent_pain_point_links link
        JOIN po_improvement_intents intent ON intent.id = link.intent_id
        WHERE link.pain_point_id = pp.id
          AND intent.current_status IN ('concept', 'definitief')
      ) THEN 'covered'
      ELSE 'open'
    END
    WHERE pp.id IN (
      SELECT pain_point_id FROM po_intent_pain_point_links WHERE intent_id = NEW.id
    );
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS po_intent_status_change_coverage ON po_improvement_intents;
CREATE TRIGGER po_intent_status_change_coverage
  AFTER UPDATE OF current_status ON po_improvement_intents
  FOR EACH ROW EXECUTE FUNCTION po_intent_status_change_coverage_sync();

-- 9.4 po_improvement_intent_events (append-only audit)
CREATE TABLE IF NOT EXISTS po_improvement_intent_events (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  intent_id       uuid NOT NULL REFERENCES po_improvement_intents(id) ON DELETE CASCADE,
  event_type      text NOT NULL CHECK (event_type IN (
                    'created', 'edited', 'refined',
                    'made_concept', 'made_definitief', 'back_to_concept',
                    'dismissed', 'restored'
                  )),
  actor_user_id   uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_role      text,
  text_before_md  text,
  text_after_md   text,
  metadata        jsonb NOT NULL DEFAULT '{}'::jsonb,
  tenant_id       uuid NOT NULL REFERENCES tenants(id)  ON DELETE RESTRICT,
  canvas_id       uuid NOT NULL REFERENCES canvases(id) ON DELETE CASCADE,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS po_iie_intent_idx
  ON po_improvement_intent_events (intent_id, created_at);
CREATE INDEX IF NOT EXISTS po_iie_canvas_idx
  ON po_improvement_intent_events (canvas_id, created_at DESC);

-- 9.4.a Sync current_status op po_improvement_intents bij event-insert
CREATE OR REPLACE FUNCTION po_intent_sync_current_status()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE new_status text;
BEGIN
  new_status := CASE NEW.event_type
    WHEN 'made_definitief' THEN 'definitief'
    WHEN 'made_concept'    THEN 'concept'
    WHEN 'back_to_concept' THEN 'concept'
    WHEN 'dismissed'       THEN 'dismissed'
    WHEN 'restored'        THEN 'concept'
    ELSE NULL  -- created/edited/refined: status blijft staan
  END;
  IF new_status IS NOT NULL THEN
    UPDATE po_improvement_intents
       SET current_status = new_status
     WHERE id = NEW.intent_id;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS po_iie_sync_status ON po_improvement_intent_events;
CREATE TRIGGER po_iie_sync_status
  AFTER INSERT ON po_improvement_intent_events
  FOR EACH ROW EXECUTE FUNCTION po_intent_sync_current_status();

-- 9.5 po_input_suggestion_events (RFC-002 dossier-AI audit)
CREATE TABLE IF NOT EXISTS po_input_suggestion_events (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  target_table    text NOT NULL CHECK (target_table IN (
                    'pr_processes', 'pr_process_steps',
                    'org_departments',
                    'vo_business_units', 'vo_value_teams',
                    'gov_control_processes',
                    'po_pain_points'
                  )),
  target_id       uuid NOT NULL,
  affordance      text NOT NULL CHECK (affordance IN (
                    'processes_from_dossier',
                    'departments_from_dossier',
                    'business_units_from_dossier',
                    'value_teams_from_dossier',
                    'control_processes_from_dossier',
                    'fields_from_dossier',
                    'pain_points_from_dossier'
                  )),
  event_type      text NOT NULL CHECK (event_type IN (
                    'ai_generated', 'edited', 'accepted', 'rejected'
                  )),
  actor_user_id   uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_role      text,
  text_before_md  text,
  text_after_md   text,
  metadata        jsonb NOT NULL DEFAULT '{}'::jsonb,
  tenant_id       uuid NOT NULL REFERENCES tenants(id)  ON DELETE RESTRICT,
  canvas_id       uuid NOT NULL REFERENCES canvases(id) ON DELETE CASCADE,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS po_ise_target_idx
  ON po_input_suggestion_events (target_table, target_id, created_at);
CREATE INDEX IF NOT EXISTS po_ise_canvas_idx
  ON po_input_suggestion_events (canvas_id, created_at DESC);
CREATE INDEX IF NOT EXISTS po_ise_affordance_idx
  ON po_input_suggestion_events (affordance, created_at);

-- 9.5.a Polymorphic target-validatie (uitzondering voor rejected op verwijderde target)
CREATE OR REPLACE FUNCTION validate_po_input_suggestion_target()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  target_canvas uuid; target_tenant uuid; q text;
BEGIN
  -- Bij rejected-event op verwijderde target: audit-preservatie, geen validatie
  IF NEW.event_type = 'rejected' THEN
    q := format('SELECT canvas_id, tenant_id FROM %I WHERE id = $1', NEW.target_table);
    BEGIN
      EXECUTE q INTO target_canvas, target_tenant USING NEW.target_id;
    EXCEPTION WHEN OTHERS THEN
      -- Target-table-FK fail of andere fout: laat door (rejected mag op verwijderd target)
      RETURN NEW;
    END;
    IF target_canvas IS NULL THEN
      -- Target verwijderd: rejected-event mag, audit-trail bewaard
      RETURN NEW;
    END IF;
  ELSE
    q := format('SELECT canvas_id, tenant_id FROM %I WHERE id = $1', NEW.target_table);
    EXECUTE q INTO target_canvas, target_tenant USING NEW.target_id;
    IF target_canvas IS NULL THEN
      RAISE EXCEPTION 'po_input_suggestion_events.target_id % bestaat niet in %', NEW.target_id, NEW.target_table;
    END IF;
  END IF;
  IF target_canvas IS NOT NULL AND
     (NEW.canvas_id IS DISTINCT FROM target_canvas
      OR NEW.tenant_id IS DISTINCT FROM target_tenant) THEN
    RAISE EXCEPTION 'cross-canvas/tenant niet toegestaan in po_input_suggestion_events';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS po_ise_validate ON po_input_suggestion_events;
CREATE TRIGGER po_ise_validate
  BEFORE INSERT ON po_input_suggestion_events
  FOR EACH ROW EXECUTE FUNCTION validate_po_input_suggestion_target();

-- ============================================================
-- §10 RLS — alle 14 tabellen
-- ============================================================

-- Standaard tenant+eigenaar/tenant_admin-pattern (anker cd_*-policies)
-- voor 12 data-tabellen.
DO $$
DECLARE
  tbl text;
  policy_name text;
  tbls text[] := ARRAY[
    'pr_processes', 'pr_process_steps',
    'org_structuring_doorsnede', 'org_departments', 'org_process_department_intensity',
    'vo_change_approach', 'vo_business_units', 'vo_value_teams', 'vo_schets_uploads',
    'gov_steering_model', 'gov_control_processes',
    'po_pain_points', 'po_pain_point_couplings',
    'po_improvement_intents', 'po_intent_pain_point_links'
  ];
BEGIN
  FOREACH tbl IN ARRAY tbls LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', tbl);
    policy_name := tbl || ' tenant + eigenaar';
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', policy_name, tbl);
    EXECUTE format($pol$
      CREATE POLICY %I ON %I FOR ALL
        USING (
          tenant_id = current_tenant_id()
          AND (
            canvas_id IN (SELECT id FROM canvases WHERE user_id = auth.uid())
            OR current_user_role() = 'tenant_admin'
          )
        )
        WITH CHECK (
          tenant_id = current_tenant_id()
          AND (
            canvas_id IN (SELECT id FROM canvases WHERE user_id = auth.uid())
            OR current_user_role() = 'tenant_admin'
          )
        )
    $pol$, policy_name, tbl);
  END LOOP;
END
$$;

-- Append-only voor de 2 events-tabellen: SELECT + INSERT only
ALTER TABLE po_improvement_intent_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "po_iie SELECT" ON po_improvement_intent_events;
CREATE POLICY "po_iie SELECT" ON po_improvement_intent_events FOR SELECT
  USING (
    tenant_id = current_tenant_id()
    AND (
      canvas_id IN (SELECT id FROM canvases WHERE user_id = auth.uid())
      OR current_user_role() = 'tenant_admin'
    )
  );
DROP POLICY IF EXISTS "po_iie INSERT" ON po_improvement_intent_events;
CREATE POLICY "po_iie INSERT" ON po_improvement_intent_events FOR INSERT
  WITH CHECK (
    tenant_id = current_tenant_id()
    AND (
      canvas_id IN (SELECT id FROM canvases WHERE user_id = auth.uid())
      OR current_user_role() = 'tenant_admin'
    )
  );
-- GEEN UPDATE/DELETE-policies = append-only afgedwongen via RLS

ALTER TABLE po_input_suggestion_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "po_ise SELECT" ON po_input_suggestion_events;
CREATE POLICY "po_ise SELECT" ON po_input_suggestion_events FOR SELECT
  USING (
    tenant_id = current_tenant_id()
    AND (
      canvas_id IN (SELECT id FROM canvases WHERE user_id = auth.uid())
      OR current_user_role() = 'tenant_admin'
    )
  );
DROP POLICY IF EXISTS "po_ise INSERT" ON po_input_suggestion_events;
CREATE POLICY "po_ise INSERT" ON po_input_suggestion_events FOR INSERT
  WITH CHECK (
    tenant_id = current_tenant_id()
    AND (
      canvas_id IN (SELECT id FROM canvases WHERE user_id = auth.uid())
      OR current_user_role() = 'tenant_admin'
    )
  );
-- GEEN UPDATE/DELETE-policies = append-only afgedwongen via RLS

-- ============================================================
-- Einde migratie 11.M C1
-- ============================================================
