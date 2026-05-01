# 00 — Index

**Audit-datum:** 2026-05-01
**Branch:** `audit/2026-05-01`
**Uitgevoerd door:** Claude Code CLI (de bouwer) — als feitelijke as-is documentatie
**Doel:** vijf-documenten foto van de codebase op dit moment. Geen oordeel, geen aanbevelingen, geen wijzigingen aan code. Input voor drie vervolgaudits: gap-analyse t.o.v. architecture-spec, IP-toets methode-onafhankelijkheid, strategische heroriëntatie.

---

## Documenten in deze audit

### `01-functioneel.md` — Functionele inventarisatie (629 regels)

Wat het platform vandaag kan, vanuit gebruikers-perspectief. 21 secties: dashboard, Strategie- en Richtlijnen-werkbladen (volwaardig), 4 stub-blokken (Klanten / Processen / Technologie / Portfolio), BlockPanel, OnePagers (Strategie 3 templates + Richtlijnen 2×2 grid), authenticatie + multi-tenancy, theming, admin-functionaliteit (alleen `app_config`-editor), document-upload + RAG (Het Dossier), consistency-check, tips, project-info, multi-tab, talen, autosave.

### `02-architectuur.md` — Architecturale inventarisatie (552 regels)

Hoe het technisch is gebouwd. React 19 + CRA 5 + Tailwind 3.4 (geen TS, Husky, Prettier). Vercel serverless API (8 endpoints) + Supabase (PostgreSQL + RLS + Auth + pgvector). Claude Sonnet 4.5 / Haiku 4.5 + OpenAI embeddings. Multi-tenancy via `current_tenant_id()`-RLS-helper. Theming via 10 CSS-variabelen uit `tenants.theme_config`. Deploy via `deploy-prod.sh` (3 stappen: git push, vercel --prod, alias re-pin). Tooling: ESLint `react/jsx-no-literals` op warn-level. Compliance §4.1, 4.3, 4.5 ✅; 4.2, 4.4 ❌.

### `03-namen-en-termen.md` — Naam- en termen-inventarisatie (549 regels)

Drie-laagse classificatie (hardcoded / configureerbaar / docs) per term. **Kingfisher / Kingfisher & Partners**: 54 hardcoded voorkomens (file-headers, login, OnePagers, ErrorBoundary, fallbacks, prompts, RLS-policies, deploy-script, tests). **BTC / Business Transformation Canvas**: 28+ hardcoded. **Auteurs Beijen/Heetebrij/Tigchelaar**: 6 vermeldingen. **Novius**: alleen live-DB in `prompt.strategy.analysis` — niet in migraties (audit-trail-gat). **Klant-cases**: TLB/MAG/ACE/Spain/Santander/GTS in dood code (`src/prompts/btcPrompts.js`). **Branche-jargon**: HNW, wealth, insurance, LifePro, DIFC, VNB in `BlockCard.jsx EXAMPLE_BULLETS` + `api/magic.js SYSTEM_HEAVY` + live-DB. **Privé-data**: e-mail Kees in test-bestand, werkelijke Auth UUIDs in seed-migratie.

### `04-prompts.md` — AI-prompts inventarisatie (1280 regels — langste document)

Alle prompts integraal opgenomen. Drie bronnen: A) 19 live `app_config` prompts (Supabase MCP-query), B) 13 hardcoded fallbacks in `api/*.js`, C) 7 dood-code prompts in `src/prompts/btcPrompts.js`. Per prompt 4 flags: METHODE / AUTEURS / BRANCHE / KLANT. **8 prompts hebben methode-claims** (BTC, BSC, Novius, BHAG, Stop/Start/Continue, SWOT, SMART). **4 actieve productie-prompts bevatten "Kingfisher & Partners"** in AI-rol-definitie. **1 expliciete branche-claim**: `prompt.magic.system_heavy` zegt "financiële en verzekeringssector". **4 code↔DB-discrepanties** vastgelegd. **3 prompts hebben geen DB-override** (alleen hardcoded).

### `05-tech-debt-aanvulling.md` — Tech debt aanvulling (436 regels)

