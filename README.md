# Hack the Accounts — HTH

App web interna para gestionar cuentas de redes sociales, proxys por celular y el flujo diario de humanización. Reemplaza el control en Excel.

Stack: **FastAPI + PostgreSQL + React + Tailwind** (mismo stack que MediFlow).

## Módulos

- **Cuentas** — CRUD completo, tabla con búsqueda y filtros (red social / estado / celular), semáforo de redes **tri-estado** (rojo = no existe, ámbar = existe pero sin credenciales capturadas todavía, verde = lista), modal de detalle con copiar cada dato a un click, export a Excel/CSV. Cada cuenta guarda también la identidad del perfil (nombre de persona, fecha de nacimiento, número de orden) y cada red social puede llevar su propio link de perfil y número de slot en el celular. Cada cuenta es simplemente correo + contraseña (no hay 2FA).
- **Proxys por celular** — 20 celulares, cada uno con **un proxy único** (1:1) y un alias corto opcional (nickname). Estado verde (operativo) / rojo (inoperativo), editable.
- **Humanización** — el temporizador de 30 min corre **por red social individual**, no por cuenta completa (un celular puede tener Facebook e Instagram avanzando en paralelo, cada uno con su propio reloj). Notificación del navegador al terminar, y botón de reinicio global (o por celular).
- **Usuarios** — 3 roles: `admin` (todo), `editor` (CRUD + ver contraseñas), `operador` (ver, cambiar estado y notas; **no** ve contraseñas).

## Seguridad de credenciales

- Las contraseñas de **login** de los 3 usuarios se guardan **hasheadas** (bcrypt): no se recuperan, solo se comparan.
- Las credenciales de **correo / redes / proxy** se guardan **cifradas** (Fernet) porque hay que leerlas de vuelta. La clave `FERNET_KEY` vive solo en el `.env` del servidor; sin ella nadie lee esas contraseñas aunque vea la base de datos.
- **No pierdas la `FERNET_KEY`**: si la cambias, las credenciales ya guardadas dejan de descifrarse.

---

## Arranque local (recomendado para desarrollar con Claude Code en VS Code)

Requisitos ya instalados en tu PC: Python 3.10+, Node 18+, PostgreSQL.

### 1) Base de datos

Crea la base de datos y el usuario en `psql` (ajusta la contraseña):

```sql
CREATE USER hth WITH PASSWORD 'tu_pass';
CREATE DATABASE hth_accounts OWNER hth;
GRANT ALL PRIVILEGES ON DATABASE hth_accounts TO hth;
```

### 2) Backend

```bash
cd backend
python -m venv .venv
# Windows:
.venv\Scripts\activate
# macOS/Linux:
source .venv/bin/activate

pip install -r requirements.txt
```

Crea un archivo `.env` dentro de `backend/` (así no repites las variables cada vez que abres una terminal nueva):

```dotenv
DATABASE_URL=postgresql://hth:tu_pass@localhost:5432/hth_accounts
SECRET_KEY=pon_aqui_un_hex_de_64_caracteres
FERNET_KEY=pon_aqui_una_fernet_key
CORS_ORIGINS=http://localhost:5173
```

Genera las dos claves:
```bash
python -c "import secrets; print(secrets.token_hex(32))"                                    # -> SECRET_KEY
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"    # -> FERNET_KEY
```

Levanta la base de datos y el servidor:
```bash
alembic upgrade head         # crea todas las tablas
python -m app.seed           # crea el admin inicial
uvicorn app.main:app --reload
```

API disponible en `http://localhost:8000`, documentación interactiva en `http://localhost:8000/docs`.

**Usuario inicial:** `alvaro` / `admin123` — cámbialo desde el módulo Usuarios tras el primer login.

### 3) Frontend

En otra terminal:
```bash
cd frontend
npm install
echo "VITE_API_URL=http://localhost:8000" > .env
npm run dev
```

Abre `http://localhost:5173`.

### Acceso desde otra PC en tu misma red

Levanta el backend con `--host 0.0.0.0` (`uvicorn app.main:app --reload --host 0.0.0.0`), agrega tu IP de red a `CORS_ORIGINS` en el `.env` del backend (ej. `http://localhost:5173,http://192.168.x.x:5173`), y en el `.env` del frontend apunta `VITE_API_URL` a esa misma IP en vez de `localhost`.

---

## Importar datos desde el Excel (Cuentas_boxphone.xlsx)

