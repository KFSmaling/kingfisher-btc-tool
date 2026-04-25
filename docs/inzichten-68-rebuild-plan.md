# Inzichten Sprint B — Visuele Rebuild Plan

**Datum:** 2026-04-25  
**Issue:** #68  
**Aanleiding:** De huidige InzichtenOverlay.jsx is structureel correct maar visueel fundamenteel anders dan prototype 2 (`docs/prototypes/inzichten-prototype-v2.html`). Dit plan beschrijft wat behouden blijft, wat opnieuw gebouwd moet worden, welke nieuwe labels nodig zijn, hoe de inline-bron-uitdaging aangepakt wordt, en de werkomvang.

---

## A. Wat klopt — laat staan

De volgende structuur en logica zijn correct en worden niet aangeraakt:

| Element | Locatie | Reden |
|---|---|---|
| Sectie-indeling onderdelen / dwarsverbanden | `InzichtenOverlay.jsx` | Klopt met prototype hoofdstuk 1 / hoofdstuk 2 |
| Filter-logica (Set van actieve types, min. 1 actief) | `InzichtenOverlay.jsx` | Zelfde gedrag als prototype JS toggle-handler |
| Anchor-link TOC-navigatie (`href="#insight-{id}"`) | `InzichtenOverlay.jsx` | Prototype gebruikt ook `id`-gebaseerde navigatie |
| Empty-state (`insights === null \|\| length === 0`) | `InzichtenOverlay.jsx` | Correcte triggers |
| `appLabel(key, fallback)` patroon | Beide componenten | Blijft intact, alleen nieuwe keys erbij |
| `Array.isArray(insight.source_refs)` null-guard | `InzichtItem.jsx` | Blijft |
| `source` prop in `SourcePill` (was `ref`) | `InzichtItem.jsx` | Blijft |
| TYPE_CONFIG met kleur/icoon per type | `InzichtItem.jsx` | Kleuren blijven (proto gebruikt exact dezelfde kleur-families) — iconen worden ronde cirkel-markers |
| Data model (`id`, `type`, `category`, `title`, `observation`, `recommendation`, `source_refs`) | Beide | Geen schema-wijzigingen |

---

## B. Wat visueel fundamenteel anders is — moet opnieuw

### B1. Overlay-container en header

**Huidig:** Volledige `fixed inset-0` overlay met donkerblauwe header (`bg-[var(--color-primary)]`), witte tekst, `Sparkles`-icoon, scheiding header/content met `border-b`.

**Prototype:** Géén gekleurde header-balk. De overlay ís het document — `background: var(--paper)` (`#f5f6f8`) van rand tot rand. De document-header is een tekst-sectie boven in de content-kolom, niet een aparte UI-balk. Sluit-knop is een klein cirkeltje (`overlay-close`) `position: fixed` rechts bovenin.

**Wijziging:** Header-balk volledig verwijderen. Overlay wordt een `fixed inset-0 bg-[#f5f6f8] grid grid-cols-[240px_1fr]` zonder header-balk. Sluiten-knop wordt een ronde border-knop (`w-8 h-8 rounded-full border border-slate-200 text-slate-500`) `fixed top-3 right-6`.

---

### B2. Document-header (eyebrow + titel + meta + filters)

**Huidig:** Filters zitten in een aparte `bg-white border-b` balk onder de overlay-header. Geen documenttitel of meta-informatie.

**Prototype:** Alles zit in één `doc-header` sectie als eerste element van de content-kolom:
- Eyebrow: `"Inzichten"` — 10px uppercase, `var(--muted)`, `letter-spacing: 0.14em`
- H1: `"Strategie — [canvas naam]"` — 28px, `font-weight: 600`, `letter-spacing: -0.015em`
- Meta-regel: `"Canvas: [naam] · Gegenereerd [datum] · [n] bevindingen"` — 12px, muted, middenpunten als scheidingstekens
- Filters: inline onder de meta, `gap: 10px`, NIET in een aparte balk

**Wijziging:** Separate filter-balk verwijderen. Doc-header component bouwen met eyebrow + `<h1>` + meta-spans + inline filters. Canvas-naam en datum doorgeven als props vanuit `StrategieWerkblad` (of genereer-datum uit de insights-array). Bevindingen-telling: `allInsights.length`.

---

### B3. Filter-pills

**Huidig:** Rechthoekige knoppen met gekleurde `bg-*` backgrounds bij actief, count badge `(3)`, hoge `px-3 py-1.5`, scherpe border.

