# BTC Tool — Architectuur & Werkwijze voor Claude

> Dit document wordt automatisch gelezen aan het begin van elke sessie.  
> Alle regels hier zijn **verplicht** — geen uitzonderingen.

---

## 1. DEPLOY — Altijd via het script

**Nooit** `vercel --prod` direct uitvoeren. Altijd:

```bash
./deploy-prod.sh "feat: beschrijving van wijziging"
```

Het script doet automatisch: git commit + push → vercel --prod → alias bijwerken naar `kingfisher-btcprod.vercel.app`.

**Waarom**: `vercel --prod` zet de `kingfisher-btcprod.vercel.app` alias NIET automatisch. Zonder het script ziet de gebruiker niets in productie.

---

## 2. LABELS — Alle UI-tekst is dynamisch

**Elke** gebruikersgerichte string (titels, knoppen, veldnamen, secties) moet via `appLabel()`:

```jsx
// ✅ Correct
const { label: appLabel } = useAppConfig();
<h3>{appLabel("strat.section.identiteit", "Identiteit")}</h3>

// ❌ Fout — nooit hardcoded strings in JSX voor UI-tekst
<h3>Identiteit</h3>
```

### Bij elk nieuw label:
1. Gebruik in component: `appLabel("mijn.label.key", "Fallback tekst")`
2. Voeg toe aan `LABEL_FALLBACKS` in `src/shared/context/AppConfigContext.jsx`
3. Voeg toe aan DB via migratie: `INSERT INTO app_config (key, category, description, value)`

### Label-naamgeving conventie:
- `label.app.*` — applicatie-brede labels (titel, subtitel)
- `label.strat.*` — Strategie Werkblad
- `label.richtl.*` — Richtlijnen Werkblad
- `label.werkblad.*` — werkbladnamen in headers
- `label.canvas.*` — Canvas dashboard labels

---

## 3. DATABASE — Nooit data in de code

Alles wat per klant anders kan: **in de database**, niet hardcoded in React-componenten.

- Segmentnamen, kleuren, volgorde → `app_config` tabel via `appLabel()`
- Gebruikersdata (guidelines, strategie, thema's) → eigen tabellen via services
- Prompts → `app_config` tabel via `appPrompt()`

**Services pattern**: alle Supabase-aanroepen gaan via `src/features/[feature]/services/[feature].service.js`. Nooit direct Supabase aanroepen in een component.

---

## 4. COMPONENTEN — Loosely coupled, één verantwoordelijkheid

- Elk werkblad = eigen directory: `src/features/[naam]/`
- Elk groot component = eigen bestand
- Geen mega-componenten (>300 regels is een signaal om te splitsen)
- Canvas-blokken die een werkblad representeren: `src/features/canvas/components/[Naam]StatusBlock.jsx`

**Patroon voor statusblokken op canvas** (zie `StrategyStatusBlock.jsx` en `PrinciplesStatusBlock.jsx`):
- `col-span-12`, `STATUS_COLORS[status]`, `STATUS_BADGE_KEYS`
- Statusvelden met `CheckCircle2` (groen vinkje) of grijs bolletje
- Data komt uit DB, geladen in `useCanvasState.js`

---

## 5. MIGRATIES — Veiligheidsregels

**Altijd** bij `app_config` INSERTs de `category` kolom meegeven (NOT NULL!):

```sql
-- ✅ Correct
INSERT INTO app_config (key, category, description, value) VALUES (...)

-- ❌ Fout — mist category → hele migratie rolt terug
INSERT INTO app_config (key, value) VALUES (...)
```

Gebruik altijd `IF NOT EXISTS` en `DROP POLICY IF EXISTS` voor idempotente migraties.

Controleer altijd voor commit: zijn alle NOT NULL kolommen aanwezig in elke INSERT?

---

## 6. CHECKLIST — Bij elke nieuwe feature

Doorloop dit vóór je code schrijft:

- [ ] Welke labels gebruik ik? → `appLabel()` + `LABEL_FALLBACKS` + migratie
- [ ] Welke data laad ik? → service aanmaken of uitbreiden, nooit direct in component
- [ ] Past dit in een bestaand component of maak ik een nieuw bestand?
- [ ] Als ik data toevoeg aan `useCanvasState`: ook toevoegen aan de public API return
- [ ] Kan ik deployen via `./deploy-prod.sh`?

---

## 7. TECHNISCHE STACK (referentie)

- **Frontend**: React CRA + Tailwind CSS
- **Backend**: Supabase (PostgreSQL + RLS + Auth)
- **Deploy**: Vercel — prod via `./deploy-prod.sh`
- **Prod URL**: https://kingfisher-btcprod.vercel.app
- **DB tabellen (kern)**: `canvases`, `strategy_core`, `strategic_themes`, `guidelines`, `guideline_analysis`, `app_config`
- **AppConfig**: `label.*` → UI-labels, `prompt.*` → AI-prompts, `setting.*` → configuratie
- **Auth**: Supabase Auth, RLS op alle tabellen

---

## 8. WAT NOG MOET (bekende technische schuld)

- `strategyManual` wordt geladen uit `full.data?.strategy?.details?.manual` (oud JSONB-systeem) — nog niet gemigreerd naar `strategy_core` tabel. Dit verklaart waarom canvas strategy preview soms leeg is bij herstart.
- AI-gegenereerde samenvatting ("Stip op de Horizon") is nog toekomstig werk — nu wordt `ambitie` getoond.
