/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        // Paleta HackTheHive: negro panal + ámbar
        hive: {
          bg: "#0d0f12",
          panel: "#15181d",
          panel2: "#1c2027",
          border: "#2a2f38",
          text: "#e6e8ec",
          muted: "#8b929e",
          amber: "#f5a623",
          amberdim: "#b9791a",
        },
        ok: "#22c55e",     // verde operativo / hecho
        bad: "#ef4444",    // rojo inoperativo / faltante
        warn: "#eab308",   // en revisión / en proceso
      },
      fontFamily: {
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
    },
  },
  plugins: [],
};
