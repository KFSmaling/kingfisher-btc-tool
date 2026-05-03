# 02 — IP-gap

**Audit-datum:** 2026-05-03 (fase 2)
**Branch:** `audit/2026-05-03-fase2`
**Meetlat:** methode-onafhankelijkheid + IP-defensie tegen mogelijke claim van BTC-boek-auteurs (Marc Beijen, Ruben Heetebrij, Roos Tigchelaar) en — los daarvan — klant-contractueel risico (gebruik van klant-namen).
**Bron:** fase 1 documenten C (`03-namen-en-termen.md`) en D (`04-prompts.md`) integraal.

**Doel:** per voorkomen IP-risico-classificatie + remediatie-richting + cross-link naar spec §2.4 / §6.3. **Geen juridisch oordeel** — input voor IP-jurist-gesprek (eindsectie).

**Risico-classificatie-schaal (gebruikt in dit document):**
- **Geen** — geen IP-relevantie
- **Laag** — extern gevestigd of generiek; eigendomsclaim onwaarschijnlijk maar mogelijk gespreks-onderwerp
- **Middel** — methode/auteurs/klant herkenbaar; relevant voor IP-jurist
- **Hoog** — actieve productie-claim van methode/eigenaarschap/klant-naam; expliciet juridisch-relevant

**Remediatie-richtingen (klasse-niveau, geen oplossing):**
- **vervangen** — voorkomen vervangen door equivalent generiek (bv. "Senior Strategie Consultant" zonder firma)
- **generaliseren** — formulering breder maken (bv. "transformatie" i.p.v. "BTC")
- **per-tenant-content** — verplaatsen naar tenant-scoped content-pack (vereist S-1/S-22 uit 01-spec-gap)
- **weghalen** — wissen, ook uit git-history indien relevant
- **beslissing nodig** — Kees-keuze tussen strategie-opties

---

## 1. Methode-claim — actieve productie

**Definitie:** AI-prompt of UI-tekst stelt expliciete claim van methode-eigenaarschap, expertise of specialisatie.

### IP-1 — `prompt.strategy.analysis` (live DB) — "Business Transformatie Canvas en Novius model"

- **Locatie:** live DB `app_config` key `prompt.strategy.analysis` (fase 1 04-prompts §A.16)
- **Letterlijk:** *"Je bent gespecialiseerd in het Business Transformatie Canvas en Novius model."*
- **Aanroep-pad:** "Analyse draaien"-knop in StrategieWerkblad → `/api/strategy mode=analysis` → AI-rol-instructie
- **IP-risico:** **Hoog** — actieve productie-claim van twee separate methode-eigendommen tegelijk:
  - **BTC**: methode-eigen aan boek-auteurs Beijen/Heetebrij/Tigchelaar (potentiële claim-houders)
  - **Novius**: methode van Novius BV (separate consultancy)
- **Methode-onafhankelijkheid:** schendt direct. Het platform claimt niet methode-agnostisch te zijn maar specialisatie in twee specifieke methodes. Bij elke "Analyse draaien"-actie wordt deze claim gegenereerd richting AI-provider.
- **Audit-trail-gat (cross-link 05-tech-debt §7.1):** deze tekst staat **niet** in de migratie `20260425000000_inzichten_sprint_a.sql`. Handmatig toegevoegd via Admin-UI of direct SQL UPDATE — **buiten versie-beheer om**. Wie de wijziging heeft gemaakt is niet via repo te traceren.
- **Remediatie-richting:** **generaliseren** ("Senior Strategie Consultant" zonder methode-specialisatie) **en/of** **per-tenant-content** (claim alleen toelaatbaar voor Kingfisher-tenant; default tenant zonder methode-claim). Na fix: audit-log nodig om herhaling te voorkomen.
- **Cross-link spec:** §2.4 (firma-aannames) + §6.3 ("De initiële framework-implementaties moeten geen terminologie bevatten waar mogelijk derde-partij rechten op rusten") + §10 (audit-logging).

### IP-2 — `prompt.validate` (live DB + `api/validate.js:7-40`) — "Business Transformatie Canvas (BTC)"

- **Locatie:** live DB `app_config` key `prompt.validate` + identiek hardcoded in `api/validate.js`
- **Letterlijk:** *"Je bent een senior auditor bij Kingfisher & Partners. Beoordeel de tekst op bruikbaarheid voor het Business Transformatie Canvas (BTC)."*
- **Aanroep-pad:** BTC Validator (Poortwachter) — pre-flight check bij elke document-upload
- **IP-risico:** **Hoog** — dubbele claim (KF-naam + BTC-methode-naam) per upload, naar AI-provider
- **Methode-onafhankelijkheid:** schendt direct
- **Remediatie-richting:** **vervangen** ("auditor" zonder firma-naam) + **generaliseren** ("strategisch raamwerk" i.p.v. "BTC")
- **Cross-link spec:** §2.4 + §6.3

### IP-3 — `prompt.improve.system` (`api/improve.js:31`) — system-prompt-fallback

