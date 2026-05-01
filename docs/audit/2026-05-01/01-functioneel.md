# 01 — Functionele inventarisatie

**Audit-datum:** 2026-05-01
**Branch:** `audit/2026-05-01`
**Doel:** wat het platform vandaag kan, vanuit gebruikers-perspectief. Geen oordeel.

---

## 1. Canvas-overzicht / dashboard

**Status:** af (functioneel kern, sinds Sprint 1)
**Laag:** UI + data
**Locatie:** `src/App.js` `AppInner`-component, gebruikt `BLOCKS` uit `src/features/canvas/components/BlockCard.jsx`

### BTC-blokken op het dashboard (7 stuks)

| Block ID | Titel (NL) | Status-block-component | Layout | Heeft sub-tabs? | Gekoppeld werkblad |
|---|---|---|---|---|---|
| `strategy` | Strategie | `StrategyStatusBlock.jsx` | wide | nee | `StrategieWerkblad.jsx` ✅ |
| `principles` | Leidende principes | `PrinciplesStatusBlock.jsx` | wide | ja (PRINCIPLES_SUBTABS) | `RichtlijnenWerkblad.jsx` ✅ |
| `customers` | Klanten & Dienstverlening | `BlockCard.jsx` (generic) | quarter | ja (PILLAR_SUBTABS) | **ontbreekt** (stub) |
| `processes` | Processen & Organisatie | `BlockCard.jsx` (generic) | quarter | ja (PILLAR_SUBTABS) | **ontbreekt** (stub) |
| `people` | Mensen & Competenties | `BlockCard.jsx` (generic) | quarter | ja (PILLAR_SUBTABS) | **ontbreekt** (stub) |
| `technology` | Informatie & Technologie | `BlockCard.jsx` (generic) | quarter | ja (PILLAR_SUBTABS) | **ontbreekt** (stub) |
| `portfolio` | Verander Portfolio | `BlockCard.jsx` (generic) | wide | nee | **ontbreekt** (stub) |

### Layout — grid

Vier rijen op een 12-kolom grid:
- Rij 1: Strategie (full width)
- Rij 2: Leidende principes (full width)
- Rij 3: 4 pijlers (Klanten / Processen / Mensen / Technologie) — equal quarters
- Rij 4: Verander Portfolio (full width)

### Status-systeem per blok

`getBlockStatus(blockId, docs, insights, bullets)` → `"empty" | "uploaded" | "insights" | "done"`:
- `empty` — geen docs, geen AI-insights, geen handmatige bullets
- `uploaded` — alleen documenten geüpload, geen AI-insights of bullets
- `insights` — AI-insights gegenereerd, niet verplaatst naar bullets
- `done` — bullets ingevuld (manueel of via AI)

### Gebruikersacties op dashboard

- Klik op blok → opent `<DeepDiveOverlay>` (full-screen werkblad indien geregistreerd) of `<GenericPlaceholder>` ("Verdieping voor dit blok komt in een volgende sprint")
- Klik op `Strategie`-blok → toont strategie-status + opent `StrategieWerkblad`
- Klik op `Principles`-blok → toont guideline-counts per segment + opent `RichtlijnenWerkblad`
- Sliding panel via `BlockPanel.jsx` (verschijnt rechts) — alternatieve view voor blokken zonder eigen werkblad: drie tabs **Extract / Review / Canvas**
- Footer: globale "Consistency Check" knop (ShieldCheck-icoon) bij alle blokken gevuld → `<ConsistencyModal>`

---

## 2. Strategie Werkblad

**Status:** af (Sprint A/B/C afgerond per 2026-04-26)
**Laag:** UI + data + AI
**Locatie:** `src/features/strategie/StrategieWerkblad.jsx` (1437 regels)

### Layout

Drie hoofdsecties (uit code geverifieerd):

#### 2.1 Sectie 1 — Identiteit (`strat.section.identiteit`)

| Veld | Type | Multi-line | AI-improve | AI-magic (RAG) | Tabel/kolom |
|---|---|---|---|---|---|
| Missie (`strat.field.missie`) | textarea | ja | ja (4 presets) | ja | `strategy_core.missie` |
| Visie (`strat.field.visie`) | textarea | ja | ja (4 presets) | ja | `strategy_core.visie` |
| Ambitie BHAG (`strat.field.ambitie`) | textarea | ja | ja (4 presets) | ja | `strategy_core.ambitie` |
| Kernwaarden (`strat.field.kernwaarden`) | tag-pills + input | n.v.t. | nee | ja (array) | `strategy_core.kernwaarden` (jsonb array) |
| Strategische Samenvatting (`strat.field.samenvatting`) | textarea | ja | nee | nee | `strategy_core.samenvatting` |

