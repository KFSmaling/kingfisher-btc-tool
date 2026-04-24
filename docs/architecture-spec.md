# Architectuur en design richtlijnen

> Technische handleiding bij ontwikkeling — canonieke referentie voor architectuurbeslissingen.

Dit document beschrijft de strategische en technische richtlijnen voor het platform. Het doel is tweeledig: als referentie bij elke bouwbeslissing (in twijfelgeval: terug naar dit document), en als onboarding-materiaal voor latere ontwikkelaars. Het is instructief en beslissend — geen brainstormmateriaal maar vastgestelde keuzes.

---

## 1. Bedrijfsstrategie

### Onderneming en positionering

De Werk-BV ontwikkelt softwareplatformen voor strategische analyse, business transformation en scenario-simulatie. De doelgroep is professioneel: consultancy-organisaties, strategy-teams binnen enterprises, en zelfstandige professionals die met frameworks werken. De software is methode-agnostisch opgezet: frameworks, terminologie en inhoudelijke content zijn configureerbaar, niet hard-coded.

### Verdienmodel

Freemium SaaS met metered usage. Basis-functionaliteit gratis, uitgebreide features en volume betaald. White-label licenties beschikbaar voor consultancies die onder eigen merk willen aanbieden. IP blijft bij de holding; Werk-BV verzorgt ontwikkeling, hosting en commerciële exploitatie.

### Strategische principes

- **Platform, geen project.** Alles wat gebouwd wordt moet meervoudig bruikbaar zijn. Een feature die slechts voor één klant werkt, is een projectkost — geen assetwaarde.
- **Methode-agnostisch blijven.** Ondersteuning voor meerdere strategische frameworks. Geen hard-coded terminologie of structuur van één specifieke methode.
- **Content scheiden van capability.** Wat iemand invult (content) en wat het platform kan (capability) zijn twee verschillende lagen. Dit maakt white-labeling, multi-tenancy en IP-bescherming mogelijk.
- **IP-eigenaarschap als design-constraint.** Architectuur ondersteunt dat IP bij de holding blijft, los van waar de software wordt gebruikt.
- **Productkwaliteit boven feature-volume.** Liever 30% met productiekwaliteit dan 80% met beta-ruwheid.
- **Operationele eenvoud.** Eén initiële ontwikkelaar. Keuzes die complexiteit toevoegen zonder directe waarde worden uitgesteld.

### Ambitietijdlijn

| Fase | Horizon | Doel |
|------|---------|------|
| Fase 1 — Intern | 0-6 mnd | Werkende tool, interne validatie via launch customer |
| Fase 2 — Partner | 6-18 mnd | 3-5 betalende design partners, productiekwaliteit |
| Fase 3 — Schaal | 18-36 mnd | Bredere markt (andere consultancies of enterprise-direct) |
| Fase 4 — Exit of groei | 36+ mnd | Strategische optie: verkoop, licentie, of doorgroei |

---

## 2. Architecturale kernprincipes

De volgende principes zijn niet-onderhandelbaar. Bij elke bouwbeslissing moeten ze expliciet getoetst worden. Afwijking vereist bewuste documentatie van de reden.

### 2.1 De drie-lagen-scheiding

Het platform bestaat uit drie duidelijk gescheiden lagen:

- **Platform layer.** De onveranderlijke kern: simulatie-engine, AI-orchestratie, auth, billing, multi-tenant infra, export-pipeline. Niet per klant configureerbaar. Eigendom van de holding via de Werk-BV.
- **Content layer.** Wat het platform uitvoert: frameworks (SWOT, Porter, etc.), AI-prompts, rapport-templates, vraagstellingen. Per tenant configureerbaar. Content-packs kunnen eigendom zijn van specifieke klanten/partners.
- **Brand layer.** Hoe het eruitziet: kleuren, logo, fonts, namen. Volledig per tenant aanpasbaar. Geen invloed op platform- of content-logica.

> Deze scheiding is de belangrijkste architecturale beslissing in het project. Ze maakt IP-bescherming, white-labeling, multi-tenancy en methode-agnosticiteit tegelijk mogelijk.

### 2.2 Configuratie boven code

Alles wat per tenant, per framework of per deployment verschilt, moet via configuratie werken — niet via code:

