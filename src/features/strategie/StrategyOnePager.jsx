/**
 * StrategyOnePager v2 — werkblad-specifieke A4-landscape-layout voor Strategie.
 *
 * 11.S Block 4 — vervangt v1 volledig (v1 in git-history beschikbaar via blame).
 * Geïnjecteerd in shared/A4Preview via `LayoutComponent`-prop (OnepagerBuilder).
 *
 * RFC-008 §F + designer-spec
 * `platform/design/prototypes/2026-05-17-strategie-onepager-v2/`:
 *   - data-mapping.md autoritatief voor blok-content
 *   - screenshots/overview.png + 01-artboard.png voor visuele referentie
 *
 * Layout (top→bottom in 1190 × 842 px frame):
 *   1. Brand-strip (50px dark bg + accent-line)
 *   2. Titel-block (eyebrow + H1 samenvatting)
 *   3. Identiteits-band (3-kolom Missie/Visie/Ambitie+Kernwaarden)
 *   4. KPI-strip (4-kolom mono-waarden, fallback BHAG+Horizon)
 *   5. Strategische thema's (responsief 4 of N-kolommen)
 *   6. Body-zone (selectie-modellen + AI-aandachtspunten naast/onder)
 *   7. Footer (vertrouwelijk-strip + paginanummer)
 *
 * Font-stack (lokaal via StrategyOnePagerFonts.css):
 *   - InterStrategy (body)
 *   - SourceSerifStrategy (display, H1 + Ambitie)
 *   - JetBrainsStrategy (mono, KPI-waarden + source-tags)
 *
 * Source-tags (`.strategie-onepager-source-tag`) tonen DB-bron per kolom in
 * builder-preview als debug-affordance. Verborgen in print via PrintStyles.css.
 */

import React from "react";
import "./StrategyOnePagerFonts.css";

// ── Brand-strip top ──────────────────────────────────────────────────────────
function BrandStrip({ tenantBrand, appLabel }) {
  const lbl = (k, fb) => (appLabel ? appLabel(k, fb) : fb);
  return (
    <>
      <header
        data-testid="strategie-onepager-brand-strip"
        className="flex items-center justify-between px-6"
        style={{
          height: 50,
          background: "var(--color-primary)",
          color: "white",
        }}
      >
        <div className="flex items-center gap-3">
          <span className="text-[14px] font-semibold tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
            {tenantBrand || lbl("strategie.onepager.brand.fallback", "Platform")}
          </span>
          <span className="text-[9px] uppercase tracking-[0.18em] opacity-70">
            {lbl("strategie.onepager.brand.kicker", "Business Transformation Canvas")}
          </span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-[9px] uppercase tracking-[0.18em] opacity-70">
            {lbl("strategie.onepager.werkblad.label", "WERKBLAD")}
          </span>
          <span className="text-[11px] font-semibold uppercase tracking-[0.14em]">
            {lbl("strategie.onepager.werkblad.naam", "STRATEGIE")}
          </span>
        </div>
      </header>
      <div style={{ height: 2, background: "var(--color-accent)" }} aria-hidden="true" />
    </>
  );
}