Items die níet in `tech_debt.md` staan: 26 nieuwe bevindingen geclassificeerd in 11 categorieën (productie-logs, dood code, doc-drift, privacy, audit-trail, schema-drift, API-rommel, security, manifest, naam-mismatch, spec-schending, i18n, prompts, code-smell, RLS). 0 TODO/FIXME/HACK-markers gevonden (positief signaal). 5 productie-`console.log` met user-data lekken. 5 dood-code-bestanden gekarteerd. CLAUDE.md sectie 4 compliance status volledig overgenomen.

---

## Sectie A — Opgemerkt-tijdens-audit

Bugs, security-issues, broken features en duidelijke fouten die tijdens de scan zijn opgemerkt. Korte beschrijving + locatie. **Geen oplossingen** — die komen later in een aparte sessie. Dit blok is bewust feitelijk en niet-prioriterend.

### A.1 — Functionele kapot/half af

| # | Item | Locatie |
|---|---|---|
| 1 | `App.test.js` test faalt — zoekt naar "learn react"-tekst die niet meer bestaat in de werkelijke `<App>` (CRA-boilerplate niet aangepast) | `src/App.test.js:5` |
| 2 | Richtlijnen-werkblad heeft niet de Sprint-A/B Inzichten-refactor doorgevoerd; advies-overlay is nog inline JSX op oude `recommendations[]`-schema (geen `category`/`source_refs`) — alleen Sprint-C werkblad-shell is gemigreerd | `src/features/richtlijnen/RichtlijnenWerkblad.jsx:818-841` |
| 3 | `api/extract.js` heeft geen system-prompt en is mogelijk dood-endpoint (geen UI-aanroep gevonden) | `api/extract.js` |
| 4 | `prompt.strategy.samenvatting`-key ontbreekt in `app_config`; `generateSamenvatting` valt altijd terug op hardcoded prompt | DB ↔ `api/strategy.js:303-313` |
| 5 | `linkThemes` in `api/guidelines.js` heeft geen `systemOverride`-parameter — niet aanpasbaar via Admin-UI | `api/guidelines.js:200-210` |
| 6 | `SYSTEM_GENERAL_KNOWLEDGE` in `api/magic.js` heeft geen DB-key — niet aanpasbaar via Admin-UI | `api/magic.js:25-35` |

### A.2 — Security / privacy-leaks

| # | Item | Locatie |
|---|---|---|
| 7 | `api/_auth.js` dev-bypass: bij ontbrekende env-vars retourneert middleware fake user `{ id: "dev", email: "dev@local" }` — alle requests zouden bypassen. Mitigatie via Vercel-env-vars maar blijft risico bij misconfig | `api/_auth.js:29-33` |
| 8 | Privé-mail Kees (`smaling.kingfisher@icloud.com`) hardcoded in test-bestand in publieke repo-history | `tests/example.spec.js:14, 33` |
| 9 | Werkelijke Auth-UUID Kees (`5d76d65e-...`) hardcoded in seed-migratie | `supabase/migrations/20260424070000:87` |
| 10 | 5× productie-`console.log` met user-data (canvas-content, autosave-data, embedding-stats) — gaat letterlijk naar browser-console / Vercel-runtime-logs | `canvas.service.js:48,64,98`, `embedding.service.js:156`, `api/magic.js:65` |
| 11 | RLS-policy hardcodet e-mailadres i.p.v. rol-check (`auth.email() = 'smaling.kingfisher@icloud.com'`) | `supabase/migrations/20260420150000:10-11` |
| 12 | Eerdere admin-mail (`keessmaling@gmail.com`) staat nog in een oudere migratie — niet in productie maar in versie-historiek zichtbaar | `supabase/migrations/20260420140000:9-10` |
| 13 | Klant-PPTX in `tests/assets/` — bestandsnaam `Work in progress BTP MAG Final Version-1.pptx` toont klant-context (MAG = klant-acroniem, BTP = projectcode) zonder dat bestand zelf hoeft te worden geïnspecteerd. Vergelijkbare bestanden mogelijk aanwezig — niet uitputtend gescand in deze pass. | `tests/assets/` |

### A.3 — Audit-trail-gaten (productie ≠ versie-controle)