- Labels en terminologie via database, niet in JSX/HTML strings
- Framework-structuur (fasen, stappen, volgorde) als data, niet als code
- AI-prompts in database met template-syntax, niet inline in code
- Kleuren en thema via CSS-variabelen, niet hardcoded Tailwind-klassen
- Feature-toggles per tier via database entitlements, niet via environment variables

### 2.3 Multi-tenancy vanaf dag één

Zelfs met één gebruiker: alle data geïsoleerd per tenant. Geen shortcuts. Row Level Security (RLS) in Supabase is de primaire bescherming. Elke query impliciet gefilterd op tenant_id. Geen uitzonderingen — ook niet voor admin-panels.

### 2.4 Geen firma-specifieke aannames in de code

De naam van de initiële launch customer mag nergens in de codebase voorkomen — niet in variabelen, niet in seed-scripts, niet in commentaar, niet in tests. Hetzelfde voor branche-specifieke termen (verzekering, financial services) buiten dedicated branche-templates. Code is generiek, eerste tenant is slechts één instantie.

---

## 3. Tech stack

Definitief voor Fase 1 en 2. Wijziging alleen bij fundamenteel technisch probleem, niet bij voorkeur of trends.

| Laag | Keuze | Rationale |
|------|-------|-----------|
| Frontend framework | React 18+ met TypeScript | Volwassen ecosysteem |
| Build tooling | Vite | Snelheid, ES modules |
| Styling | Tailwind CSS + CSS-variabelen | Themable via tokens |
| UI componenten | shadcn/ui (Radix UI) | Aanpasbaar, geen lock-in |
| Charts | Recharts (basis), ECharts (complex) | Recharts voor 80% |
| State management | React Context + hooks, TanStack Query | Geen Redux nodig |
| Backend-as-a-Service | Supabase | Postgres, Auth, Storage, RLS |
| Serverless compute | Supabase Edge Functions (Deno) | Dicht bij de data |
| Auth | Supabase Auth (email, OAuth, SSO) | Goede RLS-integratie |
| AI provider | Anthropic Claude API (primair) | Kwaliteit |
| AI fallback | OpenAI API | Flexibiliteit |
| Presentation export | Gamma API (Pro tier) | Kwaliteit zonder zelf designen |
| PDF export | @react-pdf/renderer of reportlab | Per case |
| Betalingen | Stripe (subscriptions + metered) | Standaard B2B SaaS |
| Hosting frontend | Vercel | Git-integratie, edge |
| Monitoring | Sentry (errors), PostHog (product) | Gratis tiers Fase 1 |

---

## 4. Multi-tenant datamodel

Ondersteunt drie tenant-types vanaf dag één, ook al wordt aanvankelijk alleen consultancy-type actief gebruikt. Uitbreiding mogelijk zonder migratie.

### 4.1 Tenant-types

| Type | Structuur | Billing |
|------|-----------|---------|
| consultancy | Firma → consultants → eindklanten | Per seat + white-label fee |
| enterprise | Eén organisatie, eigen users | Flat subscription + usage |
| individual | Eén user, freemium | Credits of flat Pro-tier |

### 4.2 Kerntabellen (Supabase Postgres)

Minimale schema. Alles RLS-beveiligd, UUIDs als PKs.