- **Locatie:** hardcoded `api/improve.js:31-33`; **geen DB-override** beschikbaar (er is geen `prompt.improve.system` key)
- **Letterlijk:** *"Je bent een senior strategie-consultant bij Kingfisher & Partners die teksten voor het Business Transformatie Canvas verfijnt."*
- **Aanroep-pad:** elke Improve-preset-knop (4 presets: inspirerender / mckinsey / beknopter / financieel) op missie/visie/ambitie
- **IP-risico:** **Hoog** — dubbele claim per Improve-actie. Niet via Admin-UI te wijzigen.
- **Remediatie-richting:** **vervangen** + **config-shift** (DB-key toevoegen om Admin-UI-wijziging mogelijk te maken; cross-link 01-spec-gap S-5)
- **Cross-link spec:** §2.4 + §2.2.c (prompts via DB) + §6.3

### IP-4 — `prompt.magic.system_heavy` (live DB + `api/magic.js:37-56`) — "McKinsey/BCG-niveau, financiële en verzekeringssector, Kingfisher & Partners"

- **Locatie:** live DB `app_config` key + identiek hardcoded
- **Letterlijk:** *"Je bent een Senior Strategie Consultant op McKinsey/BCG-niveau, gespecialiseerd in business transformatie voor de financiële en verzekeringssector bij Kingfisher & Partners."*
- **Aanroep-pad:** Magic Staff in heavy-mode (SWOT-velden, kernwaarden) → `/api/magic`
- **IP-risico:** **Hoog** — drie verschillende claim-categorieën in één prompt: externe consultancy-merken (McKinsey/BCG, style-referentie), branche-claim (financiële/verzekeringssector), KF-firmanaam
- **Methode-onafhankelijkheid:** schendt direct
- **Remediatie-richting:** **generaliseren** + **per-tenant-content** (kingfisher-tenant kan eigen branche-formulering houden; default niet)
- **Cross-link spec:** §2.4 + §6.3

### IP-5 — `prompt.magic.system_standard` (live DB + `api/magic.js:14-23`) — "Kingfisher & Partners"

- **Locatie:** live DB + hardcoded fallback
- **Letterlijk:** *"Je bent een Senior Strategie Consultant bij Kingfisher & Partners, gespecialiseerd in business transformatie."*
- **Aanroep-pad:** Magic Staff standaard-mode (lichte velden) → elke Magic-knop op missie/visie/ambitie/kernwaarden
- **IP-risico:** **Hoog** — KF-naam in elke Magic-actie. Hoog-frequente trigger (vermoedelijk meest-gebruikte AI-actie).
- **Remediatie-richting:** **vervangen** + **per-tenant-content**
- **Cross-link spec:** §2.4

### IP-6 — `SYSTEM_GENERAL_KNOWLEDGE` (`api/magic.js:25-35`) — "Kingfisher & Partners", **geen DB-override**

- **Locatie:** hardcoded `api/magic.js:25-35`; geen DB-key
- **Letterlijk:** *"Je bent een Senior Strategie Consultant bij Kingfisher & Partners, gespecialiseerd in business transformatie."* + werkwijze-instructies voor wanneer Het Dossier onvoldoende bevat
- **Aanroep-pad:** Magic-mode `useGeneralKnowledge=true` (fallback wanneer RAG geen content vindt)
- **IP-risico:** **Middel** — KF-naam in een infrequenter aanroep-pad. Niet via Admin aanpasbaar.
- **Remediatie-richting:** **vervangen** + **config-shift** (DB-key toevoegen — cross-link 01-spec-gap S-5)
- **Cross-link spec:** §2.4 + §2.2.c

### IP-7 — `prompt.strategy.themes` + `api/strategy.js:51-61` — "McKinsey/BCG-niveau"

- **Locatie:** live DB + hardcoded fallback (identiek)
- **Letterlijk:** *"Je bent een Senior Strategie Consultant op McKinsey/BCG-niveau."*
- **IP-risico:** **Laag** — externe consultancy-merken, geen eigendomsclaim — als style-referentie. Niet methode-eigen aan KF of BTC.
- **Methode-onafhankelijkheid:** raakt niet de methode-vraag, wel positionering ("AI doet alsof het McKinsey-consultant is").
- **Remediatie-richting:** **beslissing nodig** — McKinsey/BCG zijn handelsnamen; gebruik als kwaliteits-referentie is gangbaar in consultancy-jargon, maar in een product-prompt richting AI-provider verschuift het van "interne stijl" naar "externe representatie".
- **Cross-link spec:** §2.4 (impliciet — geen firma-aannames)

### IP-8 — `prompt.improve.mckinsey` (live DB + `api/improve.js:10`)

- **Locatie:** live DB key `prompt.improve.mckinsey` + hardcoded preset
- **Letterlijk:** *"Herschrijf de tekst in een strakke, analytische McKinsey/BCG stijl."*
- **IP-risico:** **Laag** — gebruik van handelsnaam als bijvoeglijk naamwoord ("McKinsey-stijl"). Vergelijkbaar met "Apple-design" — niet eigendomsclaim, wel naam-gebruik.
- **Remediatie-richting:** **beslissing nodig** (rebrand naar "consultancy-stijl" of accepteren) — koppelt aan IP-7

---

## 2. Methode-claim — UI / niet-prompt

### IP-9 — App-titel "Business Transformation Canvas"