| # | Item | Locatie |
|---|---|---|
| 14 | Live `prompt.strategy.analysis` bevat letterlijk `Je bent gespecialiseerd in het Business Transformatie Canvas en Novius model.` — deze claim staat **niet** in migratie `20260425000000_inzichten_sprint_a.sql`. Handmatig aangepast via Admin-UI of direct SQL UPDATE buiten migraties om | DB live ↔ migratie |
| 15 | `prompt.strategy.analysis` code-versie heeft BEKNOPTHEID-instructies (max 80/60 woorden) die DB-versie mist | `api/strategy.js:230-273` ↔ DB |
| 16 | `prompt.magic.system_standard` DB-versie heeft markdown-opmaak-regel die code-fallback mist | DB ↔ `api/magic.js:14-23` |
| 17 | `prompt.validate` code heeft uitgebreide CRITERIA-PER-BLOK sectie die DB-versie mist | `api/validate.js:7-40` ↔ DB |

### A.4 — Schema-drift / inconsistenties DB ↔ code

| # | Item | Locatie |
|---|---|---|
| 18 | `block_definitions` keys (`guidelines`, `roadmap`) komen niet overeen met `BLOCKS`-array keys (`principles`, `portfolio`) | DB ↔ `BlockCard.jsx` |
| 19 | `block_definitions` tabel bestaat live, gebruikt door admin (4e tab "Blok Titels"), maar staat niet in `DATABASE.md` | DB ↔ `DATABASE.md` |
| 20 | `DATABASE.md` (gedateerd 2026-04-22) mist multi-tenancy (`tenants`, `user_profiles`, RLS-helpers, `canvases.tenant_id`) en `strategy_core.insights`-kolom (Sprint A) | `DATABASE.md` |
| 21 | `strategy_core.analysis`-kolom is niet gedropt na Sprint A — dode JSONB-kolom; UI-code leest alleen nog uit `insights` | DB |
| 22 | `schema.sql` is 0 bytes, staat in repo én in `.gitignore` (inconsistent) | repo-root + `.gitignore` |

### A.5 — API-rommel / model-inconsistenties

| # | Item | Locatie |
|---|---|---|
| 23 | Twee Sonnet-model-aliases gemengd in productie: `claude-sonnet-4-5` (strategy, guidelines, magic.heavy) ↔ `claude-sonnet-4-20250514` (extract, validate) | `api/*.js` |
| 24 | `api/validate.js` comment-header zegt "Gebruikt claude-haiku voor snelle, goedkope pre-flight check" maar code gebruikt feitelijk `claude-sonnet-4-20250514` | `api/validate.js:4 vs 61` |

### A.6 — Documentatie / metadata-drift

| # | Item | Locatie |
|---|---|---|
| 25 | `README.md` is CRA-default boilerplate — nooit aangepast naar project-info | `README.md` |
| 26 | `public/manifest.json` heeft `"name": "Create React App Sample"`, `"short_name": "React App"` — nooit aangepast | `public/manifest.json` |
| 27 | `package.json` bevat alleen minimaal `name: "btc-tool"`, geen `description`, `repository`, `author`, `license`, `engines` | `package.json` |
| 28 | Drie product-name bronnen actief tegelijk: `<title>Strategy Platform</title>` / `appLabel("app.title")="Business Transformation Canvas"` / `theme_config.product_name="Strategy Platform"` | `public/index.html`, `app_config`, `tenants` |

### A.7 — Dood code

| # | Item | Locatie |
|---|---|---|
| 29 | `src/prompts/btcPrompts.js` (323 regels) — niet meer geïmporteerd in `src/` of `api/`. Bevat 6 klant-namen + insurance-jargon | `src/prompts/btcPrompts.js` |
| 30 | 3 backwards-compat barrels niet meer gebruikt: `authContext.js`, `supabaseClient.js`, `btcValidator.js` | `src/services/` |

### A.8 — UX/i18n-mismatch

