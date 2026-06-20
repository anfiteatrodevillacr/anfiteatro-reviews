import { useState } from "react";
import { Check } from "lucide-react";

interface Props {
  label: string;
  selected: boolean;
  onClick: () => void;
  tone?: "yes" | "no";
}

export function YesNoButton({ label, selected, onClick, tone = "yes" }: Props) {
  const colors = tone === "yes"
    ? "bg-emerald-600 hover:bg-emerald-500 text-white"
    : "bg-rose-600 hover:bg-rose-500 text-white";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-2xl px-5 py-4 text-base font-black transition-all active:scale-[0.98] flex items-center justify-center gap-2 ${
        selected ? `${colors} shadow-soft` : "bg-white ring-1 ring-ink-100 text-ink-900 hover:bg-ink-50"
      }`}
    >
      {selected && <Check className="w-5 h-5" />}
      {label}
    </button>
  );
}