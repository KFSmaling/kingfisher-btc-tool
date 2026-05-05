# Technical Debt — BTC Tool

> Levend document. Update de status zodra iets gefixt is.  
> Gekoppeld aan `CLAUDE.md` sectie 4.6 en 10.  
> Laatste update: 2026-05-05

---

## Prioritering

- **P1 — Data-risico**: kan leiden tot verlies of corruptie van gebruikersdata. Fix zo snel mogelijk.
- **P2 — UX-risico**: gebruiker krijgt misleidende feedback (denkt dat iets opgeslagen is terwijl het faalde). Fix binnen een paar sprints.
- **P3 — Correctheid onder randgevallen**: bugs die alleen optreden bij snel wisselen / slechte connectie. Fix wanneer je het bestand toch aanraakt.
- **P4 — Architectureel**: bewuste keuze of grote migratie. Plan expliciet in.

---

## Open items

### P1 — Lifecycle / key-props (CLAUDE.md 4.1)

| Item | Locatie | Status |
|------|---------|--------|
| `key={canvasId}` ontbreekt op `<Werkblad>` | `DeepDiveOverlay.jsx` L79 | ✅ Done 2026-04-22 |
| `key={canvasId}` ontbreekt op `<MasterImporterPanel>` | `App.js` L329 | ✅ Done 2026-04-22 |

**Risico**: ghost data van vorig canvas zichtbaar in overlay/importer bij snel wisselen.  
**Effort**: 5 min.

---

### P1 — Load race-guards (CLAUDE.md 4.3)

| Item | Locatie | Status |
|------|---------|--------|
| Geen `cancelled` flag + captured canvasId | `StrategieWerkblad` useEffect L527 | ✅ Done 2026-04-22 |
| Geen `cancelled` flag + captured canvasId | `RichtlijnenWerkblad` useEffect L385 | ✅ Done 2026-04-22 |
| `handleSelectCanvas` mist `cancelled`-guard | `useCanvasState` | ✅ Done 2026-04-26 |

**Risico**: verouderde data overschrijft nieuwe data als user snel wisselt tijdens fetch.  
**Effort**: 30 min voor de eerste twee; `useCanvasState` apart beoordelen.

---

### P2 — Async integriteit (CLAUDE.md 4.2)

Systematische non-compliance — silent fails, fire-and-forget saves, optimistic updates zonder rollback.

| Item | Locatie | Type | Status |
|------|---------|------|--------|
| `.catch(() => {})` | `StrategieWerkblad.handleClose` | Silent fail | Open |
| Await zonder error-check | `StrategieWerkblad.removeAnalysisItem` | Silent fail | Open |
| Optimistic update | `StrategieWerkblad.changeAnalysisTag` | Optimistic | Open |
| Await zonder error-check | `StrategieWerkblad.removeThema` | Silent fail | Open |
| Await zonder error-check | `StrategieWerkblad.removeKsfKpi` | Silent fail | Open |
| `setTimeout` fire-and-forget | `StrategieWerkblad.updateThemaTitle` | Fire-forget | Open |
| `setTimeout` fire-and-forget | `StrategieWerkblad.updateKsfKpiItem` | Fire-forget | Open |
| Await zonder error-check | `RichtlijnenWerkblad.handleDelete` | Silent fail | Open |
| `setTimeout` debounced save | `RichtlijnenWerkblad.scheduleDbSave` | Fire-forget | Open |
| Error-check ontbreekt op vervolg-update | `RichtlijnenWerkblad.handleAcceptOneDraft` | Partieel | Open |

**Strategie**: niet als sprint aanvliegen. Fix incrementeel wanneer je het bestand toch aanraakt voor een feature.  
**Als signalen van gebruikers binnenkomen** ("ik denk dat mijn data kwijt is", "het draaide maar sloeg niet op"): naar P1 escaleren.

---

### P3 — Stale closures (CLAUDE.md 4.4)

Alle async callbacks in `StrategieWerkblad` en `RichtlijnenWerkblad` gebruiken `canvasId` rechtstreeks uit closure i.p.v. `canvasIdRef.current`.

| Callback | Bestand | Status |
|----------|---------|--------|
| `addAnalysisItem`, `addThema`, `acceptThemaDraftLine`, `acceptAllThemaDraft`, `handleAnalyze`, `handleClose` | `StrategieWerkblad` | Open |
| `handleAdd`, `handleAcceptOneDraft`, `handleAcceptAllDraft` | `RichtlijnenWerkblad` | Open |

**Risico**: callback schrijft naar vórig canvas als user wisselt tijdens async werk (AI-call, save).  
**Strategie**: introduceer `canvasIdRef` per werkblad één keer, pas callbacks incrementeel aan.

---

### P4 — Service contract

