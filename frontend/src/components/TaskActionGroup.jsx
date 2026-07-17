const PLATFORM_TAG = { facebook: "FB", instagram: "IG", tiktok: "TT" };

const FIELDS = [
  { key: "liked", label: "Like" },
  { key: "shared", label: "Comp." },
  { key: "commented", label: "Coment." },
];

// Grupo de 3 casillas (like/compartido/comentario) para una red social dentro
// de una fila de Tasks. Sin onToggle se vuelve de solo lectura (historial).
export default function TaskActionGroup({ platform, active, liked, shared, commented, onToggle }) {
  const values = { liked, shared, commented };
  const interactive = active && typeof onToggle === "function";
  return (
    <div className={`trio-group ${active ? "" : "off"}`}
      title={active ? undefined : "Sin credenciales activas"}>
      <span className="trio-tag">{PLATFORM_TAG[platform]}</span>
      {FIELDS.map((f) => (
        <button key={f.key} type="button" className={`trio-pill ${values[f.key] ? "on" : ""}`}
          disabled={!interactive}
          onClick={interactive ? () => onToggle(f.key) : undefined}>
          {f.label}
        </button>
      ))}
    </div>
  );
}
