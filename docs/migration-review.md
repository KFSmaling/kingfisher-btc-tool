# Review: Multi-tenant migratie bestanden

> Review van `supabase/migrations/20260424010000–070000`.  
> Datum: 2026-04-24

---

## De 5 gevraagde punten

### 1. `010000_create_tenants` — alle kolommen aanwezig?

✅ **Correct.** Alle verwachte kolommen aanwezig met juiste types en constraints:

| Kolom | Type | Constraint | Status |
|-------|------|-----------|--------|
| `id` | `uuid` | `PRIMARY KEY DEFAULT gen_random_uuid()` | ✅ |
| `name` | `text` | `NOT NULL` | ✅ |
| `slug` | `text` | `NOT NULL`, `CONSTRAINT tenants_slug_unique UNIQUE` | ✅ |
| `tenant_type` | `text` | `NOT NULL DEFAULT 'consultancy'`, `CHECK (IN (...))` | ✅ |
| `theme_config` | `jsonb` | `NOT NULL DEFAULT '{}'` | ✅ |
| `parent_tenant_id` | `uuid` | nullable, geen FK (bewust) | ✅ |
| `subscription_id` | `uuid` | nullable | ✅ |
| `content_pack_id` | `uuid` | nullable | ✅ |
| `created_at` | `timestamptz` | `NOT NULL DEFAULT now()` | ✅ |

---

### 2. `020000_create_user_profiles` — foreign keys en role enum?

✅ **Correct.**

- `id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE` — aanwezig ✅
- `tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT` — aanwezig ✅
- `role CHECK (role IN ('platform_admin', 'tenant_admin', 'tenant_user', 'end_client_user'))` — aanwezig ✅ (vier waarden, inclusief `end_client_user` conform spec)
- Default role: `'tenant_user'` — veiligste uitgangspositie ✅

---

### 3. `030000_helper_functions` — SECURITY DEFINER én SET search_path?

✅ **Correct. Beide functies hebben beide attributen.**

```
current_tenant_id():
  SECURITY DEFINER  ✅
  SET search_path = public  ✅

current_user_role():
  SECURITY DEFINER  ✅
  SET search_path = public  ✅
```

Ter referentie: SECURITY DEFINER zonder `SET search_path` is een bekende security-bug — een kwaadwillende kan de search_path manipuleren om eigen functies in de weg te leggen. Beide functies zijn hier correct beveiligd.

---

### 4. `040000_add_tenant_id_to_canvases` — tenant_id nullable?

✅ **Correct.** De kolom wordt toegevoegd als:

```sql
ALTER TABLE canvases
  ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES tenants(id) ON DELETE RESTRICT;
```

Geen `NOT NULL` hier. De `NOT NULL` constraint wordt pas in `070000` gezet, ná de `UPDATE` die alle bestaande rijen een waarde geeft. Volgorde is correct.

---

### 5. `070000_seed` — orphan DELETE vóór tenant INSERTs? NOT NULL ná vullen?

✅ **Correct.** Volgorde in het bestand:

```
§1  DELETE FROM canvas_uploads WHERE canvas_id IS NULL   ← orphan DELETE
§2  INSERT INTO tenants ...                               ← tenant INSERTs
§3  INSERT INTO user_profiles ...
§4  UPDATE canvases SET tenant_id = ...                  ← rijen vullen
§5  ALTER TABLE canvases ALTER COLUMN tenant_id SET NOT NULL  ← pas daarna
```

Orphan DELETE staat op regel 57, eerste `INSERT INTO tenants` staat op regel 66. NOT NULL op regel 143, na UPDATE op regel 128. Volgorde is correct.

---

## Aanvullende bevindingen (buiten de 5 punten)

### ⚠️ A — Donker venster tussen 004 en 007

Zodra `040000` is uitgevoerd staat de nieuwe canvases-policy actief:
```sql
USING (tenant_id = current_tenant_id() AND ...)
```
Maar bestaande canvassen hebben op dat moment `tenant_id = NULL`. In SQL is `NULL = anything` altijd `false/null` — alle canvassen zijn dus onzichtbaar vanaf het moment dat 004 draait tot 007 de UPDATE uitvoert.

