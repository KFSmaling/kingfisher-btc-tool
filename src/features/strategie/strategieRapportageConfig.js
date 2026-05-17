/**
 * strategieRapportageConfig.js — werkblad-specifieke config voor OnepagerBuilder.
 *
 * RFC-008 §C — Strategie-specifieke injectie van vasteBlokken / modelLib /
 * dataResolver in shared/OnepagerBuilder. Andere werkbladen
 * (Klanten/Processen/Richtlijnen) krijgen hun eigen *RapportageConfig.js
 * bij replicatie (RFC-008 §D).
 *
 * Block 3 scope:
 *   - vasteBlokken: 3 (Identiteits-band / KPI-strip / Strategische thema's)
 *   - modelLib: 3 groepen / 8 modellen (alleen SWOT + Kernwaarden conditioneel
 *     enabled; rest disabled met "komt in fase 2"-reason — designer-spec)
 *   - dataResolver: completeness-check per blok-id (designer-spec
 *     rapportage-spec.md §3 regel 112-119)
 *
 * Block 4 vult dataResolver uit met echte data-mapping per model + payload-shape
 * voor StrategyOnePager v2-render.
 *
 * Labels: model-namen + disabled-reasons komen uit DB via appLabel (zie
 * migratie `20260518000400_seed_labels_onepager_builder_rfc008_11s_block3.sql`).
 * Fallback-strings in deze file zijn pragmatisch; DB-waarden winnen.
 */

/**
 * Bouwt de OnepagerBuilder-config voor Strategie-werkblad.
 *
 * @param {object} args
 * @param {object} args.strategyCore — { missie, visie, ambitie, kernwaarden[], samenvatting }
 * @param {Array}  args.themas       — strategic_themes met ksf_kpi[]
 * @param {Array}  args.analysisItems — analysis_items array
 * @param {function} args.appLabel   — config-resolver (k, fb) => string
 * @returns {object} config { vasteBlokken, modelLib, dataResolver }
 */
