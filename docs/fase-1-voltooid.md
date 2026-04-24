# Fase 1 — Multi-tenant theming: voltooid

**Datum:** 2026-04-24  
**Status:** ✅ Volledig geïmplementeerd en in productie

---

## Wat is geïmplementeerd

### Fase A — AuthProvider + ThemeProvider

- `auth.service.js` uitgebreid: fetcht `user_profiles` met join op `tenants(theme_config)`
- Context levert `tenantId`, `tenantTheme`, `userRole`, `profileLoading`
- Nieuw `ThemeProvider.jsx`: injecteert CSS custom properties op `document.documentElement`
  zodra `tenantTheme` geladen is
- Guard op leeg `{}` database-default; individuele `if (value)`-guards per variabele
  voorkomen `setProperty("--x", undefined)` bug
- Nieuw `useTheme.js` hook: typed toegang tot alle theme-waarden met Kingfisher-defaults
- `AppInner` wacht op `profileLoading` vóór render; foutscherm als `tenantId` null

### Fase B — Hardcoded kleuren vervangen

- 195 hardcoded hex-waardes vervangen door CSS-variabelen in 21 bestanden
- Tailwind arbitrary values: `bg-[#1a365d]` → `bg-[var(--color-primary)]`
- `:root` defaults in `src/index.css` als fallback vóór ThemeProvider geladen is

### Fase C Stap 1 — Secundaire kleuren

5 nieuwe CSS-variabelen toegevoegd en doorgetrokken:

| Variabele | Gebruik |
|---|---|
| `--color-accent-hover` | Hover-state van accent-kleur |
| `--color-success` | Voltooid/klaar indicatoren |
| `--color-analysis` | To-be / analyse elementen |
| `--color-overlay` | Modal-overlays |
| `--color-accent-light` | Zachte achtergrondtint bij accent |

### Fase C Stap 2+3 — Dynamisch logo + browser tab-titel

- Nieuw `LogoBrand.jsx`: toont tenant-logo óf `brandName` als tekst (bij null-URL of 404)
  - `imageFailed` state als vangnet: `onError` → tekst-fallback, geen hidden broken image
  - `variant="light"` (wit logo voor donkere header) / `variant="dark"` (donker logo)
- Nieuw `useDocumentTitle.js`: zet `document.title = "{brandName} — {productName}"`
- Hardcoded `<img src="/kf-logo*.png">` vervangen door `<LogoBrand>` in 4 bestanden:
  `App.js`, `LoginScreen.js`, `AdminPage.jsx`, `ErrorBoundary.jsx`
- `public/index.html` `<title>` neutraal: "Strategy Platform"

---

## Database-wijzigingen

**Tabel `tenants`** — `theme_config` uitgebreid naar 10 keys:

```
primary_color, accent_color, accent_hover_color, success_color,
analysis_color, overlay_color, accent_light_color,
logo_url, logo_white_url, brand_name, product_name
```

**Huidige tenant-configuratie:**

| Tenant | primary | accent | logo_url | logo_white_url |
|---|---|---|---|---|
| Kingfisher | `#1a365d` | `#8dc63f` | `/kf-logo.png` | `null` (bestand bestaat niet) |
| Platform | `#0f172a` | `#f97316` | `null` | `null` |

Seed-script: `docs/theming-seed-v2.sql` (idempotent, beide tenants volledig)

---

## Bewuste uitsluitingen / deferrals

- **StrategyOnePager C-object** (`#00AEEF` / `#2c7a4b` in template literals met
  opacity-suffix): kan niet mechanisch vervangen worden. Gedocumenteerd in
  `docs/parking-lot.md`. Oplossing via `color-mix()` in latere sprint.

- **`kf-logo-white.png`**: bestand bestaat niet. Database op `null` gezet;
  `LogoBrand` toont "Kingfisher" als tekst. Zie `parking-lot.md`.

- **`useDocumentTitle` op login-scherm**: alleen in `AppInner` aangeroepen,
  niet op de login-pagina. Zie `parking-lot.md`.

---

## Commits (chronologisch)

| Commit | Inhoud |
|---|---|
| `3ee1914` | Fase A+B — ThemeProvider + CSS-variabelen (21 bestanden) |
| `2d6811e` | Fase C stap 1 — secundaire kleuren als CSS-variabelen |
| `047ff10` | Fase C stap 2+3 — dynamisch logo + browser tab-titel |
| `c8d75dc` | Fix: LogoBrand imageFailed fallback + Kingfisher logo_white_url op null |

---

## Verifieer in productie

1. Login als **Kingfisher**-gebruiker:
   - Header: "Kingfisher" als witte tekst (geen logo-afbeelding)
   - Tab-titel: "Kingfisher — Strategy Platform"
   - Accent-kleur knoppen: `#8dc63f` groen
   
2. Login als **Platform**-gebruiker:
   - Header: "Platform" als witte tekst
   - Tab-titel: "Platform — Strategy Platform"
   - Accent-kleur knoppen: `#f97316` oranje
   - Primary achtergrond: `#0f172a` slate-900

3. Vóór inloggen (login-scherm):
   - Kingfisher-defaults zichtbaar via `:root` in `index.css`
   - Tab-titel: "Strategy Platform" (statisch uit `index.html`)