**AI-improve presets** (uit `IMPROVE_PRESETS`-constant in component):
- ✨ Inspirerender
- 📊 McKinsey-stijl
- ✂️ Beknopter
- 💶 Focus Financieel

**AI-magic = Magic Staff** (RAG-suggestie op basis van `Het Dossier`):
- Aanvraag: `apiFetch("/api/magic", { field, chunks })` waar `chunks` uit dossier-RAG-search komt
- Resultaat: typewriter-effect via `MagicResult.jsx` + accept/reject-knoppen
- Edge-case: "geen documenten gevonden" toont prompt om Het Dossier te vullen
- Edge-case: kernwaarden gebruikt array-mode

**Samenvatting-AI:** aparte knop `handleGenerateSamenvatting` (regel 772) → `/api/strategy mode=samenvatting` → directe overschrijving (geen draft-stap)

#### 2.2 Sectie 2 — Analyse (`strat.section.analyse`)

| Veld | Type | AI-functies | Tabel |
|---|---|---|---|
| Externe Ontwikkelingen (`strat.field.extern`) | lijst van items | Magic Staff (RAG) | `analysis_items` (type=`extern`) |
| Interne Ontwikkelingen (`strat.field.intern`) | lijst van items | Magic Staff (RAG) | `analysis_items` (type=`intern`) |

**Tags op analyse-items:**
- Extern: `kans` | `bedreiging` | `niet_relevant`
- Intern: `sterkte` | `zwakte` | `niet_relevant`

**Auto-tag-knop** (`strat.autotag.button`): batch AI-classificatie van ongetagde items:
- Aanvraag: `/api/strategy mode=auto_tag`
- Alleen bij zekerheid; twijfelgevallen worden overgeslagen
- Gebruikt indices (niet UUIDs) om hallucination te voorkomen — vertaalslag in handler

#### 2.3 Sectie 3 — Executie (`strat.section.executie` = "Executie — 7·3·3 Regel")

Strategische Thema's, max 7 (uit prompt-regel + UI-counter `themas.length`/7):

| Veld | Type | AI-functie | Tabel |
|---|---|---|---|
| Thema-titel | input | `generateThemas` (`/api/strategy mode=themes`) → max 7 thema's | `strategic_themes.title` |
| Per thema: 3 KSF | input + current/target | `generateKsfKpiForThema` (`/api/strategy mode=ksf_kpi`) | `ksf_kpi` (type=`ksf`) |
| Per thema: 3 KPI | input + current/target | idem | `ksf_kpi` (type=`kpi`) |

**Genereer-Thema's-knop**: levert kandidaten als draft (in lijst), gebruiker kan per regel accepteren/wegklikken of bulk-accepteren.

**Genereer-KSF&KPI per thema**: levert 3 KSF + 3 KPI tegelijk in JSON-formaat van AI. Komen als draft binnen, accept/reject in UI.

#### 2.4 Werkblad-knoppen (drie-knoppen-shell, Sprint C)

`<WerkbladActieknoppen>` in header:

| Knop | Actie | State |
|---|---|---|
| Analyse draaien / Opnieuw analyseren | `handleAnalyze` → `/api/strategy mode=analysis` | label hangt af van of `analysis` aanwezig is |
| Inzichten bekijken | `setShowAdvies(true)` → `<InzichtenOverlay>` | disabled als `!analysis` |
| Rapportage | `setShowOnePager(true)` → `<StrategyOnePager>` | functioneel (Kees-besluit Sprint C) |

**Plus Full Draft-knop** (separate, oranje): triggert `handleFullDraft` — sequentieel alle Magic-velden vullen voor lege missie/visie/ambitie/kernwaarden via Magic Staff.

#### 2.5 Inzichten-overlay (Sprint A/B output)

`<InzichtenOverlay>` — document-layout overlay (`InzichtenOverlay.jsx`, 317 regels):
- Header met titel, canvas-naam, generated-at, n-bevindingen
- Filter-pills: 4 type-filters (`ontbreekt`/`zwak`/`kans`/`sterk`)
- TOC sticky links: dot-marker per insight, sectie-headers Onderdelen/Dwarsverbanden
- Hoofdstuk 1 — Onderdelen, Hoofdstuk 2 — Dwarsverbanden
- Per insight: type-icon + titel + observatie + aanbeveling + bron-verwijzingen ("Verwijst naar")
- "← Terug naar werkblad"-knop rechtsboven (vervangt eerdere X)
- Lege-staat (geen analyse), lege-staat (geen filter-resultaten), loading, error

#### 2.6 OnePager / Rapport (Strategie)