Hay un script que lee el Excel real de HTH y crea todo (celulares, proxys, cuentas, redes sociales) de la forma más fiel posible a los datos originales.

```bash
cd backend
# con el venv activo y el .env ya configurado
python -m app.scripts.import_excel "C:\ruta\a\Cuentas_boxphone.xlsx"
```

Qué hace, en orden:

1. Lee los nicknames de celular (fuente de verdad: hoja "Resumen Facebook", ej. CEL 1 → YVK).
2. Crea los 20 celulares con su proxy (hoja "proxys", parseando el string `ip:puerto:usuario:contraseña`).
3. Crea una cuenta (persona) por cada fila de "Correos": correo, contraseña, nombre de perfil, fecha de nacimiento, número de orden, y el celular asignado si el texto es reconocible.
4. Marca como **"pendiente de credenciales"** cada red social que la hoja "Correos" señala con "Sí" pero sin usuario/contraseña propios (Instagram/TikTok, mayormente).
5. Aplica el detalle real de Facebook (usuario, contraseña, slot, link del perfil) cruzando por nombre de persona contra "Correos".

**Reglas de decisión ya aplicadas** (para que sepas qué esperar al revisar):

- Si el celular en "Correos" viene ambiguo (vacío, `?`, o mezclado como "Cel 6 JST") → la cuenta se crea **sin celular asignado**, con el texto original guardado en las notas para que lo corrijas a mano.
- Si una fila de "Facebook" no matchea con exactamente una persona en "Correos" por nombre → **no se inventa una cuenta** (no hay correo válido de dónde partir). El script imprime esas filas al final para que las revises y decidas dónde van.
- Si dos filas de "Correos" comparten el mismo correo (error de tipeo en el Excel) → se importan **ambas**, la segunda con un sufijo en el correo y una nota marcando el duplicado, para que decidas cuál es la correcta.
- Los identificadores "PC 5".."PC 20" que aparecen en la hoja "Facebook" se tratan como el mismo celular que "CEL 5".."CEL 20" (confirmado que no son máquinas aparte).

Al terminar, el script imprime un resumen: cuántos correos procesó, cuántos duplicados encontró, cuántas cuentas de Facebook aplicó con credenciales reales, y la lista de filas que no pudo enlazar. Esa lista final es tu checklist de revisión manual.

---

## Arranque con Docker (para más adelante, cuando quieras desplegarlo)

Requisitos: Docker y Docker Compose.

```bash
cp .env.example .env
openssl rand -hex 32                                            # -> SECRET_KEY
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"   # -> FERNET_KEY
docker compose up --build
```

Frontend en `http://localhost:5173`, API en `http://localhost:8000/docs`. El backend corre migraciones y siembra el admin al iniciar.

---

## Despliegue para el equipo (GitHub + Docker + actualización automática)

Idea: tú desarrollas y pruebas en tu PC (como en la sección de arriba). Cuando algo queda listo, subes el código a GitHub. Un flujo automático (GitHub Actions) arma las imágenes Docker y las publica en `ghcr.io` (el registro de imágenes de GitHub, gratis). La PC de Roberto **nunca ve el código fuente** — solo descarga esas imágenes ya listas, y un contenedor llamado Watchtower las mantiene actualizadas solo, sin que él tenga que hacer nada.

### Primera vez (setup)

1. **Crea un repositorio privado en GitHub** (ej. `hack-the-accounts`).
2. **Sube el código** desde tu PC:
   ```bash
   cd D:\AppHacktheHive\hack-the-accounts
   git init
   git add .
   git commit -m "version inicial"
   git branch -M main
   git remote add origin https://github.com/mrweekend-01/hivetheaccounts.git
   git push -u origin main
   ```
3. Ve a la pestaña **Actions** de tu repo en GitHub — al hacer push a `main`, el workflow `docker-publish.yml` corre solo y publica dos imágenes: `hivetheaccounts-backend` y `hivetheaccounts-frontend` en `ghcr.io`. Tarda 2-3 minutos la primera vez.
4. **Genera un token de acceso** para poder descargar las imágenes (son privadas, igual que el repo): en GitHub → foto de perfil → *Settings* → *Developer settings* → *Personal access tokens* → *Tokens (classic)* → *Generate new token*, con el permiso `read:packages` marcado. Guarda ese token, es la única vez que se muestra completo.

### En la PC de Roberto

Con Docker Desktop instalado:

```bash
docker login ghcr.io -u mrweekend-01
# como contraseña, pega el token que generaste (no tu contraseña de GitHub)
```

