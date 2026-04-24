# Parking lot — open technische items

Items die bewust zijn uitgesteld. Niet vergeten, niet nu.

---

## 🟡 Middelgrote prioriteit

### StrategyOnePager.jsx — C-object hex-constanten

Twee hardcoded hex-waardes in het `C`-object worden gebruikt met template
literals die opacity-suffixes appenden:

```js
const C = {
  blue:    "#00AEEF",   // gebruikt als ${C.blue}20, ${C.blue}30
  greenDk: "#2c7a4b",  // gebruikt als inline style color
};
```

`var(--color-analysis)20` is ongeldige CSS — mechanische vervanging werkt
niet. Oplossing via `color-mix()` of RGBA-varianten als CSS-variabelen.

Locatie: `src/features/strategie/StrategyOnePager.jsx` regels 20–21.

---

### Kingfisher heeft geen wit logo

`kf-logo-white.png` bestaat niet in `/public`. Kingfisher's `logo_white_url`
staat daarom op `null` in de database, en de `imageFailed`-fallback in
`LogoBrand` toont "Kingfisher" als tekst op de navy header.

Dit is functioneel correct, maar visueel minder sterk dan een echt logo.
Actie zodra een wit/transparant logo-bestand beschikbaar is:
1. Bestand plaatsen in `/public/kf-logo-white.png`
2. Database updaten: `UPDATE tenants SET theme_config = theme_config || '{"logo_white_url": "/kf-logo-white.png"}'::jsonb WHERE id = '00000000-0000-0000-0000-000000000002'`

---

### Platform-tenant heeft geen logo

`logo_url` en `logo_white_url` zijn beide `null` voor Platform. Toont
"Platform" als tekst. Zodra een echt logo beschikbaar is: bestand toevoegen
aan `/public` en seed-SQL bijwerken.

---

## 🟢 Lage prioriteit / later

### `color-mix()` implementatie voor opacity-varianten

Als de C-object-vervanging (zie Middelgrote prioriteit) wordt aangepakt:
overweeg CSS custom properties met `color-mix()` te introduceren voor
alle opacity-tints in de app — niet alleen `StrategyOnePager`.

Patroon:
```css
--color-analysis-20: color-mix(in srgb, var(--color-analysis) 20%, transparent);
```

Browser-support: Baseline 2023, voldoende voor doelgroep.

---

### Tenant-admin UI

Er is nog geen in-app interface voor:
- Aanmaken van nieuwe tenants
- Uitnodigen van gebruikers (handmatig via Supabase Dashboard nu)
- Wijzigen van `theme_config` zonder SQL-editor

Gepland als onderdeel van de admin-module, na fase 2.

---

### Demo-omgeving

Demo-alias (`kingfisher-btcdemo.vercel.app`) verwijderd per 2026-04-22.
Nieuwe demo-architectuur gepland — zie `TECH_DEBT.md` P5.
Overwegen: apart demo-tenant in bestaande DB, of volledig aparte Supabase-instantie.

---

### LogoBrand in ErrorBoundary — AuthProvider dependency

`ErrorBoundary` wrapt de hele app inclusief `AuthProvider`. Als een crash
**vóór** `AuthProvider` initialiseert, roept `LogoBrand` → `useTheme()` →
`useAuth()` aan buiten context → crash in de crash-handler.

Alleen relevant bij ernstige provider-fouten vroeg in de bootstrap. In de
praktijk treden crashes na `AuthProvider`-mount op.

Oplossing indien nodig: `ErrorBoundary` een prop `brandName` / `logoUrl`
meegeven die niet via context loopt, of een lichte `BrandContext` buiten
`AuthProvider` introduceren.

Locatie: `src/shared/components/ErrorBoundary.jsx`, `src/App.js`
