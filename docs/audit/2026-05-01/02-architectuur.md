# 02 — Architecturale inventarisatie

**Audit-datum:** 2026-05-01
**Branch:** `audit/2026-05-01`
**Doel:** feitelijk documenteren hoe de codebase technisch is gebouwd. Geen oordeel.

---

## 1. Frontend stack

### Framework & build

| Onderdeel | Versie | Locatie |
|---|---|---|
| **React** | `^19.2.5` | `package.json` deps |
| **react-dom** | `^19.2.5` | `package.json` deps |
| **react-scripts** | `5.0.1` | `package.json` deps — Create React App, niet ge-eject |
| **Build tool** | webpack (via CRA) | impliciet via `react-scripts` |
| **Bootstrap** | `src/index.js` rendert `<BCTTool/>` (alias voor `App`) in `<React.StrictMode>` |
| **Entry** | `public/index.html` (CRA-default, geen significante customisatie geverifieerd in deze audit) |

Scripts in `package.json`:
- `start` → `react-scripts start`
- `build` → `react-scripts build`
- `test` → `react-scripts test`
- `eject` → `react-scripts eject` (niet uitgevoerd)

### Styling

| Onderdeel | Versie | Locatie |
|---|---|---|
| **Tailwind CSS** | `^3.4.19` | `package.json` deps |
| **PostCSS** | `^8.5.9` | `package.json` deps |
| **autoprefixer** | `^10.4.27` | `package.json` deps |
| **Tailwind config** | `tailwind.config.js` | `content: ["./src/**/*.{js,jsx,ts,tsx}"]`, geen theme-extends, geen plugins |
| **PostCSS config** | `postcss.config.js` | tailwindcss + autoprefixer |
| **Globale CSS** | `src/index.css` | `:root`-defaults voor 7 brand-kleuren-CSS-variabelen + 3 logo/brand-vars; `body` font-family `'Inter'` met system-font-fallbacks |

### State management

Geen externe state-library (Redux/Zustand/Jotai e.d.). State-management gebruikt:
- `useState`/`useEffect`/`useRef`/`useCallback` (React-built-ins)
- React Context voor cross-cutting concerns:
  - `AuthContext` — `src/shared/services/auth.service.js` (session, user, tenantId, userRole, tenantTheme, profileLoading + signIn/signUp/signOut/resetPassword)
  - `LangContext` — `src/i18n.js` (lang, setLang, t)
  - `AppConfigContext` — `src/shared/context/AppConfigContext.jsx` (label, prompt, setting, allRows, loading, refresh)
- Custom hook voor canvas-business-logic: `src/features/canvas/hooks/useCanvasState.js`

### Key dependencies (runtime)

| Package | Versie | Doel |
|---|---|---|
| `@supabase/supabase-js` | `^2.103.0` | DB-client + Auth |
| `lucide-react` | `^1.8.0` | Iconen — gebruikt door AiIcon, AiIconButton, en alle features |
| `pdf-parse` | `^2.4.5` | PDF-extractie (server-side, `api/parse.js`?) |
| `pdfjs-dist` | `^5.6.205` | PDF-rendering (client-side?) |
| `jszip` | `^3.10.1` | ZIP-handling — context onbekend in deze scan (?) |
| `web-vitals` | `^2.1.4` | CRA-default, `reportWebVitals()` aangeroepen in `index.js` zonder callback |
| `@testing-library/*` | div. | CRA-defaults |

### Key dependencies (dev)

| Package | Versie | Doel |
|---|---|---|
| `@playwright/test` | `^1.59.1` | E2E-tests (tests/-folder, momenteel uitgeschakeld via `playwright.yml.disabled`) |
| `@types/node` | `^25.6.0` | Node typings (geen TypeScript-bronbestanden gevonden — alleen JSX) |

**Geen ESLint-plugins als losse devDeps:** ESLint draait via `react-scripts` (CRA bundelt het). Custom rules zitten in `package.json` `eslintConfig.rules` (zie sectie Tooling).

**Niet aanwezig (geverifieerd):** Husky, lint-staged, Prettier, Storybook, TypeScript.

---

## 2. Backend / serverless

