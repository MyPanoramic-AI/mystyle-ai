/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Share2 } from 'lucide-react';
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

  const handleShare = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const result = await shareToFriend(payload);
      if (result.ok) {
        onToast?.(
          result.method === 'clipboard'
            ? 'Copied — paste it to a friend.'
            : 'Ready to share with a friend.',
        );
      } else if (result.message !== 'Share cancelled.') {
        onToast?.(result.message);
      }
    } finally {
      setBusy(false);
    }
  };

  if (variant === 'icon') {
    return (
      <button
        type="button"
        onClick={() => void handleShare()}
        disabled={busy}
        className={`w-9 h-9 rounded-xl flex items-center justify-center border bg-white hover:bg-[#FAF7F2] text-[#5C585E] border-[#242326]/15 transition-colors cursor-pointer disabled:opacity-50 ${className}`}
        title={label}
        aria-label={label}
        data-testid="share-to-friend"
      >
        <Share2 className="w-4 h-4" />
      </button>
    );
  }

  if (variant === 'chip') {
    return (
      <button
        type="button"
        onClick={() => void handleShare()}
        disabled={busy}
        className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold border bg-white text-[#5C585E] border-[#242326]/12 hover:border-[#9C6A61] hover:text-[#9C6A61] transition-colors cursor-pointer disabled:opacity-50 ${className}`}
        title={label}
        aria-label={label}
        data-testid="share-to-friend"
      >
        <Share2 className="w-3 h-3" />
        <span>Share</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => void handleShare()}
      disabled={busy}
      className={`flex-1 min-w-[130px] inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-[#FAF7F2] text-[#242326] text-xs font-semibold border border-[#242326]/15 shadow-xs transition-colors cursor-pointer disabled:opacity-50 ${className}`}
      data-testid="share-to-friend"
      aria-label={label}
    >
      <Share2 className="w-3.5 h-3.5" />
      <span>{busy ? 'Sharing…' : label}</span>
    </button>
  );
};
