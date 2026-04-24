import React, { useState } from "react";

/** Tag-pill voor analyse-items */
export const ALL_TAGS = [
  { key: "kans",          label: "Kans",          color: "bg-emerald-100 text-emerald-700 border-emerald-200"  },
  { key: "sterkte",       label: "Sterkte",        color: "bg-blue-100 text-blue-700 border-blue-200"          },
  { key: "bedreiging",    label: "Bedreiging",     color: "bg-red-100 text-red-700 border-red-200"             },
  { key: "zwakte",        label: "Zwakte",         color: "bg-orange-100 text-orange-700 border-orange-200"    },
  { key: "niet_relevant", label: "Niet relevant",  color: "bg-slate-100 text-slate-400 border-slate-200"       },
];
export const EXTERN_TAGS = ["kans", "bedreiging", "niet_relevant"];
export const INTERN_TAGS = ["sterkte", "zwakte", "niet_relevant"];

const TagPill = React.memo(function TagPill({ tag, onChange, allowedKeys }) {
  const tags = allowedKeys ? ALL_TAGS.filter(t => allowedKeys.includes(t.key)) : ALL_TAGS;
  const current = ALL_TAGS.find(t => t.key === tag) || ALL_TAGS[4];
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${current.color} uppercase tracking-wide whitespace-nowrap`}
      >
        {current.label}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full mt-1 z-50 bg-white rounded-lg shadow-xl border border-slate-200 py-1 min-w-[130px]">
            {tags.map(t => (
              <button key={t.key} onClick={() => { onChange(t.key); setOpen(false); }}
                className={`w-full text-left px-3 py-1.5 text-[10px] font-semibold hover:bg-slate-50 ${t.key === tag ? "text-[var(--color-primary)]" : "text-slate-600"}`}>
                {t.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
});

export default TagPill;
