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
    { key: "omvang",             labelKey: "klanten.veld.klantsegment.omvang",             fallback: "Omvang",             type: "text",     placeholder: "Aantal klanten en/of marktaandeel (bv. 1.200 MKB-klanten, ±8% segment)" },
    { key: "strategisch_belang", labelKey: "klanten.veld.klantsegment.strategisch_belang", fallback: "Strategisch belang", type: "text",     placeholder: "Waarom dit segment ertoe doet — groei-motor, marge-leider, defensief" },
    { key: "karakteristieken",   labelKey: "klanten.veld.klantsegment.karakteristieken",   fallback: "Karakteristieken",   type: "textarea", placeholder: "Kenmerken die dit segment uniek maken — sector, omvang, gedrag, demografie" },
    { key: "behoeften",          labelKey: "klanten.veld.klantsegment.behoeften",          fallback: "Behoeften",          type: "textarea", placeholder: "Wat dit segment van jou wil — expliciet én onuitgesproken" },
  ],
  propositie: [
    { key: "differentiatie",      labelKey: "klanten.veld.propositie.differentiatie",      fallback: "Differentiatie",      type: "textarea", placeholder: "Waarin onderscheidt deze propositie zich? Wat doe jij beter dan alternatieven?" },
    { key: "prijsstelling",       labelKey: "klanten.veld.propositie.prijsstelling",       fallback: "Prijsstelling",       type: "text",     placeholder: "Prijsmodel en -niveau (bv. premium, pay-per-use, freemium)" },
    { key: "levensfase",          labelKey: "klanten.veld.propositie.levensfase",          fallback: "Levensfase",          type: "text",     placeholder: "Lanceer / Groei / Volwassen / Phase-out" },
    { key: "concurrentiepositie", labelKey: "klanten.veld.propositie.concurrentiepositie", fallback: "Concurrentiepositie", type: "textarea", placeholder: "Wie zijn de concurrenten en wat is je relatieve positie?" },
  ],
  kanaal: [
    { key: "type",     labelKey: "klanten.veld.kanaal.type",     fallback: "Type",     type: "text",     placeholder: "Direct / Indirect / Hybride — of specifieker (eigen advies, broker, digitaal portaal)" },
    { key: "bereik",   labelKey: "klanten.veld.kanaal.bereik",   fallback: "Bereik",   type: "textarea", placeholder: "Welk deel van de doelgroep bereik je via dit kanaal?" },
    { key: "ervaring", labelKey: "klanten.veld.kanaal.ervaring", fallback: "Ervaring", type: "textarea", placeholder: "Hoe ervaart de klant het kanaal — friction-punten en sterke punten" },
    { key: "economie", labelKey: "klanten.veld.kanaal.economie", fallback: "Economie", type: "textarea", placeholder: "Cost-to-serve en marge per kanaal (bv. hoog volume, lage marge)" },
  ],
  // Stap 11.I.1 — 5 lichte archetypes uitgewerkt. Klantreis blijft minimal-
  // stub (komt 11.I.2 met is_ordered-UI + DMU + insurance-overlay).
  // Veld-volgorde: betekenisvol (RFC-001 §2.2.1) i.p.v. alfabetisch.
  regio: [
    { key: "geografie",        labelKey: "klanten.veld.regio.geografie",        fallback: "Geografie",        type: "text",     placeholder: "Land / regio / markt (bv. Benelux, Noord-Europa, Randstad)" },
    { key: "marktgrootte",     labelKey: "klanten.veld.regio.marktgrootte",     fallback: "Marktgrootte",     type: "text",     placeholder: "Omvang van de relevante markt in deze regio" },
    { key: "lokale_kenmerken", labelKey: "klanten.veld.regio.lokale_kenmerken", fallback: "Lokale kenmerken", type: "textarea", placeholder: "Wetgeving, cultuur, concurrentie, distributie-eigenheden" },
  ],
  // behoefte = jobs-to-be-done-frame (ADR-003 §C). job_to_be_done eerst,
  // dan context (waarin/wanneer), dan bestaande oplossingen, dan frustraties.
  behoefte: [
    { key: "job_to_be_done",        labelKey: "klanten.veld.behoefte.job_to_be_done",        fallback: "Job to be done",        type: "textarea", placeholder: "Welke taak wil de klant uitvoeren? (bv. \"mijn gezin financieel beschermen tegen onvoorziene gebeurtenissen\")" },
    { key: "context",               labelKey: "klanten.veld.behoefte.context",               fallback: "Context",               type: "textarea", placeholder: "Wanneer en waarin speelt deze behoefte? (life events, jaarwisseling, na schade)" },
    { key: "bestaande_oplossingen", labelKey: "klanten.veld.behoefte.bestaande_oplossingen", fallback: "Bestaande oplossingen", type: "text",     placeholder: "Hoe lost de klant dit nu op — bij jou, concurrent, of zelf?" },
    { key: "frustraties",           labelKey: "klanten.veld.behoefte.frustraties",           fallback: "Frustraties",           type: "textarea", placeholder: "Wat werkt niet aan huidige oplossingen?" },
  ],
  merk: [
    { key: "positionering",             labelKey: "klanten.veld.merk.positionering",             fallback: "Positionering",             type: "textarea", placeholder: "Hoe positioneert het merk zich (premium, betrouwbaar, innovatief)" },
    { key: "belofte",                   labelKey: "klanten.veld.merk.belofte",                   fallback: "Belofte",                   type: "textarea", placeholder: "Wat belooft het merk de klant?" },
    { key: "doelgroep",                 labelKey: "klanten.veld.merk.doelgroep",                 fallback: "Doelgroep",                 type: "text",     placeholder: "Voor wie is dit merk in de eerste plaats bedoeld?" },
    { key: "relatie_tot_andere_merken", labelKey: "klanten.veld.merk.relatie_tot_andere_merken", fallback: "Relatie tot andere merken", type: "textarea", placeholder: "Hoofdmerk, sub-merk, endorsement-relatie?" },
  ],
  gedragspatroon: [
    { key: "intensiteit",            labelKey: "klanten.veld.gedragspatroon.intensiteit",            fallback: "Intensiteit",            type: "text",     placeholder: "Hoe vaak interactie? (dagelijks, jaarlijks, eens per life event)" },
    { key: "loyaliteit",             labelKey: "klanten.veld.gedragspatroon.loyaliteit",             fallback: "Loyaliteit",             type: "text",     placeholder: "Wisselgedrag, churn-rate, NPS-indicatie" },
    { key: "koopgedrag",             labelKey: "klanten.veld.gedragspatroon.koopgedrag",             fallback: "Koopgedrag",             type: "textarea", placeholder: "Hoe maakt deze klant beslissingen — prijs, advies, gemak?" },
    { key: "digitale_volwassenheid", labelKey: "klanten.veld.gedragspatroon.digitale_volwassenheid", fallback: "Digitale volwassenheid", type: "text",     placeholder: "Self-service / hybride / volledig persoonlijk" },
  ],
  // Stap 11.I.1: `anders.vrije_velden` jsonb met max 4 keys. UI rendert
  // 4 key+value-paren-formulier via CustomPairsField. Save filtert lege
  // paren; server-validatie blokkeert >4 keys (RFC-001 §2.2.1 + _archetypes.js).
  anders: [
    { key: "vrije_velden", labelKey: "klanten.veld.anders.vrije_velden", fallback: "Eigen velden (max 4)", type: "custom_pairs", placeholder: { key: "Veldnaam (bv. \"Cultuur\")", value: "Waarde of beschrijving" } },
  ],
  // Stap 11.I.2 — klantreis Scope A volledig uitgewerkt. 12 velden in 3
  // visuele blokken (Wat / Hoe / Strategisch). 80/20-denkdwang = MoT +
  // Silent Period + weight_multiplier (asymmetrie-erkenning) — UI rendert
  // deze drie in een eigen "Strategische weging"-blok met visual emphasis.
  //
  // Schema-properties (uitbreidingen op base { key, labelKey, fallback, type }):
  //   - enumKey:        voor type=dropdown — app_config-key met jsonb-array van opties
  //   - conditionalOn:  veld-key; render alleen wanneer archetypeData[that] === true
  //   - denkdwang:      "asymmetrie" | "trade-off" | "onderscheiding" | "intentionaliteit"
  //                     (markeert design-principe-veld voor visual emphasis)
  //   - visualEmphasis: "prominent" → ItemModal-renderer past extra styling toe
  //   - defaultValue:   initial waarde bij create-mode
  //   - helperKey:      app_config-key met uitleg-tekst onder veld-label
  klantreis: [
    // ── Wat — kern-identiteit van de stage ──────────────────────────────────
    { key: "stap_type",     labelKey: "klanten.veld.klantreis.stap_type",     fallback: "Stap-type",          type: "dropdown", enumKey: "klanten.klantreis.stap_type", enumLabelPrefix: "klanten.klantreis.stap_type.", placeholder: "Selecteer een stage" },
    { key: "customer_goal", labelKey: "klanten.veld.klantreis.customer_goal", fallback: "Doel van de klant", type: "textarea", placeholder: "Wat wil de klant in deze fase bereiken? (bv. \"inzicht in dekking\", \"snel polis afsluiten\")" },
    // ── Hoe — touchpoints, betrokkenen, signalen ────────────────────────────
    { key: "touchpoints", labelKey: "klanten.veld.klantreis.touchpoints", fallback: "Touchpoints",                 type: "tag_list", placeholder: "Voeg touchpoint toe (bv. \"app\", \"callcenter\", \"tussenpersoon\")" },
    { key: "dmu",         labelKey: "klanten.veld.klantreis.dmu",         fallback: "DMU (Decision Making Unit)", type: "tag_list", helperKey: "klanten.veld.klantreis.dmu.helper", placeholder: "Voeg betrokkene toe (bv. \"klant\", \"partner\", \"adviseur\")" },
    { key: "emotions",    labelKey: "klanten.veld.klantreis.emotions",    fallback: "Klant-emoties",               type: "tag_list", placeholder: "Voeg emotie toe (bv. \"onzeker\", \"gerustgesteld\", \"gefrustreerd\")" },
    { key: "kpis",        labelKey: "klanten.veld.klantreis.kpis",        fallback: "KPI's",                       type: "tag_list", placeholder: "Voeg KPI toe (bv. \"CSAT\", \"doorlooptijd\", \"conversion rate\")" },
    // ── Strategisch — 80/20-denkdwang asymmetrie + insight ──────────────────
    { key: "is_moment_of_truth", labelKey: "klanten.veld.klantreis.is_moment_of_truth", fallback: "Moment of Truth?", type: "boolean", denkdwang: "asymmetrie", visualEmphasis: "prominent", group: "strategische_weging" },
    { key: "is_silent_period",   labelKey: "klanten.veld.klantreis.is_silent_period",   fallback: "Silent period?",   type: "boolean", denkdwang: "asymmetrie", visualEmphasis: "prominent", group: "strategische_weging" },
    { key: "weight_multiplier",  labelKey: "klanten.veld.klantreis.weight_multiplier",  fallback: "Weging (1.0-3.0)", type: "numeric", defaultValue: 1.0, step: 0.1, min: 0.5, max: 5.0, helperKey: "klanten.veld.klantreis.weight_multiplier.helper", group: "strategische_weging" },
    { key: "silent_period_risk",  labelKey: "klanten.veld.klantreis.silent_period_risk",  fallback: "Risico in silent period",                  type: "textarea", conditionalOn: "is_silent_period", placeholder: "Wat kan er mis gaan in deze stille fase? (churn naar concurrent, missen retentie-moment)" },
    { key: "regulatoire_context", labelKey: "klanten.veld.klantreis.regulatoire_context", fallback: "Regulatoire context (Wft/IDD/zorgplicht)", type: "textarea", placeholder: "Welke wet- of regelgeving raakt deze stap? (Wft-zorgplicht, IDD, GDPR)" },
    { key: "insight",             labelKey: "klanten.veld.klantreis.insight",             fallback: "Strategisch inzicht",                       type: "textarea", placeholder: "Strategisch inzicht over deze stap — wat moet veranderen, wat is uniek?" },
  ],
};

export function getSchemaFor(archetype) {
  return ARCHETYPE_SCHEMAS[archetype] || [];
}
