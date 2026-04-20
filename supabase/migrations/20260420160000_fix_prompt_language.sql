-- ============================================================
-- Fix: taal-instructie dynamisch maken in AI-prompts
-- Vervangt "Schrijf ALTIJD in het Nederlands" door
-- het {taal_instructie} placeholder.
-- Wordt client-side vervangen via i18n "ai.language" key.
-- ============================================================

UPDATE app_config
SET value = replace(value, 'Schrijf ALTIJD in het Nederlands', '{taal_instructie}'),
    updated_at = now()
WHERE key IN ('prompt.strategy.themes', 'prompt.strategy.ksf_kpi')
  AND value LIKE '%Schrijf ALTIJD in het Nederlands%';
