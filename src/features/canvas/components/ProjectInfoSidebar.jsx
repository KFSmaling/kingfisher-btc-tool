import React from "react";
import { Building2, User, Layers, Tag, Users, ShieldCheck, FileText } from "lucide-react";

// ── Project Info Sidebar ─────────────────────────────────────────────────────
const INDUSTRY_OPTIONS = [
  "Finance", "Healthcare", "Industry", "Public", "Retail",
  "Energy", "Professional Services", "Other",
];
const TRANSFORMATION_OPTIONS = [
  "Digitaal/IT", "Cultuur & Gedrag", "Duurzaamheid (ESG)",
  "Strategische Heroriëntatie", "Fusie/Overname",
];
const ORG_SIZE_OPTIONS = ["< 100 fte", "100-500 fte", "500-2500 fte", "2500+ fte"];
const PROJECT_STATUS_OPTIONS = [
  { value: "concept",   label: "Concept",   color: "bg-slate-100 text-slate-600 border-slate-300" },
  { value: "review",    label: "In Review", color: "bg-amber-50 text-amber-700 border-amber-300"  },
  { value: "definitief",label: "Definitief",color: "bg-[#8dc63f]/20 text-[#4a7c1f] border-[#8dc63f]" },
];

function ProjectInfoSidebar({ meta, onChange }) {
  const field = (key, value) => onChange({ ...meta, [key]: value });

  return (
    <aside className="w-[280px] shrink-0 bg-white border-l border-slate-200 flex flex-col overflow-y-auto">
      <div className="px-5 py-4 border-b border-slate-100">
        <h2 className="text-[11px] font-bold text-[#1a365d] uppercase tracking-[0.15em]">Project Details</h2>
        <p className="text-[10px] text-slate-400 mt-0.5">Metadata voor analyse & benchmarks</p>
      </div>

      <div className="px-5 py-4 space-y-5 flex-1">

        {/* Klantnaam */}
        <div>
          <label className="flex items-center gap-1.5 text-[10px] font-bold text-[#1a365d] uppercase tracking-widest mb-1.5">
            <Building2 size={11} /> Klantnaam
          </label>
          <input
            type="text"
            value={meta.client_name || ""}
            onChange={e => field("client_name", e.target.value)}
            placeholder="Naam van de klant…"
            className="w-full text-sm text-slate-700 border border-slate-200 rounded-sm px-3 py-2 outline-none focus:border-[#1a365d] transition-colors placeholder-slate-300"
          />
        </div>

        {/* Lead Consultant */}
        <div>
          <label className="flex items-center gap-1.5 text-[10px] font-bold text-[#1a365d] uppercase tracking-widest mb-1.5">
            <User size={11} /> Lead Consultant
          </label>
          <input
            type="text"
            value={meta.author_name || ""}
            onChange={e => field("author_name", e.target.value)}
            placeholder="Naam van de consultant…"
            className="w-full text-sm text-slate-700 border border-slate-200 rounded-sm px-3 py-2 outline-none focus:border-[#1a365d] transition-colors placeholder-slate-300"
          />
        </div>

        {/* Branche */}
        <div>
          <label className="flex items-center gap-1.5 text-[10px] font-bold text-[#1a365d] uppercase tracking-widest mb-1.5">
            <Layers size={11} /> Branche
          </label>
          <select
            value={meta.industry || ""}
            onChange={e => field("industry", e.target.value)}
            className="w-full text-sm text-slate-700 border border-slate-200 rounded-sm px-3 py-2 outline-none focus:border-[#1a365d] transition-colors bg-white"
          >
            <option value="">Selecteer branche…</option>
            {INDUSTRY_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>

        {/* Type Transformatie */}
        <div>
          <label className="flex items-center gap-1.5 text-[10px] font-bold text-[#1a365d] uppercase tracking-widest mb-1.5">
            <Tag size={11} /> Type Transformatie
          </label>
          <select
            value={meta.transformation_type || ""}
            onChange={e => field("transformation_type", e.target.value)}
            className="w-full text-sm text-slate-700 border border-slate-200 rounded-sm px-3 py-2 outline-none focus:border-[#1a365d] transition-colors bg-white"
          >
            <option value="">Selecteer type…</option>
            {TRANSFORMATION_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>

        {/* Organisatiegrootte */}
        <div>
          <label className="flex items-center gap-1.5 text-[10px] font-bold text-[#1a365d] uppercase tracking-widest mb-1.5">
            <Users size={11} /> Organisatiegrootte
          </label>
          <select
            value={meta.org_size || ""}
            onChange={e => field("org_size", e.target.value)}
            className="w-full text-sm text-slate-700 border border-slate-200 rounded-sm px-3 py-2 outline-none focus:border-[#1a365d] transition-colors bg-white"
          >
            <option value="">Selecteer grootte…</option>
            {ORG_SIZE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>

        {/* Projectstatus */}
        <div>
          <label className="flex items-center gap-1.5 text-[10px] font-bold text-[#1a365d] uppercase tracking-widest mb-2">
            <ShieldCheck size={11} /> Projectstatus
          </label>
          <div className="flex gap-2 flex-wrap">
            {PROJECT_STATUS_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => field("project_status", meta.project_status === opt.value ? "" : opt.value)}
                className={`px-3 py-1.5 rounded-sm text-[10px] font-bold border uppercase tracking-wider transition-all
                  ${meta.project_status === opt.value
                    ? opt.color + " shadow-sm"
                    : "bg-white text-slate-400 border-slate-200 hover:border-slate-300"}`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Beschrijving */}
        <div>
          <label className="flex items-center gap-1.5 text-[10px] font-bold text-[#1a365d] uppercase tracking-widest mb-1.5">
            <FileText size={11} /> Beschrijving
          </label>
          <textarea
            value={meta.project_description || ""}
            onChange={e => field("project_description", e.target.value)}
            placeholder="Aanleiding, scope of bijzonderheden van dit traject…"
            rows={4}
            className="w-full text-sm text-slate-700 border border-slate-200 rounded-sm px-3 py-2 outline-none focus:border-[#1a365d] transition-colors placeholder-slate-300 resize-none leading-relaxed"
          />
        </div>

      </div>
    </aside>
  );
}

export default ProjectInfoSidebar;
