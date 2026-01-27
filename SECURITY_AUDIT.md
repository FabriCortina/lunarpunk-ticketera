# Security Audit — Lunarpunk Ticketera (Monolith)

Date: 2026-01-23  
Scope: Backend (Fastify), Frontend (Vite/React), MercadoPago integration, QR flow, Infra/DevOps

## Executive summary (critical risks)

- **Webhook trust is too permissive**: `/webhooks/mercadopago` accepts unauthenticated calls without signature verification or strict validation. This enables forged webhook events and could incorrectly mark tickets as paid.
- **Client-side secret exposure**: Gemini API key is injected into the frontend build (`frontend/vite.config.ts`), exposing it to any user.
- **Missing platform hardening**: security headers (CSP/HSTS/etc.) and rate limiting are not configured, raising XSS and DoS risk.

## Methodology & tools

- Code review of backend and frontend (routes, controllers, services, utils).
- Secret scan with ripgrep.
- Dependency audits:
  - `npm audit --production` and `npm audit` in root, `frontend/`, `backend/`.

## System overview

Backend routes:
- `POST /api/auth/register`, `POST /api/auth/login`
- `GET /api/users/me`
- `GET /api/events`, `POST /api/events`, `GET /api/events/mine`, `PATCH /api/events/:id`, `PATCH /api/events/:id/publish`, `DELETE /api/events/:id`
- `POST /api/tickets/reserve`, `GET /api/tickets/mine`, `GET /api/tickets/:id`, `DELETE /api/tickets/:id`, `GET /api/tickets/event/:eventId`, `GET /api/tickets/:id/qr`, `POST /api/tickets/validate`
- `POST /api/payments/create-preference`
- `POST /webhooks/mercadopago`

Frontend:
- Vite/React app, token stored in `localStorage`, API client in `frontend/src/lib/api.ts`.

## Threat model (STRIDE) by flow

### a) Registro/Login (Organizador/Explorer)
- **S**poofing: brute force login without rate limits.
- **T**ampering: token theft via XSS (localStorage).
- **R**epudiation: limited audit logging for auth events.
- **I**nformation disclosure: verbose errors if logging sensitive data.
- **D**oS: repeated auth calls (no rate limiting).
- **E**levation of privilege: RBAC relies on JWT claims; no issuer/audience checks.

### b) Crear evento / listar eventos
- **S**poofing: token theft via XSS -> create events.
- **T**ampering: unvalidated image URLs (abuse of URL rendering).
- **I**nformation disclosure: no CSP, image sources unrestricted.
- **D**oS: large payloads, no body size limit.

### c) Reserva ticket (PENDING)
- **S**poofing: stolen token -> reserve.
- **T**ampering: no strict server-side validation of image URLs.
- **R**epudiation: limited audit logs.
- **D**oS: no rate limiting.

### d) Pago MercadoPago (create preference)
- **T**ampering: preference lacks strict server-side correlation checks (price/currency validated only by MP response).
- **I**nformation disclosure: logging may include payment data.

### e) Webhook confirmación (PAID)
- **S**poofing: webhook unauthenticated.
- **T**ampering: no signature verification or strict validation of amount/currency.
- **R**epudiation: no idempotency record; duplicate events.
- **D**oS: endpoint can be spammed (no rate limit).

### f) Visualización QR
- **I**nformation disclosure: QR available only for PAID (good), but no expiry.
- **T**ampering: QR signature verified (good).

### g) Escaneo/validación (single-use)
- **T**ampering: single-use enforced (atomic update) — good.
- **R**epudiation: no audit record of scan attempts.
- **D**oS: no rate limiting.

## Dependency audit summary

Root `npm audit`:
- `lodash` prototype pollution (moderate)
- `diff` DoS (low)
- `esbuild` dev-server exposure (moderate, via vite)

Frontend `npm audit`:
- `esbuild` moderate (via vite)

Backend `npm audit`:
- `lodash` prototype pollution (moderate)
- `diff` DoS (low)
- `esbuild` moderate (via vite)

## Findings table

| ID | Severity | Component | Vector | Evidence | Recommendation | Status |
| --- | --- | --- | --- | --- | --- | --- |
| C-01 | Critical | Frontend | Secret exposure | `frontend/vite.config.ts` defines `process.env.API_KEY` into bundle | Move Gemini calls to backend, remove key from client | Proposed |
| H-01 | High | Webhook | Spoofing | `/webhooks/mercadopago` has no signature validation | Verify MP signature (x-signature) with secret | Implemented |
| H-02 | High | Webhook | Tampering | No payment amount/currency validation | Validate `amount`, `currency`, `external_reference` vs ticket | Implemented |
| H-03 | High | Backend | DoS | No rate limiting | Add rate limit globally and for auth/webhook | Implemented |
| H-04 | High | Backend | XSS/Clickjacking | No security headers | Add Helmet (CSP/HSTS/etc.) | Implemented |
| H-05 | High | Backend | CORS | `ALLOWED_ORIGINS='*'` default | Restrict origins in prod | Proposed |
| H-06 | High | Frontend | Token theft | JWT stored in `localStorage` | Prefer httpOnly cookies or short-lived tokens | Proposed |
| M-01 | Medium | QR | Replay | QR has `iat` but no expiry validation | Enforce TTL in validation | Implemented |
| M-02 | Medium | Webhook | Replay | No idempotency store | Record payment ID and status | Proposed |
| M-03 | Medium | Backend | Logging | Payment logs include raw payload | Use structured logging and redact | Implemented |
| M-04 | Medium | Backend | DoS | No body size limits | Set `bodyLimit` | Implemented |
| M-05 | Medium | Frontend | XSS | Image URLs are not validated | Validate/allowlist image URLs | Proposed |
| L-01 | Low | Backend | Timeouts | No request timeouts | Add server timeouts | Proposed |
| L-02 | Low | Dependencies | Supply chain | `lodash`, `diff`, `esbuild` findings | Update deps, evaluate breaking changes | Proposed |

## Remediation plan (prioritized)

**Quick wins (24h)**
- Add security headers with Helmet.
- Add rate limiting (global + auth/webhook).
- Stop logging sensitive webhook body data.
- Validate webhook payload (payment status, amount/currency, ticket ownership).

**1 week**
- Implement robust webhook signature verification and idempotency store.
- Add CSP policy tailored to frontend usage.
- Add QR expiry check (TTL).
- Add request body size limit and timeouts.

**1 month**
- Move Gemini API to backend (no secrets in client).
- Token strategy: short-lived access tokens, refresh tokens, optional httpOnly cookie.
- Central audit logging for auth and scan events.

## Notes on MercadoPago flow

Current create-preference uses `external_reference = ticket.id`. The webhook currently trusts `external_reference` and updates status to PAID. This should be hardened by:
- Signature verification.
- Re-query payment and validate `status`, `amount`, `currency`, `external_reference`.
- Idempotency by payment ID.

