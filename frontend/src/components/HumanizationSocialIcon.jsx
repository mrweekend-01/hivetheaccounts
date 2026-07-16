const PLATFORM_LABEL = { facebook: "FB", instagram: "IG", tiktok: "TT" };

const STATE_CLASS = {
  sin_credenciales: "",
  pendiente: "stop",
  en_proceso: "work",
  hecho: "go",
};

const TITLE = {
  sin_credenciales: "Sin credenciales todavía",
  pendiente: "Iniciar humanización",
  en_proceso: "Humanizando…",
  hecho: "Humanización hecha",
};

function fmt(sec) {
  const m = Math.floor(sec / 60), s = sec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

// Botón rectangular de Humanización: pendiente respira en rojo invitando al
// clic, en_proceso respira en ámbar mientras corre el conteo, hecho queda con
// un brillo verde fijo, y sin_credenciales se ve apagado.
export default function HumanizationSocialIcon({ platform, state, remainingSeconds, onStart }) {
  const clickable = state === "pendiente" && typeof onStart === "function";
  return (
    <button type="button" disabled={!clickable} title={TITLE[state]}
      onClick={clickable ? onStart : undefined}
      className={`beacon ${STATE_CLASS[state]} ${clickable ? "" : "cursor-default"}`}>
      <span className="tag">{PLATFORM_LABEL[platform]}</span>
      <span className="state">
        {state === "sin_credenciales" && "–"}
        {state === "pendiente" && "Iniciar"}
        {state === "en_proceso" && fmt(remainingSeconds)}
        {state === "hecho" && "✓ Hecho"}
      </span>
    </button>
  );
}
