-- 11.M C2 — Seed labels processen-organisatie-werkblad (63 keys)
-- ~45 zoals RFC-005 §13.3 verwacht; 63 inclusief tips-body + empty-states + info-pulls.
-- Applied via Supabase-MCP apply_migration genaamd `seed_labels_processen_organisatie`.
-- Bestand in repo voor git-history; SQL is identiek aan applied versie.
-- Idempotent: ON CONFLICT (tenant_id, key) DO UPDATE.
-- T2-retro-fix-leerpunt: `label.`-prefix expliciet meegegeven.

INSERT INTO app_config (key, category, description, value, tenant_overridable) VALUES
  -- Werkblad-niveau
  ('label.processen.werkblad.titel', 'label', 'Werkblad-titel in WerkbladHeader', 'Processen & Organisatie', false),
  ('label.processen.werkblad.label_categorie', 'label', 'Categorie-label boven werkblad-naam in header', 'Werkblad', false),

  -- Fase-tabs (3-fase-flow per RFC-005 §2.1 afwijking ADR-004)
  ('label.processen.fase.1.titel', 'label', 'Fase-tab 1: Inventarisatie', 'Inventarisatie', false),
  ('label.processen.fase.2.titel', 'label', 'Fase-tab 2: Pijnpunten', 'Pijnpunten', false),
  ('label.processen.fase.3.titel', 'label', 'Fase-tab 3: Verbeteracties', 'Verbeteracties', false),

  -- Sub-tabs binnen fase 1 (4 sub-tabs per RFC-005 §3.1)
  ('label.processen.subtab.bedrijfsprocessen', 'label', 'Sub-tab 1.1', 'Bedrijfsprocessen', false),
  ('label.processen.subtab.lijnorganisatie',  'label', 'Sub-tab 1.2', 'Lijnorganisatie', false),
  ('label.processen.subtab.veranderorganisatie', 'label', 'Sub-tab 1.3', 'Veranderorganisatie', false),
  ('label.processen.subtab.besturing', 'label', 'Sub-tab 1.4', 'Besturing', false),

  -- Archetypes 1.1 + Doorsnede 1.2 + Sturingsmodel 1.4 + Control-types
  ('label.processen.archetype.besturend',     'label', 'Archetype besturend', 'Besturend', false),
  ('label.processen.archetype.primair',       'label', 'Archetype primair', 'Primair', false),
  ('label.processen.archetype.ondersteunend', 'label', 'Archetype ondersteunend', 'Ondersteunend', false),
  ('label.processen.doorsnede.functioneel',    'label', 'Doorsnede functioneel', 'Functioneel', false),
  ('label.processen.doorsnede.productgericht', 'label', 'Doorsnede productgericht', 'Productgericht', false),
  ('label.processen.doorsnede.geografisch',    'label', 'Doorsnede geografisch', 'Geografisch', false),
  ('label.processen.doorsnede.marktgericht',   'label', 'Doorsnede marktgericht', 'Marktgericht', false),
  ('label.processen.steering.hierarchisch',           'label', 'Sturingsmodel hiërarchisch', 'Hiërarchisch', false),
  ('label.processen.steering.functioneel',            'label', 'Sturingsmodel functioneel', 'Functioneel', false),
  ('label.processen.steering.klant_leverancier',      'label', 'Sturingsmodel klant-leverancier', 'Klant-leverancier', false),
  ('label.processen.steering.tijdelijke_coordinatie', 'label', 'Sturingsmodel tijdelijke coördinatie', 'Tijdelijke coördinatie', false),
  ('label.processen.control_type.jaarplan',       'label', 'Control-type jaarplan', 'Jaarplan', false),
  ('label.processen.control_type.mis_rapportage', 'label', 'Control-type MIS-rapportage', 'MIS-rapportage', false),
  ('label.processen.control_type.bijsturing',     'label', 'Control-type bijsturing', 'Bijsturing', false),

  -- Coverage-status (RFC-005 §9.3 NIEUW pattern)
  ('label.processen.coverage.open',                'label', 'Coverage-status open', 'Open', false),
  ('label.processen.coverage.covered',             'label', 'Coverage-status covered', 'Geadresseerd', false),
  ('label.processen.coverage.motivated_no_action', 'label', 'Coverage-status motivated_no_action', 'Bewust niet adresseren', false),
  ('label.processen.coverage.banner.titel',        'label', 'Coverage-banner titel', 'Coverage-overzicht', false),
  ('label.processen.coverage.banner.empty',        'label', 'Coverage-banner empty-state', 'Voeg eerst pijnpunten toe of genereer concepten op basis van inventaris-data', false),
  ('label.processen.coverage.motivatie_modal.titel', 'label', 'Bewust-niet-adresseren modal titel', 'Bewust niet adresseren', false),
  ('label.processen.coverage.motivatie_modal.helper', 'label', 'Motivatie-modal helper-tekst', 'Geef minimaal 20 tekens motivatie waarom dit pijnpunt niet wordt geadresseerd.', false),

  -- State-machine (RFC-005 §9.1)
  ('label.processen.intent.status.concept',    'label', 'Verbeteractie-status concept', 'Concept', false),
  ('label.processen.intent.status.definitief', 'label', 'Verbeteractie-status definitief', 'Definitief', false),
  ('label.processen.intent.status.dismissed',  'label', 'Verbeteractie-status dismissed', 'Wuif-weg', false),

  -- AI-source-types
  ('label.processen.source.ai_algemeen',      'label', 'AI-generatie algemeen', 'Algemeen', false),
  ('label.processen.source.ai_cluster',       'label', 'AI-generatie cluster', 'Cluster', false),
  ('label.processen.source.ai_paradox',       'label', 'AI-generatie paradox', 'Paradox', false),
  ('label.processen.source.ai_positionering', 'label', 'AI-generatie positionering', 'Positionering', false),
  ('label.processen.source.ai_overstijgend',  'label', 'AI-generatie overstijgend', 'Overstijgend', false),
  ('label.processen.source.eigen',            'label', 'Verbeteractie-bron eigen', 'Eigen', false),

  -- Knoppen + acties
  ('label.processen.knop.proces.toevoegen',     'label', '+ proces-knop', '+ Proces', false),
  ('label.processen.knop.stap.toevoegen',       'label', '+ processtap-knop', '+ Stap', false),
  ('label.processen.knop.afdeling.toevoegen',   'label', '+ afdeling-knop', '+ Afdeling', false),
  ('label.processen.knop.bu.toevoegen',         'label', '+ business unit-knop', '+ Business unit', false),
  ('label.processen.knop.team.toevoegen',       'label', '+ value team-knop', '+ Value team', false),
  ('label.processen.knop.control.toevoegen',    'label', '+ control-proces-knop', '+ Control-proces', false),
  ('label.processen.knop.pijnpunt.toevoegen',   'label', '+ pijnpunt-knop', '+ Pijnpunt', false),
  ('label.processen.knop.intent.toevoegen',     'label', '+ verbeteractie-knop', '+ Verbeteractie', false),
  ('label.processen.knop.maak_definitief',      'label', 'Maak-definitief-knop', 'Maak definitief', false),
  ('label.processen.knop.terug_naar_concept',   'label', 'Terug-naar-concept-knop', 'Terug naar concept', false),
  ('label.processen.knop.wuif_weg',             'label', 'Wuif-weg-knop', 'Wuif weg', false),
  ('label.processen.knop.bewust_niet',          'label', 'Bewust-niet-adresseren-knop', 'Bewust niet adresseren', false),

  -- Tips-modal per sub-tab (placeholders, Kees tuned via Admin-UI)
  ('label.tips.processen.bedrijfsprocessen.titel', 'label', 'Tips bedrijfsprocessen titel', 'Tips bij Bedrijfsprocessen', false),
  ('label.tips.processen.bedrijfsprocessen.body',  'label', 'Tips bedrijfsprocessen body (markdown)',
   '- Modelleer van klant tot klant
- Iedere stap heeft een betekenisvol resultaat
- Maximaal 7 processtappen per schema
- Stappen van dezelfde orde (geen sub-stappen mengen)
- Onderscheid besturend / primair / ondersteunend', false),
  ('label.tips.processen.lijnorganisatie.titel', 'label', 'Tips lijnorganisatie titel', 'Tips bij Lijnorganisatie', false),
  ('label.tips.processen.lijnorganisatie.body',  'label', 'Tips lijnorganisatie body',
   '- Kies één primaire doorsnede (functioneel / productgericht / geografisch / marktgericht)
- Markeer cross-functional-processen bij ≥3 betrokken afdelingen
- Proceseigenaar als rol, niet per se aan afdeling gekoppeld', false),
  ('label.tips.processen.veranderorganisatie.titel', 'label', 'Tips veranderorganisatie titel', 'Tips bij Veranderorganisatie', false),
  ('label.tips.processen.veranderorganisatie.body',  'label', 'Tips veranderorganisatie body',
   '- Veranderaanpak in korte rich-text (~400 tekens)
- Business units = formele structuur; Value teams = mensen die samen waarde leveren
- Relatie-tags als vrije tekst om koppelingen aan Shared Services / regie te markeren
- Schets-upload PNG/JPG voor handgetekende organisatiediagrammen', false),
  ('label.tips.processen.besturing.titel', 'label', 'Tips besturing titel', 'Tips bij Besturing', false),
  ('label.tips.processen.besturing.body',  'label', 'Tips besturing body',
   '- Kies één primair sturingsmodel
- Coördinatie-aspecten: input/output/werkwijzen/kennis/vaardigheden/technieken
- Control-processen kleurcode: jaarplan (amber) / MIS-rapportage (blauw) / bijsturing (rood)', false),

  -- Empty-states + info
  ('label.processen.empty.geen_processen', 'label', 'Empty-state geen bedrijfsprocessen', 'Nog geen bedrijfsprocessen toegevoegd. Begin met een primair klant-tot-klant-proces.', false),
  ('label.processen.empty.geen_pijnpunten', 'label', 'Empty-state geen pijnpunten', 'Nog geen pijnpunten geïdentificeerd. Voeg ze handmatig toe of genereer ze vanuit het dossier.', false),
  ('label.processen.empty.geen_intents', 'label', 'Empty-state geen verbeteracties', 'Nog geen verbeteracties geformuleerd. Voeg handmatig toe of genereer via AI.', false),
  ('label.processen.info.pull_model', 'label', 'Pull-model-info onderaan definitief-kaart', 'Roadmap-werkblad haalt definitieve acties op uit alle werkbladen', false)

ON CONFLICT (tenant_id, key) DO UPDATE SET value = EXCLUDED.value, description = EXCLUDED.description, tenant_overridable = EXCLUDED.tenant_overridable;
