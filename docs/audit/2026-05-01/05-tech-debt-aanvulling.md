# 05 — Tech debt en open items aanvulling

**Audit-datum:** 2026-05-01
**Branch:** `audit/2026-05-01`
**Doel:** items die niet in `tech_debt.md` staan, plus huidige stand van compliance per `CLAUDE.md` sectie 4. Geen prioritering, alleen lijst.

**Belangrijk:** voor de bestaande P1-P5-categorieën verwijs naar `tech_debt.md`. Hieronder alleen items die níet in tech_debt zijn opgenomen.

---

## 1. Bestaande tech_debt.md — referentie (niet uitschrijven)

**Open items per 2026-05-01:**
- P1 (Lifecycle / Race-guards) — alle items ✅ Done 2026-04-26
- P2 (Async integriteit) — 10 violations open
- P3 (Stale closures) — 9 callbacks open
- P4 (Service contract) — bewust niet gemigreerd
- P4 (Inzichten-patroon) — Sprint A/B/C ✅ done; Richtlijnen-deel niet opgenomen (zie sectie 5 hieronder)
- P4 (Label-discipline tooling) — ✅ Done 2026-04-26
- P4 (Label-completeness sweep) — open, 220 ESLint-violations
- P5 (Deploy-architectuur fase 2-4) — open

**Open items in `parking-lot.md`** (niet uitschrijven, alleen vermelden):
- Middelgrote prioriteit: Inzichten-prompt feedback-loop, visuele consistentie werkblad↔overlay, Token-budget configureerbaar, StrategyOnePager hex-opacity, witte logo, Platform-logo
- Lage prioriteit: `color-mix()` opacity-varianten, Tenant-admin UI, Demo-omgeving, LogoBrand-in-ErrorBoundary AuthProvider dependency

---

## 2. TODO / FIXME / HACK / XXX-comments in code

**Resultaat van uitputtende grep over `src/`, `api/`, `supabase/migrations/`:**

**Geen TODO/FIXME/HACK/XXX-markeringen gevonden.** ✅

Dit is opvallend gegeven de codebase-omvang. Mogelijke verklaringen:
- Dergelijke markers zijn consequent als parking-lot-items of issues ge-extracteerd
- Of: codebase is jong en TODO-discipline is goed gehandhaafd

**Niet uitputtend onderzocht:**
- Markdown-comments in MD-files (zou TODO als plain text bevatten)
- Multi-line commentaren in JSX kunnen TODOs bevatten zonder herkenbaar prefix

---

## 3. Console.log statements actief in productie-code

**Geen logger-wrapper gebruikt** voor de volgende `console.log` (gaan dus letterlijk naar browser-console / Vercel-runtime-logs in productie):

| Locatie | Inhoud | Frequentie |
|---|---|---|
| `src/shared/services/canvas.service.js:48` | `console.log("[createCanvas] inserting:", { userId, tenantId, name, language });` | per nieuw canvas — bevat user-data |
| `src/shared/services/canvas.service.js:64` | `console.log("[createCanvas] success:", data);` | per nieuw canvas — bevat canvas-record |
| `src/shared/services/canvas.service.js:98` | `console.log("[autosave] success:", data);` | bij elke autosave (~elke 500ms tijdens typen) — bevat canvas-data |
| `src/shared/services/embedding.service.js:156` | `` console.log(`[index] klaar: ${parents.length} parents, ${children.length} children`); `` | per document-index-run |
| `api/magic.js:65` | `` console.log(`[magic] buildContext: ${chunks.length} chunks ontvangen, ${valid.length} met content`); `` | per Magic-call (server-side log) |

**Verschil met logger-wrapper:** `src/shared/utils/logger.js` heeft een `log()`-functie die alleen in dev-mode logt:
```js
export const log  = (...args) => { if (isDev) console.log(...args); };
export const err  = (...args) => console.error(...args); // altijd aan
```

Bovenstaande locaties gebruiken `console.log` direct — niet de logger-wrapper. In productie zichtbaar in browser-DevTools / Vercel-runtime-logs. Mogelijke privacy-implicaties (autosave-log bevat canvas-content).