- **Locatie:** live DB `app_config.label.app.title` + fallback in `AppConfigContext.jsx` LABEL_FALLBACKS + `LoginScreen.js:84` hardcoded `<h1>` + `StrategyOnePager.jsx:67` print-header + ErrorBoundary footer
- **IP-risico:** **Hoog** — productnaam = methode-naam. Het platform identificeert zich publiek als "Business Transformation Canvas". Niet alleen intern AI-rol, ook user-facing app-naam en print-output.
- **Methode-onafhankelijkheid:** dit is de meest fundamentele schending. Het *product* heet de methode. Wijziging raakt branding-besluit.
- **Remediatie-richting:** **beslissing nodig** (product-rename — "Strategy Platform" zit al in `tenants.theme_config.product_name`) **en** **per-tenant-content** (per-tenant-naam mogelijk maken; vereist S-1/S-22)
- **Cross-link spec:** §2.4 + §6.3 ("derde-partij rechten")

### IP-10 — TipsModal expliciete boek-attributie

- **Locatie:** `TipsModal.jsx:11` (NL) + `TipsModal.jsx:89` (EN); `i18n.js:114` (NL footer) + `i18n.js:231` (EN footer)
- **Letterlijk (NL):** *"Op basis van het boek Business Transformatie Canvas van Marc Beijen, Ruben Heetebrij en Roos Tigchelaar."*
- **IP-risico:** **Middel-Hoog** — expliciete bron-attributie aan auteurs. Twee tegengestelde lezingen:
  - **Defensief** — attributie *erkent* IP en kan worden uitgelegd als correct citeerrecht / fair use
  - **Belastend** — attributie *bevestigt* dat het platform de methode implementeert; maakt impliciete kopie expliciet
- **Methode-onafhankelijkheid:** schendt direct (product erkent methode-bron)
- **Remediatie-richting:** **beslissing nodig** (jurist-vraag — zie eindsectie). Opties: behouden (attributie als verdediging), weghalen (methode-onafhankelijkheid), of generaliseren ("Op basis van gangbare consultancy-frameworks")
- **Cross-link spec:** §2.4 + §6.3

---

## 3. Methode-structuur ontleend (geen tekst-claim, wel structurele kopie)

### IP-11 — 7 BTC-blokken als `BLOCKS`-array

- **Locatie:** `BlockCard.jsx` BLOCKS-constant; `WERKBLAD_REGISTRY` in DeepDiveOverlay; `block_definitions` DB-tabel (7 keys); canvas-layout in App.js (rij 1: strategie, rij 2: principles, rij 3-quartet pijlers, rij 4: portfolio)
- **Structuur:** Strategy / Principles / Customers / Processes / People / Technology / Portfolio. Direct overgenomen uit BTC-boek-hoofdstukken.
- **IP-risico:** **Middel-Hoog** — methode-structuur, niet tekst. **Of** dit IP-relevant is hangt af van hoe ver "implementatie van methode-framework" valt onder copyright/methode-IP. **Vraag voor jurist** (eindsectie).
- **Methode-onafhankelijkheid:** schendt direct — alle code-paden gaan uit van deze 7 specifieke blokken; ander framework (SWOT, Porter, Wardley, Lean Canvas) zou code-deploy vereisen (cross-link 01-spec-gap S-4).
- **Remediatie-richting:** **per-tenant-content** (frameworks als data, zoals spec §6.1 voorschrijft) **of** **generaliseren** (blok-namen los van methode — bv. "Quadrant 1/2/3..." — maar dan verlies van betekenis). **Beslissing nodig.**
- **Cross-link spec:** §6.1 + §6.3

### IP-12 — Inzichten-pattern (Onderdeel / Dwarsverband)

- **Locatie:** `INZICHTEN_DESIGN.md` + `strategy_core.insights` JSONB-schema + InzichtenOverlay.jsx
- **IP-risico:** **Geen** — pattern is **eigen ontwerp** voor dit platform (per `INZICHTEN_DESIGN.md` documentatie + 03-namen-en-termen §11). Niet ontleend aan BTC-boek.
- **Aandachtspunt:** dit is een eigen IP-bouwsteen die *waarde* toevoegt; documenteren voor latere licentie/verkoop is verstandig (geen IP-gap, wel IP-asset).

### IP-13 — "Stip op de Horizon" / "Strategische Thema's" / "7·3·3 Regel"

- **Locatie:** `RichtlijnenWerkblad` context-strip + `StrategieWerkblad` sectie 3 ("Executie — 7·3·3 Regel") + LABEL_FALLBACKS + CLAUDE.md
- **IP-risico:** **Middel** — termen die mogelijk methode-eigen zijn:
  - "Stip op de Horizon" — NL-uitdrukking; gangbaar in consultancy maar mogelijk via BTC-boek geadopteerd (?)
  - "7·3·3 Regel" — wijst naar "max 7 strategische thema's, 3 KSF, 3 KPI per thema". TipsModal noemt expliciet "Het magische getal is 7" als BTC-tip. Sterk methode-correlaat.
  - "Strategische Thema's" — als losse term generiek, maar in de 7-thema-cap-implementatie is methode-link aanwezig
- **Methode-onafhankelijkheid:** middel-impact — termen suggereren methode zonder hem te noemen
- **Remediatie-richting:** **beslissing nodig** (jurist-vraag — vallen vakjargon-uitdrukkingen onder methode-IP?) **of** **generaliseren**
- **Cross-link spec:** §6.3

