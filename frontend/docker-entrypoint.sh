#!/bin/sh
# Genera config.js con la URL del backend en tiempo de ARRANQUE del contenedor,
# no en tiempo de build. Así la misma imagen sirve para cualquier PC sin
# reconstruir: solo cambia la variable de entorno API_URL al levantar.
set -e

API_URL="${API_URL:-http://localhost:8000}"

cat > /usr/share/nginx/html/config.js << EOC
window.__API_URL__ = "${API_URL}";
EOC

echo "Frontend sirviendo con API_URL=${API_URL}"
exec nginx -g "daemon off;"
