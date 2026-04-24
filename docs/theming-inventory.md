# Theming Inventory — L1 Branding per Tenant

> Analyse van hardcoded branding in de codebase.  
> Geen code gewijzigd — alleen inventarisatie.  
> Opgesteld: 2026-04-24

---

## 1. Gevonden items

### 1a. Kleurwaardes (hex in Tailwind-klassen)

Vijf primaire hex-waarden rijden door de gehele UI. Ze zitten direct in
Tailwind arbitrary-value klassen (`bg-[#hex]`, `text-[#hex]`, etc.) en zijn
niet gecentraliseerd.

| Hex | Rol | Bestanden (niet-uitputtend) |
|-----|-----|-----------------------------|
| `#1a365d` | **Primary** — header achtergrond, knoppen, body-text, overlays | `App.js` (header, footer, error-schermen), `LoginScreen.js`, `BlockPanel.jsx`, `AdminPage.jsx`, `ErrorBoundary.jsx`, `index.css` |
| `#8dc63f` | **Accent** — highlight, active state, logo-border, spinner | `App.js`, `LoginScreen.js`, `GuidelinesOnePager.jsx`, `StrategyOnePager.jsx`, alle werkbladen |
| `#7ab52e` / `#7ab535` | **Accent hover** — hover-state van accent | `App.js`, diverse knoppen |
| `#2c7a4b` | **Success / completion** — "alles klaar"-knop, voltooide segmenten | `App.js`, `RichtlijnenWerkblad.jsx`, `StrategieWerkblad.jsx` |
| `#00AEEF` | **Analysis / to-be** — as-is/to-be sectie, analyse-accenten | `StrategieWerkblad.jsx`, `BlockCard.jsx` |
| `#001f33` | **Dark overlay** — modals, deep dive achtergrond | `TipsModal.jsx`, `BlockPanel.jsx` |
| `#f8fafc` | **Page background** | `App.js`, `AdminPage.jsx` |
| `#edf7e0` | **Accent-light** — soft achtergrond bij accent-elementen | diverse werkbladen |

**Omvang:** hex-klassen komen voor in ~25 bestanden verspreid over
`src/App.js`, `src/LoginScreen.js`, alle feature-componenten en twee
onboarding-schermen.

---

### 1b. Tailwind named colors met branding-betekenis

Slechts zijdelings branding — deze zijn voor informatie/status, niet primaire
huisstijl. Hoeven niet in de CSS-variabelen mee.

| Klasse | Rol | Locatie |
|--------|-----|---------|
| `bg-purple-*` / `text-purple-*` | Richtlijnen-werkblad sectie-headers | `RichtlijnenWerkblad.jsx` |
| `bg-amber-*` | Multi-tab waarschuwing | `App.js` |
| `text-red-*` / `bg-red-*` | Foutmeldingen | diverse |
| `bg-blue-*` | Info-tags, login-info | `LoginScreen.js`, `RichtlijnenWerkblad.jsx` |

---

### 1c. Hardcoded namen en teksten (merknamen)

| Tekst | Classificatie | Bestand | Regel | Opmerking |
|-------|--------------|---------|-------|-----------|
| `"Kingfisher & Partners"` | naam / logo alt | `App.js` | 84 | `alt=` attribuut van logo-img |
| `"Business Transformation Canvas"` | productnaam | `App.js` | 91 | fallback in `appLabel("app.title", ...)` |
| `"From strategy to execution"` | tagline | `App.js` | 94 | fallback in `appLabel("app.subtitle", ...)` |
| `"Kingfisher & Partners · From strategy to execution"` | footer tagline | `App.js` | 275 | fallback in `appLabel("footer.tagline", ...)` |
| `"Kingfisher & Partners — intern gebruik"` | login disclaimer | `LoginScreen.js` | 100 | hardcoded tekst, geen appLabel |
| `"Kingfisher & Partners"` | login disclaimer | `LoginScreen.js` | 206 | hardcoded tekst |
| `"BTC Tool — Kingfisher & Partners"` | browser tab-titel | `public/index.html` | 27 | `<title>` element |
| `"React App Sample"` | PWA manifest name | `public/manifest.json` | 3 | nog op CRA-default |
| `"React App"` | PWA manifest short_name | `public/manifest.json` | 2 | nog op CRA-default |
| `"You are a senior business transformation consultant at Kingfisher & Partners"` | AI-prompt | `prompts/btcPrompts.js` | 9–10 | systeem-prompt voor AI, geen UI |

**Let op:** `app.title`, `app.subtitle` en `footer.tagline` zijn al
abstraheerd via `appLabel()` en laadbaar vanuit de `app_config` Supabase-tabel.
De fallbacks zijn hardcoded in `AppConfigContext.jsx`. De login-teksten
(`LoginScreen.js:100, 206`) zijn nog volledig hardcoded — geen appLabel.

---

### 1d. Logo-verwijzingen

| Pad | Bestand | Regel | Context |
|-----|---------|-------|---------|
| `/kf-logo-white.png` | `App.js` | 83 | App-header (wit logo op donkere achtergrond) |
| `/kf-logo.png` | `App.js` | 86 | Fallback als white-variant faalt |
| `/kf-logo.png` | `LoginScreen.js` | 76 | Logo op login-scherm |
| `/kf-logo.png` | `ErrorBoundary.jsx` | 35 | Logo op fout-scherm |
| `/kf-logo-white.png` | `AdminPage.jsx` | 396 | Admin-header |
| `favicon.ico` | `public/index.html` | 5 | Browser favicon |
| `logo192.png`, `logo512.png` | `public/manifest.json` | 12–19 | PWA icons (nog CRA-standaard) |