| # | Item | Locatie |
|---|---|---|
| 31 | Taal-toggle (`useLang().lang`/`t()`) en DB-driven `appLabel`-labels niet gesynced — bij switch naar EN blijven alle DB-driven labels in NL — gemengde-taal-UX | `i18n.js` ↔ `app_config` |
| 32 | `LoginScreen.js` is volledig hardcoded NL (geen `t()` of `appLabel`-aanroepen) | `src/LoginScreen.js` |
| 33 | `ProjectInfoSidebar.jsx` gebruikt geen `appLabel` — hardcoded NL voor alle veldnamen, opties en placeholder-teksten | `src/features/canvas/components/ProjectInfoSidebar.jsx` |

### A.9 — Spec-schendingen

| # | Item | Locatie |
|---|---|---|
| 34 | `docs/architecture-spec.md` regel 69 schrijft voor: "De naam van de initiële launch customer mag nergens in de codebase voorkomen ... Hetzelfde voor branche-specifieke termen (verzekering, financial services)". Deze regel wordt nu **actief geschonden** door: `BlockCard.jsx EXAMPLE_BULLETS` (HNW/wealth/LifePro), `api/magic.js SYSTEM_HEAVY` ("financiële en verzekeringssector"), live `prompt.magic.system_heavy` (idem), en 54+ Kingfisher-vermeldingen door de codebase | meerdere |

### A.10 — Code-smell

| # | Item | Locatie |
|---|---|---|
| 35 | Typo `ambtieuzer` (moet `ambitieuzer`) in live `prompt.improve.inspirerender` én in code-fallback | `api/improve.js:9` + DB |
| 36 | Inline overlay in Richtlijnen-werkblad heeft eigen "Analyseer richtlijnen"-knop die hetzelfde `handleAnalyze` triggert als werkblad-shell — redundant sinds Sprint C | `src/features/richtlijnen/RichtlijnenWerkblad.jsx:830` |

---

## Sectie B — Observaties voor latere fase

Ideeën, structurele opmerkingen, design-vragen die tijdens scannen opkwamen. **Niet in de inventarisatie zelf** — hier geparkeerd voor latere beoordeling. Geen prioriteit.

### B.1 — Strategische gaten

- **4 BTC-blokken zijn stub** (Klanten / Processen / Technologie / Portfolio). De waarde-propositie van het platform is nu sterk Strategie + Richtlijnen-georiënteerd; pijler-werkbladen zijn 4/6 leeg.
- **Klant-cases TLB/MAG/ACE/Spain/Santander/GTS** zitten in dood code (`btcPrompts.js`). Risico op terugkeer in productie als `BLOCK_PROMPTS` ooit opnieuw wordt geïmporteerd. Dood-bestand bevat ook `Marc Beijen`-attributie als methode-uitvinder.
- **`prompt.strategy.analysis` claimt expertise in Novius-model**. Novius is een **separate transformatie-methode** (van Novius BV). Of dit een bewuste positionering is voor "we kunnen meerdere methodes" of een artefact van eerdere klant-conversatie is niet uit code-evidentie te bepalen.

### B.2 — Multi-tenancy beperkingen

- **`app_config` is global, niet tenant-scoped.** Alle prompts en labels zijn voor alle tenants identiek. Theming + brand-name zijn wél per tenant; AI-gedrag en UI-tekst niet.
- **Geen tenant-admin UI.** Alle config-wijzigingen lopen via één globale Admin-pagina met email-RLS. Tenant-admins kunnen niet eigen labels/prompts beheren.
- **Geen audit-log op `app_config`.** Wijzigingen zijn onomkeerbaar zonder externe backup. Zie A.3 voor concrete drift-gevallen.

### B.3 — Single-contributor risico

- Git-author-historiek toont één enkele contributor (`KFSmaling`). Geen bus-factor. Code-review-flow niet zichtbaar in repo (`.github/`-workflows draaien alleen migraties + disabled Playwright; geen pull-request-templates of CODEOWNERS).

### B.4 — RLS-design

- Admin-policy gebruikt hardcoded e-mailadres (`auth.email() = 'smaling.kingfisher@icloud.com'`) in plaats van rol-gebaseerd model (`current_user_role() = 'platform_admin'`). De helper-functie bestaat al; admin-policy is niet gemigreerd naar dat patroon.

### B.5 — Account-management gaten

