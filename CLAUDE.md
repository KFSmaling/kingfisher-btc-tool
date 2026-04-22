# BTC Tool — Architectuur & Werkwijze voor Claude

> Dit document wordt automatisch gelezen aan het begin van elke sessie.  
> Alle regels hier zijn **verplicht** — geen uitzonderingen.

---

## 1. DEPLOY — via het script, en verificatie

./deploy-prod.sh "feat: beschrijving van wijziging"

Dit script doet: git commit + push → vercel --prod → alias opnieuw pinnen 
naar `kingfisher-btcprod.vercel.app`.

**Naast het script** deploy Vercel ook automatisch bij elke push naar master 
(GitHub-integratie). Dit betekent dat docs-commits en triviale pushes óók 
een productie-deployment opleveren. Geen probleem, wel iets om te weten.

**Verificatie na elke belangrijke deploy:**
Check in Vercel Dashboard dat `kingfisher-btcprod.vercel.app` onder "Assigned 
Domains" staat van de nieuwste deployment. Zo niet: het script heeft de 
alias-her-assignment gemist, handmatig:

vercel alias set <deployment-url> kingfisher-btcprod.vercel.app

**Prod URL (leidend):** https://kingfisher-btcprod.vercel.app
**Demo-omgeving:** op dit moment geen actieve demo. Nieuwe demo-setup gepland 
— zie TECH_DEBT.md P3.

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

### Service contract (actueel)

Services retourneren `{ data, error }` objecten — ze gooien niet. De UI-laag checkt `error` expliciet en handelt af volgens sectie 4.2.

```js
// ✅ Correct — huidig contract
export async function upsertGuideline(canvasId, data) {
  if (!canvasId) return { data: null, error: new Error("canvasId is required") };
  const { data: result, error } = await supabase
    .from("guidelines")
    .upsert({ canvas_id: canvasId, ...data })
    .select()
    .single();
  return { data: result, error };
}

// Call-site
const { data, error } = await guidelinesService.upsertGuideline(canvasId, payload);
if (error) { /* zie sectie 4.2 */ }
```

---

## 4. STATE MANAGEMENT & DATA INTEGRITEIT

State-problemen in deze app komen bijna altijd uit drie bronnen: ghost data bij canvas-wissel, silent save failures, en race conditions bij snel wisselen. Deze regels zijn **verplicht** — niet optioneel, niet "meestal".

### 4.1 Lifecycle — forceer remount bij canvas-wissel

Elk feature-component dat canvas-specifieke state bevat (strategy, guidelines, themes, canvas dashboard, overlays die op één canvas werken) krijgt `key={canvasId}` op de root van die feature. Dit dwingt React om de component-tree volledig te vernietigen en schoon op te bouwen — geen resten van het vorige canvas.

```jsx
// ✅ Correct — op feature-root / overlay-root
<StrategyWerkblad key={canvasId} canvasId={canvasId} />
<RichtlijnenWerkblad key={canvasId} canvasId={canvasId} />
<DeepDiveOverlay key={canvasId} canvasId={canvasId} />
<MasterImporterPanel key={canvasId} canvasId={canvasId} />

// ❌ Fout — op individuele input (breekt focus tijdens typen)
<input key={canvasId} value={value} />

// ❌ Fout — geen key (ghost data van vorig canvas blijft)
<StrategyWerkblad canvasId={canvasId} />
```

**Scope**: op feature-niveau of overlay-niveau, niet op pagina-niveau (te grof) en niet op input-niveau (te fijn).

### 4.2 Async integriteit — geen silent fails

Elke database-mutatie geeft een `Promise` terug met `{ data, error }`. De UI-laag gebruikt `await`, toont een loading state tot de server bevestigt, checkt `error` expliciet, en handelt elke error af met een duidelijke melding plus retry-optie.

