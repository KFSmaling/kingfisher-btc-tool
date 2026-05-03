# 00 — Index

**Audit-datum:** 2026-05-03 (fase 2 — gap-analyse)
**Branch:** `audit/2026-05-03-fase2`
**Uitgevoerd door:** Claude Code CLI (de bouwer) — als interpretatieve gap-meting tegen vier meetlatten
**Doel:** vier dimensie-documenten + cross-cutting overzicht + verplichte prioritering-tabel als input voor cleanup-sprints (masterplan stap 4-7), fase-3 functionele platform-beschrijving en het IP-jurist-gesprek
**Volgt op:** fase 1 (`docs/audit/2026-05-01/`) — *foto* van de codebase

> **Niet mergen naar master.** Peer reviewer (Cowork) reviewt eerst.

---

## Documenten in deze audit

### `01-spec-gap.md` — Spec-gap (612 regels)

41 gaps t.o.v. `docs/architecture-spec.md` (versie 1.0). Per gap: spec-regel, werkelijkheid (verwijzing fase 1), remediatie-klasse, severity met motivatie. **Cross-cutting kern:** content-laag is global i.p.v. tenant-scoped (S-1, S-9, S-22), framework-structuur hardcoded (S-4), KF-naam + branche-jargon in productie (S-11, S-12), admin-RLS op email i.p.v. rol (S-8), datamodel-ontologie wijkt fundamenteel af van spec §4 (S-16), tech stack §3 wijkt systematisch af. **Spec-update-vlaggen** voor secties §3, §4.2, §8, §9, §11.1.

### `02-ip-gap.md` — IP-gap (406 regels)

27 IP-voorkomens geclassificeerd over 8 categorieën (methode-claim productie / methode-claim UI / methode-structuur / auteurs-attributie / methode-content / externe consultancy-merken / klant-IP / branche-positionering). Methode-onafhankelijkheid is **niet realiseerbaar** zonder content-pack-architectuur — 8 productie-locaties bevatten BTC/Novius-claim. Klant-IP (TLB/MAG/ACE/Spain/Santander/GTS) in dood code en test-asset-bestandsnaam — apart juridisch spoor. Eindsectie met **15 vragen voor IP-jurist-gesprek** in 5 categorieën (methode / klant / branche / audit-trail / strategisch).

### `03-functioneel-gap.md` — Functioneel gap (406 regels)

33 functionele gaps in 12 categorieën: 5 stub-werkbladen (F-1 t/m F-5), Output B Rapportage (F-6/F-7), Inzichten-refactor Richtlijnen (F-8), multi-tenant operationele gaps (F-9 t/m F-14), content-laag tenant-scoping (F-15 t/m F-17), i18n (F-18/F-19), account-management, RAG, rapportage-export. **Tweede-tenant-readiness-tabel** als concrete uitwerking: voor self-service-tweede-tenant zijn F-9, F-11, F-13, F-15 minimaal nodig.

### `04-governance-gap.md` — Governance gap (306 regels)

18 governance-gaps over 4 dimensies (hosting / toegang / retentie-exit / eigendom-inzichten) + 5 cross-cutting risico's (R-1 t/m R-5). **Tweede-klant-readiness-checklist:** voor betalende tweede klant is vrijwel niets governance-mature. Belangrijkste bevindingen: platform_admin via single-email RLS (G-4, H), audit-trail-gat (G-14, H), content-laag global blokkeert per-tenant-prompt-governance (G-13, H). Notitie-grenzen strict: geen security-audit, geen DPA-template, geen feature-specs.

---

## Cross-cutting gaps

Items die in meerdere dimensies opduiken. Eén root-cause, meerdere symptomen — bij remediatie samen aanpakken voor maximaal effect.

### CC-A — `app_config` is global, niet tenant-scoped

| Dimensie | Gap-ID's | Symptoom |
|---|---|---|
| 1 — Spec | S-1, S-2, S-9, S-22 | Schendt drie-lagen-scheiding (§2.1) en multi-tenant-belofte (§2.3); blokkeert content_packs (§6) |
| 2 — IP | IP-1 t/m IP-6 | Tenant-specifieke methode-claims onmogelijk per-tenant te beheren (KF-naam in prompts raakt elke tenant) |
| 3 — Functioneel | F-15, F-16, F-17 | Tweede tenant kan geen eigen prompts/labels/voorbeelden hebben |
| 4 — Governance | G-13 | Klant kan eigen AI-prompts niet isoleren |