### IP-14 — `TipsModal` content (parafrasering BTC-boek)

- **Locatie:** `TipsModal.jsx` `TIPS_DATA`-constant — 7 secties (algemeen + 6 blokken-tips), in NL én EN
- **Inhoud (uit fase 1 03-namen-en-termen §10):**
  - "Het magische getal is 7" — letterlijk van BTC-boek
  - "Outside-in & Inside-out", "BCG-matrix" — gangbare strategie-jargon
  - Per-blok-tips: "Tight-loose karakter", "Stop/Start/Continue", "Life events als triggers", "Maak de zachte kant 'hard'", etc.
- **IP-risico:** **Middel** — parafrasering van methode-content. Onbekend hoe ver "tip in eigen woorden over methode-concept" onder copyright valt. **Vraag voor jurist.**
- **Combinatie met IP-10:** TipsModal expliciet "op basis van boek X" + parafraseert content uit dat boek = sterkere link naar methode-IP
- **Remediatie-richting:** **beslissing nodig** (jurist-keuze) of **vervangen** (eigen tips, generieke strategie-uitspraken)

---

## 4. Auteurs-attributie

### IP-15 — Marc Beijen / Ruben Heetebrij / Roos Tigchelaar — alle voorkomens

- **Locaties (uit fase 1 03-namen-en-termen §3):**
  - `i18n.js:114` (NL footer TipsModal)
  - `i18n.js:231` (EN footer)
  - `TipsModal.jsx:11` (NL intro)
  - `TipsModal.jsx:89` (EN intro)
  - `src/prompts/btcPrompts.js:4` (comment, dood code)
  - `src/prompts/btcPrompts.js:10` (prompt-tekst "developed by Marc Beijen", dood code)
- **IP-risico:** **Middel-Hoog** — naam-attributie aan reëel-bestaande personen die mogelijk claim kunnen maken. Twee lezingen identiek aan IP-10.
- **Bijzonder:** dood code (`btcPrompts.js`) bevat *"developed by Marc Beijen"* — historische claim die in publieke git-history staat. Wijst naar de "Marc Beijen als methode-uitvinder"-positionering die ook in fase 1 sectie B (observaties) is vermeld.
- **Remediatie-richting:** TipsModal: **beslissing nodig** (zie IP-10). Dood code: **weghalen** (mogelijk inclusief git-history-rewrite, jurist-vraag). 
- **Cross-link spec:** §2.4 + §6.3

### IP-16 — "Kees Smaling" persoonsnaam in repo + DB-seeds

- **Locaties (uit fase 1 03-namen-en-termen §8):**
  - Privé-mail in `tests/example.spec.js:14, 33`
  - Werkelijke Auth-UUID `5d76d65e-...` in `supabase/migrations/20260424070000:87` (gehardcoded seed)
  - 2× admin-RLS-policy met `auth.email() = '...@icloud.com'` (en eerdere gmail-versie in oude migratie)
- **IP-risico:** **Geen** (dit is geen IP-claim) — wel **privacy / governance-relevant**
- **Cross-link:** geen IP-jurist-vraag; wel relevantie voor 04-governance-gap

---

## 5. Methode-content ontleend — concrete frameworks in prompts

### IP-17 — Balanced Scorecard (Kaplan/Norton 1992)

- **Locaties:** 4 prompts (`prompt.strategy.themes`, `prompt.strategy.ksf_kpi`, `prompt.strategy.analysis`, hardcoded fallbacks in `api/strategy.js`)
- **Concreet:** "Balanced Scorecard-perspectieven", 4 perspectieven expliciet (Financieel / Klant / Intern Proces / Leren & Groeien)
- **IP-risico:** **Laag** — externe gevestigde methode (>30 jaar oud, breed in consultancy-curriculum). Naam is geregistreerd merk van Kaplan/Norton; gebruik als framework-referentie is gangbaar.
- **Remediatie-richting:** geen — gebruik als algemene strategie-lens lijkt acceptabel
- **Aandachtspunt:** als platform later "Balanced Scorecard"-product wordt verkocht (bv. dedicated BSC-werkblad), wijzigt dit risico

### IP-18 — SWOT-framework

- **Locaties:** auto_tag-prompt + analyse-tagging (`kans` / `bedreiging` / `sterkte` / `zwakte`)
- **IP-risico:** **Geen** — generiek, public-domain. Geen claim-houder.

### IP-19 — BHAG (Big Hairy Audacious Goal — Collins/Porras 1994)

- **Locaties:** `prompt.magic.field.ambitie` + UI-veld-naam in StrategieWerkblad ("Ambitie BHAG")
- **IP-risico:** **Laag** — extern gevestigde term, bekend boek ("Built to Last"). Acroniem-gebruik is gangbaar.

### IP-20 — Stop / Start / Continue

- **Locaties:** 3 guideline-prompts (`prompt.guideline.advies`, `.generate`, `.implications`) + `guidelines.implications` JSONB-default
- **IP-risico:** **Geen** — generiek coaching-framework, geen specifieke claim-houder
- **Aandachtspunt:** hardcoded in DB-schema (kolom-default), niet via config aanpasbaar — koppelt aan 01-spec-gap S-4 (framework-structuur als data)

### IP-21 — SMART (Specifiek / Meetbaar / etc.)

