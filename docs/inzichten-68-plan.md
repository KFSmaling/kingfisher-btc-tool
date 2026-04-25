# Plan: Issue #68 — Inzichten UI (Sprint B)

**Status:** In planning  
**Datum:** 2026-04-25  
**Afhankelijkheid:** Issue #67 ✅ klaar  
**Scope:** Huidige "Strategisch Advies"-overlay vervangen door document-layout Inzichten-overlay. Geen drie-knoppen-patroon (sprint C).

---

## 1. Huidige situatie

### Bestand & locatie

Alle overlay-code zit **inline in `StrategieWerkblad.jsx`** — geen apart component-bestand.

```
src/features/strategie/
  StrategieWerkblad.jsx     ← overlay JSX op regel 1407–1475
  StrategyOnePager.jsx      ← lazy-loaded, aparte full-screen view
  components/               ← leeg (alleen ErrorBoundary.jsx en gedeelde shared/)
  services/strategy.service.js
```

### Hoe de overlay wordt aangeroepen

**Pattern:** Eigen `fixed inset-0` full-screen overlay — geen externe modal-library. Geen Radix, Headless UI of Framer Motion. Pure `useState` + `className="fixed inset-0 z-[59] flex flex-col bg-slate-100"`.

**Trigger-knop** (regel 1076–1086):
```jsx
<button onClick={() => setShowAdvies(true)}>
  Strategisch Advies{analysis ? " ✓" : ""}
</button>
```

**State:**
```js
const [showAdvies, setShowAdvies] = useState(false);
const [analysis, setAnalysis]     = useState(null);   // insights[] of null
const [analysisLoading, ...]      = useState(false);
const [analysisError, ...]        = useState(null);
```

**Laden:** bij werkblad-open (`loadStrategyCore`) → `setAnalysis(coreData.insights || null)`

### Huidige rendering-flow (verouderd schema)

De overlay rendert nu kaartjes op basis van het **oude** `recommendations[]` schema (`rec.type = "warning"|"info"|"success"`, `rec.title`, `rec.text`). Sprint A heeft het AI-schema al omgezet naar het nieuwe Inzichten-schema, maar de **UI is nog niet bijgewerkt**. Resultaat: de overlay toont lege/undefined kaartjes als er nieuw analyse-data is.

Actuele render-code (regel 1444–1457):
```jsx
{analysis.map((rec, i) => {
  const cm = { warning: {...}, info: {...}, success: {...} };
  const c = cm[rec.type] || cm.info;   // ← "ontbreekt"|"zwak"|"kans"|"sterk" vallen op "info"
  return (
    <div key={i} ...>
      <p>{rec.title}</p>         {/* ✅ bestaat in nieuw schema */}
      <p>{rec.text}</p>          {/* ❌ heet nu rec.observation + rec.recommendation */}
    </div>
  );
})}
```

### Labels in gebruik

Via `appLabel()` / `LABEL_FALLBACKS` in `AppConfigContext.jsx`:

| Key | Huidig | Gebruikt in overlay? |
|---|---|---|
| `strat.section.analyse` | "Analyse" | Nee (werkblad-sectie) |
| `strat.field.extern/intern` | "Externe/Interne Ontwikkelingen" | Nee |

**Geen `label.analysis.*` keys** bestaan momenteel in `LABEL_FALLBACKS` of app_config. De overlay-teksten zijn hardcoded strings in JSX.

---

## 2. Gewenste situatie (INZICHTEN_DESIGN.md)

### Layout: document-layout, geen kaartjes-grid

```
┌─────────────────────────────────────────────────────┐
│ Header: "Inzichten — Strategie"   [×]               │
├──────────────────────────────────────────────────────┤
│ Filters: [Ontbreekt] [Zwak] [Kans] [Sterk]          │
├──────────┬───────────────────────────────────────────┤
│  TOC     │  ## Onderdelen                            │
│  sticky  │  ├─ ● Missie beschrijft…  (rood streep)  │
│  links   │  ├─ ▲ Spanning focus…    (oranje streep) │
│          │  │                                        │
│          │  ## Dwarsverbanden                        │
│          │  ├─ → Sterke alignment…  (blauw streep)  │
└──────────┴───────────────────────────────────────────┘
```

### Per bevinding (document-stijl, niet kaartje)