**Prototype:** Pill-vorm (`border-radius: 999px`), `padding: 3px 10px 3px 8px`. Inactief: `opacity: 0.4`, geen background-kleur. Actief: normaal opacity, type-kleur voor tekst (niet achtergrond), border `var(--line)`. **Geen count badge.** Label: "Filter type" (10px uppercase) vóór de pills — niet "Toon:".

**Wijziging:** `FilterButton` component herschrijven. Active = `opacity-100`, inactive = `opacity-40`. Achtergrond altijd wit. Geen count. Label `analysis.filter.type` (nieuw key).

---

### B4. TOC (inhoudsopgave)

**Huidig:**
- Verticale `w-0.5 h-4` balk in type-kleur links van de titel
- Titels truncaten op `max-w-[160px]` (was een besluit in sprint B planning)
- Section-header 9px uppercase `text-slate-400`

**Prototype:**
- Kleur-indicatie is een **7px ronde dot** (`toc-item-dot`) in type-kleur — géén verticale balk
- Titels **niet truncaten** — volledige titel op max 12px, regel-einde bij nodig
- `border-left: 2px solid transparent` op het item zelf → actief: `border-left-color: var(--ink)` (donkerblauw, NIET type-kleur)
- Section-header: `toc-section-title` — 12px, `font-weight: 600`, `color: var(--ink)` (niet muted)
- TOC-label bovenaan: "Inhoud" (key: `label.analysis.toc.label`)
- TOC-breedte: 240px (huidig: `w-52` = 208px)
- `padding: 40px 0 40px 32px` — ruimer dan huidig

**Wijziging:** `TocEntry` herschrijven. Dot ipv balk. Geen truncate. Active-state border op het item (niet de dot). TOC-breedte naar 240px. Section-titles donkerder. "Inhoud" label toevoegen.

---

### B5. Hoofdstuk-blokken

**Huidig:** `<h2>` met `text-xs font-bold uppercase tracking-widest text-slate-400 mb-4 pb-2 border-b border-slate-200`. Geen intro-tekst. Teller in de kop.

**Prototype:**
- `chapter-number`: "Hoofdstuk 1" — 10px uppercase, muted — **boven** de hoofdstuktitel
- `chapter-title`: `<h2>` — 22px, `font-weight: 600`, `letter-spacing: -0.01em`, `border-bottom: 1px solid var(--ink)` (border in ink-kleur, niet slate)
- `chapter-intro`: intro-paragraaf (14px, `color: var(--muted-strong)`, max-width 620px) — **onder** de h2 maar **vóór** de bevindingen
- Geen teller in de kop

**Wijziging:** Chapter-header opbouwen als drie-laags: kicker + h2 + intro. Twee nieuwe label-keys voor intro-teksten. `border-b` van `border-slate-200` naar `border-[var(--color-primary)]` (of Tailwind `border-slate-800`).

---

### B6. InzichtItem — kaart-layout vs. lees-sectie

Dit is de meest fundamentele afwijking.

**Huidig:** Elke bevinding is een **kaart** — `rounded-lg border bg-[type-color-50]`, 4px gekleurde left-bar, type-badge (pill met gekleurde achtergrond). Scheiding tussen bevindingen door kaart-witruimte.

**Prototype:** Geen kaart, geen border, geen gekleurde achtergrond. Bevindingen zijn **lees-secties** gescheiden door een `border-bottom: 1px solid var(--line-soft)`. De laatste bevinding heeft geen border.

Elementen per bevinding:

| Element | Huidig | Prototype |
|---|---|---|
| Type-indicator | Badge pill (gekleurde bg + tekst + icoon) | **Ronde 24px cirkel** (`border-radius: 50%`) met icoon, type-achtergrond-kleur (zacht), margin-top 4px |
| Type-label | Onderdeel van badge, inline naast icoon | **Eigen regel boven de title**: 10px uppercase, type-kleur, `letter-spacing: 0.12em` |
| Titel | `text-sm font-semibold` inline naast badge | `<h3>` 18px, `font-weight: 600`, `letter-spacing: -0.005em` |
| Observatie-blok | `<p>` plain tekst, geen kicker-label | `<strong class="label">Observatie</strong>` als block kicker (10px uppercase, muted) + tekst 15px |
| Aanbeveling-blok | `<p>` italic + left border `border-l-2 border-slate-300 pl-3` | `<strong class="label">Aanbeveling</strong>` als block kicker + tekst 15px, geen italic, geen left-border |
| "Verwijst naar" footer | Pill-badges + `SourcePill` component | `border-top: 1px dashed var(--line)` + tekst-links (underlined), geen pills |
| Ontbrekende bron | Dashed-border rode pill | Inline `class="missing"` met dashed border, rood, `::before content: "— "` |
| Hele kaart-achtergrond | Type-gekleurde `bg-*-50` | Geen background |
| Scheiding | Kaart-witruimte / `mb-4` | `border-bottom: 1px solid var(--line-soft)` op finding-level |

