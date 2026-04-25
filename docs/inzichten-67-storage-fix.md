# Inzichten #67 — Storage onderzoek

**Datum:** 2026-04-25  
**Aanleiding:** Migratie `20260425000000_inzichten_sprint_a.sql` faalde omdat `strategy_core.analysis` niet bestaat.

---

## 1. Werkelijke database-schema's

### `strategy_core` (productie — gemeten via Supabase)

| Kolom | Type | Nullable |
|---|---|---|
| id | uuid | NOT NULL |
| canvas_id | uuid | NOT NULL |
| missie | text | YES |
| visie | text | YES |
| ambitie | text | YES |
| kernwaarden | jsonb | YES |
| samenvatting | text | YES |
| updated_at | timestamptz | YES |

**`analysis` kolom bestaat niet.** De migratie `20260421030000_add_analysis_to_strategy_core.sql` staat wel in de repo maar is nooit uitgevoerd in productie.

### `analysis_items` (productie)

| Kolom | Type |
|---|---|
| id | uuid |
| canvas_id | uuid |
| type | text — "extern" \| "intern" |
| content | text |
| tag | text — "kans" \| "bedreiging" \| "sterkte" \| "zwakte" \| "niet_relevant" |
| sort_order | integer |
| created_at | timestamptz |

Dit is de SWOT-input tabel — gebruikersinvoer, geen AI-output.

### `guideline_analysis` (productie — bestaand patroon voor Richtlijnen)

| Kolom | Type |
|---|---|
| id | uuid |
| canvas_id | uuid |
| recommendations | jsonb |
| updated_at | timestamptz |

Dit is de zusterstructuur voor Richtlijnen-analyse. Aparte tabel, JSONB-kolom voor AI-output.

---

## 2. Huidige levenscyclus van de Strategie-analyse

### Bij analyse draaien (`handleAnalyze`)

```
POST /api/strategy { mode: "analysis" }
  → AI genereert insights[]
  → setAnalysis(insights)                          ← opgeslagen in React state ✅
  → upsertStrategyCore(canvasId, { analysis: insights })
       ↳ POST naar strategy_core met onbekend veld
       ↳ Supabase retourneert een error (kolom bestaat niet)
       ↳ Error was NIET gecheckt in oude code → stil gesmoord
       ↳ Nieuwe code checkt wél: saveError.message gelogd in console
       ↳ Maar: data bereikt de DB NOOIT
```

### Bij werkblad laden (page-refresh of canvas-wissel)

```
loadStrategyCore(canvasId)
  → { missie, visie, ambitie, kernwaarden, samenvatting }
  → setAnalysis(coreData.analysis || null)
       ↳ coreData.analysis = undefined (kolom bestaat niet)
       ↳ setAnalysis(null)
       ↳ Analyse is verdwenen
```

**Conclusie: de analyse is nooit persistent geweest.** Ze leefde uitsluitend in React state. Bij elke refresh, canvas-wissel of browsersluit gaat ze verloren. De gebruiker zag wel een ✓ op de knop zolang de sessie actief was.

---

## 3. Wat `upsertStrategyCore` precies doet

```js
await supabase
  .from("strategy_core")
  .upsert({ canvas_id: canvasId, ...fields, updated_at: new Date().toISOString() },
           { onConflict: "canvas_id" });
```

`fields` is vrij — de caller bepaalt welke kolommen. Bij `{ analysis: insights }` probeert de upsert een niet-bestaande kolom te schrijven. Supabase/PostgreSQL geeft een fout terug, maar die werd tot sprint A nooit gecheckt.

De debounced autosave (`core` object met missie/visie/ambitie/kernwaarden/samenvatting) werkt wél correct — die velden bestaan allemaal.

---

## 4. Opslagopties voor de nieuwe `insights[]`

### Optie A — Kolom toevoegen aan `strategy_core`

```sql
ALTER TABLE strategy_core
  ADD COLUMN IF NOT EXISTS insights JSONB;
```

