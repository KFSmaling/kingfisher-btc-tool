# Audit-opdracht 2 — Gap-analyse

> **Status:** definitief, akkoord Kees 2026-05-02.
> **Volgt op:** `AUDIT_PROMPT_1_INVENTARISATIE.md` — fase 1 leverde de *foto*, fase 2 levert de *gap-meting*.
> **Branch-flow:** uitvoer op aparte branch `audit/<datum>-fase2`. Niet op master mergen voordat peer reviewer (Cowork) heeft gereviewd.

## Samenvatting

De inventarisatie uit fase 1 (`docs/audit/2026-05-01/`) zegt *wat er staat*. Fase 2 zegt *wat er ontbreekt of afwijkt* — gemeten tegen vier meetlatten:

1. **Architectuur-spec** — wat in `docs/architecture-spec.md` staat als verplichting
2. **IP-defensie** — wat methode-onafhankelijkheid bedreigt (input voor IP-jurist)
3. **Functionele ambitie** — wat het platform belooft te zijn (4 stub-blokken, output B Rapportage, etc.)
4. **Data-governance voor strategische bedrijfsinformatie** — hosting, toegang, retentie, eigendom-van-inzichten

Output: 4 dimensie-documenten + index met cross-cutting gaps en een prioritering-tabel die elke gap koppelt aan een masterplan-cleanup-sprint. Vormt input voor cleanup-sprints (masterplan stap 4–7), fase 3 functionele platform-beschrijving en het IP-jurist-gesprek.

Plan ongeveer een halve tot hele werkdag.

---

## Doel en context

Fase 1 was uitputtend en feitelijk. Fase 2 is interpretatief en prioriterend. Voor elke gap wordt de bouwer gevraagd:

- Bestaat er een gap tussen meetlat en werkelijkheid?
- Hoe groot is de gap (omvang in code, omvang in gedrag)?
- Wat is de remediatie-richting (geen oplossing schrijven, wel klasse benoemen: documentatie-update / config-shift / schema-uitbreiding / herontwerp)?
- Welke prioriteit (laag/middel/hoog) en in welke cleanup-sprint hoort het?

Dit is geen volledige roadmap. Het is een **beoordelings-document** dat Kees in staat stelt knopen door te hakken in cleanup-sprints en het IP-gesprek.

---

## Algemene werkwijze

**Alleen documenteren, geen wijzigingen aan code of database.**

**Bij elke gap concreet zijn:**
- Naar welke regels in welke bron-document(en) verwijs je (architectuur-spec sectie X.Y, audit fase 1 §Z, data-governance notitie sectie A)
- Welke locaties in de codebase het zichtbaar maken (bestand + regel of DB-tabel + key)
- Welke remediatie-klasse past (docs-update / config-shift / schema-uitbreiding / herontwerp / beslissing nodig)

**Bij twijfel: documenteer met vraagteken.** Liever te veel gaps die later verworpen worden dan te weinig.

**Bij scope-creep: stop.** Als een gap-analyse leidt naar "wat je *zou moeten doen*" met implementatie-detail — stop daar. Implementatie hoort in cleanup-sprints, niet in fase 2.

**Bij conflicterende meetlatten: documenteer beide.** Architectuur-spec kan iets eisen wat IP-defensie tegenwerkt, of omgekeerd. Beide opnemen, niet zelf prioriteren.

**Verificatie-discipline analoog fase 1:**
- Aan eind van elk document: kort blok met "wat heb ik gedaan voor compleetheid", "wat heb ik niet onderzocht", drie steekproeven van bevindingen handmatig herverifieerd.

---

## Output-structuur

Vijf documenten in `docs/audit/<uitvoerdatum>-fase2/`:

- `00-index.md` — overzicht, cross-cutting gaps, prioritering-tabel, verificatie
- `01-spec-gap.md` — gaps t.o.v. architectuur-spec
- `02-ip-gap.md` — gaps t.o.v. methode-onafhankelijkheid (incl. IP-jurist-vragen-set)
- `03-functioneel-gap.md` — gaps t.o.v. functionele ambitie
- `04-governance-gap.md` — gaps t.o.v. data-governance voor strategische bedrijfsinformatie

---

## Document A — Spec-gap (`01-spec-gap.md`)

**Meetlat:** `docs/architecture-spec.md` integraal.

Per spec-sectie (1 t/m 12) doorlopen. Voor elke verplichting of principe in de spec: bestaat er een gap, en hoe groot?

**Sleutel-secties met verwachte hoge gap-density:**