```sql
-- Tenant is de hoofd-entiteit
tenants (
  id uuid PK,
  tenant_type enum('consultancy','enterprise','individual'),
  name text,
  slug text unique,
  parent_tenant_id uuid FK,
  theme_config jsonb,
  content_pack_id uuid FK,
  subscription_id uuid FK,
  created_at timestamptz
)

-- Users horen bij een tenant
users (
  id uuid PK,
  tenant_id uuid FK,
  email text unique,
  role enum('platform_admin','tenant_admin','tenant_user','end_client_user'),
  preferences jsonb,
  created_at timestamptz
)

-- Content packs: configureerbare methode-sets
content_packs (
  id uuid PK,
  owner_tenant_id uuid FK,
  name text,
  is_public boolean,
  frameworks jsonb,
  prompts jsonb,
  created_at timestamptz
)

-- Analyses
analyses (
  id uuid PK,
  tenant_id uuid FK,
  user_id uuid FK,
  content_pack_id uuid FK,
  framework_key text,
  input_data jsonb,
  output_data jsonb,
  status enum('draft','running','completed','archived'),
  created_at timestamptz
)

-- Simulations
simulations (
  id uuid PK,
  analysis_id uuid FK,
  parameters jsonb,
  results jsonb,
  iterations integer,
  created_at timestamptz
)

-- Subscriptions
subscriptions (
  id uuid PK,
  tenant_id uuid FK,
  tier enum('free','pro','business','enterprise'),
  status enum('active','past_due','cancelled'),
  stripe_customer_id text,
  stripe_subscription_id text,
  current_period_end timestamptz,
  created_at timestamptz
)

-- Credits: metered usage
credits_ledger (
  id uuid PK,
  tenant_id uuid FK,
  user_id uuid FK,
  delta integer,
  action_type text,
  reference_id uuid,
  created_at timestamptz
)

-- Exports
exports (
  id uuid PK,
  tenant_id uuid FK,
  analysis_id uuid FK,
  export_type enum('pdf','pptx','gamma_deck'),
  storage_path text,
  external_url text,
  created_at timestamptz
)

-- Audit log
audit_log (
  id uuid PK,
  tenant_id uuid FK,
  user_id uuid FK,
  action text,
  entity_type text,
  entity_id uuid,
  metadata jsonb,
  created_at timestamptz
)
```

### 4.3 Row Level Security principes

- Elke tabel heeft tenant_id (direct of via relatie) en RLS-policy die filtert op huidige user's tenant.
- Alleen platform_admin role kan cross-tenant queries doen, en dan alleen via dedicated admin-endpoints buiten de gewone app.
- RLS-policies getest met expliciete unit-tests (per role, per tenant-type).
- Service-role keys alleen in Edge Functions, nooit in frontend.

---

## 5. Design tokens en theming

Theming volledig via token-systeem. Geen hardcoded kleuren of spacings in componenten. Elke tenant heeft theme_config in database, bij login geladen en als CSS-variabelen op `<html>` root geïnjecteerd.

### 5.1 Token-structuur

```json
{
  "brand": {
    "primary": "#1e40af",
    "primary_foreground": "#ffffff",
    "secondary": "#64748b",
    "accent": "#d97706",
    "background": "#ffffff",
    "foreground": "#0f172a",
    "muted": "#f1f5f9",
    "border": "#e2e8f0",
    "destructive": "#dc2626",
    "success": "#059669",
    "warning": "#d97706"
  },
  "typography": {
    "heading_font": "Inter",
    "body_font": "Inter",
    "mono_font": "JetBrains Mono",
    "base_size": 16,
    "scale": "compact | default | relaxed"
  },
  "layout": {
    "radius": "sharp | subtle | rounded",
    "density": "compact | comfortable | spacious",
    "shadow_style": "none | soft | pronounced",
    "container_max_width": 1280
  },
  "logo": {
    "light_url": "...",
    "dark_url": "...",
    "favicon_url": "...",
    "wordmark_url": "..."
  },
  "export": {
    "gamma_theme_id": "...",
    "pdf_template_id": "...",
    "email_from_name": "..."
  }
}
```

### 5.2 Drie thema-fasering

| Niveau | Wat | Wanneer |
|--------|-----|---------|
| L1 — Brand basics | Logo, 3-5 kleuren, 1 font, favicon | Direct, voor elke tenant |
| L2 — Visual identity | Component-varianten, spacing, radius, density | Pro-tier en hoger |
| L3 — Deep branding | Custom fonts, custom layouts, exports in huisstijl | Business-tier only |

### 5.3 Wat níét theme-configureerbaar is

- Informatie-architectuur (menu-structuur, navigatie-flow) — product-DNA
- Iconen-library (Lucide React voor iedereen)
- Animatie-snelheid en easing curves — één goede keuze voor allen
- Font-weight range (400/500/600/700) — consistent visuele hiërarchie
- Breakpoints en responsive gedrag — universeel

> Regel: als iets dynamiseren een aparte designer per klant zou vereisen, moet het niet dynamisch zijn. Klanten willen brand-herkenning, geen productverandering.

---

## 6. Content pack architectuur

Content packs zijn de configureerbare methode-laag. Frameworks, vraagstellingen, AI-prompts en rapport-templates. Pack kan geleverd worden door platform (default packs) of door tenants (private packs). Shopify-model: infrastructuur is platform, winkel is koopman.