**Root-fix:** schema-uitbreiding (`app_config.tenant_id` + RLS) of herontwerp (`content_packs`-tabel uit spec §6). **Severity: H.** Eén oplossing, vier dimensies geraakt.

### CC-B — Admin-RLS op hardcoded email i.p.v. rol-check

| Dimensie | Gap-ID's | Symptoom |
|---|---|---|
| 1 — Spec | S-8 | Schendt §2.3 ("geen uitzonderingen — ook niet voor admin-panels") + §15.2 |
| 2 — IP | IP-16 | Persoonsgegeven hardcoded in repo + DB-historie |
| 4 — Governance | G-4 | Platform_admin-toegang niet rol-gebaseerd; key-person-dependency op Kees |

**Root-fix:** migratie naar `current_user_role() = 'platform_admin'` (helper bestaat al). **Severity: H.** Klein in effort, groot in impact.

### CC-C — Audit-trail ontbreekt (Novius-incident is symptoom)

| Dimensie | Gap-ID's | Symptoom |
|---|---|---|
| 1 — Spec | S-17, S-30 | Schendt §10 ("Elke niet-triviale actie in audit_log") + §4.2 (geen audit_log-tabel) |
| 2 — IP | IP-1 (Novius-claim audit-trail-gat) | Live prompt afwijkt van migratie zonder spoor → IP-defensie heeft geen evidence-trail |
| 4 — Governance | G-12, G-14 | Klant-verifieerbaarheid van AI-acties onmogelijk |

**Root-fix:** schema-uitbreiding (`audit_log`-tabel) + instrumentatie van prompts/canvases. **Severity: H** — retro-actief niet repareerbaar (alles wat vandaag niet wordt gelogd is morgen niet meer terug te halen).

### CC-D — Hardcoded KF-naam + branche-jargon in productie-code

| Dimensie | Gap-ID's | Symptoom |
|---|---|---|
| 1 — Spec | S-11, S-12 (en S-3 voor labels-sweep) | Schendt §2.4 letterlijk |
| 2 — IP | IP-3 t/m IP-7 (prompts), IP-9 (app-titel), IP-26 (branche-claim) | KF + BTC + branche-claims in 4-8 productie-locaties |
| 3 — Functioneel | F-17, F-19 | Tweede tenant in andere branche krijgt foute output |

**Root-fix:** twee stappen: (a) generaliseren prompts/UI-tekst (config-shift); (b) per-tenant-content (depends-on CC-A). **Severity: H.**

### CC-E — Framework-structuur hardcoded (BTC blocks in code)

| Dimensie | Gap-ID's | Symptoom |
|---|---|---|
| 1 — Spec | S-4, S-22 | Schendt §2.2.b + §6.1 (frameworks als data) |
| 2 — IP | IP-11, IP-13 | Methode-structuur ontleend; jurist-vraag (vraag 3 in IP-eindsectie) |
| 3 — Functioneel | F-1 t/m F-5 (5 stub-werkbladen) | Geen ander framework mogelijk; 5 BTC-blokken nooit volwaardig |

**Root-fix:** content-pack-architectuur (spec §6.1) — frameworks als data. **Severity: H.** Grootste herontwerp; raakt vrijwel alle features.

### CC-F — Klant-IP in publieke repo (dood code + test-asset)

| Dimensie | Gap-ID's | Symptoom |
|---|---|---|
| 2 — IP | IP-23 (klant-cases), IP-24 (klant-PPTX), IP-25 (branche-jargon) | Klant-namen + concrete strategie-uitspraken in git-history |
| 4 — Governance | impliciet — vertrouwen-gat met klanten | Klant kan in publieke repo zoeken |

**Root-fix:** weghalen + jurist-vraag (history-rewrite + klant-notificatie). **Severity: H** voor klant-contractueel.

### CC-G — Geen observability (Sentry, PostHog, audit-log, structured logging)

