/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  UserProfile,
  TemporaryPhotos,
  NavigationTab,
  StylistNavigationState,
  ChatMessage,
  StylistFilterLens,
} from '../../types';
import {
  getInitialConversation,
  generateStylistResponse,
} from '../../data/stylistKnowledge';
import { StylistHeader } from './StylistHeader';
import { ChatMessageItem } from './ChatMessageItem';
import { StylistInputBar } from './StylistInputBar';
import { ProfileLensModal } from './ProfileLensModal';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Sparkles, MessageCircle } from 'lucide-react';
import { AccountApiError, type StylistServerMessage } from '../../services/accountApi';
import { toChatMessage } from '../../services/stylistView';
import type { PreloadedGarment } from '../../types/shop';

export interface StylistConnection {
  aiConsent: boolean;
  onEnableConsent: () => Promise<void>;
  availability: () => Promise<{ acceptingMessages: boolean; liveEnabled: boolean; label: string }>;
  restore: () => Promise<{ id: string; messages: StylistServerMessage[] }>;
  send: (id: string, text: string, idempotencyKey: string) => Promise<StylistServerMessage>;
  remove: (id: string) => Promise<void>;
}

interface StylistChatScreenProps {
  profile: UserProfile;
  photos: TemporaryPhotos;
  state: StylistNavigationState;
  onNavigate: (tab: NavigationTab) => void;
  onClearState: () => void;
  onOpenDiscover?: () => void;
  onSendToTryOn?: (garment: PreloadedGarment) => void;
  connection?: StylistConnection;
}