export function buildStrategieRapportageConfig({
  strategyCore = {},
  themas = [],
  analysisItems = [],
  appLabel,
}) {
  const lbl = (k, fb) => (appLabel ? appLabel(k, fb) : fb);

  const kernwaardenCount = Array.isArray(strategyCore?.kernwaarden) ? strategyCore.kernwaarden.length : 0;
  const themasCount      = Array.isArray(themas) ? themas.length : 0;
  const analysisCount    = Array.isArray(analysisItems) ? analysisItems.length : 0;

  // KPI-strip telt KPI's verdeeld over alle thema's (designer-spec: top 4
  // auto-pickt — Block 4 implementeert prioritering, Block 3 toont totaal).
  const kpiCount = (Array.isArray(themas) ? themas : []).reduce((sum, t) => {
    const ksfKpi = Array.isArray(t?.ksf_kpi) ? t.ksf_kpi : [];
    return sum + ksfKpi.filter(x => x.type === "kpi").length;
  }, 0);

  return {
    // ── Vaste blokken (RFC-008 §11 rij 12) ────────────────────────────────
    vasteBlokken: [
      {
        id: "identiteit",
        label: lbl("strategie.onepager.vast.identiteit.label", "Identiteits-band"),
        sub_label: lbl("strategie.onepager.vast.identiteit.sub", "Missie · Visie · Ambitie · Kernwaarden"),
      },
      {
        id: "kpi-strip",
        label: lbl("strategie.onepager.vast.kpi.label", "KPI-strip"),
        sub_label: lbl("strategie.onepager.vast.kpi.sub", "Top 4 KPI's auto-geselecteerd"),
      },
      {
        id: "themas",
        label: lbl("strategie.onepager.vast.themas.label", "Strategische thema's"),
        sub_label: `${themasCount} ${lbl("strategie.onepager.vast.themas.sub_suffix", "thema's")}`,
      },
    ],

    // ── Configureerbare modellen ──────────────────────────────────────────
    modelLib: [
      {
        id: "strategische-analyse",
        label: lbl("strategie.onepager.group.analyse.label", "Strategische analyse"),
        models: [
          {
            id: "swot",
            label: lbl("strategie.model.swot", "SWOT-analyse"),
            enabled: analysisCount > 0,
            disabled_reason: analysisCount === 0
              ? lbl("strategie.model.swot.disabled_reason", "Vul de SWOT-tabbladen in onder Strategie → Analyse.")
              : null,
          },
          {
            id: "porter-5-forces",
            label: lbl("strategie.model.porter", "Porter 5 Forces"),
            enabled: false,
            disabled_reason: lbl("strategie.model.porter.disabled_reason", "Geen sector-analyse-velden in werkblad — komt in fase 2"),
          },
          {
            id: "pestel",
            label: lbl("strategie.model.pestel", "PESTEL"),
            enabled: false,
            disabled_reason: lbl("strategie.model.pestel.disabled_reason", "Geen macro-analyse-velden in werkblad — komt in fase 2"),
          },
          {
            id: "mckinsey-7s",
            label: lbl("strategie.model.mckinsey7s", "McKinsey 7S"),
            enabled: false,
            disabled_reason: lbl("strategie.model.mckinsey7s.disabled_reason", "Geen interne-factoren-velden in werkblad — komt in fase 2"),
          },
        ],
      },
      {
        id: "positionering",
        label: lbl("strategie.onepager.group.positionering.label", "Positionering"),
        models: [
          {
            id: "ansoff",
            label: lbl("strategie.model.ansoff", "Ansoff-matrix"),
            enabled: false,
            disabled_reason: lbl("strategie.model.ansoff.disabled_reason", "Geen groeirichting-velden in werkblad — komt in fase 2"),
          },
          {
            id: "value-chain",
            label: lbl("strategie.model.valuechain", "Value Chain"),
            enabled: false,
            disabled_reason: lbl("strategie.model.valuechain.disabled_reason", "Geen waardeketen-velden in werkblad — komt in fase 2"),
          },
        ],
      },
      {
        id: "doelen-verschuiving",
        label: lbl("strategie.onepager.group.doelen.label", "Doelen & verschuiving"),
        models: [
          {
            id: "van-naar",
            label: lbl("strategie.model.vannaar", "Van → Naar tabel"),
            enabled: false,
            disabled_reason: lbl("strategie.model.vannaar.disabled_reason", "Geen verschuiving-velden in werkblad — komt in fase 2"),
          },
          {
            id: "kernwaarden",
            label: lbl("strategie.model.kernwaardenbord", "Kernwaarden-bord"),
            enabled: kernwaardenCount > 0,
            disabled_reason: kernwaardenCount === 0
              ? lbl("strategie.model.kernwaardenbord.disabled_reason", "Voeg eerst minstens één kernwaarde toe onder Identiteit.")
              : null,
          },
        ],
      },
    ],

    // ── Data-completeness + payload (Block 4 v2 vult `data` per blok) ────
    // Returnt per blok-id { ready: bool, completeness_msg?: string, text?: ..., data?: ... }
    // StrategyOnePager v2 leest `data` per render-blok.
    dataResolver: (blokId) => {
      switch (blokId) {
        case "identiteit": {
          const ready = !!(strategyCore?.missie && strategyCore?.visie && strategyCore?.ambitie);
          return {
            ready,
            completeness_msg: ready ? null : lbl(
              "onepager.preview.fallback.identiteit",
              "Vul Missie, Visie en Ambitie eerst in onder Strategie-werkblad → Identiteit."
            ),
            data: {
              missie:       strategyCore?.missie || null,
              visie:        strategyCore?.visie || null,
              ambitie:      strategyCore?.ambitie || null,
              kernwaarden:  Array.isArray(strategyCore?.kernwaarden) ? strategyCore.kernwaarden : [],
            },
          };
        }
        case "kpi-strip": {
          // Auto-pick eerste KPI per thema in sort_order (instructie §1.5).
          const sortedThemas = [...themas].sort((a, b) => (a?.sort_order ?? 0) - (b?.sort_order ?? 0));
          const topKpis = sortedThemas
            .map(t => {
              const ksfKpi = Array.isArray(t?.ksf_kpi) ? t.ksf_kpi : [];
              const themaKpis = ksfKpi
                .filter(k => k.type === "kpi")
                .sort((a, b) => (a?.sort_order ?? 0) - (b?.sort_order ?? 0));
              if (themaKpis.length === 0) return null;
              // Verrijk met thema-code + thema-titel voor render
              const themaIdx = sortedThemas.indexOf(t);
              return {
                ...themaKpis[0],
                _themaCode: `T${themaIdx + 1}`,
                _themaTitle: t.title || t.titel || "",
                isFallback: false,
              };
            })
            .filter(Boolean)
            .slice(0, 4);

          // Fallback bij <4 KPI's: BHAG (numeriek uit ambitie) + Horizon.
          if (topKpis.length < 4) {
            const ambitieText = strategyCore?.ambitie ?? "";
            const numMatch = typeof ambitieText === "string" ? ambitieText.match(/[\d.,]+/) : null;
            if (numMatch && topKpis.length < 4) {
              topKpis.push({
                id: "bhag-fallback",
                description: lbl("strategie.onepager.kpi.bhag_fallback.label", "BHAG"),
                target_value: numMatch[0],
                current_value: null,
                _themaCode: "BHAG",
                _themaTitle: lbl("strategie.onepager.kpi.bhag_fallback.label", "BHAG"),
                isFallback: true,
              });
            }
            while (topKpis.length < 4) {
              topKpis.push({
                id: `horizon-fallback-${topKpis.length}`,
                description: lbl("strategie.onepager.kpi.horizon_fallback.label", "Horizon"),
                target_value: lbl("strategie.onepager.kpi.horizon_fallback.target", "5 jaar"),
                current_value: null,
                _themaCode: "H",
                _themaTitle: lbl("strategie.onepager.kpi.horizon_fallback.label", "Horizon"),
                isFallback: true,
              });
            }
          }

          return {
            ready: topKpis.length > 0,
            completeness_msg: topKpis.length === 0 ? lbl(
              "onepager.preview.fallback.kpi",
              "Voeg minstens 4 KPI's toe verdeeld over de thema's voor een complete strip."
            ) : null,
            data: { kpis: topKpis.slice(0, 4) },
          };
        }
        case "themas": {
          const ready = themasCount > 0;
          // Verrijk themas met code (T1..Tn) op basis van sort_order.
          const sortedThemas = [...themas]
            .sort((a, b) => (a?.sort_order ?? 0) - (b?.sort_order ?? 0))
            .map((t, idx) => ({ ...t, _code: `T${idx + 1}` }));
          return {
            ready,
            completeness_msg: ready ? null : lbl(
              "onepager.preview.fallback.themas",
              "Geen strategische thema's gedefinieerd — voeg eerst minstens één thema toe."
            ),
            data: { themas: sortedThemas },
          };
        }
        case "swot": {
          const ready = analysisCount > 0;
          // Designer-spec: 2×2 quadranten gevuld uit analysis_items op (type, tag).
          // Defensive op variant tag-namen ("sterk"/"sterkte", "zwak"/"zwakte" etc).
          const items = Array.isArray(analysisItems) ? analysisItems : [];
          const matchTag = (it, expected) => {
            const tag = (it?.tag || "").toLowerCase();
            return expected.some(e => tag === e || tag.startsWith(e));
          };
          return {
            ready,
            completeness_msg: ready ? null : lbl(
              "strategie.model.swot.disabled_reason",
              "Vul de SWOT-tabbladen in onder Strategie → Analyse."
            ),
            data: {
              sterkten:     items.filter(i => i.type === "intern" && matchTag(i, ["sterk", "sterkte"])),
              zwakten:      items.filter(i => i.type === "intern" && matchTag(i, ["zwak", "zwakte"])),
              kansen:       items.filter(i => i.type === "extern" && matchTag(i, ["kans"])),
              bedreigingen: items.filter(i => i.type === "extern" && matchTag(i, ["bedreig"])),
            },
          };
        }
        case "kernwaarden": {
          const kernwaarden = Array.isArray(strategyCore?.kernwaarden) ? strategyCore.kernwaarden : [];
          const ready = kernwaarden.length > 0;
          return {
            ready,
            completeness_msg: ready ? null : lbl(
              "strategie.model.kernwaardenbord.disabled_reason",
              "Voeg eerst minstens één kernwaarde toe onder Identiteit."
            ),
            data: { kernwaarden },
          };
        }
        case "samenvatting": {
          const ready = !!strategyCore?.samenvatting;
          return {
            ready,
            text: ready ? strategyCore.samenvatting : null,
            completeness_msg: ready ? null : lbl(
              "onepager.preview.fallback.samenvatting",
              "Strategische samenvatting nog niet gegenereerd. → Genereer in werkblad."
            ),
            data: { samenvatting: strategyCore?.samenvatting || null },
          };
        }
        default:
          return { ready: true, data: null };
      }
    },
  };
}