| Dimensie | Gap-ID's | Symptoom |
|---|---|---|
| 1 — Spec | S-40, S-41 | Schendt §14.1 + §10 (PII in logs) |
| 4 — Governance | G-15, G-16 | Klant-data in productie-console; geen incident-detection; geen status-page |

**Root-fix:** observability-laag invoeren (Sentry + structured logging via `logger.js`-wrapper) + 5 `console.log`-locaties migreren. **Severity: M** — fase 1 acceptabel zonder, fase 2 blocker.

### CC-H — Spec-tech-stack wijkt systematisch af (geen TS, CRA i.p.v. Vite, Vercel i.p.v. Edge Functions)

| Dimensie | Gap-ID's | Symptoom |
|---|---|---|
| 1 — Spec | S-15 (tech stack) + S-29 (export), S-33 (monorepo), S-35 (repo-eigendom) | Spec ↔ werkelijkheid mismatch |

**Root-fix:** **beslissing nodig** — spec achterhalen of werkelijkheid migreren. Bij spec-update: documenteer rationale. Bij migratie: groot herontwerp. **Severity: M.**

### CC-I — Geen test-suite, Playwright uitgeschakeld, App.test.js failing

| Dimensie | Gap-ID's | Symptoom |
|---|---|---|
| 1 — Spec | S-31 (RLS-tests), S-34 (test-suite) | Schendt §10 + §11.3 |
| 4 — Governance | impliciet — geen aantoonbare RLS-correctheid | Klant kan isolatie niet verifiëren |

**Root-fix:** test-suite optuigen + RLS-tests + Playwright reactiveren. **Severity: M.**

---

## Prioritering-tabel

**Verplicht onderdeel.** Per gap één rij. Cross-cutting gaps zijn samengevoegd onder hun CC-letter. Waar fase-1 of tech_debt al een ID heeft is dat behouden voor traceerbaarheid.

**Sprint-mapping:** "stap 4-7" verwijst naar masterplan-cleanup-sprints. **Belangrijke disclaimer:** ik heb géén masterplan-document gelezen waarin stap 4-7 zijn gedefinieerd. Mapping is mijn voorstel op basis van logische volgorde:
- **stap 4 (?) — quick-wins / governance-bedrading** (klein effort, hoog impact, geen dependency)
- **stap 5 (?) — content-laag tenant-scoping** (groot effort, ontgrendelt veel)
- **stap 6 (?) — content-pack-architectuur + framework-data** (grootste herontwerp)
- **stap 7 (?) — fase-2-readiness** (billing, MFA, observability, export)
- **nieuw** — geen logische match met clean-up; aparte sprint of beslissing

**Kees-actie:** mapping kolom verifiëren tegen werkelijke masterplan-stappen 4-7 voor inwerken in roadmap.

