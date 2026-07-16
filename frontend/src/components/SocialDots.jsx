// Semáforo tri-estado: no_existe (rojo) / pendiente credenciales (ámbar) / activa (verde)
const LABELS = { facebook: "FB", instagram: "IG", tiktok: "TT" };
const STATE_CLASS = { no_existe: "stop", pendiente: "work", activa: "go" };
const TITLE = { no_existe: "no existe", pendiente: "pendiente de credenciales", activa: "activa" };

export default function SocialDots({ socials }) {
  return (
    <div className="flex gap-1.5">
      {["facebook", "instagram", "tiktok"].map((p) => (
        <span key={p} title={`${p}: ${TITLE[socials[p]]}`} className={`port ${STATE_CLASS[socials[p]]}`}>
          <span className="tag">{LABELS[p]}</span>
          <span className="lamp" />
        </span>
      ))}
    </div>
  );
}