// ── Titel-block ──────────────────────────────────────────────────────────────
// 11.S-retro-3 (Kees-keuze 18 mei): H1 is nu een vaste-titel ("Samenvatting
// Strategie") i.p.v. de samenvatting-tekst zelf. Bespaart vertikale ruimte;
// samenvatting blijft zichtbaar in werkblad-Stip-op-de-Horizon. dataResolver
// blijft `samenvatting`-data leveren voor toekomstige PPT-export fase 2.
function TitelBlock({ canvasName, tenantBrand, appLabel }) {
  const lbl = (k, fb) => (appLabel ? appLabel(k, fb) : fb);
  return (
    <section data-testid="strategie-onepager-titel-block" className="px-6 pt-3 pb-3">
      <p
        className="text-[9px] font-semibold uppercase tracking-[0.18em] mb-1"
        style={{ color: "var(--color-accent)" }}
      >
        {lbl("strategie.onepager.titel.eyebrow", "STRATEGIE · EXECUTIVE SUMMARY")}
      </p>
      <div className="flex items-start justify-between gap-6">
        <h1
          data-testid="strategie-onepager-h1"
          className="flex-1 leading-tight m-0"
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 26,
            fontWeight: 600,
            color: "var(--color-primary)",
            letterSpacing: "-0.01em",
          }}
        >
          {lbl("strategie.onepager.titel.h1", "Samenvatting Strategie")}
        </h1>
        {(canvasName || tenantBrand) && (
          <div className="text-right flex-shrink-0">
            {canvasName && (
              <div className="text-[11px] font-medium text-slate-700">{canvasName}</div>
            )}
            {tenantBrand && (
              <div className="text-[9px] uppercase tracking-[0.12em] text-slate-500 mt-0.5">{tenantBrand}</div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

// ── Source-tag (debug-only, hidden in print) ─────────────────────────────────
function SourceTag({ name }) {
  return (
    <span
      className="strategie-onepager-source-tag"
      style={{
        fontFamily: "var(--font-mono)",
        fontSize: 7,
        color: "#cbd5e1",
        letterSpacing: "0.02em",
      }}
    >
      {name}
    </span>
  );
}

// ── Identiteits-band ─────────────────────────────────────────────────────────
// 11.S-retro-3 (Kees 18 mei): Kernwaarden-render hier VERWIJDERD (Fix 3) —
// duplicatie-fix. Kernwaarden blijven beschikbaar via Kernwaarden-bord-model
// in body-zone (consultant-keuze via ModelLibrary). dataResolver-API
// onveranderd (data.kernwaarden blijft beschikbaar voor andere consumers).
//
// Tegelijk: `minHeight: 90` per kolom verwijderd → `min-h-auto`-gedrag,
// band wraps natuurlijk bij lange content. Content-aware page-split via
// computePages heuristic op `identityContentLength` regelt overflow naar
// page 2 wanneer cumulatieve missie+visie+ambitie > IDENTITY_SPLIT_THRESHOLD.
function IdentiteitsBand({ data, appLabel }) {
  const lbl = (k, fb) => (appLabel ? appLabel(k, fb) : fb);
  const missie  = data?.missie;
  const visie   = data?.visie;
  const ambitie = data?.ambitie;

  const Kolom = ({ label, source, value, fallback }) => (
    <div className="flex flex-col">
      <div className="flex items-baseline justify-between mb-1">
        <span className="text-[8px] font-semibold uppercase tracking-[0.16em] text-slate-500">
          {label}
        </span>
        <SourceTag name={source} />
      </div>
      <p
        className="m-0 leading-snug"
        style={{
          fontFamily: "var(--font-body)",
          fontSize: 10.5,
          color: value ? "var(--color-primary)" : "#94a3b8",
        }}
      >
        {value || fallback}
      </p>
    </div>
  );

  return (
    <section
      data-testid="strategie-onepager-identiteit-band"
      className="px-6 pb-2"
    >
      <div
        className="grid gap-4 p-3 rounded"
        style={{
          gridTemplateColumns: "1fr 1fr 1.1fr",
          background: "#FAF8F2",
          borderLeft: "3px solid var(--color-accent)",
        }}
      >
        <Kolom
          label={lbl("strategie.onepager.identiteit.missie.label", "MISSIE")}
          source="strategy_core.missie"
          value={missie}
          fallback={lbl("strategie.onepager.identiteit.missie.fallback", "Missie nog niet ingevuld")}
        />
        <Kolom
          label={lbl("strategie.onepager.identiteit.visie.label", "VISIE")}
          source="strategy_core.visie"
          value={visie}
          fallback={lbl("strategie.onepager.identiteit.visie.fallback", "Visie nog niet ingevuld")}
        />
        <div className="flex flex-col">
          <div className="flex items-baseline justify-between mb-1">
            <span className="text-[8px] font-semibold uppercase tracking-[0.16em] text-slate-500">
              {lbl("strategie.onepager.identiteit.ambitie.label", "AMBITIE")}
            </span>
            <SourceTag name="strategy_core.ambitie" />
          </div>
          <span
            className="text-[8px] font-bold uppercase tracking-[0.18em] mb-1"
            style={{ color: "var(--color-accent)" }}
          >
            {lbl("strategie.onepager.identiteit.ambitie.eyebrow", "BHAG")}
          </span>
          <p
            className="m-0 leading-snug"
            style={{
              fontFamily: "var(--font-display)",
              fontStyle: "italic",
              fontSize: 12,
              color: ambitie ? "var(--color-primary)" : "#94a3b8",
            }}
          >
            {ambitie || lbl("strategie.onepager.identiteit.ambitie.fallback", "Ambitie nog niet ingevuld")}
          </p>
        </div>
      </div>
    </section>
  );
}

// ── KPI-strip ────────────────────────────────────────────────────────────────
function KpiStrip({ data, appLabel }) {
  const kpis = Array.isArray(data?.kpis) ? data.kpis : [];
  return (
    <section data-testid="strategie-onepager-kpi-strip" className="px-6 pb-2">
      <div className="grid grid-cols-4 gap-3">
        {kpis.map((kpi, idx) => (
          <div
            key={kpi.id || idx}
            data-testid={`strategie-onepager-kpi-cell-${idx}`}
            data-fallback={kpi.isFallback ? "true" : "false"}
            className="p-2 rounded border"
            style={{
              borderColor: kpi.isFallback ? "#e2e8f0" : "var(--color-primary)",
              background: kpi.isFallback ? "#f8fafc" : "white",
            }}
          >
            <p className="text-[8px] font-bold uppercase tracking-[0.14em] text-slate-500 mb-0.5">
              {kpi._themaCode}{kpi._themaTitle && kpi._themaCode !== kpi._themaTitle ? ` · ${kpi._themaTitle}` : ""}
            </p>
            <p
              className="m-0 leading-none"
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 16,
                fontWeight: 500,
                color: "var(--color-primary)",
              }}
            >
              {kpi.target_value || "—"}
            </p>
            <p
              className="m-0 text-[9px] text-slate-500 mt-0.5"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              {kpi.current_value
                ? `nu ${kpi.current_value} → ${kpi.target_value || "?"}`
                : kpi.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

// ── Strategische thema's ─────────────────────────────────────────────────────
function ThemasGrid({ data, appLabel }) {
  const lbl = (k, fb) => (appLabel ? appLabel(k, fb) : fb);
  const themas = Array.isArray(data?.themas) ? data.themas : [];

  if (themas.length === 0) {
    return (
      <section
        data-testid="strategie-onepager-themas-empty"
        className="px-6 pb-2"
      >
        <p className="text-[10px] italic text-amber-700 p-2 bg-amber-50 border border-amber-200 rounded">
          {lbl("strategie.onepager.themas.fallback", "Geen strategische thema's gedefinieerd — voeg eerst toe")}
        </p>
      </section>
    );
  }

  // 11.S-retro-2 Fix 1 (5e thema niet zichtbaar): vroeger `repeat(${themas.length}, 1fr)` waardoor
  // 5-of-meer-kolomgrid kaarten te smal werden EN min-width-auto van grid-cells leidde tot horizontale
  // overflow → A4Page `overflow-hidden` clipte 5e kolom. Oplossing: max 4 cols, browser wrap naar 2e
  // rij voor thema's > 4. Plus expliciete `min-w-0` op kaart voor truncate-safety bij lange titels.
  const cols = Math.min(themas.length, 4);

  return (
    <section data-testid="strategie-onepager-themas-grid" className="px-6 pb-2">
      <p className="text-[8px] font-bold uppercase tracking-[0.18em] text-slate-500 mb-1.5">
        {lbl("strategie.onepager.themas.titel", "01 · STRATEGISCHE THEMA'S · KSF & KPI")}
      </p>
      <div
        className="grid gap-2"
        style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
      >
        {/* DB-CHECK garandeert max 7 thema's (RFC-001) — `slice(0, 7)` is defensive,
            niet truncation-of-input. 11.S-retro-2: KSFs + KPIs NIET meer slicen
            (oude `compact ? slice(0, 1) : ksfs` viel onder "structurele input mag
            niet weggevallen"-principe). Alle KSFs + KPIs renderen per thema. */}
        {themas.slice(0, 7).map((thema) => {
          const ksfKpi = Array.isArray(thema.ksf_kpi) ? thema.ksf_kpi : [];
          const ksfs = ksfKpi.filter(k => k.type === "ksf").sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
          const kpis = ksfKpi.filter(k => k.type === "kpi").sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
          return (
            <div
              key={thema.id || thema._code}
              data-testid={`strategie-onepager-thema-${thema._code}`}
              className="p-2 rounded border border-slate-200 bg-white flex flex-col min-w-0"
            >
              <div className="flex items-baseline gap-1.5 mb-1 min-w-0">
                <span
                  className="text-[8px] font-bold uppercase tracking-[0.14em] flex-shrink-0"
                  style={{ color: "var(--color-accent)", fontFamily: "var(--font-mono)" }}
                >
                  {thema._code}
                </span>
                <span className="text-[10px] font-semibold text-[var(--color-primary)] leading-tight truncate min-w-0">
                  {thema.title || thema.titel || ""}
                </span>
              </div>
              {ksfs.length > 0 && (
                <div className="mb-1 pl-1.5" style={{ borderLeft: "2px solid var(--color-success, #16a34a)" }}>
                  {ksfs.map((ksf, i) => (
                    <p key={i} className="text-[9px] text-slate-700 leading-snug m-0">
                      {ksf.description}
                    </p>
                  ))}
                </div>
              )}
              {kpis.length > 0 && (
                <div className="mt-auto flex flex-col gap-0.5">
                  {kpis.map((kpi, i) => (
                    <div key={i}>
                      <p className="text-[9px] text-slate-600 leading-tight m-0">
                        {kpi.description}
                      </p>
                      <p
                        className="text-[9px] m-0"
                        style={{ fontFamily: "var(--font-mono)", color: "var(--color-primary)" }}
                      >
                        {kpi.current_value || "—"} → {kpi.target_value || "—"}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ── SWOT-model (configureerbaar) ─────────────────────────────────────────────
function SwotModel({ data, appLabel }) {
  const lbl = (k, fb) => (appLabel ? appLabel(k, fb) : fb);
  const sterkten     = Array.isArray(data?.sterkten) ? data.sterkten : [];
  const zwakten      = Array.isArray(data?.zwakten) ? data.zwakten : [];
  const kansen       = Array.isArray(data?.kansen) ? data.kansen : [];
  const bedreigingen = Array.isArray(data?.bedreigingen) ? data.bedreigingen : [];

  const Quadrant = ({ titel, items, tone, testIdSuffix }) => (
    <div
      data-testid={`strategie-onepager-swot-${testIdSuffix}`}
      className={`p-2 rounded border ${tone}`}
    >
      <p className="text-[8px] font-bold uppercase tracking-[0.14em] mb-1">{titel}</p>
      {items.length === 0 ? (
        <p className="text-[9px] italic text-slate-400 m-0">—</p>
      ) : (
        <ul className="m-0 pl-3 list-disc">
          {/* 11.S-retro-2: geen `slice(0, 4)`-truncation meer. Alle
              analysis_items per quadrant tonen — structurele input van
              consultant. Quadrant kan visueel langer worden; bij echte
              overflow regelt browser-print en builder-multi-page de
              page-distribution. */}
          {items.map((it, i) => (
            <li key={i} className="text-[9px] leading-snug text-slate-700">
              {it.content}
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  return (
    <div className="strategie-onepager-model-block" data-testid="strategie-onepager-model-swot">
      <p className="text-[8px] font-bold uppercase tracking-[0.18em] text-slate-500 mb-1.5">
        {lbl("strategie.onepager.swot.titel", "SWOT-analyse — intern en extern")}
      </p>
      <div className="grid grid-cols-2 gap-2">
        <Quadrant
          titel={lbl("strategie.onepager.swot.sterkten", "Sterkten")}
          items={sterkten}
          tone="border-green-300 bg-green-50/40 text-green-900"
          testIdSuffix="sterkten"
        />
        <Quadrant
          titel={lbl("strategie.onepager.swot.kansen", "Kansen")}
          items={kansen}
          tone="border-blue-300 bg-blue-50/40 text-blue-900"
          testIdSuffix="kansen"
        />
        <Quadrant
          titel={lbl("strategie.onepager.swot.zwakten", "Zwakten")}
          items={zwakten}
          tone="border-amber-300 bg-amber-50/40 text-amber-900"
          testIdSuffix="zwakten"
        />
        <Quadrant
          titel={lbl("strategie.onepager.swot.bedreigingen", "Bedreigingen")}
          items={bedreigingen}
          tone="border-red-300 bg-red-50/40 text-red-900"
          testIdSuffix="bedreigingen"
        />
      </div>
    </div>
  );
}

// ── Kernwaarden-bord-model (configureerbaar) ─────────────────────────────────
function KernwaardenBordModel({ data, appLabel }) {
  const lbl = (k, fb) => (appLabel ? appLabel(k, fb) : fb);
  const kernwaarden = Array.isArray(data?.kernwaarden) ? data.kernwaarden : [];
  return (
    <div className="strategie-onepager-model-block" data-testid="strategie-onepager-model-kernwaarden">
      <p className="text-[8px] font-bold uppercase tracking-[0.18em] text-slate-500 mb-1.5">
        {lbl("strategie.onepager.identiteit.kernwaarden.label", "KERNWAARDEN")}
      </p>
      <div className="grid grid-cols-3 gap-2">
        {kernwaarden.map((kw, i) => (
          <div
            key={i}
            data-testid={`strategie-onepager-kernwaarde-${i}`}
            className="p-2 rounded text-center"
            style={{
              background: "#FAF8F2",
              borderLeft: "3px solid var(--color-accent)",
            }}
          >
            <p
              className="m-0 text-[11px] font-semibold"
              style={{ color: "var(--color-primary)", fontFamily: "var(--font-display)" }}
            >
              {kw}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── AI-aandachtspunten-blok ──────────────────────────────────────────────────
// 11.S-simplify: chunking-props verwijderd. Filter intern op in_rapport=true en
// render ALLES in één doorlopend blok. Browser-print-engine regelt eigen
// page-splitsing via `page-break-inside: avoid` op `.strategie-onepager-model-
// block` (PrintStyles.css uit Block 4).
function AiBlock({ insights, appLabel }) {
  const lbl = (k, fb) => (appLabel ? appLabel(k, fb) : fb);
  const items = (Array.isArray(insights) ? insights : []).filter(i => i.in_rapport === true);

  if (items.length === 0) {
    return (
      <div
        data-testid="strategie-onepager-ai-empty"
        className="p-2 rounded border text-[9px] italic text-slate-500"
        style={{
          borderColor: "var(--color-ai-accent, var(--color-accent))",
          background: "var(--color-ai-accent-bg, rgba(249,115,22,0.04))",
        }}
      >
        {lbl("strategie.onepager.ai.fallback.empty", "AI-inzichten uit voor dit rapport")}
      </div>
    );
  }

  return (
    <aside
      data-testid="strategie-onepager-ai-block"
      className="strategie-onepager-model-block p-2 rounded border"
      style={{
        borderColor: "var(--color-ai-accent, var(--color-accent))",
        background: "var(--color-ai-accent-bg, rgba(249,115,22,0.04))",
      }}
    >
      <p
        className="text-[8px] font-bold uppercase tracking-[0.18em] mb-1.5"
        style={{ color: "var(--color-ai-accent, var(--color-accent))" }}
      >
        {lbl("strategie.onepager.ai.titel", "AI · Aandachtspunten")}
      </p>
      <div className="flex flex-col gap-2">
        {items.map((ins) => {
          const obs = ins.edited_observation ?? ins.observation;
          const rec = ins.edited_recommendation ?? ins.recommendation;
          return (
            <div key={ins.id} data-testid={`strategie-onepager-ai-insight-${ins.id}`}>
              <p
                className="text-[8px] font-bold uppercase tracking-[0.14em] m-0 mb-0.5"
                style={{ color: "var(--color-ai-accent, var(--color-accent))" }}
              >
                {(ins.category || "")} · {(ins.type || "")}
              </p>
              {obs && (
                <p className="m-0 text-[9px] leading-snug text-slate-700">{obs}</p>
              )}
              {rec && (
                <p className="m-0 text-[9px] italic leading-snug text-slate-600 mt-0.5">
                  → {rec}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </aside>
  );
}

// ── Footer ───────────────────────────────────────────────────────────────────
// 11.S-simplify (Kees-keuze 18 mei avond): geen pageNum/totalPages-props meer.
// Browser-print-engine regelt eigen page-counting (CSS `counter-increment` of
// vendor-specific). Builder-preview = enkele flow zonder counter.
function Footer({ tenantBrand, appLabel }) {
  const lbl = (k, fb) => (appLabel ? appLabel(k, fb) : fb);
  return (
    <footer
      data-testid="strategie-onepager-footer"
      className="flex items-center justify-between px-6 text-[8px]"
      style={{
        height: 24,
        background: "var(--color-primary)",
        color: "white",
        opacity: 0.95,
      }}
    >
      <span className="opacity-80">
        {lbl("strategie.onepager.footer.classification", "Vertrouwelijk — alleen voor genoemde klant")}
      </span>
      <span className="opacity-80">
        {tenantBrand || lbl("strategie.onepager.brand.fallback", "Platform")}
        {" · "}
        {lbl("strategie.onepager.werkblad.naam", "STRATEGIE")}
      </span>
    </footer>
  );
}


// ── BodyZone (flow-mode, 11.S-simplify) ──────────────────────────────────────
// Eén enkele body-render: selectie-modellen LINKS + AI-aside RECHTS wanneer
// withAi=true, anders alleen modellen full-width. Geen mode-switching meer
// (de retro-1/2/3 page-distribution-logic is verwijderd — browser-print
// regelt eigen page-splitsing via @page + page-break-inside: avoid op
// .strategie-onepager-model-block).
function BodyZone({ selectedModels = [], withAi, insights, data, appLabel }) {
  const lbl = (k, fb) => (appLabel ? appLabel(k, fb) : fb);

  function renderModel(modelId) {
    const payload = data?.[modelId]?.data;
    switch (modelId) {
      case "swot":
        return <SwotModel key="swot" data={payload} appLabel={appLabel} />;
      case "kernwaarden":
        return <KernwaardenBordModel key="kernwaarden" data={payload} appLabel={appLabel} />;
      default:
        return null;
    }
  }

  const modelComponents = (selectedModels || [])
    .map(m => renderModel(m.id))
    .filter(Boolean);

  const bodyGridCols = withAi ? "1fr 280px" : "1fr";
  const hasBodyContent = modelComponents.length > 0 || !!withAi;
  if (!hasBodyContent) return null;

  return (
    <section
      data-testid="strategie-onepager-body"
      className="px-6 py-3"
    >
      <div className="grid gap-3" style={{ gridTemplateColumns: bodyGridCols }}>
        <div className="flex flex-col gap-3">
          {modelComponents.length === 0 ? (
            <p className="text-[9px] italic text-slate-400">
              {lbl("strategie.onepager.body.empty", "Geen modellen geselecteerd — kies in linker paneel.")}
            </p>
          ) : (
            modelComponents
          )}
        </div>
        {withAi && (
          <AiBlock insights={insights} appLabel={appLabel} />
        )}
      </div>
    </section>
  );
}

// ── Hoofdcomponent (flow-mode, 11.S-simplify) ────────────────────────────────
// Eén lange flow-render: BrandStrip + TitelBlock + IdentiteitsBand + KpiStrip
// + ThemasGrid + BodyZone + Footer. Geen page-distribution, geen scaling,
// geen A4Page-sub-frames. Builder-preview = enkele scrollende pagina (met
// optioneel dashed page-marker via CSS in A4Preview). Browser-print-engine
// regelt multi-page-output native via PrintStyles.css (Block 4):
//   @page { size: A4 landscape; margin: 0; }
//   .strategie-onepager-model-block { page-break-inside: avoid; }
//
// Behoud uit Block 4 + retro-2 + retro-3:
//   - H1 vaste-titel "Samenvatting Strategie" (retro-3 Fix 1)
//   - IdentiteitsBand zonder kernwaarden (retro-3 Fix 3)
//   - ThemasGrid max 4 cols + min-w-0 (retro-2 Fix 1)
//   - SWOT + AI: alle items zichtbaar (retro-2 Fix 2 — geen slice-truncation)
//   - KernwaardenBordModel in body-zone (Block 4)
//
// Verwijderd uit retro-1/2/3:
//   - computePages + IDENTITY_SPLIT_THRESHOLD + page-recipes
//   - PageShell + per-page BrandStrip/Footer-repetitie
//   - AiBlock chunking-props (chunk/chunkIdx/totalChunks)
//   - BodyZone mode-switch
//   - Page-prop voor multi-page render
//   - data-total-pages-attribuut + Footer pageNum/totalPages
export default function StrategyOnePager({
  vasteBlokken = [],   // [{id, label, sub_label}] — niet direct gebruikt; voor API-compat
  selectedModels = [], // [{id, label}] in volgorde
  withAi = true,
  insights = [],
  data = {},
  appLabel,
  tenantBrand = null,
  canvasName = null,
}) {
  return (
    <div
      data-testid="strategie-onepager-v2"
      className="strategie-onepager flex flex-col"
      style={{
        background: "white",
        fontFamily: "var(--font-body)",
        color: "var(--color-primary)",
      }}
    >
      <BrandStrip tenantBrand={tenantBrand} appLabel={appLabel} />
      <TitelBlock
        canvasName={canvasName}
        tenantBrand={tenantBrand}
        appLabel={appLabel}
      />
      <IdentiteitsBand data={data?.identiteit?.data} appLabel={appLabel} />
      <KpiStrip        data={data?.["kpi-strip"]?.data} appLabel={appLabel} />
      <ThemasGrid      data={data?.themas?.data} appLabel={appLabel} />
      <BodyZone
        selectedModels={selectedModels}
        withAi={withAi}
        insights={insights}
        data={data}
        appLabel={appLabel}
      />
      <Footer tenantBrand={tenantBrand} appLabel={appLabel} />
    </div>
  );
}