**Voordelen:**
- Één migratie, direct klaar
- Consistent met hoe `samenvatting` er naast staat
- `upsertStrategyCore(canvasId, { insights: [...] })` werkt zonder code-aanpassing
- Laden via bestaande `loadStrategyCore` → `coreData.insights`

**Nadelen:**
- `strategy_core` mengt gebruikersinvoer (missie/visie/etc.) met AI-output (insights)
- Geen `created_at` of model-versie bijgehouden per analyse-run

**Past bij INZICHTEN_DESIGN.md:** de design-notitie zegt expliciet "Opslag voorlopig in bestaande jsonb-velden (`strategy_core.analysis`, ...)" — dit is de bedoelde aanpak voor nu.

---

### Optie B — Nieuwe tabel `strategy_insights`

```sql
CREATE TABLE strategy_insights (
  id         uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  canvas_id  uuid        NOT NULL REFERENCES canvases(id) ON DELETE CASCADE,
  insights   jsonb,
  updated_at timestamptz DEFAULT now()
);
```

**Voordelen:**
- Exact parallel aan `guideline_analysis` — consistent patroon
- Scheiding van gebruikersinvoer en AI-output
- Ruimte voor toekomstige velden (model_version, token_count, etc.)

**Nadelen:**
- Nieuwe service-functie nodig (`loadStrategyInsights`, `upsertStrategyInsights`)
- Laad-effect in StrategieWerkblad moet worden uitgebreid met extra fetch
- Meer werk in sprint A dan nodig

**Past bij INZICHTEN_DESIGN.md:** notitie noemt `guideline_analysis.recommendations` als referentie, maar zegt ook "migratie naar aparte tabel pas wanneer we status-per-item willen" — dus dit is voor later.

---

### Optie C — `analysis_items` uitbreiden

Niet geschikt. `analysis_items` bevat SWOT-invoer van de gebruiker, niet AI-gegenereerde bevindingen. Semantisch compleet anders.

---

## 5. Aanbeveling

**Optie A** — kolom `insights JSONB` toevoegen aan `strategy_core`.

Redenen:
1. **INZICHTEN_DESIGN.md benoemt dit expliciet** als de bedoelde opslagplek voor nu
2. **Minste code-wijzigingen** — bestaande service en laad-flow werken met één kleine aanpassing
3. **Snel** — sprint A kan vandaag nog compleet zijn
4. Optie B (aparte tabel) is de juiste architectuur voor later, wanneer we status-per-item of versioning willen. Refactoren dan is triviaal: data verplaatsen + service splitsen.

**Enige risico van A:** kolom heet nu `insights` (nieuw schema) terwijl de originele gefaalde migratie `analysis` heette. Dat maakt die oude migratie overbodig — die kan gearchiveerd of verwijderd worden.

---

## 6. Benodigde wijzigingen bij keuze Optie A

| # | Wat | Bestand |
|---|---|---|
| 1 | Nieuwe migratie: `ALTER TABLE strategy_core ADD COLUMN IF NOT EXISTS insights JSONB` | `supabase/migrations/20260425010000_add_insights_to_strategy_core.sql` |
| 2 | Huidige sprint-A migratie: `UPDATE strategy_core SET analysis = NULL` verwijderen (kolom bestaat toch niet) | `20260425000000_inzichten_sprint_a.sql` |
| 3 | `handleAnalyze`: `{ analysis: insights }` → `{ insights: insights }` | `StrategieWerkblad.jsx` |
| 4 | Laden: `coreData.analysis` → `coreData.insights` | `StrategieWerkblad.jsx` |
| 5 | Veld toevoegen aan `setCore`-destructuring | `StrategieWerkblad.jsx` |
| 6 | Oude migratie markeren als niet-uitvoeren | `20260421030000_add_analysis_to_strategy_core.sql` |

**Totaal: 1 nieuwe migratie + 3 regels gewijzigd in StrategieWerkblad.**
