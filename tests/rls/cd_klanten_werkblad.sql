-- ============================================================
-- RLS-test-suite — Klanten & Dienstverlening werkblad (cd_*-tabellen)
--
-- Implementeert RFC-001 §7 (negen tests). Reproduceerbaar uitvoeren via
-- Supabase-MCP `execute_sql` (autocommit-mode); test-fixtures worden
-- aan het einde via service-role gecleanupt.
--
-- Pre-conditions in productie-DB:
--   - Drie tenants: Platform / Kingfisher / TLB
--   - Drie users: Kees (Platform admin), Gmail (KF tenant_admin), TLB-user (tenant_user)
--   - Bestaande canvases per tenant (zie SELECT canvases ORDER BY tenant)
--
-- Vaste UUIDs voor test-fixtures (kunnen veilig gecleanupt worden):
--   TLB-test-dimension  : 11111111-1111-1111-1111-1111111111ff
--   TLB-test-item       : 22222222-2222-2222-2222-2222222222ff
--   KF-test-pain-point  : 33333333-3333-3333-3333-3333333333ff
--
-- Acceptatiecriterium: tests 1-5 en test 9 expliciet groen (RLS isoleert,
-- triggers blokkeren, append-only-discipline werkt, partial UNIQUE bites).
-- Tests 6-8 zijn schema-only — queries draaien zonder error, returnen
-- mogelijk 0 rows omdat geen feature-data aanwezig is in MVP-scope.
-- ============================================================

-- ── SETUP — via service-role (RLS-bypass) ──
-- Eén dimension + één item in TLB-tenant zodat KF-user-context er niets van kan
-- zien. Eén pain-point in KF-tenant (canvas bdc24365) voor cross-canvas test.
INSERT INTO cd_dimensions (id, canvas_id, tenant_id, archetype, name, sort_order)
VALUES (
  '11111111-1111-1111-1111-1111111111ff',
  'c793049f-2265-4cd9-b880-d022dc0e0329',  -- TLB canvas
  'f79480e8-9887-495e-b791-5a9a5d679e1e',  -- TLB tenant
  'klantsegment',
  'TEST-RLS-TLB-segment',
  9999
) ON CONFLICT (id) DO NOTHING;

INSERT INTO cd_items (id, dimension_id, canvas_id, tenant_id, name, sort_order)
VALUES (
  '22222222-2222-2222-2222-2222222222ff',
  '11111111-1111-1111-1111-1111111111ff',
  'c793049f-2265-4cd9-b880-d022dc0e0329',
  'f79480e8-9887-495e-b791-5a9a5d679e1e',
  'TEST-RLS-TLB-item',
  9999
) ON CONFLICT (id) DO NOTHING;

INSERT INTO cd_pain_points (id, canvas_id, tenant_id, text_md, sort_order)
VALUES (
  '33333333-3333-3333-3333-3333333333ff',
  'bdc24365-fa92-44e7-b5bb-14e3ce501b1a',  -- KF canvas
  '00000000-0000-0000-0000-000000000002',  -- KF tenant
  'TEST-RLS-KF-pain',
  9999
) ON CONFLICT (id) DO NOTHING;


-- ============================================================
-- TEST 1 — Cross-tenant SELECT blokkeert (RFC-001 §7.1)
-- KF-user-context probeert TLB cd_dimensions te zien → 0 rijen.
-- Service-role baseline ervoor: bewijst dat de rij wél bestaat.
-- ============================================================

-- BEGIN-block 1
BEGIN;
  SET LOCAL ROLE authenticated;
  SET LOCAL "request.jwt.claims" TO '{"sub":"6f0dac6b-d082-41f4-be2f-e0aacca4c73b","role":"authenticated"}';
  SELECT
    'test_1_cross_tenant_select' AS test,
    count(*) AS visible_tlb_dims,
    'expected: 0' AS expected
  FROM cd_dimensions
  WHERE tenant_id = 'f79480e8-9887-495e-b791-5a9a5d679e1e';
