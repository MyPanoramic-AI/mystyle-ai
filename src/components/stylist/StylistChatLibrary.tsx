/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { FolderOpen, MessageCircle, Plus, Trash2, X } from 'lucide-react';

export interface StylistLibraryItem {
  id: string;
  title: string;
  lastActivityAt: string;
  createdAt?: string;
}

interface StylistChatLibraryProps {
  open: boolean;
  stylistName: string;
  conversations: StylistLibraryItem[];
  activeId: string | null;
  loading: boolean;
  error: string | null;
  onClose: () => void;
  onRefresh: () => void;
  onOpen: (id: string) => void;
  onDelete: (id: string) => void;
  onNewChat: () => void;
}

function formatActivity(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const now = Date.now();
  const diffMs = now - date.getTime();
  const minute = 60_000;
  const hour = 60 * minute;
  const day = 24 * hour;
  if (diffMs < minute) return 'Just now';
  if (diffMs < hour) return `${Math.max(1, Math.floor(diffMs / minute))}m ago`;
  if (diffMs < day) return `${Math.max(1, Math.floor(diffMs / hour))}h ago`;
  if (diffMs < 7 * day) return `${Math.max(1, Math.floor(diffMs / day))}d ago`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function displayTitle(title: string): string {
  const trimmed = title.trim();
  if (!trimmed || trimmed === 'New styling session') return 'New styling session';
  return trimmed.length > 72 ? `${trimmed.slice(0, 69)}…` : trimmed;
}

export const StylistChatLibrary: React.FC<StylistChatLibraryProps> = ({
  open,
  stylistName,
  conversations,
  activeId,
  loading,
  error,
  onClose,
  onRefresh,
  onOpen,
  onDelete,
  onNewChat,
}) => {
  if (!open) return null;

  return (
    <div className="absolute inset-0 z-40 flex flex-col bg-[#F6F2EC]/98 backdrop-blur-sm">
      <div className="bg-white/95 border-b border-[#242326]/10 px-4 sm:px-6 py-3.5 shrink-0">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-full bg-[#FAF7F2] border border-[#242326]/10 text-[#9C6A61] flex items-center justify-center shrink-0">
              <FolderOpen className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h2 className="font-serif text-base font-semibold text-[#242326] leading-none">Chat library</h2>
              <p className="text-[11px] text-[#5C585E] mt-1 truncate">
                Saved conversations with {stylistName}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onNewChat}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#242326] text-white text-xs font-medium hover:bg-[#3a373c] transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              New chat
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-[#F6F2EC] hover:bg-[#E5CDBE]/30 text-[#5C585E] hover:text-[#242326] flex items-center justify-center border border-[#242326]/5 transition-colors cursor-pointer"
              aria-label="Close chat library"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-5">
        <div className="max-w-4xl mx-auto space-y-3">
          {error && (
            <div className="rounded-2xl border border-[#242326]/10 bg-white px-4 py-3 text-xs text-[#5C585E]">
              <p>{error}</p>
              <button type="button" className="mt-2 font-semibold text-[#9C6A61]" onClick={onRefresh}>
                Try again
              </button>
            </div>
          )}

          {loading && !conversations.length && (
            <p className="text-xs text-[#5C585E] text-center py-10">Loading your chats…</p>
          )}

          {!loading && !error && conversations.length === 0 && (
            <div className="rounded-2xl border border-dashed border-[#242326]/15 bg-white/70 px-6 py-10 text-center">
              <MessageCircle className="w-8 h-8 text-[#9C6A61] mx-auto mb-3" />
              <p className="text-sm font-medium text-[#242326]">No saved chats yet</p>
              <p className="text-xs text-[#5C585E] mt-1.5 max-w-sm mx-auto">
                Every conversation with {stylistName} is kept here so you can reopen it later.
              </p>
              <button
                type="button"
                onClick={onNewChat}
                className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#FAF7F2] border border-[#242326]/10 text-xs font-medium text-[#242326] hover:bg-[#F6F2EC] transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-[#9C6A61]" />
                Start your first chat
              </button>
            </div>
          )}

          {conversations.map((conversation) => {
            const active = conversation.id === activeId;
            return (
              <div
                key={conversation.id}
                className={`group flex items-stretch gap-2 rounded-2xl border bg-white transition-colors ${
                  active
                    ? 'border-[#9C6A61]/40 shadow-xs'
                    : 'border-[#242326]/10 hover:border-[#9C6A61]/25'
                }`}
              >
                <button
                  type="button"
                  onClick={() => onOpen(conversation.id)}
                  className="flex-1 min-w-0 text-left px-4 py-3.5 cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <MessageCircle className={`w-3.5 h-3.5 shrink-0 ${active ? 'text-[#9C6A61]' : 'text-[#B49361]'}`} />
                    <p className="text-sm font-medium text-[#242326] truncate">
                      {displayTitle(conversation.title)}
                    </p>
                    {active && (
                      <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-sm bg-[#9C6A61]/10 text-[#9C6A61] shrink-0">
                        Open
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-[#5C585E] mt-1.5 pl-5">
                    {formatActivity(conversation.lastActivityAt) || 'Saved chat'}
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(conversation.id)}
                  className="shrink-0 self-center mr-3 w-8 h-8 rounded-full text-[#5C585E] hover:text-[#9C6A61] hover:bg-[#FAF7F2] flex items-center justify-center transition-colors cursor-pointer opacity-70 group-hover:opacity-100"
                  aria-label={`Delete ${displayTitle(conversation.title)}`}
                  title="Delete chat"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
