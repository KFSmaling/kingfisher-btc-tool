import { useEffect } from "react";
import { useTheme } from "./useTheme";

/**
 * useDocumentTitle — zet de browser-tab titel op "${brandName} — ${productName}".
 *
 * Reageert automatisch op ThemeProvider: zodra tenantTheme geladen is,
 * wordt de titel bijgewerkt. Fallbacks in useTheme zorgen dat de titel
 * nooit leeg is.
 *
 * Aanroepen in AppInner (binnen AuthProvider + ThemeProvider context).
 */
export function useDocumentTitle() {
  const { brandName, productName } = useTheme();

  useEffect(() => {
    document.title = `${brandName} — ${productName}`;
  }, [brandName, productName]);
}
