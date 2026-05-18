/**
 * ModusToggle — segmented control voor twee-modus-keuzes (bijv.
 * Doorloop / Overzicht in VerbeteractiesView).
 *
 * 11.U Block 2 introductie. Platform-component — herbruikbaar voor andere
 * werkbladen die later een doorloop-pattern krijgen (proces, organisatie, IT).
 *
 * Props:
 *   - value: huidige actieve modus-key (string)
 *   - onChange: (newValue) => void
 *   - options: Array<{ value: string, label: string, ariaLabel?: string }>
 *   - className?: string — extra wrapper-klassen
 *   - testIdPrefix?: string — prefix voor data-testid (default "modus-toggle")
 *
 * Visuele standaard: rounded-pill achtergrond slate-100; actief = wit
 * met accent-tekst; inactief = slate-500 op transparant. Variant op
 * pattern dat in `AppConfig`-admin tabs gebruikt wordt — bewust simpel
 * en niet themed.
 */

import React from "react";

export default function ModusToggle({
  value,
  onChange,
  options = [],
  className = "",
  testIdPrefix = "modus-toggle",
}) {
  if (!options || options.length < 2) return null;
  return (
    <div
      role="tablist"
      aria-label="Modus keuze"
      data-testid={testIdPrefix}
      className={`inline-flex items-center gap-1 rounded-full bg-slate-100 p-1 ${className}`}
    >
      {options.map(opt => {
        const isActive = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={isActive}
            aria-label={opt.ariaLabel || opt.label}
            data-testid={`${testIdPrefix}-option-${opt.value}`}
            onClick={() => !isActive && onChange?.(opt.value)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              isActive
                ? "bg-white text-[var(--color-accent)] shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