### 6.1 Framework-definitie

```json
{
  "key": "generic_business_transformation",
  "display_name_key": "frameworks.gbt.name",
  "description_key": "frameworks.gbt.description",
  "version": "1.0",
  "phases": [
    {
      "key": "current_state",
      "order": 1,
      "label_key": "frameworks.gbt.phases.current_state",
      "components": [
        {
          "type": "canvas",
          "fields": [
            { "key": "market_position", "input": "textarea", "ai_assist": true },
            { "key": "core_capabilities", "input": "list", "ai_assist": true }
          ]
        }
      ]
    }
  ],
  "analyses": [
    {
      "key": "gap_analysis",
      "depends_on": ["current_state", "future_state"],
      "prompt_template_id": "gap_analysis_v1"
    }
  ],
  "exports": [
    { "key": "executive_summary", "template_id": "exec_summary_v1" }
  ]
}
```

### 6.2 Prompt-templates

Alle AI-prompts als templates met variabele interpolatie. Geen inline prompts in React-componenten. Versie-gecontroleerd in database, aanpasbaar via admin-UI zonder code-deploy.

```json
{
  "id": "gap_analysis_v1",
  "name": "Gap Analysis Generator",
  "system": "Je bent een strategisch adviseur...",
  "user_template": "Huidige situatie:\n{{current_state}}\n\nGewenste situatie:\n{{future_state}}\n...",
  "model": "claude-opus-4-7",
  "temperature": 0.3,
  "max_tokens": 2000,
  "tenant_overridable": true,
  "version": 1
}
```

### 6.3 Content pack eigendom en licentie

Content packs zijn eigendom van hun maker. Consultancy die eigen methode digitaliseert, bouwt content pack dat aan hen toebehoort. Juridisch belangrijk: klant vertrekt → pack gaat mee (of blijft alleen voor hun tenant).

> De initiële framework-implementaties moeten geen terminologie bevatten waar mogelijk derde-partij rechten op rusten. Gebruik generieke terminologie als platform-standaard; methode-specifieke terminologie in tenant-specifieke content packs.

---

## 7. AI orchestratie

### 7.1 Provider-agnostisch door abstraction

Alle AI-calls via interne abstraction layer. Geen component roept direct Claude of OpenAI API aan. Maakt provider-switching, retry-logic, cost-tracking en prompt-versioning mogelijk zonder app-brede refactoring.

```typescript
interface AIProvider {
  complete(request: CompletionRequest): Promise<CompletionResponse>;
  stream(request: CompletionRequest): AsyncIterable<StreamChunk>;
  estimateCost(request: CompletionRequest): Promise<CostEstimate>;
}

class AnthropicAdapter implements AIProvider { ... }
class OpenAIAdapter implements AIProvider { ... }

class AIOrchestrator {
  async runAnalysis(params: {
    promptId: string;
    variables: Record<string, string>;
    tenantId: string;
    userId: string;
  }): Promise<AnalysisResult> {
    // 1. Fetch prompt template (evt. tenant-override)
    // 2. Interpoleer variabelen
    // 3. Schat kosten in credits
    // 4. Check entitlement
    // 5. Execute via juiste provider
    // 6. Log naar audit + credits_ledger
    // 7. Return gestructureerd resultaat
  }
}
```

### 7.2 Server-side, niet client-side

Alle AI-calls in Supabase Edge Functions, nooit direct vanuit browser. API-keys beschermd, rate limiting gecontroleerd, kosten traceerbaar, prompts niet aanpasbaar of afkijkbaar.

### 7.3 Streaming waar mogelijk

Lange analyses (>5 sec) gestreamed via Server-Sent Events of Supabase Realtime. Geen loading spinner langer dan 2 seconden zonder progressieve output.

### 7.4 Graceful degradation

AI-provider faalt → app breekt niet. Analyses in 'failed' status met retry-optie. Gebruiker krijgt duidelijke melding en expliciete actie. Geen silent failures.

---

## 8. Billing en entitlements

### 8.1 Credit-based metering

In plaats van feature-gates per tier: credit-systeem. Elke actie kost credits; elk tier krijgt maandelijkse allocatie. Transparanter en verrekenbaar met eigen leverancierskosten (Claude API, Gamma API).