`CLAUDE.md` beschrijft het actuele contract (`{ data, error }`) in sectie 3. Dit is een bewuste keuze — geen migratie naar throw-style gepland. Dit item bestaat alleen om de beslissing vast te leggen.

**Beslissing**: services blijven `{ data, error }` retourneren. Throw-style zou alle services + alle call-sites raken zonder duidelijke winst. Call-sites moeten `error` wel expliciet checken (zie 4.2).

---

### P4 — Inzichten-patroon (analyse-overlay design)

Ontwerp vastgelegd voor een generiek Inzichten-patroon dat op meerdere 
schaalniveaus werkt (per werkblad en canvas-breed). Vervangt de huidige 
"Strategisch Advies" / "Richtlijnen Advies" overlays die niet voldoen aan 
de consumeer-ervaring die een consultant nodig heeft.

**Design-notitie:** zie `INZICHTEN_DESIGN.md` (root van project).

**Kernprincipes:**
- Bevindingen gestructureerd als Onderdelen + Dwarsverbanden
- Document-layout (lees-ervaring), geen dashboard
- Consumeren (overlay) strikt gescheiden van produceren (werkblad)
- Drie-knoppen-patroon op werkbladen: Analyse draaien / Inzichten bekijken / Rapportage
- Cross-werkblad verwijzingen als volwaardige bevindingen, niet als chips
- Type-indeling met kleur + vorm + label (kleurenblind-safe)

**Implementatie-volgorde:** drie losse sprints, niet combineren.
1. Data & prompt aanpassing (Strategie)
2. UI Inzichten-overlay (Strategie)
3. Drie-knoppen-patroon (alle werkbladen)

**Urgentie:** medium. Geen blocker, wel structurele verbetering van de 
kern-waardepropositie (analyse-kwaliteit voor consultants).

---

### P4 — Label-discipline tooling (CLAUDE.md sectie 2) — ✅ Done 2026-04-26

ESLint-regel `react/jsx-no-literals` toegevoegd op **warn**-level in
`package.json` `eslintConfig.rules` met allow-list voor technische
separators/iconen (`·`, `—`, `✓`, `←`, etc.) en `ignoreProps: true` zodat
className-strings niet vallen.

CRA's `npm run build` toont de warnings; `deploy-prod.sh` blijft slagen.
Eerste run vond **220 violations** in legacy code — gedekt door het
sweep-item hieronder.

**Promotie naar `error`-level:** apart besluit voor **na** de sweep.
Dan blokkeert het builds bij nieuwe violations.

**Pre-commit hook (Husky/lint-staged):** **niet** geïnstalleerd (Tier 3
overgeslagen). Build-time check via `deploy-prod.sh` is voldoende. Bij
behoefte aan eerder feedback-moment apart oppakken.

---

### P4 — Label-completeness sweep (eenmalige migratie)

Eenmalige inventarisatie + migratie van alle hardcoded UI-strings in 
werkbladen + overlays die nooit zijn meegenomen toen sectie 2 als richtlijn 
werd vastgelegd.

**Status:** **Uitvoerbaar** — tooling is live (zie vorig item, ✅ 2026-04-26).
Eerste ESLint-run heeft **220 violations** geïdentificeerd. De warning-output
fungeert als concrete punch-list.

**Aanpak — voorgestelde volgorde:**
1. Eerste pass: alle gedeelde shared-components (App.js, ErrorBoundary, LogoBrand, etc.)
2. Tweede pass: werkbladen (Strategie, Richtlijnen) — grootste files, meeste warnings
3. Derde pass: overlays (InzichtenOverlay, StrategyOnePager)
4. Migratie + LABEL_FALLBACKS uitbreiden per pass
5. Eindpunt: 0 warnings → promotie van rule naar `error` (apart commit)

**Effort:** ~half dagje voor de drie passes + migratie + LABEL_FALLBACKS.
Te doen in één focused sessie of incrementeel per file.

**Urgentie:** medium. Geen acuut probleem (geen UX-breuk, geen dataverlies), 
wel design-rule-handhaving — en CRA-warnings in dev-output zijn nu actief
ruis tot ze opgeruimd zijn.

---
## P5 — Deploy-architectuur & demo-omgeving

**Huidige state (per 2026-04-22):**
- `./deploy-prod.sh` gebruikt `vercel alias set` om `kingfisher-btcprod.vercel.app` 
  te her-assignen per deploy. Fragile: als het script de alias-stap mist, loopt 
  de alias achter terwijl nieuwe deploys wel live staan.
- Vercel deployt óók automatisch bij elke push naar master (GitHub-integratie 
  staat aan). Gevolg: dubbele deploys per push mogelijk, incl. bij docs-commits.
- Geen actieve demo-omgeving sinds 2026-04-22 (oude `kingfisher-btcdemo.vercel.app` 
  wees naar 11 dagen oude deployment, inmiddels opgeruimd).