**Risico:** alleen relevant als de bestanden niet in één sessie worden uitgevoerd (bijv. 001–004 vandaag, 007 morgen). In dat geval is de productie-app tussentijds "leeg" voor de gebruiker.

**Aanbeveling:** voer `010000–070000` aaneengesloten uit in één sessie. Noteer dit expliciet in het uitvoerprotocol.

---

### ⚠️ B — Geen trigger voor nieuwe gebruikers na de seed

Na deze migratie hebben bestaande gebruikers een `user_profiles` rij (aangemaakt in 007). Maar nieuwe gebruikers die zich na de migratie aanmelden via Supabase Auth krijgen **geen** automatische `user_profiles` rij. Voor hen retourneert `current_tenant_id()` `NULL`, waardoor alle canvassen, uploads en werkblad-data onzichtbaar zijn.

Dit is een kip-en-ei probleem: de app werkt pas als er een profiel is, maar er is niets dat het profiel aanmaakt bij signup.

**Oplossingen (kies één, volgt na deze sprint):**
- PostgreSQL trigger op `auth.users` INSERT die een `user_profiles` rij aanmaakt
- Supabase Auth webhook die bij signup een Edge Function aanroept
- Expliciete onboarding-stap in de app: na eerste login `user_profiles` aanmaken via service role

Dit is geen bug in de migratie zelf maar een **open vervolgitem** dat vóór het uitnodigen van de eerste externe gebruiker geregeld moet zijn.

---

### ⚠️ C — Kleine documentatie-inconsistentie in 005

In `050000_update_canvas_uploads_rls` staat in de header:
> "Voer 007 uit vóór of direct na dit bestand."

"Vóór" is niet mogelijk — 007 staat in de vaste volgorde ná 005. De zin klopt dus half: 007 komt altijd ná 005. Geen functioneel probleem; alleen de toelichting is misleidend. (Bedoeld: "orphan uploads zijn tussen 005 en 007 onbereikbaar maar dat is acceptabel want ze worden sowieso verwijderd.")

---

### ✅ D — canvas_uploads en import_jobs policies consistent

Beide bestanden (005 en 006) gebruiken precies dezelfde canvas-join structuur als de nieuwe canvases-policy. `current_tenant_id()` en `current_user_role()` zijn al aangemaakt in 003 dus zijn beschikbaar. Geen probleem.

---

### ⚠️ E — Seed-data in 007 wordt gewijzigd (TAAK 2)

De huidige 007 bevat:
- Tenant 1: `'Platform Admin'`, type `'individual'`
- Tenant 2: `'Kingfisher & Partners'`, type `'consultancy'`
- user_profiles via email-subquery

TAAK 2 vervangt dit door: `'Kees Holding'` + `'Kingfisher'` (beide `'consultancy'`), en user_profiles via hardcoded user_id. Dit is een bewuste wijziging, geen bug.

---

## Samenvatting

| Punt | Status |
|------|--------|
| 1. Alle kolommen in tenants | ✅ Correct |
| 2. FKs en role enum in user_profiles | ✅ Correct |
| 3. SECURITY DEFINER + SET search_path | ✅ Correct, beide functies |
| 4. tenant_id nullable in 004 | ✅ Correct |
| 5. Volgorde orphan DELETE / NOT NULL | ✅ Correct |
| A. Donker venster 004→007 | ⚠️ Voer aaneengesloten uit |
| B. Geen auto-profiel bij nieuwe user signup | ⚠️ Vervolgitem vóór externe gebruikers |
| C. Misleidende toelichting in 005 | ⚠️ Cosmetisch, geen functie-impact |
| D. Consistentie 005/006 policies | ✅ Correct |
| E. Seed-data wordt vervangen (TAAK 2) | ⚠️ Verwacht, geen bug |