`<StrategyOnePager>` (`StrategyOnePager.jsx`, 583 regels) — 3 print-templates:
- `overview` — Missie/Visie/Kernwaarden + SWOT + Strategische Thema's
- `swot` — Gedetailleerde SWOT-matrix
- `scorecard` — Balanced Scorecard: thema's × KSF / KPI / target

**Export**: `window.print()` met `@media print` CSS → browser-PDF
**Optionele toggle**: "Advies in print" — voegt AI-analyse-sectie toe aan print

### Persistente data (Strategie)

| Tabel | Inhoud |
|---|---|
| `strategy_core` (1 per canvas) | missie, visie, ambitie, kernwaarden, samenvatting, **insights** (Sprint A) |
| `analysis_items` (N per canvas) | extern/intern items met tag |
| `strategic_themes` (N per canvas) | thema-titel + sort_order |
| `ksf_kpi` (N per thema) | type (ksf/kpi), description, current/target value |

---

## 3. Richtlijnen Werkblad

**Status:** af (kern), Inzichten-overlay sub-pattern nog **inline en niet gemigreerd** naar shared `<InzichtenOverlay>`
**Laag:** UI + data + AI
**Locatie:** `src/features/richtlijnen/RichtlijnenWerkblad.jsx` (901 regels)

### Layout

Vier vaste segmenten, per segment N principes (uit `SEGMENTS` constant regel 33):

| Segment-key | Label (default) | Sub-label |
|---|---|---|
| `generiek` | Generiek | Strategie & Governance |
| `klanten` | Klanten | Markt & Dienstverlening |
| `organisatie` | Organisatie | Mens & Proces |
| `it` | IT | Technologie & Data |

### Per principe (richtlijn)

| Veld | Type | AI-functie | Tabel/kolom |
|---|---|---|---|
| Titel | input | n.v.t. (handmatig) | `guidelines.title` |
| Beschrijving | textarea | n.v.t. (handmatig) | `guidelines.description` |
| Implicaties: Stop / Start / Continue | 3 textareas | `onGenerateImplications` → AI Stop/Start/Continue | `guidelines.implications` (jsonb) |
| Gekoppelde thema's | multiselect (badges) | Auto-link knop | `guidelines.linked_themes` (jsonb array van theme.id) |

### Context-strip — drie panelen (boven aan werkblad)

1. **Stip op de Horizon** — toont `strategy_core.samenvatting` of fallback `ambitie` (read-only)
2. **Strategische Thema's** — read-only lijst (uit `strategic_themes`); knop "Auto-link" als principes en thema's beide gevuld zijn
3. **Kernwaarden** — read-only (uit `strategy_core.kernwaarden`)

### Werkblad-knoppen (drie-knoppen-shell, Sprint C)

`<WerkbladActieknoppen>` in header:
- Analyse draaien / Opnieuw analyseren → `handleAnalyze` → AI levert advies in `guideline_analysis.recommendations`
- Inzichten bekijken → opent **inline** advies-overlay (regel 818-841) — **niet** de shared `<InzichtenOverlay>`
- Rapportage → opent `<GuidelinesOnePager>`

### Inzichten-overlay (Richtlijnen)

**Verschilt van Strategie-implementatie**:
- Inline JSX in `RichtlijnenWerkblad.jsx` (regel 818-841), geen aparte component
- Bevat eigen "Analyseer richtlijnen"-knop binnen de overlay (redundant met werkblad-knop sinds Sprint C — beide triggeren `handleAnalyze`)
- Toont `recommendations` uit `guideline_analysis` in oude format `{type, title, text}` — niet het Sprint-A Inzichten-schema (geen `category`/`observation`/`recommendation` split, geen `source_refs`)

→ Genoteerd als "observatie voor latere fase" in `00-index.md`: Richtlijnen heeft niet de Sprint-A/B refactor doorgevoerd; alleen de werkblad-shell (Sprint C) is gemigreerd.

### AI-functies — overzicht

| Knop / Actie | Endpoint | Doel |
|---|---|---|
| Genereer principes (per segment) | `/api/guidelines mode=generate` | AI levert kandidaat-principes voor een leeg segment |
| AI op één principe (Stop/Start/Continue) | `/api/guidelines mode=implications` | Genereert de drie implicaties per principe |
| Analyseer richtlijnen | `/api/guidelines mode=analysis` (?) | AI-advies over richtlijnen |
| Auto-link thema's | `/api/guidelines mode=link_themes` (?) | Koppelt alle principes aan meest passende thema's |

(?) = exacte API-endpoint-paden niet uitputtend geverifieerd — `api/guidelines.js` heeft 3 modes met max_tokens 3000/1500/400, namen niet bevestigd in deze pass.

### OnePager / Rapport (Richtlijnen)

