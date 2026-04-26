/**
 * WandButton — thin wrapper rond <AiIconButton variant="improve"> voor backwards compat.
 *
 * Behoud van bestaande imports zonder breekje. Nieuwe code gebruikt direct
 * <AiIconButton>. Zie CLAUDE.md sectie 3B voor het canonical patroon.
 *
 * Behoud van bestaande prop-API (onClick, loading, disabled) en de
 * "Magic Staff"-tooltips. Loading toont spinner + "Laden…" tekst.
 */

import AiIconButton from "./AiIconButton";

export default function WandButton({ onClick, loading, disabled }) {
  const tooltip = loading
    ? "Magic Staff is bezig…"
    : disabled
      ? "Verwerk of verwerp het huidige voorstel eerst"
      : "Magic Staff — AI voorstel op basis van geïndexeerde documenten";

  return (
    <AiIconButton
      variant="improve"
      size={12}
      loading={loading}
      disabled={disabled}
      onClick={onClick}
      tooltip={tooltip}
      label={loading ? "Laden…" : undefined}
    />
  );
}