- **Locaties:** `prompt.strategy.ksf_kpi` (SMART expliciet als criterium)
- **IP-risico:** **Geen** — public-domain (1981, Doran)

---

## 6. Externe consultancy-referenties (style-claims)

### IP-22 — McKinsey/BCG — totaalbeeld

- **Voorkomens (totaal):** 8 (uit fase 1 03-namen-en-termen §6.5):
  - Productie-prompts: `prompt.improve.mckinsey` (live + hardcoded), `prompt.magic.system_heavy` (live + hardcoded), `prompt.strategy.themes` rawSystem (`api/strategy.js:51`)
  - UI-strings: `AdminPage.jsx:33` dropdown-desc, `StrategieWerkblad.jsx:61` UI-tekst, `StrategieWerkblad.jsx:402` preset-label
  - TipsModal NL+EN ("BCG-matrix" als hulpmiddel-vermelding)
- **IP-risico:** **Laag** — handelsnaam-gebruik als style/kwaliteits-referentie. Geen eigendomsclaim. **Wel** mogelijk reputatie-risico (McKinsey-comms zou kunnen reageren op AI-prompt die zegt "ik ben op McKinsey-niveau") — geen IP, wel PR.
- **Remediatie-richting:** **beslissing nodig** (rebrand naar "top-tier consultancy stijl" of accepteren)

---

## 7. Klant-IP / contractuele context

### IP-23 — Klant-cases TLB / MAG / ACE / Spain / Santander / GTS — in dood code

- **Locaties:** `src/prompts/btcPrompts.js` — 6 BTC-block-prompts met letterlijke teksten zoals *"Examples from real Kingfisher cases (Spain, TLB, MAG)"* en concrete cases als *"Bancassurance (Santander): omnichannel journey, separate CX from direct channel, cross-sell via data"*
- **Status:** dood code — bestand niet meer geïmporteerd sinds commit `becfa01`. Inhoud zit wel in alle git-historiek vanaf dat moment.
- **IP-risico:** **Hoog (contractueel)** — klant-namen + concrete strategische details + observaties uit consultancy-engagement. Niet methode-IP maar:
  - Mogelijk schending van NDA/vertrouwelijkheidsclausules in Kingfisher-klantcontracten
  - Mogelijk reputationeel risico (klanten ontdekken eigen naam in publieke repo)
  - Specifieke vermelding "Bancassurance (Santander): cross-sell via data" is concreet strategie-advies uit een klant-engagement
- **Methode-onafhankelijkheid:** geen directe methode-relevantie, wel positionering (KF-platform met KF-klant-cases)
- **Remediatie-richting:** **weghalen** (`git rm` + mogelijk **history-rewrite** afhankelijk van jurist-advies — vraag eindsectie). Klant-notificatie-vraag voor jurist.
- **Cross-link spec:** §2.4 (geen firma-aannames; impliciet ook geen klant-aannames)

### IP-24 — Klant-PPTX bestandsnaam in test-assets