Alle logo-paden zijn statische strings. Ze wijzen naar bestanden in `public/`.
Er is geen centrale constante of config-waarde.

---

### 1e. Browser tab-title

| Element | Huidige waarde | Locatie |
|---------|---------------|---------|
| `<title>` | `BTC Tool — Kingfisher & Partners` | `public/index.html:27` |
| Manifest `name` | `Create React App Sample` | `public/manifest.json:3` |
| Manifest `short_name` | `React App` | `public/manifest.json:2` |
| Manifest `theme_color` | `#000000` | `public/manifest.json:23` |

De tab-titel staat in `index.html` en is statisch. Hij kan niet per tenant
wisselen zonder JavaScript (`document.title = ...` in een effect).

---

## 2. Voorstel CSS-variabelen

Minimale set die alle L1-theming dekt. Injecteerbaar via `:root` stijlblok
vanuit JavaScript (ThemeProvider).

```css
:root {
  /* Primaire kleur — header, footer, knoppen, body-text */
  --color-primary:        #1a365d;

  /* Accent — highlight, active state, spinner, borders */
  --color-accent:         #8dc63f;

  /* Accent hover — donkerdere variant voor hover-states */
  --color-accent-hover:   #7ab52e;

  /* Success / completion — "alles klaar", voltooide items */
  --color-success:        #2c7a4b;

  /* Analyse / to-be — as-is/to-be secties */
  --color-analysis:       #00AEEF;

  /* Dark overlay — modals, deep dive achtergronden */
  --color-overlay:        #001f33;

  /* Pagina-achtergrond */
  --color-bg:             #f8fafc;

  /* Accent-light — zachte achtergrond bij accent-elementen */
  --color-accent-light:   #edf7e0;

  /* Logo-URL's — wisselbaar per tenant */
  --logo-url-dark:        url('/kf-logo.png');
  --logo-url-light:       url('/kf-logo-white.png');
}
```

**Niet in CSS-variabelen (tekst, anders aanpakken):**

| Item | Aanpak |
|------|--------|
| Productnaam / tagline | Al via `appLabel()` — `theme_config` vult `app_config` fallbacks |
| Logo `src` paden | Via `theme_config.logoUrl` en `theme_config.logoUrlWhite` als React props |
| Browser tab-titel | `document.title` in ThemeProvider effect |
| Login-disclaimers | Via `appLabel()` uitbreiden (nu hardcoded) |

---

## 3. Bestanden die worden aangepast — volgorde

### Stap 1 — ThemeProvider (nieuw bestand)
`src/shared/context/ThemeContext.jsx`

Leest `theme_config` van de actieve tenant (beschikbaar via `AuthContext`
want `tenantId` is al bekend). Injecteert CSS-variabelen via `style` prop op
een wrappende div of via `document.documentElement.style.setProperty`.
Stelt ook `document.title` in.

Geen enkel ander bestand hoeft dit te kennen — werkt puur via CSS-variabelen.

### Stap 2 — index.css
`src/index.css`

Vervang de hardcoded `#1a365d` body-kleur door `var(--color-primary)`.
Voeg de `:root` default-waarden toe (zodat de app werkt zonder ThemeProvider).

### Stap 3 — Tailwind klassen vervangen (grootste stap)
Alle ~25 bestanden vervangen hun `bg-[#1a365d]` etc. door
`bg-[var(--color-primary)]` etc.

Volgorde binnen deze stap:
1. `src/App.js` — header, footer, error-schermen (meeste klassen)
2. `src/LoginScreen.js` — login-scherm
3. `src/shared/components/ErrorBoundary.jsx`
4. `src/features/canvas/components/BlockPanel.jsx`
5. `src/features/canvas/components/TipsModal.jsx`
6. `src/features/admin/AdminPage.jsx`
7. Alle overige feature-componenten (werkbladen, one-pagers)

### Stap 4 — Logo-paden dynamisch maken
`src/App.js`, `src/LoginScreen.js`, `src/ErrorBoundary.jsx`, `src/features/admin/AdminPage.jsx`

Logo-src uit `theme_config` lezen via ThemeContext in plaats van hardcoded paden.

### Stap 5 — Login-disclaimers abstraheren
`src/LoginScreen.js` regels 100 en 206

Hardcoded "Kingfisher & Partners" teksten vervangen door `appLabel()` calls.

### Stap 6 — public/ assets
`public/manifest.json`, `public/index.html`

Manifest bijwerken naar correcte naam. Tab-titel wordt al door ThemeProvider
gedaan — de statische fallback in index.html kan blijven als SSR-fallback.

---

## 4. theme_config structuur (voorstel)

Wat er in de `theme_config` JSONB op de `tenants` tabel komt:

```json
{
  "colors": {
    "primary":       "#1a365d",
    "accent":        "#8dc63f",
    "accentHover":   "#7ab52e",
    "success":       "#2c7a4b",
    "analysis":      "#00AEEF",
    "overlay":       "#001f33",
    "bg":            "#f8fafc",
    "accentLight":   "#edf7e0"
  },
  "logo": {
    "dark":  "/kf-logo.png",
    "light": "/kf-logo-white.png"
  },
  "name":    "Kingfisher & Partners",
  "title":   "BTC Tool — Kingfisher & Partners",
  "tagline": "From strategy to execution"
}
```

Lege velden of ontbrekende sleutels vallen terug op de Kingfisher-defaults
in `:root` — de app werkt altijd, ook zonder `theme_config`.
