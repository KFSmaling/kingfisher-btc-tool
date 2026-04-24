# Diagnose: architecture-spec.md vs CLAUDE.md

> Feitelijke vergelijking van de twee documenten.  
> Geen actieplan — alleen diagnose.  
> Gegenereerd: 2026-04-23

---

## 1. Waar ze het eens zijn

| Onderwerp | Beide documenten |
|-----------|-----------------|
| Backend | Supabase (PostgreSQL + Auth + RLS) |
| RLS | Altijd aan, op alle tabellen |
| Services | Geen directe Supabase-aanroepen in componenten — altijd via service-laag |
| Vercel | Hosting platform voor frontend |
| AI-prompts | Opgeslagen in database (`app_config`), niet hardcoded in code |
| UI-tekst | Niet hardcoded — configureerbaar per tenant/klant |
| Migraties | Versioned, idempotent, nooit terugschrijven |
| Error-handling | Geen silent fails; fouten expliciet afhandelen |
| State-isolatie bij canvas-wissel | Data van vorig canvas mag nooit zichtbaar zijn bij wissel |

---

## 2. Waar ze elkaar tegenspreken

| Onderwerp | architecture-spec.md | CLAUDE.md (huidige codebase) |
|-----------|---------------------|------------------------------|
| **Frontend build tool** | Vite | Create React App (CRA) |
| **TypeScript** | Verplicht (React 18+ TS) | Niet aanwezig — plain JavaScript |
| **UI component library** | shadcn/ui | Tailwind CSS utility classes; geen component-library |
| **Theming** | CSS-variables (design tokens, 3 niveaus L1/L2/L3) | Hardcoded Tailwind-klassen (`bg-[#8dc63f]`, `text-[#00AEEF]`) |
| **AI serverless** | Supabase Edge Functions (Deno runtime) | Vercel serverless functions (`api/` folder, Node.js) |
| **Multi-tenancy** | `tenants` tabel, tenant_id op alle rijen, dag-1 vereiste | Geen `tenants` tabel; isolatie via `user_id` in RLS |
| **Repo-structuur** | Monorepo (`/apps/web`, `/apps/admin`, `/packages/*`) | Single-repo React-app in root |
| **Deploy-procedure** | `git push` naar `master` → Vercel auto-deploy (script kan weg) | `./deploy-prod.sh` vereist voor correcte alias-assignment (in transitie) |

---

## 3. Wat in de ene staat, niet in de andere

### Alleen in architecture-spec.md

- **Billing & credits** — Stripe-integratie, `subscriptions`-tabel, `credits_ledger`, feature-entitlements per tier
- **Content packs** — configureerbare methode-laag; `content_packs`-tabel, JSON-schema voor frameworks en prompt-templates
- **AI orchestration abstraction** — `AIProvider`-interface, `AIOrchestrator`-class, swappable providers (Anthropic/OpenAI/Azure)
- **Observability** — Sentry (errors), PostHog (analytics), gestructureerde logging
- **Gamma/PPTX export** — export-pipeline naar presentatieformaten
- **Audit log** — `audit_log`-tabel voor compliance
- **Admin-applicatie** — `/apps/admin` voor tenant-beheer en content-pack-beheer
- **12 anti-patronen** — expliciete lijst van verboden architectuurkeuzes
- **6-vragen beslissraamwerk** — wanneer nieuwe abstractie rechtvaardigen
- **Drie tenant-types** — Trial / Professional / Agency met entitlement-matrix

### Alleen in CLAUDE.md

- **`appLabel()` / `appPrompt()` patroon** — hoe UI-tekst en prompts technisch werken, key-naamgeving conventie, `LABEL_FALLBACKS`
- **`key={canvasId}` regel** — verplichte remount bij canvas-wissel, scope (feature-niveau, niet pagina/input)
- **Race-guard patroon** — `cancelled` flag + captured `activeCanvasId` in useEffects
- **`{data, error}` service-contract** — retourneer nooit throw-style, altijd expliciet checken op call-site
- **Specifieke DB-tabellen** — `canvases`, `strategy_core`, `strategic_themes`, `guidelines`, `guideline_analysis`
- **Canvas-blokken patroon** — `*StatusBlock.jsx`, `STATUS_COLORS`, `STATUS_BADGE_KEYS`
- **Compliance-status per regel** — 4.1 ✅, 4.2 ❌, 4.3 ⚠️, 4.4 ❌
- **Deploy-verificatiestap** — handmatig checken dat `kingfisher-btcprod.vercel.app` onder "Assigned Domains" staat
- **DO-NOT-TOUCH-lijst** — welke bestanden/patronen niet aanraken zonder overleg

---

## Samenvatting van de kloof

`architecture-spec.md` beschrijft een **toekomstvisie** voor een multi-tenant SaaS-platform (TypeScript, Vite, content packs, billing, monorepo). `CLAUDE.md` beschrijft de **huidige werkende codebase** (CRA, JavaScript, single-tenant, Vercel functions). De documenten overlappen op backend-principes (Supabase, RLS, services, prompts in DB) maar beschrijven een andere frontend-stack en een ander business-model (single-klant-tool vs. commercieel platform).