```
─── ▲ Zwak punt ──────────────────────────────────────
Spanning focus-thema en breedte strategische agenda

De strategische kaart bevat 5 thema's met 15 KSF's...
[Thema: Focus] [SWOT: Diffuse prioritering]

→ Herformuleer het focus-thema als governanceprincipe...

Verwijst naar: Focus en executiekracht · SWOT-zwakte (2)
──────────────────────────────────────────────────────
```

### Type-systeem (kleurenblind-safe)

| Type | Kleur-token | Icoon (lucide) | Label |
|---|---|---|---|
| `ontbreekt` | `#B91C1C` (rood) | `Minus` | "Ontbreekt" |
| `zwak` | `#92400E` (oranje-bruin) | `AlertTriangle` | "Zwak punt" |
| `kans` | `#1D4ED8` (blauw) | `TrendingUp` | "Kans" |
| `sterk` | `#15803D` (groen) | `CheckCircle` | "Sterkte" |

Sticky TOC: per bevinding een subtiel verticaal kleur-streepje (4px) links van de titel — kleur = type-kleur.

### Nieuwe labels nodig in LABEL_FALLBACKS + app_config

| Key | Fallback-waarde |
|---|---|
| `label.analysis.title` | "Inzichten" |
| `label.analysis.subtitle` | "Strategische Analyse" |
| `label.analysis.chapter.onderdelen` | "Onderdelen" |
| `label.analysis.chapter.dwarsverbanden` | "Dwarsverbanden" |
| `label.analysis.type.ontbreekt` | "Ontbreekt" |
| `label.analysis.type.zwak` | "Zwak punt" |
| `label.analysis.type.kans` | "Kans" |
| `label.analysis.type.sterk` | "Sterkte" |
| `label.analysis.empty` | "Nog geen analyse. Klik 'Analyseer strategie' in het werkblad." |
| `label.analysis.loading` | "AI analyseert uw strategie…" |
| `label.analysis.filter.label` | "Toon:" |
| `label.analysis.sourceref.header` | "Verwijst naar" |

---

## 3. Concreet plan

### Bestanden die geraakt worden

| # | Bestand | Actie | Reden |
|---|---|---|---|
| 1 | `src/features/strategie/StrategieWerkblad.jsx` | Aanpassen | Overlay-JSX (regel 1406–1475) vervangen door `<InzichtenOverlay>` component |
| 2 | `src/features/strategie/components/InzichtenOverlay.jsx` | **Nieuw** | Document-layout component |
| 3 | `src/features/strategie/components/InzichtItem.jsx` | **Nieuw** (optioneel) | Losse bevinding-renderer — kan ook inline in overlay |
| 4 | `src/shared/context/AppConfigContext.jsx` | Aanpassen | Nieuwe `label.analysis.*` keys toevoegen aan `LABEL_FALLBACKS` |
| 5 | `supabase/migrations/YYYYMMDD_analysis_labels.sql` | **Nieuw** | `INSERT INTO app_config` voor de `label.analysis.*` keys |
| 6 | `api/strategy.js` | Aanpassen | Debug-logs `[strategy-raw]`, `[strategy-a1]`, `[strategy-a2]` verwijderen (sprint A TODO) |

### Nieuwe componenten

**`InzichtenOverlay.jsx`** — alles zit in dit bestand:

```
InzichtenOverlay
  props: { insights[], loading, error, onClose }
  intern:
    - activeFilters: Set van actieve type-filters
    - ref-lijst per bevinding (voor scroll-spy TOC)
  render:
    ├─ Header (sticky): titel + sluit-knop
    ├─ Filters: type-toggles met count
    ├─ Body (flex-row):
    │   ├─ TOC (sticky, w-48): lijst van titels met kleur-streepje
    │   └─ Content (flex-1): twee <section> blokken (onderdelen / dwarsverbanden)
    │       └─ per bevinding: type-badge + titel + observatie + aanbeveling + bronnen-footer
    └─ Footer: "opgeslagen per canvas" tekst
```

**`InzichtItem.jsx`** — optioneel uit te splitsen als `InzichtenOverlay` te groot wordt:
```
props: { insight, index }
render: één bevinding in document-stijl
```

### Scroll-spy TOC