`<GuidelinesOnePager>` (`GuidelinesOnePager.jsx`, 199 regels):
- **Layout**: A4 portrait, 2×2 grid (Generiek / Klanten / Organisatie / IT)
- **Per kwadrant**: kleur-coded, segment-titel, lijst principes met thema-badges
- **Export**: `window.print()`

### Persistente data (Richtlijnen)

| Tabel | Inhoud |
|---|---|
| `guidelines` (N per canvas) | segment, title, description, implications (jsonb), linked_themes (jsonb), sort_order |
| `guideline_analysis` (1 per canvas) | recommendations (jsonb array van `{type, title, text}`) |

---

## 4. Klanten & Dienstverlening

**Status:** **ontbreekt** (stub op canvas-niveau, geen werkblad)
**Locatie:** `BLOCKS[2]` in `BlockCard.jsx`; in `DeepDiveOverlay.jsx` regel 19 commented out (`// customers: React.lazy(...)`); fallback naar `<GenericPlaceholder>` met tekst "Verdieping voor dit blok komt in een volgende sprint"
**Sub-tabs (gedefinieerd, leeg)**: As Is / To-Be / Change-portfolio (`PILLAR_SUBTABS` uit `BlockCard.jsx`)
**Wat wel bestaat**: bullets in canvas-blok (handmatig invulbaar via `<BlockPanel>` panel-tab "Canvas"), AI-insights via Het Dossier (via panel-tab "Extract")
**Tips beschikbaar**: ja, in `TIPS_DATA.nl.customers` — 3 tips zichtbaar via tips-modal

---

## 5. Processen & Organisatie

**Status:** **ontbreekt** (stub)
**Locatie:** idem — `BLOCKS[3]`, niet in `WERKBLAD_REGISTRY`, fallback `<GenericPlaceholder>`
**Wat wel bestaat**: zelfde als Klanten — bullets via `<BlockPanel>`, AI-insights via Dossier
**Tips beschikbaar**: ja (`TIPS_DATA.nl.processes`)

---

## 6. Mensen & Competenties

**Status:** **ontbreekt** (stub)
**Locatie:** idem — `BLOCKS[4]`. In `DeepDiveOverlay.jsx` regel 20 commented out (`// people: React.lazy(...)`)
**Wat wel bestaat**: bullets via `<BlockPanel>`, AI-insights via Dossier
**Tips beschikbaar**: ja (`TIPS_DATA.nl.people`)

---

## 7. Informatie & Technologie

**Status:** **ontbreekt** (stub)
**Locatie:** idem — `BLOCKS[5]`, geen entry in `WERKBLAD_REGISTRY`, fallback `<GenericPlaceholder>`
**Wat wel bestaat**: bullets via `<BlockPanel>`, AI-insights via Dossier
**Tips beschikbaar**: ja (`TIPS_DATA.nl.technology`)

---

## 8. Verander Portfolio (Roadmap)

**Status:** **ontbreekt** (stub)
**Locatie:** idem — `BLOCKS[6]`, geen entry in `WERKBLAD_REGISTRY`, fallback `<GenericPlaceholder>`
**Wat wel bestaat**: bullets via `<BlockPanel>` (zonder sub-tabs — `hasSubs: false`), AI-insights via Dossier
**Tips beschikbaar**: niet expliciet geverifieerd — `TIPS_DATA.nl.portfolio` (?) afhankelijk van data

---

## 9. Block-panel (alternatief voor blokken zonder werkblad)

**Status:** af
**Locatie:** `src/features/canvas/components/BlockPanel.jsx` (434 regels)

Sliding panel van rechts (520px breed). Drie tabs:

| Tab | Doel |
|---|---|
| **Extract** | AI-insights uit Het Dossier — pending (accept/reject), accepted (verplaats naar Canvas-tab) |
| **Review** | (niet uitputtend gelezen — vermoedelijk insight-review/edit-flow) |
| **Canvas** | Handmatig bullets invullen / bewerken / verwijderen; sub-tabs voor As-Is/To-Be/Change |

Voor blokken met sub-tabs (`PILLAR_SUBTABS`): As-Is, To-Be, Change-portfolio.

---

## 10. Onepager / Rapportage — totaalbeeld

| Onepager | Componenten | Locatie | Templates |
|---|---|---|---|
| Strategie Onepager | `<StrategyOnePager>` | `src/features/strategie/StrategyOnePager.jsx` | overview, swot, scorecard |
| Richtlijnen Onepager | `<GuidelinesOnePager>` | `src/features/richtlijnen/GuidelinesOnePager.jsx` | 2×2 grid |

**Export-formaten**: alleen browser-PDF via `window.print()` + print-CSS. Geen native PDF-export, geen DOCX, geen XLSX.

