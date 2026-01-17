
# LunarPunk Ticketera

Plataforma de gestión de eventos y venta de entradas con estética LunarPunk, integrando pagos seguros y generación de contenido mediante IA.

## Stack Tecnológico

- **Frontend**: React, Tailwind CSS, Lucide Icons.
- **Backend**: Node.js, Fastify.
- **Base de Datos**: PostgreSQL, Knex.js.
- **Validación**: Zod.
- **IA**: Google Gemini API (`@google/genai`).
- **Pagos**: MercadoPago SDK.
- **Seguridad**: JWT Auth, HMAC-SHA256 para firmas criptográficas de QR.

## Requisitos

- Node.js v18+
- PostgreSQL
- Cuenta de Google AI Studio (Gemini API)
- Cuenta de MercadoPago Developers

## Variables de Entorno

Crear un archivo `.env` en la raíz del proyecto basándose en `src/config/env.ts`:

```env
# Servidor
PORT=3000
NODE_ENV=development
LOG_LEVEL=info
PUBLIC_BASE_URL=http://localhost:3000

# Base de Datos
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=lunarpunk_db

# Seguridad
JWT_SECRET=tu_secreto_super_seguro_min_10_chars
QR_SECRET=tu_secreto_para_firmar_qrs_min_10_chars

# Servicios Externos
MP_ACCESS_TOKEN=tu_access_token_mercadopago
API_KEY=tu_api_key_google_gemini
```

## Comandos Básicos

### Instalación

```bash
npm install
```

### Desarrollo

Inicia el servidor en modo desarrollo:

```bash
npm run dev
```

### Base de Datos

Ejecutar migraciones (si aplica script de Knex):

```bash
npm run migrate
```

### Producción

Compilar TypeScript y ejecutar servidor optimizado:

```bash
npm run build
npm start
```
