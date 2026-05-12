-- ============================================================
-- Bundle 3 — Functionele gaps & bugs (F21 dimensie-delete labels).
--
-- Scope:
--   F21 — 5 nieuwe labels voor cascade-bevestigingsdialog in DimensieModal.
--   F23/F24/F27 vereisen geen DB-labels (pure code-wijzigingen).
--
-- Tokens {N}/{M} in `tekst`-label worden door frontend ge-replace't met
-- actual item-count + coupling-count.
--
-- Idempotent via ON CONFLICT (tenant_id, key) DO UPDATE SET value=EXCLUDED.value.
-- tenant_id=NULL + tenant_overridable=true.
-- ============================================================

INSERT INTO app_config (key, category, description, value, tenant_id, tenant_overridable) VALUES
  ('label.klanten.dimensie.actie.verwijderen',
   'label',
   'Verwijder-knop links in DimensieModal-footer (edit-mode)',
   'Verwijderen',
   NULL, true),
  ('label.klanten.dimensie.delete.bevestig.titel',
   'label',
   'Titel van cascade-bevestigingsdialog',
   'Dimensie verwijderen?',
   NULL, true),
  ('label.klanten.dimensie.delete.bevestig.tekst',
   'label',
   'Cascade-waarschuwingstekst met {N} items en {M} pijnpunt-koppelingen (frontend-token-replace)',
   'Deze dimensie bevat {N} items en {M} pijnpunt-koppelingen. Bij verwijderen worden items en koppelingen ook weggehaald. Doorgaan?',
   NULL, true),
  ('label.klanten.dimensie.delete.bevestig.actie',
   'label',
   'Bevestig-knop in cascade-dialog',
   'Ja, verwijder',
   NULL, true),
  ('label.klanten.dimensie.delete.bevestig.annuleren',
   'label',
   'Annuleer-knop in cascade-dialog',
   'Annuleren',
   NULL, true)
ON CONFLICT (tenant_id, key) DO UPDATE SET value = EXCLUDED.value;
