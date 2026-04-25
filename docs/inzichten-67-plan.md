# Plan: Issue #67 — Inzichten data-model & prompt (Sprint A)

**Status:** ✅ DONE — Sprint A volledig afgerond 2026-04-25  
**Scope:** Data-model + prompt aanpassen. Geen UI (sprint B). Geen andere werkbladen (sprint C).

---

## Sprint A — Afgerond 2026-04-25

Analyse werkt, 5 insights gegenereerd, persistent na refresh. Alle "klaar"-criteria uit sectie C zijn gehaald.

### Afwijkingen van het plan

| # | Planitem | Werkelijkheid |
|---|---|---|
| A1 | `max_tokens: 1000` (impliciet in originele code) | Verhoogd naar **6000** — JSON werd afgekapt bij rijke canvas (5 thema's + 14 SWOT-items ≈ 3300+ tekens output). Bevestigd via Vercel logs. |
| A2 | Prompt-instructies niet gespecificeerd in plan | **Beknoptheids-instructies toegevoegd**: observation ≤80 woorden, recommendation ≤60 woorden. Zowel bovenin prompt (BEKNOPTHEID-sectie) als in OUTPUT FORMAT herhaald. |
| A3 | Code fence handling niet voorzien | **`_tryParseInsights` uitgebreid** met start/end code-fence stripping — AI omhulde JSON soms in ` ```json ``` `. |
| A4 | D.4 — `UPDATE strategy_core SET analysis = NULL` | `analysis`-kolom bleek nooit te bestaan in productie (migratie `20260421030000` nooit uitgevoerd). Vervangen door `ADD COLUMN IF NOT EXISTS insights JSONB`. |
| A5 | Debug-logs tijdelijk | `[strategy-raw]`, `[strategy-a1]`, `[strategy-a2]` blijven in productie **tot sprint B start** — nodig voor diagnose gedurende sprint A. Worden verwijderd in sprint B (#68). |

---

---

## Besluiten D.1–D.6 (2026-04-25)

| # | Vraag | Besluit |
|---|---|---|
| D.1 | INZICHTEN_DESIGN.md | Aangeleverd. Gelezen. Schema is definitief. |
| D.2 | Response-wrapper | `{ "insights": [...] }` — named key |
| D.3 | `cross_worksheet` sprint A | Altijd `false`. Prompt instrueert AI binnen Strategie-scope te blijven. |
| D.4 | Bestaande analysis-data | `UPDATE strategy_core SET analysis = NULL WHERE analysis IS NOT NULL` in migratie. Is testdata, geen productiedata. |
| D.5 | Retry bij schema-mismatch | Ja, één retry. Eerste mismatch → fout-context mee. Tweede mismatch → error naar UI. Max ~20 regels. |
| D.6 | Aantal bevindingen | Min 3, max 8. Verdeling onderdelen/dwarsverbanden door AI. |

**Aanvullende besluiten:**
- 4.2-compliance bug (`upsertStrategyCore` zonder error-check) meenemen in deze sprint
- Tijdelijk `console.log` voor debug-validatie, gemarkeerd `// TODO: remove in sprint B (#68)`

---

## A. Huidige situatie

### A.1 Prompt — `prompt.strategy.analysis` in app_config

Opgeslagen in `app_config` (key: `prompt.strategy.analysis`, category: `prompt`).
Migratie: `20260420190000_seed_strategy_analysis_prompt.sql`.

**Volledige huidige system-prompt:**

```
Je bent een kritische Senior Strategie Consultant. Je analyseert de samenhang en
kwaliteit van een strategische kaart en geeft 4 tot 6 concrete, prioritaire
aanbevelingen.

FOCUS:
- Coherentie: sluiten thema's aan bij missie/visie/ambitie?
- Volledigheid: zijn alle Balanced Scorecard-perspectieven gedekt?
- Kwaliteit: zijn missie/visie/ambitie scherp geformuleerd of te vaag?
- Risico's: ontbreken er kritische thema's of KPI's?
- Overlap of tegenstrijdigheden tussen thema's?

OUTPUT FORMAT — antwoord EXACT in dit JSON-formaat, geen uitleg erbuiten:
{
  "recommendations": [
    { "type": "warning", "title": "Korte titel (max 6 woorden)", "text": "Concrete aanbeveling in 1-2 zinnen." },
    { "type": "info",    "title": "...", "text": "..." },
    { "type": "success", "title": "...", "text": "..." }
  ]
}

TYPE WAARDEN:
- "warning" = urgent verbeterpunt
- "info"    = kans of aandachtspunt
- "success" = sterkte die benut kan worden

{taal_instructie}
```

De prompt wordt ook hardcoded als fallback in `api/strategy.js` (regel 164–187),
identiek aan de database-versie. Als `systemPromptAnalysis` via de request body
meekomt, gebruikt de API dat; anders de hardcoded versie.

### A.2 Huidige data-structuur in `strategy_core.analysis`

Kolom toegevoegd via `20260421030000_add_analysis_to_strategy_core.sql`:

```sql
ALTER TABLE strategy_core ADD COLUMN IF NOT EXISTS analysis JSONB;
```

Geen schema-constraint — vrij JSONB. Opgeslagen als een **array van recommendation-objecten**:

```json
[
  { "type": "warning", "title": "Missie te vaag", "text": "De missie ontbeert..." },
  { "type": "info",    "title": "BSC-gap zichtbaar", "text": "Financieel perspectief..." },
  { "type": "success", "title": "Sterke SWOT-koppeling", "text": "Thema's sluiten goed..." }
]
```

Let op: de API retourneert `{ recommendations: [...] }` maar de front-end slaat
alleen de array op (`data.recommendations || []`). De omhullende wrapper wordt
niet bewaard.

### A.3 Code-flow: trigger → AI → opslag → UI

```
Gebruiker klikt "Analyseer strategie"
  └─ StrategieWerkblad.jsx: handleAnalyze() [regel 727]
       ├─ POST /api/strategy { mode: "analysis", core, items, themas, systemPromptAnalysis }
       │    └─ api/strategy.js: generateAnalysis()
       │         ├─ Bouwt SWOT-context + thema-overzicht als string
       │         ├─ Stuurt naar Anthropic API (claude-sonnet-4-5, max_tokens: 1000)
       │         ├─ Extraheert JSON via regex: /\{[\s\S]*\}/
       │         └─ Retourneert { recommendations: [...] }
       ├─ recs = data.recommendations || []
       ├─ setAnalysis(recs)                            ← React state
       └─ upsertStrategyCore(canvasId, { analysis: recs })  ← DB opslag (fire-and-forget*)
```

*) `await` staat er wel, maar er is geen error-check — CLAUDE.md 4.2 non-compliant.

**UI-rendering** (StrategieWerkblad.jsx regel 1439–1455):
- `analysis.map((rec, i) => ...)` — itereren over de array
- Kleurmap: `warning` → oranje, `info` → blauw, `success` → groen
- Toont: `rec.title` (vetgedrukt, klein uppercase) + `rec.text` (leesbare zin)
- Geen `rec.observation` / `rec.recommendation` splitsing — één `rec.text`
- Geen source-referenties
- Geen categorie-indeling (onderdeel vs. dwarsverband)

**Laden bij werkblad-open** (StrategieWerkblad.jsx regel 561):
```js
setAnalysis(coreData.analysis || null);
```

---

## B. Gewenste situatie (Issue #67 + TECH_DEBT.md P4)

### B.1 Nieuwe data-structuur

Op basis van Issue #67 body. Ik leid af dat elk bevinding-object de volgende
velden moet hebben:

```json
[
  {
    "category": "onderdeel",
    "type": "zwak",
    "observation": "De missie beschrijft activiteiten, niet richting of doel.",
    "recommendation": "Herformuleer de missie als een normatieve uitspraak over waarom de organisatie bestaat.",
    "source_refs": [
      { "kind": "core_field", "id": "missie", "label": "Missie", "exists": true }
    ],
    "cross_worksheet": false
  },
  {
    "category": "dwarsverband",
    "type": "kans",
    "observation": "Thema 'Digitale transformatie' heeft geen KPI voor klanttevredenheid terwijl de visie expliciet klantgerichtheid noemt.",
    "recommendation": "Voeg een NPS of klanttevredenheids-KPI toe aan dit thema.",
    "source_refs": [
      { "kind": "strategic_theme", "id": "uuid-thema-1", "label": "Digitale transformatie", "exists": true },
      { "kind": "core_field",      "id": "visie",         "label": "Visie",                  "exists": true }
    ],
    "cross_worksheet": false
  }
]
```

**Onzekerheden in dit schema** — zie Open Vragen.

### B.2 Gewenste type-waarden

Issue #67 specificeert:
- `type`: `"ontbreekt"` | `"zwak"` | `"kans"` | `"sterk"`
- `category`: `"onderdeel"` | `"dwarsverband"`

Dit vervangt de huidige `"warning"` / `"info"` / `"success"` uit de kleurmap.

### B.3 Nieuwe prompt-instructies

De prompt moet de LLM instrueren om het nieuwe schema strikt te volgen. Schets
(definitieve versie pas na INZICHTEN_DESIGN.md):

```
OUTPUT FORMAT — antwoord EXACT in dit JSON-formaat, geen tekst erbuiten:
{
  "insights": [
    {
      "category": "onderdeel" | "dwarsverband",
      "type": "ontbreekt" | "zwak" | "kans" | "sterk",
      "observation": "Feitelijke waarneming in 1-2 zinnen.",
      "recommendation": "Concrete actie in 1-2 zinnen.",
      "source_refs": [
        { "kind": "core_field" | "analysis_item" | "strategic_theme", "id": "...", "label": "...", "exists": true | false }
      ],
      "cross_worksheet": false
    }
  ]
}

CATEGORIEËN:
- "onderdeel": bevinding over één specifiek element (missie, één thema, één KPI)
- "dwarsverband": bevinding over de relatie of spanning TUSSEN meerdere elementen

TYPE WAARDEN:
- "ontbreekt": een verwacht element is helemaal afwezig
- "zwak": een element is aanwezig maar onvoldoende scherp of concreet
- "kans": een positieve samenhang of onbenutte mogelijkheid
- "sterk": een element dat uitzonderlijk goed is of als voorbeeld dient

AANTALLEN:
- Minimaal 4, maximaal 8 bevindingen totaal
- Minimaal 1 "dwarsverband" bevinding
- Maximaal 2 "sterk" bevindingen (kwaliteit boven complimenteren)

SOURCE_REFS:
- Verwijs naar de exacte elementen waarop de bevinding betrekking heeft
- kind = "core_field": id is de veldnaam (missie, visie, ambitie, kernwaarden, extern, intern)
- kind = "strategic_theme": id is de UUID van het thema
- kind = "analysis_item": id is de UUID van het analyse-item
- exists = false als je verwijst naar iets wat ONTBREEKT maar zou moeten bestaan
```

### B.4 Validatie van AI-output

Drie lagen:

1. **JSON-parse validatie** (al aanwezig): `raw.match(/\{[\s\S]*\}/)` + `JSON.parse()`
2. **Schema-validatie** (nieuw in API): na parse, valideer per item:
   - Vereiste velden aanwezig? (`category`, `type`, `observation`, `recommendation`, `source_refs`, `cross_worksheet`)
   - `category` ∈ `["onderdeel", "dwarsverband"]`
   - `type` ∈ `["ontbreekt", "zwak", "kans", "sterk"]`
   - `source_refs` is array, elk element heeft `kind`, `id`, `label`, `exists`
3. **Retry bij mismatch** (nieuw, optioneel): als validatie faalt, één retry met
   aanvullende instructie `"Vorig antwoord klopte niet. Herhaal met EXACT het gevraagde JSON-schema."`

**Vraag aan jou**: wel of geen retry? Adds complexity, but 1500ms extra latency
bij mismatch vs. een cryptische foutmelding voor de gebruiker.

---

## C. Concreet plan

### Bestanden

| Bestand | Wijziging |
|---|---|
| `api/strategy.js` | `generateAnalysis()` herschrijven: nieuwe prompt, nieuwe key `insights` (was `recommendations`), schema-validatie toevoegen |
| `supabase/migrations/YYYYMMDD_update_analysis_prompt.sql` | `prompt.strategy.analysis` bijwerken in `app_config` (idempotent UPDATE) |
| `src/features/strategie/StrategieWerkblad.jsx` | Minimale aanpassing: `data.insights || []` i.p.v. `data.recommendations || []`; bewaar `error`-check bij upsertStrategyCore (CLAUDE.md 4.2) |

### Volgorde

1. **API-aanpassing** (`api/strategy.js`) — geen DB-dependency, direct testbaar
2. **Migratie** — prompt bijwerken in database
3. **Front-end aanpassing** — minimale keyname-fix zodat data geladen blijft
4. **(optioneel) Handmatige validatietest** — 6 bevindingen genereren, schema controleren

### Testen zonder sprint B (geen UI-rebuild)

Sprint A eindigt met een werkende maar nog onveranderde UI. De huidige kaartjes-
rendering crasht niet (bevindingen zijn een array), maar toont gedeeltelijk
verkeerde data (`rec.title` bestaat niet meer — wordt `undefined`).

**Twee opties:**

- **Optie A — Tijdelijke console.log**: `handleAnalyze` logt `JSON.stringify(recs, null, 2)` 
  naar de console. Je kunt handmatig valideren of schema klopt. UI ziet er raar uit
  maar crasht niet. Geen extra code.

- **Optie B — Minimale debug-view**: in de overlay, als `analysis.length > 0` en
  `analysis[0].observation`, toon een simpele `<pre>` met de JSON. Lelijk maar
  leesbaar. Verwijder in sprint B.

Aanbeveling: **Optie A**. Minder code, sprint B vervangt de rendering toch volledig.
Je test via de browser DevTools console.

### "Klaar"-criterium voor sprint A

- [ ] `POST /api/strategy { mode: "analysis" }` retourneert `{ insights: [...] }` conform schema
- [ ] Elk bevinding-object heeft: `category`, `type`, `observation`, `recommendation`, `source_refs[]`, `cross_worksheet`
- [ ] Minimaal 6 bevindingen handmatig gegenereerd en schema-conform bevonden (console.log)
- [ ] `strategy_core.analysis` bevat de nieuwe structuur na één run (controleer via Supabase Dashboard)
- [ ] Migratie idempotent uitgevoerd (conform CLAUDE.md sectie 6)
- [ ] `upsertStrategyCore` na analyse checkt `error` (4.2 compliance fix)
- [ ] Bestaande analysis-data van vóór deze sprint: geen crash, maar stale (acceptable — sprint B reset)

---

## D. Open vragen — beantwoord 2026-04-25

Alle vragen beantwoord. Zie besluitentabel bovenaan dit document.