**Niet aanwezig**:
- Canvas-brede onepager (alle blokken samen)
- Custom templates buiten de drie hardcoded
- Print-preview voor inhoudelijke check (alleen via browser-print-dialog)

**Future state per design-doc:** `INZICHTEN_DESIGN.md` noemt "Output B" (Rapportage) als nog te ontwerpen; aparte design-sessie. Issue #56 open: "Rapportage (output B) — design en implementatie".

---

## 11. Authenticatie en account-management

**Status:** af (kern), enkele open punten
**Locatie:** `src/shared/services/auth.service.js`, `src/LoginScreen.js`

### Login-scherm

`LoginScreen.js` (213 regels) — drie modi:
- `login` — e-mail + wachtwoord → `signIn`
- `register` — e-mail + wachtwoord → `signUp`
- `reset` — e-mail → `resetPassword` (link via Supabase mail)

Flow:
- Bij faliled login: hardcoded NL-melding "E-mailadres of wachtwoord is onjuist."
- Disclaimers / branding hardcoded zichtbaar (bv. "Kingfisher & Partners — intern gebruik")
- Geen MFA / 2FA
- Geen SSO / OAuth providers gevonden in code
- Wachtwoord-show toggle aanwezig

### Account-states

Gemanaged door `AuthProvider`:
- `session === undefined` → laden
- `session === null` → niet ingelogd → `<LoginScreen>`
- `session && tenantId === null` → ingelogd zonder profiel → "Account wacht op activatie"-scherm met sign-out-knop
- `session && tenantId` → normale app
- Admin-route `/admin` → alleen voor `session.user.email === REACT_APP_ADMIN_EMAIL`; anders "Geen toegang"-scherm

### Bekende gaten

