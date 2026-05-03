# 04 — Governance gap

**Audit-datum:** 2026-05-03 (fase 2)
**Branch:** `audit/2026-05-03-fase2`
**Meetlat:** vier dimensies uit `peer-reviews/inputs/2026-04-26-data-governance-strategische-klantdata.md`:
1. **Hosting** — waar staat data, kunnen klanten dat verifiëren
2. **Toegang en governance** — wie kan wat zien (tenant-isolatie, role-based binnen tenant, platform_admin-rechten)
3. **Retentie en exit** — wat gebeurt aan einde contract, kan klant data exporteren/wissen
4. **Eigendom van inzichten** — wie is eigenaar van AI-gegenereerde patronen

**Bron-context:** notitie is **roadmap-input voor tweede klant**, geen acute kwetsbaarheid. Supabase EU + RLS is voor huidige fase passend.

**Doel:** per dimensie noteren wat huidige stand is, wat het gat is richting "tweede betalende klant", welke ontbrekende features, en welke risico's bij doorontwikkeling zonder governance-aandacht. **Geen security-audit. Geen DPA-template. Geen acute zorg framing.**

**Bron:** fase 1 (alle documenten) + spec §10 + governance-notitie.

---

## Dimensie 1 — Hosting

### G-1 — Waar staat data fysiek

- **Huidige stand:**
  - Supabase project `lsaljhnxclldlyocunqf` (uit `.github/workflows/supabase-migrations.yml`); Supabase EU-regio (default voor EU-klanten — niet expliciet bevestigd in fase 1 audit, **vraag voor Kees**)
  - Vercel hosting (Vercel project `kingfisher-btc-tool`); regio niet expliciet vastgelegd
  - Anthropic Claude API (US-jurisdictie, maar zero-data-retention voor API-tier — niet expliciet bevestigd in fase 1, **vraag voor Kees**)
  - OpenAI embeddings (US-jurisdictie); embedding-data zit in Supabase (`document_chunks.embedding`)
- **Gap richting tweede klant:**
  - Geen klant-zichtbare hosting-verklaring (DPA, ISO-statement, regio-attestatie)
  - Geen Supabase-region documentatie (klant kan vandaag niet aantoonbaar zien dat data EU staat)
  - Geen statement over AI-provider-dataverwerking (welke data gaat naar Anthropic? welke retentie? blijft chunks-data binnen EU bij OpenAI-embedding-call?)
- **Architectuur blokkerend?** **Nee** — huidige Supabase-setup is fundamenteel passend voor "EU-data-claim". Wat ontbreekt is documentatie + DPA, niet de technische opzet.
- **Risico bij doorontwikkeling zonder aandacht:**
  - Klant-vraag wordt steeds urgenter naarmate platform breder wordt aangeboden
  - AI-provider-keuzes (vandaag Claude/OpenAI mix; spec §3 noemt Anthropic primair + OpenAI fallback) kunnen klant-bezwaar oproepen ("data verlaat EU")
  - Embedding-pipeline stuurt klant-content (PDF/PPTX-tekst) naar OpenAI — volume is significant per upload
- **Severity:** **L** voor huidige fase (interne tool); **M** voor tweede klant (DPA-vereiste)

### G-2 — Klant-verifieerbare data-locatie

- **Huidige stand:** geen mechanisme. Klant heeft geen UI/API om te verifieren waar zijn data staat.
- **Gap:** een statement op een marketing-pagina is voldoende voor de meeste klanten; verifieerbaarheid (bv. data-residency-attestatie via Supabase) is enterprise-niveau
- **Architectuur blokkerend?** **Nee** voor statement; **Ja** voor "klant kiest eigen Supabase-project" (zou Bring-Your-Own-Cloud zijn — notitie-pagina sluit dit expliciet uit voor deze fase)
- **Severity:** **L**

---

## Dimensie 2 — Toegang en governance

Notitie zegt: *"Vraag 2 is waarschijnlijk gevoeliger dan vraag 1. Een klant kan prima leven met data in EU-Supabase, maar niet met alle KF-consultants kunnen mijn strategische data inzien."*

### G-3 — Tenant-isolatie (cross-tenant)

