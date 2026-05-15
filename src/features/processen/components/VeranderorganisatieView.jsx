/**
 * VeranderorganisatieView — sub-tab 1.3 (11.M MVP).
 *
 * RFC-005 §6: rich-text canvas-config (vo_change_approach) +
 * business_units + value_teams + schets-upload PNG/JPG.
 *
 * MVP-scope: rich-text textarea + BU + VT-lijsten. Schets-upload-flow
 * deferred (vereist Supabase Storage-bucket-config).
 */

import React, { useEffect, useState, useCallback } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useAppConfig } from "../../../shared/context/AppConfigContext";
import * as svc from "../services/processen.service";

export default function VeranderorganisatieView({ canvasId }) {
  const { label: appLabel } = useAppConfig();
  const [changeApproach, setChangeApproach] = useState("");
  const [businessUnits, setBusinessUnits] = useState([]);
  const [valueTeams, setValueTeams] = useState([]);
  const [newBuName, setNewBuName] = useState("");
  const [newVtName, setNewVtName] = useState("");
  const [savingApproach, setSavingApproach] = useState(false);

  const loadAll = useCallback(async () => {
    if (!canvasId) return;
    const [{ data: ca }, { data: bus }, { data: vts }] = await Promise.all([
      svc.getChangeApproach(canvasId),
      svc.listBusinessUnits(canvasId),
      svc.listValueTeams(canvasId),
    ]);
    setChangeApproach(ca?.text_md || "");
    setBusinessUnits(bus || []);
    setValueTeams(vts || []);
  }, [canvasId]);

  useEffect(() => { loadAll(); }, [loadAll]);

  async function saveApproach() {
    setSavingApproach(true);
    await svc.setChangeApproach(canvasId, changeApproach);
    setSavingApproach(false);
  }

  async function addBu() {
    if (!newBuName.trim()) return;
    await svc.createBusinessUnit({ canvas_id: canvasId, name: newBuName.trim() });
    setNewBuName(""); loadAll();
  }
  async function addVt() {
    if (!newVtName.trim()) return;
    await svc.createValueTeam({ canvas_id: canvasId, name: newVtName.trim() });
    setNewVtName(""); loadAll();
  }

  return (
    <div data-testid="veranderorganisatie-view" className="p-6 space-y-6">
      <section>
        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Veranderaanpak</h3>
        <textarea
          value={changeApproach}
          onChange={(e) => setChangeApproach(e.target.value)}
          onBlur={saveApproach}
          rows={5}
          placeholder="Beschrijf de veranderaanpak in ~400 tekens…"
          data-testid="vo-change-approach"
          className="w-full px-3 py-2 text-sm border border-slate-300 rounded focus:outline-none focus:border-[var(--color-accent)]"
        />
        {savingApproach && <p className="text-[10px] text-slate-400 mt-1">opslaan…</p>}
      </section>

      <section>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">Business units ({businessUnits.length})</h3>
        </div>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={newBuName}
            onChange={(e) => setNewBuName(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") addBu(); }}
            placeholder="Business unit naam…"
            data-testid="vo-bu-add-input"
            className="flex-1 px-2 py-1 text-sm border border-slate-300 rounded focus:outline-none focus:border-[var(--color-accent)]"
          />
          <button type="button" onClick={addBu} className="px-3 py-1 text-xs font-bold bg-[var(--color-accent)] text-[var(--color-primary)] rounded">
            {appLabel("processen.knop.bu.toevoegen", "+ Business unit")}
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
          {businessUnits.map((b) => (
            <div key={b.id} data-testid={`vo-bu-${b.id}`} className="flex items-center justify-between px-3 py-2 bg-white border border-slate-200 rounded text-sm">
              <span className="flex-1 text-slate-800">{b.name}</span>
              <button type="button" onClick={async () => { await svc.deleteBusinessUnit(b.id); loadAll(); }} className="text-slate-400 hover:text-red-600" aria-label="Verwijder">
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">Value teams ({valueTeams.length})</h3>
        </div>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={newVtName}
            onChange={(e) => setNewVtName(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") addVt(); }}
            placeholder="Value team naam…"
            data-testid="vo-vt-add-input"
            className="flex-1 px-2 py-1 text-sm border border-slate-300 rounded focus:outline-none focus:border-[var(--color-accent)]"
          />
          <button type="button" onClick={addVt} className="px-3 py-1 text-xs font-bold bg-[var(--color-accent)] text-[var(--color-primary)] rounded">
            {appLabel("processen.knop.team.toevoegen", "+ Value team")}
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {valueTeams.map((v) => (
            <div key={v.id} data-testid={`vo-vt-${v.id}`} className="flex items-center justify-between px-3 py-2 bg-white border border-slate-200 rounded text-sm">
              <span className="flex-1 text-slate-800">{v.name}</span>
              <button type="button" onClick={async () => { await svc.deleteValueTeam(v.id); loadAll(); }} className="text-slate-400 hover:text-red-600" aria-label="Verwijder">
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-slate-200 pt-4 text-xs text-slate-400 italic">
        Schets-upload (PNG/JPG max 5MB) komt in 11.M follow-up (Supabase Storage bucket-config).
      </section>
    </div>
  );
}
