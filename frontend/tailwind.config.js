/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        // Panel de operador en modo claro: gris-azulado + tarjetas blancas, acento índigo
        hive: {
          bg: "#f4f5f7",
          panel: "#ffffff",
          panel2: "#eceef2",
          border: "#d7dbe3",
          text: "#1b1e24",
          muted: "#6b7280",
          accent: "#4c63d6",
          accentdim: "#37469e",
        },
        ok: "#16a34a",     // verde operativo / hecho (oscurecido para leerse en blanco)
        bad: "#dc2626",    // rojo inoperativo / faltante
        warn: "#d97706",   // en revisión / en proceso
        paused: "#7c3aed", // morado, timer de humanización pausado a mitad de camino
      },
      fontFamily: {
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
    },
  },
  plugins: [],
};
