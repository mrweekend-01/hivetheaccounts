import axios from "axios";

const api = axios.create({
  // En producción (Docker con nginx) usa window.__API_URL__, escrito por
  // docker-entrypoint.sh al arrancar. En desarrollo (npm run dev) usa
  // VITE_API_URL del .env, como siempre.
  baseURL: window.__API_URL__ || import.meta.env.VITE_API_URL || "http://localhost:8000",
});

// Inyecta el token en cada request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("hth_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Si el token expira, limpia y manda a login
api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("hth_token");
      if (!location.pathname.startsWith("/login")) location.href = "/login";
    }
    return Promise.reject(err);
  }
);

export default api;
