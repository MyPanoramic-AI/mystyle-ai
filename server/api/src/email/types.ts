export type TransactionalEmailKind =
  | 'email_verification'
  | 'password_reset'
  | 'password_changed'
  | 'security_alert'
  | 'family_link_invite';

export interface OutboundEmail {
  kind: TransactionalEmailKind;
  to: string;
  subject: string;
  text: string;
  html: string;
  /** Relative app path including query, e.g. /?action=verify-email&token=… — never logged. */
  actionPath?: string;
}

export interface Mailer {
  readonly providerName: string;
  send(message: OutboundEmail): Promise<void>;
}

export interface CapturedEmail {
  id: string;
  kind: TransactionalEmailKind;
  recipient: string;
  subject: string;
  textBody: string;
  htmlBody: string;
  actionPath: string | null;
  createdAt: string;
}
