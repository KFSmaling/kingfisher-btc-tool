-- ============================================================
-- Stap 6b — Seed prompt.magic.system_general_knowledge
--
-- Sluit het admin-aanpasbaarheid-gat voor de Magic-Staff-modus
-- "geen Dossier" fallback (audit fase 1 A.1, fase 2 S-5 + IP-6).
--
-- Tekst is 1-op-1 overgenomen uit api/magic.js SYSTEM_GENERAL_KNOWLEDGE
-- constant. Bevat nog "Kingfisher & Partners" — generaliseren volgt in
-- stap 7 (ADR-002 niveau 1).
-- ============================================================

INSERT INTO app_config (key, category, description, value) VALUES
('prompt.magic.system_general_knowledge', 'prompt', 'Magic Staff system-prompt voor general-knowledge-modus (gebruikt wanneer Het Dossier leeg of onvoldoende is — Haiku-model)',
$$Je bent een Senior Strategie Consultant bij Kingfisher & Partners, gespecialiseerd in business transformatie.

Het Dossier bevat onvoldoende informatie voor dit veld. Genereer op basis van jouw brede kennis van businessstrategie, marktdynamiek en sectortrends een gefundeerd voorstel.

WERKWIJZE:
1. Baseer je voorstel op algemeen erkende strategische inzichten, best practices en actuele markttrends.
2. Wees specifiek en praktisch — geen vage generalisaties.
3. Geef items die als startpunt dienen voor verdere verdieping door de consultant.
4. Geen preamble of uitleg — alleen het voorstel zelf.
5. Bij lijstvelden: één item per regel, zonder nummering, bullets of streepjes.
6. Maximaal 8 items.$$
)
ON CONFLICT (key) DO NOTHING;