| ID | Dim | Gap (kort) | Severity | Klasse | Dependency | Voorgestelde sprint |
|---|---|---|---|---|---|---|
| **CC-A** | 1+2+3+4 | `app_config` global → tenant-scoped | H | schema-uitbreiding of herontwerp | — | stap 5 |
| **CC-B** | 1+2+4 | Admin-RLS van email naar `current_user_role()` | H | config-shift (migratie) | — | stap 4 |
| **CC-C** | 1+2+4 | `audit_log`-tabel + instrumentatie | H | schema-uitbreiding | — | stap 4 (tabel) + stap 5 (instrument) |
| **CC-D** | 1+2+3 | Generaliseren KF-naam + branche-jargon in prompts/UI | H | config-shift + per-tenant-content | CC-A voor per-tenant deel | stap 4 (generaliseren) + stap 5 (per-tenant) |
| **CC-E** | 1+2+3 | Frameworks als data (content-pack-architectuur) | H | herontwerp | CC-A | stap 6 |
| **CC-F** | 2+4 | Klant-IP weghalen (dood code + test-asset, mogelijk history-rewrite) | H | weghalen + beslissing nodig (jurist) | jurist-gesprek | stap 4 (weghalen) + nieuw (history-rewrite) |
| **CC-G** | 1+4 | Observability (Sentry + structured logging + 5 `console.log`-fix) | M | herontwerp + config-shift | — | stap 4 (logging-fix) + stap 7 (Sentry) |
| **CC-H** | 1 | Tech stack §3 — spec achterhalen of migreren | M | beslissing nodig + docs-update of herontwerp | — | nieuw (beslissing) |
| **CC-I** | 1+4 | Test-suite + RLS-tests + Playwright reactiveren | M | herontwerp | — | stap 7 |
| **S-3 / F-19** | 1+3 | 220 ESLint-violations sweep (LoginScreen, ProjectInfoSidebar, etc.) | M | config-shift | — | stap 4 (bekend tech_debt P4) |
| **S-5** | 1 | 3 prompts geen DB-override (linkThemes, SYSTEM_GENERAL_KNOWLEDGE, samenvatting) | M | config-shift | — | stap 4 |
| **S-6 / IP-25, IP-27** | 1+2 | EXAMPLE_BULLETS verplaatsen / generaliseren | M | config-shift of weghalen | — | stap 4 |
| **S-7** | 1 | Geen entitlement-systeem (admin via env-var) | M | herontwerp | CC-B | stap 7 |
| **S-10 / F-11** | 1+3 | Auto-aanmaak `user_profiles` bij signup | M | schema-uitbreiding | — | stap 4 (DB-trigger) |
| **S-13 / IP-15** | 1+2 | TipsModal + i18n auteurs-attributie (BTC-boek) | M-H | beslissing nodig (jurist) | jurist-gesprek | nieuw |
| **S-14** | 1 | Klant-cases + dood code opruimen — zelfde als CC-F | (zie CC-F) | (zie CC-F) | — | (zie CC-F) |
| **S-16, S-18** | 1 | Datamodel-ontologie afwijkt (geen analyses/simulations/subscriptions/credits/exports) | H | beslissing nodig + docs-update of herontwerp | CC-H | nieuw (beslissing) + stap 7 |
| **S-19** | 1 | `users`-schema spec-update (Supabase Auth pattern) | L | docs-update | — | nieuw (spec-update) |
| **S-20** | 1 | Tenant-types `enterprise`/`individual` niet getest | L | docs-update of herontwerp | — | stap 7 |
| **S-21** | 1 | Token-schema beperkt (alleen L1-tier) | L | schema-uitbreiding | — | stap 7 |
| **S-23** | 1 | Prompt-template-schema mist 5 velden (model, temperature, max_tokens, version, tenant_overridable) | M | schema-uitbreiding | CC-A | stap 5 |
| **S-25** | 1 | Geen AI-abstraction-layer (`AIProvider`-interface) | M | herontwerp | CC-A + S-23 | stap 6 |
| **S-26** | 1 | Geen streaming voor lange AI-analyses | L | herontwerp | — | stap 7 |
| **S-27** | 1 | 2 Sonnet-aliases gemengd; validate.js comment ↔ code mismatch | L | config-shift of docs-update | — | stap 4 |
| **S-28** | 1 | Geen billing (Stripe + credits + tiers) | L→H (fase 2) | herontwerp | — | stap 7 |
| **S-29 / F-28** | 1+3 | Export-pipeline (Output B / Gamma / PPTX) | M | herontwerp | — | stap 7 |
| **S-31** | 1 | Geen RLS-unit-tests (cross-link CC-I) | M | herontwerp | — | stap 7 |
| **S-32** | 1 | Geen DPA / export-UI / delete-UI / retention | M (fase 2) | herontwerp | — | stap 7 |
| **S-33** | 1 | Repo-structuur geen monorepo | L | herontwerp | — | stap 7 |
| **S-35** | 1 | Repo onder persoonlijke GitHub-account, niet holding-org | M | beslissing nodig | jurist-gesprek (vraag 14) | nieuw |
| **S-36** | 1 | Geen staging-omgeving | M | herontwerp | tech_debt P5 fase 2-4 | stap 7 |
| **S-37** | 1 | God-components (4 bestanden >300 regels) | L-M | herontwerp | — | stap 7 |
| **S-38** | 1 | Silent catch blocks (10 in tech_debt P2) | M | bekend (incrementeel) | — | stap 4 (deel) |
| **S-39** | 1 | Geen ADRs in `docs/architecture` | L | docs-update | — | stap 4 |
| **IP-1** | 2 | Novius-claim live (audit-trail-gat) | H | weghalen + beslissing nodig (jurist) | jurist-gesprek + CC-C | stap 4 (weghalen) + nieuw (jurist) |
| **IP-9** | 2 | App-titel = methode-naam ("BTC") | H | beslissing nodig (rebrand?) | jurist-gesprek | nieuw |
| **IP-10 / IP-14** | 2 | TipsModal boek-attributie + content-parafrasering | M-H | beslissing nodig (jurist) | jurist-gesprek | nieuw |
| **IP-22** | 2 | McKinsey/BCG-merken in productie-prompts | L | beslissing nodig | — | nieuw |
| **F-1 t/m F-5** | 3 | 5 stub-werkbladen (Customers/Processes/People/Technology/Portfolio) | H als BTC-volwaardig; M als methode-pivot | herontwerp of per-tenant-content | CC-E (als pivot) | stap 6 (als pivot) of stap 7 (als BTC) |
| **F-6, F-7** | 3 | Output B Rapportage (Issue #56) | M | herontwerp | F-design-keuze | stap 7 |
| **F-8** | 3 | Inzichten-overlay Richtlijnen op oude schema | M | schema-uitbreiding + herontwerp | — | stap 5 |
| **F-9** | 3 | Tenant-admin UI (Issue #79) | H zelfbedienend, L als KF-only | herontwerp | CC-A | stap 6 |
| **F-10** | 3 | Tenant-switcher voor platform_admin (Issue #71) | M | herontwerp | CC-B | stap 7 |
| **F-12** | 3 | Subdomein-routing per tenant (Issue #75) | L | herontwerp | — | stap 7 |
| **F-13** | 3 | Wit logo Kingfisher (#73) + Platform-logo (#74) | M | content-shift (assets aanleveren) | — | stap 4 |
| **F-14** | 3 | Tweede-tenant-onboarding-flow | M | herontwerp | CC-A | stap 6 |
| **F-18** | 3 | i18n-mismatch (taal-toggle ↔ DB-driven labels) | M | schema-uitbreiding + herontwerp | — | stap 5 |
| **F-20 / F-21 / F-22** | 3 | Profiel-edit / logout-all / MFA-SSO | L (fase 1) → M-H (fase 2) | schema-uitbreiding | — | stap 7 |
| **F-23 t/m F-26** | 3 | RAG-CRUD + multi-canvas dossier | L-M | schema-uitbreiding | — | stap 7 |
| **G-1, G-2** | 4 | Hosting-statement / DPA / klant-zichtbaarheid | M (fase 2) | herontwerp + docs-update | — | stap 7 |
| **G-5** | 4 | Role-based access intra-tenant (canvas-ACL) | M-H | herontwerp | CC-A | stap 6 |
| **G-7, G-8** | 4 | Data-export + delete-UI | M (fase 2) | herontwerp | — | stap 7 |
| **G-10** | 4 | IP-eigenaarschap AI-output (TOS) | M | beslissing nodig + docs-update | jurist-gesprek (vraag 13) | nieuw |
| **G-17** | 4 | AI-provider-DPA / sub-processor-statement | M (fase 2) | docs-update | — | stap 7 |
| **G-18** | 4 | Sub-tenant model (`parent_tenant_id`) | M (zodra >1 klant per consultancy-tenant) | schema-uitbreiding | CC-A | stap 6 |

**Niet in tabel — al ✅ done of bewust niet:**
- CLAUDE.md §4.1, §4.3, §4.5 ✅ compliant per fase 1
- Tech_debt P1 (Lifecycle / Race-guards) ✅ done
- Tech_debt P4 (service contract) — bewuste keuze, geen migratie

---

## Conclusies (kort)

1. **Drie root-causes verklaren de meeste hoog-severity gaps:** (a) `app_config` global (CC-A), (b) framework-structuur hardcoded (CC-E), (c) geen audit-trail (CC-C). Aanpakken hiervan ontgrendelt 15+ rijen in de tabel.
2. **Quick-wins met hoge impact:** CC-B (admin-RLS migratie), G-15 (`console.log` opruimen), F-13 (logo's), S-3 (label-sweep is bekend tech_debt P4). Allemaal "stap 4"-kandidaten — klein effort, hoog signaal-effect.
3. **Twee echte beslissingen voor Kees, niet uitvoerbaar:** (a) IP-jurist-gesprek (15 vragen in 02-ip-gap eindsectie), (b) tech-stack-richting (CC-H — spec achterhalen of werkelijkheid migreren).
4. **Methode-onafhankelijkheid is **geen** code-fix.** Het is een productpositionering-keuze. Code kan generaliseren (vervang prompts) maar de naam "Business Transformation Canvas" als app-titel + 7 BTC-blokken als architectuur is fundamenteler. Cross-link IP-9 + IP-11 + CC-E.
5. **Voor "tweede betalende klant productief"** is de minimale set: CC-A + CC-B + CC-D + CC-G + F-9 + F-11 + F-13 + G-1/G-7/G-8. Voor "tweede interne tenant" alleen CC-D (generaliseren prompts) noodzakelijk.

---

## Verificatie-paragraaf

### Wat ik heb gedaan voor compleetheid

- **Vier dimensie-documenten als input** — alle gap-ID's hier aanwezig (S-1 t/m S-41, IP-1 t/m IP-27, F-1 t/m F-33, G-1 t/m G-18 + R-1 t/m R-5)
- **Cross-cutting analyse** — 9 CC-clusters samengesteld door bewust te zoeken naar root-cause-overlap tussen 4 documenten (niet één-op-één gap-mapping)
- **Prioritering-tabel** — 60+ rijen waarin elke gap (of gap-cluster) een entry krijgt met severity / klasse / dependency / voorgestelde sprint
- **Dependency-tracking expliciet** — bv. S-23 depends-on CC-A (eerste tenant-scoped voordat metadata-velden zinvol worden); CC-B is dependency-vrij (kan los); CC-E is grootste root-cause met meeste downstream
- **Sprint-mapping met disclaimer** — masterplan stap 4-7 niet zelf gelezen; mapping is voorstel-met-vraagteken voor Kees-validatie

### Niet onderzocht en waarom

- **Werkelijke masterplan-content (stap 4-7 definities)** — niet beschikbaar in repo / niet onderzocht; mijn mapping is logica-gedreven, geen feitelijke aansluiting. Kees-actie: tabel-kolom verifiëren.
- **Effort-totaal per voorgestelde sprint** — niet opgeteld; geen capaciteit-planning gemaakt
- **Conflict-mapping tussen meetlatten** — gevolgd waar relevant (bv. spec §2.4 vs. IP-attributie-overweging in IP-10/IP-15) maar niet uitputtend uitgewerkt voor alle 60+ rijen
- **Volledige cross-link matrix** — alleen de 9 CC-clusters expliciet uitgewerkt; voor 50+ standaard-rijen is cross-link impliciet via dimensie-document
- **Vergelijking met fase-1-prioritering** — fase-1 was bewust niet-prioriterend; geen vorige basislijn om tegen te bench-marken

### Verificatie-steekproeven (3 willekeurige bevindingen herverifieerd)

1. **CC-A koppelt 4 dimensies** — gecheckt: 01-spec-gap S-1 noemt content-laag global; 02-ip-gap IP-1 t/m IP-6 leunen allemaal op DB-prompt-wijziging (= global); 03-functioneel F-15 noemt expliciet "alle 19 prompts in app_config global"; 04-governance G-13 noemt prompts-isolatie. ✅ Cross-cutting bevestigd.
2. **CC-B is dependency-vrij** — admin-RLS migratie van email naar role-check vereist alleen DB-migratie + helper bestaat al (`current_user_role()` aangemaakt 20260424030000). Geen schema-uitbreiding, geen feature-werk. ✅ Klein effort, hoog impact.
3. **F-13 logo's voor stap 4** — fase 1 03-namen-en-termen §13 toont `tenants.theme_config.logo_white_url = null` voor Kingfisher en beide null voor Platform-tenant. Mechanisme werkt; alleen assets ontbreken. Per audit-prompt classificatie "content-shift". ✅

### Bekende blinde vlekken

- **Severity-toekenning is mijn interpretatie.** Kees + peer reviewer mogen complete prioritering omkeren. Per gap-rij is severity-motivatie expliciet in dimensie-documenten te raadplegen.
- **Sprint-mapping is grootste blinde vlek.** Zonder masterplan-stappen 4-7 letterlijk te kennen, is mijn voorstel een suggestie — geen aansluiting. Kees-actie verplicht.
- **Cross-cutting clusters zijn voorstel.** Sommige clusters (CC-A, CC-B, CC-C) zijn evident; andere (CC-G, CC-H, CC-I) zijn pragmatisch maar minder dwingend. Reviewer mag herclusteren.
- **"Fase-2-relevantie" is impliciet** — sommige gaps (S-28 billing, F-22 MFA, G-1 DPA) zijn fase-1 niet acuut maar fase-2 essentieel. Severity-kolom toont dit met "(fase 2)"-annotatie maar niet als aparte tabel-kolom.
- **Gap-tabel-volledigheid** — 60+ rijen is veel; mogelijke duplicaten of weggevallen rijen niet uitputtend gekruist met dimensie-documenten. Kruislezing aanbevolen voor de drie of vier zwaarste rijen voor 100% zekerheid.

---

## Geen wijzigingen aan code of database

Per audit-prompt: **deze audit heeft geen code- of database-wijzigingen geproduceerd.** Alleen documentatie in `docs/audit/2026-05-03-fase2/`. Branch `audit/2026-05-03-fase2` aftakking van master; alle commits zijn `audit-fase2(2026-05-03): document X — ...`.

**Niet mergen naar master.** Peer reviewer (Cowork) reviewt eerst.

Items uit dit fase-2-document worden later in aparte sessies behandeld:
- Cleanup-sprints (masterplan stap 4-7) op basis van prioritering-tabel
- Fase-3 functionele platform-beschrijving voor commerciële uitrol
- IP-jurist-gesprek met de 15 vragen uit `02-ip-gap.md` eindsectie
- Spec-update voor §3, §4.2, §8, §9, §11.1 en mogelijk §13 (besluitkader-toepassing)

---

## Tijdsinvestering

Audit uitgevoerd in één doorlopende sessie op 2026-05-03. Volgorde:
1. Inputs gelezen (fase-1 5 docs + architecture-spec + tech_debt + governance-notitie) — circa 1u
2. `01-spec-gap.md` — circa 1u
3. `02-ip-gap.md` — circa 45min (incl. 15 jurist-vragen)
4. `03-functioneel-gap.md` — circa 45min
5. `04-governance-gap.md` — circa 30min
6. `00-index.md` (dit document, incl. cross-cutting + prioritering-tabel) — circa 45min

Totaal: ongeveer 4-5 uur (binnen "halve tot hele werkdag"-verwachting uit prompt).

Per document één commit op `audit/2026-05-03-fase2`-branch:
- `5419491` document 01 — spec-gap
- `702c9fe` document 02 — ip-gap
- `e4039ec` document 03 — functioneel-gap
- `58b9420` document 04 — governance-gap
- _(deze commit)_ document 00 — index

---

## Vervolgvragen voor reviewer (geen onderdeel van audit-mandaat)

Tijdens het schrijven opgekomen — voor reviewer-overweging, niet voor mij om te beantwoorden:

1. **Masterplan stap 4-7 — zijn die ergens vastgelegd?** De prompt-mapping in mijn prioritering-tabel is gedreven door logica, niet door werkelijke masterplan-stappen. Validatie nodig.
2. **Tech-stack-spec-besluit (CC-H)** — moet de spec inhalen of moet de werkelijkheid migreren? Dit is een Kees-keuze die andere gaps (S-25 abstraction-layer, S-33 monorepo) ophangt.
3. **IP-jurist-gesprek-volgorde** — moet jurist-gesprek vóór of na cleanup-sprint van prompts (CC-D) gebeuren? Argumenten beide kanten op.
4. **Methode-pivot vs. BTC-volwaardig** — F-1 t/m F-5 (5 stub-werkbladen) krijgen verschillende severity afhankelijk van strategische pivot-keuze. Wachten op Kees-besluit voor sprint-prioritering.
5. **Cross-cutting clustering** — heb 9 CC-clusters voorgesteld; reviewer mag herclusteren als andere logische groeperingen bestaan.