### API-laag — Vercel serverless functions

Alle backend-logica zit in `api/*.js` als individuele Vercel-functions. Geen aparte Express/Next-server, geen monorepo-structuur.

| Endpoint | Bestand | Methode | Auth-check | Externe API | Doel |
|---|---|---|---|---|---|
| `/api/strategy` | `api/strategy.js` | POST | `requireAuth` | Anthropic | AI-orchestratie strategie: themes, ksf_kpi, analysis, samenvatting, auto_tag |
| `/api/guidelines` | `api/guidelines.js` | POST | (?) | Anthropic | AI-generatie richtlijnen (niet geverifieerd in deze pass) |
| `/api/improve` | `api/improve.js` | POST | (?) | Anthropic | Veld-verbeteren met haiku-model |
| `/api/magic` | `api/magic.js` | POST | (?) | Anthropic | Magic Staff RAG-suggesties (haiku of sonnet, dynamisch) |
| `/api/extract` | `api/extract.js` | POST | (?) | Anthropic | PDF/DOCX-tekst→structuur-extractie |
| `/api/embed` | `api/embed.js` | POST | (?) | OpenAI | Embeddings voor `document_chunks` |
| `/api/parse` | `api/parse.js` | POST | (?) | n.v.t. | PDF/document-parser (geen AI-call gedetecteerd) |
| `/api/validate` | `api/validate.js` | POST | (?) | Anthropic | Pre-flight content-check (haiku-model voor snelheid) |

`(?)` = niet expliciet geverifieerd in deze pass; alleen `api/strategy.js` is volledig gelezen.

### Auth-middleware

`api/_auth.js` exporteert `requireAuth(req, res)`:
- Leest `Authorization: Bearer <token>` header
- Valideert via `supabase.auth.getUser(token)` met `REACT_APP_SUPABASE_URL` + `REACT_APP_SUPABASE_ANON_KEY`
- Geeft `{ id: "dev", email: "dev@local" }` terug bij ontbrekende env-vars (lokale dev-bypass) — **opmerking voor "opgemerkt-tijdens-audit"**: in productie zonder env-vars zou dit elke request laten passeren; mitigatie is dat env-vars op Vercel altijd zijn ingesteld
- Bij faal: stuurt 401 + `null` terug

Niet alle endpoints zijn geverifieerd op `requireAuth`-aanroep — alleen `api/strategy.js` is volledig gelezen.

### Frontend → API client

`src/shared/services/apiClient.js` exporteert `apiFetch(url, options)`:
- Voegt automatisch `Content-Type: application/json` en `Authorization: Bearer <session-token>` toe
- Token uit `supabase.auth.getSession()`
- Geen retry-logica, geen response-parsing — caller doet `await res.json()` zelf

### Vercel routing

`vercel.json`:
```json
{
  "rewrites": [
    { "source": "/((?!api/).*)", "destination": "/index.html" }
  ]
}
```
Alle non-`/api/`-paden naar `index.html` (SPA-routing). API-routes blijven serverless.

---

## 3. Database

Volledig schema gedocumenteerd in `DATABASE.md` (gedateerd 2026-04-22).

**Belangrijke afwijking gedetecteerd:** `DATABASE.md` is achterhaald. Niet meer gedocumenteerd:
- Multi-tenancy tabellen `tenants` en `user_profiles` (toegevoegd 2026-04-24, migraties `20260424010000` en `20260424020000`)
- RLS-helpers `current_tenant_id()` en `current_user_role()` (migratie `20260424030000`)
- Kolom `tenant_id` op `canvases` (migratie `20260424040000`)
- Update RLS-policies op `canvas_uploads` en `import_jobs` (migraties `20260424050000` en `20260424060000`)
- Kolom `strategy_core.insights` (Sprint A, migratie `20260425000000` — vervangt eerder geplande `strategy_core.analysis`)

→ Genoteerd onder "opgemerkt-tijdens-audit" in `00-index.md`.

### Aanvullingen op DATABASE.md

#### Multi-tenancy tabellen (uit migraties 20260424*)

