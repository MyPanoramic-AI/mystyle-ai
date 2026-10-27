import type { OutboundEmail, TransactionalEmailKind } from './types.js';

function shell(title: string, intro: string, buttonLabel: string | null, actionUrl: string | null, note: string): { text: string; html: string } {
  const textLines = [
    'MyStyle AI',
    '',
    title,
    '',
    intro,
    actionUrl ? `${buttonLabel ?? 'Continue'}: ${actionUrl}` : '',
    '',
    note,
    '',
    'This is a transactional account message. It is not marketing mail.',
  ].filter((line, index, all) => !(line === '' && all[index - 1] === ''));

  const button = actionUrl && buttonLabel
    ? `<p style="margin:28px 0"><a href="${actionUrl}" style="display:inline-block;background:#866a40;color:#F6F2EC;text-decoration:none;padding:14px 22px;border-radius:999px;font-size:14px">${buttonLabel}</a></p>
       <p style="font-size:12px;color:#5C585E;word-break:break-all">Or open this link:<br>${actionUrl}</p>`
    : '';

  const html = `<!DOCTYPE html><html><body style="margin:0;background:#F6F2EC;color:#242326;font-family:Georgia,'Times New Roman',serif">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#F6F2EC;padding:32px 16px">
    <tr><td align="center">
      <table role="presentation" width="100%" style="max-width:520px;background:#ffffff;border:1px solid rgba(36,35,38,0.1);border-radius:24px;padding:32px">
        <tr><td>
          <p style="margin:0;font-size:24px">MyStyle <span style="font-size:10px;letter-spacing:0.2em;text-transform:uppercase;color:#866a40;font-family:system-ui,sans-serif">AI</span></p>
          <h1 style="margin:24px 0 12px;font-size:28px;font-weight:normal">${title}</h1>
          <p style="margin:0;font-size:15px;line-height:1.6;color:#5C585E;font-family:system-ui,sans-serif">${intro}</p>
          ${button}
          <p style="margin:24px 0 0;font-size:13px;line-height:1.5;color:#5C585E;font-family:system-ui,sans-serif">${note}</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

  return { text: textLines.join('\n'), html };
}

export function buildTransactionalEmail(input: {
  kind: TransactionalEmailKind;
  to: string;
  appPublicUrl: string;
  actionPath?: string;
  expiresMinutes?: number;
  fromDisplayName?: string | null;
  relationshipLabel?: string | null;
}): OutboundEmail {
  const actionUrl = input.actionPath ? `${input.appPublicUrl.replace(/\/$/, '')}${input.actionPath.startsWith('/') ? '' : '/'}${input.actionPath}` : null;
  const expiry = input.expiresMinutes ? `This link expires in about ${input.expiresMinutes} minutes.` : 'If you did not expect this message, you can ignore it.';

  if (input.kind === 'family_link_invite') {
    const who = input.fromDisplayName?.trim() || 'A MyStyle AI member';
    const relation = input.relationshipLabel?.trim()
      ? ` They suggested the relationship “${input.relationshipLabel.trim()}”.`
      : '';
    const built = shell(
      'Family link request',
      `${who} invited you to link family style profiles on MyStyle AI.${relation} Sign in with this email (or create an account) to accept or decline the request.`,
      'Open MyStyle AI',
      actionUrl,
      'This message does not confirm whether you already have an account. If you did not expect a family link request, you can ignore it.',
    );
    return {
      kind: input.kind,
      to: input.to,
      subject: 'Family link request on MyStyle AI',
      text: built.text,
      html: built.html,
      actionPath: input.actionPath,
    };
  }

  if (input.kind === 'email_verification') {
    const built = shell(
      'Verify your email',
      'Confirm this email address belongs to your MyStyle AI account so we can protect your wardrobe and private photographs.',
      'Verify email',
      actionUrl,
      `${expiry} MyStyle AI will never ask for your password by email.`,
    );
    return { kind: input.kind, to: input.to, subject: 'Verify your MyStyle AI email', text: built.text, html: built.html, actionPath: input.actionPath };
  }

  if (input.kind === 'password_reset') {
    const built = shell(
      'Reset your password',
      'We received a request to reset the password for this MyStyle AI account. Choose a new password of at least 12 characters.',
      'Reset password',
      actionUrl,
      `${expiry} If you did not request a reset, you can ignore this message. Your current password stays unchanged.`,
    );
    return { kind: input.kind, to: input.to, subject: 'Reset your MyStyle AI password', text: built.text, html: built.html, actionPath: input.actionPath };
  }

  if (input.kind === 'password_changed') {
    const built = shell(
      'Password changed',
      'Your MyStyle AI password was changed successfully. All previous sign-in sessions were signed out.',
      null,
      null,
      'If you did not make this change, contact support through the official MyStyle AI channel after reviewing your account activity.',
    );
    return { kind: input.kind, to: input.to, subject: 'Your MyStyle AI password was changed', text: built.text, html: built.html };
  }

  const built = shell(
    'Account security notice',
    'A security-related change was recorded on your MyStyle AI account.',
    null,
    null,
    'This message is transactional. It is not a marketing newsletter.',
  );
  return { kind: input.kind, to: input.to, subject: 'MyStyle AI account security notice', text: built.text, html: built.html };
}