- **§2.1 Drie-lagen-scheiding** (platform/content/brand) — fase 1 toont al dat `app_config` global is i.p.v. tenant-scoped, terwijl content per tenant moet kunnen
- **§2.2 Configuratie boven code** — fase 1 toont 3 prompts zonder DB-override, hardcoded labels in `LoginScreen.js`/`ProjectInfoSidebar.jsx`, hardcoded EXAMPLE_BULLETS
- **§2.3 Multi-tenancy vanaf dag één** — fase 1 toont email-hardcoded RLS-policy in plaats van rol-gebaseerd
- **§2.4 Geen firma-specifieke aannames** — fase 1 toont 54+ Kingfisher-vermeldingen, branche-jargon in productie-prompts
- **§3 Tech stack** — vergelijk spec-keuzes (React 18 + Vite + TypeScript + shadcn) met werkelijkheid (React 19 + CRA + JS + geen shadcn) — gap of bewuste afwijking?
- **§4 Multi-tenant datamodel** — spec heeft `content_packs`, `analyses`, `simulations`, `subscriptions`, `credits_ledger`, `exports`, `audit_log`; werkelijkheid heeft andere ontologie. Hoe groot is het gat?
- **§5 Design tokens** — spec heeft uitgebreid token-schema (typografie, layout, density, radius, shadow_style); werkelijkheid heeft 10 CSS-variabelen
- **§10 Beveiliging** (raakt ook 04-governance-gap)

**Per gap noteren:**
- Spec-regel (sectie + regelnummer)
- Werkelijkheid (audit fase 1 verwijzing + bestand:regel of DB-key)
- Remediatie-klasse (docs-update als spec achterloopt, of config-shift / schema-uitbreiding / herontwerp als code achterloopt)
- Severity (laag/medium/hoog) met motivatie

**Niet doen:** spec opnieuw schrijven of verbeteren. Bij vermoede tekortkoming in spec: vlag in 00-index als "spec-update nodig", schrijf hem niet zelf.

---

## Document B — IP-gap (`02-ip-gap.md`)

**Meetlat:** methode-onafhankelijkheid + IP-defensie tegen mogelijke claim van BTC-boek-auteurs.

Per voorkomen uit fase 1 Document C en D beoordelen op IP-relevantie.

**Categorieën per voorkomen:**
- **Methode-claim** — tekst stelt expliciete BTC/methode-eigenaarschap of expertise (`prompt.strategy.analysis` "gespecialiseerd in Business Transformatie Canvas en Novius model")
- **Auteurs-attributie** — Beijen/Heetebrij/Tigchelaar genoemd
- **Methode-structuur ontleend** — 7 BTC-blokken als BLOCKS-array, Inzichten-pattern, Stip op de Horizon
- **Methode-content ontleend** — TipsModal-content paraphrasing
- **Externe consultancy-referentie** — McKinsey/BCG style-claims
- **Klant-IP** — TLB/MAG/ACE/Spain/Santander/GTS — niet methode-IP maar contractueel risico
- **Branche-positionering** — verzekerings-jargon en "financiële sector"-claim

**Per voorkomen noteren:**
- IP-risico-classificatie (geen / laag / middel / hoog) met motivatie
- Wat het zou betekenen voor methode-onafhankelijkheid als het blijft staan
- Remediatie-richting (vervangen / generaliseren / per-tenant-content / weghalen)
- Cross-link naar architectuur-spec §2.4 indien spec-relevant

**Niet doen:** zelf juridische uitspraken. Documenteer als input voor IP-jurist; niet als oordeel.

### Eindsectie: IP-jurist-vragen

**Genereer een lijst concrete vragen** voor het IP-jurist-gesprek, gebaseerd op de onzekerheidsgraden in de gevonden voorkomens. Bv:

- *"Hoe verhoudt de claim 'gespecialiseerd in Business Transformatie Canvas' in een productie-AI-prompt zich tot het BTC-boek-IP?"*
- *"Klant-namen (TLB, MAG, ACE) in dood-code in een publieke repo — vereist dit notificatie aan de betreffende klanten of git-history rewrite?"*
- *"Methode-structuur (7 blokken, naamgeving) is overgenomen uit het BTC-boek — is dat copyright/IP-relevant of valt dat onder gangbare consultancy-frameworks?"*

Doel: Kees moet de lijst kunnen aanpassen voor zijn eigen gesprek-stijl, niet alle vragen letterlijk gebruiken.

Tussen 5 en 15 vragen, gegroepeerd per categorie.

---

## Document C — Functioneel gap (`03-functioneel-gap.md`)

**Meetlat:** wat het platform *belooft* te zijn — als platform-van-holding, methode-agnostisch, multi-tenant. Plus wat in `tech_debt.md` als roadmap-vooruitzicht staat.