**Niet als debt geclassificeerd** (deze pass), alleen geconstateerd. `console.error` en `console.warn` zijn structureel voor error-tracking en lijken bewust — niet opgenomen in deze lijst.

---

## 4. Out-commented code-blokken

| Locatie | Inhoud | Status |
|---|---|---|
| `src/features/canvas/components/DeepDiveOverlay.jsx:19-20` | `// customers: React.lazy(() => import("../../customers/CustomersWerkblad"))`<br/>`// people: React.lazy(() => import("../../people/PeopleWerkblad"))` | wachten op werkblad-implementatie (Klanten + Mensen). Twee andere stub-blokken (processes, technology, portfolio) staan zelfs niet als comment |

**Geen andere multi-line commented code-blocks** gevonden via grep.

---

## 5. Dood / verouderd / inconsistent code

### 5.1 — `src/prompts/btcPrompts.js` (323 regels, dood)

Bevat 7 BTC-block extraction-prompts (`STRATEGY_PROMPT`, `PRINCIPLES_PROMPT`, etc.). **Wordt nergens geïmporteerd**.

Eerdere ESLint-CI-fix-commit `becfa01` heeft de import elders verwijderd zonder het bestand zelf op te ruimen.

**Inhoud bevat 6 klant-namen + insurance-jargon** (zie document C, sectie C.2-C.8) — risico op terugkeer in productie als ooit opnieuw gebruikt.

### 5.2 — `src/services/*.js` (backwards-compat barrels)