- **Huidige stand:** ✅ RLS via `current_tenant_id()`-helper op data-tabellen (`canvases`, `strategy_core`, `analysis_items`, `strategic_themes`, `ksf_kpi`, `guidelines`, `guideline_analysis`, `canvas_uploads`, `document_chunks`, `import_jobs`). Migraties 20260424030000 (helpers) + 20260424040000 (canvases.tenant_id).
- **Gap:**
  - Geen RLS-unit-tests (cross-link 01-spec-gap S-31; spec §10 eist "expliciete unit-tests per role, per tenant-type")
  - Klant-aantoonbaarheid van isolatie ontbreekt (geen pen-test rapport, geen SOC2/ISO-attestatie)
- **Architectuur blokkerend?** **Nee** — RLS-architectuur is correct opgezet; bewijslast ontbreekt
- **Severity:** **M** — RLS werkt, governance-evidence ontbreekt

### G-4 — Platform-admin-rechten (cross-tenant superuser)

- **Huidige stand:**
  - `platform_admin` rol bestaat in `user_profiles.role`
  - Admin-pagina (`/admin`) toegankelijk voor `auth.email() = 'smaling.kingfisher@icloud.com'` (hardcoded RLS-policy in migratie 20260420150000) — dus single-email i.p.v. role-check
  - **Belangrijk:** RLS op data-tabellen blokkeert `platform_admin` ook (geen cross-tenant query mogelijk via app-flow); platform_admin ziet **alleen eigen tenant-data** in normale flow. Cross-tenant-toegang vereist DB-direct (Supabase Dashboard met service_role-key) — **buiten app, niet in audit-log**
- **Gap:**
  - Single-email RLS-policy is onstabiel (cross-link 02-ip-gap IP-16, 01-spec-gap S-8) — bij personeelswissel of holding-overdracht moet migratie. Schendt §2.3 ("geen uitzonderingen — ook niet voor admin-panels") en §15.2 ("Tenant-ID hardcoden in queries of tests" — analoog).
  - Service-role-key-toegang via Supabase Dashboard is niet auditeerbaar binnen app
  - Geen formele "platform_admin kan onder voorwaarden cross-tenant"-flow (impersonation met audit-trail)
- **Architectuur blokkerend?** **Nee** voor migratie naar `current_user_role() = 'platform_admin'` (helper bestaat); **Ja** voor "auditeerbare cross-tenant"-flow zonder DB-direct-route
- **Risico:** Kees heeft technisch ongelimiteerde toegang via Supabase Dashboard. Voor klant: "wie kan bij mijn data" → eerlijk antwoord is "Kees als DB-admin via service_role-key". Geen compenserende audit-mechanisme.
- **Severity:** **H** — direct relevant voor klant-conversatie + spec-schending

### G-5 — Role-based access binnen tenant

- **Huidige stand:**
  - `user_profiles.role` heeft 3 rollen: `tenant_admin`, `user`, `platform_admin` (uit fase 1 02-architectuur §7 — niet uitputtend bevestigd)
  - RLS-policy patroon (`USING (tenant_id = current_tenant_id() AND (user_id = auth.uid() OR current_user_role() = 'tenant_admin'))`) zou tenant-admin cross-user binnen tenant geven
  - **In de praktijk:** geen tenant met meerdere users (live DB heeft ~2 users — Kees in beide tenants)
- **Gap (notitie-letterlijk):** *"niet elke KF-consultant moet bij elk klant-dossier kunnen"*
  - Vandaag: alle users in een tenant zien alle canvases (mits eigen + admin-rule). Geen sub-tenant-isolatie ("project-team" of "alleen-toegewezen-consultants")
  - Geen ACL-mechanisme per canvas
  - Geen audit-log van wie welk canvas opende
- **Architectuur blokkerend?** **Ja** voor sub-tenant-ACL — vereist `canvas_acl` tabel + RLS-policy-uitbreiding
- **Risico bij doorontwikkeling:** elke nieuwe AI-feature die canvas-content vrijspeelt naar een grotere user-set vergroot dit gat. Bv. cross-canvas-Inzichten ("dwarsverband over alle KF-klanten") zou nu impliciet alle KF-tenant-users alle klant-data tonen.
- **Severity:** **M** voor tweede klant (notitie-eis); **H** zodra een tenant 5+ consultants heeft die niet allemaal dezelfde klant doen

---

## Dimensie 3 — Retentie en exit

### G-6 — Wat gebeurt aan einde contract

- **Huidige stand:** **niets gedefinieerd**
  - Geen retention-policy in code/DB (cross-link 01-spec-gap §10 sub-eis)
  - Geen contract-einde-flow (canvas archiveren, data exporteren, tenant deactiveren)
  - Geen automatic delete na inactiviteit
