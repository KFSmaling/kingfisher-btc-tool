/**
 * A4Preview — werkblad-agnostische flowing-A4-preview voor OnepagerBuilder.
 *
 * RFC-008 §C + designer-spec rapportage-spec.md §2.
 *
 * 11.S Block 3: skelet-render.
 * 11.S Block 4: LayoutComponent-pad voor StrategyOnePager v2.
 * 11.S retro-1: ResizeObserver scaling + multi-page-Page-slot pattern.
 * 11.S retro-2/3: content-aware page-distribution (computePages).
 * 11.S-simplify (Kees 18 mei avond): revert page-distribution-trap.
 *   Verwijderd: ResizeObserver-scaling, transform-scale, A4Page-fixed-size,
 *   Page-slot, content-height-tracking, page-counter.
 *   Behouden: LayoutComponent-injectie + skelet-fallback.
 *
 * Architectuur (post-simplify):
 *   - A4Preview = viewport-wrapper met flow-container van 1190px (max-width)
 *   - Geen fixed A4-frame meer — content stroomt vrij in de container
 *   - Optionele dashed page-marker via CSS background per 842px (visueel
 *     hint dat hier een pagina-grens komt bij browser-print)
 *   - Browser-print-engine doet eigen multi-page-splitsing via @page +
 *     page-break-inside: avoid (PrintStyles.css uit Block 4 — ongewijzigd)
 *
 * Props:
 *   vasteBlokken      — [{ id, label, sub_label, data? }] altijd-zichtbaar
 *   selectedModels    — [{ id, label }] in volgorde gekozen modellen
 *   withAi            — boolean — AI-aandachtspunten-blok zichtbaar
 *   insights          — array van insight-objects, filtered op in_rapport=true
 *                       wanneer withAi=true (LayoutComponent doet finale filter)
 *   data              — werkblad-data uit dataResolver per modelId
 *   LayoutComponent?  — werkblad-specifieke v2-layout; null = skelet-render
 *   appLabel          — (key, fb) => string
 */

import React from "react";
import "./A4Preview.css"; // 11.S-simplify: dashed page-marker per 842px

const A4_WIDTH_PX  = 1190;
const A4_HEIGHT_PX = 842;

// ── Skelet-blok (fallback wanneer geen LayoutComponent) ──────────────────────
function SkeletBlok({ label, sub_label, tone = "neutral", warning = null, testId }) {
  const toneClasses = {
    neutral:  "bg-slate-50 border-slate-200 text-slate-700",
    fixed:    "bg-slate-100 border-slate-300 text-slate-700",
    selected: "bg-[var(--color-accent)]/10 border-[var(--color-accent)]/40 text-[var(--color-primary)]",
    ai:       "bg-[var(--color-ai-accent)]/10 border-[var(--color-ai-accent)]/40 text-[var(--color-primary)]",
    warning:  "bg-amber-50 border-amber-300 text-amber-900",
  };
  return (
    <div
      data-testid={testId}
      className={`rounded-md border px-3 py-2 ${toneClasses[tone]}`}
    >
      <div className="text-[11px] font-bold uppercase tracking-[0.08em]">{label}</div>
      {sub_label && <div className="text-[10px] opacity-75 mt-0.5">{sub_label}</div>}
      {warning && <div className="text-[10px] text-amber-700 mt-1 italic">{warning}</div>}
    </div>
  );
}

