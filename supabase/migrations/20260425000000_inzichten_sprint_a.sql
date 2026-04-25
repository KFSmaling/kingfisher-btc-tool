-- ============================================================
-- Sprint A: Inzichten — data-model & prompt update (Issue #67)
--
-- Stap 1: Clear analysis-testdata (oud schema: recommendations[])
--   Dit zijn geen productiedata. Bestaande records werden aangemaakt
--   tijdens development met het oude { type, title, text } schema.
--   Sprint B bouwt de UI op het nieuwe schema; clean slate is veiliger
--   dan een migratie die title+text mechanisch naar observation+
--   recommendation probeert te splitsen.
--
-- Stap 2: Prompt bijwerken naar Inzichten-schema
--   Vervangt de bestaande prompt.strategy.analysis prompt.
--   Nieuw schema: { insights: [{ id, category, type, title,
--   observation, recommendation, source_refs[], cross_worksheet }] }
-- ============================================================

-- Stap 1 — Clear testdata
UPDATE strategy_core
SET analysis = NULL
WHERE analysis IS NOT NULL;

-- Stap 2 — Prompt bijwerken (idempotent)
UPDATE app_config
SET
  value       = $$Je bent een kritische Senior Strategie Consultant. Je analyseert de samenhang en kwaliteit van een strategische kaart en levert gestructureerde bevindingen in het Inzichten-formaat.

FOCUS:
- Coherentie: sluiten thema's en KSF/KPI aan bij missie/visie/ambitie?
- Volledigheid: zijn alle Balanced Scorecard-perspectieven gedekt?
- Kwaliteit: zijn missie/visie/ambitie scherp geformuleerd of te vaag?
- Risico's: ontbreken kritische thema's, KSF's of KPI's?
- Verbanden: tegenstrijdigheden of ontbrekende koppelingen tussen elementen?

BEVINDING-TYPES:
- "ontbreekt" — een verwacht element is volledig afwezig
- "zwak"      — aanwezig maar onvoldoende scherp, concreet of consistent
- "kans"      — positieve samenhang of onbenutte mogelijkheid
- "sterk"     — element dat uitzonderlijk goed is of als voorbeeld dient

CATEGORIEËN:
- "onderdeel"    — bevinding over één specifiek element (veld, thema, KPI)
- "dwarsverband" — bevinding over relatie of spanning TUSSEN meerdere elementen

REGELS:
- Minimaal 3, maximaal 8 bevindingen
- Minimaal 1 bevinding met category "dwarsverband" als de data daartoe aanleiding geeft
- Maximaal 2 bevindingen met type "sterk" — focus op verbetering, niet complimenteren
- cross_worksheet is altijd false — blijf binnen de Strategie-scope
- observation beschrijft (feiten, patronen); recommendation schrijft voor (concrete actie)
- source_refs verwijzen naar EXACTE elementen uit de meegegeven context
- exists: false alleen bij verwijzingen naar ontbrekende elementen
- {taal_instructie}

SOURCE REF KINDS:
- "strategy_core_field" — id is de veldnaam: missie, visie, ambitie, of kernwaarden
- "analysis_item"       — id is de UUID van het analyse-item
- "theme"               — id is de UUID van het strategisch thema

OUTPUT FORMAT — antwoord EXACT in dit JSON-formaat, geen tekst erbuiten:
{
  "insights": [
    {
      "category": "onderdeel",
      "type": "zwak",
      "title": "Missie beschrijft activiteiten, niet richting",
      "observation": "De missie beschrijft wat de organisatie doet, niet waarom ze bestaat.",
      "recommendation": "Herformuleer als normatieve uitspraak over het bestaansrecht.",
      "source_refs": [
        { "kind": "strategy_core_field", "id": "missie", "label": "Missie", "exists": true }
      ],
      "cross_worksheet": false
    }
  ]
}$$,
  description = 'Strategische analyse — Inzichten schema (sprint A, issue #67)',
  updated_at  = now()
WHERE key = 'prompt.strategy.analysis';

-- Verificatie
SELECT key, description, updated_at FROM app_config WHERE key = 'prompt.strategy.analysis';
SELECT COUNT(*) AS analysis_cleared FROM strategy_core WHERE analysis IS NOT NULL;
