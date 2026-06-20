import { useState } from "react";
import { Copy, Check } from "lucide-react";

interface Props {
  text: string;
  label?: string;
  className?: string;
  variant?: "ghost" | "primary";
}

export function CopyButton({ text, label = "Copiar link", className = "", variant = "ghost" }: Props) {
  const [copied, setCopied] = useState(false);

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  const base = variant === "primary" ? "btn-primary" : "btn-ghost";

  return (
    <button type="button" onClick={onCopy} className={`${base} ${className}`}>
      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
      {copied ? "✓ Copiado" : label}
    </button>
  );
}