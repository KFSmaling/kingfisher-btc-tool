# INZICHTEN_DESIGN.md — Analyse-overlay patroon

> Design-notitie. Resultaat van ontwerpsessie 2026-04-23.  
> Gekoppeld aan `TECH_DEBT.md` (nieuw P4-item) en `CLAUDE.md` sectie 10.  
> Status: **concept** — nog niet geïmplementeerd.

---

## Doel

Een generiek **Inzichten-patroon** definiëren dat op meerdere schaalniveaus werkt:

- Per werkblad (Strategie, Richtlijnen, Klanten, Organisatie, IT, Roadmap)
- Canvas-breed (kruisverbanden tussen werkbladen)

De huidige Strategie-analyse ("Strategisch Advies") is de aanleiding — de output bevalt niet. Maar de oplossing mag niet Strategie-specifiek zijn, omdat álle werkbladen dezelfde soort analyse krijgen (zie `WORKFLOW.md` en `CLAUDE.md` sectie 10).

---

## Kernprincipes

### 1. Onderdelen & Dwarsverbanden

Elke analyse bestaat uit twee conceptuele lagen:

- **Onderdelen** — observaties over losse elementen binnen de scope (wat ontbreekt, wat is zwak, wat zijn kansen, wat is sterk)
- **Dwarsverbanden** — observaties over samenhang tussen elementen (overlap, consistentie, afhankelijkheden, ontbrekende koppelingen)

Dit patroon werkt op elk schaalniveau. Bij Strategie = verbanden tussen thema's, SWOT, kernwaarden. Bij canvas-niveau = verbanden tussen werkbladen.

### 2. Consumeren scheiden van produceren

- **Werkblad** = produceren (invullen, AI-assist op velden, analyse triggeren)
- **Overlay** = consumeren (lezen, interpreteren, denken)

De overlay heeft geen "opnieuw analyseren"-knop. Dat gebeurt vanuit het werkblad. Geen accepteren/negeren-acties op bevindingen — de consultant denkt zelf. We bieden bewust géén mechanisch afhandelen aan, omdat dat uitnodigt tot klikken zonder nadenken.

### 3. Niet-rigide scope voor verwijzingen

Bevindingen in één werkblad mogen verwijzen naar andere werkbladen, mits zinvol. Specifiek:

- **Binnen-werkblad verwijzingen** worden inline in de observatie-tekst getoond (bronvermelding als highlight)
- **Cross-werkblad observaties** worden volwaardige bevindingen onder "Dwarsverbanden", niet als chip of voetnoot — anders wordt een chip te zwaar geladen
- **Verwijzingen naar nog niet ingevulde werkbladen** zijn expliciet ("Roadmap (nog niet ingevuld)") — het *ontbreken* is zelf het inzicht

### 4. Lees-ervaring, geen dashboard

De overlay is een document, niet een interactief paneel. Consultants printen de output, leggen hem naast de klant, bespreken, vullen aan. Vormgeving optimaliseert voor:

- Rustige typografie en scanbare hiërarchie
- Inline bronvermeldingen in lopende tekst (niet als aparte chips)
- Sticky inhoudsopgave voor navigatie bij langere analyses
- Geen visuele ruis van actie-knoppen per bevinding

---

## Data-model per bevinding

Generiek schema — werkt voor alle werkbladen. Opslag voorlopig in bestaande `jsonb`-velden (`strategy_core.analysis`, `guideline_analysis.recommendations`, etc.). Migratie naar aparte tabel pas wanneer we status-per-item willen ondersteunen (niet nu gepland — zie sectie 2).

```json
{
  "id": "uuid",
  "category": "onderdeel" | "dwarsverband",
  "type": "ontbreekt" | "zwak" | "kans" | "sterk",
  "title": "Korte kop, max ~8 woorden",
  "observation": "Wat de AI constateert, 1-3 zinnen, met inline bronvermeldingen.",
  "recommendation": "Concrete voorgestelde actie, 1-3 zinnen.",
  "source_refs": [
    {
      "kind": "theme" | "analysis_item" | "strategy_core_field" | "guideline" | "cross_worksheet",
      "id": "uuid",
      "label": "Thema 4 — Platforms & partnerships",
      "exists": true
    }
  ],
  "cross_worksheet": false
}
```

**Veldtoelichting:**

