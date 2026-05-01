# 03 — Naam- en termen-inventarisatie

**Audit-datum:** 2026-05-01
**Branch:** `audit/2026-05-01`
**Doel:** waar komen merk-, methode- en context-specifieke namen voor in de codebase?
**Classificatie per voorkomen:**
1. **Hardcoded** — staat in code (JSX, JS, comment, string-literal, alt-tekst, etc.), niet via configuratie aanpasbaar
2. **Configureerbaar per tenant** — staat in `app_config`, `theme_config`, of vergelijkbaar tenant-aanpasbaar veld
3. **Documentatie / metadata** — staat in `README.md`, `CLAUDE.md`, repo-naam, package.json, branch-namen, commit-messages

**Privacy-disclaimer:** persoonsnamen (incl. Kees Smaling, Marc Beijen, ex-collega's) staan integraal vermeld per Kees-instructie ("dit lees alleen ik"). Dit document moet niet publiek worden.

---

## 1. "Kingfisher" / "Kingfisher & Partners" / "KF" / `kingfisher.nl`

### Laag 1 — Hardcoded

| # | Locatie | Context |
|---|---|---|
| 1 | `src/index.css:20` | `--brand-name: Kingfisher;` — CSS-default voor `--brand-name` (gebruikt door `LogoBrand` als image-fallback) |
| 2 | `src/i18n.js:3` | comment `Kingfisher BTC Tool — April 2026` (file-header) |
| 3 | `src/LoginScreen.js:101` | hardcoded JSX-tekst `Kingfisher &amp; Partners — intern gebruik` (login-disclaimer, geen `appLabel`) |
| 4 | `src/LoginScreen.js:130` | input placeholder `naam@kingfisher.nl` (e-mail-veld op login) |
| 5 | `src/LoginScreen.js:207` | hardcoded JSX-tekst `Kingfisher &amp; Partners · Vertrouwelijk` (login-footer) |
| 6 | `src/App.js:279` | fallback in `appLabel("footer.tagline", "Kingfisher & Partners · From strategy to execution")` — DB-waarde wint, fallback is hardcoded |
| 7 | `src/features/admin/AdminPage.jsx:317` | `DEFAULT_LABELS` array entry voor `label.footer.tagline` met value `Kingfisher & Partners · From strategy to execution` (synthetisch label, gevuld als DB-rij ontbreekt) |
| 8 | `src/features/strategie/StrategyOnePager.jsx:62` | inline JSX-style: `<div ...>Kingfisher &amp; Partners</div>` — header van OnePager-print |
| 9 | `src/features/strategie/StrategyOnePager.jsx:77` | inline JSX-style: `Kingfisher &amp; Partners — Vertrouwelijk` — footer van OnePager-print |
| 10 | `src/features/richtlijnen/GuidelinesOnePager.jsx:3` | comment `Kingfisher & Partners — April 2026` (file-header) |
| 11 | `src/features/richtlijnen/GuidelinesOnePager.jsx:192` | hardcoded JSX-tekst `Kingfisher & Partners · Richtlijnen & Leidende Principes` (footer van Onepager-print) |
| 12 | `src/features/richtlijnen/RichtlijnenWerkblad.jsx:3` | comment `Kingfisher & Partners — April 2026` (file-header) |
| 13 | `src/shared/context/AppConfigContext.jsx:21` | `LABEL_FALLBACKS` entry: `"footer.tagline": "Kingfisher & Partners · From strategy to execution"` |
| 14 | `src/features/canvas/hooks/useCanvasState.js:190` | BroadcastChannel-naam `kingfisher_btc` (multi-tab detectie) — technische identifier, niet user-facing |
| 15 | `src/shared/utils/btcValidator.js:3` | comment `Kingfisher & Partners — April 2026` (file-header) |
| 16 | `src/shared/components/ErrorBoundary.jsx:5` | comment `Toont een Kingfisher-huisstijl fallback met hersteloptie` |
| 17 | `src/shared/components/ErrorBoundary.jsx:68` | hardcoded JSX-tekst `Kingfisher & Partners · Business Transformation Canvas` (error-state footer) |
| 18 | `src/shared/hooks/useTheme.js:6` | comment `Geeft logo-URL's, merknaam en kleuren terug met Kingfisher-defaults` |
| 19 | `src/shared/hooks/useTheme.js:20` | JS-default: `brandName: tenantTheme?.brand_name ?? "Kingfisher & Partners"` (fallback in hook-resolver) |
| 20 | `src/shared/services/apiClient.js:3` | comment `Kingfisher & Partners — April 2026` (file-header) |
| 21 | `api/strategy.js:3` | comment `Kingfisher & Partners — April 2026` (file-header) |
| 22 | `api/parse.js:3` | comment `Kingfisher & Partners — April 2026` (file-header) |
| 23 | `api/embed.js:3` | comment `Kingfisher & Partners — April 2026` (file-header) |
| 24 | `api/_auth.js:3` | comment `Kingfisher & Partners — April 2026` (file-header) |
| 25 | `api/improve.js:31` | hardcoded prompt-tekst (server-side fallback): `Je bent een senior strategie-consultant bij Kingfisher & Partners die teksten voor het Business Transformatie Canvas verfijnt.` |
| 26 | `api/magic.js:37` | hardcoded prompt-tekst (`SYSTEM_HEAVY` constant): `Je bent een Senior Strategie Consultant op McKinsey/BCG-niveau, gespecialiseerd in business transformatie voor de financiële en verzekeringssector bij Kingfisher & Partners.` |
| 27 | `src/prompts/btcPrompts.js:2` | comment `btcPrompts.js — Kingfisher & Partners` |
| 28 | `src/prompts/btcPrompts.js:9-10` | hardcoded prompt-tekst: `You are a senior business transformation consultant at Kingfisher & Partners, expert in the Business Transformation Canvas (BTC) developed by Marc Beijen.` |
| 29 | `src/prompts/btcPrompts.js:12` | hardcoded prompt-tekst: `Core Kingfisher principles you always apply:` |
| 30 | `src/prompts/btcPrompts.js:54` | comment in prompt: `QUALITY CRITERIA (from real Kingfisher cases):` |
| 31 | `src/prompts/btcPrompts.js:142` | hardcoded prompt-tekst: `Examples from real Kingfisher cases (Spain, TLB, MAG):` |
| 32 | `src/prompts/btcPrompts.js:180` | hardcoded prompt-tekst: `Examples from real Kingfisher cases:` |
| 33 | `src/prompts/btcPrompts.js:220` | hardcoded prompt-tekst: `Examples from real Kingfisher cases (TLB, MAG, ACE):` |
| 34 | `src/prompts/btcPrompts.js:260` | hardcoded prompt-tekst: `Examples from real Kingfisher cases (TLB, ACE, MAG, Spain):` |
| 35 | `src/prompts/btcPrompts.js:300` | hardcoded prompt-tekst: `Examples from real Kingfisher cases (ACE, TLB, MAG):` |
| 36 | `tests/example.spec.js:11` | hardcoded URL `https://kingfisher-btcprod.vercel.app/` in Playwright-test |
| 37 | `tests/example.spec.js:12-33` | input-placeholder-locator `naam@kingfisher.nl` (12× hits in 1 test) |
| 38 | `tests/example.spec.js:14, 33` | input-fill-string `smaling.kingfisher@icloud.como` (typo) en `smaling.kingfisher@icloud.com` (Kees' privé-mail in test-data!) |
| 39 | `tests/example.spec.js:134` | DOM-locator filter `Kingfisher & PartnersStrategie OverzichtCanvas 21 apr 2026Business` (composiet-tekst) |
| 40 | `deploy-prod.sh:7-8, 45-51` | URLs `kingfisher-btc-tool.vercel.app`, `kingfisher-btcprod.vercel.app` |
| 41 | `supabase/migrations/20260101000000_sprint_1_initial_schema.sql:3` | comment `Business Transformation Canvas — Kingfisher & Partners` |
| 42 | `supabase/migrations/20260420150000_fix_admin_email.sql:10-11` | RLS-policy hardcoded: `auth.email() = 'smaling.kingfisher@icloud.com'` |
| 43 | `supabase/migrations/20260420140000_sprint_4d_seed_prompts.sql:9-10` | RLS-policy hardcoded: `auth.email() = 'keessmaling@gmail.com'` (eerdere admin-mail, vóór correctie 20260420150000) |
| 44 | `supabase/migrations/20260420140000_sprint_4d_seed_prompts.sql:27` | seed-tekst voor `prompt.magic.system_heavy` (zie `api/magic.js:37`) |
| 45 | `supabase/migrations/20260421090000_seed_labels.sql:8` | seed: `('label.footer.tagline', 'label', 'Voettekst onderaan het canvas', 'Kingfisher & Partners · From strategy to execution')` |
| 46 | `supabase/migrations/20260421110000_add_samenvatting_seed_all_labels.sql:18` | idem (re-seed in latere migratie) |
| 47 | `supabase/migrations/20260424070000_seed_initial_tenants_and_profiles.sql:31` | comment in rollback-instructie: `DELETE FROM tenants WHERE slug IN ('platform', 'kingfisher')` |
| 48 | `supabase/migrations/20260424070000_seed_initial_tenants_and_profiles.sql:73-74` | INSERT-tenant: `'Kingfisher', 'kingfisher'` (name + slug) |
| 49 | `supabase/migrations/20260424070000_seed_initial_tenants_and_profiles.sql:88` | comment `Kees Holding tenant` (eigenlijk tenant slug=`platform`, niet Kees Holding — historische naam) |
| 50 | `supabase/migrations/20260424070000_seed_initial_tenants_and_profiles.sql:93` | comment `Placeholder voor Account 2 (Gmail, tenant_admin op Kingfisher)` |
| 51 | `supabase/migrations/20260424070000_seed_initial_tenants_and_profiles.sql:104` | comment `Kingfisher tenant` |
| 52 | `public/kf-logo.png` | logo-bestand (file-naam) — zie `theme_config.logo_url` voor Kingfisher tenant |
| 53 | git-author metadata | `KFSmaling <smaling.kingfisher@icloud.com>` — alle commits in laatste 6 maanden |
| 54 | git-commit messages | `feat: Strategy Deep Dive`, `Add Kingfisher logo to header` (commit `4d72bd3` 2026-04-10), `Add BTC Tool v1 - Kingfisher huisstijl` (commit `6833430` 2026-04-09) — vermeldingen in commit-history |

**Niet gevonden in:**
- `package.json` (`name: "btc-tool"`, geen Kingfisher-string)
- `vercel.json` (alleen rewrite-regel)
- `public/manifest.json` (CRA-default `Create React App Sample`)
- `public/index.html` (`<title>Strategy Platform</title>` — geen Kingfisher)
- `tailwind.config.js`, `postcss.config.js`

### Laag 2 — Configureerbaar per tenant (live DB-state per 2026-05-01)

| Locatie | Key | Live waarde |
|---|---|---|
| `tenants` (slug=`kingfisher`) | `name` | `Kingfisher` |
| `tenants` (slug=`kingfisher`) | `theme_config.brand_name` | `Kingfisher` |
| `tenants` (slug=`kingfisher`) | `theme_config.logo_url` | `/kf-logo.png` |
| `tenants` (slug=`kingfisher`) | `theme_config.product_name` | `Strategy Platform` |
| `tenants` (slug=`kingfisher`) | `theme_config.logo_white_url` | `null` (logo-bestand bestaat niet — zie tech_debt P3 / Issue #73) |
| `app_config` | `label.footer.tagline` | `Kingfisher & Partners · From strategy to execution` |
| `app_config` | `prompt.magic.system_heavy` | bevat `Kingfisher & Partners` (zie sectie 8) |
| `app_config` | `prompt.magic.system_standard` | bevat `Kingfisher & Partners` (zie sectie 8) |
| `app_config` | `prompt.validate` | bevat `Kingfisher & Partners` (zie sectie 8) |

**Belangrijk:** `app_config` is NIET tenant-scoped — global voor alle tenants. Alleen `tenants.theme_config` is per tenant aanpasbaar.

### Laag 3 — Documentatie / metadata

| Locatie | Context |
|---|---|
| `CLAUDE.md` | 9 vermeldingen — `kingfisher-btcprod.vercel.app`, "Kingfisher tenant", "Kingfisher-defaults", commit-references |
| `WORKFLOW.md` | (niet apart geverifieerd in deze pass) |
| `DATABASE.md` | geen (gegrep'd: 0 hits) |
| `tech_debt.md` | 3 vermeldingen (deploy-aliassen, oude demo-URL) |
| `docs/parking-lot.md` | "Kingfisher heeft geen wit logo" + alias-cleanup |
| `docs/theming-inventory.md` | uitgebreide branding-tabel (8 hits) |
| `docs/migration-review.md`, `docs/schema-inventory.md`, `docs/migration-plan-multitenant.md`, `docs/frontend-tenant-plan.md`, `docs/fase-1-voltooid.md` | div. interne planning-docs met Kingfisher-vermeldingen |
| `docs/inzichten-68-color-mapping.md` | "Kingfisher navy" / "Kingfisher lime" als kleurcontext |
| `.github/workflows/supabase-migrations.yml` | geen (project-ID `lsaljhnxclldlyocunqf` is generiek) |
| Vercel-project-naam | `kingfisher-btc-tool` (uit `deploy-prod.sh`) |
| Domein | `kingfisher-btcprod.vercel.app` (productie alias) |
| Domein | `kingfisher-btc-tool.vercel.app` (Vercel default) |
| Domein (legacy) | `kingfisher-btcdemo.vercel.app` — verwijderd 2026-04-22 |
| GitHub-repo | `KFSmaling/kingfisher-btc-tool` (uit `deploy-prod.sh` push-target) |
| Git author | `KFSmaling <smaling.kingfisher@icloud.com>` (single contributor laatste 6 maanden) |

---

## 2. "BTC" / "Business Transformation Canvas" / "Business Transformatie Canvas"

### Laag 1 — Hardcoded

| # | Locatie | Context |
|---|---|---|
| 1 | `package.json:2` | `"name": "btc-tool"` (NPM-package-naam) |
| 2 | `src/i18n.js:3` | comment `Kingfisher BTC Tool — April 2026` (file-header) |
| 3 | `src/i18n.js:110` | NL-translation: `tips.subtitle: "Gebaseerd op het boek Business Transformatie Canvas"` |
| 4 | `src/i18n.js:114` | NL-translation: `tips.footer: "Beijen, Heetebrij & Tigchelaar — Business Transformatie Canvas"` |
| 5 | `src/i18n.js:227` | EN-translation: `tips.subtitle: "Based on the Business Transformation Canvas book"` |
| 6 | `src/i18n.js:231` | EN-translation: `tips.footer: "Beijen, Heetebrij & Tigchelaar — Business Transformation Canvas"` |
| 7 | `src/LoginScreen.js:84` | hardcoded JSX `<h1>Business Transformation Canvas</h1>` (login-header) |
| 8 | `src/App.js:95` | fallback in `appLabel("app.title", "Business Transformation Canvas")` |
| 9 | `src/features/admin/AdminPage.jsx:315` | `DEFAULT_LABELS` entry: `value: "Business Transformation Canvas"` voor key `label.app.title` |
| 10 | `src/features/strategie/StrategyOnePager.jsx:67` | inline JSX-style: `Business Transformation Canvas` (OnePager-header) |
| 11 | `src/features/canvas/components/TipsModal.jsx:11` | NL-tekst: `Op basis van het boek Business Transformatie Canvas van Marc Beijen, Ruben Heetebrij en Roos Tigchelaar.` |
| 12 | `src/features/canvas/components/TipsModal.jsx:89` | EN-tekst: `Based on the book Business Transformation Canvas by Marc Beijen, Ruben Heetebrij and Roos Tigchelaar.` |
| 13 | `src/shared/context/AppConfigContext.jsx:9` | comment-voorbeeld: `label("app.title") → "Business Transformation Canvas"` |
| 14 | `src/shared/context/AppConfigContext.jsx:19` | `LABEL_FALLBACKS` entry: `"app.title": "Business Transformation Canvas"` |
| 15 | `src/shared/components/ErrorBoundary.jsx:68` | hardcoded JSX-tekst: `Kingfisher & Partners · Business Transformation Canvas` |
| 16 | `src/shared/utils/btcValidator.js` | filename + module — naam-link met BTC |
| 17 | `src/prompts/btcPrompts.js` | filename + module-comment + 7 prompts met BTC-block-namen |
| 18 | `src/prompts/btcPrompts.js:3` | comment: `AI extraction prompts for all 7 BTC building blocks` |
| 19 | `src/prompts/btcPrompts.js:4` | comment: `Based on: BTC book (Beijen/Heetebrij/Tigchelaar), ACE, TLB, Spain, MAG cases` |
| 20 | `src/prompts/btcPrompts.js:10` | prompt-tekst: `expert in the Business Transformation Canvas (BTC) developed by Marc Beijen.` |
| 21 | `api/improve.js:31` | prompt-tekst: `Je bent een senior strategie-consultant ... voor het Business Transformatie Canvas verfijnt.` |
| 22 | `api/validate.js:8` | prompt-tekst: `Beoordeel de tekst op bruikbaarheid voor het Business Transformatie Canvas (BTC).` |
| 23 | `tests/example.spec.js:134` | composiet-locator-tekst bevat "Business" |
| 24 | `supabase/migrations/20260101000000_sprint_1_initial_schema.sql:3` | comment: `Business Transformation Canvas — Kingfisher & Partners` |
| 25 | `supabase/migrations/20260420000000_sprint_4d_app_config.sql:26` | seed: `('label.app.title', 'label', 'Hoofdtitel in header', 'Business Transformation Canvas')` |
| 26 | `supabase/migrations/20260420140000_sprint_4d_seed_prompts.sql:96` | seed-prompt-tekst: `Beoordeel de tekst op bruikbaarheid voor het Business Transformatie Canvas (BTC).` |
| 27 | `supabase/migrations/20260421110000_add_samenvatting_seed_all_labels.sql:16` | re-seed van label.app.title |
| 28 | git commits (laatste 6 maanden) | `feat: Strategy Deep Dive v2 — BTC-volledig`, `Feature: BTC Validator (Poortwachter)`, `Add BTC Tool v1 - Kingfisher huisstijl`, `update TECH_DEBT.md ... for BTC Tool project` |

### Laag 2 — Configureerbaar per tenant (live DB)

| Locatie | Key | Live waarde |
|---|---|---|
| `app_config` | `label.app.title` | `Business Transformation Canvas` (live geverifieerd) |
| `app_config` | `prompt.validate` | bevat letterlijk `Business Transformatie Canvas (BTC)` |
| `app_config` | `prompt.strategy.analysis` | bevat letterlijk `Business Transformatie Canvas en Novius model` (zie sectie 5) |
| `block_definitions` (tabel) | meerdere rijen | bevatten BTC-blokken: `customers`, `guidelines`, `people`, `processes`, `roadmap`, `strategy`, `technology` |

**Inconsistentie**: `block_definitions` gebruikt `guidelines` en `roadmap` als keys, terwijl `BLOCKS`-array in `BlockCard.jsx` `principles` en `portfolio` gebruikt. Genoteerd onder "opgemerkt-tijdens-audit".

### Laag 3 — Documentatie / metadata

| Locatie | Context |
|---|---|
| `CLAUDE.md` | titel: `# BTC Tool — Architectuur & Werkwijze voor Claude` + meerdere refs |
| `DATABASE.md` | titel: `# DATABASE.md — BTC Tool Supabase Schema` |
| `WORKFLOW.md` | niet apart geverifieerd in deze pass |
| `tech_debt.md` | titel: `# Technical Debt — BTC Tool` |
| `docs/audits/AUDIT_PROMPT_1_INVENTARISATIE.md` | audit-opdracht zelf met BTC-vermeldingen |
| Repo-naam | `kingfisher-btc-tool` (GitHub) |
| Vercel-project | `kingfisher-btc-tool` |
| Talloze docs in `docs/` | btc-validator, schema-inventory, migration-plan, theming-inventory, fase-*-voltooid |

---

## 3. Auteurs van het BTC-boek: Marc Beijen / Beijen / Ruben Heetebrij / Heetebrij / Roos Tigchelaar / Tigchelaar

### Laag 1 — Hardcoded

| # | Locatie | Context |
|---|---|---|
| 1 | `src/i18n.js:114` | NL: `Beijen, Heetebrij & Tigchelaar — Business Transformatie Canvas` (footer van Tips-modal) |
| 2 | `src/i18n.js:231` | EN: `Beijen, Heetebrij & Tigchelaar — Business Transformation Canvas` |
| 3 | `src/features/canvas/components/TipsModal.jsx:11` | NL-intro algemeen: `... van Marc Beijen, Ruben Heetebrij en Roos Tigchelaar.` |
| 4 | `src/features/canvas/components/TipsModal.jsx:89` | EN-intro algemeen: `... by Marc Beijen, Ruben Heetebrij and Roos Tigchelaar.` |
| 5 | `src/prompts/btcPrompts.js:4` | comment: `Based on: BTC book (Beijen/Heetebrij/Tigchelaar), ACE, TLB, Spain, MAG cases` |
| 6 | `src/prompts/btcPrompts.js:10` | prompt-tekst: `... developed by Marc Beijen.` |

### Laag 2 — Configureerbaar per tenant

Geen (auteursnamen worden niet vanuit `app_config` of `theme_config` gerefereerd).

### Laag 3 — Documentatie / metadata

| Locatie | Context |
|---|---|
| `docs/audit/2026-05-01/01-functioneel.md` | dit audit-document zelf — ref `Marc Beijen, Ruben Heetebrij, Roos Tigchelaar` |
| `docs/audits/AUDIT_PROMPT_1_BEGELEIDENDE_NOTITIE.md` | "In Document C staat Marc Beijen al genoemd" — meta-instructie |
| `docs/audits/AUDIT_PROMPT_1_INVENTARISATIE.md` | term-set voor deze audit |

**`Marc` als losse term:** alleen in vorm "Marc Beijen" gevonden, geen losse "Marc"-vermeldingen elders.

---

## 4. Tagline "From strategy to execution"

### Laag 1 — Hardcoded

| # | Locatie | Context |
|---|---|---|
| 1 | `src/App.js:98` | fallback in `appLabel("app.subtitle", "From strategy to execution")` |
| 2 | `src/App.js:279` | onderdeel van `appLabel("footer.tagline", "Kingfisher & Partners · From strategy to execution")` |
| 3 | `src/shared/context/AppConfigContext.jsx:20` | LABEL_FALLBACKS entry `"app.subtitle": "From strategy to execution"` |
| 4 | `src/shared/context/AppConfigContext.jsx:21` | LABEL_FALLBACKS entry `"footer.tagline": "Kingfisher & Partners · From strategy to execution"` |
| 5 | `src/features/admin/AdminPage.jsx:316-317` | DEFAULT_LABELS entries voor `label.app.subtitle` en `label.footer.tagline` |
| 6 | `supabase/migrations/20260420000000_sprint_4d_app_config.sql:27` | seed: `'From strategy to execution'` voor `label.app.subtitle` |
| 7 | `supabase/migrations/20260421090000_seed_labels.sql:8` | seed: footer.tagline |
| 8 | `supabase/migrations/20260421110000_add_samenvatting_seed_all_labels.sql:17-18` | re-seed van beide |

### Laag 2 — Configureerbaar (live DB)

| Locatie | Key | Live waarde |
|---|---|---|
| `app_config` | `label.app.subtitle` | (?) niet apart geverifieerd in live-query — afgeleid uit migraties dat de DB-waarde bestaat |
| `app_config` | `label.footer.tagline` | `Kingfisher & Partners · From strategy to execution` (live geverifieerd) |

### Laag 3 — Documentatie

`docs/theming-inventory.md` — refereert tagline 3×

---

## 5. Novius

### Laag 1 — Hardcoded

Geen voorkomens in code (`src/`, `api/`, `public/`, migraties).

### Laag 2 — Configureerbaar (live DB) — **kritisch**

| Locatie | Key | Live waarde |
|---|---|---|
| `app_config` | `prompt.strategy.analysis` | letterlijk: `... Je analyseert de samenhang ... in het Inzichten-formaat.Je bent gespecialiseerd in het Business Transformatie Canvas en Novius model.` |

**Belangrijke vondst:** Novius staat **niet** in de migratie `20260425000000_inzichten_sprint_a.sql` (Sprint A-prompt-seed), wat betekent dat deze tekst handmatig is toegevoegd via de admin-UI of direct SQL UPDATE — buiten de versie-gecontroleerde migraties om. → Genoteerd onder "opgemerkt-tijdens-audit".

### Laag 3 — Documentatie

| Locatie | Context |
|---|---|
| `docs/audits/AUDIT_PROMPT_1_INVENTARISATIE.md:161` | term in audit-opdracht: `Novius (eerdere referentie in voorstel-document)` |

---

## 6. Klant-cases / projectnamen: TLB, MAG, ACE, Spain, BTP, Santander, GTS

### Laag 1 — Hardcoded

| # | Locatie | Context |
|---|---|---|
| 1 | `src/prompts/btcPrompts.js:4` | comment: `Based on: BTC book (Beijen/Heetebrij/Tigchelaar), ACE, TLB, Spain, MAG cases` |
| 2 | `src/prompts/btcPrompts.js:142` | prompt-tekst: `Examples from real Kingfisher cases (Spain, TLB, MAG):` |
| 3 | `src/prompts/btcPrompts.js:143` | prompt-tekst: `Good: "Segment HNW (1M-3M wealth): broker channel, value prop = estate planning + exceptional service, NPS target +20"` |
| 4 | `src/prompts/btcPrompts.js:144` | prompt-tekst: `Good: "Bancassurance (Santander): omnichannel journey, separate CX from direct channel, cross-sell via data"` |
| 5 | `src/prompts/btcPrompts.js:183` | prompt-tekst: `Good: "Outsource IT infrastructure to GTS — retain architecture and demand management in-house"` |
| 6 | `src/prompts/btcPrompts.js:220` | prompt-tekst: `Examples from real Kingfisher cases (TLB, MAG, ACE):` |
| 7 | `src/prompts/btcPrompts.js:260` | prompt-tekst: `Examples from real Kingfisher cases (TLB, ACE, MAG, Spain):` |
| 8 | `src/prompts/btcPrompts.js:300` | prompt-tekst: `Examples from real Kingfisher cases (ACE, TLB, MAG):` |
| 9 | `src/prompts/btcPrompts.js:304` | prompt-tekst: `Good: "Theme 5 (ACE): Digital business processes — Supportive role — target 20% efficiency gain — Owner: COO"` |
| 10 | `tests/example.spec.js:41` | bestandsnaam in upload-test: `Work in progress BTP MAG Final Version-1.pptx` (BTP = Business Transformation Project? — context-specifiek) |

**Opmerking:** alle klant-cases zitten in dood code (`src/prompts/btcPrompts.js` wordt nergens geïmporteerd — zie document E §5.1) en in een test-asset-bestand (test-suite uitgeschakeld via `playwright.yml.disabled`). Geen actieve productie-aanroep van deze prompts in de huidige code-base. Komen wel direct terug bij re-import van `BLOCK_PROMPTS`.

### Laag 2 — Configureerbaar

Niet voorgekomen in live-DB-query op `app_config`. (Vraagteken: zijn deze klant-cases via prompt-overrides in DB ooit aangevuld? Niet via huidige queries detecteerbaar zonder full-text scan op alle prompt-values.)

### Laag 3 — Documentatie

Geen vermeldingen.

---

## 7. Branche-specifieke termen: HNW / wealth / verzekering / financial services / insurance / Aegon

### Laag 1 — Hardcoded

| # | Locatie | Context |
|---|---|---|
| 1 | `src/features/canvas/components/BlockCard.jsx:38` | EXAMPLE_BULLETS strategy: `"Vision: Best HNW Global insurer, excelling in customer service"`, `"Driver A: Customer & partner centricity"`, `"Driver B: Product differentiation"`, `"Goal: Double value creation by 2028"` |
| 2 | `src/features/canvas/components/BlockCard.jsx:40` | EXAMPLE_BULLETS principles customers: `"Customer focus: treat HNWI by CLV — no one-size-fits-all"`, `"Omnichannel consistency"` |
| 3 | `src/features/canvas/components/BlockCard.jsx:46` | EXAMPLE_BULLETS customers current: `"Segment Affluent+/HNW: 750K–1M wealth, 85% of policies"`, `"Channel: International brokers (primary, fed by private banks)"` |
| 4 | `src/features/canvas/components/BlockCard.jsx:47-48` | EXAMPLE_BULLETS customers tobe: `"Geography expansion: DIFC hub as Middle East entry point"`; change: `"Customer journey redesign for HNW+ segment"`, `"Launch broker portal uplift H1 2025"` |
| 5 | `src/features/canvas/components/BlockCard.jsx:55` | EXAMPLE_BULLETS technology current: `"Legacy policy admin: LifePro, limited API surface"` (LifePro = bestaand insurance-systeem) |
| 6 | `src/features/canvas/components/BlockCard.jsx:57` | EXAMPLE_BULLETS technology change: `"LifePro upgrade + API wrapper phase 1"`, `"CRM platform rollout — Phase 1 HK/Singapore"` |
| 7 | `src/features/canvas/components/BlockCard.jsx:58` | EXAMPLE_BULLETS portfolio: `"Scenario I: WOL launch HK/Bermuda, broker portal uplift"`, `"DIFC hub, FA proposition Singapore"` (WOL = Whole Of Life policy?) |
| 8 | `src/prompts/btcPrompts.js:143` | prompt-voorbeeld: `Segment HNW (1M-3M wealth): broker channel, value prop = estate planning + exceptional service, NPS target +20` |
| 9 | `api/magic.js:37` | prompt: `Senior Strategie Consultant ... gespecialiseerd in business transformatie voor de financiële en verzekeringssector bij Kingfisher & Partners` |
| 10 | `supabase/migrations/20260420140000_sprint_4d_seed_prompts.sql:27` | seed: idem als (9) — `prompt.magic.system_heavy` |

### Laag 2 — Configureerbaar (live DB)

| Locatie | Key | Live tekst |
|---|---|---|
| `app_config` | `prompt.magic.system_heavy` | bevat `"financiële en verzekeringssector"` |

### Laag 3 — Documentatie

| Locatie | Context |
|---|---|
| `docs/prototypes/inzichten-prototype-v2.html:521` | prototype-mock: `<span>Canvas: HNW Insurance 2028</span>` |
| `docs/prototypes/inzichten-prototype-v2.html:622, 636, 647` | prototype-mock-content met "Digital HNW Experience"-KSF, "USD 143m APE 2028-target", "top-3 global HNW insurer" — gebruikt als prototype-data, niet productie |
| `docs/architecture-spec.md:69` | spec-regel: `De naam van de initiële launch customer mag nergens in de codebase voorkomen — niet in variabelen, niet in seed-scripts, niet in commentaar, niet in tests. Hetzelfde voor branche-specifieke termen (verzekering, financial services) buiten dedicated branche-templates.` — **deze regel wordt nu geschonden** door bv. `BlockCard.jsx` EXAMPLE_BULLETS en `api/magic.js`. → Genoteerd onder "opgemerkt-tijdens-audit". |

**Niet gevonden:**
- `Aegon` — geen vermeldingen in code, prompts of docs (behalve audit-opdracht-zoeklijst)
- `wealth protection` — geen vermeldingen
- Specifieke klant-namen anders dan TLB/MAG/ACE/Spain/BTP

---

## 8. Persoonsnamen: Kees Smaling

### Laag 1 — Hardcoded

| # | Locatie | Context |
|---|---|---|
| 1 | `tests/example.spec.js:14` | input-fill: `'smaling.kingfisher@icloud.como'` (typo, maar privé-mail in test-script gecommit) |
| 2 | `tests/example.spec.js:33` | input-fill: `'smaling.kingfisher@icloud.com'` (privé-mail in test-script gecommit) |
| 3 | `supabase/migrations/20260420140000_sprint_4d_seed_prompts.sql:9-10` | RLS-policy: `auth.email() = 'keessmaling@gmail.com'` (eerdere admin-mail) |
| 4 | `supabase/migrations/20260420150000_fix_admin_email.sql:10-11` | RLS-policy: `auth.email() = 'smaling.kingfisher@icloud.com'` (huidige admin-mail) |
| 5 | `supabase/migrations/20260424070000_seed_initial_tenants_and_profiles.sql:79, 87` | comment + INSERT: `User-profiel voor Account 1 (Kees)`, hardcoded `5d76d65e-e102-4c33-bf45-d13fa4385537` (Kees' Auth UUID) |
| 6 | `supabase/migrations/20260424070000_seed_initial_tenants_and_profiles.sql:88` | comment: `Kees Holding tenant` (oude tenant-naam — DB-tenant heet inmiddels `Platform`) |

### Laag 2 — Configureerbaar (live DB)

| Locatie | Key | Live waarde |
|---|---|---|
| `user_profiles` | `id=5d76d65e-e102-4c33-bf45-d13fa4385537` | role=`platform_admin`, tenant_id=`...0001` (Platform) |
| `auth.users` (niet gequeried) | (?) | bevat de werkelijke email-adressen — niet zelf geverifieerd in deze pass om privacy-redenen |

### Laag 3 — Documentatie / metadata

| Locatie | Context |
|---|---|
| Git author | `KFSmaling <smaling.kingfisher@icloud.com>` — alle commits laatste 6 maanden |
| Commit message | `018fe4f` 2026-04-20: `fix: admin email gecorrigeerd naar smaling.kingfisher@icloud.com` |
| `docs/migration-plan-multitenant.md:170` | tabel-rij: `Account 1 | smaling.kingfisher@icloud.com | kingfisher | tenant_admin` |
| `docs/migration-review.md:139` | comment over verandering: `'Kees Holding' + 'Kingfisher'` |
| `docs/schema-inventory.md:55, 79` | RLS-doc + migratie-historiek |
| `docs/frontend-tenant-plan.md:50, 55` | scenario-tekst: `Kees logt in`, `Kees klikt "Nieuw canvas"` |
| `docs/audits/AUDIT_PROMPT_1_BEGELEIDENDE_NOTITIE.md:17` | privacy-instructie noemt Kees Smaling expliciet |
| `docs/audit/2026-05-01/01-functioneel.md` | dit audit-document zelf |

**`REACT_APP_ADMIN_EMAIL`** (env-var) — vermoedelijk `smaling.kingfisher@icloud.com` — niet zichtbaar in code (env-files in `.gitignore`).

---

## 9. Andere persoonsnamen

| Naam | Voorkomens | Locatie |
|---|---|---|
| Marc Beijen | 6 (zie sectie 3) | TipsModal, i18n, btcPrompts, audit-docs |
| Ruben Heetebrij | 4 | TipsModal NL/EN, i18n NL/EN |
| Roos Tigchelaar | 4 | TipsModal NL/EN, i18n NL/EN |
| David de Graaf | **0 in code/docs** — alleen in user-memory CLAUDE.md (Cowork-context, niet in repo) |
| Kees Smaling | (zie sectie 8) | RLS-policies, tests, planning-docs |

---

## 10. Boek-titels en hoofdstuktitels

Boek: **"Business Transformatie Canvas"** (NL) / **"Business Transformation Canvas"** (EN)
Auteurs: Marc Beijen, Ruben Heetebrij, Roos Tigchelaar
Jaar: niet vermeld in codebase

Hoofdstuk-titels niet expliciet in codebase gevonden — wel zijn de **7 BTC-blokken** (= boek-hoofdstukken) overgenomen als BLOCKS-array (Strategy, Guiding Principles, Customers, Processes, People, Technology, Portfolio).

Tips-modal-secties (`TIPS_DATA`) parafraseren concepten uit het boek per blok — dit is **interpretatie van de methode**, niet letterlijke citaten van hoofdstuktitels. Voorbeelden uit `TipsModal.jsx`:
- `algemeen.tips`: "Het magische getal is 7", "Time-boxing", "Outside-in & Inside-out", "BCG-matrix" (hulpmiddel-vermelding)
- `strategy.tips`: "Maak het inspirerend"
- `principles.tips`: "'Tight-loose' karakter", "Formuleer implicaties", "Wisselwerking"
- `customers.tips`: "Life events als triggers", "Omnichannel-denken"
- `processes.tips`: "Waardestromen als basis", "Vereenvoudig", "Standaardiseer waar mogelijk"
- `people.tips`: "Maak de zachte kant 'hard'", "Betrek de werkvloer", "Focus op verandervermogen"
- `technology.tips` (geverifieerd via grep, niet integraal gelezen): zelfde patroon

---

## 11. Twijfelgevallen / mogelijk methode- of merk-relateerd (?)

Per audit-opdracht: bij twijfel documenteren met vraagteken.

| Term | Locatie | Twijfel |
|---|---|---|
| `7·3·3 Regel` | `CLAUDE.md`, `LABEL_FALLBACKS`, StrategieWerkblad | Lijkt BTC-methode-eigen ("7 thema's, 3 KSF, 3 KPI") — generiek of methode-specifiek? (?) |
| `Stip op de Horizon` | RichtlijnenWerkblad context-strip + StrategyStatusBlock | NL-uitdrukking, mogelijk methode-eigen of generieke consultancy-term (?) |
| `Strategische Thema's` | overal | generieke strategy-term, of BTC-specifiek? (?) — TipsModal verwijst expliciet naar boek "Het magische getal is 7" |
| `Stop / Start / Continue` | RichtlijnenWerkblad implications | bekend coaching-framework, niet BTC-eigen, maar wel hardcoded in DB-schema (`guidelines.implications` jsonb default `'{"stop":"","start":"","continue":""}'`) |
| `Onderdeel / Dwarsverband` | Inzichten-pattern | ontworpen voor deze app (`INZICHTEN_DESIGN.md`), niet uit BTC-boek (?) |
| `Magic Staff` | overal | productterm voor RAG-feature, geen externe ref (?) |
| `Het Dossier` | overal | productterm voor RAG-data-set (?) |
| `Strategy Platform` | live DB `tenants.theme_config.product_name` | lijkt bewuste de-Kingfisher-isering — `public/index.html` `<title>Strategy Platform</title>` ondersteunt dit |
| `Balanced Scorecard` | prompts (KSF/KPI) | bekende externe methode (Kaplan/Norton 1992), niet BTC-eigen — wordt expliciet aangeroepen als "lens" in prompts |
| `BHAG` | StrategieWerkblad ambitie-veld | bekende externe term (Collins/Porras 1994), generiek |
| `Segment Affluent+ / HNW` | EXAMPLE_BULLETS | branche-eigen (private banking), zie sectie 7 |
| `WOL`, `LifePro`, `DIFC`, `APE` | EXAMPLE_BULLETS, prototype | insurance-vakjargon — Whole-Of-Life policy, levensverzekering admin-systeem, Dubai International Financial Centre, Annual Premium Equivalent |

---

## 12. URLs / domeinen / project-IDs

### Levende URLs

| URL | Type | Status |
|---|---|---|
| `kingfisher-btc-tool.vercel.app` | Vercel default domain | actief |
| `kingfisher-btcprod.vercel.app` | Vercel custom alias (handmatig gepind) | actief |
| `kingfisher-btcdemo.vercel.app` | Vercel alias (legacy) | verwijderd 2026-04-22 |

### IDs

| ID | Bron | Tabel/locatie |
|---|---|---|
| `lsaljhnxclldlyocunqf` | Supabase project-ref | `.github/workflows/supabase-migrations.yml:25` |
| `00000000-0000-0000-0000-000000000001` | Platform tenant UUID | `tenants` |
| `00000000-0000-0000-0000-000000000002` | Kingfisher tenant UUID | `tenants` |
| `5d76d65e-e102-4c33-bf45-d13fa4385537` | Kees' user UUID | `user_profiles` (gehardcoded in seed-migratie) |
| `6f0dac6b-d082-41f4-be2f-e0aacca4c73b` | Account 2 placeholder UUID | seed-migratie regel 102 (`!! invullen na aanmaken Gmail-account`) |

---

## 13. Live DB-content overzicht (per 2026-05-01)

### `tenants` (2 records)

```jsonc
[
  {
    "id": "00000000-0000-0000-0000-000000000001",
    "slug": "platform", "name": "Platform", "tenant_type": "consultancy",
    "theme_config": {
      "brand_name": "Platform",
      "product_name": "Strategy Platform",
      "primary_color": "#0f172a",  "accent_color": "#f97316",
      "accent_hover_color": "#ea6c0a", "success_color": "#2c7a4b",
      "analysis_color": "#0ea5e9", "overlay_color": "#020617",
      "accent_light_color": "#fff7ed",
      "logo_url": null, "logo_white_url": null
    }
  },
  {
    "id": "00000000-0000-0000-0000-000000000002",
    "slug": "kingfisher", "name": "Kingfisher", "tenant_type": "consultancy",
    "theme_config": {
      "brand_name": "Kingfisher",
      "product_name": "Strategy Platform",
      "primary_color": "#1a365d",  "accent_color": "#8dc63f",
      "accent_hover_color": "#7ab52e", "success_color": "#2c7a4b",
      "analysis_color": "#00AEEF", "overlay_color": "#001f33",
      "accent_light_color": "#edf7e0",
      "logo_url": "/kf-logo.png", "logo_white_url": null
    }
  }
]
```

**Opmerkingen:**
- Beide tenants hebben `product_name: "Strategy Platform"` — niet de naam "Kingfisher BTC Tool" of "Business Transformation Canvas". Dit is een afwijking van wat de UI toont (`label.app.title = "Business Transformation Canvas"`).
- Kingfisher-tenant heeft `logo_white_url: null` — wit-logo bestaat niet (Issue #73).
- `kingfisher` tenant heeft `tenant_type: "consultancy"` — niet bv. "platform_admin"; `tenant_type` is product-/license-veld.

### `app_config` (per category)

| Category | # rows | Brand-mentions live |
|---|---|---|
| `prompt` | 18 | 4 prompts bevatten `Kingfisher`, 1 bevat `Novius` |
| `label` | (?) (niet exact geteld) | 1 bevat `Kingfisher` (`label.footer.tagline`) |
| `setting` | 1 | `setting.autosave.delay_ms = 500` |

### `block_definitions` (7 records)

| Key | label_nl | label_en |
|---|---|---|
| `customers` | Klanten & Dienstverlening | Customers & Service |
| `guidelines` | Richtlijnen | Guidelines |
| `people` | Mensen & Competenties | People & Competencies |
| `processes` | Processen & Organisatie | Processes & Organisation |
| `roadmap` | Roadmap | Roadmap |
| `strategy` | Strategie | Strategy |
| `technology` | Technologie | Technology |

**Opmerking:** keys `guidelines` en `roadmap` matchen niet de `BLOCKS`-array in `BlockCard.jsx` (die `principles` en `portfolio` gebruikt). Of dit een bug is, of bewust legacy/forward-compat — onduidelijk in deze pass. → "opgemerkt-tijdens-audit".

---

## Verificatie-paragraaf

### Wat ik heb gedaan voor compleetheid

- **Grep-passes** (case-insensitive) door hele codebase op:
  - `kingfisher`, `KF`, `kingfisher.nl`, `Kingfisher & Partners`
  - `BTC`, `Business Transformation Canvas`, `Business Transformatie Canvas`
  - `marc beijen`, `beijen`, `heetebrij`, `tigchelaar`
  - `novius`
  - `verzeker`, `insurance`, `HNW`, `wealth`, `aegon`, `financial services`
  - `from strategy to execution`
  - `TLB`, `MAG`, `ACE`, `Spain`, `BTP`
  - `smaling`, `kees`
- **Volledige reads** van: `public/index.html`, `public/manifest.json`, `package.json`, `supabase/migrations/20260424070000_seed_initial_tenants_and_profiles.sql`, `src/prompts/btcPrompts.js` (regels 1-80, rest via grep)
- **Live DB queries** via Supabase MCP tegen project `lsaljhnxclldlyocunqf`:
  - `app_config WHERE category='prompt'` (18 rijen)
  - `app_config WHERE value ILIKE '%brand-term%'` (5 rijen)
  - `tenants` (2 rijen integraal met theme_config-jsonb)
  - `block_definitions` (7 rijen)
  - `information_schema.tables` (14 tabellen — block_definitions niet in DATABASE.md)
- **Git-log laatste 6 maanden** op merknaam-vermeldingen — 13 hits vermeldingen, 1 author (`KFSmaling <smaling.kingfisher@icloud.com>`)
- **Branch-namen**: master, demo, audit/2026-05-01 — geen merknaam-leakage
- **Commit-author metadata**: per `git log --pretty=%an <%ae>` = single contributor

### Niet onderzocht en waarom

- **`auth.users` tabel inhoud**: niet apart gequeried (privacy — bevat alle gebruikersmail). Identifiers staan al in code/seed-scripts; live-content levert niet meer signaal.
- **`canvases` user-data**: niet gegrep'd op klant-namen — dat is gebruikersinhoud, niet platform-identiteit. Per audit-prompt buiten scope.
- **`document_chunks`**: niet doorzocht op klant-namen — RAG-content is per definitie klant-specifiek en valt onder gebruikersdata, niet platform.
- **Git-history vóór 2026 (2025 en eerder)**: niet onderzocht — repo-history begint 2026-04-09 per oudste commit (Add BTC Tool v1).
- **Claude-AI generated text in production conversations**: niet observable.
- **CRA's `node_modules`**: dependencies niet doorzocht (te groot, geen platform-identiteit te verwachten).

### Verificatie-steekproeven (3 willekeurige bevindingen)

1. **`api/magic.js:37` bevat "financiële en verzekeringssector bij Kingfisher & Partners"** — bestand geopend via grep, regel 37 letterlijk bevestigd. Live-DB `prompt.magic.system_heavy` bevat dezelfde tekst (live-query bevestigd). ✅
2. **`tests/example.spec.js:33` bevat hardcoded privé-mail Kees** — `await page.getByRole('textbox', { name: 'naam@kingfisher.nl' }).fill('smaling.kingfisher@icloud.com');` — bestand geopend, regel 33 letterlijk bevestigd. Workflow Playwright is uitgeschakeld (`playwright.yml.disabled`), dus test draait niet — maar privé-mail staat wel in publieke repo-history. ✅
3. **Live `prompt.strategy.analysis` bevat "Novius model"** — Supabase MCP query bevestigt: `... in het Inzichten-formaat.Je bent gespecialiseerd in het Business Transformatie Canvas en Novius model.`. Migratie `20260425000000_inzichten_sprint_a.sql` bevat geen "Novius"-string — handmatig toegevoegd buiten migraties om. ✅

### Bekende blinde vlekken

- **Branch-namen op alle remotes**: alleen `origin` gechecked, geen forks. Niet relevant voor solo-repo.
- **PR-titles, issue-comments**: GitHub Issue-content niet uitputtend doorzocht in deze pass; `gh issue list` werd alleen voor titel-overzicht gebruikt. Issue-bodies kunnen klant-namen bevatten.
- **Vercel project-name + custom domains**: niet via Vercel-API geverifieerd — afgeleid uit `deploy-prod.sh`.
- **Klant-cases TLB/MAG/ACE/Spain/BTP**: betekenis niet vastgesteld (potentiële volledige klantnamen achter afkortingen onbekend).
- **`strategy_core`, `analysis_items`, `guidelines`, `strategic_themes` etc. user-data**: niet gegrep'd op klant-namen — buiten scope per audit-prompt.
- **`document_chunks` content**: niet onderzocht — bevat per definitie klantdata.
- **Mogelijke verborgen voorkomens** in:
  - Comment-blocks die tijdens grep als false-negative kunnen passeren (onwaarschijnlijk maar mogelijk)
  - String-concatenaties of template-literals die de zoektermen splitsen (bv. `"King" + "fisher"` — niet via grep vindbaar; geen aanleiding om te verwachten)
  - Base64-encoded waarden of binary-bestanden
