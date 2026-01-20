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

    return JSON.parse(decoded) as QrPayload;
  } catch {
    return null;
  }
};
