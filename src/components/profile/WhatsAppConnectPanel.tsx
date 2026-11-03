/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useState } from 'react';
import { Copy, Link2, MessageSquare, Sparkles, Unlink } from 'lucide-react';
import {
  AccountApiError,
  accountApi,
  type WhatsAppLinkCodeResponse,
  type WhatsAppStatusResponse,
} from '../../services/accountApi';

interface WhatsAppConnectPanelProps {
  enabled: boolean;
  stylistName?: string;
  onUnauthenticated?: () => void;
}

export const WhatsAppConnectPanel: React.FC<WhatsAppConnectPanelProps> = ({
  enabled,
  stylistName = 'your stylist',
  onUnauthenticated,
}) => {
  const [status, setStatus] = useState<WhatsAppStatusResponse | null>(null);
  const [code, setCode] = useState<WhatsAppLinkCodeResponse | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const explainError = useCallback((error: unknown, fallback: string) => {
    if (error instanceof AccountApiError && error.status === 401) {
      onUnauthenticated?.();
      return 'Your session has ended. Sign in again to continue.';
    }
    return error instanceof AccountApiError ? error.message : fallback;
  }, [onUnauthenticated]);

  const reload = useCallback(async () => {
    if (!enabled) return;
    const next = await accountApi.whatsappStatus();
    setStatus(next);
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    reload().catch((error: unknown) => {
      if (cancelled) return;
      setMessage(explainError(error, 'WhatsApp status could not be loaded.'));
    });
    return () => {
      cancelled = true;
    };
  }, [enabled, reload, explainError]);

  if (!enabled) return null;

  const handleGenerate = async () => {
    setBusy(true);
    setMessage(null);
    try {
      const created = await accountApi.createWhatsAppLinkCode();
      setCode(created);
      setMessage(created.messageHint);
      await reload();
    } catch (error) {
      setMessage(explainError(error, 'Link code could not be created.'));
    } finally {
      setBusy(false);
    }
  };

  const handleUnlink = async () => {
    setBusy(true);
    setMessage(null);
    try {
      await accountApi.unlinkWhatsApp();
      setCode(null);
      setMessage('WhatsApp unlinked from this MyStyle account.');
      await reload();
    } catch (error) {
      setMessage(explainError(error, 'WhatsApp could not be unlinked.'));
    } finally {
      setBusy(false);
    }
  };

  const handleCopy = async () => {
    if (!code) return;
    const text = `LINK ${code.code}`;
    try {
      await navigator.clipboard.writeText(text);
      setMessage(`Copied: ${text}`);
    } catch {
      setMessage(`Send this on WhatsApp: ${text}`);
    }
  };

  const handleSendTip = async () => {
    setBusy(true);
    setMessage(null);
    try {
      const result = await accountApi.notifyWhatsAppNewPiece({
        pieceName: 'Soft linen wrap blouse',
        colour: 'sand',
        category: 'tops',
        reason: 'It flatters your silhouette and fits the warm, easy palette you already wear.',
      });
      setMessage(
        result.delivery === 'template'
          ? `${result.stylistName} sent a WhatsApp template tip about “${result.pieceName}”.`
          : `${result.stylistName} messaged you on WhatsApp about “${result.pieceName}”.`,
      );
      await reload();
    } catch (error) {
      setMessage(explainError(error, 'Could not send the WhatsApp tip.'));
    } finally {
      setBusy(false);
    }
  };

  const linked = Boolean(status?.link?.linked);
  const channelReady = Boolean(status?.enabled);
  const fromDisplay = status?.fromNumber ?? status?.fromNumberMasked;

  return (
    <div className="rounded-2xl border border-[#242326]/8 bg-[#F6F2EC]/50 p-4 space-y-3">
      <div className="flex items-start gap-2.5">
        <div className="w-8 h-8 rounded-xl bg-emerald-600/15 text-emerald-700 flex items-center justify-center shrink-0">
          <MessageSquare className="w-4 h-4" />
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="text-sm font-semibold text-[#242326]">Connect WhatsApp</h4>
          <p className="text-[11px] text-[#5C585E] mt-0.5 leading-relaxed">
            Chat with <span className="font-medium text-[#242326]">{stylistName}</span> on WhatsApp —
            your own stylist persona. After linking, they can also message you first when they spot a piece you’ll love.
          </p>
        </div>
      </div>

      {!channelReady ? (
        <p className="text-[11px] text-[#5C585E] leading-relaxed">
          WhatsApp is not live yet. Register your business number with Twilio WhatsApp (BYON), then set Account SID,
          Auth Token, <span className="font-mono">TWILIO_WHATSAPP_FROM=+27799927273</span>, and{' '}
          <span className="font-mono">WHATSAPP_ENABLED=true</span>.
        </p>
      ) : linked ? (
        <div className="space-y-2">
          <p className="text-xs text-[#242326]">
            Linked to <span className="font-semibold">{status?.link.phoneE164}</span>
            {status?.link.linkedAt ? (
              <span className="text-[#5C585E]"> · since {new Date(status.link.linkedAt).toLocaleDateString()}</span>
            ) : null}
          </p>
          <p className="text-[11px] text-[#5C585E] leading-relaxed">
            Proactive tips:{' '}
            <span className="font-semibold text-[#242326]">
              {status?.link.proactiveOptIn === false ? 'paused' : 'on'}
            </span>
            {' '}· reply STOP on WhatsApp to pause, START to resume.
            {fromDisplay ? (
              <>
                {' '}Business line: <span className="font-mono text-[#242326]">{fromDisplay}</span>
              </>
            ) : null}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => void handleSendTip()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#9C6A61] hover:bg-[#83554D] text-white text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Send sample “new piece” tip
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => void handleUnlink()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#242326]/12 text-xs font-semibold text-[#5C585E] hover:text-[#242326] hover:bg-white transition-colors cursor-pointer disabled:opacity-50"
            >
              <Unlink className="w-3.5 h-3.5" />
              Disconnect WhatsApp
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {fromDisplay ? (
            <p className="text-[11px] text-[#5C585E]">
              MyStyle WhatsApp line:{' '}
              <span className="font-mono text-[#242326]">{fromDisplay}</span>
            </p>
          ) : null}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => void handleGenerate()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#9C6A61] hover:bg-[#83554D] text-white text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
            >
              <Link2 className="w-3.5 h-3.5" />
              {code ? 'Refresh code' : 'Get link code'}
            </button>
            {code ? (
              <button
                type="button"
                onClick={() => void handleCopy()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#242326]/12 bg-white text-xs font-semibold text-[#242326] hover:bg-[#F6F2EC] transition-colors cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                Copy LINK {code.code}
              </button>
            ) : null}
          </div>
          {code ? (
            <p className="text-[11px] text-[#5C585E] leading-relaxed">
              Open WhatsApp, message the MyStyle number, and send{' '}
              <span className="font-mono font-semibold text-[#242326]">LINK {code.code}</span>
              {' '}within 15 minutes. After that, {stylistName} can reply — and start tips when they find a piece for you.
            </p>
          ) : (
            <p className="text-[11px] text-[#5C585E] leading-relaxed">
              Generate a one-time code, then send it from your personal WhatsApp to link this account.
            </p>
          )}
        </div>
      )}

      {message ? (
        <p className="text-[11px] text-[#9C6A61]" role="status">{message}</p>
      ) : null}
    </div>
  );
};