| Actie | Kosten (credits) | Onderliggende kost |
|-------|------------------|---------------------|
| Simulatie (1.000 iteraties) | 1 | Compute only |
| Simulatie (10.000 iteraties) | 3 | Compute only |
| AI analyse (basis) | 5-10 | Claude API tokens |
| AI analyse (uitgebreid) | 15-30 | Claude API tokens |
| PDF export | 2 | Server rendering |
| Gamma deck export | 20-50 | Gamma API credits |
| Scenario opslaan + delen | 0 | In subscription |

### 8.2 Tier-structuur (initieel, aanpasbaar)

| Tier | Credits/mnd | Users | White-label | Prijs/mnd |
|------|-------------|-------|-------------|-----------|
| Free | 50 | 1 | Nee | € 0 |
| Pro | 2.000 | 1 | Nee | € 49-99 |
| Business | 10.000 | 5 | Basis (L1) | € 299 |
| Enterprise | Custom | Custom | Volledig (L3) | Custom |

### 8.3 Stripe integratie

- Stripe Checkout voor signup/upgrade (geen eigen payment forms)
- Stripe Customer Portal voor subscription management (geen eigen billing UI)
- Stripe webhooks → Supabase Edge Function → updates in database
- Credit-top-ups via Stripe one-time payments, direct aan credits_ledger
- Test mode in development, live keys alleen in production Edge Function env vars

---

## 9. Export pipeline

Exports zijn de deliverables die gebruikers extern delen. Kwaliteit bepaalt productperceptie.

### 9.1 PDF (in-app gegenereerd)

Snelle rapportages, interne documenten, samenvattingen. Server-side via reportlab (Python) in Edge Function, of @react-pdf/renderer client-side. Tenant-theme tokens gebruikt. Gratis in credit-zin, snelle turnaround (<5 sec).

### 9.2 Gamma deck (API-generated)

Board-kwaliteit presentaties en professionele deliverables. Elke tenant gekoppeld Gamma theme_id. Analyse → gestructureerd prompt → Gamma API → deck als PDF-URL opgeslagen.

```
Edge Function: generate-gamma-deck
1. Valideer dat tenant voldoende credits heeft
2. Fetch analysis_data uit database
3. Bouw gestructureerd prompt op basis van pack's export-template
4. POST naar Gamma API met tenant's theme_id
5. Poll naar completion status (30-60s)
6. Sla generation_id + deck_url op in exports-tabel
7. Trek credits af van ledger
8. Notify user via realtime channel
```

### 9.3 PPTX (template-based)

Voor klanten die native PowerPoint nodig hebben. pptxgenjs server-side met per-tenant template. Complexer dan PDF, duurder, alleen bouwen als klant expliciet vraagt.

---

## 10. Beveiliging en compliance

Doelgroep is zakelijk (consultancies, enterprises) → robuust beveiligingsniveau vanaf dag één.

- **Data-isolatie.** RLS op elke tabel. Unit tests die cross-tenant toegang verifiëren. Service-role keys alleen in Edge Functions.
- **Authenticatie.** Supabase Auth met email+wachtwoord minimum. OAuth voor Pro. SAML/SSO voor Enterprise. MFA optioneel Pro, verplicht Business+.
- **Data at rest.** Supabase versleutelt standaard. Gevoelige velden via Vault of expliciete kolomversleuteling.
- **Data in transit.** TLS 1.3 overal. Geen HTTP-fallback. HSTS headers.
- **Secrets management.** Alleen in Supabase Edge Function env vars. Niet in Git. Rotatie bij incidenten.
- **Audit logging.** Elke niet-triviale actie in audit_log. Behoud 7 jaar voor enterprise.
- **GDPR/AVG.** DPA template klaar. User kan data exporteren en laten verwijderen. Cookies minimaal.
- **Data retention.** Default 3 jaar na laatste activiteit, daarna auto-delete tenzij enterprise anders bepaalt.
- **Backup en recovery.** Supabase point-in-time recovery. Maandelijkse restore-verificatie.
- **Third-party dependencies.** Maandelijkse npm audit. Renovate bot. Geen packages met <50 weekly downloads zonder review.

---

## 11. Development workflow

### 11.1 Repository structuur

