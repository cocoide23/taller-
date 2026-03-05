<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Taller Manager

Sistema de gestión de taller mecánico con IA, React + Express + PostgreSQL.

---

## Desarrollo local

**Requisitos:** Node.js ≥ 20, PostgreSQL (local o remoto)

1. Instalar dependencias:
   ```bash
   npm install
   ```

2. Copiar el archivo de variables de entorno:
   ```bash
   cp .env.example .env
   ```

3. Editar `.env` con tus valores:
   ```
   DATABASE_URL=postgresql://user:password@localhost:5432/taller_manager
   GEMINI_API_KEY=tu_clave_aqui
   ```

4. Iniciar el servidor Express (en una terminal):
   ```bash
   npm run dev:server
   ```

5. Iniciar el frontend Vite (en otra terminal):
   ```bash
   npm run dev
   ```

   El frontend estará en `http://localhost:3000` y el API proxy redirige `/api/*` al servidor Express en el puerto 3001.

---

## Deploy en Railway

### Paso 1 — Crear el proyecto en Railway

1. Ve a [railway.app](https://railway.app) e inicia sesión.
2. **New Project** → **Deploy from GitHub repo** → selecciona este repositorio.

### Paso 2 — Agregar PostgreSQL

1. Dentro del proyecto, haz clic en **+ New** → **Database** → **Add PostgreSQL**.
2. Railway creará automáticamente la variable `DATABASE_URL` e inyectará las credenciales en el servicio web.

### Paso 3 — Configurar variables de entorno

En el servicio web (pestaña **Variables**), agrega:

| Variable | Valor |
|---|---|
| `GEMINI_API_KEY` | Tu API key de Google AI Studio |
| `NODE_ENV` | `production` |

> `DATABASE_URL` y `PORT` son inyectadas automáticamente por Railway.

### Paso 4 — Deploy

Railway detectará automáticamente `railway.toml` y ejecutará:
- **Build:** `npm run build:all` (compila Vite + TypeScript del servidor)
- **Start:** `node dist-server/index.js` (Express sirve el frontend + API)

El primer deploy inicializa el esquema de PostgreSQL y carga datos de prueba automáticamente.

---

## Arquitectura

```
┌─────────────────────────────────────────┐
│  Railway Service                        │
│                                         │
│  ┌──────────────┐   ┌────────────────┐  │
│  │  Express.js  │   │ Vite dist/     │  │
│  │  API /api/*  │   │ (React SPA)    │  │
│  └──────┬───────┘   └────────────────┘  │
│         │                               │
│  ┌──────▼────────────────────────────┐  │
│  │  Railway PostgreSQL               │  │
│  │  vehicles | orders | order_parts  │  │
│  │  budget_versions | audit_events   │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

## Scripts

| Comando | Descripción |
|---|---|
| `npm run dev` | Frontend Vite (puerto 3000, con proxy a :3001) |
| `npm run dev:server` | Backend Express con hot reload (tsx --watch) |
| `npm run build:all` | Build completo para producción |
| `npm start` | Inicia el servidor compilado (producción) |