**`tenants`** — gegevens per tenant
| Kolom | Type | Constraints |
|---|---|---|
| `id` | `uuid` | PK |
| `name` | `text` | NOT NULL |
| `slug` | `text` | UNIQUE |
| `theme_config` | `jsonb` | DEFAULT `'{}'` — bevat brand kleuren + logo URLs + brand_name |
| `created_at` | `timestamptz` | DEFAULT `now()` |

**`user_profiles`** — koppelt `auth.users` aan `tenants`
| Kolom | Type | Constraints |
|---|---|---|
| `id` | `uuid` | PK, FK → `auth.users(id)` ON DELETE CASCADE |
| `tenant_id` | `uuid` | FK → `tenants(id)` |
| `role` | `text` | bv. `tenant_admin`, `user`, `platform_admin` (?) |
| `created_at` | `timestamptz` | |

(?) = exacte set rollen niet uitputtend geverifieerd; uit code: `platform_admin` en `tenant_admin` worden expliciet genoemd in `App.js`/`AdminPage.jsx` flow.

#### RLS-helpers

- `current_tenant_id()` — `SECURITY DEFINER`, leest `tenant_id` van huidige user uit `user_profiles`, cachet per transactie
- `current_user_role()` — `SECURITY DEFINER`, leest `role` van huidige user

Beide gebruikt in RLS-policies op data-tabellen (`canvases.tenant_id = current_tenant_id()`).

#### `strategy_core.insights` (Sprint A)

JSONB-kolom met nieuw schema:
```jsonc
{ "insights": [
  { "id", "category": "onderdeel"|"dwarsverband",
    "type": "ontbreekt"|"zwak"|"kans"|"sterk",
    "title", "observation", "recommendation",
    "source_refs": [{ "kind", "id", "label", "exists" }],
    "cross_worksheet": false } ] }
```

Migratie `20260425000000_inzichten_sprint_a.sql` voegt kolom toe en update `prompt.strategy.analysis`.

`strategy_core.analysis` (oude `recommendations[]`-structuur) bestaat formeel nog volgens `DATABASE.md`, maar wordt door de huidige UI niet meer gelezen — alle reads/writes gaan via `insights`. Status van de oude kolom: niet gedropt, niet meer gevuld door huidige code (?).

### Indexes en triggers

Per `DATABASE.md`:
- `update_updated_at()` trigger op meerdere tabellen
- `search_document_chunks()` RPC voor vector-similarity-search
- `pgvector` extensie voor embeddings (vector(1536))
- IVFFlat index op `document_chunks.embedding`

Niet uitputtend gescand op nieuwe indexes/triggers in migraties post-2026-04-22.

---

## 4. AI-integratie

### Modellen — geverifieerd in code

| Endpoint | Model(len) | Token-budget | Locatie |
|---|---|---|---|
| `api/strategy.js` | `claude-sonnet-4-5` (constant `MODEL`) | themes 400 / ksf_kpi 800 / analysis 6000 / samenvatting 150 / auto_tag 1500 | regel 12 |
| `api/extract.js` | `claude-sonnet-4-20250514` | 1000 | grep-bevinding |
| `api/guidelines.js` | `claude-sonnet-4-5` (constant `MODEL`) | 3000 / 1500 / 400 (per mode) | grep-bevinding |
| `api/improve.js` | `claude-haiku-4-5-20251001` | 600 | grep-bevinding |
| `api/magic.js` | `claude-haiku-4-5-20251001` (default) of `claude-sonnet-4-5` (heavy mode) | 600 default | grep-bevinding |
| `api/validate.js` | `claude-sonnet-4-20250514` (comment zegt haiku, maar code gebruikt sonnet) | 1200 | grep-bevinding — **inconsistentie** tussen comment en code |
| `api/embed.js` | OpenAI embeddings (model niet uit deze grep) | n.v.t. | grep-bevinding |

**Inconsistentie genoteerd onder "opgemerkt-tijdens-audit":**
- `api/validate.js` heeft comment `Gebruikt claude-haiku voor snelle, goedkope pre-flight check` maar gebruikt feitelijk `claude-sonnet-4-20250514`
- `api/strategy.js` en `api/guidelines.js` gebruiken `claude-sonnet-4-5` (zonder datum-suffix), terwijl `api/extract.js` en `api/validate.js` `claude-sonnet-4-20250514` gebruiken — twee verschillende model-aliases

