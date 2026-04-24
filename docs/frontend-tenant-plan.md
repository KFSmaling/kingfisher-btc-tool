# Frontend tenant-plan

> Analyse van de huidige flow + voorstel voor tenant_id-integratie.  
> Geen code gewijzigd — alleen plan.  
> Opgesteld: 2026-04-24

---

## 1. Huidige flow (hoe het nu werkt)

### Auth-laag

`AuthProvider` in `src/shared/services/auth.service.js` beheert de sessie:
- `supabase.auth.getSession()` op mount → zet `session` state
- `supabase.auth.onAuthStateChange()` → houdt `session` actueel
- Context exposeert: `{ session, user, signIn, signUp, signOut, resetPassword }`
- `user` = `session?.user ?? null` — de ruwe Supabase Auth-user

**Er wordt niets uit `user_profiles` geladen.** `tenant_id` en `role` zijn onbekend in de frontend.

### Canvas-laag

`App.js` haalt `user` op via `useAuth()` en geeft hem door aan `useCanvasState({ user, lang, onCanvasSwitch })`.

`useCanvasState` (L115–154) triggert bij login:
```js
loadUserCanvases(user.id)
  → als canvassen bestaan: laad het meest recente
  → als GEEN canvassen: createCanvas({ userId: user.id, name, language })
```

`handleNewCanvas` (L199–216) roept ook aan:
```js
createCanvas({ userId: user.id, name, language: lang })
```

`createCanvas` in `canvas.service.js` (L45–66) doet:
```js
supabase.from("canvases").insert({
  user_id: userId,
  name:    name,
  blocks:  {},
})
```

**Hier ontbreekt `tenant_id`.** Na de migratie is `tenant_id NOT NULL` — dit INSERT faalt met een constraint-fout.

### Crash-scenario na migratie

1. Kees logt in → sessie actief
2. `useCanvasState` trigger: `loadUserCanvases(user.id)`
3. RLS op `canvases` controleert: `tenant_id = current_tenant_id()`
4. `current_tenant_id()` → zoekt in `user_profiles` → **vindt rij** (seed heeft die aangemaakt) → retourneert `00...001`
5. Canvas-lijst laadt correct ✅
6. Kees klikt "Nieuw canvas" → `createCanvas({ userId, name })`
7. INSERT mist `tenant_id` → **NOT NULL violation → crash** ❌

En bij een schone login zonder bestaande canvassen:
- Stap 2 retourneert 0 canvassen → `createCanvas` wordt direct aangeroepen → zelfde crash ❌

---

## 2. Voorstel: waar tenant_id wordt opgehaald en hoe hij beschikbaar komt

### Aanpak: uitbreiden van `AuthProvider`

`tenant_id` is user-identity data — het hoort bij de auth-context, niet bij canvas-state. De cleanste plek om het te laden is direct na het vaststellen van de sessie, in `AuthProvider`.

**Nieuwe flow:**

```
supabase.auth.getSession()
  └→ session beschikbaar
      └→ fetch user_profiles WHERE id = user.id
          └→ { tenant_id, role } beschikbaar in AuthContext
```

`AuthContext` exposeert na wijziging:
```js
{ session, user, tenantId, userRole, profileLoading,
  signIn, signUp, signOut, resetPassword }
```

- `profileLoading: true` zolang user_profiles nog niet geladen is → app wacht (geen createCanvas vóór tenantId bekend is)
- `tenantId: null` als user geen profiel heeft (nieuwe user, nog niet uitgenodigd) → app toont een foutscherm of wacht

### Hoe tenant_id bij createCanvas komt

`useCanvasState` ontvangt nu `tenantId` naast `user`:

```js
useCanvasState({ user, tenantId, lang, onCanvasSwitch })
```

`createCanvas` aanroep wordt:
```js
createCanvas({ userId: user.id, tenantId, name, language: lang })
```

`createCanvas` in canvas.service.js krijgt de extra parameter en stuurt hem mee in de INSERT:
```js
.insert({ user_id: userId, tenant_id: tenantId, name, blocks: {} })
```

### Laad-volgorde na login (compleet)

```
1. AuthProvider: getSession() → user beschikbaar
2. AuthProvider: fetch user_profiles[user.id] → tenantId + userRole beschikbaar
3. App renders (profileLoading = false)
4. useCanvasState trigger: loadUserCanvases(user.id)
5. → createCanvas({ userId, tenantId, name }) als geen canvassen
```

Stap 2 voegt één Supabase-roundtrip toe bij elke login. Dit is acceptabel en eenmalig per sessie.

---

## 3. Bestanden die worden aangepast

