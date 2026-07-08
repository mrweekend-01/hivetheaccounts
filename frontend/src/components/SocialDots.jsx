// Semáforo tri-estado: no_existe (rojo) / pendiente credenciales (ámbar) / activa (verde)
const LABELS = { facebook: "FB", instagram: "IG", tiktok: "TT" };
const STYLE = {
  no_existe: "bg-bad/20 text-bad",
  pendiente: "bg-warn/20 text-warn",
  activa: "bg-ok/20 text-ok",
};
const TITLE = { no_existe: "no existe", pendiente: "pendiente de credenciales", activa: "activa" };

export default function SocialDots({ socials }) {
  return (
    <div className="flex gap-1.5">
      {["facebook", "instagram", "tiktok"].map((p) => (
        <span key={p} title={`${p}: ${TITLE[socials[p]]}`}
          className={`inline-flex items-center justify-center w-6 h-6 rounded text-[10px] font-bold ${STYLE[socials[p]]}`}>
          {LABELS[p]}
        </span>
      ))}
    </div>
  );
}
