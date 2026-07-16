import { useState } from "react";

// Input de tags libres: Enter o coma agrega, click en × quita, Backspace en
// campo vacío borra la última. `value` es list[str], controlado por el padre.
export default function TraitsInput({ value, onChange, placeholder = "Escribe una característica y presiona Enter" }) {
  const [draft, setDraft] = useState("");

  function commit(text) {
    const trait = text.trim();
    if (!trait || value.includes(trait)) return;
    onChange([...value, trait]);
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      commit(draft);
      setDraft("");
    } else if (e.key === "Backspace" && !draft && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  }

  function handleBlur() {
    if (draft.trim()) {
      commit(draft);
      setDraft("");
    }
  }

  function remove(trait) {
    onChange(value.filter((t) => t !== trait));
  }

  return (
    <div>
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {value.map((t) => (
            <span key={t} className="tape">
              {t}
              <button type="button" className="text-hive-muted hover:text-bad leading-none"
                onClick={() => remove(t)} aria-label={`Quitar ${t}`}>×</button>
            </span>
          ))}
        </div>
      )}
      <input className="input" value={draft} placeholder={placeholder}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur} />
    </div>
  );
}