export const StylistChatScreen: React.FC<StylistChatScreenProps> = ({
  profile,
  photos,
  state,
  onNavigate,
  onClearState,
  onOpenDiscover,
  onSendToTryOn,
  connection,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>(() =>
    getInitialConversation(profile, state)
  );
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [isLensModalOpen, setIsLensModalOpen] = useState<boolean>(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState<boolean>(false);
  const [inputPrefill, setInputPrefill] = useState<string>('');
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [serviceLabel, setServiceLabel] = useState(connection ? 'Checking the stylist' : 'Demonstration replies on this device');
  const [serviceNotice, setServiceNotice] = useState<string | null>(null);
  const [localDemo, setLocalDemo] = useState(false);
  const [serverReady, setServerReady] = useState(!connection);
  const [offerLocalDemo, setOfferLocalDemo] = useState(false);

  const [lens, setLens] = useState<StylistFilterLens>({
    occasion: state.occasionTitle || 'Everyday Versatile',
    formality: 'Smart-Casual',
    budgetTier: profile.shopping.itemBudget || '300-600',
  });

  const chatBottomRef = useRef<HTMLDivElement>(null);
  const lastStateTimestampRef = useRef<number | undefined>(state.timestamp);

  // Auto-scroll when messages update
  const scrollToBottom = () => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  useEffect(() => {
    if (!connection) return;
    let cancelled = false;
    void connection.availability().then(async (availability) => {
      if (cancelled) return;
      setServiceLabel(availability.label);
      if (!availability.acceptingMessages) {
        setServiceNotice('Live AI is switched off. You can continue with the labelled demonstration on this device.');
        setOfferLocalDemo(true);
        setServerReady(true);
        return;
      }
      const restored = await connection.restore();
      if (cancelled) return;
      setConversationId(restored.id);
      if (restored.messages.length) setMessages(restored.messages.map(toChatMessage));
      setServiceNotice(availability.liveEnabled ? null : 'These replies come from the demonstration stylist, not a live model.');
      setServerReady(true);
    }).catch((error: unknown) => {
      if (cancelled) return;
      setServiceNotice(error instanceof AccountApiError ? error.message : 'The stylist could not be reached.');
      setOfferLocalDemo(true);
      setServerReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Handle incoming new navigation state from Home screen
  useEffect(() => {
    if (state.timestamp && state.timestamp !== lastStateTimestampRef.current) {
      lastStateTimestampRef.current = state.timestamp;

      if (state.occasionTitle) {
        setLens((prev) => ({ ...prev, occasion: state.occasionTitle! }));
      }

      if (state.suggestedPrompt) {
        // Send the suggested prompt smoothly as a user message
        handleUserSend(state.suggestedPrompt);
      }
    }
  }, [state.timestamp]);

  const handleUserSend = (
    text: string,
    attachment?: { name: string; url: string }
  ) => {
    if (!text.trim() && !attachment) return;
    const typed = text.trim();
    if (connection && !localDemo && attachment) {
      setServiceNotice('Photographs are not sent to the stylist. The message uses your typed words only.');
    }

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      timestamp: 'Just now',
      text: typed || 'I attached a photo, but it stays on this device.',
      userAttachmentUrl: connection && !localDemo ? undefined : attachment?.url,
      userAttachmentName: connection && !localDemo ? undefined : attachment?.name,
    };

    setMessages((prev) => [...prev, userMsg]);
    if (connection && !localDemo && !typed) {
      setServiceNotice('Photographs are not sent to the stylist.');
      return;
    }
    setIsTyping(true);

    if (!connection || localDemo) {
      setTimeout(() => {
        const response = generateStylistResponse(typed, profile, localDemo ? undefined : attachment);
        const stylistMsg: ChatMessage = {
          id: `stylist-${Date.now()}`,
          sender: 'stylist',
          timestamp: 'Just now',
          text: response.text,
          outfitCard: response.outfitCard,
          beautyTip: response.beautyTip,
          quickActions: response.quickActions,
        };
        setMessages((prev) => [...prev, stylistMsg]);
        setIsTyping(false);
      }, 600);
      return;
    }

    if (!conversationId || !serverReady) {
      setIsTyping(false);
      setServiceNotice(serviceNotice ?? 'The stylist is not ready for a saved conversation.');
      return;
    }
    const idempotencyKey = `msg-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
    void connection.send(conversationId, typed, idempotencyKey).then((message) => {
      setMessages((prev) => [...prev, toChatMessage(message)]);
      setIsTyping(false);
    }).catch((error: unknown) => {
      setIsTyping(false);
      const failed: ChatMessage = {
        id: `failed-${Date.now()}`,
        sender: 'stylist',
        timestamp: 'Just now',
        text: error instanceof AccountApiError ? error.message : 'That message could not be sent.',
      };
      setMessages((prev) => [...prev, failed]);
    });
  };

  const handleSelectPrompt = (prompt: string) => {
    handleUserSend(prompt);
  };

  const handleResetSession = () => {
    const resetLocal = () => {
      setMessages(getInitialConversation(profile, undefined));
      onClearState();
      setIsResetConfirmOpen(false);
    };
    if (!connection || localDemo || !conversationId) {
      resetLocal();
      return;
    }
    void connection.remove(conversationId).then(async () => {
      const next = await connection.restore();
      setConversationId(next.id);
      setMessages(getInitialConversation(profile, undefined));
      setServiceNotice('The saved conversation was deleted.');
      onClearState();
      setIsResetConfirmOpen(false);
    }).catch((error: unknown) => {
      setServiceNotice(error instanceof AccountApiError ? error.message : 'The conversation could not be deleted.');
      setIsResetConfirmOpen(false);
    });
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-140px)] -mt-6 -mx-4 sm:-mx-6">
      {/* Stylist Top Header */}
      <StylistHeader
        profile={profile}
        lens={lens}
        onOpenLensModal={() => setIsLensModalOpen(true)}
        onResetSession={() => setIsResetConfirmOpen(true)}
        onNavigateHome={() => onNavigate('home')}
        onOpenDiscover={onOpenDiscover}
      />

      {/* Chat Messages Scroll Container */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 max-w-4xl w-full mx-auto space-y-6">
        {/* Session Intro Kicker */}
        <div className="text-center py-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#9C6A61] px-3 py-1 rounded-full bg-[#FAF7F2] border border-[#242326]/5 inline-flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-[#B49361]" />
            {localDemo || !connection ? 'Demonstration replies on this device' : serviceLabel}
          </span>
          {connection && !connection.aiConsent && !localDemo && (
            <div className="mt-3 rounded-2xl border border-[#242326]/10 bg-white px-4 py-3 text-xs text-[#5C585E]">
              <p>Personalised styling is off, so saved colours, sizes, and budget stay out of the stylist.</p>
              <button type="button" className="mt-2 font-semibold text-[#9C6A61]" onClick={() => void connection.onEnableConsent().catch((error: unknown) => {
                setServiceNotice(error instanceof AccountApiError ? error.message : 'Personalised styling could not be turned on.');
              })}>
                Allow personalised styling
              </button>
            </div>
          )}
          {serviceNotice && (
            <div className="mt-3 rounded-2xl border border-[#242326]/10 bg-white px-4 py-3 text-xs text-[#5C585E]">
              <p>{serviceNotice}</p>
              {offerLocalDemo && connection && !localDemo && (
                <button type="button" className="mt-2 font-semibold text-[#9C6A61]" onClick={() => {
                  setLocalDemo(true);
                  setServiceLabel('Demonstration replies on this device');
                  setServiceNotice('You are using the on-device demonstration. It is not a live model, and it can show sample shop cards.');
                }}>
                  Use the on-device demonstration
                </button>
              )}
            </div>
          )}
        </div>

        {/* Message Stream */}
        {messages.map((message) => (
          <ChatMessageItem
            key={message.id}
            message={message}
            profile={profile}
            photos={photos}
            onNavigateToShop={() => onNavigate('shop')}
            onSendToTryOn={onSendToTryOn}
            onSelectPrompt={handleSelectPrompt}
          />
        ))}

        {/* Typing Indicator */}
        {isTyping && (
          <div className="flex items-start gap-3 animate-in fade-in duration-200">
            <div className="w-8 h-8 rounded-full bg-[#9C6A61] text-white flex items-center justify-center shrink-0 shadow-xs">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div className="rounded-2xl px-4 py-3 bg-white border border-[#242326]/10 shadow-xs flex items-center gap-2">
              <span className="text-xs text-[#5C585E] font-medium">{localDemo || !connection || serviceLabel.toLowerCase().includes('not a live') ? 'Aria is preparing a demonstration reply' : 'Aria is styling your look'}</span>
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#9C6A61] animate-bounce [animation-delay:-0.3s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-[#9C6A61] animate-bounce [animation-delay:-0.15s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-[#9C6A61] animate-bounce" />
              </div>
            </div>
          </div>
        )}

        <div ref={chatBottomRef} />
      </div>

      {/* Stylist Input Bar */}
      <StylistInputBar
        onSendMessage={handleUserSend}
        isGenerating={isTyping}
        onSelectPrompt={handleSelectPrompt}
        inputPrefill={inputPrefill}
      />

      {/* Profile Lens Modal */}
      <ProfileLensModal
        isOpen={isLensModalOpen}
        onClose={() => setIsLensModalOpen(false)}
        lens={lens}
        onSaveLens={(newLens) => {
          setLens(newLens);
          handleUserSend(
            `I've updated my styling lens for **${newLens.occasion}** with a **${newLens.formality}** dress code. Please refine recommendations.`
          );
        }}
        profile={profile}
      />

      {/* Reset Confirmation Modal */}
      <Modal
        isOpen={isResetConfirmOpen}
        onClose={() => setIsResetConfirmOpen(false)}
        title="Start New Styling Session?"
        subtitle="This will clear your current conversation history with Aria."
      >
        <div className="space-y-4 pt-2">
          <p className="text-xs text-[#5C585E] leading-relaxed">
            Your saved wardrobe items and personal style preferences will remain intact. Only the current chat messages will be refreshed.
          </p>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#242326]/10">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsResetConfirmOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="charcoal"
              size="sm"
              onClick={handleResetSession}
            >
              Start Fresh Session
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
