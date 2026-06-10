import crypto from 'crypto';
import { env } from '../config/env';

type QrPayload = {
  ticketId: string;
  eventId: string;
  iat: number;
};

export const generateSignedQrPayload = (ticketId: string, eventId: string) => {
  const payload: QrPayload = { ticketId, eventId, iat: Date.now() };
  const payloadString = JSON.stringify(payload);
  const signature = crypto
    .createHmac('sha256', env.QR_SECRET)
    .update(payloadString)
    .digest('hex');

  return `${Buffer.from(payloadString).toString('base64')}.${signature}`;
};

export const verifyQrPayload = (payloadString: string): QrPayload | null => {
  try {
    const [encodedPayload, signature] = payloadString.split('.');
    if (!encodedPayload || !signature) {
      return null;
    }

    const decoded = Buffer.from(encodedPayload, 'base64').toString('utf-8');
    const expectedSignature = crypto
      .createHmac('sha256', env.QR_SECRET)
      .update(decoded)
      .digest('hex');

    const signatureBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expectedSignature);
    if (
      signatureBuffer.length !== expectedBuffer.length ||
      !crypto.timingSafeEqual(signatureBuffer, expectedBuffer)
    ) {
      return null;
    }

    const payload = JSON.parse(decoded) as QrPayload;
    if (env.QR_TTL_SECONDS > 0) {
      const now = Date.now();
      const expiresAt = payload.iat + env.QR_TTL_SECONDS * 1000;
      if (!payload.iat || expiresAt < now) {
        return null;
      }
    }

    return payload;
  } catch {
    return null;
  }
};

export const generatePasswordResetToken = () => crypto.randomBytes(32).toString('hex');

export const hashPasswordResetToken = (token: string) =>
  crypto.createHash('sha256').update(token).digest('hex');