- Auto-aanmaak `user_profiles` bij signup ontbreekt (Issue #70 open) — handmatig in Supabase Dashboard bij elke nieuwe gebruiker.
- Geen profiel-edit (naam, password change) in app.
- Geen tenant-switcher voor `platform_admin` (Issue #71).

### B.6 — i18n-architectuur incompleet

- Twee parallelle systemen: `useLang()`+`t()` (TRANSLATIONS-object) en `useAppConfig().label()` (DB-driven `appLabel`). Bij taal-switch wordt alleen `t()`-set gewijzigd; `appLabel`-set blijft monolinguaal. Vereist herontwerp om DB-driven labels per-locale te ondersteunen.

### B.7 — Production logging

- 5 productie-`console.log` met user-data (canvas-content, autosave). Geen structurele observability-laag (Sentry, LogRocket, etc.) gedetecteerd. Bij issue-debugging in productie moet je via Vercel-logs zoeken — verwacht is een persistent log-aggregator.

### B.8 — Dood code als signaal

- `App.test.js`, `schema.sql`, 3 backwards-compat barrels en `btcPrompts.js` zijn allemaal historische resten. Suggesteert dat de codebase niet eerder een opruim-pass heeft gehad. Per `tech_debt.md` is dat ook nooit geprioriteerd.

### B.9 — Onepagers vs. Inzichten-overlay

- Document A toont dat Strategie- en Richtlijnen-OnePager andere code-paden gebruiken dan de Inzichten-overlay (Sprint A/B). Dit is "Output A" (huidige rapport via `window.print()`) vs. "Output B" (toekomstige rapport-redesign per `INZICHTEN_DESIGN.md`). Zolang Output B niet bestaat, levert het platform twee parallelle rapportage-flows: Inzichten-overlay (consumeren in app) en OnePager (printen).

---

## Sectie C — Globale verificatie

### Wat ik niet heb onderzocht en waarom

- **`auth.users`-tabel content** — niet gequeried om privacy-redenen; identifiers staan al in seed-migraties dus geen extra signaal verwacht.
- **`canvases`/`document_chunks`/`strategy_core` user-data** — buiten audit-scope (gebruikersinhoud, niet platform-identiteit).
- **Git-history vóór 2026-04** — repo-history begint 2026-04-09 (commit `6833430` "Add BTC Tool v1 - Kingfisher huisstijl"); geen pre-2026 commits beschikbaar.
- **Vercel-side env-vars en runtime-logs** — niet via Vercel-API gevalideerd, alleen via deploy-script-output afgeleid.
- **Custom domains buiten Vercel-defaults** — niet via Vercel-API gevalideerd.
- **`tests/assets/` werkelijke bestanden** — bestandsnaam wijst op klant-PPTX (`Work in progress BTP MAG Final Version-1.pptx`); niet zelf geïnspecteerd of het in git zit. → bestandsnaam zelf opgenomen in A.2 #13.
- **GitHub Issue-bodies en PR-comments** — alleen titel-overzicht via `gh issue list`. Issue-bodies kunnen klant-namen of branche-context bevatten.
- **Volledige reads van alle API-endpoints** — `api/strategy.js`, `api/_auth.js`, `api/magic.js`, `api/improve.js`, `api/guidelines.js`, `api/validate.js`, `api/extract.js` integraal gelezen. `api/embed.js` (top 25), `api/parse.js` (top 10) niet integraal — geen prompt-content verwacht.
- **`node_modules/`** — uit principe niet gescand.
- **Migratie-content uitputtend op alle prompt-seeds** — alleen `20260425000000_inzichten_sprint_a.sql` geverifieerd op afwezigheid van Novius-string. Andere migraties niet uitputtend gediff'd tegen live-DB.
- **Welke migratie `block_definitions`-tabel aanmaakt** — niet getraceerd; tabel bestaat live maar geen specifieke `*_block_definitions.sql` gevonden.
- **`npm test` werkelijke uitvoering** — niet uitgevoerd; afgeleid uit code-inspectie dat `App.test.js` zal falen.
- **Sentry / observability-tooling** — geen geconfigureerd dat zichtbaar was; niet expliciet bevestigd op afwezigheid.
- **Branch-naamgeving op alle remotes** — alleen `origin` gechecked.

### Methoden gebruikt

- **Volledige reads** van: 30+ source-bestanden (App, LoginScreen, beide Werkbladen, AdminPage, ErrorBoundary, beide OnePagers, prompts/btcPrompts, alle CSS, alle config-bestanden, alle docs)
- **Grep-passes** voor 30+ termen + 10 verschillende patroon-categorieën (TODO/FIXME, console.log, brand-mentions, persoonsnamen, klant-cases, branche-jargon, etc.)
- **Live Supabase MCP-queries** op project `lsaljhnxclldlyocunqf`: `app_config` (volledige prompts), `tenants` (volledige theme_config), `block_definitions`, `information_schema.tables`
- **Git-log laatste 6 maanden** voor commit-messages, branch-namen, contributor-historiek
- **Cross-document referenties** binnen audit zelf voor consistentie

### Tijdsinvestering

Audit uitgevoerd in één doorlopende sessie op 2026-05-01. Per document expliciete commits op `audit/2026-05-01`-branch:
- `9bb2f35` document B
- `edb5358` document A
- `7fad653` document C
- `184c747` document D
- `05124ee` document E
- _(deze commit)_ document 00

Branch is **niet gemerged naar master** — wacht op review en eventuele aanpassingen voor merge.

### Beperkingen

- **Cross-cutting blinde vlek**: dit is één-pass-audit. Items die in twee documenten andere classificaties zouden krijgen zijn niet uitputtend gekruist (bv. een item dat zowel "branche-claim" als "audit-trail-gat" is staat in beide documenten — daar is wel naar verwezen).
- **Subjectiviteit in twijfelgevallen**: ondanks "documenteer met vraagteken" is er onvermijdelijk eigen-oordeel ingeslopen bij wat als methode-claim, branche-aanname, of klant-specifiek wordt geclassificeerd. Vraagtekens zijn consequent toegepast bij `7·3·3 Regel`, `Stip op de Horizon`, `Strategische Thema's`, `WOL`/`LifePro`/`DIFC`/`APE` en andere onduidelijke termen.
- **Geen verdiepende interview**: alle conclusies zijn uit code/docs/live-DB afgeleid. Sommige bevindingen (bv. "is `api/extract.js` dood?") kunnen door context die alleen mensen kennen anders zijn.
- **MCP-tool dependency**: live-DB-bevindingen hangen af van toegang tot project `lsaljhnxclldlyocunqf` via Supabase MCP. Zonder toegang waren delen van document C en D niet mogelijk geweest.

---

## Geen wijzigingen aan code

Per audit-prompt: **deze audit heeft geen code-wijzigingen geproduceerd**. Alleen documentatie in `docs/audit/2026-05-01/`. De `audit/2026-05-01`-branch is een schone aftakking van master; alle commits zijn `audit(2026-05-01): document X — ...`-commits op deze branch.

Items uit dit document worden later in aparte sessies behandeld:
- "Opgemerkt-tijdens-audit"-items (sectie A) → eventueel issues / `tech_debt.md`-uitbreidingen
- "Observaties voor latere fase"-items (sectie B) → input voor strategische heroriëntatie
- Vervolgaudits: gap-analyse t.o.v. architecture-spec, IP-toets methode-onafhankelijkheid

---

## Vervolgvragen voor reviewer

(Geen onderdeel van het audit-mandaat; opgenomen omdat ze tijdens scannen opkwamen en kunnen helpen bij vervolgstappen.)

1. Is de Novius-claim in `prompt.strategy.analysis` bewust toegevoegd, of een artefact van een klant-conversatie? Als laatste: hoe willen we admin-edits in productie auditen?
2. Welke status heeft `api/extract.js` — dood-endpoint of toekomst-feature?
3. Mogen `src/prompts/btcPrompts.js`, `schema.sql`, en de drie backwards-compat barrels worden verwijderd?
4. Klant-PPTX onder `tests/assets/` — bedoeld als test-asset of historische rest?
5. Welke prioriteit krijgen de 4 stub-werkbladen (Klanten / Processen / Technologie / Portfolio)?
