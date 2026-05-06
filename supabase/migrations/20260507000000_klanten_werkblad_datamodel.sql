-- ============================================================
-- Stap 11.D — Klanten & Dienstverlening werkblad datamodel
--
-- Implementeert RFC-001 §2-§3 in één migratie.
--
-- Zeven cd_*-tabellen + één append-only audit-tabel:
--   1. cd_dimensions                 — dimensies per canvas (archetype + naam)
--   2. cd_items                      — items per dimensie (archetype_data jsonb)
--   3. cd_pain_points                — multi-relationele waarnemingen
--   4. cd_pain_point_couplings       — polymorphic koppeling pain ↔ dim/item
--   5. cd_pattern_suggestions        — AI-output + status (verfijn-tree)
--   6. cd_pattern_suggestion_events  — append-only audit-trail
--   7. cd_improvement_intents        — verbeterrichtingen (1:1 vanuit suggestions)
--
-- Drie validate-trigger-functies (RFC-001 §3.2 / §3.4 / §3.5):
--   - validate_cd_items_dimension_link
--   - validate_pain_point_coupling
--   - validate_cd_ps_scope_target
--
-- Plus support-triggers:
--   - cd_pp_recompute_is_floating()  — bij ppc INSERT/DELETE update pain.is_floating
--   - cd_ps_sync_current_status()    — bij events INSERT update suggestion.current_status
--
-- RLS-pattern (RFC-001 §3): canvases-policy als anker
--   tenant_id = current_tenant_id()
--   AND (canvas_id IN (SELECT id FROM canvases WHERE user_id = auth.uid())
--        OR current_user_role() = 'tenant_admin')
--
-- Idempotentie: CREATE TABLE IF NOT EXISTS, CREATE OR REPLACE FUNCTION,
-- DROP POLICY IF EXISTS, DROP TRIGGER IF EXISTS.
--
-- Geen wijzigingen aan bestaande tabellen (canvases, tenants, app_config,
-- block_definitions, user_profiles) — RFC-001 §5.3 garantie geen breaking
-- changes.
-- ============================================================

-- ── 1. cd_dimensions ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cd_dimensions (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  canvas_id   uuid        NOT NULL REFERENCES canvases(id) ON DELETE CASCADE,
  tenant_id   uuid        NOT NULL REFERENCES tenants(id)  ON DELETE RESTRICT,
  archetype   text        NOT NULL CHECK (archetype IN (
                  'regio', 'klantsegment', 'propositie', 'kanaal',
                  'behoefte', 'merk', 'gedragspatroon', 'klantreis', 'anders'
                )),
  name        text        NOT NULL,
  description text,
  is_ordered  boolean     NOT NULL DEFAULT false,
  sort_order  int         NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT cd_dimensions_canvas_name_unique UNIQUE (canvas_id, name)
);

CREATE INDEX IF NOT EXISTS cd_dimensions_canvas_idx
  ON cd_dimensions (canvas_id, sort_order);
CREATE INDEX IF NOT EXISTS cd_dimensions_tenant_archetype_idx
  ON cd_dimensions (tenant_id, archetype);

DROP TRIGGER IF EXISTS cd_dimensions_updated_at ON cd_dimensions;
CREATE TRIGGER cd_dimensions_updated_at
  BEFORE UPDATE ON cd_dimensions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- ── 2. cd_items + validate_cd_items_dimension_link ──────────────────────────