**Wijziging:** `InzichtItem` volledig herschrijven. Kaart-structuur weg. Twee aparte subcomponenten bouwen: `FindingHead` (cirkel-marker + type-label + h3) en `FindingBody` (observatie-blok + aanbeveling-blok + refs-footer).

---

### B7. "Verwijst naar" footer styling

**Huidig:** `SourcePill` component met `bg-slate-100 text-slate-600 border` pills, of `border-dashed border-red-300` voor ontbrekend.

**Prototype:** `finding-refs` div met `border-top: 1px dashed var(--line)`. Refs als `<a>` elementen (underlined tekst-links, gescheiden door ` · `). Ontbrekende ref: `class="missing"` — `border: 1px dashed var(--type-ontbreekt)`, transparante achtergrond, `::before content: "— "`. Label: "VERWIJST NAAR" (10px uppercase, `letter-spacing: 0.1em`).

**Wijziging:** `SourcePill` vervangen door `SourceLink` (tekst + separator). Styling via Tailwind: `border-t border-dashed border-slate-200 pt-3 mt-3`. Ontbrekende ref: `border border-dashed border-red-400 text-red-600 px-1 rounded text-[10px]`. Refs gescheiden door `<span className="mx-2 text-slate-300">·</span>`.

---

## C. Nieuwe labels

Op basis van prototype-tekst vs. bestaande label-keys. Bestaande keys worden niet gewijzigd.

| Key | Waarde | Toelichting |
|---|---|---|
| `label.analysis.kicker` | `"Inzichten"` | Eyebrow boven document-h1 |
| `label.analysis.toc.label` | `"Inhoud"` | Label bovenaan TOC |
| `label.analysis.filter.type` | `"Filter type"` | Vervangt huidige `label.analysis.filter.label` ("Toon:") — beide houden `DO NOTHING` zodat oude waarde intact blijft |
| `label.analysis.chapter.number.onderdelen` | `"Hoofdstuk 1"` | Kicker boven h2 Onderdelen |
| `label.analysis.chapter.number.dwarsverbanden` | `"Hoofdstuk 2"` | Kicker boven h2 Dwarsverbanden |
| `label.analysis.chapter.intro.onderdelen` | `"Observaties over losse elementen van de strategie: wat ontbreekt, wat is zwak, waar liggen kansen, waar zit kracht."` | Intro-paragraaf onder Onderdelen-h2 |
| `label.analysis.chapter.intro.dwarsverbanden` | `"Observaties over samenhang: overlap tussen thema's, consistentie tussen visie en ambitie, en verbanden met andere werkbladen van het canvas."` | Intro-paragraaf onder Dwarsverbanden-h2 |
| `label.analysis.section.observation` | `"Observatie"` | Block-kicker boven observatie-tekst |
| `label.analysis.section.recommendation` | `"Aanbeveling"` | Block-kicker boven aanbeveling-tekst |
| `label.analysis.section.references` | `"Verwijst naar"` | Footer-label boven bron-links |
| `label.analysis.meta.canvas` | `"Canvas:"` | Meta-regel prefix |
| `label.analysis.meta.generated` | `"Gegenereerd"` | Meta-regel gegenereerd-prefix |
| `label.analysis.meta.findings` | `"bevindingen"` | Meta-regel suffix (getal wordt prepend door code) |

**Niet nodig als aparte label:**
- Document-h1 is dynamisch (`"Strategie — [canvasNaam]"`) — geen vaste string
- "Analyse draaien" / "Inzichten bekijken" knoppen zitten in werkblad, niet overlay — bestaande keys

**Totaal nieuwe keys:** 13 (bovenstaand). Migratie-SQL als `ON CONFLICT (key) DO NOTHING` — bestaande tenant-overrides intact.

---

## D. Inline bron-rendering — technische uitdaging

### Situatie

Het prototype toont source-verwijzingen **middenin de observatie-tekst** als `<a class="src">Thema 6 — Cultuur van eigenaarschap</a>`. De huidige data-structuur heeft `observation` als **plain string** en `source_refs` als **aparte array** (gebruikt voor de footer).

INZICHTEN_DESIGN.md stelt als principe: "Inline bronvermeldingen in lopende tekst. Niet als losse chips."

