# Inzichten Rebuild — Color Mapping

**Datum:** 2026-04-25  
**Doel:** Elke kleur uit het prototype vertalen naar de juiste app-variabele of Tailwind utility, zodat de overlay volledig theme-aware is.

---

## Beschikbare CSS-variabelen in de app (`src/index.css`)

```css
--color-primary:       #1a365d   /* Kingfisher navy  /  Platform: tenant-kleur */
--color-accent:        #8dc63f   /* Kingfisher lime  /  Platform: tenant-kleur */
--color-accent-hover:  #7ab52e
--color-success:       #2c7a4b
--color-analysis:      #00AEEF
--color-overlay:       #001f33   /* donkere overlay/modal achtergronden */
--color-accent-light:  #edf7e0   /* lichte tint van accent */
```

---

## Prototype-variabelen → App-implementatie

### Brand-kleuren (wisselen per tenant — NOOIT hardcoded)

| Prototype variabele | Prototype hex | Rol in overlay | App-implementatie |
|---|---|---|---|
| `--ink` | `#0f1e3d` | Primaire tekst-kleur voor koppen (h1, h2, h3), chapter border-bottom, TOC active state | `var(--color-primary)` → Tailwind: `text-[var(--color-primary)]`, `border-[var(--color-primary)]` |
| `--accent` | `#a6d608` | Alleen in mock-werkblad-knoppen (prototype scaffolding). **Niet gebruikt in de overlay zelf.** | Niet nodig in overlay. Als we eyebrow-accent willen: `var(--color-accent)` |

**Noot `--ink` vs `--color-primary`:** Prototype-hex `#0f1e3d` wijkt licht af van Kingfisher `#1a365d` — dat is een afrondingsverschil in de prototype-sessie. De semantische betekenis is identiek: primaire brand-donkertint.

**Noot `--accent`:** De overlay gebruikt de accent-kleur in het prototype helemaal niet — de overlay is ink-on-paper, minimalistisch. We voegen `var(--color-accent)` alleen toe als bewuste keuze (bijv. eyebrow-kleur). Niet mechanisch kopiëren.

---

### Neutrale grijzen (tenant-onafhankelijk — Tailwind utilities)

| Prototype variabele | Prototype hex | Rol in overlay | App-implementatie |
|---|---|---|---|
| `--ink-soft` | `#2a3a5e` | Body-tekst (`finding-para`), ref-links, overlay-sluit-knop hover | `text-slate-700` — bewust neutraal, niet brand-gebonden. Body-tekst hoeft niet per tenant te verschuiven. |
| `--paper` | `#f5f6f8` | Overlay achtergrond (`bg` van de gehele overlay) | `bg-slate-100` (`#f1f5f9`) |
| `--paper-warm` | `#fafaf9` | Document-kolom achtergrond (licht warmer) | `bg-white` — verschil met paper is subtiel, `bg-white` volstaat |
| `--line` | `#e3e5eb` | Standaard borders (tussen findings, refs footer `border-top`) | `border-slate-200` (`#e2e8f0`) |
| `--line-soft` | `#eef0f4` | Subtiele borders (finding `border-bottom` bij niet-laatste) | `border-slate-100` (`#f1f5f9`) |
| `--muted` | `#6b7388` | Muted tekst: eyebrow, chapter-number kicker, meta-regel, TOC label "Inhoud", filter-label, kicker-labels "OBSERVATIE"/"AANBEVELING"/"VERWIJST NAAR" | `text-slate-500` (`#64748b`) |
| `--muted-strong` | `#4a5269` | Iets donkerdere muted tekst: TOC items, finding-refs tekst | `text-slate-600` (`#475569`) |
| `#fff` | `#ffffff` | Wit: filter-pills achtergrond, sluiten-knop hover, SourceLink hover | `bg-white`, `text-white` |

---

### Mock-banner kleuren (prototype scaffolding — negeren)

| Prototype hex | Locatie | Status |
|---|---|---|
| `#fffbe6` | `.mock-banner` achtergrond | **Niet overnemen** — prototype scaffolding, staat niet in de overlay |
| `#f0e6a6` | `.mock-banner` border | **Niet overnemen** |
| `#6b5a1f` | `.mock-banner` tekst | **Niet overnemen** |

---

### Type-kleuren (semantisch — blijven hardcoded in TYPE_CONFIG)

Type-kleuren zijn semantisch (rood = ontbreekt, etc.) en wisselen niet per tenant. Ze blijven exact zoals nu in `TYPE_CONFIG` via Tailwind semantic-color classes.

| Prototype variabele | Prototype hex | Huidige TYPE_CONFIG | Tailwind |
|---|---|---|---|
| `--type-ontbreekt` | `#b43a3a` | `text-red-700` (`#b91c1c`) | ✓ dicht genoeg |
| `--type-ontbreekt-soft` | `#fdecec` | `bg-red-50` (`#fef2f2`) | ✓ dicht genoeg |
| `--type-zwak` | `#c26a1f` | `text-amber-800` (`#92400e`) | Aanpassen naar `text-amber-700` (`#b45309`) — dichter bij prototype |
| `--type-zwak-soft` | `#fdf0e3` | `bg-amber-50` (`#fffbeb`) | ✓ dicht genoeg |
| `--type-kans` | `#2a6bb4` | `text-blue-700` (`#1d4ed8`) | Aanpassen naar `text-blue-600` (`#2563eb`) — iets dichter bij prototype muted blue |
| `--type-kans-soft` | `#e8f0fa` | `bg-blue-50` (`#eff6ff`) | ✓ dicht genoeg |
| `--type-sterk` | `#2f7a3e` | `text-green-700` (`#15803d`) | ✓ dicht genoeg |
| `--type-sterk-soft` | `#e8f4ea` | `bg-green-50` (`#f0fdf4`) | ✓ dicht genoeg |

