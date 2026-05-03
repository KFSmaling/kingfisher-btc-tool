# 03 — Functioneel gap

**Audit-datum:** 2026-05-03 (fase 2)
**Branch:** `audit/2026-05-03-fase2`
**Meetlat:** wat het platform *belooft* te zijn — als platform-van-holding, methode-agnostisch, multi-tenant. Plus wat in `tech_debt.md` als roadmap-vooruitzicht staat.
**Bron:** fase 1 (`01-functioneel.md` als baseline van wat er is) + `tech_debt.md` + `INZICHTEN_DESIGN.md`-verwijzing + Issues genoemd in fase 1 (#56, #70, #71, #73, #74, #75, #79).

**Doel:** per gap vaststellen welke belofte/roadmap-item geschonden wordt + huidige status + minimum voor "tweede tenant kan productief gebruiken" + remediatie-klasse + grove effort-indicatie. **Geen sprint-planning.**

**Status-categorieën (gebruikt in dit document):**
- **afwezig** — geen code-spoor, alleen belofte/issue
- **stub** — placeholder zichtbaar in UI maar geen werkende functionaliteit
- **half af** — werkt deels; bekende gaps; niet klaar voor tweede tenant
- **volwaardig** — klaar voor productief gebruik

**Effort-categorieën (grove indicatie, geen schatting):**
- **klein** — uren tot één dag
- **middel** — paar dagen tot week
- **groot** — meerdere weken / volledige sprint
- **zeer groot** — meerdere sprints / herontwerp

---

## 1. Vier stub-werkbladen — Klanten / Processen / Mensen / Technologie + Portfolio

### F-1 — Klanten & Dienstverlening werkblad

- **Belofte:** BTC-blok bestaat in canvas (BLOCKS[2], `customers`); klant-werkblad onderdeel van de "7 BTC-blokken volwaardig"-belofte (impliciet uit canvas-design en prompts in `btcPrompts.js` dood code)
- **Status:** **stub** — `<GenericPlaceholder>` met tekst "Verdieping voor dit blok komt in een volgende sprint"
- **Locatie:** `BLOCKS[2]` in `BlockCard.jsx`; `DeepDiveOverlay.jsx:19` commented out (`// customers: React.lazy(...)`); fallback naar GenericPlaceholder
- **Wat wel bestaat:** BlockPanel (rechts-slidende panel) met 3 tabs (Extract / Review / Canvas), bullets handmatig invulbaar, AI-insights via Het Dossier, sub-tabs As-Is / To-Be / Change-portfolio
- **Wat ontbreekt voor tweede tenant:** afhankelijk van methode-keuze tweede tenant. Als tweede tenant ander framework heeft (zie F-9), is dit irrelevant. Als tweede tenant ook BTC gebruikt: een werkblad met identieke kwaliteit als Strategie/Richtlijnen.
- **Remediatie-klasse:** **herontwerp** (nieuw werkblad-design) of **per-tenant-content** (frameworks-data; cross-link 01-spec-gap S-4, S-22)
- **Effort:** **groot** per werkblad (Strategie was meerdere sprints)

### F-2 — Processen & Organisatie werkblad

Identieke status aan F-1. `BLOCKS[3]`. Niet in `WERKBLAD_REGISTRY`, niet in commented-out-list (verschil met F-1: zelfs niet als comment).

### F-3 — Mensen & Competenties werkblad

Identieke status. `BLOCKS[4]`. `DeepDiveOverlay.jsx:20` commented out (`// people: React.lazy(...)`).

### F-4 — Informatie & Technologie werkblad

Identieke status. `BLOCKS[5]`. Niet in commented-out-list.

### F-5 — Verander Portfolio werkblad

Identieke status. `BLOCKS[6]`. Geen sub-tabs (`hasSubs: false`). Niet in commented-out-list. Roadmap-tijdlijn-functionaliteit ontbreekt volledig (geen Gantt-, kanban- of tijdlijnvisualisatie in code).

### F-1 t/m F-5 — totaal-oordeel

**5 van 7 BTC-blokken zijn stub.** Het platform is feitelijk een Strategie+Richtlijnen-tool met 5 placeholder-blokken. De BTC-belofte (volwaardige 7-blok-canvas) is niet gerealiseerd.

**Volgorde-suggestie (geen sprint-planning):** indien tweede tenant ook BTC: prioriteit hangt af van klant-vraag. Customers/People typisch eerste vraag (klant-context); Technology/Portfolio later. **Indien fase-2-keuze richting methode-agnostisch (cross-link 01-spec-gap S-22):** investeer eerst in content-pack-architectuur i.p.v. nog 5 hardcoded BTC-werkbladen.

**Severity:** **H** voor "complete BTC-tool"-belofte; **M** indien strategische pivot naar methode-agnostisch (dan ineens minder relevant)

---

## 2. Output B Rapportage

### F-6 — Output B (rapportage-redesign volgens `INZICHTEN_DESIGN.md`)

- **Belofte:** `INZICHTEN_DESIGN.md` noemt expliciet "Output B" (Rapportage) als nog te ontwerpen. Issue #56 open: "Rapportage (output B) — design en implementatie".
- **Status:** **afwezig** — geen design, geen code, alleen vermelding in tech_debt en design-doc
- **Locatie:** n.v.t. — alleen `INZICHTEN_DESIGN.md` referentie + Issue #56
- **Wat wel bestaat:** Output A — huidige rapportage via `window.print()` op `<StrategyOnePager>` (3 templates: overview / swot / scorecard) en `<GuidelinesOnePager>` (2×2 grid). Browser-print → PDF.
- **Wat ontbreekt voor tweede tenant:** afhankelijk van Output-B-design. Huidige Output A is voldoende voor "internal review" maar onder consultancy-niveau voor "deliverable richting klant".
- **Cross-link spec:** §9 (export pipeline) — spec eist PDF (server-side via reportlab/@react-pdf/renderer), Gamma deck, PPTX. Werkelijkheid is alleen browser-print. Zie 01-spec-gap S-29.
- **Remediatie-klasse:** **herontwerp** (design + implementatie) — eerst design-keuze
- **Effort:** **groot** (design-sprint + implementatie-sprint)
- **Severity:** **M** — Output A werkt; B is kwaliteit-upgrade. Wel commercieel waardepropositie-relevant (export-kwaliteit = product-perceptie per spec §9).

### F-7 — Twee parallelle rapportage-flows

- **Belofte:** geen — observatie uit fase 1 sectie B.9 (Output A versus Output B coexistence)
- **Status:** **bestaand systeem-knel** — InzichtenOverlay (consumeer in app, Sprint A/B/C output) en OnePager (`window.print()`) zijn aparte code-paden; bij Output-B-implementatie wordt het 3 paden tenzij OnePager wordt vervangen
- **Wat ontbreekt voor tweede tenant:** strategische keuze: behoudt OnePager of vervang door Output B? In huidige situatie heeft de gebruiker twee verschillende rapportage-formats voor dezelfde data.
- **Remediatie-klasse:** **beslissing nodig** + opvolg-ontwerp
- **Effort:** dependency op F-6
- **Severity:** **L** — niet brekend, wel verwarrend

---

## 3. Inzichten op Richtlijnen-werkblad (Sprint A/B refactor niet doorgevoerd)

### F-8 — Richtlijnen-Inzichten-overlay nog op oude schema

- **Belofte:** Sprint A/B Inzichten-pattern (gestructureerd Onderdelen/Dwarsverbanden, source-refs, etc.) was bedoeld voor alle werkbladen. Sprint C drie-knoppen-shell ✅ ook op Richtlijnen toegepast (`WerkbladActieknoppen`).
- **Status:** **half af** — Strategie heeft volwaardige `<InzichtenOverlay>` (Sprint A/B); Richtlijnen heeft inline JSX-overlay op oude `recommendations[]`-schema (`{type, title, text}`)
- **Locatie:** `RichtlijnenWerkblad.jsx:818-841` (inline-overlay) + `guideline_analysis.recommendations` JSONB-kolom met oude schema
- **Wat ontbreekt voor tweede tenant:** Richtlijnen-werkblad heeft geen consultant-niveau Inzichten-output zoals Strategie. Bij tweede tenant ontstaat verwachtings-mismatch ("waarom is Richtlijnen-analyse zwakker dan Strategie-analyse?").
- **Bekende redundantie (cross-link fase 1 sectie A.10 #36):** inline overlay heeft eigen "Analyseer richtlijnen"-knop die hetzelfde `handleAnalyze` triggert als de werkblad-shell — dubbele knoppen sinds Sprint C.
- **Remediatie-klasse:** **schema-uitbreiding** (`guideline_insights`-kolom analoog aan `strategy_core.insights`) + **herontwerp** (RichtlijnenWerkblad migreren naar shared `<InzichtenOverlay>`) + **prompt-update** (`prompt.guideline.advies` aanpassen naar Inzichten-format)
- **Effort:** **middel** (Sprint A/B-replay voor Richtlijnen, code-pad bestaat al)
- **Severity:** **M** — bekend gat, zichtbaar verschil tussen werkbladen

---

## 4. Multi-tenant functioneel — wat ontbreekt voor "tweede tenant productief"

### F-9 — Tenant-admin UI

- **Belofte:** Issue #79 open ("Tenant-admin UI"); spec §2.1 ("Per tenant configureerbaar") + §2.3 (multi-tenancy vanaf dag één)
- **Status:** **afwezig** — admin-pagina is alleen voor `platform_admin` (single-email RLS) en wijzigt globale `app_config`. Tenant-admins kunnen niets configureren binnen eigen tenant.
- **Locatie:** `AdminPage.jsx` — 4 tabs allemaal global; geen tenant-context
- **Wat ontbreekt voor tweede tenant:**
  - Tenant-admin-rol effectief (rol bestaat, geen UI)
  - Tenant-scoped instellingen (vereist eerst content-tier tenant-scoping — cross-link 01-spec-gap S-1, S-22)
  - Wachtwoord-reset / user-uitnodiging binnen tenant
- **Remediatie-klasse:** **herontwerp** (depends-on S-1 + S-22) + nieuwe Admin-pagina-laag
- **Effort:** **groot** (depends-on schema-werk eerst)
- **Severity:** **H** — blocker voor tweede zelf-bediende tenant; **L** als tweede tenant is "Kees beheert ook" (Kees als platform_admin doet alles)

### F-10 — Tenant-switcher voor `platform_admin`

- **Belofte:** Issue #71 open
- **Status:** **afwezig** — `platform_admin` ziet alleen eigen tenant-data via RLS. Geen UI om tussen tenants te switchen voor support/onderhoud.
- **Wat ontbreekt voor tweede tenant:** Kees moet bv. Kingfisher-canvas kunnen openen om te zien wat een KF-consultant ziet. Vandaag mogelijk via DB-query, niet via UI.
- **Remediatie-klasse:** **herontwerp** (UI + impersonation-mechanisme of cross-tenant-RPC)
- **Effort:** **middel**
- **Severity:** **M** — werkbaar workaround (DB-toegang) maar onhandig

### F-11 — Auto-aanmaak `user_profiles` bij signup

- **Belofte:** Issue #70 open
- **Status:** **afwezig** — bij signup landt user in `auth.users`; `user_profiles`-rij ontbreekt; RLS blokkeert alle queries → "Account wacht op activatie"-scherm. Kees moet handmatig `user_profiles`-rij toevoegen via Supabase Dashboard.
- **Wat ontbreekt voor tweede tenant:** ofwel een DB-trigger (`auth.users` insert → `user_profiles` insert), ofwel een signup-flow met tenant-keuze, ofwel een uitnodigings-link-mechanisme (tenant-admin nodigt user uit met token).
- **Remediatie-klasse:** **schema-uitbreiding** (DB-trigger, simpelste) of **herontwerp** (uitnodigings-flow)
- **Effort:** **klein** (trigger) tot **middel** (uitnodigings-flow met tokens)
- **Severity:** **M** — manueel proces is werkbaar voor enkele users; blokkeert self-service

### F-12 — Subdomein-routing per tenant

- **Belofte:** Issue #75 open
- **Status:** **afwezig** — alle tenants delen `kingfisher-btcprod.vercel.app`; tenant-context komt uit user-login, niet uit URL
- **Wat ontbreekt voor tweede tenant:** geen blocker; wél wenselijk voor branding (`klantnaam.platform.com`)
- **Remediatie-klasse:** **herontwerp** (Vercel-routing + DNS + tenant-resolution per subdomein)
- **Effort:** **middel**
- **Severity:** **L** — UX-/branding-verbetering, geen functionele blocker

### F-13 — Logo's en branding-assets per tenant

- **Belofte:** Issue #73 (Witte variant Kingfisher logo), Issue #74 (Platform-tenant logo)
- **Status:** **half af** — `theme_config.logo_url` veld bestaat, mechanisme werkt; specifieke logo-bestanden ontbreken (Kingfisher mist wit logo; Platform-tenant heeft beide null → fallback naar tekst)
- **Wat ontbreekt voor tweede tenant:** een per-tenant logo-upload-mechanisme (vandaag: bestand op `public/`-pad + DB-update via SQL — niet self-service)
- **Remediatie-klasse:** **schema-uitbreiding** (Supabase Storage + upload-UI) + dependency op F-9 tenant-admin
- **Effort:** **middel**
- **Severity:** **M** — visueel relevant voor tenant-onboarding

### F-14 — Tweede-tenant-onboarding-flow

- **Belofte:** impliciet in spec §2.3 ("multi-tenancy vanaf dag één")
- **Status:** **afwezig** — geen flow voor "nieuwe tenant aanmaken". Vereist: SQL-INSERT op `tenants`, INSERT op `user_profiles`, theme_config-vulling, eventueel logo-upload, eventueel content-pack-koppeling
- **Wat ontbreekt voor tweede tenant:** alle stappen handmatig via Supabase Dashboard. Geen platform_admin-UI ervoor.
- **Remediatie-klasse:** **herontwerp** (platform_admin-UI met tenant-creation-flow)
- **Effort:** **middel**
- **Severity:** **M** — eenmalige actie per tenant; werkbaar voor lage volumes

---

## 5. Content-laag tenant-scoping (functioneel perspectief)

### F-15 — Per-tenant prompts (= AI-gedrag per tenant)

- **Belofte:** spec §2.1 "Content layer per tenant configureerbaar"
- **Status:** **afwezig** — alle 19 prompts in `app_config` global; tenant-admin kan niets aanpassen
- **Wat ontbreekt voor tweede tenant:** als tweede tenant andere AI-output wil (andere stijl, ander taalgebruik, andere methode-link) — moet vandaag KF accepteren of de globale prompts wijzigen (= raakt KF-tenant ook)
- **Cross-link:** 01-spec-gap S-1, S-22; 02-ip-gap IP-1 t/m IP-6
- **Remediatie-klasse:** **schema-uitbreiding** (`app_config.tenant_id`) of **herontwerp** (`content_packs`-tabel)
- **Effort:** **groot** (raakt RLS, AdminPage, AppConfigContext)
- **Severity:** **H** — blokkeert white-label belofte

### F-16 — Per-tenant labels (= UI-tekst per tenant)

- **Belofte:** spec §2.1 + impliciet uit "configuratie boven code"
- **Status:** **afwezig** — `app_config` labels global
- **Wat ontbreekt voor tweede tenant:** als tweede tenant andere terminologie gebruikt (bv. "Strategische thema's" → "Strategic Initiatives") — globale wijziging raakt KF
- **Cross-link:** 01-spec-gap S-1
- **Remediatie-klasse:** koppelt aan F-15 (zelfde schema-uitbreiding)
- **Effort:** opgenomen in F-15
- **Severity:** **M** — werkbaar via één globale taal-keuze maar inflexibel

### F-17 — Per-tenant voorbeeld-content (EXAMPLE_BULLETS)

- **Belofte:** spec §2.4 (geen branche-aannames in code) + §6.3 (content-pack)
- **Status:** **hardcoded in `BlockCard.jsx EXAMPLE_BULLETS`** met insurance/HNW-jargon (cross-link 02-ip-gap IP-25, IP-27)
- **Wat ontbreekt voor tweede tenant:** als tweede tenant in andere branche zit, is "Voorbeeld laden" verkeerd
- **Cross-link:** 01-spec-gap S-6, S-12
- **Remediatie-klasse:** **vervangen** (generieke voorbeelden) of **per-tenant-content**
- **Effort:** **klein** (vervangen) tot **middel** (per-tenant)
- **Severity:** **M** — koppelt aan IP-27 + S-12

---

## 6. i18n-architectuur

### F-18 — Taal-toggle vs `appLabel` mismatch

- **Belofte:** taal-toggle bestaat (NL/EN); spec §2.2 (config boven code) impliceert tweetalig-werkbare DB-driven content
- **Status:** **half af** — `useLang().t()` werkt voor `TRANSLATIONS`-keys (NL+EN); `appLabel()` leest één DB-waarde zonder taal-onderscheid
- **Locatie:** `i18n.js` ↔ `app_config`; LoginScreen volledig hardcoded NL (geen `t()` of `appLabel`)
- **Wat ontbreekt voor tweede tenant:** als tweede tenant in EN werkt — alle DB-driven labels blijven NL bij EN-toggle. Mixed-language-UX.
- **Remediatie-klasse:** **schema-uitbreiding** (`app_config.value_nl` + `value_en` of `app_config_translations`-tabel) + **herontwerp** (`appLabel(key, fallback, lang)`-signatuur)
- **Effort:** **middel-groot**
- **Severity:** **M** — werkbaar als monolinguaal NL of monolinguaal EN; blokkeert echt-tweetalige tenant

### F-19 — LoginScreen + ProjectInfoSidebar volledig hardcoded NL

- **Belofte:** spec §15.1 "Labels en terminologie uit i18n-keys, nooit hardcoded strings"
- **Status:** **afwezig** — beide bestanden gebruiken nul `appLabel`/`t()`-aanroepen voor UI-tekst
- **Cross-link:** 01-spec-gap S-3 (220 ESLint-violations); fase 1 01-functioneel §11 + §18
- **Remediatie-klasse:** **config-shift** (sweep)
- **Effort:** **klein-middel** (per file paar uur)
- **Severity:** **L** voor NL-only-deployment; **M** zodra EN-tenant; **L** binnen tech_debt P4 sweep

---

## 7. Account-management — overig

### F-20 — Profiel-edit (naam, password change in app)

- **Belofte:** geen expliciete; impliciete verwachting van any SaaS-product
- **Status:** **afwezig** — geen profile-edit-UI (uit fase 1 01-functioneel §11)
- **Wat ontbreekt voor tweede tenant:** users moeten password-reset via mail-link doen; geen in-app wijziging
- **Remediatie-klasse:** **schema-uitbreiding** (UI + Supabase Auth-API-call)
- **Effort:** **klein**
- **Severity:** **L** — werkbare workaround (Supabase Auth password reset)

### F-21 — Logout op alle apparaten

- **Belofte:** geen
- **Status:** **afwezig**
- **Severity:** **L** — niet aangevraagd

### F-22 — MFA / 2FA / SSO

- **Belofte:** spec §10 "MFA optioneel Pro, verplicht Business+. SAML/SSO voor Enterprise."
- **Status:** **afwezig** — alleen email+wachtwoord
- **Wat ontbreekt voor tweede tenant:** niet voor fase-1-tenant; **wel** voor enterprise-tenant later
- **Remediatie-klasse:** **schema-uitbreiding** (Supabase Auth ondersteunt MFA out-of-box; activeren + UI)
- **Effort:** **klein** (MFA) tot **middel** (SSO/SAML)
- **Severity:** **L** voor fase 1; **M** voor fase 2 (Business+); **H** voor enterprise

---

## 8. Document-upload / RAG (Het Dossier)

### F-23 — Bestand verwijderen

- **Belofte:** impliciete verwachting
- **Status:** **half af** — `deleteDossierFile` aanwezig in service; UI-verificatie niet volledig (fase 1 01-functioneel §15 blinde vlek)
- **Severity:** **L** — werkt vermoedelijk, niet kritisch

### F-24 — Re-indexering bij bestand-wijziging

- **Status:** **afwezig** — geen mechanisme om bestaand chunk-set te invalideren bij re-upload
- **Severity:** **L** — werkbare workaround (delete + re-upload)

### F-25 — File-size-limiet, deduplicatie

- **Status:** dedup via DB-constraint (`UNIQUE(canvas_id, file_name)`); geen size-limiet zichtbaar in code
- **Severity:** **L**

### F-26 — Multi-canvas dossier

- **Belofte:** geen — fase 1 noteert "RAG is canvas-specifiek"
- **Status:** **afwezig** by design — Het Dossier is per-canvas
- **Wat ontbreekt voor tweede tenant:** als consultant 5 canvases heeft voor dezelfde klant en wil documenten herbruiken — moet 5× uploaden. Werkbaar maar inefficiënt.
- **Remediatie-klasse:** **schema-uitbreiding** (tenant-scoped dossier i.p.v. canvas-scoped)
- **Effort:** **groot**
- **Severity:** **L-M** — efficiency-issue

---

## 9. Onepager / Rapportage — capabilities

### F-27 — Geen canvas-brede onepager (alle blokken samen)

- **Belofte:** impliciet; klant verwacht "complete BTC-print"
- **Status:** **afwezig** — alleen Strategie OnePager + Richtlijnen OnePager apart
- **Wat ontbreekt voor tweede tenant:** afhankelijk van of tweede tenant alle 7 BTC-blokken gebruikt (cross-link F-1 t/m F-5)
- **Severity:** **L** binnen huidige scope; **M** indien volledige BTC

### F-28 — Geen native PDF / DOCX / XLSX / PPTX export

- **Belofte:** spec §9 (PDF, Gamma deck, PPTX) — zie 01-spec-gap S-29
- **Status:** **afwezig** — alleen `window.print()`
- **Severity:** **M** — relevant voor consultant-deliverable kwaliteit

### F-29 — Geen custom templates buiten 3 hardcoded (Strategie)

- **Belofte:** spec §6.1 + §9 (per content-pack export-templates)
- **Status:** **hardcoded** — `overview` / `swot` / `scorecard` voor Strategie; 1 fixed grid voor Richtlijnen
- **Wat ontbreekt voor tweede tenant:** geen template-keuze per tenant
- **Remediatie-klasse:** **per-tenant-content** (depends-on content-pack-architectuur)
- **Severity:** **L** binnen huidige scope; **M** voor white-label

---

## 10. Stub-blokken — generieke BlockPanel-functionaliteit

### F-30 — BlockPanel "Review"-tab

- **Belofte:** geen
- **Status:** **half af** — fase 1 01-functioneel §9 noteert: "Review-tab niet integraal gelezen — vermoedelijk insight-review/edit-flow"
- **Wat ontbreekt voor tweede tenant:** functionele beschrijving onvolledig; mogelijk niet verfijnd
- **Severity:** **L** — onbekend

### F-31 — Tips voor `portfolio` blok

- **Status:** fase 1 noteert "(?) afhankelijk van data" — `TIPS_DATA.nl.portfolio` mogelijk leeg
- **Severity:** **L**

---

## 11. Consistency Check + Tips + Multi-tab + Project Info Sidebar

Deze 4 features zijn **volwaardig** vandaag (fase 1 §16, §17, §19, §18). Geen functionele gap. Wel:
- **Consistency Check** is regel-gebaseerd (geen AI), 3 hardcoded issue-detectie-regels — uitbreidbaar maar niet acuut
- **Tips-modal** — content-attributie aan boek (cross-link 02-ip-gap IP-10, IP-15)
- **ProjectInfoSidebar** — alle veldnamen + opties hardcoded NL (cross-link F-19)

Geen aparte F-nummers — opgenomen in eerdere gaps.

---

## 12. Niet-functioneel maar functioneel-zichtbaar

### F-32 — Productie-`console.log` met user-data zichtbaar in browser-DevTools

- **Belofte:** spec §10 (geen PII in messages) + impliciete UX (gebruiker verwacht geen technische logs)
- **Status:** **bekend** — 5 specifieke locaties (cross-link 01-spec-gap S-41 + 05-tech-debt §3)
- **Severity:** **M** voor privacy, **L** voor functioneel

### F-33 — `App.test.js` faalt + Playwright uitgeschakeld + geen test-suite

- **Belofte:** spec §11.3 (Vitest, RLS-tests, Playwright)
- **Status:** **afwezig** — zie 01-spec-gap S-31, S-34
- **Severity:** **M** — geen functioneel risico vandaag, wel onderhoudbaarheid + governance

---

## 13. Cross-cutting functioneel-oordeel

### Tweede-tenant-readiness (samenvatting)

| Wat een tweede tenant minimaal nodig heeft | Status | Gap-ID |
|---|---|---|
| Eigen branding (logo + kleuren) | ✅ werkt (mits logo's geleverd) | F-13 |
| Eigen prompts / AI-stijl | ❌ niet mogelijk | F-15 |
| Eigen labels / terminologie | ❌ niet mogelijk | F-16 |
| Eigen voorbeeld-content | ❌ insurance-jargon hardcoded | F-17 |
| Self-service user-management | ❌ handmatig | F-9, F-11, F-14 |
| Kan eigen taal kiezen (NL/EN) | ⚠️ partieel — DB-driven labels niet vertaald | F-18 |
| Beheer eigen tenant-instellingen | ❌ geen tenant-admin UI | F-9 |
| Productieve werkbladen (alle blokken) | ⚠️ alleen Strategie + Richtlijnen | F-1 t/m F-5 |
| Consultant-niveau export | ❌ alleen browser-print | F-28 |
| Inzichten voor Richtlijnen | ❌ oude schema | F-8 |

**Conclusie:** een tweede tenant kan vandaag alleen functioneren als:
- Het accepteert KF-prompts (incl. KF-naam in AI-output) → IP-bezwaar
- Het werkt in NL of monolinguaal EN
- Het werkt alleen met Strategie + Richtlijnen-werkbladen
- Het accepteert browser-print als rapportage
- Kees handmatig de tenant aanmaakt + users koppelt + theme inricht

**Voor "betalend tweede tenant productief":** F-9, F-11, F-13, F-15 zijn minimaal nodig. F-1 t/m F-5 (BTC-blokken) en F-8 (Inzichten Richtlijnen) hangen af van wat de klant verwacht.

---

## Verificatie-paragraaf

### Wat ik heb gedaan voor compleetheid

- **Fase 1 01-functioneel.md integraal als baseline** — per van de 21 secties getoetst of er een functionele gap is t.o.v. de belofte/issue
- **`tech_debt.md` integraal gelezen** — open items per P-categorie cross-checked tegen functionele gaps
- **`INZICHTEN_DESIGN.md` referentie** — fase 1 noemt Output B (Rapportage); design-doc niet zelf opnieuw gelezen (vertrouwd op fase-1-vermelding)
- **Issues uit fase 1 verwerkt** — #56 (Output B), #70 (auto user_profiles), #71 (tenant-switcher), #73 (wit logo KF), #74 (Platform-logo), #75 (subdomein), #79 (tenant-admin UI)
- **"Tweede-tenant-readiness"-tabel** als concrete uitwerking van de "minimaal voor tweede tenant productief"-eis uit prompt
- **Cross-links naar 01-spec-gap en 02-ip-gap** waar functioneel-gap correlaat is met spec-gap of IP-gap

### Niet onderzocht en waarom

- **Werkelijke werking** van Magic Staff / RAG / pipeline-fases — fase 1 heeft dit gedocumenteerd; ik heb niet zelf de feature getest
- **GitHub-Issue-bodies** — alleen titels via fase 1 vermeld; bodies kunnen gedetailleerde acceptance criteria bevatten die mijn gap-analyse zouden verfijnen
- **`INZICHTEN_DESIGN.md`-volledige inhoud** — alleen via fase-1-vermelding gebruikt; eigen lezing zou Output-B-design specifieker maken (maar zou ook scope-creep zijn — design-uitwerking hoort niet in gap-analyse)
- **`parking-lot.md`** — fase 1 05-tech-debt §1 verwijst kort; niet alle items in deze functioneel-gap opgenomen (zou parsing-werk zijn zonder duidelijke nieuwe gap)
- **Werkelijke productie-gebruik-statistieken** — niet beschikbaar; geen analytics (cross-link 01-spec-gap S-40)
- **Effort-categorieën zijn grof** — geen werkelijke schatting; "klein/middel/groot" als richting

### Verificatie-steekproeven (3 willekeurige bevindingen)

1. **F-1 t/m F-5: 5 stub-werkbladen** — fase 1 01-functioneel §1 toont BLOCKS-tabel met 7 entries waarvan 2 hebben werkbladen (`strategy`, `principles`); 5 entries (`customers`, `processes`, `people`, `technology`, `portfolio`) hebben "**ontbreekt** (stub)" status. ✅
2. **F-8 Richtlijnen-Inzichten oude schema** — fase 1 01-functioneel §3 noteert: "Bevat eigen 'Analyseer richtlijnen'-knop binnen de overlay (redundant met werkblad-knop sinds Sprint C — beide triggeren `handleAnalyze`)" en "Toont `recommendations` uit `guideline_analysis` in oude format `{type, title, text}` — niet het Sprint-A Inzichten-schema". ✅
3. **F-15 prompts global** — fase 1 03-namen-en-termen §1 Laag 2b explicit: "Belangrijk: `app_config` is NIET tenant-scoped — global voor alle tenants. Wijzigingen via Admin-UI (`/admin`) gelden direct voor elke tenant." ✅

### Bekende blinde vlekken

- **Effort-schattingen zijn gevoelsmatig** — een echte sprint-planner zou per gap technical-design + estimation moeten doen. "Klein/middel/groot" geeft richting maar geen precisie
- **Severity per gap is gemeten op "tweede tenant productief"-meetlat** — andere meetlat (bv. "schaalbaar naar 10+ tenants") zou andere severity geven
- **Sommige gaps zijn deels in tech_debt (bv. F-15 = S-1)** — bewust dubbel-genoteerd voor leesbaarheid; in 00-index-prioritering wordt dit één rij
- **Functionele gaps die ik mogelijk gemist heb:** features die fase 1 niet expliciet als "ontbreekt" markeerde maar waar verwachting ongelijk is aan werkelijkheid (bv. uitgebreidere admin-functionaliteit, dashboard met team-zicht, etc.) — niet uitputtend gescand
- **Performance / schaal** — niet gemeten; mogelijk functionele gaps bij grote canvas-aantallen of grote dossier-sets niet zichtbaar in fase 1
