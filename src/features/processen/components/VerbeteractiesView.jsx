/**
 * VerbeteractiesView — fase 3 (11.M MVP).
 *
 * RFC-005 §9: po_improvement_intents 2-staps state-machine (concept/definitief
 * + dismissed-flag) via append-only audit-events (po_improvement_intent_events).
 *
 * Coverage-banner bovenaan body (Designer-Principe 5, RFC-005 §9.3):
 *   - 0 pijnpunten → banner verbergen + empty-state
 *   - ≥1 pijnpunt → toon open/covered/motivated_no_action-counters
 *
 * Pull-model (Designer-Principe 7): GEEN "Naar Roadmap"-knop. Roadmap-werkblad
 * (RFC-003 / 11.L) queryt zelf current_status='definitief'.
 *
 * MVP-scope: concept/definitief-lijst + state-transitions + +Eigen-actie.
 * AI-generaties (5 source-types) deferred naar C5 follow-up.
 */

import React, { useEffect, useState, useCallback } from "react";
import { Plus, ArrowUp, ArrowDown, X } from "lucide-react";
import { useAppConfig } from "../../../shared/context/AppConfigContext";
import * as svc from "../services/processen.service";

export default function VerbeteractiesView({ canvasId }) {
  const { label: appLabel } = useAppConfig();
  const [intents, setIntents] = useState([]);
  const [coverage, setCoverage] = useState(null);
  const [adding, setAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newIntent, setNewIntent] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!canvasId) return;
    setLoading(true);
    const [{ data: intentsData }, { data: counts }] = await Promise.all([
      svc.listImprovementIntents(canvasId),
      svc.fetchCoverageAggregate(canvasId),
    ]);
    setIntents(intentsData || []);
    setCoverage(counts || null);
    setLoading(false);
  }, [canvasId]);

  useEffect(() => { load(); }, [load]);

  async function addEigen() {
    if (!newTitle.trim() || newIntent.trim().length < 50) {
      setError(new Error("Titel + intent_md (min 50 tekens) verplicht"));
      return;
    }
    const { error: err } = await svc.createImprovementIntent({
      canvas_id: canvasId,
      title: newTitle.trim(),
      intent_md: newIntent.trim(),
      source_type: "eigen",
    });
    if (err) { setError(err); return; }
    setNewTitle(""); setNewIntent(""); setAdding(false); setError(null);
    load();
  }

  async function transition(intentId, eventType) {
    await svc.transitionIntentState(intentId, eventType);
    load();
  }

  const concepts   = intents.filter(i => i.current_status === "concept");
  const definitief = intents.filter(i => i.current_status === "definitief");

  if (loading) return <div className="p-6 text-sm text-slate-500">Laden…</div>;

  return (
    <div data-testid="processen-verbeteracties-view" className="p-6 space-y-4">
      {/* Coverage-banner: verbergen bij 0 pijnpunten (Designer-keuze §11 #3) */}
      {coverage && coverage.total > 0 ? (
        <div
          data-testid="processen-coverage-banner"
          className="bg-slate-50 border border-slate-200 rounded-lg p-3 flex items-center justify-between"
        >
          <div className="text-xs">
            <p className="font-bold text-slate-700 uppercase tracking-widest text-[10px]">
              {appLabel("processen.coverage.banner.titel", "Coverage-overzicht")}
            </p>
            <p className="text-slate-600 mt-1">
              {coverage.open} open · {coverage.covered} geadresseerd · {coverage.motivated_no_action} bewust niet
            </p>
          </div>
          {coverage.open > 0 && (
            <span className="px-2 py-1 bg-amber-100 text-amber-800 text-[10px] font-bold rounded">
              {coverage.open} OPEN
            </span>
          )}
        </div>
      ) : (
        <div className="text-xs text-slate-400 italic px-3 py-2">
          {appLabel("processen.coverage.banner.empty", "Voeg eerst pijnpunten toe of genereer concepten op basis van inventaris-data")}
        </div>
      )}

      {/* Action-bar */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span><strong className="text-slate-800">{concepts.length}</strong> concept</span>
          <span>·</span>
          <span><strong className="text-slate-800">{definitief.length}</strong> definitief</span>
        </div>
        <button
          type="button"
          onClick={() => setAdding(!adding)}
          data-testid="verbeteracties-add-toggle"
          className="flex items-center gap-1 text-xs uppercase tracking-widest text-[var(--color-accent)] hover:text-[var(--color-accent-hover)]"
        >
          <Plus size={12} />
          {appLabel("processen.knop.intent.toevoegen", "+ Verbeteractie")}
        </button>
      </div>

      {/* Inline-form voor eigen-actie */}
      {adding && (
        <div className="bg-slate-50 border border-slate-200 rounded p-3 space-y-2">
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Titel (1-100 tekens)"
            maxLength={100}
            autoFocus
            data-testid="verbeteracties-add-titel"
            className="w-full px-2 py-1 text-sm border border-slate-300 rounded"
          />
          <textarea
            value={newIntent}
            onChange={(e) => setNewIntent(e.target.value)}
            placeholder="Beschrijving (50-2000 tekens, markdown ondersteund)"
            rows={4}
            data-testid="verbeteracties-add-intent"
            className="w-full px-2 py-1 text-sm border border-slate-300 rounded"
          />
          {error && <p className="text-xs text-red-600">{error.message}</p>}
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => { setAdding(false); setError(null); }} className="px-3 py-1 text-xs text-slate-600 hover:text-slate-900">
              Annuleer
            </button>
            <button type="button" onClick={addEigen} data-testid="verbeteracties-add-submit" className="px-3 py-1 text-xs font-bold bg-[var(--color-accent)] text-[var(--color-primary)] rounded">
              Toevoegen
            </button>
          </div>
        </div>
      )}

      {/* Concept-lijst */}
      <section>
        <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">
          {appLabel("processen.intent.status.concept", "Concept")} ({concepts.length})
        </h4>
        {concepts.length === 0 ? (
          <p className="text-xs text-slate-400 italic">Geen concepten</p>
        ) : (
          <div className="space-y-2">
            {concepts.map((i) => (
              <div key={i.id} data-testid={`intent-concept-${i.id}`} className="bg-white border border-amber-200 rounded p-3">
                <div className="flex items-start justify-between mb-1">
                  <p className="text-sm font-bold text-slate-800 flex-1">{i.title}</p>
                  <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[9px] uppercase tracking-wider rounded">
                    {appLabel(`processen.source.${i.source_type}`, i.source_type)}
                  </span>
                </div>
                <p className="text-xs text-slate-600 whitespace-pre-line">{i.intent_md}</p>
                <div className="flex items-center gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => transition(i.id, "made_definitief")}
                    data-testid={`intent-make-definitief-${i.id}`}
                    className="flex items-center gap-1 px-2 py-1 text-[10px] font-bold bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    <ArrowUp size={10} />
                    {appLabel("processen.knop.maak_definitief", "Maak definitief")}
                  </button>
                  <button
                    type="button"
                    onClick={() => transition(i.id, "dismissed")}
                    data-testid={`intent-dismiss-${i.id}`}
                    className="flex items-center gap-1 px-2 py-1 text-[10px] text-slate-500 hover:text-red-600"
                  >
                    <X size={10} />
                    {appLabel("processen.knop.wuif_weg", "Wuif weg")}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Definitief-lijst */}
      <section>
        <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">
          {appLabel("processen.intent.status.definitief", "Definitief")} ({definitief.length})
        </h4>
        {definitief.length === 0 ? (
          <p className="text-xs text-slate-400 italic">Geen definitieve verbeteracties</p>
        ) : (
          <div className="space-y-2">
            {definitief.map((i) => (
              <div key={i.id} data-testid={`intent-definitief-${i.id}`} className="bg-white border border-blue-200 rounded p-3">
                <div className="flex items-start justify-between mb-1">
                  <p className="text-sm font-bold text-slate-800 flex-1">{i.title}</p>
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-[9px] uppercase tracking-wider rounded">
                    {appLabel("processen.intent.status.definitief", "Definitief")}
                  </span>
                </div>
                <p className="text-xs text-slate-600 whitespace-pre-line">{i.intent_md}</p>
                <div className="flex items-center gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => transition(i.id, "back_to_concept")}
                    data-testid={`intent-back-concept-${i.id}`}
                    className="flex items-center gap-1 px-2 py-1 text-[10px] text-slate-500 hover:text-slate-800"
                  >
                    <ArrowDown size={10} />
                    {appLabel("processen.knop.terug_naar_concept", "Terug naar concept")}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Pull-model info: GEEN "Naar Roadmap"-knop */}
      {definitief.length > 0 && (
        <p data-testid="processen-pull-model-info" className="text-[10px] text-slate-400 italic border-t border-slate-200 pt-3 mt-4">
          {appLabel("processen.info.pull_model", "Roadmap-werkblad haalt definitieve acties op uit alle werkbladen")}
        </p>
      )}

      <p className="text-[10px] text-slate-400 italic border-t border-slate-200 pt-3 mt-2">
        AI-generaties (5 source-types) komen in 11.M follow-up (C5 dossier-AI).
      </p>
    </div>
  );
}
