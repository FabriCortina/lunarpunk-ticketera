
import crypto from 'crypto';
import { Buffer } from 'buffer';
import { env } from '../config/env';

export interface QrPayloadData {
  ticketId: string;
  eventId: string;
  issuedAt: number;
}

export interface QrPayload extends QrPayloadData {
  signature: string;
}

export function generateSignedQrPayload(ticketId: string, eventId: string): string {
  const data: QrPayloadData = {
    ticketId,
    eventId,
    issuedAt: Date.now(),
  };

  // Crear firma HMAC-SHA256
  const dataString = JSON.stringify(data);
  const signature = crypto
    .createHmac('sha256', env.QR_SECRET)
    .update(dataString)
    .digest('hex');

  const payload: QrPayload = {
    ...data,
    signature,
  };

  return JSON.stringify(payload);
}

export function verifyQrPayload(payloadString: string): QrPayloadData | null {
  try {
    const payload: QrPayload = JSON.parse(payloadString);

    if (!payload.ticketId || !payload.eventId || !payload.signature || !payload.issuedAt) {
      return null;
    }

    // Reconstruir los datos originales para verificar la firma
    const data: QrPayloadData = {
      ticketId: payload.ticketId,
      eventId: payload.eventId,
      issuedAt: payload.issuedAt,
    };

    const dataString = JSON.stringify(data);
    const expectedSignature = crypto
      .createHmac('sha256', env.QR_SECRET)
      .update(dataString)
      .digest('hex');

    // Comparación segura contra Timing Attacks
    const signatureBuffer = Buffer.from(payload.signature);
    const expectedBuffer = Buffer.from(expectedSignature);

    if (signatureBuffer.length !== expectedBuffer.length || 
        !crypto.timingSafeEqual(signatureBuffer, expectedBuffer)) {
      return null;
    }

    return data;
  } catch (error) {
    return null;
  }
}