- **Locatie:** `tests/example.spec.js:41` — `path.join(__dirname, 'assets', 'Work in progress BTP MAG Final Version-1.pptx')`
- **Bestand zelf:** mogelijk in `tests/assets/` directory; status in git-tree niet uitputtend geverifieerd in fase 1 (sectie A.2 #13 en C-blinde-vlekken)
- **IP-risico:** **Middel-Hoog** — bestandsnaam onthult: klant = MAG, project = BTP. Bestand zelf bevat (vermoedelijk) volledige klant-strategie-presentatie.
- **Remediatie-richting:** **weghalen** (bestand + bestandsnaam-verwijzing). Mogelijk **history-rewrite** indien bestand ooit gecommit is. Klant-notificatie-vraag voor jurist.

### IP-25 — Branche-jargon afkomstig van klant-engagements

- **Locaties:** `BlockCard.jsx EXAMPLE_BULLETS` (HNW, LifePro, DIFC, WOL, APE) + `btcPrompts.js` (idem) + prototype-bestand `inzichten-prototype-v2.html` (mock-data "HNW Insurance 2028", "USD 143m APE 2028-target")
- **IP-risico:** **Middel** — branche-jargon zelf is openbaar (insurance-vakliteratuur), maar de specifieke combinatie (HNW + LifePro + DIFC) suggereert een herkenbare engagement-context. Een klant kan dit herkennen als "dit is over ons / over een vergelijkbare klant".
- **Cross-link spec:** §2.4 + IP-26 (branche-positionering)

---

## 8. Branche-positionering

### IP-26 — Expliciete branche-claim in `prompt.magic.system_heavy`

- **Locatie:** live DB + `api/magic.js:37`
- **Letterlijk:** *"gespecialiseerd in business transformatie voor de financiële en verzekeringssector"*
- **IP-risico:** **Middel** — niet een eigendomsclaim, maar:
  - Schendt §2.4 letterlijk ("branche-specifieke termen ... buiten dedicated branche-templates")
  - Bij verkoop aan een retail-klant of overheids-klant is de prompt onlogisch
  - Versterkt de "KF-only platform"-positie (combineert met IP-4 KF-naam en IP-23 klant-cases)
- **Remediatie-richting:** **generaliseren** + **per-tenant-content**

### IP-27 — Branche-jargon in voorbeeld-content

- **Locatie:** `BlockCard.jsx EXAMPLE_BULLETS` — geactiveerd via "Voorbeeld laden"-knop (`useCanvasState.handleLoadExample`)
- **IP-risico:** **Laag** (als product-feature) tot **Middel** (als blijkt klant-data, zie IP-25)
- **Remediatie-richting:** **vervangen** (generieke voorbeeld-content) **of** **per-tenant-content** (insurance-pack vs default-pack)

---

## 9. Niet-IP-relevant maar opgemerkt

| # | Item | Status |
|---|---|---|
| n.1 | Productnaam "Strategy Platform" in `tenants.theme_config.product_name` (live) | Generieke productnaam — geen IP-risico; mogelijke alternatief voor IP-9 "BTC" als app-titel |
| n.2 | "Inzichten" / "Het Dossier" / "Magic Staff" als product-termen | Eigen product-IP — geen risico, wel asset (zie IP-12) |
| n.3 | `BroadcastChannel`-naam `kingfisher_btc` (multi-tab detectie) | Technische identifier, niet user-facing — laag impact |
| n.4 | File-headers `Kingfisher & Partners — April 2026` (7 bestanden) | Comments, niet productie-tekst — opruim-actie, geen IP-risico |

---

## 10. Cross-cutting observaties

### Methode-onafhankelijkheid — totaal-oordeel uit IP-bril

Het platform claimt op **acht productie-locaties** (IP-1 t/m IP-7, IP-9) expliciete BTC- en/of Novius-methode-link. Daarbovenop heeft de architectuur de **methode-structuur** ingebakken (IP-11: 7 BTC-blokken hardcoded in code en DB-schema). Methode-onafhankelijkheid (spec §1.3 strategisch principe) is daarmee **niet realiseerbaar** in de huidige architectuur zonder:
- Tekst-wijziging van 4-8 productie-prompts (vervangen / generaliseren)
- Hardcoded `BLOCKS`-array → tenant-scoped content-pack (cross-link 01-spec-gap S-4 + S-22)
- App-titel beslissing (IP-9 — BTC vs Strategy Platform)

### Audit-trail — kritiek voor IP-defensie

Live `prompt.strategy.analysis` afwijkt van migratie-versie zonder spoor (IP-1). Dit is meer dan een tech-debt-item: bij een IP-claim moet KF kunnen aantonen *wanneer* welke claim is gemaakt en *door wie*. Geen audit-log → geen IP-defensieve evidence-trail. Cross-link 01-spec-gap S-17, 04-governance-gap.

### Klant-data in publieke repo — apart spoor

Klant-IP (IP-23, IP-24, IP-25) is **niet** methode-IP, maar contractueel-juridisch separaat. Mogelijk vereist klant-notificatie en/of git-history-rewrite. Vraag voor jurist (eindsectie).

### Kruisreferentie spec §6.3

Spec §6.3 letterlijk: *"De initiële framework-implementaties moeten geen terminologie bevatten waar mogelijk derde-partij rechten op rusten. Gebruik generieke terminologie als platform-standaard; methode-specifieke terminologie in tenant-specifieke content packs."*

Dit principe wordt **systematisch geschonden** door IP-1, IP-2, IP-3, IP-9, IP-10, IP-11, IP-13, IP-14, IP-15. Pas wanneer content-pack-architectuur (spec §6) is geïmplementeerd kan methode-specifieke terminologie naar tenant-pack en kan de platform-default generiek worden.

---

## Eindsectie — Vragen voor IP-jurist-gesprek

Doel: input voor Kees-vorming van eigen vragenlijst. Niet alle vragen letterlijk gebruiken — selecteren en aanpassen op gespreksstijl.

### Categorie A — Methode-IP (BTC-boek-auteurs)

1. **Productnaam = methode-naam.** Het platform draagt actief de naam "Business Transformation Canvas" als app-titel (in DB als `label.app.title`, in JSX als `<h1>` op login en als header op print-output). Hoe verhoudt zich dit tot mogelijke merkrechten of methode-IP van de boek-auteurs? Maakt het verschil dat de naam configureerbaar is via DB maar feitelijk niet wordt gewijzigd?

2. **Methode-claim in productie-AI-prompt.** De claim *"gespecialiseerd in het Business Transformatie Canvas en Novius model"* staat actief in een productie-AI-prompt (`prompt.strategy.analysis`) en wordt bij elke "Analyse draaien"-actie naar de AI-provider verzonden. Verschilt dit juridisch van een methode-claim op een website of in marketing-materiaal? Waar zit het juridische verschil tussen *intern productgebruik* en *externe productpositionering* van methode-naam?

3. **Methode-structuur als product-architectuur.** De 7 BTC-blokken (Strategy / Principles / Customers / Processes / People / Technology / Portfolio) zijn als hardcoded `BLOCKS`-array in de code en als rijen in een DB-tabel `block_definitions` overgenomen. Is methode-structuur (de samenstelling en naamgeving van bouwstenen, zonder verdere boek-tekst) IP-relevant of valt dat onder gangbare consultancy-frameworks (vergelijkbaar met SWOT, Porter's 5 Forces)? Maakt het verschil dat de blok-namen letterlijk hoofdstuk-titels uit het boek zijn?

4. **Auteurs-attributie in app-tekst.** De TipsModal in de app vermeldt expliciet *"Op basis van het boek Business Transformatie Canvas van Marc Beijen, Ruben Heetebrij en Roos Tigchelaar"*. Is deze attributie **defensief** (citeerrecht / fair use, methode-bron erkennen) of **belastend** (bevestiging dat het platform de methode implementeert)? Wat is de strategisch-juridisch verstandige keuze: attributie behouden, weghalen of generaliseren?

5. **Parafraseerde methode-content.** TipsModal bevat ~20 tips die methode-concepten in eigen woorden beschrijven (bv. "Het magische getal is 7", "Tight-loose karakter", "Outside-in & Inside-out"). Is parafrasering van methode-concepten — zonder letterlijke citaten uit het boek — IP-relevant? Hoe ver gaat copyright op consultancy-methode-content?

### Categorie B — Klant-IP (KF-engagement-data in publieke repo)

6. **Klant-namen in publieke git-history.** Klant-cases TLB, MAG, ACE, Spain, Santander, GTS staan als letterlijke voorbeelden in een AI-prompt-bestand (`src/prompts/btcPrompts.js`) dat in publieke repo-history zit. Bestand is sinds enige tijd dood code (niet meer geïmporteerd) maar staat wel in git-history vanaf de eerste commit. Vereist verwijdering een **git-history-rewrite** (force-push) of is `git rm` voldoende? En vereist dit **klant-notificatie** aan de betreffende klanten? Welke klant-contractuele clausules zijn typisch raakbaar (NDA, vertrouwelijkheid, IP-eigendom van consultancy-werk)?

7. **Concreet klant-strategie-detail in prompt-voorbeelden.** Naast namen staan er concrete strategie-uitspraken zoals *"Bancassurance (Santander): omnichannel journey, separate CX from direct channel, cross-sell via data"* en *"Outsource IT infrastructure to GTS — retain architecture and demand management in-house"*. Is dit (met of zonder klantnaam) IP van de klant, van Kingfisher, of openbaar generiek consultancy-advies? Wijzigt dit het juridisch profiel van vraag 6?

8. **Klant-PPTX in test-assets.** Een test-bestand verwijst naar `tests/assets/Work in progress BTP MAG Final Version-1.pptx`. Bestandsnaam onthult klant (MAG) en project (BTP). Bestand zelf bevat vermoedelijk volledige klant-strategie-presentatie. Welke vereisten gelden voor verwijdering (idem als vraag 6) en voor notificatie? Maakt het verschil of het bestand uiteindelijk in git zit (nog te verifiëren) of alleen lokaal?

### Categorie C — Branche- en consultancy-merken

9. **Branche-claim in productie.** De prompt `prompt.magic.system_heavy` zegt *"gespecialiseerd in business transformatie voor de financiële en verzekeringssector bij Kingfisher & Partners"*. Bij verkoop aan een tweede tenant in een andere branche (bv. retail, overheid) is dit fout. Is dit puur een product-kwaliteit-issue, of speelt er ook een juridisch aspect (misleidende positionering, oneigenlijke representation)?

10. **Externe consultancy-merken (McKinsey/BCG) in AI-prompts.** Productie-prompts gebruiken constructies als *"op McKinsey/BCG-niveau"* en *"in McKinsey/BCG-stijl"*. Is gebruik van merknaam-als-bijvoeglijk-naamwoord in een AI-instructie juridisch problematisch? Wat als McKinsey-comms reageert op een prompt die zegt "ik ben op McKinsey-niveau" en dat naar een AI-provider stuurt?

### Categorie D — Audit-trail en bewijsvoering

11. **Live productie afwijkt van versie-controle zonder spoor.** De live `prompt.strategy.analysis` bevat de Novius-claim die **niet** in de migratie staat — handmatig toegevoegd via Admin-UI of direct SQL UPDATE. Er is geen audit-log van wie/wanneer/wat. Bij een toekomstige IP-claim: wat zijn de juridische consequenties van **niet kunnen reconstrueren** wanneer welke methode-claim is gemaakt? Welk bewijs moet KF kunnen leveren bij een dispuut?

### Categorie E — Strategische opties

12. **De-Kingfisher-isering als IP-strategie.** Als platform expliciet methode-agnostisch wordt (architectuur-spec §1.3) en KF-naam + BTC-naam uit platform-default verdwijnen (alleen in tenant-pack van Kingfisher behouden), verandert dat het IP-risicoprofiel? Beschermt de drie-lagen-scheiding (platform / content / brand uit spec §2.1) IP-eigendom (holding bezit platform; content-pack is contractuele zaak per klant)?

13. **Eigen IP-bouwstenen vastleggen.** Het Inzichten-pattern (Onderdeel/Dwarsverband-categorisatie + InzichtenOverlay-design) is **eigen ontwerp** voor dit platform en niet ontleend. Is het verstandig dit als eigen IP te documenteren / vast te leggen (auteursrecht, design-patent, anders)? Welke vorm past bij dit type product-IP?

14. **Repo-eigendom en holding-account.** Repo staat onder persoonlijke GitHub-account `KFSmaling`, niet onder holding-org. Spec §11.2 zegt "Private repository onder eigen/holding-account, niet firma". Welke IP-eigendoms-implicaties heeft repo-locatie? En wat zijn de stappen voor transfer naar holding-org als dat aanbevolen is?

15. **Single-contributor en bus-factor in IP-context.** Alle commits komen van één contributor (`KFSmaling`). Geen co-auteur, geen tweede ontwikkelaar. Heeft dat IP-implicaties (eenduidig auteurschap = sterke IP-positie? of: kwetsbaar als die persoon wegvalt?)? Verandert het profiel als latere ontwikkelaars onder NDA werken (zoals architecture-spec voorschrijft)?

---

## Verificatie-paragraaf

### Wat ik heb gedaan voor compleetheid

- **Fase 1 documenten C en D integraal als input** — niet zelf opnieuw codebase doorzocht; vertrouwd op fase-1 inventarisatie (twee dagen oud)
- **Per voorkomen apart geclassificeerd** in plaats van vermenging per categorie. Dit voorkomt dat bv. IP-1 (Novius-claim) onbedoeld in de "branche"-bucket valt
- **Cross-links naar 01-spec-gap** waar IP-issues correlaat zijn met spec-gaps (S-1, S-4, S-5, S-17, S-22 specifiek genoemd)
- **Vragen-set gegroepeerd in 5 categorieën** (methode / klant / branche / audit-trail / strategisch) — totaal 15 vragen, binnen het 5-15-bereik uit de prompt. Per categorie 1-5 vragen om gespreks-flow voor jurist mogelijk te maken
- **Eigen IP-asset (Inzichten-pattern) apart benoemd (IP-12 + vraag 13)** — niet alleen als gap maar ook als verdediging-element

### Niet onderzocht en waarom

- **Letterlijke tekst-vergelijking BTC-boek vs prompts** — niet gedaan; ik heb het boek niet en zou geen kopiering-claim kunnen identificeren zonder bron-tekst. Methode-structuur (IP-11) en parafrasering (IP-14) genoemd; letterlijke kopie niet bewijsbaar in deze pass.
- **Eigendomsstructuur Novius BV** — niet onderzocht (CoC, partnerstructuur, etc.); jurist-vraag 11 verwijst alleen naar de bestaande Novius-claim, niet naar Novius BV als entiteit.
- **Klant-contracten (NDA-clausules)** — niet onderzocht; vermeld als "raakbare clausules" in vraag 6 zonder concretisering. Kees heeft de contracten; jurist heeft ze nodig.
- **GitHub repo-history-volledigheid** — niet zelf gegrep'd op klant-namen pre-2026-04 (fase-1 noteert dat repo-history begint 2026-04-09; pre-2026 commits niet beschikbaar). Mogelijk relevant als history-rewrite optie wordt overwogen.
- **Externe registraties** — geen merkenregister-check op "Business Transformation Canvas" of "Novius" als geregistreerde merken. Voor jurist.
- **`tests/assets/`-directory git-tree-status** — niet zelf via `git ls-tree` geverifieerd of klant-PPTX in git zit. Fase-1 noteert dit als blinde vlek (sectie A.2 #13 + C-blinde-vlekken).

### Verificatie-steekproeven (3 willekeurige bevindingen herverifieerd)

1. **IP-1 (Novius-claim)** — fase 1 04-prompts §A.16 verificatie-steekproef #1 bevestigt: live `prompt.strategy.analysis` bevat letterlijk *"Je bent gespecialiseerd in het Business Transformatie Canvas en Novius model."* Migratie `20260425000000_inzichten_sprint_a.sql` mist deze string. Audit-trail-gat bevestigd. ✅
2. **IP-3 `api/improve.js:31` heeft geen DB-override** — fase 1 04-prompts §B.3.1 noteert "*Geen DB-override — er is geen aparte `prompt.improve.system` key in DB.*" Bevestigd. ✅
3. **IP-11 7 BTC-blokken in code + DB** — fase 1 01-functioneel §1 toont BLOCKS-tabel met 7 blokken; 03-namen-en-termen §13 toont `block_definitions` live met 7 keys. Beide bestaan. ✅ (Inconsistentie tussen code-keys `principles`/`portfolio` en DB-keys `guidelines`/`roadmap` is een aparte schema-drift, geen IP-issue.)

### Bekende blinde vlekken

- **IP-classificatie subjectief.** Mijn "Hoog/Middel/Laag" is interpretatie, niet juridisch oordeel. De jurist mag dit volledig herzien. Motivatie per voorkomen expliciet om dat mogelijk te maken.
- **IP-jurist-vragen-selectie** — 15 vragen is veel; jurist zal niet alle behandelen. Categorie-indeling helpt prioriteren maar Kees moet uiteindelijk selecteren.
- **Geen verdiepende klant-engagement-context.** Of TLB/MAG/ACE/Spain afkortingen voor zijn van werkelijke klant-namen, en welke contractuele clausules golden, weet alleen Kees. Jurist heeft ook deze context nodig.
- **Methode-vs-implementatie-onderscheid** — diepere juridische definitie van "implementatie van methode" vs. "implementatie ván een methode" valt buiten audit-scope. Vraag 3 raakt dit maar geeft geen antwoord.
- **Jurisdictie** — niet verondersteld (Nederlands recht? EU-recht? Specifieke sector?). Bij vraagstelling mogelijk relevant.