**Noot type-kleuren:** Kleine Tailwind-aanpassingen voor `zwak` en `kans` (eén shade). Geen hexcodes; altijd via Tailwind semantic names. TYPE_CONFIG blijft de single source of truth.

---

## Gebruiksregels bij het bouwen

### Regel 1 — Brand-kleur check
Voor elk kleur-gebruik: is dit een brand-kleur (verschilt per tenant)?
- **Ja** → `var(--color-primary)` of `var(--color-accent)` of variant
- **Nee** → Tailwind utility

### Regel 2 — Verboden patronen in de nieuwe componenten
```jsx
// ❌ VERBODEN
className="text-[#1a365d]"
className="bg-[#0f1e3d]"
className="border-[#a6d608]"
style={{ color: '#2a3a5e' }}

// ✅ CORRECT
className="text-[var(--color-primary)]"
className="border-[var(--color-primary)]"
className="bg-[var(--color-accent-light)]"
className="text-slate-700"      // neutraal
```

### Regel 3 — Type-kleuren via TYPE_CONFIG
Elke kleurverwijzing naar een insight-type loopt via TYPE_CONFIG. Nooit direct `text-red-700` schrijven in JSX — altijd via `cfg.color`, `cfg.bg`, etc.

```jsx
// ❌ VERBODEN
<span className="text-red-700">Ontbreekt</span>

// ✅ CORRECT
const cfg = TYPE_CONFIG[type] ?? FALLBACK_TYPE;
<span className={cfg.badgeText}>Ontbreekt</span>
```

---

## Concrete mapping per overlay-element

Directe lookup voor de bouwer — per UI-element de Tailwind/CSS-var.

| UI-element | Kleur-eigenschap | Implementatie |
|---|---|---|
| Overlay achtergrond | bg | `bg-slate-100` |
| Document-kolom achtergrond | bg | `bg-white` |
| TOC achtergrond | bg | `bg-transparent` (erft slate-100) |
| Eyebrow "Inzichten" | tekst | `text-slate-500` |
| Document H1 | tekst | `text-[var(--color-primary)]` |
| Meta-regel tekst | tekst | `text-slate-500` |
| Meta-regel middenpunten | tekst | `text-slate-300` |
| Chapter border-bottom | border | `border-[var(--color-primary)]` |
| Chapter kicker "Hoofdstuk 1" | tekst | `text-slate-500` |
| Chapter title H2 | tekst | `text-[var(--color-primary)]` |
| Chapter intro paragraaf | tekst | `text-slate-600` |
| Filter-label "Filter type" | tekst | `text-slate-500` |
| Filter-pill inactief | opacity | `opacity-40` + `border-slate-200 bg-white` |
| Filter-pill actief | opacity | `opacity-100` + type-kleur via TYPE_CONFIG |
| TOC label "Inhoud" | tekst | `text-slate-500` |
| TOC section-header | tekst | `text-[var(--color-primary)]` |
| TOC item tekst | tekst | `text-slate-600` |
| TOC item dot | bg | via TYPE_CONFIG `.dotColor` (nieuwe key) |
| TOC item active border-left | border | `border-[var(--color-primary)]` |
| Finding body-tekst (observatie/aanbeveling) | tekst | `text-slate-700` |
| Finding kicker "OBSERVATIE" / "AANBEVELING" | tekst | `text-slate-500` |
| Finding H3 titel | tekst | `text-[var(--color-primary)]` |
| Finding type-label uppercase | tekst | via TYPE_CONFIG `.color` |
| Finding cirkel-marker achtergrond | bg | via TYPE_CONFIG `.bg` |
| Finding cirkel-marker icoon | tekst/fill | via TYPE_CONFIG `.color` |
| Finding border-bottom (scheiding) | border | `border-slate-100` |
| "Verwijst naar" border-top | border | `border-dashed border-slate-200` |
| "Verwijst naar" label | tekst | `text-slate-500` |
| Bron-link tekst | tekst | `text-slate-600` |
| Bron-link underline | decoration | `underline decoration-slate-200` |
| Bron-link missing | border + tekst | `border border-dashed border-red-400 text-red-600` (semantisch: mag hardcoded) |
| Sluiten-knop border | border | `border-slate-200` |
| Sluiten-knop tekst | tekst | `text-slate-500` |
| Sluiten-knop hover achtergrond | bg | `hover:bg-white` |
| Sluiten-knop hover tekst | tekst | `hover:text-[var(--color-primary)]` |

---

## TYPE_CONFIG wijzigingen

Toevoegen van `dotColor` key (voor TOC-dot). Kleine Tailwind-aanpassing voor `zwak.color` en `kans.color`.

```js
const TYPE_CONFIG = {
  ontbreekt: {
    // ... bestaand ...
    dotColor: "bg-red-700",       // nieuw: TOC dot
  },
  zwak: {
    color: "text-amber-700",      // was text-amber-800 — één shade lichter naar proto
    dotColor: "bg-amber-700",     // nieuw
    // ...
  },
  kans: {
    color: "text-blue-600",       // was text-blue-700 — één shade naar proto muted-blue
    dotColor: "bg-blue-600",      // nieuw
    // ...
  },
  sterk: {
    // ... bestaand ...
    dotColor: "bg-green-700",     // nieuw
  },
};
```