CREATE TABLE IF NOT EXISTS cd_items (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  dimension_id    uuid        NOT NULL REFERENCES cd_dimensions(id) ON DELETE CASCADE,
  canvas_id       uuid        NOT NULL REFERENCES canvases(id) ON DELETE CASCADE,
  tenant_id       uuid        NOT NULL REFERENCES tenants(id)  ON DELETE RESTRICT,
  name            text        NOT NULL,
  description     text,
  archetype_data  jsonb       NOT NULL DEFAULT '{}'::jsonb,
  sub_items       jsonb       NOT NULL DEFAULT '[]'::jsonb,
  sort_order      int         NOT NULL DEFAULT 0,
  is_draft        boolean     NOT NULL DEFAULT false,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS cd_items_dimension_idx
  ON cd_items (dimension_id, sort_order);
CREATE INDEX IF NOT EXISTS cd_items_canvas_idx
  ON cd_items (canvas_id);
CREATE INDEX IF NOT EXISTS cd_items_archetype_data_gin_idx
  ON cd_items USING GIN (archetype_data);

DROP TRIGGER IF EXISTS cd_items_updated_at ON cd_items;
CREATE TRIGGER cd_items_updated_at
  BEFORE UPDATE ON cd_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Trigger: cd_items.canvas_id + tenant_id moeten matchen met dimension's
-- waarden (RFC-001 §3.2). Voorkomt cross-canvas-rotzooi naast RLS.
CREATE OR REPLACE FUNCTION validate_cd_items_dimension_link()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  dim_canvas uuid;
  dim_tenant uuid;
BEGIN
  SELECT canvas_id, tenant_id INTO dim_canvas, dim_tenant
  FROM cd_dimensions WHERE id = NEW.dimension_id;

  IF dim_canvas IS NULL THEN
    RAISE EXCEPTION 'cd_items.dimension_id verwijst niet naar bestaande dimensie (%)', NEW.dimension_id;
  END IF;

  IF NEW.canvas_id IS DISTINCT FROM dim_canvas THEN
    RAISE EXCEPTION 'cd_items.canvas_id (%) wijkt af van dimension.canvas_id (%)',
                    NEW.canvas_id, dim_canvas;
  END IF;

  IF NEW.tenant_id IS DISTINCT FROM dim_tenant THEN
    RAISE EXCEPTION 'cd_items.tenant_id (%) wijkt af van dimension.tenant_id (%)',
                    NEW.tenant_id, dim_tenant;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS cd_items_validate_link ON cd_items;
CREATE TRIGGER cd_items_validate_link
  BEFORE INSERT OR UPDATE ON cd_items
  FOR EACH ROW EXECUTE FUNCTION validate_cd_items_dimension_link();


-- ── 3. cd_pain_points ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cd_pain_points (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  canvas_id    uuid        NOT NULL REFERENCES canvases(id) ON DELETE CASCADE,
  tenant_id    uuid        NOT NULL REFERENCES tenants(id)  ON DELETE RESTRICT,
  text_md      text        NOT NULL,
  is_floating  boolean     NOT NULL DEFAULT true,
  sort_order   int         NOT NULL DEFAULT 0,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS cd_pain_points_canvas_idx
  ON cd_pain_points (canvas_id, sort_order);
CREATE INDEX IF NOT EXISTS cd_pain_points_tenant_idx
  ON cd_pain_points (tenant_id);

DROP TRIGGER IF EXISTS cd_pain_points_updated_at ON cd_pain_points;
CREATE TRIGGER cd_pain_points_updated_at
  BEFORE UPDATE ON cd_pain_points
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- ── 4. cd_pain_point_couplings + validate_pain_point_coupling ──────────────
CREATE TABLE IF NOT EXISTS cd_pain_point_couplings (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  pain_point_id  uuid        NOT NULL REFERENCES cd_pain_points(id) ON DELETE CASCADE,
  target_table   text        NOT NULL CHECK (target_table IN ('cd_dimensions', 'cd_items')),
  target_id      uuid        NOT NULL,  -- polymorphic, geen FK
  tenant_id      uuid        NOT NULL REFERENCES tenants(id)  ON DELETE RESTRICT,
  canvas_id      uuid        NOT NULL REFERENCES canvases(id) ON DELETE CASCADE,
  created_at     timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT cd_ppc_unique_link UNIQUE (pain_point_id, target_table, target_id)
);

CREATE INDEX IF NOT EXISTS cd_ppc_pain_idx
  ON cd_pain_point_couplings (pain_point_id);
CREATE INDEX IF NOT EXISTS cd_ppc_target_idx
  ON cd_pain_point_couplings (target_table, target_id);
CREATE INDEX IF NOT EXISTS cd_ppc_canvas_idx
  ON cd_pain_point_couplings (canvas_id);

-- Trigger: polymorphic-validatie (RFC-001 §3.4). Dynamische SELECT op
-- target_table met %I-quoting (geen SQL-injection mogelijk: target_table
-- is door CHECK beperkt tot whitelisted waarden).
CREATE OR REPLACE FUNCTION validate_pain_point_coupling()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  target_canvas uuid;
  target_tenant uuid;
  q text;
BEGIN
  IF NEW.target_table NOT IN ('cd_dimensions', 'cd_items') THEN
    RAISE EXCEPTION 'Onbekende target_table: %', NEW.target_table;
  END IF;

  q := format('SELECT canvas_id, tenant_id FROM %I WHERE id = $1', NEW.target_table);
  EXECUTE q INTO target_canvas, target_tenant USING NEW.target_id;

  IF target_canvas IS NULL THEN
    RAISE EXCEPTION 'target_id % bestaat niet in %', NEW.target_id, NEW.target_table;
  END IF;

  IF NEW.canvas_id IS DISTINCT FROM target_canvas THEN
    RAISE EXCEPTION 'cross-canvas-koppeling niet toegestaan: ppc.canvas_id=%, target.canvas_id=%',
                    NEW.canvas_id, target_canvas;
  END IF;

  IF NEW.tenant_id IS DISTINCT FROM target_tenant THEN
    RAISE EXCEPTION 'cross-tenant-koppeling niet toegestaan';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS cd_ppc_validate ON cd_pain_point_couplings;
CREATE TRIGGER cd_ppc_validate
  BEFORE INSERT OR UPDATE ON cd_pain_point_couplings
  FOR EACH ROW EXECUTE FUNCTION validate_pain_point_coupling();

-- Trigger: bij INSERT/DELETE van een coupling herbereken pain.is_floating
-- (true als geen koppelingen). Houdt RFC-001 §2.3 denormalisatie sync.
CREATE OR REPLACE FUNCTION cd_pp_recompute_is_floating()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  affected_pain uuid;
BEGIN
  IF TG_OP = 'DELETE' THEN
    affected_pain := OLD.pain_point_id;
  ELSE
    affected_pain := NEW.pain_point_id;
  END IF;

  UPDATE cd_pain_points
     SET is_floating = NOT EXISTS (
       SELECT 1 FROM cd_pain_point_couplings WHERE pain_point_id = affected_pain
     )
   WHERE id = affected_pain;

  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS cd_ppc_recompute_floating ON cd_pain_point_couplings;
CREATE TRIGGER cd_ppc_recompute_floating
  AFTER INSERT OR DELETE ON cd_pain_point_couplings
  FOR EACH ROW EXECUTE FUNCTION cd_pp_recompute_is_floating();


-- ── 5. cd_pattern_suggestions + validate_cd_ps_scope_target ────────────────
CREATE TABLE IF NOT EXISTS cd_pattern_suggestions (
  id                      uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  canvas_id               uuid        NOT NULL REFERENCES canvases(id) ON DELETE CASCADE,
  tenant_id               uuid        NOT NULL REFERENCES tenants(id)  ON DELETE RESTRICT,
  pattern_type            text        NOT NULL CHECK (pattern_type IN (
                              'cluster', 'paradox', 'positionering',
                              'overstijgend', 'eigen'
                            )),
  text_md                 text        NOT NULL,
  original_ai_text_md     text,
  parent_id               uuid        REFERENCES cd_pattern_suggestions(id) ON DELETE SET NULL,
  scope                   text        NOT NULL CHECK (scope IN ('canvas', 'dimension', 'item')),
  scope_target_id         uuid,
  current_status          text        NOT NULL DEFAULT 'open' CHECK (current_status IN (
                              'open', 'accepted', 'rejected', 'refined', 'promoted'
                            )),
  is_user_edited          boolean     NOT NULL DEFAULT false,
  vanuit                  jsonb,
  promoted_to_intent_at   timestamptz,
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT cd_ps_scope_target_consistency CHECK (
    (scope = 'canvas' AND scope_target_id IS NULL) OR
    (scope IN ('dimension', 'item') AND scope_target_id IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS cd_ps_canvas_status_idx
  ON cd_pattern_suggestions (canvas_id, current_status);
CREATE INDEX IF NOT EXISTS cd_ps_parent_idx
  ON cd_pattern_suggestions (parent_id) WHERE parent_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS cd_ps_scope_idx
  ON cd_pattern_suggestions (scope, scope_target_id) WHERE scope_target_id IS NOT NULL;

DROP TRIGGER IF EXISTS cd_pattern_suggestions_updated_at ON cd_pattern_suggestions;
CREATE TRIGGER cd_pattern_suggestions_updated_at
  BEFORE UPDATE ON cd_pattern_suggestions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Trigger: scope_target_id moet bestaan in cd_dimensions of cd_items én
-- in dezelfde canvas/tenant zitten (RFC-001 §3.5).
CREATE OR REPLACE FUNCTION validate_cd_ps_scope_target()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  target_canvas uuid;
  target_tenant uuid;
BEGIN
  IF NEW.scope = 'canvas' THEN
    IF NEW.scope_target_id IS NOT NULL THEN
      RAISE EXCEPTION 'scope=canvas mag geen scope_target_id hebben';
    END IF;
    RETURN NEW;
  END IF;

  IF NEW.scope = 'dimension' THEN
    SELECT canvas_id, tenant_id INTO target_canvas, target_tenant
    FROM cd_dimensions WHERE id = NEW.scope_target_id;
  ELSIF NEW.scope = 'item' THEN
    SELECT canvas_id, tenant_id INTO target_canvas, target_tenant
    FROM cd_items WHERE id = NEW.scope_target_id;
  END IF;

  IF target_canvas IS NULL THEN
    RAISE EXCEPTION 'scope_target_id % bestaat niet voor scope=%',
                    NEW.scope_target_id, NEW.scope;
  END IF;

  IF NEW.canvas_id IS DISTINCT FROM target_canvas
     OR NEW.tenant_id IS DISTINCT FROM target_tenant THEN
    RAISE EXCEPTION 'scope_target zit in andere canvas/tenant dan suggestion';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS cd_ps_validate_scope ON cd_pattern_suggestions;
CREATE TRIGGER cd_ps_validate_scope
  BEFORE INSERT OR UPDATE ON cd_pattern_suggestions
  FOR EACH ROW EXECUTE FUNCTION validate_cd_ps_scope_target();


-- ── 6. cd_pattern_suggestion_events (append-only audit-trail) ──────────────
CREATE TABLE IF NOT EXISTS cd_pattern_suggestion_events (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  suggestion_id   uuid        NOT NULL REFERENCES cd_pattern_suggestions(id) ON DELETE CASCADE,
  event_type      text        NOT NULL CHECK (event_type IN (
                      'ai_generated', 'edited', 'accepted', 'rejected',
                      'refined_dig_deeper', 'promoted_to_intent', 'unpromoted'
                    )),
  actor_user_id   uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_role      text,
  text_before_md  text,
  text_after_md   text,
  metadata        jsonb       NOT NULL DEFAULT '{}'::jsonb,
  tenant_id       uuid        NOT NULL REFERENCES tenants(id)  ON DELETE RESTRICT,
  canvas_id       uuid        NOT NULL REFERENCES canvases(id) ON DELETE CASCADE,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS cd_pse_suggestion_idx
  ON cd_pattern_suggestion_events (suggestion_id, created_at);
CREATE INDEX IF NOT EXISTS cd_pse_canvas_idx
  ON cd_pattern_suggestion_events (canvas_id, created_at DESC);

-- Trigger: bij elke event-INSERT die status-relevant is, sync
-- cd_pattern_suggestions.current_status (denormalisatie uit RFC-001 §2.5).
CREATE OR REPLACE FUNCTION cd_ps_sync_current_status()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  new_status text;
BEGIN
  -- Mapping van event_type → current_status
  new_status := CASE NEW.event_type
    WHEN 'accepted'           THEN 'accepted'
    WHEN 'rejected'           THEN 'rejected'
    WHEN 'refined_dig_deeper' THEN 'refined'
    WHEN 'promoted_to_intent' THEN 'promoted'
    WHEN 'unpromoted'         THEN 'open'
    ELSE NULL  -- ai_generated, edited: status blijft staan
  END;

  IF new_status IS NOT NULL THEN
    UPDATE cd_pattern_suggestions
       SET current_status = new_status
     WHERE id = NEW.suggestion_id;
  END IF;

  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS cd_pse_sync_status ON cd_pattern_suggestion_events;
CREATE TRIGGER cd_pse_sync_status
  AFTER INSERT ON cd_pattern_suggestion_events
  FOR EACH ROW EXECUTE FUNCTION cd_ps_sync_current_status();


-- ── 7. cd_improvement_intents ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cd_improvement_intents (
  id                       uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  canvas_id                uuid        NOT NULL REFERENCES canvases(id) ON DELETE CASCADE,
  tenant_id                uuid        NOT NULL REFERENCES tenants(id)  ON DELETE RESTRICT,
  title                    text        NOT NULL,
  intent_md                text        NOT NULL,
  source_suggestion_id     uuid        REFERENCES cd_pattern_suggestions(id) ON DELETE SET NULL,
  vanuit                   jsonb,
  status                   text        NOT NULL DEFAULT 'concept' CHECK (status IN ('concept', 'verstuurd')),
  handover_to_roadmap_at   timestamptz,
  roadmap_action_ids       uuid[]      NOT NULL DEFAULT ARRAY[]::uuid[],
  sort_order               int         NOT NULL DEFAULT 0,
  created_at               timestamptz NOT NULL DEFAULT now(),
  updated_at               timestamptz NOT NULL DEFAULT now()
);

-- Partial UNIQUE: één intent per suggestion (1:1 promote-relatie).
CREATE UNIQUE INDEX IF NOT EXISTS cd_intents_source_unique
  ON cd_improvement_intents (source_suggestion_id)
  WHERE source_suggestion_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS cd_intents_canvas_idx
  ON cd_improvement_intents (canvas_id, sort_order);
CREATE INDEX IF NOT EXISTS cd_intents_status_idx
  ON cd_improvement_intents (canvas_id, status);

DROP TRIGGER IF EXISTS cd_improvement_intents_updated_at ON cd_improvement_intents;
CREATE TRIGGER cd_improvement_intents_updated_at
  BEFORE UPDATE ON cd_improvement_intents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- ============================================================
-- 8. RLS — alle tabellen ENABLED, policies per RFC-001 §3
-- ============================================================
-- Pattern (anker: canvases-policy in 20260424040000 regel 63-78):
--   tenant_id = current_tenant_id()
--   AND (canvas_id IN (SELECT id FROM canvases WHERE user_id = auth.uid())
--        OR current_user_role() = 'tenant_admin')
-- ============================================================

-- ── cd_dimensions ──
ALTER TABLE cd_dimensions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cd_dimensions tenant + eigenaar" ON cd_dimensions;
CREATE POLICY "cd_dimensions tenant + eigenaar"
  ON cd_dimensions FOR ALL
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
  );

-- ── cd_items ──
ALTER TABLE cd_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cd_items tenant + eigenaar" ON cd_items;
CREATE POLICY "cd_items tenant + eigenaar"
  ON cd_items FOR ALL
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
  );

-- ── cd_pain_points ──
ALTER TABLE cd_pain_points ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cd_pain_points tenant + eigenaar" ON cd_pain_points;
CREATE POLICY "cd_pain_points tenant + eigenaar"
  ON cd_pain_points FOR ALL
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
  );

-- ── cd_pain_point_couplings ──
ALTER TABLE cd_pain_point_couplings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cd_ppc tenant + eigenaar" ON cd_pain_point_couplings;
CREATE POLICY "cd_ppc tenant + eigenaar"
  ON cd_pain_point_couplings FOR ALL
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
  );

-- ── cd_pattern_suggestions ──
ALTER TABLE cd_pattern_suggestions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cd_pattern_suggestions tenant + eigenaar" ON cd_pattern_suggestions;
CREATE POLICY "cd_pattern_suggestions tenant + eigenaar"
  ON cd_pattern_suggestions FOR ALL
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
  );

-- ── cd_pattern_suggestion_events (append-only) ──
-- SELECT-policy: standaard tenant+eigenaar.
-- INSERT-policy: standaard tenant+eigenaar.
-- GEEN UPDATE/DELETE-policies → die operaties worden geblokkeerd door RLS
-- (uitzondering: service-role bypass voor platform_admin data-fixes).
ALTER TABLE cd_pattern_suggestion_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cd_pse SELECT" ON cd_pattern_suggestion_events;
CREATE POLICY "cd_pse SELECT"
  ON cd_pattern_suggestion_events FOR SELECT
  USING (
    tenant_id = current_tenant_id()
    AND (
      canvas_id IN (SELECT id FROM canvases WHERE user_id = auth.uid())
      OR current_user_role() = 'tenant_admin'
    )
  );

DROP POLICY IF EXISTS "cd_pse INSERT" ON cd_pattern_suggestion_events;
CREATE POLICY "cd_pse INSERT"
  ON cd_pattern_suggestion_events FOR INSERT
  WITH CHECK (
    tenant_id = current_tenant_id()
    AND (
      canvas_id IN (SELECT id FROM canvases WHERE user_id = auth.uid())
      OR current_user_role() = 'tenant_admin'
    )
  );

-- ── cd_improvement_intents ──
ALTER TABLE cd_improvement_intents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cd_improvement_intents tenant + eigenaar" ON cd_improvement_intents;
CREATE POLICY "cd_improvement_intents tenant + eigenaar"
  ON cd_improvement_intents FOR ALL
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
  );
