# Audit-opdracht 1 — Inventarisatie huidige staat

## Samenvatting

Maak een volledige feitelijke foto van de codebase op dit moment. Vijf documenten als output: functionele staat, architecturale staat, voorkomen van merk- en methode-namen, AI-prompts, en een aanvulling op tech_debt. Geen oordeel, geen prioritering, geen aanbevelingen — alleen documenteren wat er is. Bij twijfel rapporteren met vraagteken in plaats van weglaten. Bij gevonden problemen tijdens de scan: apart parkeren, niet oplossen.

Deze inventarisatie is input voor twee vervolgaudits — gap-analyse t.o.v. architectuur-spec, en IP-toets op methode-onafhankelijkheid. Volledigheid en feitelijkheid zijn nu belangrijker dan beoordeling. Plan ongeveer een halve tot hele werkdag.

---

## Doel en context

Een feitelijke documentatie van waar het platform vandaag staat. Niet *waar het naartoe moet* — dat komt in een vervolgopdracht. Hier alleen *wat er is*.

De inventarisatie wordt later gebruikt voor:
1. Gap-analyse t.o.v. de architecture-spec en strategische ambitie
2. IP-toets t.o.v. methode-onafhankelijkheid (na een extern IP-gesprek)
3. Strategische heroriëntatie (KF-only vs breder platform)

Daarom is deze inventarisatie de **basis** waar drie vervolgexercities op rusten. Gaten of fouten hier worden in de vervolgaudits versterkt. Volledigheid en feitelijkheid wegen dus zwaar.

---

## Algemene werkwijze

Geen wijzigingen in de codebase. Geen aanbevelingen, geen oordeel ("dit zou beter kunnen", "dit is risicovol", "dit moet weg"). Alleen documenteren wat er staat, in welke laag, met locatie en context.

**Bij twijfel: documenteer het, met vraagteken.**  
Liever een lijst met tien vraagtekens die later beoordeeld worden dan een schone lijst die incompleet is. Het belangrijkste risico van deze audit is stille omissies — dingen die je ziet maar niet rapporteert omdat ze "niet duidelijk in scope" zijn. Bij twijfel hoort het in de lijst.

**Bij gevonden problemen tijdens de scan: parkeer, niet oplossen.**  
Als je een bug, security-issue, broken feature of duidelijke fout tegenkomt — schrijf het op in een aparte sectie aan het eind van `00-index.md` onder "opgemerkt-tijdens-audit". Verander niets. De audit moet zuiver feitelijk blijven; oplossingen komen later in een aparte sessie.

**Bij ideeën voor verbetering: parkeer apart.**  
Als je tijdens het scannen denkt *"dit moet eigenlijk anders"* — schrijf dat niet in de inventarisatie zelf. Schrijf het in een sectie "observaties voor latere fase" in `00-index.md`. Houd de inventarisatie schoon.

**Onbekend = onbekend.**  
Als iets niet duidelijk te bepalen is, schrijf dat. Niet gokken, niet invullen.

**Volledigheid boven beknoptheid.**  
Een lange lijst die later gefilterd wordt is beter dan een korte lijst met gemiste items.

---

## Diepte van de scan

Niet alleen letterlijke string-matches via grep — dat geeft een onvolledig beeld. Voor deze audit hoort:

- **Patroon-zoek én pattern-recognition.** Engelse vertalingen van Nederlandse termen ("Strategic Themes" voor "Strategische Thema's"), afkortingen, varianten, accent-vrije versies, alt-teksten op afbeeldingen, ARIA-labels, error-messages, Sentry-tags, console.log-strings.
- **Volledige bestand-leesfase voor representatieve files.** Lees minstens deze bestanden volledig in plaats van alleen op grep: `App.js`, `LoginScreen.js`, alle `*Werkblad.jsx`, `AdminPage.jsx`, `ErrorBoundary.jsx`, alle `*OnePager.jsx`, alle `prompts/*.js` of vergelijkbaar, `index.html`, `manifest.json`, `package.json`, `README.md`, `CLAUDE.md`. Termen kunnen in commentaar of vertaalde varianten staan die grep mist.
- **Git-log inspectie.** Laatste zes maanden van commit-messages en branch-namen op merknaam-voorkomens. Niet de hele history doorploegen — recente periode is voldoende voor patroon-detectie.
- **Database-content scan.** Niet alleen schema (kolomnamen, tabelnamen) maar ook de feitelijke records in `app_config`, `tenants.theme_config`, en seed-data. Termen kunnen in waarden zitten, niet alleen in keys.
- **Afhankelijkheden en metadata.** `package.json` `name`/`description`, repo-naam, Vercel-project-naam, Supabase-project-naam.

