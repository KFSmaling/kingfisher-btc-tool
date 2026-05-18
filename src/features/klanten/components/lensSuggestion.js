/**
 * lensSuggestion — eenvoudige heuristic die een aanbevolen AI-lens voorstelt
 * voor een open pijnpunt.
 *
 * 11.U Block 3 F-retro-1: simple MVP-heuristic (Optie A → upgrade naar simpel-rule-based).
 * Reviewer-instructie regel 67-72 specs:
 *  - `Cluster` indien ≥2 vergelijkbare intents bestaan (basis: dimensie-overlap)
 *  - `Paradox` indien pijnpunt-tekst keywords als "maar", "tegelijkertijd", "moet ook" bevat
 *  - `Positionering` indien dimensie = klantreis of segment
 *  - `Overstijgend` indien geen specifieke dimensie-binding
 *  - Default fallback: `Algemeen`
 */

const PARADOX_KEYWORDS = [
  /\bmaar\b/i,
  /\btegelijk(ertijd)?\b/i,
  /\bmoet ook\b/i,
  /\benerzijds\b/i,
  /\banderzijds\b/i,
  /\bterwijl\b/i,
];

const POSITIONERING_DIMENSIE_ARCHETYPES = ["klantreis", "klantsegment"];

export function suggestLens({ painPoint, intents = [], dimensions = [] } = {}) {
  if (!painPoint) return "algemeen";
  const text = (painPoint.text_md || painPoint.title || "").toString();

  // Paradox-detectie (tekst-pattern) — eerste signaal: krachtigste indicator
  if (PARADOX_KEYWORDS.some(re => re.test(text))) return "paradox";

  // Cluster-detectie: ≥2 vergelijkbare intents in canvas (dimensie-overlap via pijnpunt-coupling)
  // Heuristic: indien painPoint heeft dimension_id en ≥2 intents in canvas met dezelfde
  // dimensie-context via vanuit (jsonb-array van bron-pijnpunten of dim-ids).
  if (painPoint.dimension_id) {
    const sameDimensionIntents = intents.filter(intent =>
      Array.isArray(intent.vanuit) && intent.vanuit.length > 0,
    );
    if (sameDimensionIntents.length >= 2) return "cluster";
  }

  // Positionering: pijnpunt zit aan klantreis- of klantsegment-dimensie
  if (painPoint.dimension_id) {
    const dim = dimensions.find(d => d.id === painPoint.dimension_id);
    if (dim && POSITIONERING_DIMENSIE_ARCHETYPES.includes(dim.archetype)) {
      return "positionering";
    }
  }

  // Overstijgend: pijnpunt zonder specifieke dimensie-binding (cross-cutting)
  if (!painPoint.dimension_id) return "overstijgend";

  // Default
  return "algemeen";
}