- **Gap richting tweede klant:**
  - DPA verwacht: termijn na contract-einde voor data-bewaring (typisch 30/60/90 dagen voor dispute) + verplichte verwijdering
  - Klant verwacht: "we kunnen altijd onze data terugkrijgen" (export) en "we weten dat het verwijderd is" (delete-bevestiging)
- **Architectuur blokkerend?** **Nee** — Supabase ondersteunt CASCADE deletes; ontbreekt: UI + retention-cron + audit-trail van delete-actie
- **Severity:** **M** — voor tweede betalende klant essentieel; geen acute fase-1-blocker

### G-7 — Data-export functionaliteit

- **Huidige stand:** **afwezig** als first-class feature
  - OnePagers (browser-print → PDF) zijn een vorm van export, maar niet "alle data van mijn tenant"
  - Geen JSON/CSV-bulk-export
  - Geen API voor klant om eigen data te halen
- **Gap:** AVG/GDPR vereist "data portability"; klant heeft recht op machine-leesbare kopie. Vandaag onmogelijk zonder DB-direct-toegang (Kees handmatig via Supabase Dashboard).
- **Architectuur blokkerend?** **Nee** — kan als Edge Function / Vercel Function gebouwd worden
- **Severity:** **M** — fase-1 acceptabel ("data komt op verzoek"), fase-2 verwacht UI-knop

### G-8 — Data-delete functionaliteit (klant-initiated)

- **Huidige stand:** **afwezig** — geen "verwijder mijn account / mijn canvas" UI
  - Kingfisher als tenant heeft geen "wis tenant"-knop
  - Individuele canvases hebben mogelijk een delete-knop (fase 1 niet uitputtend gecheckt op CRUD-CRUD-CRUD)
- **Gap:** AVG-recht op vergetelheid; klant verwacht knop, niet supportticket
- **Architectuur blokkerend?** **Nee**
- **Severity:** **M** — fase-2-vereiste

### G-9 — Enterprise data-isolatie optie

- **Notitie-status:** *"Niet ondersteund, geen prioriteit. Reactief — pas bij eerste klant die het eist."*
- **Huidige stand:** **afwezig** — alle tenants delen één Supabase-project; geen "eigen Supabase per klant"-optie
- **Gap:** spec §11.4 noemt local/staging/production; enterprise-isolatie zou "production per enterprise" zijn
- **Architectuur blokkerend?** **Ja** indien gewenst — vereist multi-deployment-orchestration + per-deployment migratie-pipeline
- **Severity:** **L** (per notitie-aanwijzing) — pas bij concrete klant-eis

---

## Dimensie 4 — Eigendom van inzichten

Notitie: *"Wie is eigenaar van AI-gegenereerde patronen en dwarsverbanden?"*

### G-10 — IP-eigenaarschap van AI-output

- **Huidige stand:** **niet gedefinieerd**
  - Geen Terms-of-Service in app
  - Geen eigendomsclaim per gegenereerd insight (bv. "deze insight is eigendom van tenant X")
  - AI-output (Inzichten, Magic-suggesties, gegenereerde KSF/KPI) zit in tenant-eigen tabellen — *technisch* eigendom volgt tenant-context
  - Maar: de AI-prompt zelf (KF-eigen prompt-engineering) is een holding-asset
- **Gap:**
  - Geen contractuele helderheid: tenant betaalt voor AI-output; is output eigendom van tenant of van platform?
  - Cross-tenant-leren ontbreekt vandaag (geen "leer van alle canvases" — wat positief is voor isolatie maar negatief voor product-waarde)
  - Geen mechanisme om "anonieme insights aggregeren voor product-verbetering" (zou expliciete opt-in vereisen)
- **Architectuur blokkerend?** **Nee** — eigendom is contractueel/juridisch, niet technisch
- **Severity:** **M** — bij commerciële uitrol moet hier een keuze zijn

### G-11 — Cross-tenant-pattern-extractie (potentieel toekomstig)

- **Huidige stand:** **niet aanwezig** — strikt tenant-geïsoleerd
- **Gap:** wenselijk voor product-waarde ("70% van transformaties heeft dit patroon"), problematisch voor governance
- **Architectuur blokkerend?** **Nee** — niet aanwezig is automatisch ook geen risico
- **Severity:** **L** — hypothetische toekomstige feature; vandaag geen probleem

