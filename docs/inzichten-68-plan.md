# Plan: Issue #68 — Inzichten UI (Sprint B)

**Status:** ✅ Besluiten ontvangen — implementatie gereed  
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

**`InzichtenOverlay.jsx`** — container + layout:

```
InzichtenOverlay
  props: { insights[], loading, error, onClose }
  intern:
    - activeFilters: Set van actieve type-filters
  render:
    ├─ Header (sticky): titel + sluit-knop
    ├─ Filters: type-toggles met count
    ├─ Body (flex-row):
    │   ├─ TOC (sticky, w-48): anker-links met kleur-streepje, titels
    │   │   truncated op ~6-7 woorden (text-ellipsis whitespace-nowrap overflow-hidden)
    │   └─ Content (flex-1): twee <section> blokken (onderdelen / dwarsverbanden)
    │       └─ <InzichtItem> per bevinding
    ├─ Empty-state: als insights null of [] → label.analysis.empty tekst
    └─ Footer: "opgeslagen per canvas" tekst
```

**`InzichtItem.jsx`** — apart bestand:
```
props: { insight }
render:
  ├─ Type-badge: icoon + label (kleurenblind-safe)
  ├─ Titel (h3)
  ├─ Observatie (platte tekst, geen inline highlights)
  ├─ Aanbeveling
  └─ "Verwijst naar"-voetregel: bron-pills
      ├─ exists: true  → normale pill
      └─ exists: false → border-dashed border-red-300 text-red-700 bg-red-50
```

### TOC

Eenvoudige anker-links (`href="#insight-{id}"`). Geen scroll-spy, geen `IntersectionObserver`. TOC-titels truncaten: `className="truncate max-w-[160px]"` (text-ellipsis, whitespace-nowrap, overflow-hidden — Tailwind `truncate` utility dekt dit).

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

## 4. Besluiten (2026-04-25)

| # | Vraag | Besluit |
|---|---|---|
| V1 | TOC: scroll-spy of anker-links? | **Eenvoudige anker-links.** Geen scroll-spy, geen `IntersectionObserver`. |
| V2 | Inline bron-highlights of "Verwijst naar"-voetregel? | **Optie A.** Observatie plat renderen, "Verwijst naar"-voetregel onderaan elke bevinding. |
| V3 | Stijl `exists: false` bronnen? | **Bevestigd:** `border-dashed border-red-300 text-red-700 bg-red-50` (of vergelijkbaar). |
| V4 | Drie-knoppen-layout in sprint B? | **Nee.** Sprint B: alleen knop-naam `"Strategisch Advies ✓"` → `"Inzichten bekijken ✓"`. Drie-knoppen-layout = sprint C. |
| V5 | Één component of splitsen? | **Splitsen:** `InzichtItem.jsx` apart bestand. |
| V6 | Migratie: automatisch of handmatig? | **Handmatig**, zoals sprint A. |

**Aanvullende besluiten:**
- TOC-titels truncaten op ~6–7 woorden (`className="truncate max-w-[160px]"`).
- Expliciete empty-state: als `insights` null of `[]` → nette melding via `label.analysis.empty`. Geen leeg scherm.