### Prompt-management

Prompts worden hybride beheerd:
1. **Hardcoded fallback in API-code** — elke functie in `api/strategy.js` heeft een `rawSystem = systemOverride || \`...\`` patroon. Bij ontbrekend `systemOverride` wordt de hardcoded prompt gebruikt.
2. **Configureerbaar via `app_config`** — frontend resolved `appPrompt("strategy.analysis")` etc. en stuurt de tekst mee als `systemPromptAnalysis` in de POST-body.
3. **Taal-instructie templating** — alle prompts ondersteunen `{taal_instructie}` placeholder die door `String.replace()` wordt vervangen door `languageInstruction` argument (default: `"Schrijf ALTIJD in het Nederlands."`).

Prompt-keys gevonden in `app_config` migraties: `prompt.strategy.analysis`, `prompt.strategy.themes` (?), `prompt.strategy.ksf_kpi` (?), `prompt.strategy.samenvatting` (?), `prompt.strategy.auto_tag` (?). Volledige inventarisatie volgt in document D.

### Token-management

- Geen retry-budget-mechanisme; alleen `api/strategy.js generateAnalysis()` doet maximaal 1 retry bij JSON-parse-fout
- Geen tokens-counting/tracking
- Geen cost-monitoring zichtbaar in code
- `max_tokens` is hardcoded per mode (zie tabel hierboven). Dit staat als P3-item op `parking-lot.md`: "Token-budget per analyse-type configureerbaar maken"

### Error-handling pipeline

- API-route gooit bij `!res.ok` op Anthropic-respons (`throw new Error(data.error?.message || ...)`)
- Wrapper `try/catch` in handler retourneert 500 met `error.message` en `console.error("[strategy]", err.message)`
- Frontend `handleAnalyze` (StrategieWerkblad regel 740) doet `await res.json()`, gooit als `!res.ok`, vangt in catch en zet `setAnalysisError(e.message)`

### JSON-parse-strategie

`api/strategy.js generateAnalysis()` heeft een tweetraps-aanpak:
1. Strip optionele markdown code-fences (` ```json ... ``` `)
2. Match eerste `{...}`-blok via regex
3. Valideer schema met `_validateInsights()` (regel 190)
4. Bij parse/validate-fout: tweede call met fout-context meegestuurd
5. Bij tweede fout: throw met combined error message

---

## 5. Configuratie-laag

### `app_config`-tabel

Schema (uit `DATABASE.md`):
```
key (PK), value, category (CHECK in 'prompt'|'label'|'setting'), description, updated_at
```

RLS: `FOR SELECT TO authenticated USING (true)` — alle ingelogde gebruikers lezen alle config; schrijftoegang alleen via migrations of service-account.

### Lookup-flow

`AppConfigProvider` (`src/shared/context/AppConfigContext.jsx`):
1. Bij mount: `supabase.from("app_config").select("key, value, category, description")` — laadt alle rijen tegelijk
2. Slaat op als map `{ [key]: row }` in state
3. Exposeert drie resolver-functies:
   - `label(key, fallback)` — leest `label.{key}`, valt terug op `LABEL_FALLBACKS` constante in zelfde bestand, dan op `key` zelf
   - `prompt(key)` — leest `prompt.{key}`, geeft `null` als niet gevonden (caller valt zelf terug op hardcoded)
   - `setting(key, defaultVal)` — leest `setting.{key}`, parseert numeriek indien mogelijk

### Key-categorieën in praktijk

- `label.app.*` — applicatie-brede labels (titel, subtitel, footer)
- `label.werkblad.*` — werkbladen-koppen + drie-knoppen-shell-acties
- `label.strat.*` — Strategie Werkblad veld- en sectie-namen
- `label.richtl.*` — Richtlijnen Werkblad segment-namen
- `label.analysis.*` — Inzichten-overlay (header, hoofdstukken, filter-pills, etc.)
- `prompt.strategy.*` — AI-prompts strategie-modes
- `prompt.guidelines.*` — AI-prompts richtlijnen
- `prompt.field.*` — veld-improve prompts (?)
- `setting.*` — configuratie-waardes (specifieke keys niet uitputtend gescand)