### G-12 — Audit-log van AI-acties (wie genereerde welke insight wanneer)

- **Huidige stand:** **afwezig** — geen audit-log überhaupt (cross-link 01-spec-gap S-17, S-30)
- **Gap:** klant-verifieerbaarheid: *"wie liet AI op onze data los? welke prompt? welk model?"* — vandaag niet beantwoordbaar
- **Risico:** bij dispuut over AI-gegenereerd advies (verkeerd geïnterpreteerd, schadelijk doorgevoerd) is geen reconstructie mogelijk
- **Severity:** **M** — gekoppeld aan spec §10 audit-eis

---

## Cross-cutting governance-observaties

### G-13 — `app_config` global → klant kan eigen prompts niet beheren

- **Cross-link:** 01-spec-gap S-1, S-22; 03-functioneel F-15
- **Governance-relevantie:** als klant wil dat *zijn* AI-prompts strikt geïsoleerd zijn (bv. eigen branche-jargon, eigen confidentiality-instructies aan AI), kan dat vandaag niet. Wijziging raakt alle tenants.
- **Notitie-aansluiting:** notitie zegt "ontbreekt: role-based access binnen een tenant". Verwante laag: ontbreekt ook "tenant-scoped configuratie".
- **Severity:** **H** voor governance-belofte van tenant-isolatie

### G-14 — Audit-trail-gat is reëel risico (Novius-incident)

- **Cross-link:** 02-ip-gap IP-1; 01-spec-gap S-17, S-30
- **Governance-relevantie:** live `prompt.strategy.analysis` afwijkt van migratie-versie zonder spoor. Voor IP-defensie + voor klant-verifieerbaarheid + voor compliance is dit een blanco gat.
- **Demo van risico:** als KF-klant zou vragen "welke AI-instructies heeft dit canvas geanalyseerd?" → niet uit DB-historie te beantwoorden voor één specifiek canvas-actie. Alleen de *huidige* prompt-versie + canvas-content. Ontbreekt: snapshot per AI-call.
- **Severity:** **H** — schendt spec §10 ("Elke niet-triviale actie in audit_log") + §14.1

### G-15 — Logging van user-data naar productie-console

- **Cross-link:** 01-spec-gap S-41; 05-tech-debt §3
- **Governance-relevantie:** 5× `console.log` met canvas-content / autosave-data / embedding-stats. Strategische klant-data lekt naar Vercel-runtime-logs (server-side `api/magic.js`) en browser-DevTools (canvas.service.js / embedding.service.js).
- **Risico:** klant kan vragen "wat zien jullie server-side?" — eerlijk antwoord vandaag: alle autosave-payloads in Vercel-logs. Strategische data is zichtbaar voor wie Vercel-logs kan inzien (Kees + Vercel als provider).
- **Severity:** **M** — privacy-relevant; oplossing in dagen

### G-16 — Geen Sentry / observability — incident-respons is blind

- **Cross-link:** 01-spec-gap S-40
- **Governance-relevantie:** spec §14.2 verwacht incident-procedure voor "kritiek (downtime, data-leak)" met communicatie binnen 1 uur. Zonder error-tracking ontdekt KF een data-leak pas wanneer klant belt — niet pro-actief.
- **Severity:** **M** voor fase 2 (betalende klanten verwachten oncall)

### G-17 — AI-provider-data-flow niet geïnventariseerd

- **Huidige stand:** geen overzicht van welke klant-data naar Anthropic/OpenAI wordt gestuurd
  - **Anthropic:** elke AI-call met canvas-context (Magic Staff, Inzichten, Improve, Themes, Validate). Volume = significant per gebruik.
  - **OpenAI:** elke document-upload genereert embeddings van de chunks → volledige document-tekst gaat naar OpenAI
- **Gap:** klant heeft geen DPA-equivalent statement over derde-partij dataverwerkers
- **Severity:** **M** voor tweede klant (DPA-vereiste verwijst typisch naar sub-processors)

### G-18 — Sub-tenant model (`parent_tenant_id`) niet gebruikt

