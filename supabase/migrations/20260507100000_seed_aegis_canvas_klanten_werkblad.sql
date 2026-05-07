-- ============================================================
-- Stap 11.D — Aegis-fictie test-canvas in Kingfisher-tenant
--
-- Pad A uit instructie sectie 178-184 (reproduceerbaar via seed).
--
-- Twee canvases in KF-tenant onder Gmail-user (KF tenant_admin):
--   1. "Aegis Verzekering — Klanten & Dienstverlening" (gevuld met mock-data)
--   2. "Klanten — leeg test-canvas" (leeg, voor empty-state test)
--
-- Vaste UUIDs voor reproduceerbaarheid:
--   Aegis canvas: aaaaaaaa-eeee-eeee-eeee-aaaaaaaaaaaa
--   Leeg canvas:  bbbbbbbb-eeee-eeee-eeee-bbbbbbbbbbbb
--
-- Dimensies in Aegis-canvas (drie archetypes uit MVP-scope):
--   - Klantsegmenten (klantsegment) — Consumer / SME / Corporate
--   - Proposities (propositie)      — Schade / Inkomensverzekering / Risk advisory
--   - Kanalen (kanaal)              — Direct online / Intermediair / Account management
--
-- archetype_data per item: uit prototype mock-data
-- (platform/design/prototypes/2026-05-06-klanten-werkblad-prototype.html
--  regel 421-448 voor segmenten; voor propositie/kanaal afgeleid van
--  Aegis-fictie + RFC-001 §2.2.1 archetype-schema).
--
-- Idempotent: ON CONFLICT (id) DO NOTHING.
-- ============================================================

-- ── Twee canvases ────────────────────────────────────────────
INSERT INTO canvases (id, user_id, tenant_id, name, client_name, industry, project_status)
VALUES
  ('aaaaaaaa-eeee-eeee-eeee-aaaaaaaaaaaa',
   '6f0dac6b-d082-41f4-be2f-e0aacca4c73b',
   '00000000-0000-0000-0000-000000000002',
   'Aegis Verzekering — Klanten & Dienstverlening',
   'Aegis Verzekering (fictie)',
   'verzekering',
   'Concept'),
  ('bbbbbbbb-eeee-eeee-eeee-bbbbbbbbbbbb',
   '6f0dac6b-d082-41f4-be2f-e0aacca4c73b',
   '00000000-0000-0000-0000-000000000002',
   'Klanten — leeg test-canvas',
   NULL,
   NULL,
   'Concept')
ON CONFLICT (id) DO NOTHING;

-- ── Dimensie 1: Klantsegmenten (klantsegment) ────────────────
INSERT INTO cd_dimensions (id, canvas_id, tenant_id, archetype, name, description, sort_order)
VALUES (
  'd1111111-eeee-eeee-eeee-111111111111',
  'aaaaaaaa-eeee-eeee-eeee-aaaaaaaaaaaa',
  '00000000-0000-0000-0000-000000000002',
  'klantsegment',
  'Klantsegmenten',
  'particuliere + zakelijke klanten op basis van strategische groep-indeling',
  10
) ON CONFLICT (id) DO NOTHING;

INSERT INTO cd_items (id, dimension_id, canvas_id, tenant_id, name, description, archetype_data, sort_order)
VALUES
  ('11111111-d1ee-eeee-eeee-111111111111',
   'd1111111-eeee-eeee-eeee-111111111111',
   'aaaaaaaa-eeee-eeee-eeee-aaaaaaaaaaaa',
   '00000000-0000-0000-0000-000000000002',
   'Consumer',
   'particuliere klanten met dagelijkse verzekeringsbehoefte',
   '{
     "omvang": "2.4M klanten · 47% omzet",
     "strategisch_belang": "kerngroep",
     "karakteristieken": "leeftijd-spreiding 25-65 · digitaal vaardig groeiend · prijsbewust",
     "behoeften": "gemak · transparantie · snelle claim-afhandeling"
   }'::jsonb,
   10),
  ('11111111-d1ee-eeee-eeee-222222222222',
   'd1111111-eeee-eeee-eeee-111111111111',
   'aaaaaaaa-eeee-eeee-eeee-aaaaaaaaaaaa',
   '00000000-0000-0000-0000-000000000002',
   'SME',
   'mkb-klanten <250 fte met zakelijke verzekeringsbehoefte',
   '{
     "omvang": "80K klanten · 22% omzet",
     "strategisch_belang": "groei",
     "karakteristieken": "gemengd digitaal/relationeel · adviesbehoefte hoog · besluit door eigenaar",
     "behoeften": "continuïteit · risicodekking · proactief advies"
   }'::jsonb,
   20),
  ('11111111-d1ee-eeee-eeee-333333333333',
   'd1111111-eeee-eeee-eeee-111111111111',
   'aaaaaaaa-eeee-eeee-eeee-aaaaaaaaaaaa',
   '00000000-0000-0000-0000-000000000002',
   'Corporate',
   'corporate klanten >250 fte met complexe risico-portefeuille',
   '{
     "omvang": "1.2K klanten · 31% omzet",
     "strategisch_belang": "behoud",
     "karakteristieken": "multi-stakeholder DMU · jaarlijkse herijking · risk-managers · tender-driven",
     "behoeften": "maatwerk · risk advisory · bewezen claim-afhandeling"
   }'::jsonb,
   30)
ON CONFLICT (id) DO NOTHING;