- Productie en demo zouden dezelfde Supabase delen → risico voor prod-data bij 
  externe testers (zie Playwright-incident 2026-04-22).

**Doel-architectuur:**
- Git-based Vercel-deployments: `master` → prod, `demo` branch → demo
- Aliassen vast in Vercel Dashboard (geen CLI-scripting meer)
- Aparte Supabase-project voor demo (isoleer testdata)
- `./deploy-prod.sh` kan dan weg, wordt vervangen door `git push`

**Fasering:**
1. Opruimen huidige situatie — ✅ klaar per 2026-04-22 (aliassen + projecten)
2. Branch-setup voor prod verifiëren (master → auto-deploy werkt, script kan weg) — open
3. Demo-branch + tweede Supabase-project inrichten — open
4. CLAUDE.md sectie 1 herschrijven naar Git-based flow — open

**Urgentie:** medium. Blocker vóór externe demo-testers. Fase 1 (opruiming) volledig klaar; 
Fases 2-4 relevant zodra demo-sessies gepland worden.

**Effort:** ~3 uur, verdeeld over fases 2-4.

---

## P3 — `prompt.improve.system` ontbreekt als DB-key

`api/improve.js` heeft een werkende fallback-prompt in de handler-code (post-stap-7
ook met `{{token}}`-substitutie via `renderPrompt`), maar er is geen rij in
`app_config` voor `prompt.improve.system`. Gevolg: admin-UI kan deze prompt niet
bewerken via de prompt-manager.

**Fix:** migratie aanmaken die `prompt.improve.system` insert met dezelfde tekst
als de fallback in `api/improve.js`, en de fallback laten staan voor robuustheid.

**Bron:** B1 in fase-4 result-file (gearchiveerd `2026-05-04-1556`); expliciet
open backlog uit instruction `2026-05-04-2145`.

**Urgentie:** medium. Geen runtime-bug; wel een gat in admin-bewerking-discipline.

**Effort:** 30 min (migratie + verifiëren admin-UI toont rij).

---

## P4 — i18n-architectuur-mismatch (F-18 fase-2 audit; P11 in masterplan)

~20 `appLabel`-calls in Strategie-Werkblad + Richtlijnen werkbladen schakelen
niet tussen NL/EN. Architectuur-mismatch: `appLabel(key, fallback)` is
monolinguaal-by-design (`app_config.value` is één string per key, geen NL/EN-
onderscheid), terwijl `useLang().t(key)` bilinguaal is (TRANSLATIONS-object met
NL+EN per key). Werkbladen mixen beide; alleen het `t()`-deel switcht.

Canvas-componenten gebruiken uitsluitend `t()` → switchen volledig. Strategie/
Richtlijnen werkbladen gebruiken vooral `appLabel` → switchen niet. Dit is geen
regressie van stap 7 — bestaat sinds april 2026 toen `appLabel` werd
geïntroduceerd voor werkblad-labels.

**Twee paden** (uit i18n-bug-diagnose-result, gearchiveerd `2026-05-05-1437`):

1. **Schema-uitbreiding**: `app_config.value_en` kolom of `app_config_translations`-
   tabel; `appLabel(key, fallback, lang)`-signatuur uitbreiden. Per-tenant ook
   overridable. Architectureel correct, grootste werk.
2. **Migreer `appLabel`-calls in werkbladen naar `t()`-calls** met NL+EN in
   TRANSLATIONS. Verlies tenant-overridability voor die specifieke labels.
   Praktisch, maar niet schaalbaar voor enterprise-tenant met eigen terminologie.

Vereist ontwerp-discussie vóór implementatie — vooral met het oog op TLB en
toekomstige enterprise-tenants die mogelijk eigen terminologie willen
overschrijven.

**Urgentie:** medium. Geen blocker voor productie (visueel bug-rapport van Kees
4 mei was visuele check, geen klant-impact). Wel hinderlijk voor demo's met
EN-sprekende prospects.

**Effort:** schema-uitbreiding ~1 dag; t()-migratie ~halve dag — afhankelijk van
gekozen pad.

---

## P4 — TLB-branding-finetune (P12 in masterplan)

TLB-tenant is geseed met geguessde tints + de officiële TLB-SVG voor beide logo-
varianten (geen aparte witte). Drie open punten:

| Item | Status |
|---|---|
| `accent_hover_color` (`#885B33`) en `accent_light_color` (`#F5E8D4`) | Gegokte tints — geen TLB-officiële spec |
| Logo-contrast WCAG-ratio | 3.4 (gold op warm-black) — onder WCAG-AA-drempel 4.5 |
| Witte logo-variant | Ontbreekt; SVG-fallback naar tekst werkt wel |