```jsx
// ✅ Correct
const handleSave = async () => {
  setSaving(true);
  const { error } = await guidelinesService.upsert(canvasId, data);
  setSaving(false);
  if (error) {
    showError(
      appLabel("error.save.failed", "Opslaan mislukt"),
      { retry: handleSave }
    );
    return;
  }
};

// ❌ Fout — fire-and-forget, error gesmoord
upsertStrategyCore(canvasId, data).catch(() => {});

// ❌ Fout — await maar geen error-check, UI verwijdert item ook als DB-delete faalt
const removeItem = async (id) => {
  await deleteService(id);
  setItems(items.filter(i => i.id !== id));
};

// ❌ Fout — setTimeout om save "te verbergen", geen error-handling
setTimeout(() => upsertStrategicTheme(canvasId, theme), 0);

// ❌ Fout — optimistic update, UI wijzigt vóór server-bevestiging
setItems(newItems);
await saveItems(newItems); // als dit faalt: state en DB lopen uiteen
```

**Regels**:
- Loading/saving indicator verdwijnt pas na server-bevestiging.
- Elke error toont een duidelijke melding **mét** retry-optie.
- Nooit code schrijven die aanneemt dat een save "altijd wel lukt".
- Geen fire-and-forget. Geen ingeslikte catches. Geen `setTimeout` om saves te "verbergen".
- Geen optimistic updates. UI wacht op server-bevestiging voordat de nieuwe waarde zichtbaar wordt. De "saving..." indicator overbrugt de latency.

### 4.3 Data isolatie — reset en race-guards

Bij canvas-wissel: reset lokale state naar `null` of `initialState` **voordat** de nieuwe fetch begint, en bescherm tegen race conditions als de gebruiker snel wisselt.

```jsx
// ✅ Correct — canoniek patroon
useEffect(() => {
  const activeCanvasId = canvasId;
  let cancelled = false;
  setData(null); // reset eerst, voorkomt ghost data

  (async () => {
    const { data: result, error } = await service.load(activeCanvasId);
    if (cancelled) return;                       // race-guard 1: unmount / effect re-run
    if (activeCanvasId !== canvasId) return;     // race-guard 2: canvas veranderd tijdens fetch
    if (error) { setError(error); return; }
    setData(result);
  })();

  return () => { cancelled = true; };
}, [canvasId]);

// ❌ Fout — geen reset, geen guard, Promise.all().then() zonder bescherming
useEffect(() => {
  Promise.all([loadA(canvasId), loadB(canvasId)]).then(([a, b]) => {
    setA(a); setB(b); // kan verouderde data zijn als user inmiddels is gewisseld
  });
}, [canvasId]);
```

### 4.4 Stale closures in callbacks

Callbacks die async werk doen (save, delete, AI-generate, accept-draft) mogen niet leunen op een `canvasId` uit een oudere render. Gebruik een ref, of geef `canvasId` expliciet mee op het moment dat de callback wordt aangeroepen.

```jsx
// ✅ Correct — ref blijft actueel
const canvasIdRef = useRef(canvasId);
useEffect(() => { canvasIdRef.current = canvasId; }, [canvasId]);

const handleSave = async (data) => {
  const { error } = await service.upsert(canvasIdRef.current, data);
  if (error) { /* ... */ }
};

// ❌ Fout — stale closure, slaat op in vórig canvas als user snel wisselt
const handleSave = async (data) => {
  await service.upsert(canvasId, data); // canvasId uit render-moment, niet uit clickmoment
};
```

### 4.5 Checklist bij state-werk

- [ ] Heeft dit component canvas-specifieke state? → `key={canvasId}` op feature- of overlay-root
- [ ] Is er een save/update/delete? → `await`, `{ data, error }` check, loading state tot server bevestigt, retry bij error
- [ ] Is er een load bij `canvasId` change? → reset vooraf + captured `activeCanvasId` + `cancelled` flag + cleanup
- [ ] Gebruikt een callback `canvasId` asynchroon? → `canvasIdRef.current` of parameter, geen closure
- [ ] Retourneert de service `{ data, error }` en checkt de call-site `error`?

### 4.6 Compliance status (per 2026-04-22)

- **4.1** ✅ Compliant per 2026-04-22
- **4.2** ❌ Systematisch non-compliant; zie `TECH_DEBT.md`
- **4.3** ⚠️ Werkblad load-effects compliant per 2026-04-22; `useCanvasState.handleSelectCanvas` nog open (zie `TECH_DEBT.md`)
- **4.4** ❌ Geen enkele callback gebruikt `canvasIdRef`; zie `TECH_DEBT.md`
- **4.5** ✅ Contract is `{ data, error }` — zie sectie 3