```
/repo-root
  /apps
    /web              # React frontend (Vite)
    /admin            # Admin panel (aparte build, beperkte toegang)
  /packages
    /ui               # Shared UI componenten (shadcn basis)
    /core             # Business logic (tenant-onafhankelijk)
    /types            # Gedeelde TypeScript types
    /ai-client        # AI orchestratie abstraction
  /supabase
    /migrations       # SQL migraties, versie-gecontroleerd
    /functions        # Edge Functions
    /seed             # Test data (geen productie-data)
  /docs
    /architecture     # Deze en andere design docs
    /runbooks         # Operationele handleidingen
  CLAUDE.md           # Voor AI-coding assistants
  README.md
```

### 11.2 Git workflow

- Main branch altijd deployable. Feature branches voor significant werk.
- Pull requests verplicht, ook als solo-ontwikkelaar — dwingt reflectie af.
- Commit messages in Conventional Commits format.
- Versie-tags op elke productie-release (semver).
- Private repository onder eigen/holding-account, niet firma.

### 11.3 Testing strategie

- **Unit tests** voor business logic in /packages/core (Vitest)
- **Integration tests** voor Edge Functions tegen test-Supabase project
- **RLS policy tests** — dedicated suite voor cross-tenant isolatie
- **E2E tests** voor kritieke flows (signup, checkout, export) via Playwright
- **Geen 100% coverage als doel** — wel 100% coverage van security-paden

### 11.4 Omgevingen

| Env | Doel | Data |
|-----|------|------|
| local | Dagelijkse ontwikkeling | Seed data, mock AI mogelijk |
| staging | Pre-productie, demo's | Realistische testdata, echte AI |
| production | Live gebruikers | Echte klantdata, volledig monitoring |

### 11.5 AI-assisted development

Claude Code en vergelijkbare tools worden actief gebruikt. Elke commit menselijk gereviewd. Code nooit ongezien gemerged. CLAUDE.md in repo-root beschrijft architectuur-principes. Modulaire documentatie per package helpt AI.

---

## 12. Anti-patronen

### 12.1 Code-patronen om te vermijden

- **Hardcoded tenant-data.** Nooit klantnaam, klantspecifieke kleur of logo in codebase.
- **God-components.** >300 regels worden gesplitst. Uitzondering: data-tabel configuraties.
- **Props drilling beyond 3 levels.** Gebruik Context of state management.
- **Magic numbers.** Elke numerieke constante heeft naam (DEFAULT_PRO_ALLOCATION, niet 5000).
- **Silent catch blocks.** Geen try/catch zonder logging of user-feedback.
- **Direct Supabase-queries in components.** Gebruik data-layer (custom hooks, TanStack Query).
- **Tenant-data in localStorage.** Supabase session is waar tenant-context woont.

### 12.2 Architectuur-patronen om te vermijden

- **Microservices voor single-product.** Monoliet in Supabase Edge Functions tot 10k users.
- **Eigen auth bouwen.** Supabase Auth is beter en gratis.
- **Eigen billing bouwen.** Stripe is beter.
- **NoSQL voor relationele data.** Postgres is juiste keuze.
- **Premature optimization.** Pas bij meetbaar probleem.
- **Eigen AI-model trainen.** Tot ver voorbij PMF third-party LLMs.

### 12.3 Business-patronen om te vermijden

- **Free tier te ruim maken.** Genoeg om waarde te voelen, niet om werk te doen.
- **Te laag prijzen in B2B.** Board-tool onder €29/mnd signaal van amateurisme.
- **Eén klant zo belangrijk dat roadmap ervan afhangt.** Productrichting boven wishlists.
- **Features gratis maken die geld kosten.** Echte credit-kost → gebruiker betaalt.
- **Beloven wat niet bestaat.** Verkopen wat werkt.

---

## 13. Besluitkader

Voor elke feature-aanvraag deze checklist doorlopen voordat gebouwd wordt. Discipline tegen eigen enthousiasme.

### De zes vragen