- `category` — bepaalt in welk hoofdstuk de bevinding landt
- `type` — bepaalt kleur + icoon + label. Exact deze vier, niet meer, niet minder (zie Type-indeling hieronder)
- `observation` vs `recommendation` — strikt gescheiden, geen lopende alinea. Maakt einde aan de huidige 60-woord-blokken
- `source_refs.exists: false` — voor verwijzingen naar werkbladen of elementen die nog ontbreken. UI toont die visueel anders
- `cross_worksheet: true` — markeert cross-werkblad bevindingen (bijv. Strategie verwijst naar Roadmap). Alleen relevant onder `category: "dwarsverband"`

---

## Type-indeling

Vier types, strikt. Elk heeft vaste kleur **én** vaste vorm (kleurenblind-safe).

| Type | Kleur | Icoon-vorm | Label |
|------|-------|-----------|-------|
| `ontbreekt` | Donkerrood | horizontaal streepje | "Ontbreekt" |
| `zwak` | Oranje-bruin | waarschuwingsdriehoek | "Zwak punt" |
| `kans` | Blauw | diagonale pijl omhoog | "Kans" |
| `sterk` | Groen | vinkje | "Sterkte" |

Rationale: rood/oranje zijn het kritieke paar voor kleurenblindheid (deuteranopie, ~8% van mannelijke populatie). Vorm-verschil lost dat op. Label maakt het toegankelijk voor schermlezers.

---

## UI-beslissingen (resultaat prototype-iteraties)

De volgende keuzes zijn via twee prototypes bevestigd:

**Layout: document-layout, geen split-view.**  
Single-column lees-document met sticky inhoudsopgave links. Geen drill-down, geen klik-om-te-lezen. Alles is altijd zichtbaar (tenzij gefilterd).

**Inhoudsopgave: tekst met kleur-streepje links.**  
Per bevinding een subtiel vertikaal kleur-streepje vóór de titel, in de type-kleur. Geeft direct categorie-overzicht zonder dat de TOC druk wordt. Vormpjes zijn hier te klein voor herkenbaarheid; kleur-streepje werkt wel op klein formaat.

**Filters: discreet, onder de documentkop.**  
Type-toggles (Ontbreekt / Zwak / Kans / Sterk) met icoon én label. Niet als primair UI-element. Sectie-filter (Onderdelen / Dwarsverbanden) niet nodig — hoofdstuk-structuur maakt dat vanzelf zichtbaar.

**Bronvermeldingen: inline in lopende tekst.**  
Niet als losse chips. Tekst leest natuurlijk door met licht gehighlighte bron-labels. Onderaan elke bevinding een "Verwijst naar"-samenvatting voor snel overzicht. Hover-tooltips zijn onnodig — de context staat al in de lopende tekst.

**Ontbrekende bronnen: expliciet gemarkeerd.**  
"Roadmap (nog niet ingevuld)" krijgt visueel onderscheid (dashed border, rood) zodat de consultant ziet dat het inzicht een afhankelijkheid heeft.

**Typografie: app-consistent.**  
Dezelfde font-stack als de rest van de applicatie (Inter-achtig sans-serif). Géén serif-display-fonts zoals in prototype 1, om consistentie over werkbladen heen te bewaren.

---

## Werkblad-knoppen (raakt alle werkbladen)

Drie-knoppen-patroon, niet twee. Geldt voor Strategie, Richtlijnen, Klanten, Organisatie, IT, Roadmap.

```
[Analyse draaien]    [Inzichten bekijken]    [Rapportage]
```

- **Analyse draaien** — triggert AI, overschrijft bestaande analyse. Eerste keer heet deze knop zo, na succesvolle run wordt het "Opnieuw analyseren".
- **Inzichten bekijken** — opent overlay met huidige analyse. Grijs/disabled als er nog geen analyse is.
- **Rapportage** — output B (nog te ontwerpen, aparte sessie).

Rationale: produceren (draaien) en consumeren (bekijken) zijn twee verschillende acties met andere kosten (tijd, overschrijven). Niet samenvoegen tot één knop. De huidige situatie op Richtlijnen-werkblad ("Richtlijnen Advies ✓" als combinatie-knop) is verwarrend en wordt opgeheven door dit patroon.

---

## Naamgeving