- **Spec:** §4.2 noemt `tenants.parent_tenant_id` voor consultancy-firma → consultants → eindklanten-hiërarchie
- **Werkelijkheid:** kolom `parent_tenant_id` ontbreekt in werkelijk schema
- **Governance-relevantie:** consultancy-tenant wil typisch *sub-tenants* per eindklant (KF heeft tenant `kingfisher`; daarbinnen sub-tenants per klant TLB/MAG/ACE/...). Vandaag: één-tenant-per-klant of alle KF-data in één tenant — beide niet ideaal voor governance.
- **Severity:** **M** zodra KF zelf-bediend meer klanten op platform zet

---

## Tweede-klant-readiness — governance-checklist

| Vereiste (uit notitie + spec §10) | Status | Gap-ID |
|---|---|---|
| EU-hosting (Supabase) | ✅ vermoedelijk | G-1 |
| Klant-zichtbare hosting-statement | ❌ | G-1, G-2 |
| RLS tenant-isolatie | ✅ technisch | G-3 |
| Bewijs van isolatie (tests, attestatie) | ❌ | G-3 |
| Role-based intra-tenant access | ❌ partieel (rol bestaat, geen ACL per canvas) | G-5 |
| Auditeerbare platform_admin-toegang | ❌ | G-4 |
| Audit-log (alle niet-triviale acties) | ❌ | G-12, G-14 |
| Data-export UI | ❌ | G-7 |
| Data-delete UI | ❌ | G-8 |
| DPA-template | ❌ | dimension-overarching |
| Retention-policy + auto-delete | ❌ | G-6 |
| AI-provider-DPA / sub-processor-statement | ❌ | G-17 |
| Geen PII in productie-logs | ❌ partieel — 5 `console.log` lekken | G-15 |
| Incident-respons (Sentry, status-page) | ❌ | G-16 |
| TOS / IP-eigendom van inzichten | ❌ | G-10 |

**Conclusie:** voor tweede *betalende* klant is **vrijwel niets** governance-mature. Voor *interne* tweede tenant (Kees beheert beide) is het werkbaar. **Notitie-aanwijzing:** dit hoeft niet per direct opgelost — wel meenemen in roadmap-denken voor wanneer commerciële conversatie start.

---

## Risico's bij doorontwikkeling zonder governance-aandacht

### R-1 — Elke nieuwe AI-feature versterkt de governance-schuld

Nieuwe AI-features die meer data persisten (volledige document-snapshots in DB i.p.v. alleen embeddings, cross-canvas-Inzichten, AI-history-log) verergeren elk van de vier dimensies tegelijk. Notitie waarschuwt expliciet: *"controleren of nieuwe features deze dimensie niet nog ingewikkelder maken (bijv. nieuwe AI-functies die meer strategische data persist-en zonder dat governance daar mee meeschaalt)"*.

### R-2 — Een vroege "verkeerde" klant kan publiek incident worden

Als platform tweede klant aanneemt zonder DPA en er ontstaat een data-incident (zelfs een kleine: KF-consultant opent verkeerd tenant-canvas), is dat publiek-relevant nieuws gegeven de strategische gevoeligheid van de data. **Reputatie-asymmetrie:** klein incident, groot reputatie-effect.

### R-3 — Audit-trail-gat is retro-actief niet te repareren

Wat **vandaag** niet wordt gelogd, is *morgen* niet meer terug te halen. De Novius-incident-historie is al verloren. Hoe langer geen audit-log, hoe meer "blanco" historie.

### R-4 — Single-contributor + hardcoded admin-email

Spec §15.2 verbiedt hardcoded tenant-IDs. Werkelijkheid hardcodet hardcoded admin-email. Bij ziekte/wegval van Kees heeft niemand admin-toegang zonder migratie. Klant kan dit ervaren als "key-person-dependency" risico.

### R-5 — IP-positionering en governance lopen door elkaar

Kees-besluit "wie is eigenaar van AI-output" (G-10) raakt zowel governance (klant-vraag) als IP (holding-positie). Vroege keuze maakt latere posities makkelijker — late keuze creëert default-by-erosion.

---

## Wat dit niet is (notitie-grenzen)

- **Geen security-audit** — Supabase EU + RLS is voor huidige fase passend; dit document raakt geen aanvallen, encryptie, of pen-test-bevindingen
- **Geen DPA-template** — alleen vaststelling dat hij ontbreekt, niet de tekst zelf
- **Geen feature-specs** — G-7 (export) of G-8 (delete) krijgen geen design hier
- **Geen acute zorg framing** — risico's R-1 t/m R-5 zijn roadmap-input, niet incident-melding
- **Geen feature-aanvraag** — niets om in een sprint te plannen