Eenvoudige aanpak met `IntersectionObserver` op `id="insight-{insight.id}"` divs. Actieve TOC-entry krijgt `font-semibold`. Geen externe library nodig.

### Knop in StrategieWerkblad

De huidige knop "Strategisch Advies" wordt hernoemd naar "Inzichten bekijken" en roept `<InzichtenOverlay>` aan i.p.v. de inline overlay. De `handleAnalyze`-knop blijft in het werkblad (conform INZICHTEN_DESIGN.md — geen analyse-knop in de overlay).

### Debug-logs verwijderen (sprint A TODO)

In `api/strategy.js`, drie regels verwijderen:
- `console.log("[strategy-raw]", raw);` — regel ~228
- `console.log("[strategy-a1]", ...)` — regel ~293
- `console.log("[strategy-a2]", ...)` — regel ~300

### Migratie

Alleen labels — geen schema-wijzigingen. De `strategy_core.insights` kolom staat al (sprint A). Migratie voegt `label.analysis.*` toe aan `app_config`. Idempotent via `INSERT ... ON CONFLICT DO NOTHING`.

---

## 4. Open vragen

### V1 — TOC: wel of geen scroll-spy?

Scroll-spy (`IntersectionObserver`) voegt ~30 regels toe en een `useEffect`. Bij 5 bevindingen is dat overkill; bij 8 is het handig. Alternatief: klikbare TOC die alleen scrollt, zonder aktieve-state bijhouden.

**Vraag:** Scroll-spy implementeren of eenvoudige anker-links?

### V2 — Inline bron-highlights in observatie-tekst

INZICHTEN_DESIGN.md zegt "licht gehighlight in lopende tekst". Maar de observatie-tekst is een platte string — de source_refs zijn aparte objecten, niet gemarkeerd in de tekst.

Twee opties:
- **A (eenvoudig):** Observatie-tekst normaal renderen, daarna een "Verwijst naar"-voetregeltje met de source_ref labels. Geen inline highlights.
- **B (complex):** AI instrueren om placeholder-tokens te plaatsen in de tekst (`[REF:uuid]`) die de UI vervangt door highlights. Wijziging in prompt + validator nodig.

**Vraag:** Optie A of B? INZICHTEN_DESIGN.md geeft voorkeur aan A ("Onderaan elke bevinding een 'Verwijst naar'-samenvatting").

### V3 — `exists: false` bronnen: stijl

INZICHTEN_DESIGN.md: "dashed border, rood" voor ontbrekende bronnen. Dit geldt voor de bron-pill in de "Verwijst naar"-rij. Is een rode dashed pill de gewenste stijl, of volstaat een andere visuele indicator (bijv. `opacity-50` + doorhaalstreep)?

**Vraag:** Bevestig "dashed border + roodtint" voor `exists: false` bronnen.

### V4 — Drie-knoppen-patroon: wachten of alvast beginnen?

INZICHTEN_DESIGN.md beschrijft drie knoppen: `[Analyse draaien] [Inzichten bekijken] [Rapportage]`. Sprint B heeft als scope alleen de overlay. De knop-herziening is sprint C.

In de tussentijd heeft de header van het werkblad:
- Knop "Strategisch Advies ✓" → opent overlay
- Knop "Strategie Rapport" → opent OnePager

Sprint B: alleen de naam van de eerste knop aanpassen naar "Inzichten" + overlay vervangen. Drie-knoppen-layout (incl. "Opnieuw analyseren" los van "Bekijken") wacht op sprint C.

**Vraag:** Bevestig dat sprint B de knop-naam aanpast maar niet de drie-knoppen-layout introduceert.

### V5 — Component: één bestand of splitsen?

`InzichtenOverlay.jsx` zal ~200–300 regels worden. `InzichtItem.jsx` apart maakt het testbaarder maar voegt een extra bestand toe.

**Vraag:** Alles in `InzichtenOverlay.jsx`, of `InzichtItem.jsx` apart?

### V6 — Migratie draaien: automatisch of handmatig?

De labels-migratie (`INSERT INTO app_config`) kan door jou handmatig in Supabase SQL Editor worden gedraaid (zoals sprint A). Geen Supabase CLI nodig.

**Vraag:** Zelfde aanpak als sprint A (jij draait handmatig na push)?
