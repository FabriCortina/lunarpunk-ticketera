import { Resend } from 'resend';
import { FastifyBaseLogger } from 'fastify';
import { env } from '../config/env';

const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

export async function sendPasswordResetEmail(
  to: string,
  resetUrl: string,
  logger?: FastifyBaseLogger
): Promise<void> {
  if (!resend) {
    logger?.warn('RESEND_API_KEY not configured; skipping password reset email');
    return;
  }

  await resend.emails.send({
    from: env.EMAIL_FROM,
    to,
    subject: 'Recuperá tu contraseña - LunarPunk',
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2>Recuperación de contraseña</h2>
        <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta de LunarPunk.</p>
        <p>
          <a href="${resetUrl}" style="display:inline-block;background:#00f0ff;color:#000;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">
            Restablecer contraseña
          </a>
        </p>
        <p>Si no solicitaste este cambio, podés ignorar este correo.</p>
        <p>Este enlace vence en ${env.PASSWORD_RESET_TOKEN_TTL_MINUTES} minutos.</p>
      </div>
    `
  });
}