ROLLBACK;


-- ============================================================
-- TEST 2 — Cross-tenant INSERT blokkeert (RFC-001 §7.1)
-- KF-user probeert dimension in TLB tenant_id te INSERTen → RLS WITH CHECK
-- weigert (PostgREST/PG-error: "new row violates row-level security policy").
-- ============================================================
BEGIN;
  SET LOCAL ROLE authenticated;
  SET LOCAL "request.jwt.claims" TO '{"sub":"6f0dac6b-d082-41f4-be2f-e0aacca4c73b","role":"authenticated"}';
  -- Verwacht: errorcode 42501 (insufficient_privilege) door RLS WITH CHECK.
  -- We vangen het op zodat het script doorloopt.
  DO $$
  BEGIN
    BEGIN
      INSERT INTO cd_dimensions (canvas_id, tenant_id, archetype, name)
      VALUES (
        'bdc24365-fa92-44e7-b5bb-14e3ce501b1a',
        'f79480e8-9887-495e-b791-5a9a5d679e1e',  -- TLB tenant_id (cross-tenant attack)
        'klantsegment',
        'TEST-RLS-attack-fail'
      );
      RAISE NOTICE 'TEST 2 FAIL: cross-tenant INSERT slaagde onverwacht';
    EXCEPTION WHEN insufficient_privilege OR check_violation THEN
      RAISE NOTICE 'TEST 2 PASS: cross-tenant INSERT geweigerd (% — %)', SQLSTATE, SQLERRM;
    END;
  END $$;
ROLLBACK;


-- ============================================================
-- TEST 3 — Cross-canvas polymorphic-koppeling blokkeert (RFC-001 §7.2)
-- Pain-point uit KF-canvas-A probeert te koppelen aan TLB-dimension →
-- trigger validate_pain_point_coupling raised exception.
-- (Service-role context want test betreft trigger, niet RLS.)
-- ============================================================
DO $$
BEGIN
  BEGIN
    INSERT INTO cd_pain_point_couplings
      (pain_point_id, target_table, target_id, tenant_id, canvas_id)
    VALUES
      ('33333333-3333-3333-3333-3333333333ff',          -- KF pain
       'cd_dimensions',
       '11111111-1111-1111-1111-1111111111ff',           -- TLB dim
       '00000000-0000-0000-0000-000000000002',           -- KF tenant
       'bdc24365-fa92-44e7-b5bb-14e3ce501b1a');          -- KF canvas
    RAISE NOTICE 'TEST 3 FAIL: cross-canvas-koppeling slaagde onverwacht';
  EXCEPTION WHEN raise_exception OR others THEN
    RAISE NOTICE 'TEST 3 PASS: cross-canvas-koppeling geweigerd (% — %)', SQLSTATE, SQLERRM;
  END;
END $$;