// Skelet-render (Block 3 backwards-compat, alleen actief als LayoutComponent=null).
function SkeletLayout({ vasteBlokken, selectedModels, visibleInsights, data, withAi, appLabel }) {
  const lbl = (k, fb) => (appLabel ? appLabel(k, fb) : fb);
  return (
    <div className="w-full p-8 flex flex-col gap-3 box-border">
      <div className="border-b-2 border-[var(--color-primary)] pb-2 mb-1">
        <p className="text-[10px] uppercase tracking-[0.14em] text-slate-500 font-semibold">
          {lbl("onepager.preview.kicker", "One-pager · A4 landschap")}
        </p>
        <h1 className="text-2xl font-semibold text-[var(--color-primary)] tracking-[-0.01em]">
          {data.samenvatting?.ready
            ? (data.samenvatting.text || lbl("onepager.preview.h1.placeholder", "Strategische samenvatting"))
            : lbl("onepager.preview.fallback.samenvatting", "Strategische samenvatting nog niet gegenereerd")}
        </h1>
      </div>
      {vasteBlokken.map(blok => {
        const blokData = data[blok.id] || {};
        const isReady = blokData.ready !== false;
        return (
          <SkeletBlok
            key={blok.id}
            testId={`a4-preview-vaste-${blok.id}`}
            label={blok.label}
            sub_label={blok.sub_label}
            tone="fixed"
            warning={!isReady ? blokData.completeness_msg : null}
          />
        );
      })}
      {selectedModels.length > 0 && (
        <div className="flex flex-col gap-2 mt-2">
          <p className="text-[9px] uppercase tracking-[0.1em] text-slate-400 font-semibold">
            {lbl("onepager.preview.selectie.titel", "Modellen")}
          </p>
          {selectedModels.map(m => (
            <SkeletBlok
              key={m.id}
              testId={`a4-preview-model-${m.id}`}
              label={m.label}
              sub_label={lbl("onepager.preview.model.placeholder", "Block 4 vult dit blok met inhoud uit de werkblad-data.")}
              tone="selected"
            />
          ))}
        </div>
      )}
      {withAi && (
        <div className="mt-2 pt-3 border-t border-[var(--color-ai-accent)]/30">
          {visibleInsights.length > 0 ? (
            <SkeletBlok
              testId="a4-preview-insights-block"
              label={lbl("onepager.preview.insights.titel", "Aandachtspunten uit Inzichten")}
              sub_label={`${visibleInsights.length} ${lbl("onepager.preview.insights.suffix", "bevindingen opgenomen — Block 4 vult de tekst in")}`}
              tone="ai"
            />
          ) : (
            <SkeletBlok
              testId="a4-preview-insights-empty"
              label={lbl("onepager.preview.insights.titel", "Aandachtspunten uit Inzichten")}
              sub_label={lbl("onepager.preview.fallback.insights", "Geen bevindingen geselecteerd in Inzichten.")}
              tone="warning"
            />
          )}
        </div>
      )}
    </div>
  );
}

// ── Hoofdcomponent ────────────────────────────────────────────────────────────
export default function A4Preview({
  vasteBlokken = [],
  selectedModels = [],
  withAi = true,
  insights = [],
  data = {},
  LayoutComponent = null,
  appLabel,
}) {
  // Filter insights op in_rapport=true wanneer AI-toggle aan.
  const visibleInsights = withAi
    ? (Array.isArray(insights) ? insights : []).filter(i => i.in_rapport === true)
    : [];

  return (
    <div
      data-testid="a4-preview-viewport"
      className="a4-preview-viewport relative overflow-auto p-6 flex justify-center"
      style={{ background: "#f1f5f9" /* slate-100 */ }}
    >
      <div
        data-testid="a4-preview-page-flow"
        className="a4-preview-page-flow"
        // CSS-driven page-marker (dashed line per 842px) in src/shared/components/rapportage/A4Preview.css
        // box-shadow + max-width geven "papier op tafel"-gevoel zonder fixed-size-frame.
        style={{
          width: A4_WIDTH_PX,
          maxWidth: "100%",
          background: "white",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        }}
      >
        {LayoutComponent ? (
          <LayoutComponent
            vasteBlokken={vasteBlokken}
            selectedModels={selectedModels}
            withAi={withAi}
            insights={visibleInsights}
            data={data}
            appLabel={appLabel}
          />
        ) : (
          <SkeletLayout
            vasteBlokken={vasteBlokken}
            selectedModels={selectedModels}
            visibleInsights={visibleInsights}
            data={data}
            withAi={withAi}
            appLabel={appLabel}
          />
        )}
      </div>
    </div>
  );
}

// Export constants voor unit-tests + Block 4 print-CSS-coördinatie.
A4Preview.A4_WIDTH_PX  = A4_WIDTH_PX;
A4Preview.A4_HEIGHT_PX = A4_HEIGHT_PX;