- **Auto-aanmaak `user_profiles` bij signup ontbreekt** (Issue #70 open) — gebruiker moet handmatig in Supabase Dashboard worden gekoppeld aan tenant
- **Geen profiel-edit** (naam, avatar, password change in app)
- **Geen "logout op alle apparaten"**

---

## 12. Multi-tenancy

**Status:** geïmplementeerd 2026-04-24, fundamenten af, UI nog beperkt
**Locatie:** `src/shared/services/auth.service.js`, RLS-helpers in DB

### Wat werkt

- Twee tenants in DB (Kingfisher, Platform — uit migraties)
- Theming per tenant via `theme_config` jsonb-kolom (10 keys)
- Data-isolatie via RLS met `current_tenant_id()`-helper
- `userRole` (`tenant_admin` / `user` / `platform_admin`?) beschikbaar in `useAuth()` context

### Wat (nog) niet werkt

- **Tenant-admin UI** — geen in-app pagina om tenant-config te beheren (Issue #79)
- **Tenant-switcher voor `platform_admin`** — geen UI om tussen tenants te wisselen (Issue #71)
- **Subdomein-routing** — geen `tenant.kingfisher.app`-pattern (Issue #75)
- **Auto-aanmaak `user_profiles` bij signup** — handmatig (Issue #70)
- **Witte variant Kingfisher logo** — bestand bestaat niet, fallback naar tekst (Issue #73)
- **Platform-tenant logo** — `logo_url` en `logo_white_url` beide null, toont "Platform"-tekst (Issue #74)

---

## 13. Theming / branding

**Status:** af (technisch); content-gat op logo's
**Locatie:** `src/shared/context/ThemeProvider.jsx`, `src/shared/components/LogoBrand.jsx`, `src/shared/hooks/useTheme.js`

### Per tenant configureerbaar (10 keys in `theme_config`)

- Brand-naam (`brand_name`)
- 7 brand-kleuren (primary, accent, accent-hover, success, analysis, overlay, accent-light)
- Donker logo (`logo_url`)
- Wit logo (`logo_white_url`)

### Toepassing

- CSS-variabelen op `document.documentElement` via `useEffect` in `ThemeProvider`
- `:root`-defaults in `src/index.css` (Kingfisher-defaults) als fallback
- Tailwind-componenten gebruiken `bg-[var(--color-primary)]`, `text-[var(--color-accent)]/70`, etc.
- `<LogoBrand>` met `variant="light"|"dark"` + `imageFailed`-fallback naar `--brand-name`-tekst
- `useDocumentTitle` zet `document.title = "{brand_name} — {productName}"`

### Niet per tenant configureerbaar (vandaag)

- Lettertype (Inter is hardcoded in `src/index.css` body)
- Layout-variaties / component-set / iconen-set
- Werkblad-namen (zijn wel via `app_config` `label.werkblad.*` aan te passen, maar global, niet per tenant)
- Hele content-set (prompts, AI-templates) — `app_config` is global, niet tenant-scoped

---

## 14. Admin-functionaliteit

**Status:** af (basaal — alleen `app_config` editor)
**Locatie:** `src/features/admin/AdminPage.jsx` (492 regels)
**Toegang:** route `/admin`, alleen voor `session.user.email === REACT_APP_ADMIN_EMAIL` (env-var, single email)

### Vier tabs

| Tab | Inhoud | Groepen |
|---|---|---|
| **AI Prompts** (category=`prompt`) | Alle prompts uit `app_config` | Magic Staff (incl. `prompt.validate`), Verbeteren (`prompt.improve.*`), Strategie (`prompt.strategy.*`), Richtlijnen (`prompt.guideline.*`) |
| **Labels** (category=`label`) | UI-labels | Applicatie, Strategie Werkblad, Richtlijnen Werkblad, Overig (catch-all) |
| **Instellingen** (category=`setting`) | Numerieke / boolean settings | (één catch-all groep) |
| **Blok Titels** (`block_definitions` tabel) | NL/EN labels per BTC-blok | n.v.t. (geen groepering) |

### Per rij

- Inline edit (textarea voor prompts, input voor labels)
- Save-knop met statussen: idle → saving → saved → error
- Beschrijving-tekst per key (uit `app_config.description` kolom)

### Synthetische rijen

- `DEFAULT_LABELS` array (regels 18+, ~340 regels) bevat ~70 default-labels
- Bij ontbreken in DB: getoond met `_notInDb: true` zodat admin ze kan opslaan (`INSERT`-policy nodig)

### Bekende gaten / niet aanwezig

- Geen tenant-switcher (admin ziet alleen globale `app_config`)
- Geen audit-log van wijzigingen
- Geen rollback / versie-historie
- Geen bulk-edit / import/export
- Geen user-management (uitnodigen, rol toewijzen, deactiveren) — Issue #79

---

## 15. Document-upload en RAG (Het Dossier)

**Status:** af (kern), enkele open punten
**Locatie:** `src/features/dossier/components/MasterImporterPanel.jsx` (287 regels)
**Trigger:** "Dossier"-knop in app-header (zichtbaar als Database-icoon)

### Ondersteunde bestandsformaten (geverifieerd)

- TXT, CSV — direct text-decoder
- PPTX — JSZip + XML-parsing van `ppt/slides/slide*.xml` + notes (`ppt/notesSlides/`)
- PDF — `pdfjs-dist` client-side (?)
- DOCX — niet expliciet geverifieerd in deze pass, vermoedelijk via JSZip + word/document.xml parsing (?)
- XLSX — niet bevestigd

### Pipeline-fases

| Fase | Label | % | Kleur |
|---|---|---|---|
| `queued` | In wachtrij | 0 | grijs |
| `uploading` | Uploaden… | 25 | blauw (analysis-color) |
| `reading` | Lezen… | 55 | amber |
| `indexing` | Indexeren… | 80 | groen (accent) |
| `done` | Klaar | 100 | groen (success) |
| `error` | Fout | — | rood |

### Vector-search (RAG)

- Embeddings via OpenAI (`api/embed.js` — model niet uit grep gehaald)
- Vector-opslag: pgvector `vector(1536)` in `document_chunks.embedding`
- Search: RPC `search_document_chunks(query_embedding, canvas_id_filter, match_count)`
- Index: IVFFlat `cosine_ops` lists=100
- Parent-child chunking (CHECK `chunk_type IN ('parent', 'child')`)

### Magic Staff — RAG-toepassing

- Veld in werkblad → klik wand-icoon → `/api/magic` met `field`-id en `chunks` (search-resultaat)
- AI levert suggestie + citations (bron-bestanden)
- Toont in `MagicResult.jsx` met typewriter-animatie + accept/reject

### Bekende gaten / niet uitputtend geverifieerd

- Bestand verwijderen — `deleteDossierFile` aanwezig in service, UI-verificatie niet volledig
- Re-indexering bij wijzigingen — niet expliciet
- File-size-limiet — niet gevonden in deze pass
- Deduplicatie — `canvas_uploads` heeft `UNIQUE(canvas_id, file_name)` constraint
- Multi-canvas dossier — niet ondersteund (RAG is canvas-specifiek)

---

## 16. Consistency Check

**Status:** af (lokaal, geen AI)
**Locatie:** `src/features/canvas/components/ConsistencyModal.jsx` + scoring in `BlockCard.jsx` `runConsistencyCheck`

### Scores per blok

`scoreBlock(bullets)`:
- 30 basis als ≥ 1 bullet ingevuld (`length > 3`)
- +8 per bullet (max +40)
- +5 per bullet met cijfers/KPI/keywords (max +20) — regex `/\d|%|KPI|goal|target|owner|budget|Q[1-4]|\$|€/i`
- −5 per bullet < 15 chars (vague-penalty)
- Range: 10–100

### Issue-detection (3 regels, hardcoded)

- High: `strategy ≥ 3 bullets && portfolio < 2` → "strategy_portfolio"
- Medium: `people < 2 && technology ≥ 3` → "people_technology"
- Medium: `principles < 2` → "principles"

Toegankelijk via "ShieldCheck"-knop in app-header. Geen AI-gebruik, puur regex + thresholds.

---

## 17. Tips-modal

**Status:** af
**Locatie:** `src/features/canvas/components/TipsModal.jsx` (280 regels)

### Inhoud

`TIPS_DATA` constant (NL + EN) — 7 secties:
- `algemeen` — 6 tips (refereert expliciet naar boek "Business Transformatie Canvas" van Marc Beijen, Ruben Heetebrij, Roos Tigchelaar)
- `strategy` — 3 tips
- `principles` — 3 tips
- `customers`, `processes`, `people`, `technology` — 3 tips elk

→ Boek-referentie + auteurs hardcoded in `TIPS_DATA.nl.algemeen.intro` en in EN-versie. Onderdeel van document C.

### Toegang

- Vanuit app-header: "Tips"-knop (Maximize2-icoon) → opent op sectie `algemeen`
- Vanuit `<BlockPanel>`: BookOpen-icoon → opent op sectie van actief blok

---

## 18. Project Info Sidebar

**Status:** af
**Locatie:** `src/features/canvas/components/ProjectInfoSidebar.jsx` (145 regels)
**Trigger:** SlidersHorizontal-knop in app-header (rechts)

### Velden (project-metadata)

| Veld | Type | Tabel-kolom | Opties |
|---|---|---|---|
| Klantnaam | text | `canvases.client_name` | vrij |
| Lead Consultant | text | `canvases.author_name` | vrij |
| Branche | select | `canvases.industry` | Finance, Healthcare, Industry, Public, Retail, Energy, Professional Services, Other |
| Type Transformatie | select | `canvases.transformation_type` | Digitaal/IT, Cultuur & Gedrag, Duurzaamheid (ESG), Strategische Heroriëntatie, Fusie/Overname |
| Organisatiegrootte | select | `canvases.org_size` | < 100 fte, 100-500, 500-2500, 2500+ fte |
| Projectstatus | toggle-pills | `canvases.project_status` | Concept, In Review, Definitief |
| Beschrijving | textarea | `canvases.project_description` | vrij |

Alle waardes hardcoded in component (NL-tekst). Niet via `appLabel()`.

---

## 19. Multi-tab waarschuwing

**Status:** af
**Locatie:** `src/App.js` regel 199-209, gemanaged door `useCanvasState`

Detecteert als app in een ander tabblad open is — toont amber-banner: "De app is al geopend in een ander tabblad. Wijzigingen in dit tabblad kunnen overschreven worden."

---

## 20. Talen-ondersteuning

**Status:** af (NL + EN, partieel)
**Locatie:** `src/i18n.js` (267 regels)
**Trigger:** "NL | EN"-toggle in app-header

### Wat werkt

- 267 regels vertalingen voor canvas-blokken, sub-tabs, panel-tabs, tips-modal, consistency-modal, header-knoppen, footer
- NL is default
- Tips-modal heeft volledige EN-vertaling

### Wat is gemixt / niet vertaald

- App-config-labels (`appLabel(...)`) — tekst is uit `app_config.value`, niet via `t()` — dus niet automatisch tweetalig (er is wel een `LANG`-onderscheid in `appLabel`-call mogelijk maar niet uitputtend toegepast)
- Werkblad-velden (`StrategieWerkblad`, `RichtlijnenWerkblad`) — gebruiken `appLabel` (DB-driven), value is enkel-talig
- AI-prompts — taal-instructie is via `languageInstruction` parameter (default Nederlands) maar niet automatisch synced met `lang`-toggle
- Login-scherm — alleen NL hardcoded (geen `t()` of `appLabel` aanroepen)

---

## 21. Auto-saving

**Status:** af
**Locatie:** `useCanvasState.js`
**Patroon:** debounced autosave 500ms (`setting.autosave.delay_ms` configureerbaar)
**Indicator:** in app-header (links naast taal-toggle): "Opslaan…" / "Opgeslagen ✓" / "Opslaan mislukt ⚠"

Subset van `CLAUDE.md` sectie 4.2 compliance — sommige saves zijn fire-and-forget (zie tech_debt P2).

---

## Verificatie-paragraaf

### Wat ik heb gedaan voor compleetheid

- Volledig gelezen: `src/App.js` (419 regels), `BLOCKS`-array (uit `BlockCard.jsx`), `DeepDiveOverlay.jsx`, `ConsistencyModal.jsx`, `ProjectInfoSidebar.jsx`, `TipsModal.jsx` regels 7-66 (TIPS_DATA structure), `useCanvasState.js` regels 1-80 + earlier readings (handleSelectCanvas), `BlockPanel.jsx` regels 1-120 (tab-structure)
- Gedeeltelijk gelezen / gegrep'd: `StrategieWerkblad.jsx` (1437 regels — gericht op `IMPROVE_PRESETS`, fields, sections, AI calls, knoppen, draft-flows), `RichtlijnenWerkblad.jsx` (901 regels — segments, fields, AI hooks), `AdminPage.jsx` (groepen + TABS + render-flow), `LoginScreen.js` (gegrep'd op flow), `MasterImporterPanel.jsx` regels 1-40 (fasen + extract logic), `StrategyOnePager.jsx` (templates + sections), `GuidelinesOnePager.jsx` (segmenten + grid), `CanvasMenu.jsx` regels 1-60
- Cross-referenced met: migraties in `supabase/migrations/`, `DATABASE.md`, `CLAUDE.md` sectie 3A/4/8, `INZICHTEN_DESIGN.md` (verwijzingen), `tech_debt.md` (open issues), `parking-lot.md` (nadeel-items)
- GitHub Issues gegrep'd via `gh issue list` (uit eerdere actie): #56 Rapportage, #70 Auto-aanmaak user_profiles, #71 Tenant-switcher, #73 Witte logo, #74 Platform logo, #75 Subdomein, #79 Tenant-admin UI

### Niet onderzocht en waarom

- **`ksf_kpi`-tabel CRUD**: alleen via grep verkend; niet uitputtend geverifieerd of accept/reject van AI-drafts correct schrijft naar DB
- **`api/guidelines.js` 3 modes**: alleen model + max_tokens via grep, niet integrale tekst gelezen — exacte mode-namen (`generate`/`implications`/`analysis`/`link_themes`?) afgeleid uit RichtlijnenWerkblad-call-sites met (?)
- **`api/parse.js`, `api/embed.js`, `api/extract.js`, `api/improve.js`, `api/validate.js`**: niet integraal gelezen in deze pass; volgt in document D
- **Live database-content**: geen Supabase-query gedraaid voor live-state van tenants, app_config, of seed-data — gevolgd door document C
- **Witte variant Kingfisher logo / Platform logo's**: niet zelf via Vercel of public/ geverifieerd — afgeleid uit `parking-lot.md` + Issues
- **Block_definitions-tabel**: niet apart geverifieerd in DATABASE.md — admin gebruikt 'm wel maar `DATABASE.md` benoemt 'm niet expliciet (mogelijk addendum nodig — onder "opgemerkt-tijdens-audit")

### Verificatie-steekproeven (3 willekeurige bevindingen)

1. **DeepDiveOverlay-registry alleen voor strategy + principles** — bestand geopend regels 16-21, `WERKBLAD_REGISTRY` bevat exact 2 active entries en 2 commented-out (`// customers`, `// people`). De andere 3 stub-blokken (`processes`, `technology`, `portfolio`) komen zelfs niet als comments voor — vallen door op `<GenericPlaceholder>`. ✅
2. **`IMPROVE_PRESETS` heeft 4 entries** — `StrategieWerkblad.jsx` regel 400-405 geverifieerd: Inspirerender, McKinsey-stijl, Beknopter, Focus Financieel. ✅
3. **TIPS_DATA bevat boek-referentie** — `TipsModal.jsx` regel 11 letterlijk: "Op basis van het boek Business Transformatie Canvas van Marc Beijen, Ruben Heetebrij en Roos Tigchelaar." Auteurs van het boek (Marc Beijen) zijn klant-relevant per audit-prompt — opgenomen in document C. ✅

### Bekende blinde vlekken

- BlockPanel "Review"-tab: niet integraal gelezen — functionele beschrijving incomplete
- Welke endpoints exact gebruikt worden door RichtlijnenWerkblad: alleen via component-grep afgeleid, niet via volledige `api/guidelines.js`-lezing
- Of `block_definitions`-tabel is gemigreerd in `supabase/migrations/`: niet bevestigd
- "Full Draft"-flow exact gedrag bij failures of partial fills: alleen happy-path via grep zichtbaar
- Welke `setting.*`-keys actief gebruikt worden — alleen één voorbeeld (`autosave.delay_ms`) gevonden in code-zoekpatroon
