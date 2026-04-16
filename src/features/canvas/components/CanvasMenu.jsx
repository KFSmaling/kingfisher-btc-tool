import React, { useState } from "react";
import { Edit3, Plus, Trash2, FileText } from "lucide-react";
import { useLang } from "../../../i18n";

// ── Canvas Manager (Supabase) ────────────────────────────────────────────────

/**
 * CanvasMenu — toont huidige canvas naam + dropdown met alle canvassen.
 * Props worden van AppInner doorgegeven; geen eigen state voor de lijst.
 */
function CanvasMenu({ currentName, activeCanvasId, canvases, onNew, onSelect, onRename, onLoadExample, onDelete }) {
  const { t } = useLang();
  const [open, setOpen]                     = useState(false);
  const [editingName, setEditingName]       = useState(false);
  const [draftName, setDraftName]           = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const displayName = currentName || t("menu.unnamed");

  const commitRename = () => {
    if (draftName.trim()) onRename(draftName.trim());
    setEditingName(false);
  };

  return (
    <div className="relative flex items-center">
      {/* Canvas naam (klikbaar) of inline edit */}
      {editingName ? (
        <input
          autoFocus
          value={draftName}
          onChange={e => setDraftName(e.target.value)}
          onBlur={commitRename}
          onKeyDown={e => {
            if (e.key === "Enter")  commitRename();
            if (e.key === "Escape") setEditingName(false);
          }}
          className="bg-transparent border-b border-white/40 text-white text-base font-semibold outline-none w-64 pb-0.5 placeholder-white/40"
          placeholder="Canvas naam…"
        />
      ) : (
        <button onClick={() => setOpen(o => !o)} className="flex items-center gap-2.5 group">
          <div className="flex flex-col items-start">
            <span className="text-[9px] text-white/55 uppercase tracking-[0.2em] font-medium leading-none mb-1">{t("header.active.canvas")}</span>
            <span className="text-white font-semibold text-[15px] leading-none group-hover:text-[#8dc63f] transition-colors">
              {displayName}
            </span>
          </div>
          <svg width="10" height="6" viewBox="0 0 10 6" className={`text-white/40 group-hover:text-white transition-all mt-2 ${open ? "rotate-180" : ""}`} fill="currentColor">
            <path d="M0 0l5 6 5-6H0z"/>
          </svg>
        </button>
      )}

      {/* Potlood: naam bewerken */}
      {!editingName && (
        <button
          onClick={() => { setDraftName(currentName || ""); setEditingName(true); setOpen(false); }}
          className="ml-2 mt-1 text-white/50 hover:text-white transition-colors"
          title={t("menu.edit.name")}
        >
          <Edit3 size={12} />
        </button>
      )}

      {/* Dropdown */}
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full mt-3 w-72 bg-white rounded-sm shadow-2xl border border-slate-200 z-50 overflow-hidden">

            <div className="p-3 space-y-1 border-b border-slate-100">
              {/* Nieuw canvas */}
              <button
                onClick={() => { onNew(); setOpen(false); }}
                className="w-full text-left px-3 py-2.5 rounded-sm text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 border border-dashed border-slate-200 hover:border-[#1a365d] transition-colors"
              >
                <Plus size={13} className="text-[#1a365d] shrink-0" />
                <span className="font-semibold">{t("menu.new.canvas")}</span>
              </button>
              {/* Voorbeeld laden */}
              <button
                onClick={() => { onLoadExample(); setOpen(false); }}
                className="w-full text-left px-3 py-2.5 rounded-sm text-xs text-slate-500 hover:bg-slate-50 flex items-center gap-2 transition-colors"
              >
                <FileText size={13} className="text-slate-400 shrink-0" />
                <span>{t("menu.load.example")}</span>
              </button>
            </div>

            {/* Opgeslagen canvassen uit Supabase */}
            {canvases.length > 0 && (
              <div className="p-3 space-y-1 max-h-64 overflow-y-auto">
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest px-1 pb-1">{t("menu.saved")}</p>
                {canvases.map(c => {
                  const createdAt = c.created_at
                    ? new Date(c.created_at).toLocaleDateString("nl-NL", { day: "2-digit", month: "short", year: "numeric" })
                    : "";
                  const docCount   = c.canvas_uploads?.length ?? 0;
                  const isActive   = c.id === activeCanvasId;
                  const isConfirm  = confirmDeleteId === c.id;

                  // Bevestigingsbalk
                  if (isConfirm) return (
                    <div key={c.id} className="px-3 py-2 rounded-sm bg-red-50 border border-red-200">
                      <p className="text-[10px] font-semibold text-red-700 mb-1.5 truncate">
                        Verwijder "{c.name || "Naamloos"}"?
                      </p>
                      <p className="text-[9px] text-red-500 mb-2">Dit verwijdert ook alle geüploade documenten en chunks.</p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => { onDelete(c.id); setConfirmDeleteId(null); setOpen(false); }}
                          className="flex-1 text-[10px] font-bold text-white bg-red-500 hover:bg-red-600 rounded px-2 py-1 transition-colors"
                        >
                          Ja, verwijder
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(null)}
                          className="flex-1 text-[10px] font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded px-2 py-1 transition-colors"
                        >
                          Annuleer
                        </button>
                      </div>
                    </div>
                  );

                  return (
                    <div key={c.id} className={`group/item rounded-sm flex items-center gap-1 transition-colors
                      ${isActive ? "bg-[#1a365d]/5 border border-[#1a365d]/20" : "hover:bg-slate-50"}`}>
                      <button
                        onClick={() => { onSelect(c); setOpen(false); }}
                        className="flex-1 text-left px-3 py-2.5 min-w-0"
                      >
                        <p className="text-xs font-semibold text-slate-700 truncate">{c.name || t("menu.unnamed")}</p>
                        <p className="text-[9px] text-slate-400">Aangemaakt {createdAt} · {docCount} {docCount === 1 ? "document" : "documenten"}</p>
                      </button>
                      {isActive
                        ? <span className="text-[8px] font-bold text-[#1a365d]/60 uppercase tracking-widest pr-3 flex-shrink-0">Actief</span>
                        : (
                          <button
                            onClick={e => { e.stopPropagation(); setConfirmDeleteId(c.id); }}
                            className="opacity-0 group-hover/item:opacity-100 transition-opacity pr-2.5 text-slate-300 hover:text-red-400 flex-shrink-0"
                            title="Canvas verwijderen"
                          >
                            <Trash2 size={13} />
                          </button>
                        )
                      }
                    </div>
                  );
                })}
              </div>
            )}

            {canvases.length === 0 && (
              <div className="p-4 text-center">
                <p className="text-[10px] text-slate-400">Nog geen opgeslagen canvassen</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default CanvasMenu;