---

## Verificatie-paragraaf

### Wat ik heb gedaan voor compleetheid

- **Governance-notitie integraal als meetlat** — vier dimensies expliciet apart behandeld + cross-cutting + risico's-sectie
- **Fase 1 02-architectuur (RLS, multi-tenancy, deploy)** als bron voor "huidige stand" per dimensie
- **Spec §10 (beveiliging) + §11.4 (omgevingen)** als referentie voor wat formeel verwacht wordt
- **Cross-link naar 01-spec-gap (S-1, S-8, S-17, S-30, S-40, S-41) en 02-ip-gap (IP-1, IP-16) en 03-functioneel-gap (F-9, F-11, F-15)** waar governance-issues correlaat zijn
- **Tweede-klant-readiness-tabel** als concrete uitwerking van notitie-vraagstelling

### Niet onderzocht en waarom

- **Werkelijke Supabase-region** — fase 1 noemt project-ID maar niet expliciet de region. Vraag voor Kees (G-1).
- **Anthropic/OpenAI dataretention-policies** — niet onderzocht; G-17 noemt het ontbreken van inventarisatie, niet de werkelijke policies
- **Vercel-region** — niet onderzocht; relevant voor G-1
- **Werkelijke `auth.users` content / aantal users per tenant** — fase 1 noemt 2 tenants en ~2 users (Kees in beide); niet zelf gequeried
- **Werkelijke retention/backup-instellingen Supabase** — Supabase PITR is default; niet bevestigd of langer geconfigureerd
- **Werkelijke ToS / privacy-policy** — niet aanwezig in repo; geen aparte juridische tekst gevonden
- **DPO-rol of equivalent** — niet onderzocht (Werk-BV / holding-structuur)
- **Cookies / tracking** — fase 1 noteerde geen analytics; geen cookie-consent-banner gezien

### Verificatie-steekproeven (3 willekeurige bevindingen herverifieerd)

1. **G-3 RLS-helpers bestaan op data-tabellen** — fase 1 02-architectuur §7 bevestigt: `current_tenant_id()` en `current_user_role()` als SECURITY DEFINER functies in migratie 20260424030000; gebruikt in RLS-policies op canvases en downstream-tabellen. ✅
2. **G-4 admin-RLS op email** — fase 1 03-namen-en-termen §1 #42 + 02-ip-gap IP-16: migratie `20260420150000_fix_admin_email.sql:10-11` hardcodet `auth.email() = 'smaling.kingfisher@icloud.com'`; helper `current_user_role()` bestaat sinds migratie 4 dagen later (20260424030000) maar admin-policy is niet gemigreerd naar role-check. ✅
3. **G-15 console.log lekt user-data** — fase 1 05-tech-debt §3 noemt 5 specifieke locaties met regel-nummers (canvas.service.js:48,64,98 / embedding.service.js:156 / api/magic.js:65) en bevestigt: "Geen logger-wrapper gebruikt voor de volgende `console.log` (gaan dus letterlijk naar browser-console / Vercel-runtime-logs in productie)". ✅

### Bekende blinde vlekken

- **Severity-toekenning subjectief** — "tweede klant"-meetlat geeft één lens. Voor "interne fase-1-gebruik" zouden meeste M-severity-items L worden.
- **Notitie-grenzen strict gevolgd** — geen security-bevindingen, geen feature-specs. Sommige grijsgevallen (bv. G-15 logging) raken security maar zijn opgenomen vanwege governance-relevantie.
- **Geen vergelijking met andere SaaS-platformen** — relatief framework ontbreekt; ik kan niet zeggen "dit is normaal voor fase-1" of "dit is achterstand". Vergelijking voor Kees-team.
- **Geen werkelijke klant-vragen-set** — KAR-input (Klanten Advies Raad uit notitie) is niet beschikbaar; mijn invulling van "wat klant zou vragen" is afgeleid van notitie + algemene SaaS-DPA-praktijk.
- **AI-provider-flow-detail** — G-17 noemt het probleem maar niet welke specifieke velden naar welke provider. Een echte sub-processor-DPA vereist die inventarisatie; ik heb hem niet gemaakt (zou aparte sessie zijn).
- **Audit-log-design** — meermaals als gap genoemd (G-4, G-12, G-14) maar geen schema-voorstel — niet binnen scope (notitie verbiedt feature-specs).