- **"Inzichten"** als primair label, via `appLabel("label.analysis.title", "Inzichten")` — configureerbaar per deployment.
- **Per werkblad:** "Inzichten — Strategie", "Inzichten — Richtlijnen", etc.
- **Canvas-niveau:** "Inzichten — Canvas".
- Huidige term "Strategisch Advies" / "Richtlijnen Advies" vervalt bij migratie.

---

## Scope buiten deze design-notitie

Expliciet niét in scope (apart uit te werken):

- **Rapportage (output B)** — het eindproduct dat de consultant met de klant deelt. Kan Inzichten optioneel opnemen (toggle bestaat al in huidige implementatie, maar vormgeving is gebrekkig). Aparte design-sessie.
- **Canvas-brede Inzichten** — hoofd-use-case op termijn ("eindplaatje als canvas gevuld is"). Ontwerp volgt nadat werkblad-Inzichten voor minimaal twee werkbladen werkt (Strategie + Richtlijnen).
- **Print-styling** — consultants printen de overlay om met klanten te bespreken. CSS print-stylesheet is een follow-up item, niet initieel.
- **Acties op bevindingen** — accepteren, negeren, bewerken. Bewust uitgesteld om mechanisch afhandelen te voorkomen. Kan later terug op de agenda komen als gebruik daar aanleiding toe geeft.

---

## Prototypes (referentiemateriaal)

Twee klikbare prototypes uit de ontwerpsessie:

1. **Prototype 1 — split-view** (`strategisch-advies-prototype.html`): lijst links, detail rechts. Verworpen — te dashboard-achtig, bron-chips met tooltip onduidelijk, past niet bij "consumeren".
2. **Prototype 2 — document-layout** (`inzichten-prototype-v2.html`): ✅ gekozen richting. Basis voor implementatie.

Prototypes zijn ontwerp-materiaal, geen code voor productie. Niet committen naar repo.

---

## Implementatie-volgorde (voorstel)

Drie losse sprints. Niet combineren — conform `WORKFLOW.md` regel 2 (geen architectuur- met feature-werk mengen).

**Sprint N — Data & Prompt (Strategie)**  
- AI-prompt aanpassen zodat output conform data-model hierboven is
- `strategy_core.analysis` JSONB-structuur migreren van huidige `recommendations[]` naar nieuwe schema
- Service-laag aanpassen (`{ data, error }` contract behouden, conform `CLAUDE.md` sectie 3)
- Géén UI-wijzigingen in deze sprint

**Sprint N+1 — UI Inzichten-overlay (Strategie)**  
- Document-layout bouwen, conform prototype 2
- Labels via `appLabel` + migratie voor `label.analysis.*` keys
- State-management conform `CLAUDE.md` sectie 4 (key, race-guards, error-handling)
- Huidige "Strategisch Advies"-overlay vervangen

**Sprint N+2 — Drie-knoppen-patroon (raakt alle werkbladen)**  
- Werkblad-shell aanpassen: drie knoppen i.p.v. combinatie-knop
- Eerst Strategie en Richtlijnen; andere werkbladen volgen bij hun eigen implementatie
- Kleine migratie voor nieuwe labels
- Aparte Issue — raakt meerdere werkbladen, dus conceptueel architectureel

Richtlijnen-Inzichten (hergebruik van patroon voor tweede werkblad) is een vierde sprint. Wordt pas ontworpen zodra Strategie-Inzichten in gebruik is — het tweede werkblad is de echte test of het patroon hergebruikbaar is.

---

## Open beslissingen (voor later)

- **Rapportage (B)** — heeft eigen ontwerpsessie nodig. Verhouding tot Inzichten nog vast te leggen.
- **Print-stylesheet** — wanneer activeren?
- **Cross-werkblad verwijzingen vs. canvas-brede Inzichten** — is er overlap? Als canvas-brede analyse bestaat, zijn cross-werkblad bevindingen in werkblad-analyses dan nog nodig, of verplaatst dat naar canvas-niveau?
- **Versionering van analyses** — nu overschrijft "Opnieuw analyseren" de bestaande. Wil je ooit geschiedenis bewaren (vergelijken met vorige versie)?

Deze vragen niet nu beantwoorden — parkeren tot er signaal uit gebruik komt.

---

## Changelog

- **2026-04-23** — initiële versie, resultaat van ontwerpsessie op basis van twee klikbare prototypes