### Opties

**Optie 1 — AI placeholder tokens `[REF:uuid]`**

De AI genereert de observatietekst met tokens zoals `[REF:abc123]` waar een bron-verwijzing hoort. De frontend vervangt deze tokens met React-componenten.

- Voordeel: exacte koppeling tussen inline-ref en `source_refs`-object (id, label, exists)
- Voordeel: werkt ongeacht woordkeuze van de AI
- Nadeel: vereist prompt-aanpassing in `api/strategy.js` (heropent Sprint A)
- Nadeel: frontend-parser nodig (split op token, render als array van strings + React-elementen)
- Nadeel: risico dat AI tokens plaatst op verkeerde plek of vergeet

**Optie 2 — Frontend-side tekst-matching**

Zoek `source_ref.label` strings in de `observation`-tekst en vervang door pills. Geen AI-wijziging nodig.

- Voordeel: geen prompt-aanpassing
- Nadeel: zeer fragiel — AI reproduceert labels zelden exact (hoofdletters, afkortingen, leestekens)
- Nadeel: false-positives bij partiële matches
- **Conclusie: niet bruikbaar**

**Optie 3 — Footer only (geen inline pills)**

`observation` blijft plain tekst. Inline pills weglaten. "Verwijst naar"-footer blijft het enige verwijzings-mechanisme. Dit is een bewuste afwijking van het prototype-ideaal.

- Voordeel: nul extra complexiteit, huidige data-model werkt
- Voordeel: sprint B is afgerond zonder Sprint A te heropenen
- Nadeel: afwijking van design-principe in INZICHTEN_DESIGN.md
- **De footer is nog steeds zinvol** — INZICHTEN_DESIGN.md zegt zelf: "Onderaan elke bevinding een 'Verwijst naar'-samenvatting voor snel overzicht."

### Voorkeursoptie: Optie 3 nu, Optie 1 als aparte micro-sprint

**Rationale:** Sprint A is afgesloten en getest. Optie 1 vereist een prompt-wijziging die nieuwe test-runs nodig maakt en risico op regressie in de analyse-kwaliteit. Optie 2 is niet bruikbaar. De "Verwijst naar"-footer geeft de consultant de bronnen, het is minder elegant dan inline maar functioneel compleet.

**Na sprint B:** Open een micro-sprint "inline bron-tokens" die uitsluitend de prompt (`api/strategy.js`) aanpast om `[REF:uuid]`-tokens te plaatsen, het data-schema intact laat, en een `renderWithInlineRefs(text, source_refs)` hulpfunctie toevoegt aan `InzichtItem`. Die sprint raakt alleen `api/strategy.js` en `InzichtItem.jsx`.

---

## E. Geschatte werkomvang

| Taak | Uren |
|---|---|
| `InzichtenOverlay.jsx` herbouwen (header, layout, doc-header, filter-pills, chapter-blokken, TOC) | 2–3 |
| `InzichtItem.jsx` herbouwen (kaart → lees-sectie, cirkel-marker, kickers, footer-links) | 2–3 |
| Nieuwe `label.analysis.*` keys in `LABEL_FALLBACKS` + migratie-SQL (13 keys) | 0.5 |
| Canvasnaam + metadata doorgeven als props vanuit `StrategieWerkblad` | 0.5 |
| Testen (lege staat, loading, filters, TOC-navigatie, alle vier types) | 1 |
| **Totaal** | **6–8 uur** |

Inline bron-tokens (optie 1) als aparte micro-sprint: +2 uur (prompt + parser + test).

---

## F. Props-aanpassingen nodig

`InzichtenOverlay` krijgt twee nieuwe props:
- `canvasName` (string) — voor de document-h1 en meta-regel. Doorsturen vanuit `StrategieWerkblad` (is beschikbaar in de parent via canvas-context).
- `generatedAt` (ISO-string of null) — timestamp van de laatste analyse. Optioneel; als null: meta-datum weglaten.

`InzichtItem` krijgt geen extra props — `appLabel` is al aanwezig.

---

## G. Bouwendvolgorde (aanbevolen)

1. `InzichtenOverlay.jsx` — layout, header, doc-header, filters (een keer renderen met dummy-data om structuur te zien)
2. `InzichtItem.jsx` — lees-sectie layout, cirkel-marker, kickers, footer-links
3. Labels: `LABEL_FALLBACKS` + migratie-SQL
4. Integratie: canvasName + generatedAt vanuit StrategieWerkblad
5. Test alle states: loading, empty, filter-toggle, TOC-navigatie

Geen code vóór jouw go op dit plan.
