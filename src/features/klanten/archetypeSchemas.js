/**
 * archetypeSchemas.js — frontend-spiegel van api/klanten/_archetypes.js
 *
 * Bron: RFC-001 §2.2.1.
 * Voor MVP-scope (klantsegment / propositie / kanaal) zijn de velden
 * volledig gevuld met label-keys. Voor de overige zes archetypes is het
 * schema aanwezig zodat ItemModal ze kan renderen wanneer ze later worden
 * geactiveerd.
 *
 * Bij wijziging: ook api/klanten/_archetypes.js bijwerken (server- en
 * client-side validatie moeten matchen).
 */

export const ARCHETYPES = [
  "regio", "klantsegment", "propositie", "kanaal",
  "behoefte", "merk", "gedragspatroon", "klantreis", "anders",
];

// Per archetype: array van { key, labelKey, type } voor formulier-render.
// labelKey = AppConfig-key voor i18n-vrije label-tekst.
// type = "text" of "textarea" — voor MVP allemaal text/textarea (geen
//        gestructureerde validatie, principe 1 "items mogen onaf zijn").
export const ARCHETYPE_SCHEMAS = {
  klantsegment: [
    { key: "omvang",             labelKey: "klanten.veld.klantsegment.omvang",             fallback: "Omvang",             type: "text" },
    { key: "strategisch_belang", labelKey: "klanten.veld.klantsegment.strategisch_belang", fallback: "Strategisch belang", type: "text" },
    { key: "karakteristieken",   labelKey: "klanten.veld.klantsegment.karakteristieken",   fallback: "Karakteristieken",   type: "textarea" },
    { key: "behoeften",          labelKey: "klanten.veld.klantsegment.behoeften",          fallback: "Behoeften",          type: "textarea" },
  ],
  propositie: [
    { key: "differentiatie",      labelKey: "klanten.veld.propositie.differentiatie",      fallback: "Differentiatie",      type: "textarea" },
    { key: "prijsstelling",       labelKey: "klanten.veld.propositie.prijsstelling",       fallback: "Prijsstelling",       type: "text" },
    { key: "levensfase",          labelKey: "klanten.veld.propositie.levensfase",          fallback: "Levensfase",          type: "text" },
    { key: "concurrentiepositie", labelKey: "klanten.veld.propositie.concurrentiepositie", fallback: "Concurrentiepositie", type: "textarea" },
  ],
  kanaal: [
    { key: "type",     labelKey: "klanten.veld.kanaal.type",     fallback: "Type",     type: "text" },
    { key: "bereik",   labelKey: "klanten.veld.kanaal.bereik",   fallback: "Bereik",   type: "textarea" },
    { key: "ervaring", labelKey: "klanten.veld.kanaal.ervaring", fallback: "Ervaring", type: "textarea" },
    { key: "economie", labelKey: "klanten.veld.kanaal.economie", fallback: "Economie", type: "textarea" },
  ],
  // Onderstaande zijn buiten MVP-scope; minimal-stub voor latere uitbreiding.
  regio:          [{ key: "geografie", labelKey: "klanten.veld.regio.geografie", fallback: "Geografie", type: "text" }],
  behoefte:       [{ key: "job_to_be_done", labelKey: "klanten.veld.behoefte.jtbd", fallback: "Job to be done", type: "textarea" }],
  merk:           [{ key: "positionering", labelKey: "klanten.veld.merk.positionering", fallback: "Positionering", type: "textarea" }],
  gedragspatroon: [{ key: "intensiteit", labelKey: "klanten.veld.gedragspatroon.intensiteit", fallback: "Intensiteit", type: "text" }],
  klantreis:      [{ key: "stap_type", labelKey: "klanten.veld.klantreis.stap_type", fallback: "Stap-type", type: "text" }],
  anders:         [{ key: "vrije_velden", labelKey: "klanten.veld.anders.vrije_velden", fallback: "Vrije velden (jsonb, max 4 keys)", type: "textarea" }],
};

export function getSchemaFor(archetype) {
  return ARCHETYPE_SCHEMAS[archetype] || [];
}
