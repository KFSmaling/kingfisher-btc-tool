-- Fix: UNIQUE constraint op canvas_uploads
--
-- PROBLEEM: de oude constraint UNIQUE(user_id, file_name) zorgde ervoor dat een
-- bestand met dezelfde naam op een ander canvas de canvas_id van het origineel
-- overschreef. Gevolg: Het Dossier van canvas A werd leeg na een upload op canvas B.
--
-- OPLOSSING: constraint vervangen door UNIQUE(canvas_id, file_name) zodat
-- hetzelfde bestand per canvas uniek is, maar meerdere canvassen hetzelfde
-- bestandsnaam kunnen hebben.

ALTER TABLE canvas_uploads
  DROP CONSTRAINT IF EXISTS canvas_uploads_user_id_file_name_key;

ALTER TABLE canvas_uploads
  ADD CONSTRAINT canvas_uploads_canvas_id_file_name_key
  UNIQUE (canvas_id, file_name);
