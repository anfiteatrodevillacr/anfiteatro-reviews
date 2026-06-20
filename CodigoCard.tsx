import { Sparkles } from "lucide-react";

interface Props {
  codigo: string;
  titulo: string;
  valido: string;
}

export function CodigoCard({ codigo, titulo, valido }: Props) {
  return (
    <div className="rounded-3xl bg-gradient-to-br from-brand-500 via-brand-600 to-brand-700 p-6 sm:p-7 text-white shadow-soft">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5" />
        <p className="text-xs font-black uppercase tracking-widest">{titulo}</p>
      </div>
      <div className="rounded-2xl bg-white/10 ring-1 ring-white/20 backdrop-blur px-5 py-4 flex items-center justify-between gap-3">
        <code className="font-mono text-base sm:text-lg font-black tracking-wider truncate">{codigo}</code>
        <CopyInline text={codigo} />
      </div>
      <p className="mt-3 text-xs font-medium text-white/90">{valido}</p>
    </div>
  );
}

function CopyInline({ text }: { text: string }) {
  return (
    <button
      type="button"
      onClick={() => navigator.clipboard?.writeText(text)}
      className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-white/15 hover:bg-white/25 transition"
      title="Copiar"
    >
      📋
    </button>
  );
}