| Bestand | Wijziging |
|---------|-----------|
| `src/shared/services/auth.service.js` | `user_profiles` ophalen na sessie; `tenantId` + `userRole` + `profileLoading` toevoegen aan context |
| `src/shared/services/canvas.service.js` | `createCanvas` signature: `{ userId, tenantId, name, language }` — `tenant_id` meesturen in INSERT |
| `src/features/canvas/hooks/useCanvasState.js` | `tenantId` ontvangen als parameter; doorgeven aan `createCanvas` |
| `src/App.js` | `tenantId` uit `useAuth()` halen; doorgeven aan `useCanvasState` |

Dat zijn 4 bestanden. Geen nieuwe bestanden nodig — `user_profiles` fetch kan inline in `auth.service.js`, geen aparte service benodigd voor dit volume.

---

## 4. Andere service-functies die mogelijk tenant_id nodig hebben

De analyse van alle INSERT/UPSERT-operaties:

### `createCanvas` — ❌ breekt, fix nodig

Zie §1. Enige directe INSERT in `canvases`. Ontvangt nu geen `tenant_id`.

### Alle overige services — ✅ geen directe wijziging nodig

De tabellen `guidelines`, `guideline_analysis`, `analysis_items`, `strategic_themes`, `ksf_kpi`, `strategy_core`, `canvas_uploads`, `import_jobs` en `document_chunks` hebben **geen `tenant_id` kolom**. Ze zijn via `canvas_id` gekoppeld aan `canvases`, en de RLS op die tabellen filtert via de canvas-join.

Dit betekent: zodra `createCanvas` correct een canvas aanmaakt met de juiste `tenant_id`, erven alle downstream-inserts de tenant-isolatie automatisch via RLS. Ze hoeven zelf niets te weten van `tenant_id`.

| Service-functie | Tabel | tenant_id nodig? |
|----------------|-------|-----------------|
| `createCanvas` | `canvases` | ✅ ja — directe kolom |
| `saveCanvasUpload` | `canvas_uploads` | ❌ nee — via canvas_id |
| `createImportJob` | `import_jobs` | ❌ nee — via canvas_id |
| `upsertStrategyCore` | `strategy_core` | ❌ nee — via canvas_id |
| `upsertAnalysisItem` | `analysis_items` | ❌ nee — via canvas_id |
| `upsertStrategicTheme` | `strategic_themes` | ❌ nee — via canvas_id |
| `upsertKsfKpi` | `ksf_kpi` | ❌ nee — via theme_id |
| `createGuideline` | `guidelines` | ❌ nee — via canvas_id |
| `upsertGuidelineAnalysis` | `guideline_analysis` | ❌ nee — via canvas_id |
| `indexDocumentChunks` | `document_chunks` | ❌ nee — via canvas_id |

### `loadUserCanvases` — geen crash, maar let op

`loadUserCanvases` (canvas.service.js L32) filtert op `.eq("user_id", userId)`. Na de migratie past RLS hier de tenant-filter automatisch óverheen. Dit werkt correct voor de huidige situatie (één user per tenant). De query is wel redundant: RLS garandeert al tenant-isolatie, de expliciete `user_id`-filter is dan alleen nog een user-level filter daarbinnen. Geen crash, geen datalek — wel technische schuld voor als tenant-leden elkaars canvassen mogen zien (canvas-sharing sprint).

---

## Open punten / vragen

**Vraag 1 — Wat te tonen als `tenantId` null is?**

Als een user is ingelogd maar geen `user_profiles`-rij heeft (nieuw uitgenodigd account, seed nog niet uitgevoerd, of toekomstige externe gebruiker vóór onboarding), is `tenantId` null. De app kan dan niet werken.

Opties:
- A. Blokkeer de app met een duidelijk foutscherm: "Je account is nog niet gekoppeld aan een organisatie. Neem contact op met de beheerder."
- B. Redirect naar een onboarding-flow.

Wat is het gewenste gedrag?

**Vraag 2 — `profileLoading` als toestand in de app**

`AuthProvider` is nu leidend voor zowel auth-state als profiel-state. Dat zijn technisch twee aparte laadmomenten. `session` kan beschikbaar zijn terwijl `user_profiles` nog aan het laden is. `profileLoading: true` onderdrukken totdat beide beschikbaar zijn voorkomt dat `useCanvasState` start zonder `tenantId`.

Geen vraag aan jou — dit is een implementatiedetail. Vermeld voor transparantie.

**Vraag 3 — `userRole` nu al beschikbaar stellen?**

`user_profiles` bevat ook `role`. Dit hoeft nu nog nergens voor gebruikt te worden in de frontend (RLS regelt autorisatie server-side). Maar het kost niets om het mee op te nemen in context voor toekomstig gebruik (bijv. "Inzichten bekijken" alleen voor `tenant_admin`).

Advies: meenemen, ook al wordt het nu nog nergens gebruikt.
