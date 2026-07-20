// Convierte un código ISO 3166-1 alpha-2 (ej "DE") al emoji de bandera correspondiente.
// No requiere imágenes ni librerías: los navegadores modernos renderizan el emoji
// combinando "regional indicator symbols" a partir de las letras del código.
export function countryFlag(code) {
  if (!code || code.length !== 2) return "";
  const base = 0x1f1e6; // regional indicator 'A'
  const chars = [...code.toUpperCase()].map(
    (c) => base + (c.charCodeAt(0) - 65)
  );
  return String.fromCodePoint(...chars);
}
