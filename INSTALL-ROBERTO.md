# Instalación en la PC de Roberto (192.168.18.36)

Roberto no necesita el código fuente ni construir nada. Solo Docker y el archivo
`.env.prod` que ya viene preparado con sus claves.

## Requisitos previos

1. Instalar **Docker Desktop** (Windows) — https://www.docker.com/products/docker-desktop
2. Tener este archivo `docker-compose.prod.yml` y `.env.prod` en la misma carpeta
   en la PC de Roberto (cópialos por USB, red compartida, etc. — NO por GitHub,
   `.env.prod` tiene claves y está excluido del repo a propósito).

## Pasos (una sola vez)

Abrir PowerShell en la carpeta donde están esos dos archivos:

```powershell
# 1) Login a GitHub Container Registry (pide un Personal Access Token, no la
#    contraseña normal de GitHub). El token necesita el scope "read:packages".
#    Se genera en https://github.com/settings/tokens
docker login ghcr.io -u mrweekend-01

# 2) Levantar todo (descarga las imágenes la primera vez)
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d
```

Eso levanta 4 contenedores:
- `hth_accounts_db` — Postgres
- `hth_accounts_api` — backend (corre migraciones y seed automáticamente al iniciar)
- `hth_accounts_web` — frontend (nginx sirviendo la app)
- `hth_watchtower` — vigila si Álvaro publicó una versión nueva y actualiza solo

## Verificar que quedó bien

```powershell
docker compose -f docker-compose.prod.yml ps
```

Los 4 servicios deben decir `running` (o `healthy` para la db). Luego:

- Backend: abrir `http://192.168.18.36:8000/docs` en el navegador (debe mostrar
  la documentación de la API).
- Frontend: abrir `http://192.168.18.36` (debe mostrar la pantalla de login).

Los demás operadores en la misma red acceden con esa misma URL:
`http://192.168.18.36`.

## Actualizaciones futuras

No hay que hacer nada. Cuando Álvaro haga push a `main`, GitHub Actions publica
las imágenes nuevas y Watchtower las detecta (revisa cada 5 minutos), las
descarga y reinicia los contenedores solo.

Si alguna vez quieres forzar una actualización manual sin esperar a Watchtower:

```powershell
docker compose -f docker-compose.prod.yml --env-file .env.prod pull
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d
```

## Si cambia la IP de la PC de Roberto

Si la red le asigna otra IP a esta PC, hay que actualizar `API_URL` y
`CORS_ORIGINS` en `.env.prod` con la IP nueva y volver a correr:

```powershell
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d
```
(Para ver la IP actual: `ipconfig` → buscar "Dirección IPv4" del adaptador de red activo.)
