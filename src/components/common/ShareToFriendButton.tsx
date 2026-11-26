/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { Share2, X } from 'lucide-react';
import { shareToFriend, type ShareToFriendPayload } from '../../services/shareToFriend';

interface ShareToFriendButtonProps {
  payload: ShareToFriendPayload;
  variant?: 'button' | 'icon' | 'chip';
  className?: string;
  label?: string;
  onToast?: (message: string) => void;
}

export const ShareToFriendButton: React.FC<ShareToFriendButtonProps> = ({
  payload,
  variant = 'button',
  className = '',
  label = 'Share to a friend',
  onToast,
}) => {
  const [busy, setBusy] = useState(false);
  const [localToast, setLocalToast] = useState<string | null>(null);
  const [manualCopy, setManualCopy] = useState<string | null>(null);

  useEffect(() => {
    if (!localToast) return undefined;
    const timer = window.setTimeout(() => setLocalToast(null), 2800);
    return () => window.clearTimeout(timer);
  }, [localToast]);

  const notify = (message: string) => {
    onToast?.(message);
    setLocalToast(message);
  };

  const handleShare = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (busy) return;
    setBusy(true);
    setManualCopy(null);
    try {
      const result = await shareToFriend(payload);
      if (result.ok) {
        notify(
          result.method === 'clipboard'
            ? 'Copied — paste it to a friend.'
            : 'Ready to share with a friend.',
        );
      } else if (result.message === 'Share cancelled.') {
        // User dismissed the system sheet — no toast needed.
      } else if (result.copyText) {
        setManualCopy(result.copyText);
        notify(result.message);
      } else {
        notify(result.message);
      }
    } catch {
      notify('Sharing failed. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const feedback = (
    <>
      {localToast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[80] px-4 py-2 rounded-full bg-[#242326] text-white text-xs font-medium shadow-lg animate-in fade-in duration-150 pointer-events-none">
          {localToast}
        </div>
      )}
      {manualCopy && (
        <div
          className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Copy share text"
          onClick={() => setManualCopy(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white border border-[#242326]/10 shadow-2xl p-4 space-y-3"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-serif text-base font-semibold text-[#242326]">Share to a friend</h3>
                <p className="text-xs text-[#5C585E] mt-1">
                  Copy this note and paste it into WhatsApp, Messages, or email.
                </p>
              </div>
              <button
                type="button"
                className="w-8 h-8 rounded-full hover:bg-[#F6F2EC] flex items-center justify-center text-[#5C585E] cursor-pointer"
                aria-label="Close"
                onClick={() => setManualCopy(null)}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <textarea
              readOnly
              value={manualCopy}
              className="w-full min-h-36 rounded-xl border border-[#242326]/10 bg-[#FAF7F2] px-3 py-2 text-xs text-[#242326] outline-none"
              onFocus={(event) => event.currentTarget.select()}
            />
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-[#9C6A61] hover:bg-[#83554D] text-white text-xs font-semibold cursor-pointer"
                onClick={() => {
                  void (async () => {
                    try {
                      await navigator.clipboard.writeText(manualCopy);
                      notify('Copied — paste it to a friend.');
                      setManualCopy(null);
                    } catch {
                      notify('Select the text and press Ctrl+C to copy.');
                    }
                  })();
                }}
              >
                Copy text
              </button>
              <a
                href={`https://wa.me/?text=${encodeURIComponent(manualCopy)}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-[#242326] hover:bg-black text-white text-xs font-semibold"
                onClick={() => setManualCopy(null)}
              >
                Open WhatsApp
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );

  if (variant === 'icon') {
    return (
      <>
        <button
          type="button"
          onClick={(event) => void handleShare(event)}
          disabled={busy}
          className={`w-9 h-9 rounded-xl flex items-center justify-center border bg-white hover:bg-[#FAF7F2] text-[#5C585E] border-[#242326]/15 transition-colors cursor-pointer disabled:opacity-50 ${className}`}
          title={label}
          aria-label={label}
          data-testid="share-to-friend"
        >
          <Share2 className="w-4 h-4" />
        </button>
        {feedback}
      </>
    );
  }

  if (variant === 'chip') {
    return (
      <>
        <button
          type="button"
          onClick={(event) => void handleShare(event)}
          disabled={busy}
          className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold border bg-white text-[#5C585E] border-[#242326]/12 hover:border-[#9C6A61] hover:text-[#9C6A61] transition-colors cursor-pointer disabled:opacity-50 ${className}`}
          title={label}
          aria-label={label}
          data-testid="share-to-friend"
        >
          <Share2 className="w-3 h-3" />
          <span>Share</span>
        </button>
        {feedback}
      </>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={(event) => void handleShare(event)}
        disabled={busy}
        className={`flex-1 min-w-[130px] inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-[#FAF7F2] text-[#242326] text-xs font-semibold border border-[#242326]/15 shadow-xs transition-colors cursor-pointer disabled:opacity-50 ${className}`}
        data-testid="share-to-friend"
        aria-label={label}
      >
        <Share2 className="w-3.5 h-3.5" />
        <span>{busy ? 'Sharing…' : label}</span>
      </button>
      {feedback}
    </>
  );
};