Werk deze regel bij na elke compliance-verbetering.

---

## 5. COMPONENTEN — Loosely coupled, één verantwoordelijkheid

- Elk werkblad = eigen directory: `src/features/[naam]/`
- Elk groot component = eigen bestand
- Geen mega-componenten (>300 regels is een signaal om te splitsen)
- Canvas-blokken die een werkblad representeren: `src/features/canvas/components/[Naam]StatusBlock.jsx`

**Patroon voor statusblokken op canvas** (zie `StrategyStatusBlock.jsx` en `PrinciplesStatusBlock.jsx`):
- `col-span-12`, `STATUS_COLORS[status]`, `STATUS_BADGE_KEYS`
- Statusvelden met `CheckCircle2` (groen vinkje) of grijs bolletje
- Data komt uit DB, geladen in `useCanvasState.js`

---

## 6. MIGRATIES — Veiligheidsregels

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

## 7. CHECKLIST — Bij elke nieuwe feature

Doorloop dit vóór je code schrijft:

- [ ] Welke labels gebruik ik? → `appLabel()` + `LABEL_FALLBACKS` + migratie
- [ ] Welke data laad ik? → service aanmaken of uitbreiden, nooit direct in component
- [ ] Past dit in een bestaand component of maak ik een nieuw bestand?
- [ ] Als ik data toevoeg aan `useCanvasState`: ook toevoegen aan de public API return
- [ ] Staat de feature-root met `key={canvasId}`? Is async state-handling volgens sectie 4?
- [ ] Kan ik deployen via `./deploy-prod.sh`?
- [ ] Worden bestaande docs (`CLAUDE.md` compliance status, `TECH_DEBT.md`) geraakt door deze change? → in dezelfde commit meenemen
- [ ] Is dit een Issue, Jam-opname, of TECH_DEBT-item volgens `WORKFLOW.md`?

---

## 8. TECHNISCHE STACK (referentie)

- **Frontend**: React CRA + Tailwind CSS
- **Backend**: Supabase (PostgreSQL + RLS + Auth)
- **Deploy**: Vercel — prod via `./deploy-prod.sh`
- **Prod URL**: https://kingfisher-btcprod.vercel.app
- **DB tabellen (kern)**: `canvases`, `strategy_core`, `strategic_themes`, `guidelines`, `guideline_analysis`, `app_config`
- **AppConfig**: `label.*` → UI-labels, `prompt.*` → AI-prompts, `setting.*` → configuratie
- **Auth**: Supabase Auth, RLS op alle tabellen

---

## 9. DO-NOT-TOUCH zonder overleg

- Migraties die al gedeployed zijn (nooit editen, altijd nieuwe migratie)
- `deploy-prod.sh` zelf
- RLS policies op bestaande tabellen (breekt productie-data)
- Bestaande labels in `LABEL_FALLBACKS` verwijderen (alleen toevoegen)
- Het service-contract (`{ data, error }`) in één keer omgooien — incrementeel, bij features die je toch aanraakt

---

## 10. OPEN PUNTEN / TECHNISCHE SCHULD

Gedetailleerde lijst staat in `TECH_DEBT.md`. Korte versie:

- `strategyManual` wordt geladen uit `full.data?.strategy?.details?.manual` (oud JSONB-systeem) — nog niet gemigreerd naar `strategy_core` tabel. Verklaart waarom canvas strategy preview soms leeg is bij herstart. Bij migratie: ook sectie 4 toepassen (race-guards + reset).
- AI-gegenereerde samenvatting ("Stip op de Horizon") is nog toekomstig werk — nu wordt `ambitie` getoond.
- Compliance-gaps uit sectie 4.6 (prioriteit 4.2 en 4.4).
- Demo-omgeving niet beschikbaar per 2026-04-22. Eerdere demo-alias 
  (`kingfisher-btcdemo.vercel.app`) verwijderd omdat hij naar oude 
  deployment wees. Nieuwe demo-architectuur gepland — zie TECH_DEBT.md P3.