---

## Stijl van rapportage

Bij elke vermelding niet alleen locatie maar ook één regel context. Die context bepaalt of iets in laag 1, 2 of 3 hoort.

```
❌ Niet zo:
src/App.js:84 — Kingfisher

✅ Wel zo:
src/App.js:84 — alt-tekst van logo, hardcoded string in JSX (geen appLabel-call)
```

De context maakt het verschil tussen "snel weg te halen" en "raakt design-keuze die we apart moeten beoordelen".

---

## Verificatie-discipline

Aan het eind van elk document: een korte **verificatie-paragraaf** met:
- Wat heb je gedaan om compleetheid te garanderen (welke commando's, welke bestanden volledig gelezen, welke methodes gebruikt)
- Wat heb je expliciet niet onderzocht en waarom (bijv. "node_modules niet gescand", "git history pre-2026 niet bekeken")
- Voor minimaal drie willekeurige bevindingen per document: open het bestand handmatig en verifieer dat de context klopt. Documenteer dat je dat hebt gedaan.

Doel: ik moet kunnen vertrouwen op compleetheid en kunnen zien waar de blinde vlekken zitten.

---

## Output-structuur

Vijf documenten in `docs/audit/2026-XX-XX/`:

- `00-index.md` — overzicht, totale omvang, "opgemerkt-tijdens-audit"-sectie, "observaties voor latere fase"-sectie
- `01-functioneel.md` — wat het platform vandaag kan
- `02-architectuur.md` — hoe het technisch is gebouwd
- `03-namen-en-termen.md` — voorkomen van merk- en methode-namen
- `04-prompts.md` — alle AI-prompts inclusief volledige tekst
- `05-tech-debt-aanvulling.md` — aanvullingen op `tech_debt.md`

---

## Document A — Functionele inventarisatie

**Doel:** wat kan het platform vandaag, vanuit gebruikers-perspectief?

Per werkblad / module documenteren:
- **Strategie** — welke velden, welke AI-functionaliteit, welke output (incl. Inzichten)
- **Richtlijnen** — idem
- **Klanten** — staat dit er al? Hoe ver? Welke velden / functies?
- **Organisatie** — idem
- **IT** — idem
- **Roadmap** — idem
- **Canvas-overzicht / dashboard** — wat ziet de gebruiker centraal
- **Onepager / Rapportage** — huidige output-kwaliteit, export-formaten

Per item:
- Status (af / in ontwikkeling / ontbreekt)
- Op welke laag het zit (UI / data / AI)
- Welke gebruikers-acties mogelijk zijn

Daarnaast op platform-niveau:
- Authenticatie en account-management
- Multi-tenancy: huidige implementatie en grenzen
- Theming / branding: wat is per tenant configureerbaar
- Admin-functionaliteit
- Document-upload en RAG: wat werkt, wat niet

Eindig met verificatie-paragraaf.

---

## Document B — Architecturale inventarisatie

**Doel:** hoe is het technisch gebouwd?

- **Frontend stack** — framework, build-tool, styling-aanpak, state-management, key dependencies (versies)
- **Backend / serverless** — waar draait AI-orchestratie, waar database-toegang, hoe is de API ingericht (routes, methods)
- **Database** — verwijs naar `DATABASE.md` voor schema, vul aan met wat daar niet staat (RLS-policies in detail, helper-functies, triggers, indexes)
- **AI-integratie** — welke modellen, hoe prompt-management, token-management, error-handling, retry-logica
- **Configuratie-laag** — hoe `app_config` werkt, key-categorieën, lookup-flow, fallback-mechanisme
- **Theming** — hoe theme_config geladen en toegepast, CSS-variabelen-flow
- **Multi-tenancy implementatie** — `tenants`-tabel, `user_profiles`-tabel, helper-functies (`current_tenant_id()`, `current_user_role()`), RLS-patronen, hoe het overgeërfd wordt op downstream-tabellen
- **Deploy & infra** — Vercel-setup, Supabase-setup, demo-omgeving (status), domeinen
- **Tooling** — ESLint-config, build-pipeline, test-coverage, pre-commit hooks
- **State-management compliance** — referentie naar `CLAUDE.md` sectie 4.1-4.6, huidige status per regel met locaties van non-compliance

Eindig met verificatie-paragraaf.

---

## Document C — Naam- en termen-inventarisatie

**Doel:** waar komen merk-, methode- en context-specifieke namen voor in de codebase?

Voor elk voorkomen: locatie (bestand + regel óf database-tabel + kolom + key + identifier), één regel context, en classificatie in een van drie lagen:

1. **Hardcoded** — staat in code (JSX, JS, comment, string-literal, alt-tekst, etc.), niet via configuratie aanpasbaar
2. **Configureerbaar per tenant** — staat in `app_config`, `theme_config`, of vergelijkbaar tenant-aanpasbaar veld
3. **Documentatie / metadata** — staat in `README.md`, `CLAUDE.md`, repo-naam, package.json, branch-namen, commit-messages

Termen om uitputtend te zoeken (incl. varianten, vertalingen, afkortingen, accent-loze versies):

- `Kingfisher`, `KF`, `Kingfisher & Partners`, `kingfisher.nl`, "kingfisher" in URLs
- `BTC`, `Business Transformation Canvas`, `business transformation canvas`, "Business-Transformation Canvas", canvas-gerelateerde varianten
- `Marc Beijen`, `Marc`, `Beijen` (in code, comments, prompts — niet in git history pre-2026)
- `Novius` (eerdere referentie in voorstel-document)
- Boek-titel en hoofdstuktitels indien herkenbaar
- Tagline `From strategy to execution`
- Branche-specifieke termen die KF-praktijk reflecteren: `verzekering`, `verzekeraar`, `insurance`, `financial services`, `HNW`, `wealth`, `Aegon`, `wealth protection`, andere klant-namen die mogelijk in seed-data of test-files staan

Bij twijfel of iets specifiek is of generiek (bijv. "transformatie" — generiek, "strategische thema's" — twijfel): documenteer met vraagteken, niet weglaten.

Eindig met verificatie-paragraaf.

---

## Document D — AI-prompts inventarisatie

**Doel:** alle AI-prompts gestructureerd documenteren, omdat prompts vaak methode-specifieke claims bevatten.

Voor elke prompt in code of `app_config`:
- Locatie (bestand + regel óf `app_config` key)
- Laag (hardcoded / configureerbaar)
- Volledige tekst van de prompt — niet samenvatten, integraal opnemen
- Per prompt expliciet noteren of de tekst bevat:
  - Methode-claims (*"je bent een BTC-consultant"*, *"volg de Business Transformation Canvas"*)
  - Verwijzingen naar specifieke auteurs of bronnen
  - Branche-specifieke aannames (financial services, insurance, etc.)
  - Klant-specifieke termen of voorbeelden

Geen oordeel — gewoon documentatie. Volledige tekst maakt latere beoordeling mogelijk zonder opnieuw zoeken.

Eindig met verificatie-paragraaf.

---

## Document E — Tech debt en open items aanvulling

**Doel:** wat staat er aan technical debt op dit moment, los van wat al in `tech_debt.md` staat?

- Verwijs naar `tech_debt.md` voor de huidige stand — niet opnieuw uitschrijven
- Vul aan met items die wel bestaan maar niet in `tech_debt.md` staan:
  - TODO-comments in code (uitputtend opzoeken)
  - FIXME's en HACK-comments
  - Debug-logs die nog niet zijn opgeruimd
  - Console.log statements die in productie staan
  - Hardcoded test-waardes of placeholders
  - Uit-commentariede code-blokken die wachten op iets
- Items uit `parking-lot.md` voor zover relevant — kort genoemd, niet uitschrijven
- Bekende compliance-gaps tegen `CLAUDE.md` sectie 4 — status per regel 4.1-4.6 met locatie van non-compliance

Geen prioritering — alleen lijst.

Eindig met verificatie-paragraaf.

---

## Document 00 — Index

Twee tot drie zinnen per document over wat erin staat en de omvang. Plus:

- **Sectie "opgemerkt-tijdens-audit"** — bugs, security-issues, broken features die je tegenkwam. Korte beschrijving + locatie. Geen oplossingen.
- **Sectie "observaties voor latere fase"** — gedachten over wat structureel beter kan, opgeslagen voor later, niet in de inventarisatie zelf.
- **Globale verificatie-paragraaf** — wat heb je niet onderzocht en waarom, totale tijdsinvestering, eventuele beperkingen waar je tegenaan liep.

---

## Wat dit niet is

Geen beoordeling, prioritering of roadmap. Het is een foto. Beslissingen volgen in vervolgopdrachten zodra deze inventarisatie compleet is.

Geen wijzigingen aan de codebase. Geen "kleine fixes meegenomen". Geen "even iets opgeruimd". Pure documentatie.

Geen IP-oordeel. Termen worden gedocumenteerd, niet beoordeeld op IP-risico — dat komt in een aparte audit na een extern IP-gesprek.
