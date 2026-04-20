-- Fix v2: drop de juiste constraint-naam op canvas_uploads
--
-- De vorige migration (20260421000000) probeerde 'canvas_uploads_user_id_file_name_key'
-- te droppen, maar de werkelijke naam is 'canvases_user_id_file_name_key'.
-- Door de IF EXISTS deed de DROP stilletjes niets — de oude constraint bleef staan.

ALTER TABLE canvas_uploads
  DROP CONSTRAINT IF EXISTS canvases_user_id_file_name_key;
