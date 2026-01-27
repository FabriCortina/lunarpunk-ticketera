# 🌙 LunarPunk Ticketera

> Plataforma descentralizada de gestión de eventos y venta de entradas con estética cyberpunk lunar

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Fastify](https://img.shields.io/badge/Fastify-000000?style=flat&logo=fastify&logoColor=white)](https://www.fastify.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=flat&logo=postgresql&logoColor=white)](https://www.postgresql.org/)

## 📋 Tabla de Contenidos

- [Descripción](#-descripción)
- [Características](#-características)
- [Arquitectura](#-arquitectura)
- [Tecnologías](#-tecnologías)
- [Prerrequisitos](#-prerrequisitos)
- [Instalación](#-instalación)
- [Configuración](#-configuración)
- [Uso](#-uso)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [API](#-api)
- [Despliegue](#-despliegue)
- [Desarrollo](#-desarrollo)
- [Contribución](#-contribución)
- [Licencia](#-licencia)

## 🎯 Descripción

**LunarPunk Ticketera** es una plataforma web full-stack para la gestión y venta de tickets de eventos. Diseñada con una estética cyberpunk futurista, permite a los organizadores crear y gestionar eventos mientras que los exploradores pueden descubrir, comprar y gestionar sus tickets de forma segura.

### Roles de Usuario

- **ADMIN (Platform Admin)**: Gobierna la plataforma, aprueba/rechaza organizadores, ve métricas globales y audita pagos/tickets.
- **ORGANIZER**: Crea, edita y gestiona eventos. Requiere estado **APPROVED** para operar.
- **EXPLORER**: Explora eventos publicados, compra tickets y gestiona su billetera de tickets.

### Flujo de aprobación y límites

1. Un organizador se registra y queda en estado **PENDING_APPROVAL**.
2. Un **ADMIN** revisa la solicitud en el dashboard y puede **aprobar**, **rechazar** o **suspender**.
3. Solo los organizadores **APPROVED** pueden iniciar sesión y operar.
4. El **ADMIN** puede definir límites por organizador:
   - `max_events`
   - `max_tickets_per_event`
   - `max_monthly_volume`

## ✨ Características

### Backend
- ✅ API RESTful con Fastify y TypeScript
- ✅ Autenticación JWT segura
- ✅ Aprobación de organizadores y rol ADMIN
- ✅ Integración con MercadoPago para pagos
- ✅ Webhooks para procesamiento de pagos
- ✅ Códigos QR firmados con HMAC para validación segura
- ✅ Base de datos PostgreSQL con migraciones Knex
- ✅ Validación de esquemas con Zod
- ✅ Manejo de errores centralizado
- ✅ CORS configurable
- ✅ Logging estructurado con Pino

### Frontend
- ✅ Interfaz React moderna con Vite
- ✅ Diseño responsive con temática LunarPunk
- ✅ Tipografía personalizada (Xystema)
- ✅ Componentes modulares y reutilizables
- ✅ Gestión de estado local con React Hooks
- ✅ Autenticación persistente
- ✅ Panel de organizador y explorador
- ✅ Dashboard ADMIN con KPIs y gestión de límites
- ✅ Billetera de tickets con códigos QR
- ✅ Modales y notificaciones

### Seguridad
- ✅ Tokens JWT para autenticación
- ✅ Validación de propiedad de recursos
- ✅ Códigos QR firmados criptográficamente
- ✅ Variables de entorno para secretos
- ✅ Protección CSRF mediante CORS
- ✅ Auditoría de acciones ADMIN

## 🏗️ Arquitectura

El proyecto sigue una arquitectura de capas:

```
┌─────────────────────────────────────┐
│         Frontend (React)            │
│         Puerto: 3000                │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│      Backend API (Fastify)         │
│         Puerto: 3100                │
│  ┌──────────────────────────────┐   │
│  │   Routes → Controllers      │   │
│  │   Controllers → Services    │   │
│  │   Services → Repositories   │   │
│  └───────────┬──────────────────┘   │
└──────────────┼──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│    Base de Datos (PostgreSQL)      │
│         Puerto: 5433                │
└─────────────────────────────────────┘
```

## 🛠️ Tecnologías

### Backend
- **Fastify** - Framework web rápido y eficiente
- **TypeScript** - Tipado estático
- **PostgreSQL** - Base de datos relacional
- **Knex.js** - Query builder y migraciones
- **Zod** - Validación de esquemas
- **MercadoPago SDK** - Integración de pagos
- **JWT** - Autenticación basada en tokens
- **Pino** - Logging estructurado

### Frontend
- **React 18** - Biblioteca UI
- **Vite** - Build tool y dev server
- **TypeScript** - Tipado estático
- **Lucide React** - Iconos
- **Tailwind CSS** (implícito en estilos) - Estilos

### DevOps
- **Docker Compose** - Contenedorización local
- **Railway** - Plataforma de despliegue
- **Git** - Control de versiones

## 📦 Prerrequisitos

- **Node.js** >= 18.x
- **npm** >= 9.x
- **PostgreSQL** >= 16.x (o Docker)
- **Git**

### Servicios Externos Requeridos
- Cuenta de **MercadoPago** (Access Token)

## 🚀 Instalación

### 1. Clonar el repositorio

```bash
git clone https://github.com/FabriCortina/lunarpunk-ticketera.git
cd lunarpunk-ticketera
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar base de datos

#### Opción A: Docker Compose (Recomendado)

```bash
docker-compose up -d
```

Esto iniciará PostgreSQL en el puerto `5433`.

#### Opción B: PostgreSQL Local

Crea una base de datos:

```sql
CREATE DATABASE lunarpunk_db;
```

### 4. Configurar variables de entorno

Copia el archivo de ejemplo y configura tus variables:

```bash
cp .env.example .env
```

Edita `.env` con tus valores (ver sección [Configuración](#-configuración)).

### 5. Ejecutar migraciones

```bash
npm run migrate
```

Esto creará las tablas necesarias en la base de datos.

## ⚙️ Configuración

### Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto:

```env
# Servidor
PORT=3100
NODE_ENV=development
LOG_LEVEL=info

# Base de Datos (Local)
DB_HOST=127.0.0.1
DB_PORT=5433
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=lunarpunk_db

# O usar DATABASE_URL (Railway/Producción)
# DATABASE_URL=postgresql://user:password@host:port/database

# Seguridad
JWT_SECRET=tu_secreto_jwt_muy_seguro_minimo_10_caracteres
QR_SECRET=tu_secreto_qr_muy_seguro_minimo_10_caracteres

# Servicios Externos
MP_ACCESS_TOKEN=tu_token_de_mercadopago
API_KEY= # opcional si no usas Gemini

# Configuración de la App
BACKEND_PUBLIC_BASE_URL=http://localhost:3100
FRONTEND_PUBLIC_BASE_URL=http://localhost:3000
ALLOWED_ORIGINS=*
```

### Obtener Credenciales

#### MercadoPago
1. Crea una cuenta en [MercadoPago](https://www.mercadopago.com.ar/)
2. Ve a [Credenciales](https://www.mercadopago.com.ar/developers/panel/credentials)
3. Copia tu **Access Token** (producción o test)

#### Google Gemini API (opcional)
1. Ve a [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Crea una nueva API Key
3. Copia la clave generada

## 💻 Uso

### Desarrollo

#### Iniciar Frontend

```bash
npm run dev
```

Esto iniciará el frontend en `http://localhost:3000`

#### Solo Backend

```bash
npm run dev:backend
```

#### Solo Frontend

```bash
npm run dev:frontend
```

### Producción

#### Build

```bash
npm run build
```

Esto compilará:
- Backend TypeScript → JavaScript en `backend/dist/`
- Frontend React → Assets estáticos en `frontend/dist/`

#### Iniciar Servidor

```bash
npm start
```

O con migraciones automáticas:

```bash
npm run deploy
```

## 📁 Estructura del Proyecto

```
lunarpunk-ticketera/
├── backend/                      # Backend Fastify (TS)
│   ├── src/
│   │   ├── app.ts
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── database/
│   │   ├── middlewares/
│   │   ├── repositories/
│   │   ├── routes/
│   │   ├── schemas/
│   │   ├── services/
│   │   ├── types/
│   │   └── utils/
│   ├── dist/                     # Build backend
│   └── knexfile.ts
├── frontend/                     # Frontend React (Vite)
│   ├── src/
│   ├── public/
│   ├── index.html
│   └── vite.config.ts
├── package.json
├── docker-compose.yml
├── .env.example
└── README.md
```

## 🔌 API

### Endpoints Principales

#### Autenticación
- `POST /api/auth/register` - Registrar nuevo usuario (ORGANIZER queda PENDING_APPROVAL)
- `POST /api/auth/login` - Iniciar sesión (ORGANIZER requiere APPROVED)
- `GET /api/users/me` - Obtener usuario actual

#### Eventos
- `GET /api/events` - Listar eventos publicados
- `GET /api/events/mine` - Listar eventos del organizador (requiere auth)
- `POST /api/events` - Crear evento (requiere auth, ORGANIZER)
- `PATCH /api/events/:id` - Actualizar evento (requiere auth, owner)
- `PATCH /api/events/:id/publish` - Publicar/ocultar evento (requiere auth, owner)
- `DELETE /api/events/:id` - Eliminar evento (requiere auth, owner)

#### Tickets
- `POST /api/tickets/reserve` - Reservar ticket (requiere auth, EXPLORER)
- `GET /api/tickets/mine` - Listar tickets del usuario (requiere auth, EXPLORER)
- `GET /api/tickets/:id` - Obtener ticket específico (requiere auth, EXPLORER, owner)
- `GET /api/tickets/:id/qr` - Obtener QR de ticket (requiere auth, EXPLORER, owner, PAID)
- `GET /api/tickets/event/:eventId` - Listar tickets de evento (requiere auth, ORGANIZER, owner del evento)
- `POST /api/tickets/validate` - Validar ticket por QR (requiere auth, ORGANIZER)

#### Admin (Platform)
- `GET /api/admin/organizers?status=` - Listar organizadores por estado
- `POST /api/admin/organizers/:id/approve` - Aprobar organizador
- `POST /api/admin/organizers/:id/reject` - Rechazar organizador
- `POST /api/admin/organizers/:id/suspend` - Suspender organizador
- `POST /api/admin/organizers/:id/limits` - Configurar límites (max_events, max_tickets_per_event, max_monthly_volume)
- `GET /api/admin/dashboard` - KPIs globales y auditoría

**Detalle `GET /api/tickets/:id`**
- Devuelve el ticket solo si pertenece al usuario autenticado; si no, responde `403`.
- Incluye `status` y `qrPayload` (puede ser `null` si aún no está pagado).

#### Pagos
- `POST /api/payments/create-preference` - Crear preferencia de pago MercadoPago
- `POST /webhooks/mercadopago` - Webhook de MercadoPago

#### Usuarios
- `GET /api/users/me` - Obtener perfil de usuario

#### Health Check
- `GET /health` - Estado del servidor y base de datos

### Ejemplo de Uso

```bash
# Registrar usuario
curl -X POST http://localhost:3100/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Juan",
    "email": "juan@example.com",
    "password": "password123",
    "role": "EXPLORER"
  }'

# Iniciar sesión
curl -X POST http://localhost:3100/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "juan@example.com",
    "password": "password123"
  }'

# Crear evento (con token JWT)
curl -X POST http://localhost:3100/api/events \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "title": "Concierto Lunar",
    "description": "Evento épico",
    "datetime": "2024-12-31T20:00:00Z",
    "price": 5000,
    "capacity": 100,
    "location": "Luna Base Alpha"
  }'
```

## 🚢 Despliegue

### Railway (Recomendado)

Este proyecto está optimizado para desplegarse en [Railway](https://railway.app/).

#### Pasos:

1. **Preparar el repositorio**
   - Asegúrate de que el código esté en GitHub

2. **Crear proyecto en Railway**
   - Ve a [Railway](https://railway.app/)
   - "New Project" → "Deploy from GitHub repo"
   - Selecciona este repositorio

3. **Agregar Base de Datos PostgreSQL**
   - En el lienzo de Railway: "New Service" → "Database" → "PostgreSQL"
   - Railway inyectará automáticamente `DATABASE_URL`

4. **Configurar Variables de Entorno**
   Ve a la pestaña "Variables" y agrega (usa las URLs públicas en Railway, con `https`):
   ```env
   JWT_SECRET=tu_secreto_seguro
   QR_SECRET=tu_secreto_qr_seguro
  MP_ACCESS_TOKEN=tu_token_mercadopago
  API_KEY= # opcional si no usas Gemini
   BACKEND_PUBLIC_BASE_URL=https://tu-backend.up.railway.app
   FRONTEND_PUBLIC_BASE_URL=https://tu-frontend.up.railway.app
   ALLOWED_ORIGINS=https://tu-app.up.railway.app
   NODE_ENV=production
   ```

5. **Build y Start**
   Railway detectará automáticamente:
   - **Build Command**: `npm run build`
   - **Start Command**: `npm run deploy` (ejecuta migraciones y inicia servidor)

6. **Configurar Webhook de MercadoPago**
   - En tu cuenta de MercadoPago, configura el webhook:
   - URL: `${BACKEND_PUBLIC_BASE_URL}/webhooks/mercadopago`

### Otros Proveedores

El proyecto puede desplegarse en cualquier plataforma que soporte Node.js:

- **Heroku**
- **Vercel** (solo frontend, backend separado)
- **Render**
- **DigitalOcean App Platform**

## 🔧 Desarrollo

### Scripts Disponibles

```bash
# Desarrollo
npm run dev              # Inicia backend y frontend
npm run dev:frontend     # Solo frontend (Vite)
npm run dev              # Solo backend (ts-node)

# Build
npm run build            # Build completo (backend + frontend)
npm run build:backend    # Solo backend
npm run build:frontend   # Solo frontend

# Base de Datos
npm run migrate          # Ejecutar migraciones

# Producción
npm start                # Inicia servidor compilado
npm run deploy           # Migraciones + start
npm run preview:frontend # Preview del build frontend
```

### Migraciones

```bash
# Crear nueva migración
npx knex migrate:make nombre_de_migracion

# Ejecutar migraciones
npm run migrate

# Revertir última migración
npx knex migrate:rollback
```

### Estructura de Base de Datos

#### Tabla `events`
- `id` (UUID, PK)
- `organizer_id` (UUID)
- `title` (VARCHAR)
- `description` (TEXT)
- `datetime` (TIMESTAMP)
- `price` (DECIMAL)
- `capacity` (INTEGER)
- `location` (VARCHAR)
- `image_url` (TEXT)
- `is_published` (BOOLEAN)
- `created_at` (TIMESTAMP)

#### Tabla `tickets`
- `id` (UUID, PK)
- `event_id` (UUID, FK → events)
- `explorer_id` (UUID)
- `status` (ENUM: PENDING, PAID, VALIDATED, CANCELED)
- `mp_preference_id` (VARCHAR)
- `mp_payment_id` (VARCHAR)
- `qr_payload` (TEXT) - Código QR firmado
- `validated_at` (TIMESTAMP)
- `created_at` (TIMESTAMP)

## 🤝 Contribución

Las contribuciones son bienvenidas. Para cambios importantes:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

### Ramas

- `main` - Producción estable
- `monolith` - Versión monolítica
- `monolithDev` - Desarrollo activo

## 📝 Licencia

Este proyecto está bajo la Licencia ISC.

## 👥 Autor

**FabriCortina**

- GitHub: [@FabriCortina](https://github.com/FabriCortina)

## 🙏 Agradecimientos

- [Fastify](https://www.fastify.io/) - Framework web rápido
- [React](https://reactjs.org/) - Biblioteca UI
- [MercadoPago](https://www.mercadopago.com.ar/) - Procesamiento de pagos
- [Google Gemini](https://ai.google.dev/) - API de IA
- [Railway](https://railway.app/) - Plataforma de despliegue

---

⭐ Si este proyecto te resulta útil, considera darle una estrella en GitHub.
