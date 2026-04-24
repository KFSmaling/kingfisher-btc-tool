import { useEffect } from "react";
import { useAuth } from "../services/auth.service";

/**
 * ThemeProvider — injecteert CSS-variabelen op document.documentElement
 * op basis van theme_config van de actieve tenant.
 *
 * Variabelen die worden gezet:
 *   --color-primary     (primaire kleur — header, knoppen, text)
 *   --color-accent      (accent — highlight, active state)
 *   --logo-url          (pad naar donker logo, voor gebruik in img src)
 *   --logo-white-url    (pad naar wit logo, voor gebruik in img src)
 *   --brand-name        (merknaam als string)
 *
 * Bij null of leeg tenantTheme ({}): doet niets — index.css :root defaults
 * blijven actief. Dit vangt ook de database-default theme_config = '{}' op.
 * Ontbrekende keys binnen theme_config worden overgeslagen via if-guards —
 * partiële themes zijn veilig, index.css defaults gelden voor de ontbrekende vars.
 * Wist nooit bestaande variabelen — veilig als theme laadt na render.
 *
 * Geen wrapper-div: geeft children direct terug (geen DOM-impact).
 */
export default function ThemeProvider({ children }) {
  const { tenantTheme } = useAuth();

  useEffect(() => {
    if (!tenantTheme || Object.keys(tenantTheme).length === 0) return;

    const root = document.documentElement;
    const { primary_color, accent_color, logo_url, logo_white_url, brand_name } = tenantTheme;

    if (primary_color)    root.style.setProperty("--color-primary",    primary_color);
    if (accent_color)     root.style.setProperty("--color-accent",      accent_color);
    if (logo_url)         root.style.setProperty("--logo-url",          logo_url);
    if (logo_white_url)   root.style.setProperty("--logo-white-url",    logo_white_url);
    if (brand_name)       root.style.setProperty("--brand-name",        brand_name);
  }, [tenantTheme]);

  return children;
}
