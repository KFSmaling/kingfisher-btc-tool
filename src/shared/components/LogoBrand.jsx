/**
 * LogoBrand — toont logo of merknaam afhankelijk van tenant-configuratie.
 *
 * variant="light" → logoWhiteUrl  (gebruik op donkere achtergronden)
 * variant="dark"  → logoUrl       (gebruik op lichte achtergronden)
 *
 * Als de URL null is (tenant heeft geen logo geconfigureerd), valt component
 * terug op de brandName als tekst — zelfde visuele positie, geen broken image.
 *
 * Bruikbaar als class component — veilig te importeren in ErrorBoundary.
 */

import { useState } from "react";
import { useTheme } from "../hooks/useTheme";

export default function LogoBrand({ variant = "light", imgClassName, textClassName }) {
  const { logoUrl, logoWhiteUrl, brandName } = useTheme();
  const [imageFailed, setImageFailed] = useState(false);

  const src = variant === "light" ? logoWhiteUrl : logoUrl;

  if (!src || imageFailed) {
    return (
      <span className={textClassName ?? "text-white font-bold text-lg tracking-wide"}>
        {brandName}
      </span>
    );
  }

  return (
    <img
      src={src}
      alt={brandName}
      className={imgClassName}
      onError={() => setImageFailed(true)}
    />
  );
}
