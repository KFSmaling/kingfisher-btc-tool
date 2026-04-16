import { Wand2 } from "lucide-react";

/** Kleine wand-knop naast een veldlabel. */
export default function WandButton({ onClick, loading, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading || disabled}
      className={`flex items-center gap-1 text-[10px] transition-colors rounded px-1 py-0.5
        ${loading ? "text-[#8dc63f] cursor-default" : "text-slate-300 hover:text-[#8dc63f] hover:bg-[#8dc63f]/8"}`}
      title="Magic Staff — AI voorstel op basis van geïndexeerde documenten"
    >
      <Wand2 size={12} className={loading ? "animate-pulse" : ""} />
    </button>
  );
}
