// Marca de la app: bisel con lámpara encendida, como el indicador de encendido de un rack.
export default function BrandMark({ size = 20 }) {
  return (
    <span className="inline-flex items-center justify-center rounded bg-hive-panel2 border border-hive-border shrink-0"
      style={{ width: size, height: size }}>
      <span className="rounded-full bg-hive-accent" style={{ width: size * 0.35, height: size * 0.35 }} />
    </span>
  );
}
