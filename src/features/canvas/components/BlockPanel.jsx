import React, { useState } from "react";
import { Zap, CheckSquare, List, X, Plus, Edit3, Trash2, FileText, BookOpen, CheckCircle2 } from "lucide-react";
import { useLang } from "../../../i18n";
// TIPS_DATA wordt geïmporteerd van ./TipsModal
import { TIPS_DATA } from "./TipsModal";
// PILLAR_SUBTABS van BlockCard
import { PILLAR_SUBTABS } from "./BlockCard";

// ── Sliding Panel ────────────────────────────────────────────────────────────
function BlockPanel({ block, docs, insights, bullets, canvasId, userId, onClose, onDocsChange, onInsightAccept, onInsightReject, onMoveToBullets, onDeleteBullet, onAddBullet, onShowTips }) {
  const { t } = useLang();
  const [activeTab, setActiveTab] = useState("canvas");
  const [editingIdx, setEditingIdx] = useState(null);
  const [editVal, setEditVal] = useState("");
  const [newBullet, setNewBullet] = useState("");
  const [addingBullet, setAddingBullet] = useState(false);
  const [editedInsightTexts, setEditedInsightTexts] = useState({});
  const [activeSubTab, setActiveSubTab] = useState(() => block.subTabs?.[0]?.id || "current");

  const blockInsights = insights[block.id] || [];
  const blockBullets = bullets[block.id] || [];
  const pendingInsights = blockInsights.filter(i => i.status === "pending");
  const acceptedInsights = blockInsights.filter(i => i.status === "accepted");

  const TABS = [
    { id: "extract",  labelKey: "panel.tab.extract", icon: Zap },
    { id: "review",   labelKey: "panel.tab.review",  icon: CheckSquare },
    { id: "canvas",   labelKey: "panel.tab.canvas",  icon: List },
  ];

  return (
    <aside className="fixed right-0 top-0 bottom-0 w-[520px] bg-white shadow-[-20px_0_60px_rgba(0,0,0,0.12)] z-30 flex flex-col">
      {/* Panel header */}
      <div className="px-8 py-5 bg-[#1a365d] flex items-center justify-between shrink-0">
        <div>
          <h2 className="text-white font-black text-lg uppercase tracking-tight">{t(block.titleKey)}</h2>
          <p className="text-[#1a365d] text-[10px] uppercase tracking-widest mt-0.5">{t(block.subKey)}</p>
        </div>
        <div className="flex items-center gap-3">
          {TIPS_DATA.nl[block.id] && (
            <button
              onClick={() => onShowTips(block.id)}
              className="flex items-center gap-1.5 text-white/40 hover:text-[#2c7a4b] transition-colors"
              title={t("tips.panel.button")}
            >
              <BookOpen size={15} />
              <span className="text-[9px] font-bold uppercase tracking-widest">Tips</span>
            </button>
          )}
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors ml-1"><X size={22} /></button>
        </div>
      </div>

      {/* Tab nav */}
      <div className="flex border-b border-slate-100 bg-slate-50 shrink-0">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-4 flex flex-col items-center gap-1 text-[10px] font-black uppercase tracking-widest border-b-2 transition-all
              ${activeTab === tab.id ? "border-orange-500 text-[#001f33] bg-white" : "border-transparent text-slate-500 hover:text-[#001f33]"}`}
          >
            <tab.icon size={16} />
            {t(tab.labelKey)}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto p-8">

        {/* 1. EXTRACT */}
        {activeTab === "extract" && (
          <div className="space-y-4">
            {pendingInsights.length === 0 && acceptedInsights.length === 0 && (
              <div className="text-center py-16">
                <Zap size={32} className="mx-auto text-slate-200 mb-4" />
                <p className="text-[10px] text-slate-400 uppercase tracking-widest">{t("extract.empty")}</p>
                <p className="text-[9px] text-slate-300 mt-2">Upload documenten via Het Dossier</p>
              </div>
            )}

            {/* Counter */}
            {(pendingInsights.length > 0 || acceptedInsights.length > 0) && (
              <div className="flex gap-4 pb-3 border-b border-slate-100">
                <span className="text-[9px] font-black uppercase tracking-widest text-orange-500">{t("extract.pending", { n: pendingInsights.length })}</span>
                <span className="text-[9px] font-black uppercase tracking-widest text-green-600">{t("extract.accepted", { n: acceptedInsights.length })}</span>
              </div>
            )}

            {/* Pending insights — accept or reject only */}
            {pendingInsights.map(ins => (
              <div key={ins.id} className="p-5 bg-slate-50 border border-slate-200 border-l-4 border-l-[#00AEEF] rounded-sm">
                <p className="text-sm text-slate-800 leading-relaxed mb-4">{ins.text}</p>
                {ins.source && (
                  <p className="text-[9px] text-slate-400 mb-3 italic">{t("extract.source")} {ins.source}</p>
                )}
                <div className="flex gap-4 pt-3 border-t border-slate-100">
                  <button
                    onClick={() => onInsightAccept(block.id, ins.id)}
                    className="flex items-center gap-1.5 text-[10px] font-black text-green-600 uppercase tracking-widest hover:underline"
                  >
                    {t("extract.accept")}
                  </button>
                  <button
                    onClick={() => onInsightReject(block.id, ins.id)}
                    className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-red-500"
                  >
                    {t("extract.reject")}
                  </button>
                </div>
              </div>
            ))}

            {/* Accepted summary cards */}
            {acceptedInsights.length > 0 && (
              <div className="space-y-2">
                {acceptedInsights.map(ins => (
                  <div key={ins.id} className="flex items-start gap-3 px-4 py-3 bg-green-50 border border-green-200 rounded-sm">
                    <CheckCircle2 size={14} className="text-green-500 shrink-0 mt-0.5" />
                    <span className="text-xs text-slate-700 leading-snug flex-1">{ins.text}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Go to review — only when no more pending */}
            {pendingInsights.length === 0 && acceptedInsights.length > 0 && (
              <button
                onClick={() => setActiveTab("review")}
                className="w-full py-3 bg-[#001f33] text-white text-[10px] font-black uppercase tracking-widest rounded-sm hover:bg-[#00AEEF] transition-colors mt-2"
              >
                {t("extract.go.review", { n: acceptedInsights.length })}
              </button>
            )}
          </div>
        )}

        {/* 3. REVIEW */}
        {activeTab === "review" && (
          <div className="space-y-4">
            {acceptedInsights.length === 0 && (
              <div className="text-center py-16">
                <CheckSquare size={32} className="mx-auto text-slate-200 mb-4" />
                <p className="text-[10px] text-slate-400 uppercase tracking-widest">{t("review.empty")}</p>
                <button onClick={() => setActiveTab("extract")} className="mt-4 text-xs text-[#1a365d] font-bold hover:underline">{t("review.back")}</button>
              </div>
            )}
            {acceptedInsights.length > 0 && (
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                  {t("review.subtitle", { n: acceptedInsights.length })}
                </p>
                <button
                  onClick={() => {
                    acceptedInsights.forEach(ins => {
                      const text = (editedInsightTexts[ins.id] ?? ins.text).trim();
                      if (text) onMoveToBullets(block.id, { ...ins, text });
                    });
                  }}
                  className="text-[9px] font-black text-[#1a365d] hover:text-orange-500 uppercase tracking-widest transition-colors"
                >
                  {t("review.all.to.canvas")}
                </button>
              </div>
            )}
            {acceptedInsights.map(ins => (
              <div key={ins.id} className="p-4 border border-slate-200 bg-white rounded-sm shadow-sm space-y-3">
                {ins.source && (
                  <div className="flex items-center gap-1.5">
                    <FileText size={11} className="text-slate-300 shrink-0" />
                    <span className="text-[9px] text-slate-400 italic">{ins.source}</span>
                  </div>
                )}
                <textarea
                  value={editedInsightTexts[ins.id] ?? ins.text}
                  onChange={e => setEditedInsightTexts(prev => ({ ...prev, [ins.id]: e.target.value }))}
                  rows={3}
                  className="w-full text-sm text-slate-800 leading-relaxed border border-slate-200 rounded-sm p-3 resize-none focus:outline-none focus:border-[#1a365d] bg-slate-50 transition-colors"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      const text = (editedInsightTexts[ins.id] ?? ins.text).trim();
                      if (text) onMoveToBullets(block.id, { ...ins, text });
                    }}
                    className="flex-1 py-2.5 bg-[#1a365d] text-white text-[10px] font-bold uppercase tracking-widest rounded-sm hover:bg-[#2c7a4b] transition-colors"
                  >
                    {t("review.to.canvas")}
                  </button>
                  <button
                    onClick={() => onInsightReject(block.id, ins.id)}
                    className="px-4 py-2.5 text-[10px] font-black text-slate-400 hover:text-red-500 uppercase tracking-widest border border-slate-200 rounded-sm hover:border-red-200 transition-colors"
                  >
                    {t("review.delete")}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 4. CANVAS */}
        {activeTab === "canvas" && (
          <div className="space-y-3">

            {block.hasSubs ? (
              /* ── Pillar blocks: Current / To-Be / Change sub-tabs ── */
              <>
                {/* Sub-tab nav */}
                <div className="flex gap-2 pb-4 border-b border-slate-100">
                  {(block.subTabs || PILLAR_SUBTABS).map(st => {
                    const count = blockBullets.filter(b => b.subtab === st.id).length;
                    const isActive = activeSubTab === st.id;
                    return (
                      <button
                        key={st.id}
                        onClick={() => { setActiveSubTab(st.id); setAddingBullet(false); setEditingIdx(null); }}
                        className={`flex-1 py-2 px-3 rounded-sm border text-[9px] font-black uppercase tracking-widest transition-all flex flex-col items-center gap-0.5
                          ${isActive ? st.activeBg + " " + st.color.split(" ")[1] : "border-slate-100 text-slate-400 bg-white hover:border-slate-200"}`}
                      >
                        <div className={`w-1.5 h-1.5 rotate-45 mb-0.5 ${isActive ? st.dot : "bg-slate-300"}`} />
                        {t(st.labelKey)}
                        {count > 0 && <span className="text-[8px]">{count}</span>}
                      </button>
                    );
                  })}
                </div>

                {/* Sub-tab bullet list */}
                {(() => {
                  const st = (block.subTabs || PILLAR_SUBTABS).find(s => s.id === activeSubTab) || (block.subTabs || PILLAR_SUBTABS)[0];
                  const stBullets = blockBullets.map((b, i) => ({ ...b, _idx: i })).filter(b => b.subtab === activeSubTab);
                  return (
                    <div className="space-y-2">
                      {stBullets.map(bullet => {
                        const i = bullet._idx;
                        const bulletText   = bullet.text;
                        const bulletSource = bullet.source;
                        return (
                          <div key={i} className="group flex items-start gap-3 p-4 bg-white border border-slate-200 rounded-sm hover:shadow-sm transition-all">
                            <div className={`mt-1.5 w-2 h-2 rotate-45 shrink-0 ${st.dot}`} />
                            <div className="flex-1 min-w-0">
                              {editingIdx === i ? (
                                <div className="flex gap-2">
                                  <input
                                    autoFocus
                                    value={editVal}
                                    onChange={e => setEditVal(e.target.value)}
                                    className="flex-1 text-sm border-b border-[#1a365d] outline-none text-slate-800 bg-transparent"
                                    onKeyDown={e => {
                                      if (e.key === "Enter") { onMoveToBullets(block.id, { text: editVal, source: bulletSource, subtab: activeSubTab }, i, true); setEditingIdx(null); }
                                      if (e.key === "Escape") setEditingIdx(null);
                                    }}
                                  />
                                  <button onClick={() => { onMoveToBullets(block.id, { text: editVal, source: bulletSource, subtab: activeSubTab }, i, true); setEditingIdx(null); }} className="text-[10px] text-green-600 font-bold">✓</button>
                                  <button onClick={() => setEditingIdx(null)} className="text-[10px] text-slate-400 font-bold">✕</button>
                                </div>
                              ) : (
                                <span className="text-[14px] text-slate-700 leading-snug block">{bulletText}</span>
                              )}
                              {bulletSource && editingIdx !== i && (
                                <div className="flex items-center gap-1 mt-1">
                                  <FileText size={10} className="text-slate-300 shrink-0" />
                                  <span className="text-[10px] text-slate-500 italic truncate">{bulletSource}</span>
                                </div>
                              )}
                            </div>
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 items-center">
                              {/* Move to other sub-tab */}
                              <select
                                value={activeSubTab}
                                onChange={e => onMoveToBullets(block.id, { text: bulletText, source: bulletSource, subtab: e.target.value }, i, true)}
                                className="text-[9px] text-slate-400 bg-white border border-slate-200 rounded-sm px-1 py-0.5 outline-none hover:border-[#1a365d] cursor-pointer"
                                title={t("canvas.move.to")}
                              >
                                {(block.subTabs || PILLAR_SUBTABS).map(s => (
                                  <option key={s.id} value={s.id} disabled={s.id === activeSubTab}>{t(s.labelKey)}</option>
                                ))}
                              </select>
                              <button onClick={() => { setEditingIdx(i); setEditVal(bulletText); }} className="text-slate-300 hover:text-[#2c7a4b]"><Edit3 size={14} /></button>
                              <button onClick={() => onDeleteBullet(block.id, i)} className="text-slate-300 hover:text-red-500"><Trash2 size={14} /></button>
                            </div>
                          </div>
                        );
                      })}

                      {addingBullet && (
                        <div className="flex items-center gap-2 p-3 border border-dashed border-[#1a365d] rounded-sm">
                          <div className={`w-2 h-2 rotate-45 shrink-0 ${st.dot}`} />
                          <textarea
                            autoFocus
                            value={newBullet}
                            onChange={e => setNewBullet(e.target.value)}
                            placeholder={`${t("canvas.add.manual")} ${t(st.labelKey).toLowerCase()}…`}
                            rows={3}
                            className="flex-1 text-sm outline-none text-slate-800 resize-none leading-relaxed"
                            onKeyDown={e => {
                              if (e.key === "Enter" && e.metaKey && newBullet.trim()) {
                                onAddBullet(block.id, newBullet.trim(), activeSubTab);
                                setNewBullet("");
                                setAddingBullet(false);
                              }
                              if (e.key === "Escape") { setAddingBullet(false); setNewBullet(""); }
                            }}
                          />
                          <button onClick={() => setAddingBullet(false)} className="text-slate-300 hover:text-red-500"><X size={14} /></button>
                        </div>
                      )}

                      {stBullets.length === 0 && !addingBullet && (
                        <div className="text-center py-8">
                          <div className={`w-4 h-4 rotate-45 mx-auto mb-3 ${st.dot} opacity-20`} />
                          <p className="text-[10px] text-slate-400 uppercase tracking-widest">{t("canvas.empty.sub", { label: t(st.labelKey) })}</p>
                          <p className="text-[9px] text-slate-300 mt-1">{t("canvas.empty.hint")}</p>
                        </div>
                      )}

                      <button
                        onClick={() => setAddingBullet(true)}
                        className="flex items-center gap-1 text-[10px] font-black text-[#1a365d] hover:text-orange-500 uppercase tracking-widest transition-colors pt-1"
                      >
                        <Plus size={14} /> {t("canvas.add.manual")}
                      </button>
                    </div>
                  );
                })()}
              </>
            ) : (
              /* ── Non-pillar blocks: flat list (unchanged) ── */
              <>
                <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                  <span className="text-[9px] font-black text-[#001f33] uppercase tracking-widest">{t("canvas.bullets.count", { n: blockBullets.length })}</span>
                  {blockBullets.length < 7 && (
                    <button
                      onClick={() => setAddingBullet(true)}
                      className="flex items-center gap-1 text-[10px] font-black text-[#1a365d] hover:text-orange-500 uppercase tracking-widest transition-colors"
                    >
                      <Plus size={14} /> {t("canvas.add.manual")}
                    </button>
                  )}
                </div>

                {blockBullets.map((bullet, i) => {
                  const bulletText   = typeof bullet === "string" ? bullet : bullet.text;
                  const bulletSource = typeof bullet === "string" ? null  : bullet.source;
                  return (
                    <div key={i} className="group flex items-start gap-3 p-4 bg-white border border-slate-200 rounded-sm hover:shadow-sm transition-all">
                      <div className="mt-1.5 w-2 h-2 bg-orange-500 rotate-45 shrink-0" />
                      <div className="flex-1 min-w-0">
                        {editingIdx === i ? (
                          <div className="flex flex-col gap-2 w-full">
                            <textarea
                              autoFocus
                              value={editVal}
                              onChange={e => setEditVal(e.target.value)}
                              rows={3}
                              className="w-full text-sm border border-[#1a365d] rounded-sm outline-none text-slate-800 bg-slate-50 p-2 resize-none leading-relaxed"
                              onKeyDown={e => {
                                if (e.key === "Enter" && e.metaKey) { onMoveToBullets(block.id, { text: editVal, source: bulletSource }, i, true); setEditingIdx(null); }
                                if (e.key === "Escape") setEditingIdx(null);
                              }}
                            />
                            <div className="flex gap-2">
                              <button onClick={() => { onMoveToBullets(block.id, { text: editVal, source: bulletSource }, i, true); setEditingIdx(null); }} className="text-[10px] px-3 py-1 bg-[#1a365d] text-white rounded-sm font-bold">Opslaan</button>
                              <button onClick={() => setEditingIdx(null)} className="text-[10px] px-3 py-1 border border-slate-200 text-slate-400 rounded-sm font-bold">Annuleer</button>
                            </div>
                          </div>
                        ) : (
                          <span className="text-sm text-slate-700 leading-snug block">{bulletText}</span>
                        )}
                        {bulletSource && editingIdx !== i && (
                          <div className="flex items-center gap-1 mt-1">
                            <FileText size={10} className="text-slate-300 shrink-0" />
                            <span className="text-[10px] text-slate-500 italic truncate">{bulletSource}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        <button onClick={() => { setEditingIdx(i); setEditVal(bulletText); }} className="text-slate-300 hover:text-[#2c7a4b]"><Edit3 size={14} /></button>
                        <button onClick={() => onDeleteBullet(block.id, i)} className="text-slate-300 hover:text-red-500"><Trash2 size={14} /></button>
                      </div>
                    </div>
                  );
                })}

                {addingBullet && (
                  <div className="flex flex-col gap-2 p-3 border border-dashed border-[#1a365d] rounded-sm">
                    <textarea
                      autoFocus
                      value={newBullet}
                      onChange={e => setNewBullet(e.target.value)}
                      placeholder={t("canvas.placeholder")}
                      rows={3}
                      className="w-full text-sm outline-none text-slate-800 resize-none leading-relaxed bg-transparent"
                      onKeyDown={e => {
                        if (e.key === "Enter" && e.metaKey && newBullet.trim()) {
                          onAddBullet(block.id, newBullet.trim(), null);
                          setNewBullet("");
                          setAddingBullet(false);
                        }
                        if (e.key === "Escape") { setAddingBullet(false); setNewBullet(""); }
                      }}
                    />
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] text-slate-300">⌘ + Enter om op te slaan</span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => { if (newBullet.trim()) { onAddBullet(block.id, newBullet.trim(), null); setNewBullet(""); setAddingBullet(false); } }}
                          className="text-[10px] px-3 py-1 bg-[#1a365d] text-white rounded-sm font-bold"
                        >Toevoegen</button>
                        <button onClick={() => { setAddingBullet(false); setNewBullet(""); }} className="text-slate-300 hover:text-red-500"><X size={14} /></button>
                      </div>
                    </div>
                  </div>
                )}

                {blockBullets.length === 0 && !addingBullet && (
                  <div className="text-center py-12">
                    <List size={28} className="mx-auto text-slate-200 mb-3" />
                    <p className="text-[10px] text-slate-400 uppercase tracking-widest">{t("canvas.empty.flat")}</p>
                    <p className="text-[9px] text-slate-300 mt-1">{t("canvas.empty.flat.hint")}</p>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}

export default BlockPanel;