-- ── Dimensie 2: Proposities (propositie) ─────────────────────
INSERT INTO cd_dimensions (id, canvas_id, tenant_id, archetype, name, description, sort_order)
VALUES (
  'd2222222-eeee-eeee-eeee-222222222222',
  'aaaaaaaa-eeee-eeee-eeee-aaaaaaaaaaaa',
  '00000000-0000-0000-0000-000000000002',
  'propositie',
  'Proposities',
  'product-portefeuille en dienstverleningslagen voor de drie segmenten',
  20
) ON CONFLICT (id) DO NOTHING;

INSERT INTO cd_items (id, dimension_id, canvas_id, tenant_id, name, description, archetype_data, sort_order)
VALUES
  ('22222222-d2ee-eeee-eeee-111111111111',
   'd2222222-eeee-eeee-eeee-222222222222',
   'aaaaaaaa-eeee-eeee-eeee-aaaaaaaaaaaa',
   '00000000-0000-0000-0000-000000000002',
   'Schade',
   'schade-verzekeringsproducten voor alle segmenten',
   '{
     "differentiatie": "snelle claim-afhandeling, transparante voorwaarden",
     "prijsstelling": "marktconform met segment-staffeling",
     "levensfase": "volwassen / cash-cow",
     "concurrentiepositie": "top-3 in NL voor consumer; midden-segment voor SME"
   }'::jsonb,
   10),
  ('22222222-d2ee-eeee-eeee-222222222222',
   'd2222222-eeee-eeee-eeee-222222222222',
   'aaaaaaaa-eeee-eeee-eeee-aaaaaaaaaaaa',
   '00000000-0000-0000-0000-000000000002',
   'Inkomensverzekering',
   'AOV / WGA / WIA-aanvullingen voor SME en zelfstandigen',
   '{
     "differentiatie": "branche-specifieke pakketten + reïntegratie-ondersteuning",
     "prijsstelling": "premium met collectiviteits-korting",
     "levensfase": "groei",
     "concurrentiepositie": "uitdager in SME-segment"
   }'::jsonb,
   20),
  ('22222222-d2ee-eeee-eeee-333333333333',
   'd2222222-eeee-eeee-eeee-222222222222',
   'aaaaaaaa-eeee-eeee-eeee-aaaaaaaaaaaa',
   '00000000-0000-0000-0000-000000000002',
   'Risk advisory',
   'consultatieve dienstverlening rond risk management voor Corporate',
   '{
     "differentiatie": "data-gedreven risk-modellen + sectorexpertise",
     "prijsstelling": "uurtarief + abonnement; premium",
     "levensfase": "introductie / hypothese",
     "concurrentiepositie": "concurreert met big-4 consultancy en Aon/Marsh"
   }'::jsonb,
   30)
ON CONFLICT (id) DO NOTHING;

-- ── Dimensie 3: Kanalen (kanaal) ──────────────────────────────
INSERT INTO cd_dimensions (id, canvas_id, tenant_id, archetype, name, description, sort_order)
VALUES (
  'd3333333-eeee-eeee-eeee-333333333333',
  'aaaaaaaa-eeee-eeee-eeee-aaaaaaaaaaaa',
  '00000000-0000-0000-0000-000000000002',
  'kanaal',
  'Kanalen',
  'distributie- en service-kanalen waarmee klanten Aegis bereiken',
  30
) ON CONFLICT (id) DO NOTHING;

INSERT INTO cd_items (id, dimension_id, canvas_id, tenant_id, name, description, archetype_data, sort_order)
VALUES
  ('33333333-d3ee-eeee-eeee-111111111111',
   'd3333333-eeee-eeee-eeee-333333333333',
   'aaaaaaaa-eeee-eeee-eeee-aaaaaaaaaaaa',
   '00000000-0000-0000-0000-000000000002',
   'Direct online',
   'eigen website + app voor self-service afsluiten en beheren',
   '{
     "type": "digitaal",
     "bereik": "alle Consumer + lichte SME",
     "ervaring": "self-service · gemiddelde NPS · conversie onder benchmark",
     "economie": "lage acquisitiekosten, hoge dropout in SME-funnel"
   }'::jsonb,
   10),
  ('33333333-d3ee-eeee-eeee-222222222222',
   'd3333333-eeee-eeee-eeee-333333333333',
   'aaaaaaaa-eeee-eeee-eeee-aaaaaaaaaaaa',
   '00000000-0000-0000-0000-000000000002',
   'Intermediair',
   'verzekeringsadviseurs en assurantiekantoren als tussenkanaal',
   '{
     "type": "intermediair",
     "bereik": "SME breed + deel Consumer (advies-gevoelig)",
     "ervaring": "relatie-gedreven · hoge advieswaarde · variabele kwaliteit per kantoor",
     "economie": "hoge marge-druk door provisies; partner-coalitie zet druk op tarieven"
   }'::jsonb,
   20),
  ('33333333-d3ee-eeee-eeee-333333333333',
   'd3333333-eeee-eeee-eeee-333333333333',
   'aaaaaaaa-eeee-eeee-eeee-aaaaaaaaaaaa',
   '00000000-0000-0000-0000-000000000002',
   'Account management',
   'eigen account-managers voor Corporate en grotere SME-klanten',
   '{
     "type": "direct",
     "bereik": "Corporate (alle) + top-25% SME",
     "ervaring": "1-op-1 maatwerk · hoge tevredenheid · jaarlijkse heroriëntatie",
     "economie": "hoge servicekosten, hoge retentie en cross-sell"
   }'::jsonb,
   30)
ON CONFLICT (id) DO NOTHING;
