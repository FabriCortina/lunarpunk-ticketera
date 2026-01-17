# LunarPunk Ticketera Backend

Plataforma de gestión de eventos y venta de entradas con estética LunarPunk.

## Deploy to Railway

Este proyecto está configurado para desplegarse automáticamente en [Railway](https://railway.app/).

### 1. Preparar el repositorio
Asegúrate de que este código esté en tu cuenta de GitHub.

### 2. Crear proyecto en Railway
1. "New Project" -> "Deploy from GitHub repo".
2. Selecciona este repositorio.

### 3. Agregar Base de Datos
1. En el lienzo de Railway, clic derecho -> "New Service" -> "Database" -> "PostgreSQL".
2. Railway inyectará automáticamente la variable `DATABASE_URL` en tu servicio de Node.js cuando los conectes o si están en el mismo entorno.

### 4. Configurar Variables de Entorno
Ve a la pestaña "Variables" de tu servicio de Node.js y agrega:

- `JWT_SECRET`: (Generar uno seguro)
- `QR_SECRET`: (Generar uno seguro)
- `MP_ACCESS_TOKEN`: (Tu token de MercadoPago)
- `API_KEY`: (Tu clave de Gemini AI)
- `PUBLIC_BASE_URL`: El dominio que Railway te asigne (ej. `https://xxx.up.railway.app`).
- `ALLOWED_ORIGINS`: La URL de tu frontend (ej. `https://mi-app.vercel.app`).
- `NODE_ENV`: `production`

### 5. Build & Start Command
Railway detectará `package.json`.
- **Build Command**: `npm run build` (Detectado automáticamente).
- **Start Command**: `npm run deploy` (Esto ejecutará las migraciones de la base de datos y luego iniciará el servidor).

## Desarrollo Local

```bash
# Instalar
npm install

# Base de datos local
# Asegúrate de tener Postgres corriendo y crear la BD 'lunarpunk_db'
npm run migrate

# Correr
npm run dev
```