1. **Platform of content?** Hoort dit in platform-layer (voor iedereen) of content-pack (per tenant)? Als 'voor één specifieke klant' → content-pack item.
2. **Methode-agnostisch?** Werkt met elk framework, of gebonden aan één methode? Laatste → content-pack.
3. **Multi-tenant veilig?** Respecteert RLS? Geen data-leak tussen tenants? Nieuwe admin-paden gecontroleerd?
4. **Wie betaalt hiervoor?** Zit in bestaand tier, of rechtvaardigt nieuw tier/credits-actie? Welke tier-limieten aanpassen?
5. **IP-risico?** Content of methodiek waar derde-partij rechten op rusten? Contractueel afgedekt?
6. **Onderhoudbaar?** Wie onderhoudt dit over 2 jaar? Complexiteit waard voor verwacht gebruik? Uitstelbaar zonder verlies?

> Als twee of meer vragen ongemakkelijk zijn: feature nog niet rijp. Parkeer met reden in backlog. Meeste uitstel leidt tot "blijkt niet nodig".

---

## 14. Operationele richtlijnen

### 14.1 Logging en monitoring

- Errors naar Sentry met tenant_id als tag (geen PII in error messages)
- Product-analytics naar PostHog: features, tier-gebruik
- Business-metrics dashboard: MRR, credit-usage, churn, feature-adoption
- Wekelijks review van alle drie bronnen

### 14.2 Incident response

- **Kritiek** (downtime, data-leak): direct handelen, communiceren binnen 1 uur, post-mortem binnen 48 uur
- **Hoog** (feature kapot voor subset): erkennen binnen 4 uur, fix/workaround binnen 24 uur
- **Medium/laag**: reguliere sprint
- Status-page op status.{domein} voor betalende klanten

### 14.3 Documentatie-hygiene

- Architectuur-beslissingen in Architecture Decision Records (ADR) in /docs
- Dit document elk kwartaal geüpdatet — als er werkelijk iets verschoven is
- Runbooks voor operationele procedures (deploy, rollback, incident, onboarding)
- API-documentatie automatisch gegenereerd (TypeDoc of equivalent)

---

## 15. Richtlijnen voor AI coding assistants

Dit document vormt basis voor CLAUDE.md in repository-root. AI assistants actief gebruikt voor ontwikkeling, moeten architectuur-principes kennen voor consistente bijdragen.

### 15.1 Wat AI altijd moet doen

- Nieuwe code houdt drie-lagen-scheiding aan (platform / content / brand)
- Database-operaties respecteren RLS en gebruiken tenant-context
- UI-componenten gebruiken theme-tokens (CSS-variabelen), nooit hardcoded kleuren
- Labels en terminologie uit i18n-keys, nooit hardcoded strings
- AI-prompts via prompt-repository, niet inline
- Elke nieuwe tabel krijgt RLS-policy in migration
- Credits-verbruik via creditsLedger voor elke kostelijke actie

### 15.2 Wat AI nooit mag doen

- Service-role keys in frontend-code
- Tenant-ID hardcoden in queries of tests
- Hardcoded strings in componenten (ook niet voor 'tijdelijke' MVPs)
- Directe fetch() calls naar externe APIs vanuit components
- Silent exception handling zonder logging
- Nieuwe dependencies zonder expliciete goedkeuring
- Destructieve migraties (DROP, TRUNCATE) zonder backup-stap

### 15.3 Bij twijfel

Twijfel over platform-layer versus content-pack → vraag expliciet om bevestiging voordat gebouwd. Liever extra vraag dan dure refactor. Geldt ook voor database-schema wijzigingen, nieuwe externe dependencies, beveiligingsgevoelige code.

---

## 16. Slotwoord

Geen bureaucratie — concrete aansturing. Elke keuze hierin is genomen omdat ze over 12-36 maanden waarde-propositie beschermt, of probleem voorkomt. Architectuur bewust eenvoudig waar kan, streng waar moet.

Bij veranderende situatie of strategie: document aanpassen, niet negeren. Verouderd richtlijn-document is erger dan geen richtlijn-document — wekt indruk van structuur zonder die te leveren.

> **De drie hoofdregels, boven alle andere beslissingen:**
> 1. Platformkwaliteit boven feature-kwantiteit
> 2. IP-bescherming boven snelheid
> 3. Architecturale integriteit boven kortetermijn-gemak

---

*Versie 1.0 — opgesteld tijdens fase 1 van platform-ontwikkeling. Voor eigen gebruik en latere ontwikkelaars onder NDA.*