Copia a esa PC solo estos dos archivos (no hace falta el resto del código):
- `docker-compose.prod.yml`
- `.env.prod.example` (renómbralo a `.env.prod` y completa los valores: la IP de esa PC en la red de HTH, las claves, etc. — genera `SECRET_KEY` y `FERNET_KEY` igual que en la sección de arriba)

Y levanta todo:
```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d
```

Frontend en `http://IP_DE_ESA_PC`, backend en `http://IP_DE_ESA_PC:8000`.

### De ahí en adelante

Tú sigues trabajando en tu PC. Cuando haces `git push` a `main`, GitHub Actions publica la versión nueva, y **Watchtower en la PC de Roberto la detecta sola** (revisa cada 5 minutos) y reinicia los contenedores con la versión actualizada. Roberto no toca nada, nunca.

Si alguna vez quieres forzar una actualización inmediata sin esperar los 5 minutos, en la PC de Roberto:
```bash
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d
```

---

## Estructura del proyecto

```
hack-the-accounts/
├── .github/workflows/docker-publish.yml  # arma y publica las imágenes en ghcr.io al hacer push
├── docker-compose.yml          # db + backend + frontend (dev local)
├── docker-compose.prod.yml     # para la PC de Roberto: descarga imágenes + Watchtower
├── .env.example
├── .env.prod.example
├── backend/
│   ├── alembic/versions/       # migración inicial (esquema completo, autogenerada y verificada)
│   └── app/
│       ├── core/               # config, db, security (bcrypt+JWT), crypto (Fernet), enums
│       ├── models/             # SQLAlchemy: user, proxy, device, account, social_account
│       ├── schemas/            # Pydantic (entrada/salida, reveal separado)
│       ├── crud/                # lógica de datos (account, device, proxy, user, social_account)
│       ├── api/routers/         # auth, accounts, proxies, devices, humanization, users, export
│       ├── scripts/import_excel.py  # importación fiel desde Cuentas_boxphone.xlsx
│       ├── utils/export.py     # xlsx / csv
│       ├── seed.py             # admin inicial
│       └── main.py
└── frontend/
    ├── Dockerfile              # dev (npm run dev)
    ├── Dockerfile.prod          # producción: build + nginx, config.js en tiempo de arranque
    ├── nginx.conf
    ├── docker-entrypoint.sh    # escribe config.js con la URL del backend al arrancar
    └── src/
        ├── api/client.js       # axios + token (lee window.__API_URL__ en prod)
        ├── context/            # AuthContext (login, roles)
        ├── components/         # tabla, modal-pop, form, semáforo tri-estado, copiar, badges
        └── pages/              # Login, Accounts, Devices, Humanization, Users
```

## Modelo de datos (relaciones)

```
proxies ──1:1── devices ──1:N── accounts ──1:N── social_accounts
        (nickname)      (persona: nombre,           (login real: usuario/pass propios,
                         fecha nac., correo          slot, link de perfil,
                         de respaldo)                 humanización por red individual)
```

El estado **operativo** de la cuenta (`activo/suspendido/…`) y el estado de **humanización** (que vive en cada red social, no en la cuenta) son columnas distintas a propósito: marcar "hecho" no toca el estado real.

El correo de "Correos" es solo la **identidad/respaldo** de la persona — el login real de cada red social (a veces un teléfono, a veces otro correo) vive aparte en `social_accounts`, con su propia contraseña. Por eso `username`/`password` en `social_accounts` son opcionales: una red puede registrarse como "pendiente de credenciales" (ámbar en el semáforo) antes de tener el login real.

## Detalle de la humanización

El temporizador corre **por red social individual** (no por cuenta completa: un celular puede tener Facebook e Instagram avanzando en paralelo, cada uno con su propio reloj), se persiste en la BD, y se auto-finaliza si el navegador estuvo cerrado cuando venció. La notificación usa la Notification API del navegador (local, sin servidor de push).

## Siguientes pasos sugeridos (para Claude Code)

- Historial/auditoría: tabla `status_logs` (quién puso una cuenta en revisión y cuándo).
- Botón "probar proxy" que marque operativo/inoperativo automáticamente.
- Confirmaciones de borrado y toasts en el frontend (hoy usa `confirm`/`alert` nativos).
- Al importar el Excel real, revisar manualmente los casos que el script deja marcados: celulares ambiguos (notas en la cuenta), correos duplicados, y filas de Facebook sin persona madre en Correos.
