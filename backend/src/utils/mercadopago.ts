import crypto from 'crypto';
import { env } from '../config/env';

type HeaderValue = string | string[] | undefined;

const getHeader = (headers: Record<string, HeaderValue>, key: string) => {
  const value = headers[key] ?? headers[key.toLowerCase()];
  return Array.isArray(value) ? value[0] : value;
};

type SignatureResult = {
  ok: boolean;
  skipped?: boolean;
  reason?: string;
  requestId?: string;
};

export const verifyMercadoPagoSignature = (
  headers: Record<string, HeaderValue>,
  dataId?: string
): SignatureResult => {
  if (!env.MP_WEBHOOK_SECRET) {
    return { ok: true, skipped: true, reason: 'secret_not_configured' };
  }

  const signatureHeader = getHeader(headers, 'x-signature');
  const requestId = getHeader(headers, 'x-request-id');
  if (!signatureHeader || !dataId) {
    return { ok: false, reason: 'missing_signature_or_id', requestId };
  }

  const parts = signatureHeader.split(',').reduce<Record<string, string>>((acc, part) => {
    const [key, value] = part.split('=').map((item) => item.trim());
    if (key && value) {
      acc[key] = value;
    }
    return acc;
  }, {});

  const ts = parts.ts;
  const v1 = parts.v1;
  if (!ts || !v1) {
    return { ok: false, reason: 'invalid_signature_format', requestId };
  }

  const nowSeconds = Math.floor(Date.now() / 1000);
  const tsNumber = Number(ts);
  const tolerance = env.MP_WEBHOOK_TOLERANCE_SECONDS;
  if (!Number.isFinite(tsNumber) || Math.abs(nowSeconds - tsNumber) > tolerance) {
    return { ok: false, reason: 'signature_timestamp_out_of_range', requestId };
  }

  const manifest = `${ts}.${dataId}`;
  const expected = crypto
    .createHmac('sha256', env.MP_WEBHOOK_SECRET)
    .update(manifest)
    .digest('hex');

  const signatureBuffer = Buffer.from(v1);
  const expectedBuffer = Buffer.from(expected);
  if (
    signatureBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(signatureBuffer, expectedBuffer)
  ) {
    return { ok: false, reason: 'signature_mismatch', requestId };
  }

  return { ok: true, requestId };
};