### Fallback-mechanisme

Drielagig:
1. DB-waarde uit `app_config` (overrideable per tenant in toekomst — momenteel global)
2. `LABEL_FALLBACKS`-object in `AppConfigContext.jsx` (hardcoded TS-veiligheidsnet — momenteel ~50 keys)
3. Caller's `fallback` argument → laatste vangnet → key zelf

Speciale regel: als DB-waarde begint met `"PLACEHOLDER"`, wordt fallback-pad gebruikt (zie `appLabel`/`appPrompt` regel 110/120).

---

## 6. Theming

### Lifecycle

1. Login → `AuthProvider.fetchUserProfile()` haalt `user_profiles` op met JOIN op `tenants(theme_config)`
2. `tenantTheme` beschikbaar in `useAuth()` context
3. `ThemeProvider` (`src/shared/context/ThemeProvider.jsx`) reageert op `tenantTheme` via `useEffect`
4. Bij niet-leeg `tenantTheme`: zet 10 CSS-variabelen op `document.documentElement` via `root.style.setProperty(...)`
5. Bij leeg `{}` of null: doet niets — `:root`-defaults uit `src/index.css` blijven actief (Kingfisher-defaults)

### CSS-variabelen flow

| `theme_config` key | CSS-variabele | Default (`src/index.css`) |
|---|---|---|
| `primary_color` | `--color-primary` | `#1a365d` |
| `accent_color` | `--color-accent` | `#8dc63f` |
| `accent_hover_color` | `--color-accent-hover` | `#7ab52e` |
| `success_color` | `--color-success` | `#2c7a4b` |
| `analysis_color` | `--color-analysis` | `#00AEEF` |
| `overlay_color` | `--color-overlay` | `#001f33` |
| `accent_light_color` | `--color-accent-light` | `#edf7e0` |
| `logo_url` | `--logo-url` | `/kf-logo.png` |
| `logo_white_url` | `--logo-white-url` | `/kf-logo-white.png` |
| `brand_name` | `--brand-name` | `Kingfisher` |

### Tailwind-gebruik

- Componenten gebruiken `bg-[var(--color-primary)]`, `text-[var(--color-accent)]/70`, etc. — dynamische arbitrary-value-syntax
- Geen hardcoded hex-waardes voor brand-kleuren in feature-componenten (sectie 3A in `CLAUDE.md` schrijft dit voor)
- Tailwind-config heeft géén custom theme-extensies — alle theming gaat via CSS-variabelen, niet via Tailwind's eigen theming-systeem

### LogoBrand-component

`src/shared/components/LogoBrand.jsx` (niet volledig gelezen in deze pass) heeft props `variant="light"|"dark"`, gebruikt `--logo-url` en `--logo-white-url`, en heeft `imageFailed`-fallback naar `--brand-name`-tekst.

### useTheme hook

`src/shared/hooks/useTheme.js` (niet gelezen in deze pass) — typed toegang tot alle theme-waarden volgens `CLAUDE.md` 3A.

---

## 7. Multi-tenancy implementatie

### Architectuur

Alle data is geïsoleerd per tenant. Twee enforcement-lagen:
1. **Database (RLS)** — primair: `current_tenant_id()` helper-functie in policies
2. **Frontend (filtering)** — secundair: `auth.service.js` exposeert `tenantId`; canvases/queries gebruiken dit impliciet via RLS

### Tenants (per CLAUDE.md sectie 3A, geverifieerd via grep)

| Tenant | ID-suffix | `primary_color` | `accent_color` | Logo |
|---|---|---|---|---|
| Kingfisher | `...0002` | `#1a365d` | `#8dc63f` | `kf-logo.png` (donker), wit logo `null` → fallback naar tekst |
| Platform | `...0001` | `#0f172a` | `#f97316` | beide null → "Platform"-tekst |

Database-records geverifieerd via migratie `20260424070000_seed_initial_tenants_and_profiles.sql`. Live-DB niet gequeried in deze pass.

### Rollen

