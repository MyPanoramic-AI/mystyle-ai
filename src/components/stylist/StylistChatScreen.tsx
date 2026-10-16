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

interface StylistChatScreenProps {
  profile: UserProfile;
  photos: TemporaryPhotos;
  state: StylistNavigationState;
  onNavigate: (tab: NavigationTab) => void;
  onClearState: () => void;
  onOpenDiscover?: () => void;
}

export const StylistChatScreen: React.FC<StylistChatScreenProps> = ({
  profile,
  photos,
  state,
  onNavigate,
  onClearState,
  onOpenDiscover,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>(() =>
    getInitialConversation(profile, state)
  );
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [isLensModalOpen, setIsLensModalOpen] = useState<boolean>(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState<boolean>(false);
  const [inputPrefill, setInputPrefill] = useState<string>('');

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

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      timestamp: 'Just now',
      text: text.trim() || `[Attached garment: ${attachment?.name}]`,
      userAttachmentUrl: attachment?.url,
      userAttachmentName: attachment?.name,
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);

    // Simulate realistic thoughtful stylist response timing (550ms)
    setTimeout(() => {
      const response = generateStylistResponse(text, profile, attachment);

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
  };

  const handleSelectPrompt = (prompt: string) => {
    handleUserSend(prompt);
  };

  const handleResetSession = () => {
    setMessages(getInitialConversation(profile, undefined));
    onClearState();
    setIsResetConfirmOpen(false);
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
            Personal Styling Session Active · Tailored to {profile.personal.firstName || 'You'}
          </span>
        </div>

        {/* Message Stream */}
        {messages.map((message) => (
          <ChatMessageItem
            key={message.id}
            message={message}
            profile={profile}
            photos={photos}
            onNavigateToShop={() => onNavigate('shop')}
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
              <span className="text-xs text-[#5C585E] font-medium">Aria is styling your look</span>
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