Vier bestanden:
- `authContext.js` (1 regel re-export, **wordt niet meer geïmporteerd** sinds Sprint 7 #37)
- `supabaseClient.js` (1 regel, **wordt niet meer geïmporteerd**)
- `btcValidator.js` (1 regel, **wordt niet meer geïmporteerd**)
- `canvasStorage.js` (4 regels barrel, **wordt nog wél geïmporteerd** door `MasterImporterPanel.jsx:5` en `useCanvasState.js`)

Drie van de vier zijn **dood code** — kandidaten voor verwijdering. Eén (`canvasStorage.js`) is nog actief.

### 5.3 — `schema.sql` (0 bytes, leeg)

Bestand bestaat in repo (gemodificeerd 2026-04-22) maar is leeg. Tegelijk staat het in `.gitignore`:
```
# Local schema exports (schema is documented in DATABASE.md)
schema.sql
```

**Inconsistentie**: `.gitignore` zegt "negeer dit", maar het bestand zit wel in repo. Vermoedelijk historisch gecommit voordat het in `.gitignore` werd gezet. Lege placeholder. Kandidaat voor `git rm`.

### 5.4 — `src/App.test.js` (CRA-boilerplate)

```js
test('renders learn react link', () => {
  render(<App />);
  const linkElement = screen.getByText(/learn react/i);
  expect(linkElement).toBeInTheDocument();
});
```

**De test gaat falen** — er is geen "learn react link" in de werkelijke `<App>` (CRA-default opgeruimd). Indien `npm test` in CI zou draaien, faalt deze. Niet actief in CI (`.github/workflows/`-pipeline draait alleen migraties + de gedisablede playwright).

### 5.5 — `api/extract.js` (mogelijk dood endpoint)

47 regels, geen system-prompt, stuurt alleen `documentText` naar Claude met `claude-sonnet-4-20250514`. Geen UI-aanroep gevonden in deze pass — mogelijk vroege MVP-rest of niet-actief feature.

### 5.6 — `README.md` (CRA-boilerplate)

71 regels CRA-default content ("Getting Started with Create React App"). Project-info ontbreekt volledig. Niet aangepast sinds initial CRA-bootstrap.

---

## 6. Hardcoded test-waardes / placeholders

### 6.1 — Privé-mail Kees in committed test-bestand

`tests/example.spec.js:14, 33`:
```js
await page.getByRole('textbox', { name: 'naam@kingfisher.nl' }).fill('smaling.kingfisher@icloud.como');
// regel 33:
await page.getByRole('textbox', { name: 'naam@kingfisher.nl' }).fill('smaling.kingfisher@icloud.com');
```

Privé-icloud-adres staat in publieke repo-history. Workflow `playwright.yml.disabled` is uitgeschakeld dus draait niet, maar bestand staat wel in git.

### 6.2 — Hardcoded UUIDs in seed-migratie

`supabase/migrations/20260424070000_seed_initial_tenants_and_profiles.sql`:
- Regel 87: `5d76d65e-e102-4c33-bf45-d13fa4385537` — Kees' werkelijke Auth UUID, gehardcoded
- Regel 102: `6f0dac6b-d082-41f4-be2f-e0aacca4c73b` — placeholder voor "Account 2 (Gmail)" met comment `!! invullen na aanmaken Gmail-account`

Beide UUIDs zijn personally identifiable — verwijzen naar werkelijke `auth.users.id`.

### 6.3 — `PLACEHOLDER`-prefix als feature

Niet als debt — `AppConfigContext.jsx:121, 131` heeft expliciete logica:
```js
if (row?.value && !row.value.startsWith("PLACEHOLDER")) return row.value;
```
DB-rijen met value beginnend met `PLACEHOLDER` worden bewust overgeslagen als "nog te vullen". Bekend feature. Geen open debt.

### 6.4 — `EXAMPLE_BULLETS` met klant-data

`src/features/canvas/components/BlockCard.jsx:38-64` — example-content gebruikt insurance/HNW-jargon (zie document C sectie 7). Wordt geactiveerd door "Voorbeeld laden"-functie via `handleLoadExample()` in `useCanvasState.js`.

Niet "test-data" in strikte zin — het is **product-feature** (demo-canvas voor onboarding). Maar bevat wel branche-specifieke aannames die per architecture-spec sectie 69 niet in de codebase mogen staan.

### 6.5 — Test-asset bestandsnaam

`tests/example.spec.js:41`:
```js
await page.setInputFiles('input[type="file"]', path.join(__dirname, 'assets', 'Work in progress BTP MAG Final Version-1.pptx'));
```

Bestandsnaam bevat klant-case-naam "MAG" en project-acroniem "BTP" (Business Transformation Project?). PPTX-bestand zelf onder `tests/assets/` (niet geverifieerd of het in git zit).

---

## 7. Audit-trail-gaten — productie wijkt af van versie-controle

Uit document D bekend, hier opgenomen als open debt-item:

### 7.1 — Live `prompt.strategy.analysis` bevat "Novius model"

Migratie `20260425000000_inzichten_sprint_a.sql` bevat de prompt zonder Novius-claim. Live DB-waarde bevat `Je bent gespecialiseerd in het Business Transformatie Canvas en Novius model.`

→ Deze tekst is handmatig aangepast in productie (via Admin-UI of direct SQL UPDATE). Wijziging is **niet** in versie-beheer.

### 7.2 — Drie andere code↔DB-discrepanties

| Prompt | Code-versie | Live DB-versie |
|---|---|---|
| `prompt.strategy.analysis` | heeft BEKNOPTHEID-sectie | heeft Novius-claim |
| `prompt.magic.system_standard` | mist markdown-opmaak-regel | heeft markdown-opmaak-regel |
| `prompt.validate` | heeft uitgebreide CRITERIA-PER-BLOK sectie | mist die sectie |
| `guideline.advies`/`implications` | (kleine bewoordingen-verschillen) | (geringe afwijking) |

→ Ofwel productie loopt achter, ofwel is admin-bewerkt buiten migraties om. Geen bewijs welke richting in deze pass.

---

## 8. Database-schema-drift

### 8.1 — `DATABASE.md` is verouderd (per 2026-04-22)

Niet meer in `DATABASE.md`:
- `tenants` tabel + theme_config jsonb
- `user_profiles` tabel
- RLS-helpers `current_tenant_id()` / `current_user_role()`
- `canvases.tenant_id`-kolom
- `strategy_core.insights`-kolom (Sprint A)
- `block_definitions` tabel (live geconstateerd, gebruikt door admin)
- Updated RLS-policies op `canvas_uploads` en `import_jobs`

### 8.2 — `block_definitions`-tabel niet gedocumenteerd

Live aanwezig, gebruikt door `AdminPage.jsx` (4e tab "Blok Titels"), maar niet in `DATABASE.md`. Schema:
- `key` (text, PK)
- `label_nl` (text)
- `label_en` (text)

Migratie waar deze tabel is aangemaakt: niet expliciet geverifieerd in deze pass — geen `*_block_definitions.sql` in `supabase/migrations/` lijst gezien.

### 8.3 — Block-IDs inconsistent: code vs. DB

| Code (`BlockCard.jsx BLOCKS-array`) | DB (`block_definitions`) |
|---|---|
| `strategy` | `strategy` ✅ |
| `principles` | `guidelines` ❌ |
| `customers` | `customers` ✅ |
| `processes` | `processes` ✅ |
| `people` | `people` ✅ |
| `technology` | `technology` ✅ |
| `portfolio` | `roadmap` ❌ |

Code gebruikt `principles`/`portfolio`; DB heeft `guidelines`/`roadmap`. Dit lijkt een naam-versus-beheer-keuze die niet gesynchroniseerd is. Functioneel niet brekend (DB wordt voor 4e admin-tab gebruikt; werkbladen worden in code via `BLOCKS` gerouterd) maar wel verwarrend.

### 8.4 — `strategy_core.analysis`-kolom is niet gedropt

Sprint A heeft `strategy_core.insights` toegevoegd. De oude `analysis`-kolom (met `recommendations[]`-structuur) bestaat formeel nog volgens `DATABASE.md`, maar wordt niet meer gelezen of geschreven door huidige UI-code. Dode kolom.

---

## 9. Inconsistenties in API-laag

### 9.1 — Twee Sonnet-aliases gemengd gebruikt

| Endpoint | Model |
|---|---|
| `api/strategy.js` | `claude-sonnet-4-5` |
| `api/guidelines.js` | `claude-sonnet-4-5` |
| `api/magic.js` (heavy) | `claude-sonnet-4-5` |
| `api/extract.js` | `claude-sonnet-4-20250514` |
| `api/validate.js` | `claude-sonnet-4-20250514` |

Twee verschillende Sonnet-aliases tegelijk in productie. Mogelijk gevolg: subtiel verschillende model-versies. Niet brekend, wel rommelig.

### 9.2 — `api/validate.js` comment ↔ code

Bestand-header (regel 4):
```
* Gebruikt claude-haiku voor snelle, goedkope pre-flight check.
```

Werkelijke code (regel 61): `model: "claude-sonnet-4-20250514"` — Sonnet, geen Haiku. Comment is misleidend.

### 9.3 — Auth dev-bypass in productie

`api/_auth.js:29-33`:
```js
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn("[_auth] Supabase niet geconfigureerd — auth check overgeslagen");
  return { id: "dev", email: "dev@local" };
}
```

Bij ontbrekende env-vars accepteert de auth-middleware **elke** request als geauthenticeerd dev-user. In productie zou dit alle auth-checks bypassen.

**Mitigatie**: Vercel-env-vars zijn ingesteld (anders zou de hele app stuk gaan). Maar de bypass blijft een veiligheidsrisico bij misconfig.

### 9.4 — Unbalanced auth-check coverage

Alleen `api/strategy.js` is integraal gelezen in deze pass — andere endpoints (guidelines, magic, improve, validate, extract, embed, parse) niet uitputtend gecontroleerd op `requireAuth`-aanroep. Per grep-pass is `requireAuth` aanwezig in alle endpoints, maar niet alle code-paden zijn doorgenomen.

---

## 10. Hardcoded UI-strings (legacy)

220 ESLint-violations actief gemarkeerd via `react/jsx-no-literals` (warn-level, sinds commit `245b562`). Bekend en gedekt onder tech_debt P4 sweep-item.

**Voorbeelden uit document A** (niet via `appLabel()`):
- LoginScreen alle 100+ strings
- `ProjectInfoSidebar` alle veldnamen + opties (Branche, Type Transformatie, Org-grootte, Status)
- StrategyOnePager template-headers
- ErrorBoundary error-tekst
- Multi-tab-warning banner
- "Werkblad" eyebrow op StrategieWerkblad + RichtlijnenWerkblad
- "Strategie Werkblad" / "Richtlijnen & Leidende Principes" h2-titels
- "Creëer Full Draft" knop op StrategieWerkblad

---

## 11. Andere opmerkelijke gaps

### 11.1 — `manifest.json` nog CRA-default

`public/manifest.json` heeft `"name": "Create React App Sample"`, `"short_name": "React App"`. Niet aangepast naar product-naam. Zichtbaar in browser-PWA-installation.

### 11.2 — `<title>` op login + admin gebruikt "Strategy Platform"

`public/index.html:27`: `<title>Strategy Platform</title>`. Tegelijk:
- `theme_config.product_name` = `Strategy Platform` (live geverifieerd in beide tenants)
- `appLabel("app.title")` = `Business Transformation Canvas`

→ Drie verschillende product-naam-bronnen actief tegelijk. Welke wint waar:
- Browser-tab-titel: `<title>` of `useDocumentTitle()` hook (laatstgenoemde wint na mount)
- App-header: `appLabel("app.title")`
- Tenant-meta: `theme_config.product_name` (hook-resolved)

### 11.3 — `package.json` mist project-metadata

```json
{ "name": "btc-tool", "version": "0.1.0", "private": true }
```

Geen `description`, `repository`, `author`, `license`, `engines`. Vrij minimal voor een product-codebase.

### 11.4 — `i18n.js` taal-toggle vs. `appLabel` taal-mismatch

`useLang()` heeft `lang` (`nl`/`en`) en `t()` voor `TRANSLATIONS`-keys. `appLabel()` leest één DB-waarde zonder taal-onderscheid. Bij switch naar EN blijven alle DB-driven labels in NL — gemengde-taal-UX.

→ Geen item in tech_debt; kandidaat voor toevoeging.

---

## 12. CLAUDE.md sectie 4 — compliance status (geverifieerd 2026-05-01)

Per `CLAUDE.md` regels 359-365:

| Regel | Status | Locatie van non-compliance |
|---|---|---|
| **4.1** Lifecycle (`key={canvasId}`) | ✅ | n.v.t. — laatste fix `446bb8b` 2026-04-26 |
| **4.2** Async integriteit | ❌ | 10 callbacks, zie `tech_debt.md` P2 sectie |
| **4.3** Data isolatie + race-guards | ✅ | n.v.t. — laatste fix `446bb8b` 2026-04-26 (`useCanvasState.handleSelectCanvas`) |
| **4.4** Stale closures | ❌ | 9 callbacks in `StrategieWerkblad`/`RichtlijnenWerkblad`, zie `tech_debt.md` P3 |
| **4.5** Service contract `{ data, error }` | ✅ | n.v.t. |

### 12.1 — 4.2 non-compliance details (uit `tech_debt.md` P2)

10 specifieke locaties:
- `StrategieWerkblad.handleClose` — silent `.catch(() => {})`
- `StrategieWerkblad.removeAnalysisItem` — await zonder error-check
- `StrategieWerkblad.changeAnalysisTag` — optimistic update zonder rollback
- `StrategieWerkblad.removeThema` — await zonder error-check
- `StrategieWerkblad.removeKsfKpi` — await zonder error-check
- `StrategieWerkblad.updateThemaTitle` — `setTimeout` fire-and-forget
- `StrategieWerkblad.updateKsfKpiItem` — `setTimeout` fire-and-forget
- `RichtlijnenWerkblad.handleDelete` — await zonder error-check
- `RichtlijnenWerkblad.scheduleDbSave` — `setTimeout` debounced save
- `RichtlijnenWerkblad.handleAcceptOneDraft` — partieel (alleen eerste call gechecked)

### 12.2 — 4.4 non-compliance details (uit `tech_debt.md` P3)

9 callbacks:
- `StrategieWerkblad`: `addAnalysisItem`, `addThema`, `acceptThemaDraftLine`, `acceptAllThemaDraft`, `handleAnalyze`, `handleClose`
- `RichtlijnenWerkblad`: `handleAdd`, `handleAcceptOneDraft`, `handleAcceptAllDraft`

---

## 13. Verzameling — items die niet in tech_debt.md staan en hier worden opgevoerd

Nieuwe items uit deze audit die overweging verdienen voor opname in `tech_debt.md` of een vergelijkbaar register (volgens audit-prompt: "Geen prioritering — alleen lijst"):

| # | Categorie | Item | Locatie |
|---|---|---|---|
| 1 | Productie-logs | 5× `console.log` met user-data lekken in productie | `canvas.service.js`, `embedding.service.js`, `api/magic.js` |
| 2 | Dood code | `src/prompts/btcPrompts.js` — 323 regels, niet meer geïmporteerd | `src/prompts/` |
| 3 | Dood code | 3 backwards-compat barrels niet meer gebruikt | `src/services/{authContext, supabaseClient, btcValidator}.js` |
| 4 | Dood code | `schema.sql` 0 bytes in repo én gitignored (inconsistent) | repo-root |
| 5 | Dood code | `App.test.js` — failing CRA-boilerplate test | `src/App.test.js` |
| 6 | Dode endpoint | `api/extract.js` — geen UI-aanroep gevonden | `api/extract.js` |
| 7 | Doc-drift | `README.md` is CRA-boilerplate | repo-root |
| 8 | Doc-drift | `DATABASE.md` mist multi-tenancy + `insights`-kolom + `block_definitions`-tabel | `DATABASE.md` |
| 9 | Privacy | Privé-icloud-mail in test-bestand in git-history | `tests/example.spec.js` |
| 10 | Privacy | Werkelijke Auth UUID hardcoded in seed-migratie | `supabase/migrations/20260424070000` |
| 11 | Audit-trail | Live `prompt.strategy.analysis` afwijkt van migratie (Novius-claim) | `app_config` live |
| 12 | Audit-trail | 3 andere code↔DB prompt-discrepanties | document D B-sectie |
| 13 | Schema-drift | `block_definitions` keys (`guidelines`/`roadmap`) ≠ code BLOCKS-keys (`principles`/`portfolio`) | DB ↔ `BlockCard.jsx` |
| 14 | Schema-drift | `strategy_core.analysis`-kolom is niet gedropt na Sprint A | DB |
| 15 | API-rommel | 2 Sonnet-aliases tegelijk gebruikt (`claude-sonnet-4-5` + `claude-sonnet-4-20250514`) | `api/*.js` |
| 16 | Doc-drift | `api/validate.js` comment zegt Haiku, code gebruikt Sonnet | `api/validate.js:4` |
| 17 | Security | `api/_auth.js` dev-bypass returnt fake user bij missing env-vars | `api/_auth.js:29-33` |
| 18 | Manifest | `public/manifest.json` nog CRA-default | `public/manifest.json` |
| 19 | Naam-mismatch | 3 verschillende product-name-bronnen actief tegelijk | `index.html` / `app_config` / `theme_config` |
| 20 | Spec-schending | `architecture-spec.md` regel 69 wordt nu actief geschonden door `BlockCard.jsx EXAMPLE_BULLETS`, `api/magic.js SYSTEM_HEAVY`, en de live `prompt.magic.system_heavy` | meerdere |
| 21 | i18n-mismatch | Taal-toggle (`lang`/`t()`) en `appLabel`-DB-driven labels niet gesynced — gemengde NL/EN bij switch | `i18n.js` ↔ `app_config` |
| 22 | Prompts | `prompt.strategy.samenvatting`-key ontbreekt in DB; alleen hardcoded fallback actief | `app_config` ontbrekend |
| 23 | Prompts | 3 prompts hebben geen DB-override (linkThemes, SYSTEM_GENERAL_KNOWLEDGE, samenvatting) | `api/{guidelines,magic,strategy}.js` |
| 24 | Code-smell | Typo `ambtieuzer` (moet `ambitieuzer`) in live `prompt.improve.inspirerender` + code | `api/improve.js:9` + DB |
| 25 | RLS | Admin-policy hardcodet e-mailadressen i.p.v. rol-check (`auth.email() = '...'`) | `supabase/migrations/20260420150000_fix_admin_email.sql` |
| 26 | RLS | Eerdere admin-mail (`keessmaling@gmail.com`) zit nog in oudere migratie — niet schadelijk maar verwarrend | `supabase/migrations/20260420140000_sprint_4d_seed_prompts.sql:9-10` |

---

## Verificatie-paragraaf

### Wat ik heb gedaan voor compleetheid

- **Grep-passes** uitputtend voor: `TODO`, `FIXME`, `HACK`, `XXX`, `console\.(log\|warn\|error\|debug\|info)`, `PLACEHOLDER`, `TBD`, `DUMMY`, `FAKE`, `TEMP`, `temporary`, `tijdelijk`, out-commented import-statements
- **Volledige reads** van: `tech_debt.md`, `parking-lot.md`, `CLAUDE.md` sectie 4 (regels 198-365)
- **Cross-check** van `src/services/*.js` legacy-files: bestand-headers gelezen, import-locaties gegrep'd
- **Live DB schema-check** via Supabase MCP: `information_schema.tables` (14 tabellen) — bevestigde `block_definitions` aanwezigheid, geen extra ondergedocumenteerde tabellen
- **Cross-document references**: gebaseerd op documenten A, B, C, D bevindingen in deze audit-pass

### Niet onderzocht en waarom

- **Volledige inhoud van `parking-lot.md`** — alleen index gelezen; per audit-prompt "kort genoemd, niet uitschrijven"
- **Schema-tabellen die niet in DATABASE.md staan**: alleen `block_definitions` is bevestigd via live-query. Mogelijk meer ondergedocumenteerde tabellen of kolommen.
- **Migratie-content uitputtend doorzocht** op `block_definitions`-CREATE TABLE — niet gevonden in deze pass; de tabel bestaat live, maar het is onduidelijk welke migratie 'm heeft aangemaakt.
- **Code-coverage van API-endpoints**: alleen `api/strategy.js` integraal gelezen; `api/guidelines.js` integraal gelezen voor document D; andere alleen gegrep'd of top-X-regels.
- **Test-coverage werkelijke uitvoering**: `npm test` niet gedraaid om te bevestigen dat `App.test.js` daadwerkelijk faalt. Visueel duidelijk wel.
- **`tests/assets/` directory**: niet gescand op aanwezigheid van werkelijke klant-PPTX-bestanden in git-tree.

### Verificatie-steekproeven (3 willekeurige bevindingen)

1. **`App.test.js` heeft een failing test** — bestand handmatig geopend, regel 4-7 letterlijk: `screen.getByText(/learn react/i)`. `<App>` rendert geen "learn react"-tekst. ✅
2. **`schema.sql` is 0 bytes** — `ls -la schema.sql` bevestigt: `0 keessmaling staff Apr 22`. Tegelijk staat het in `.gitignore` regel `schema.sql`. ✅
3. **`canvas.service.js:48` logt user-data naar productie-console** — bestand handmatig geopend, regel 48 letterlijk: `console.log("[createCanvas] inserting:", { userId, tenantId, name, language });`. Geen logger-wrapper, gaat direct naar browser-console. ✅

### Bekende blinde vlekken

- **MD-comments**: TODO/FIXME zou in markdown-bestanden kunnen voorkomen zonder zichtbaar prefix in code-grep
- **Test-asset-bestanden**: `tests/assets/Work in progress BTP MAG Final Version-1.pptx` niet zelf onderzocht (mogelijk klant-data in repo)
- **Volledige API-endpoint-leescoverage**: `api/extract.js`, `api/embed.js`, `api/parse.js` alleen header-gelezen
- **Mogelijke historische migraties** die naar `block_definitions` verwijzen — specifieke migratie niet getraceerd
- **Vercel-side env-vars / serverless-runtime-logs**: niet bekeken (zou via Vercel API of dashboard moeten)
- **Eventuele DEBUG-flags** in environment-variabelen: niet onderzocht
- **Sentry of andere error-tracking integratie**: geen geconfigureerd dat ik zag, dus niet onderzocht. Bevestiging op afwezigheid niet expliciet gedaan.