- `tenant_admin` — admin binnen één tenant
- `user` — normale gebruiker
- `platform_admin` — globale admin (genoemd in #71 als open issue: tenant-switcher UI)

### Helper-functies

| Functie | Doel | Caching |
|---|---|---|
| `current_tenant_id()` | leest `user_profiles.tenant_id` voor `auth.uid()` | per transactie (SECURITY DEFINER) |
| `current_user_role()` | leest `user_profiles.role` voor `auth.uid()` | per transactie (SECURITY DEFINER) |

### RLS-patroon op data-tabellen

```sql
-- Lees: eigen data of als admin
USING (tenant_id = current_tenant_id() AND (user_id = auth.uid() OR current_user_role() = 'tenant_admin'))
-- Insert/Update: altijd tenant_id meegeven
WITH CHECK (tenant_id = current_tenant_id())
```

(Uit `CLAUDE.md` sectie 3A; niet alle tabellen direct gequeried in deze pass om policies te bevestigen.)

### Open punten

- Auto-aanmaak `user_profiles` bij signup ontbreekt (Issue #70 open) — momenteel handmatig via Supabase Dashboard
- Tenant-switcher UI voor `platform_admin` ontbreekt (Issue #71 open)
- Subdomein-routing per tenant ontbreekt (Issue #75 open)

---

## 8. Deploy & infra

### Vercel

- **Project naam:** `kingfisher-btc-tool` (uit `deploy-prod.sh`)
- **Productie URL:** `https://kingfisher-btc-tool.vercel.app`
- **Productie alias:** `https://kingfisher-btcprod.vercel.app` — handmatig gepind via `vercel alias set` in `deploy-prod.sh`
- **GitHub-integratie:** automatische deploy op push naar `master` (merkbaar — komt impliciet uit script-comment)
- **Custom domain:** geen geverifieerd in deze pass
- **vercel.json** — alleen SPA-rewrite-regel (`/((?!api/).*) → /index.html`)

### `deploy-prod.sh` — drie stappen

1. `git add -A` + commit + push naar `origin master`
2. `vercel --prod` (deploy)
3. `vercel alias set kingfisher-btc-tool.vercel.app kingfisher-btcprod.vercel.app` (re-pin alias)

Reden voor stap 3: `--prod` re-pint de alias **niet** automatisch. Zonder stap 3 wijst `kingfisher-btcprod` naar oude deployment.

### Supabase

- **Project ID:** `lsaljhnxclldlyocunqf` (uit `.github/workflows/supabase-migrations.yml`)
- **Migraties:** `supabase/migrations/*.sql`, automatisch uitgevoerd door GitHub Actions workflow op push naar master als bestanden in `supabase/migrations/**` veranderen
- **Workflow:** `.github/workflows/supabase-migrations.yml` — gebruikt `supabase/setup-cli@v1`, `supabase link` + `supabase db push`
- **Secrets:** `SUPABASE_DB_PASSWORD`, `SUPABASE_ACCESS_TOKEN` als GitHub Actions secrets

### Demo-omgeving

- Niet beschikbaar per 2026-04-22 (per CLAUDE.md sectie 10)
- Eerdere alias `kingfisher-btcdemo.vercel.app` is verwijderd — wees naar oude deployment
- Nieuwe demo-architectuur gepland — zie tech_debt.md P5

### Domeinen — totaalbeeld

| Domein | Doel | Status |
|---|---|---|
| `kingfisher-btc-tool.vercel.app` | primaire Vercel deployment URL | actief |
| `kingfisher-btcprod.vercel.app` | productie alias (handmatig gepind) | actief |
| `kingfisher-btcdemo.vercel.app` | demo (legacy) | verwijderd 2026-04-22 |

### Environment-variabelen

Uit grep + code-leesfase:
- `REACT_APP_SUPABASE_URL` — frontend + serverless
- `REACT_APP_SUPABASE_ANON_KEY` — frontend + serverless (in `_auth.js`)
- `REACT_APP_ADMIN_EMAIL` — frontend (zichtbaarheid van admin-link in App.js)
- `ANTHROPIC_API_KEY` — serverless (`api/strategy.js`)
- OpenAI API-key voor `api/embed.js` (specifieke env-naam niet geverifieerd)

`.env`-bestand bestaat lokaal (438 bytes), niet gecommit (`.gitignore` regel `.env`).

---

## 9. Tooling

### ESLint

Configuratie in `package.json` `eslintConfig`:

```json
"extends": [ "react-app", "react-app/jest" ],
"rules": {
  "react/jsx-no-literals": ["warn", {
    "noStrings": false,
    "ignoreProps": true,
    "noAttributeStrings": false,
    "allowedStrings": [
      "·"," · ","—","–","/",":","…","...","✓","✗","✕","✔","←","→","↑","↓",
      "&","&amp;","(",")","[","]","{","}","•","›","‹","+","-","?","!","|"
    ]
  }
}
```

- ESLint draait via CRA's `react-scripts`. Bij `npm run build` worden warnings naar console geprint; build slaagt nog (warn-level).
- Per laatste run (commit `245b562`): **220 violations** in legacy code — gedekt door tech_debt P4 sweep-item.
- Promotie naar `error`-level wacht op sweep — apart besluit later.

### Build pipeline

CRA-default. Geen extra build-tooling (geen Vite, esbuild apart, Rollup). `npm run build` produceert `build/static/js/*.js`-bundels (gzipped main bundle 301.45 kB per recente build-output).

### Tests

- **Jest + Testing Library:** `src/setupTests.js` standaard CRA, `src/App.test.js` (boilerplate, niet meaningful — niet uitvoerig geverifieerd)
- **Playwright:** `playwright.config.js` aanwezig + `tests/`-folder + `playwright-report/`-folder
- **CI status:** Playwright workflow is **uitgeschakeld** — `.github/workflows/playwright.yml.disabled`. Reden in tech_debt.md: "Playwright-incident 2026-04-22" (CI ran tegen productie, zie ingeschakelde commit-history). Vrijwilligersmatig terug-aan-zetten staat niet gepland.
- **Test-coverage:** geen percentage geverifieerd; geen coverage-tool zichtbaar geconfigureerd in package.json

### Pre-commit hooks

- **Husky:** niet geïnstalleerd (geen `.husky/` folder, geen devDep)
- **lint-staged:** niet geïnstalleerd
- **Prettier:** niet geconfigureerd (geen `.prettierrc`, geen devDep)

Daadwerkelijke gating: alleen via `react-scripts build` in `deploy-prod.sh`. Ontwikkelaar krijgt warnings in `npm start` console.

### Logger

`src/shared/utils/logger.js` — niet gelezen in deze pass.

### Validators

`src/shared/utils/btcValidator.js` — niet gelezen in deze pass.

---

## 10. State-management compliance — per CLAUDE.md sectie 4

Status van CLAUDE.md sectie 4.6 compliance-tabel (geverifieerd op 2026-04-26 in `CLAUDE.md`):

| Regel | Status | Locatie van non-compliance |
|---|---|---|
| **4.1 — Lifecycle (`key={canvasId}`)** | ✅ Compliant per 2026-04-22 | n.v.t. — alle feature-roots correct |
| **4.2 — Async integriteit** | ❌ Systematisch non-compliant | 10 callbacks; zie `tech_debt.md` P2 |
| **4.3 — Data isolatie + race-guards** | ✅ Compliant per 2026-04-26 | n.v.t. — laatste fix `useCanvasState.handleSelectCanvas` |
| **4.4 — Stale closures** | ❌ Geen enkele callback gebruikt `canvasIdRef` | 9 callbacks in `StrategieWerkblad`/`RichtlijnenWerkblad`; zie tech_debt.md P3 |
| **4.5 — Service contract `{data, error}`** | ✅ Compliant | n.v.t. |

### 4.2 — non-compliance details (uit `tech_debt.md` P2)

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
- `RichtlijnenWerkblad.handleAcceptOneDraft` — partieel (wel error-check op eerste call, niet op vervolg)

### 4.4 — non-compliance details (uit `tech_debt.md` P3)

9 callbacks gebruiken `canvasId` direct uit closure:
- StrategieWerkblad: `addAnalysisItem`, `addThema`, `acceptThemaDraftLine`, `acceptAllThemaDraft`, `handleAnalyze`, `handleClose`
- RichtlijnenWerkblad: `handleAdd`, `handleAcceptOneDraft`, `handleAcceptAllDraft`

---

## Verificatie-paragraaf

### Wat ik heb gedaan voor compleetheid

Commands en bronnen gebruikt:
- Volledige reads van: `src/App.js`, `src/index.js`, `src/index.css` (top + bottom), `src/i18n.js` (top), `tailwind.config.js`, `postcss.config.js`, `package.json`, `vercel.json`, `deploy-prod.sh`, `.gitignore`, `.github/workflows/supabase-migrations.yml`, `DATABASE.md`, `CLAUDE.md` (volledig), `api/strategy.js`, `api/_auth.js`, `src/shared/services/auth.service.js`, `src/shared/services/apiClient.js`, `src/shared/services/supabase.client.js`, `src/shared/context/ThemeProvider.jsx`, `README.md`, `tech_debt.md` (deels gelezen tijdens werk)
- Grep-passes voor: AI-models per endpoint (`MODEL =`, `claude-`, `gpt-`, `fetch.*anthropic`, `max_tokens`), env-variabelen (`process.env.*`)
- `find`/`ls` voor structuur: `src/`, `src/features/`, `src/shared/`, `api/`, `supabase/migrations/`, `public/`, `.github/`
- Migratie-lijst van `supabase/migrations/` (32 migraties, gesorteerd op timestamp)

### Niet onderzocht en waarom

- **Live database-content:** geen Supabase MCP query gedraaid in deze pass. Alleen schema uit `DATABASE.md` + migratie-files. Database-content scan staat in document C en wordt daar opgenomen.
- **`node_modules`:** uit principe niet gescand (genegeerd in `.gitignore` + audit-prompt impliciet).
- **Volledige inhoud van alle API-endpoints:** alleen `api/strategy.js` en `api/_auth.js` integraal gelezen. Andere endpoints (`embed`, `extract`, `guidelines`, `improve`, `magic`, `parse`, `validate`) alleen via grep-passes voor model en max_tokens. Volledige reads volgen in document D (prompts).
- **Werkblad-componenten:** `StrategieWerkblad.jsx` en `RichtlijnenWerkblad.jsx` niet integraal gelezen voor deze architectuur-pass; zijn input voor document A.
- **Logger en validators:** `src/shared/utils/logger.js` en `btcValidator.js` niet gelezen — geen architectureel signaal verwacht; in document E meegenomen indien debug-statements aanwezig.
- **`useCanvasState.js`:** alleen relevante secties gelezen tijdens eerdere fixes. Volledig gelezen in document A.
- **Test-suites:** niet geïnspecteerd op coverage of inhoud.
- **Git-log:** niet bekeken in deze architectuur-pass; staat geprogrammeerd voor document C (laatste 6 maanden commit-messages op merknaam-voorkomens).

### Verificatie-steekproeven (3 willekeurige bevindingen geverifieerd)

1. **`vercel.json` bevat alleen SPA-rewrite-regel** — bestand geopend, 5 regels JSON, exact zoals beschreven in sectie 8. ✅
2. **`tailwind.config.js` heeft `extend: {}` zonder custom theme** — bestand geopend, regel 4-6 bevestigt: `theme: { extend: {} }`. ✅
3. **`DATABASE.md` is gedateerd 2026-04-22** — bestand geopend, regel 3: `> Gegenereerd op 2026-04-22 uit supabase/migrations/`. Migraties post-2026-04-22 (multi-tenancy, Sprint A) zijn aangetoond niet in `DATABASE.md` opgenomen. ✅

### Bekende blinde vlekken

- API-endpoint coverage: 7 van 8 endpoints alleen via grep-pass. Mogelijke gemiste auth-checks of model-keuzes worden in document D opgepakt bij volledige prompt-extractie.
- Supabase live-DB: niet gequeried — schema-staat is gebaseerd op migration-files; eventuele handmatige changes via Supabase Dashboard zijn niet detecteerbaar zonder live-query.
- Custom domains op Vercel: niet geverifieerd via Vercel API/dashboard — alleen via deploy-script-output afgeleid.
