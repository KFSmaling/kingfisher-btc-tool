-- ============================================================
-- Fix: admin email gecorrigeerd naar iCloud login-adres
-- ============================================================

DROP POLICY IF EXISTS "Admin schrijfrechten" ON app_config;

CREATE POLICY "Admin schrijfrechten"
  ON app_config FOR UPDATE
  TO authenticated
  USING  (auth.email() = 'smaling.kingfisher@icloud.com')
  WITH CHECK (auth.email() = 'smaling.kingfisher@icloud.com');
