import { useState } from "react";

// Recuadro con la data + botón de copiar a un click
export default function CopyField({ label, value, mono = true }) {
  const [copied, setCopied] = useState(false);
  const shown = value ?? "—";

  async function copy() {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch { /* clipboard bloqueado */ }
  }

  return (
    <div>
      <div className="label">{label}</div>
      <button onClick={copy} disabled={!value}
        className="w-full group flex items-center justify-between gap-2 rounded-md
                   bg-hive-bg border border-hive-border px-3 py-2 text-left
                   hover:border-hive-accent transition-colors disabled:hover:border-hive-border">
        <span className={`truncate ${mono ? "font-mono" : ""} text-sm`}>{shown}</span>
        <span className={`text-xs shrink-0 ${copied ? "text-ok" : "text-hive-muted group-hover:text-hive-accent"}`}>
          {copied ? "copiado ✓" : "copiar"}
        </span>
      </button>
    </div>
  );
}
