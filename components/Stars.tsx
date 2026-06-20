import { useState } from "react";

interface Props {
  value: number;
  onChange: (n: number) => void;
  size?: "sm" | "md" | "lg";
  label?: string;
}

export function Stars({ value, onChange, size = "lg", label }: Props) {
  const [hover, setHover] = useState(0);
  const text = size === "sm" ? "text-xl" : size === "md" ? "text-2xl" : "text-3xl sm:text-4xl";
  const filled = hover || value;

  return (
    <div className="flex flex-col items-center gap-2">
      {label && <p className="pill">{label}</p>}
      <div className="flex gap-1.5" role="radiogroup" aria-label={label ?? "Estrellas"}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            className={`star ${text} ${n <= filled ? "star-filled" : "star-empty"}`}
            aria-label={`${n} ${n === 1 ? "estrella" : "estrellas"}`}
            aria-checked={value === n}
            role="radio"
          >
            ★
          </button>
        ))}
      </div>
    </div>
  );
}