-- ============================================================
-- TEST 4 — Append-only audit-tabel UPDATE blokkeert (RFC-001 §7.3)
-- ============================================================
-- Eerst seed: maak een suggestion + event in KF-tenant zodat we 'iets' hebben
-- om te proberen te UPDATEn.
INSERT INTO cd_pattern_suggestions (id, canvas_id, tenant_id, pattern_type, text_md, scope)
VALUES (
  '44444444-4444-4444-4444-4444444444ff',
  'bdc24365-fa92-44e7-b5bb-14e3ce501b1a',
  '00000000-0000-0000-0000-000000000002',
  'cluster',
  'TEST-RLS-suggestion',
  'canvas'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO cd_pattern_suggestion_events (id, suggestion_id, event_type, metadata, tenant_id, canvas_id)
VALUES (
  '55555555-5555-5555-5555-5555555555ff',
  '44444444-4444-4444-4444-4444444444ff',
  'ai_generated',
  '{"test":"rls"}'::jsonb,
  '00000000-0000-0000-0000-000000000002',
  'bdc24365-fa92-44e7-b5bb-14e3ce501b1a'
) ON CONFLICT (id) DO NOTHING;

-- KF-user-context probeert te UPDATEn → geen UPDATE-policy → 0 rows updated.
BEGIN;
  SET LOCAL ROLE authenticated;
  SET LOCAL "request.jwt.claims" TO '{"sub":"6f0dac6b-d082-41f4-be2f-e0aacca4c73b","role":"authenticated"}';
  WITH upd AS (
    UPDATE cd_pattern_suggestion_events
       SET text_after_md = 'tampered'
     WHERE id = '55555555-5555-5555-5555-5555555555ff'
    RETURNING id
  )
  SELECT
    'test_4_event_update' AS test,
    count(*) AS rows_affected,
    'expected: 0' AS expected
  FROM upd;
ROLLBACK;


-- ============================================================
-- TEST 5 — Append-only audit-tabel DELETE blokkeert (RFC-001 §7.3)
-- ============================================================
BEGIN;
  SET LOCAL ROLE authenticated;
  SET LOCAL "request.jwt.claims" TO '{"sub":"6f0dac6b-d082-41f4-be2f-e0aacca4c73b","role":"authenticated"}';
  WITH del AS (
    DELETE FROM cd_pattern_suggestion_events
     WHERE id = '55555555-5555-5555-5555-5555555555ff'
    RETURNING id
  )
  SELECT
    'test_5_event_delete' AS test,
    count(*) AS rows_affected,
    'expected: 0' AS expected
  FROM del;
ROLLBACK;


-- ============================================================
-- TEST 6 — Multi-relationele query draait (schema-only, RFC-001 §7.4)
-- ============================================================
SELECT
  'test_6_multi_rel_query' AS test,
  count(*) AS pp_via_dim,
  'expected: 0 (no fixture-couplings yet)' AS expected
FROM cd_pain_points pp
JOIN cd_pain_point_couplings ppc ON ppc.pain_point_id = pp.id
WHERE ppc.target_table = 'cd_dimensions';


-- ============================================================
-- TEST 7 — is_floating-trigger werkt (RFC-001 §7.4)
-- KF-pain heeft geen koppelingen → is_floating = true.
-- Voeg coupling toe → is_floating = false. Verwijder → is_floating = true.
-- ============================================================
-- State-1: voor coupling
SELECT 'test_7a_floating_pre' AS test, is_floating, 'expected: true' AS expected
  FROM cd_pain_points WHERE id = '33333333-3333-3333-3333-3333333333ff';

-- Maak een KF-dimension om aan te koppelen (idempotent)
INSERT INTO cd_dimensions (id, canvas_id, tenant_id, archetype, name)
VALUES (
  '66666666-6666-6666-6666-6666666666ff',
  'bdc24365-fa92-44e7-b5bb-14e3ce501b1a',
  '00000000-0000-0000-0000-000000000002',
  'klantsegment',
  'TEST-RLS-KF-segment'
) ON CONFLICT (id) DO NOTHING;

-- Voeg coupling toe
INSERT INTO cd_pain_point_couplings (id, pain_point_id, target_table, target_id, tenant_id, canvas_id)
VALUES (
  '77777777-7777-7777-7777-7777777777ff',
  '33333333-3333-3333-3333-3333333333ff',
  'cd_dimensions',
  '66666666-6666-6666-6666-6666666666ff',
  '00000000-0000-0000-0000-000000000002',
  'bdc24365-fa92-44e7-b5bb-14e3ce501b1a'
) ON CONFLICT (pain_point_id, target_table, target_id) DO NOTHING;

-- State-2: na coupling
SELECT 'test_7b_floating_post' AS test, is_floating, 'expected: false' AS expected
  FROM cd_pain_points WHERE id = '33333333-3333-3333-3333-3333333333ff';

-- Verwijder coupling
DELETE FROM cd_pain_point_couplings WHERE id = '77777777-7777-7777-7777-7777777777ff';

-- State-3: na cleanup
SELECT 'test_7c_floating_after_delete' AS test, is_floating, 'expected: true' AS expected
  FROM cd_pain_points WHERE id = '33333333-3333-3333-3333-3333333333ff';


-- ============================================================
-- TEST 8 — Suggestion-tree consistent (RFC-001 §7.5, schema-only)
-- ============================================================
-- Maak child-suggestion met parent_id verwijzend naar test-suggestion (id ...4ff)
INSERT INTO cd_pattern_suggestions (id, canvas_id, tenant_id, pattern_type, text_md, scope, parent_id)
VALUES (
  '88888888-8888-8888-8888-8888888888ff',
  'bdc24365-fa92-44e7-b5bb-14e3ce501b1a',
  '00000000-0000-0000-0000-000000000002',
  'cluster',
  'TEST-RLS-child-suggestion',
  'canvas',
  '44444444-4444-4444-4444-4444444444ff'
) ON CONFLICT (id) DO NOTHING;

SELECT
  'test_8_suggestion_tree' AS test,
  count(*) FILTER (WHERE parent_id IS NULL)     AS roots,
  count(*) FILTER (WHERE parent_id IS NOT NULL) AS refines,
  'expected: roots=1, refines=1 (test-fixtures only)' AS expected
FROM cd_pattern_suggestions
WHERE id IN (
  '44444444-4444-4444-4444-4444444444ff',
  '88888888-8888-8888-8888-8888888888ff'
);


-- ============================================================
-- TEST 9 — Partial UNIQUE op source_suggestion_id (RFC-001 §7.5)
-- Twee intents naar dezelfde suggestion → tweede faalt op partial UNIQUE.
-- ============================================================
-- Eerste promote (slaagt)
INSERT INTO cd_improvement_intents (id, canvas_id, tenant_id, title, intent_md, source_suggestion_id)
VALUES (
  '99999999-9999-9999-9999-9999999999ff',
  'bdc24365-fa92-44e7-b5bb-14e3ce501b1a',
  '00000000-0000-0000-0000-000000000002',
  'TEST intent A',
  'eerste promote — slaagt',
  '44444444-4444-4444-4444-4444444444ff'
) ON CONFLICT (id) DO NOTHING;

-- Tweede promote naar dezelfde suggestion → moet falen op partial UNIQUE
DO $$
BEGIN
  BEGIN
    INSERT INTO cd_improvement_intents (canvas_id, tenant_id, title, intent_md, source_suggestion_id)
    VALUES (
      'bdc24365-fa92-44e7-b5bb-14e3ce501b1a',
      '00000000-0000-0000-0000-000000000002',
      'TEST intent B',
      'tweede promote — moet falen',
      '44444444-4444-4444-4444-4444444444ff'  -- zelfde suggestion-id
    );
    RAISE NOTICE 'TEST 9 FAIL: tweede promote slaagde onverwacht';
  EXCEPTION WHEN unique_violation THEN
    RAISE NOTICE 'TEST 9 PASS: partial UNIQUE blokkeerde tweede promote (%)', SQLERRM;
  END;
END $$;


-- ============================================================
-- CLEANUP — verwijder alle test-fixtures (vaste UUIDs)
-- ============================================================
DELETE FROM cd_improvement_intents      WHERE id IN ('99999999-9999-9999-9999-9999999999ff');
DELETE FROM cd_pattern_suggestions      WHERE id IN ('44444444-4444-4444-4444-4444444444ff', '88888888-8888-8888-8888-8888888888ff');
-- ↑ events worden CASCADE'd via suggestion_id-FK
DELETE FROM cd_pain_points              WHERE id IN ('33333333-3333-3333-3333-3333333333ff');
-- ↑ couplings (alle 7777...ff varianten) zijn al gedelete in test-7
DELETE FROM cd_items                    WHERE id IN ('22222222-2222-2222-2222-2222222222ff');
DELETE FROM cd_dimensions               WHERE id IN ('11111111-1111-1111-1111-1111111111ff', '66666666-6666-6666-6666-6666666666ff');
