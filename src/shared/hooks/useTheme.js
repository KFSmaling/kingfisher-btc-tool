import { useAuth } from "../services/auth.service";

/**
 * useTheme — ontmantelt tenantTheme uit AuthContext.
 *
 * Geeft logo-URL's, merknaam en kleuren terug met Kingfisher-defaults
 * als fallback. Veilig aan te roepen vóór ThemeProvider de CSS-variabelen
 * heeft gezet (bijv. op het login-scherm of tijdens profileLoading).
 *
 * Gebruik:
 *   const { logoUrl, logoWhiteUrl, brandName } = useTheme();
 *   <img src={logoWhiteUrl} alt={brandName} />
 */
export function useTheme() {
  const { tenantTheme } = useAuth();

  return {
    logoUrl:      tenantTheme?.logo_url       ?? "/kf-logo.png",
    logoWhiteUrl: tenantTheme?.logo_white_url ?? "/kf-logo-white.png",
    brandName:    tenantTheme?.brand_name     ?? "Kingfisher & Partners",
    productName:  tenantTheme?.product_name   ?? "Strategy Platform",
    primaryColor: tenantTheme?.primary_color  ?? "#1a365d",
    accentColor:  tenantTheme?.accent_color   ?? "#8dc63f",
  };
}
