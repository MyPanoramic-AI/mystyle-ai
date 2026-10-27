import nodemailer from 'nodemailer';
import { ApiError, logEvent } from '../errors.js';
import type { Mailer, OutboundEmail } from './types.js';

export interface SmtpMailerConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  from: string;
}

export function createSmtpMailer(config: SmtpMailerConfig): Mailer {
  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    requireTLS: !config.secure,
    auth: {
      user: config.user,
      pass: config.pass,
    },
  });

  return {
    providerName: 'smtp',
    async send(message: OutboundEmail): Promise<void> {
      try {
        await transporter.sendMail({
          from: config.from,
          to: message.to,
          subject: message.subject,
          text: message.text,
          html: message.html,
        });
      } catch (error) {
        logEvent(
          'smtp_send_failed',
          {
            kind: message.kind,
            message: error instanceof Error ? error.message : 'smtp_error',
          },
          'error',
        );
        throw new ApiError(
          'email_delivery_failed',
          'The email could not be sent right now. Please try again shortly.',
          503,
        );
      }
    },
  };
}
