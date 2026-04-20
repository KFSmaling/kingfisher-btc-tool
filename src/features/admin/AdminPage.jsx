/**
 * AdminPage — beheer prompts + UI labels zonder deploy
 *
 * Toegankelijk via /admin — alleen voor REACT_APP_ADMIN_EMAIL
 * Directe schrijftoegang via Supabase RLS (email-check in policy)
 */

import React, { useState, useEffect, useCallback } from "react";
import { Save, RefreshCw, LogOut, ChevronDown, ChevronUp, Check, AlertOctagon } from "lucide-react";
import { supabase } from "../../services/supabaseClient";

const CATEGORIES  = ["label", "prompt", "setting"];
const CATEGORY_LABELS = { label: "UI Labels", prompt: "AI Prompts", setting: "Instellingen" };

// ── Één bewerkbaar config-rij ────────────────────────────────────────────────
function ConfigRow({ row, onSave }) {
  const [value, setValue]   = useState(row.value);
  const [status, setStatus] = useState("idle"); // idle | saving | saved | error
  const [open, setOpen]     = useState(false);

  const isLong  = row.category === "prompt";
  const isDirty = value !== row.value;

  const handleSave = async () => {
    setStatus("saving");
    const { error } = await supabase
      .from("app_config")
      .update({ value, updated_at: new Date().toISOString() })
      .eq("key", row.key);

    if (error) {
      setStatus("error");
      setTimeout(() => setStatus("idle"), 3000);
    } else {
      setStatus("saved");
      onSave(row.key, value);
      setTimeout(() => setStatus("idle"), 2500);
    }
  };

  return (
    <div className={`border rounded-sm overflow-hidden ${isDirty ? "border-amber-300 bg-amber-50/30" : "border-slate-200 bg-white"}`}>
      {/* Header rij */}
      <div
        className="flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-slate-50 transition-colors"
        onClick={() => setOpen(o => !o)}
      >
        <div className="flex-1 min-w-0">
          <code className="text-xs font-mono text-[#1a365d] font-semibold">{row.key}</code>
          {row.description && (
            <p className="text-[11px] text-slate-400 mt-0.5 truncate">{row.description}</p>
          )}
        </div>
        {!open && (
          <p className="text-xs text-slate-500 truncate max-w-xs shrink-0 mt-0.5">{value}</p>
        )}
        <button className="text-slate-400 shrink-0 mt-0.5">
          {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      {/* Edit gebied */}
      {open && (
        <div className="px-4 pb-4 space-y-2">
          <textarea
            value={value}
            onChange={e => setValue(e.target.value)}
            rows={isLong ? 12 : 2}
            className="w-full text-sm border border-slate-200 rounded-sm px-3 py-2 font-mono
                       focus:outline-none focus:border-[#8dc63f] resize-y leading-relaxed"
            spellCheck={false}
          />
          <div className="flex items-center justify-between">
            <p className="text-[10px] text-slate-400">
              {isDirty ? "⚠ Niet opgeslagen wijziging" : "Geen wijzigingen"}
            </p>
            <button
              onClick={handleSave}
              disabled={!isDirty || status === "saving"}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-sm text-xs font-bold uppercase tracking-widest transition-all
                ${isDirty && status === "idle"
                  ? "bg-[#8dc63f] hover:bg-[#7ab52e] text-[#1a365d] shadow-sm"
                  : status === "saved"
                    ? "bg-green-100 text-green-700"
                    : status === "error"
                      ? "bg-red-100 text-red-600"
                      : "bg-slate-100 text-slate-400 cursor-not-allowed"
                }`}
            >
              {status === "saving" && <RefreshCw size={11} className="animate-spin" />}
              {status === "saved"  && <Check size={11} />}
              {status === "error"  && <AlertOctagon size={11} />}
              {status === "idle" || status === "saving" ? <Save size={11} /> : null}
              {status === "saving" ? "Opslaan…"
               : status === "saved"  ? "Opgeslagen"
               : status === "error"  ? "Fout"
               : "Opslaan"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Hoofd AdminPage ──────────────────────────────────────────────────────────
export default function AdminPage({ user, onSignOut }) {
  const [rows, setRows]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("prompt");

  const loadConfig = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("app_config")
      .select("key, value, category, description, updated_at")
      .order("key");
    if (data) setRows(data);
    setLoading(false);
  }, []);

  useEffect(() => { loadConfig(); }, [loadConfig]);

  const handleSave = (key, newValue) => {
    setRows(prev => prev.map(r => r.key === key ? { ...r, value: newValue } : r));
  };

  const filtered = rows.filter(r => r.category === activeTab);

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#1a365d] font-sans">

      {/* Header */}
      <header className="h-16 bg-[#1a365d] flex items-center justify-between px-8 border-b-2 border-[#8dc63f] shadow-lg">
        <div className="flex items-center gap-4">
          <img src="/kf-logo-white.png" alt="Kingfisher" className="h-8 w-auto object-contain"
            onError={e => { e.target.style.display = "none"; }} />
          <div>
            <h1 className="text-sm font-bold tracking-widest uppercase text-white">App Config</h1>
            <p className="text-[10px] text-[#8dc63f] uppercase tracking-widest">Admin — {user?.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={loadConfig}
            className="flex items-center gap-1.5 text-white/60 hover:text-white border border-white/20 hover:border-white/40 px-3 py-1.5 rounded-sm text-[10px] font-bold uppercase tracking-widest transition-all">
            <RefreshCw size={11} /> Vernieuwen
          </button>
          <a href="/" className="text-white/60 hover:text-white border border-white/20 hover:border-white/40 px-3 py-1.5 rounded-sm text-[10px] font-bold uppercase tracking-widest transition-all">
            ← Naar App
          </a>
          <button onClick={onSignOut}
            className="flex items-center gap-1.5 text-white/40 hover:text-white transition-colors ml-1">
            <LogOut size={15} />
          </button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto py-8 px-6 space-y-6">

        {/* Uitleg */}
        <div className="bg-blue-50 border border-blue-200 rounded-sm px-5 py-3 text-sm text-blue-800">
          <strong>Wijzigingen zijn direct actief</strong> — prompts gelden bij de volgende API-aanroep,
          labels bij de volgende pagina-refresh. Geen deploy nodig.
        </div>

        {/* Tabs */}
        <div className="flex gap-0 border-b border-slate-200">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveTab(cat)}
              className={`px-6 py-2.5 text-xs font-bold uppercase tracking-widest border-b-2 transition-all -mb-px
                ${activeTab === cat
                  ? "border-[#8dc63f] text-[#1a365d]"
                  : "border-transparent text-slate-400 hover:text-slate-600"}`}
            >
              {CATEGORY_LABELS[cat]}
              <span className="ml-2 text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full">
                {rows.filter(r => r.category === cat).length}
              </span>
            </button>
          ))}
        </div>

        {/* Rijen */}
        {loading ? (
          <div className="flex items-center gap-3 text-slate-400 py-12 justify-center">
            <RefreshCw size={16} className="animate-spin" />
            <span className="text-sm">Config laden…</span>
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-slate-400 text-sm text-center py-12">Geen rijen gevonden</p>
        ) : (
          <div className="space-y-2">
            {filtered.map(row => (
              <ConfigRow key={row.key} row={row} onSave={handleSave} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