**Fix:** definitieve TLB-brandbook opvragen of bij Kees afstemmen wat acceptabel
is voor demo-doeleinden (TLB is enterprise-test-tenant, geen betalende klant).

**Urgentie:** low. Demo-cosmetiek; LogoBrand fallback naar tekst werkt al als
SVG-render faalt op donkere achtergrond.

**Effort:** ~1 uur na ontvangst brandbook.

## Done log

- 2026-04-22 — P1 Lifecycle — `key={canvasId}` toegevoegd aan `<Werkblad>` (DeepDiveOverlay) en `<MasterImporterPanel>` (App.js). Commit: `78911c9`
- 2026-04-22 — P1 Load race-guards — `cancelled` flag + `canvasId`-guard in `StrategieWerkblad` en `RichtlijnenWerkblad` load-useEffects. Commit: `aed8e7e`
- 2026-04-22 — Vercel-opruiming — ongebruikte projecten verwijderd (website-ui, 
  demo), weesaliassen opgeruimd (btcprod.vercel.app, kingfisher-btcdemo.vercel.app), 
  elastic-hellman bewust behouden als parser/RAG-infrastructuur (sprint 3B/4B).
- 2026-04-22 — Governance — BTC Tool Project ingericht in Claude.ai met CLAUDE.md, 
  TECH_DEBT.md, DATABASE.md als Project Knowledge. Instructions afgestemd op werkstijl. 
  Testcase (canvas notes feature) bevestigde dat compliance-check automatisch werkt.
- 2026-04-23 — "Stip op de Horizon" — vastgesteld dat samenvatting al correct geladen wordt uit strategy_core en getoond in StrategyStatusBlock. Tech debt item gesloten.
- 2026-04-23 — P5 Fase 1 — bevestigd compleet; aliassen + Vercel-projecten opgeruimd per 2026-04-22. Fases 2-4 open.
- 2026-04-26 — #68 compliance-cleanup — `key={canvasId}` op `<InzichtenOverlay>`, filtered-empty-state via `appLabel`, `worksheetName`-prop voor herbruikbaarheid. Commit: `81bce39`
- 2026-04-26 — #60 AI-affordances standaard — `AiIconButton`/`AiIcon` shared components, 11 inline plekken gemigreerd, CLAUDE.md sectie 3B vastgelegd. Commit: `f0bd2f0`
- 2026-04-26 — #69 Sprint C drie-knoppen-patroon — `WerkbladActieknoppen` shared component, Strategie + Richtlijnen gemigreerd, overlay-sluit naar "Terug naar werkblad". Commit: `d4f7af2`
- 2026-04-26 — P1 4.3 — `useCanvasState.handleSelectCanvas` race-guard via `latestSelectRef`. Sluit hele P1-categorie. CLAUDE.md §4.6 4.3 → ✅. Commit: `446bb8b`
- 2026-04-26 — P4 Label-discipline tooling — ESLint `react/jsx-no-literals` op warn-level in `package.json` met allow-list. 220 legacy-violations gedetecteerd → sweep-item is nu uitvoerbaar. Commit: `245b562`
- 2026-05-05 — Stap 7 Tenant-content-laag (ADR-002 niveau 1). 19 commits + 11 migraties + 21 files (+659/-46). Template-engine `api/_template.js`; `tenants.tenant_content jsonb` per-tenant tokens; `app_config(tenant_id, key)` met UNIQUE NULLS NOT DISTINCT; 2 RPC-functies voor DISTINCT ON / NULLS LAST tenant-lookup; alle 5 endpoints geïntegreerd; 22 prompts BTC/KF/Novius-vrij; KF-tenant 1-op-1 ge-templated zonder regressie; TLB enterprise-tenant + cross-tenant RLS-isolatie bewezen. Master-merge `92ccb24`, production-deploy `dpl_98g5xKetKXMp3hPJ5oZRVPfB6NFe`.

---

## Bekende functionele technische schuld

Niet state-gerelateerd maar wel open:

- `strategyManual` laadt initieel uit `full.data?.strategy?.details?.manual` (oud JSONB), maar wordt direct daarna overschreven door een async load uit `strategy_core`. Gevolg: korte flash van lege/oude data bij canvas-wissel. Cosmetisch; geen dataverlies. Migratie van de initiële load (L88-89 useCanvasState) naar strategy_core zou de flash elimineren.
- "Stip op de Horizon" — ✅ opgelost per 2026-04-23. `StrategyStatusBlock` toont `samenvatting` uit `strategy_core` als die gevuld is; anders `missie` als fallback. Samenvatting-generator beschikbaar in StrategieWerkblad.
- Huidige "Strategisch Advies" en "Richtlijnen Advies" overlays worden vervangen door het Inzichten-patroon. Zie `INZICHTEN_DESIGN.md` en het P4-item hierboven.