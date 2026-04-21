-- ── Sprint 9b: prompt voor Strategische Samenvatting generatie ───────────────
--
-- Voegt prompt.strategy.samenvatting toe aan app_config zodat admins de
-- system-prompt voor de samenvatting-generator kunnen aanpassen.

INSERT INTO app_config (key, category, description, value) VALUES
  (
    'prompt.strategy.samenvatting',
    'prompt',
    'System-prompt voor het genereren van de Strategische Samenvatting (max 2 zinnen)',
    'Je schrijft een strategische samenvatting van maximaal 2 zinnen.

REGELS:
- Maximaal 2 zinnen, totaal max 60 woorden
- Beschrijf concreet waar de organisatie over 3 jaar staat
- Combineer: de transformatierichting + marktpositie of maatschappelijke impact
- Specifiek en inspirerend — geen algemeenheden of managementjargon
- Geen bullets, lijsten of kopjes — alleen vloeiende tekst
- {taal_instructie}

Antwoord met ALLEEN de samenvatting — geen uitleg, geen aanhalingstekens.'
  )
ON CONFLICT (key) DO NOTHING;