**Bekende gaps uit fase 1:**

- **4 stub-werkbladen** (Klanten / Processen / Technologie / Portfolio)
- **Output B Rapportage** — staat al jaren in tech_debt, niet gestart
- **Inzichten op Richtlijnen-werkblad** — Sprint A/B alleen op Strategie
- **Tenant-admin functies** — geen UI voor per-tenant config, geen tenant-switcher voor platform_admin (#71)
- **Auto-aanmaak `user_profiles`** — handmatig per gebruiker (#70)
- **i18n-architectuur** — `useLang().t()` en `useAppConfig().label()` parallel, niet gesynced

**Per gap noteren:**
- Spec/ambitie-regel (welke belofte schendt het, welke roadmap-item is het)
- Huidige status (afwezig / stub / half af / volwaardig)
- Wat ontbreekt minimaal voor "tweede tenant kan productief gebruiken"
- Remediatie-klasse + grove effort-indicatie (klein/middel/groot — geen exacte schatting)

**Niet doen:** sprint-planning maken. Wel volgorde-suggesties.

---

## Document D — Governance-gap (`04-governance-gap.md`)

**Meetlat:** de vier dimensies uit `peer-reviews/inputs/2026-04-26-data-governance-strategische-klantdata.md`:

1. **Hosting** — waar staat data, kunnen klanten dat verifiëren
2. **Toegang en governance** — wie kan wat zien (tenant-isolatie, role-based binnen tenant, platform_admin-rechten)
3. **Retentie en exit** — wat gebeurt aan einde contract, kan klant data exporteren/wissen
4. **Eigendom van inzichten** — wie is eigenaar van AI-gegenereerde patronen

**Per dimensie noteren:**
- Wat is huidige stand (op basis van fase 1 02-architectuur + live DB-state)
- Wat is gat richting "tweede betalende klant" (de termijn-indicatie uit de notitie)
- Welke ontbrekende features (DPA-template, audit-log, role-based access intra-tenant, data-export/delete UI, enterprise data-isolatie)
- Welke risico's bij doorontwikkeling zonder governance-aandacht

**Niet doen:**
- Geen security-audit van huidige opzet (Supabase EU + RLS is voor huidige fase passend)
- Geen DPA-template schrijven, geen feature-specs maken
- Geen acute zorg framing — dit is roadmap-input voor tweede klant

**Wel:** identificeren of huidige architectuur-keuzes deze dimensies blokkeren of openhouden. Bv: `app_config` global maakt per-tenant prompt-customization onmogelijk → blokkeert "toegang en governance"-dimensie als klant eigen prompts wil.

---

## Document 00 — Index

**Korte samenvatting (2-3 zinnen) per dimensie-document.**

**Cross-cutting gaps** — zaken die in meerdere dimensies opduiken. Bv:
- `app_config` global is spec-gap, IP-gap, functioneel-gap én governance-gap
- Hardcoded RLS-email is spec-gap, governance-gap
- Stub-werkbladen zijn functioneel-gap, mogelijk IP-gap

**Prioritering-tabel — verplicht onderdeel.** Per gap (uit alle 4 documenten) één rij:

| ID | Dimensie | Gap | Severity | Klasse | Dependency | Voorgestelde sprint |
|---|---|---|---|---|---|---|
| (genereer) | (1/2/3/4) | (korte beschrijving) | (L/M/H + 1 zin motivatie) | (docs-update / config-shift / schema-uitbreiding / herontwerp) | (welke andere gaps moeten eerst) | (masterplan stap 4/5/6/7 of "nieuw") |

Severity = subjectief, met motivatie. Voorgestelde sprint = mapping naar masterplan stap 4–7 of "nieuw".

**Verificatie-paragraaf** als in fase 1.

---

## Wat dit niet is

- **Geen sprint-planning.** Prioritering zegt "dit eerst", niet "in deze week, met deze taken".
- **Geen oplossingen.** Remediatie-richting is een klasse, geen design.
- **Geen herziening van architectuur-spec.** Bij vermoede tekortkoming: vlag, niet herschrijf.
- **Geen IP-oordeel.** Vragen-set voor jurist; niet vervanger van het gesprek.
- **Geen security-audit.** Governance-dimensie is commercieel-strategisch, niet acute kwetsbaarheid.
- **Geen wijzigingen aan codebase of database.** Dit is een leesopdracht.

---

## Branch en commits

- Branch-naam: `audit/<datum-uitvoer>-fase2` (bv. `audit/2026-05-02-fase2`)
- Commit per document: `audit-fase2(<datum>): document X — korte beschrijving`
- Niet mergen naar master — peer reviewer (Cowork) reviewt eerst.
