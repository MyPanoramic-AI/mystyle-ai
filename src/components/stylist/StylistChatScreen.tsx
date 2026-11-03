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
  StylistLookConsultation,
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
import { StylistChatLibrary, type StylistLibraryItem } from './StylistChatLibrary';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Sparkles } from 'lucide-react';
import { AccountApiError, accountApi, type StylistServerMessage } from '../../services/accountApi';
import { toChatMessage } from '../../services/stylistView';
import { fileToBase64 } from '../../services/profilePhotosClient';
import type { PreloadedGarment } from '../../types/shop';
import { resolveStylistPersona } from '../../data/stylistPersona';

const STYLING_WAIT_LINES = [
  'Still thinking how this would look…',
  'Playing with colours and proportions…',
  'Imagining the finished look on you…',
  'Tweaking hair and accessories…',
  'Holding fabrics up to the light…',
  'Almost ready with your look…',
  'Finding the piece that flatters you most…',
  'Sketching a little magic for you…',
] as const;

function waitLineFor(stylistName: string, index: number, demo: boolean): string {
  if (demo) {
    const demoLines = [
      `${stylistName} is preparing a demonstration reply…`,
      'Putting together a sample suggestion…',
      'Almost ready with a demo look…',
    ];
    return demoLines[index % demoLines.length]!;
  }
  const line = STYLING_WAIT_LINES[index % STYLING_WAIT_LINES.length]!;
  if (index % 4 === 0) return `${stylistName} is styling your look…`;
  return line;
}

export interface StylistConnection {
  aiConsent: boolean;
  onEnableConsent: () => Promise<void>;
  availability: () => Promise<{ acceptingMessages: boolean; liveEnabled: boolean; label: string }>;
  list: () => Promise<{ conversations: StylistLibraryItem[] }>;
  open: (id: string) => Promise<{ id: string; title?: string; messages: StylistServerMessage[] }>;
  restore: () => Promise<{ id: string; messages: StylistServerMessage[] }>;
  /** Always create an empty conversation for a focused look consult. */
  startFresh: () => Promise<{ id: string; messages: StylistServerMessage[] }>;
  send: (id: string, text: string, idempotencyKey: string, mediaIds?: string[]) => Promise<StylistServerMessage>;
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
  const [waitLineIndex, setWaitLineIndex] = useState(0);
  const [isLensModalOpen, setIsLensModalOpen] = useState<boolean>(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState<boolean>(false);
  const [inputPrefill, setInputPrefill] = useState<string>('');
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [serviceLabel, setServiceLabel] = useState(connection ? 'Checking the stylist' : 'Demonstration replies on this device');
  const [serviceNotice, setServiceNotice] = useState<string | null>(null);
  const [localDemo, setLocalDemo] = useState(false);
  const [serverReady, setServerReady] = useState(!connection);
  const [offerLocalDemo, setOfferLocalDemo] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [libraryItems, setLibraryItems] = useState<StylistLibraryItem[]>([]);
  const [libraryLoading, setLibraryLoading] = useState(false);
  const [libraryError, setLibraryError] = useState<string | null>(null);

  const stylistName = resolveStylistPersona(profile).name;
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
  }, [messages, isTyping, waitLineIndex]);

  useEffect(() => {
    if (!isTyping) {
      setWaitLineIndex(0);
      return;
    }
    const timer = window.setInterval(() => {
      setWaitLineIndex((current) => current + 1);
    }, 2800);
    return () => window.clearInterval(timer);
  }, [isTyping]);

  useEffect(() => {
    if (!connection) return;
    let cancelled = false;
    const openForLook = Boolean(state.lookConsultation?.pieces.length);
    void connection.availability().then(async (availability) => {
      if (cancelled) return;
      setServiceLabel(availability.label);
      if (!availability.acceptingMessages) {
        setServiceNotice('Live AI is switched off. You can continue with the labelled demonstration on this device.');
        setOfferLocalDemo(true);
        setServerReady(true);
        return;
      }
      // Look consults start a dedicated fresh chat — do not restore an older thread over it.
      if (openForLook) {
        setServiceNotice(availability.liveEnabled ? null : 'These replies come from the demonstration stylist, not a live model.');
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

  const lookCatalogText = (look: StylistLookConsultation): string => {
    const lines = look.pieces.map((piece, index) => {
      const details = [piece.category, piece.brand, piece.color].filter(Boolean).join(' · ');
      return `${index + 1}. ${piece.name}${details ? ` (${details})` : ''}`;
    });
    const foundation = look.base === 'dress' ? 'dress-based' : look.base === 'separates' ? 'top and bottoms' : 'assembled';
    return [
      `I've assembled this ${foundation} look: "${look.title}"${look.occasion ? ` for ${look.occasion}` : ''}.`,
      '',
      'Selected wardrobe pieces (images shown in chat for reference):',
      ...lines,
      '',
      'Please keep these exact pieces in mind. I will ask questions about this specific look.',
    ].join('\n');
  };

  const lookAckResponse = (look: StylistLookConsultation): ChatMessage => {
    const firstName = profile.personal.firstName || 'there';
    const pieceNames = look.pieces.map((piece) => piece.name).join(', ');
    return {
      id: `stylist-look-${Date.now()}`,
      sender: 'stylist',
      timestamp: 'Just now',
      text: `Perfect, ${firstName} — I have your look **${look.title}** open with these pieces: ${pieceNames}.\n\nAsk me anything about this specific combination — proportion, colour harmony, shoes, outerwear, occasion fit, or how to swap one piece.`,
      quickActions: [
        { id: 'look-qa-1', label: 'Does this work together?', prompt: `Does this assembled look "${look.title}" work well together, and what would you tweak first?` },
        { id: 'look-qa-2', label: 'Best shoes for this?', prompt: `What footwear would finish "${look.title}" best with these exact pieces?` },
        { id: 'look-qa-3', label: 'Occasion check', prompt: `Is "${look.title}" appropriate for ${look.occasion || 'my occasion'}, or should I adjust formality?` },
      ],
    };
  };

  const sendServerText = (id: string, typed: string, mediaIds: string[] = []) => {
    const idempotencyKey = `msg-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
    void connection!.send(id, typed, idempotencyKey, mediaIds).then((message) => {
      setMessages((prev) => [...prev, toChatMessage(message)]);
      setIsTyping(false);
      if (mediaIds.length) {
        setServiceNotice(null);
      }
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

  const beginLookConsultation = async (look: StylistLookConsultation) => {
    const typed = lookCatalogText(look);
    const userMsg: ChatMessage = {
      id: `user-look-${Date.now()}`,
      sender: 'user',
      timestamp: 'Just now',
      text: typed,
      userAttachments: look.pieces
        .filter((piece) => Boolean(piece.imageUrl))
        .map((piece) => ({ name: piece.name, url: piece.imageUrl })),
    };

    setIsTyping(true);
    setInputPrefill('');
    setServiceNotice('Your look photos stay in this chat for reference. The stylist receives a written piece list so you can ask follow-up questions.');

    if (!connection || localDemo) {
      setConversationId(null);
      setMessages([userMsg]);
      setTimeout(() => {
        setMessages((prev) => [...prev, lookAckResponse(look)]);
        setIsTyping(false);
      }, 500);
      return;
    }

    try {
      const fresh = await connection.startFresh();
      setConversationId(fresh.id);
      setMessages([userMsg]);
      setServerReady(true);
      sendServerText(fresh.id, typed);
    } catch (error: unknown) {
      setMessages([userMsg, lookAckResponse(look)]);
      setIsTyping(false);
      setLocalDemo(true);
      setServiceNotice(
        error instanceof AccountApiError
          ? `${error.message} Continuing with an on-device look consult.`
          : 'Continuing with an on-device look consult.',
      );
    }
  };

  // Handle incoming navigation state (prompts or wardrobe look consults)
  useEffect(() => {
    if (state.timestamp && state.timestamp !== lastStateTimestampRef.current) {
      lastStateTimestampRef.current = state.timestamp;

      if (state.occasionTitle) {
        setLens((prev) => ({ ...prev, occasion: state.occasionTitle! }));
      }

      if (state.lookConsultation && state.lookConsultation.pieces.length > 0) {
        void beginLookConsultation(state.lookConsultation);
        return;
      }

      if (state.suggestedPrompt) {
        handleUserSend(state.suggestedPrompt);
      }
    }
  }, [state.timestamp]);

  const handleUserSend = (
    text: string,
    attachment?: { name: string; url: string; file?: File }
  ) => {
    if (!text.trim() && !attachment) return;
    const typed = text.trim();

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      timestamp: 'Just now',
      text: typed || 'I attached a photo for styling advice.',
      userAttachmentUrl: attachment?.url,
      userAttachmentName: attachment?.name,
      userAttachments: attachment ? [{ name: attachment.name, url: attachment.url }] : undefined,
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);

    if (!connection || localDemo) {
      setTimeout(() => {
        const response = generateStylistResponse(typed, profile, attachment);
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

    if (!attachment) {
      sendServerText(conversationId, typed);
      return;
    }

    void (async () => {
      try {
        let file = attachment.file;
        if (!file && attachment.url.startsWith('blob:')) {
          const blob = await fetch(attachment.url).then((response) => response.blob());
          file = new File([blob], attachment.name || 'stylist-photo.jpg', { type: blob.type || 'image/jpeg' });
        }
        if (!file) {
          // Sample Unsplash garments: fetch and upload so the live stylist can see them too.
          const blob = await fetch(attachment.url).then((response) => response.blob());
          file = new File([blob], attachment.name || 'sample-garment.jpg', { type: blob.type || 'image/jpeg' });
        }
        await accountApi.setPrivacyConsent({
          purpose: 'private_photo_storage',
          granted: true,
          captureMethod: 'stylist_photo_attach',
        });
        await accountApi.setPrivacyConsent({
          purpose: 'external_photo_ai',
          granted: true,
          captureMethod: 'stylist_photo_attach',
        });
        const uploaded = await accountApi.uploadStylistAttachment(await fileToBase64(file));
        setServiceNotice(`${stylistName} can see your photo and will style from it.`);
        sendServerText(conversationId, typed, [uploaded.id]);
      } catch (error: unknown) {
        setIsTyping(false);
        setServiceNotice(
          error instanceof AccountApiError
            ? error.message
            : 'That photograph could not be uploaded to the stylist.',
        );
      }
    })();
  };

  const handleSelectPrompt = (prompt: string) => {
    handleUserSend(prompt);
  };

  const refreshLibrary = async () => {
    if (!connection) return;
    setLibraryLoading(true);
    setLibraryError(null);
    try {
      const listed = await connection.list();
      setLibraryItems(listed.conversations);
    } catch (error: unknown) {
      setLibraryError(error instanceof AccountApiError ? error.message : 'Your chat library could not be loaded.');
    } finally {
      setLibraryLoading(false);
    }
  };

  const handleOpenLibrary = () => {
    if (!connection || localDemo) {
      setServiceNotice('Sign in to save and reopen chats with your stylist.');
      return;
    }
    setLibraryOpen(true);
    void refreshLibrary();
  };

  const handleOpenLibraryChat = (id: string) => {
    if (!connection) return;
    setLibraryLoading(true);
    setLibraryError(null);
    void connection.open(id).then((opened) => {
      setConversationId(opened.id);
      setMessages(
        opened.messages.length
          ? opened.messages.map(toChatMessage)
          : getInitialConversation(profile, undefined),
      );
      setLibraryOpen(false);
      setServiceNotice(null);
      onClearState();
    }).catch((error: unknown) => {
      setLibraryError(error instanceof AccountApiError ? error.message : 'That chat could not be opened.');
    }).finally(() => {
      setLibraryLoading(false);
    });
  };

  const handleDeleteLibraryChat = (id: string) => {
    if (!connection) return;
    void connection.remove(id).then(async () => {
      setLibraryItems((prev) => prev.filter((item) => item.id !== id));
      if (conversationId === id) {
        const next = await connection.restore();
        setConversationId(next.id);
        setMessages(
          next.messages.length
            ? next.messages.map(toChatMessage)
            : getInitialConversation(profile, undefined),
        );
      }
      await refreshLibrary();
    }).catch((error: unknown) => {
      setLibraryError(error instanceof AccountApiError ? error.message : 'That chat could not be deleted.');
    });
  };

  const handleStartFreshChat = () => {
    const resetLocal = () => {
      setMessages(getInitialConversation(profile, undefined));
      setConversationId(null);
      onClearState();
      setIsResetConfirmOpen(false);
      setLibraryOpen(false);
    };
    if (!connection || localDemo) {
      resetLocal();
      return;
    }
    void connection.startFresh().then((fresh) => {
      setConversationId(fresh.id);
      setMessages(getInitialConversation(profile, undefined));
      setServiceNotice('Started a new chat. Earlier conversations stay in your library.');
      onClearState();
      setIsResetConfirmOpen(false);
      setLibraryOpen(false);
      void refreshLibrary();
    }).catch((error: unknown) => {
      setServiceNotice(error instanceof AccountApiError ? error.message : 'A new chat could not be started.');
      setIsResetConfirmOpen(false);
    });
  };

  const handleResetSession = () => {
    handleStartFreshChat();
  };

  return (
    <div className="relative flex flex-col min-h-[calc(100vh-140px)] -mt-6 -mx-4 sm:-mx-6">
      {/* Stylist Top Header */}
      <StylistHeader
        profile={profile}
        lens={lens}
        onOpenLensModal={() => setIsLensModalOpen(true)}
        onResetSession={() => setIsResetConfirmOpen(true)}
        onNavigateHome={() => onNavigate('home')}
        onOpenDiscover={onOpenDiscover}
        onOpenLibrary={connection && !localDemo ? handleOpenLibrary : undefined}
      />

      <div className="relative flex-1 flex flex-col min-h-0">
      <StylistChatLibrary
        open={libraryOpen}
        stylistName={stylistName}
        conversations={libraryItems}
        activeId={conversationId}
        loading={libraryLoading}
        error={libraryError}
        onClose={() => setLibraryOpen(false)}
        onRefresh={() => void refreshLibrary()}
        onOpen={handleOpenLibraryChat}
        onDelete={handleDeleteLibraryChat}
        onNewChat={handleStartFreshChat}
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
            <div className="rounded-2xl px-4 py-3 bg-white border border-[#242326]/10 shadow-xs flex items-center gap-2 max-w-[85%]">
              <span
                key={waitLineIndex}
                className="text-xs text-[#5C585E] font-medium animate-in fade-in duration-300"
              >
                {waitLineFor(
                  stylistName,
                  waitLineIndex,
                  localDemo || !connection || serviceLabel.toLowerCase().includes('not a live'),
                )}
              </span>
              <div className="flex items-center gap-1 shrink-0">
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
        stylistName={stylistName}
      />
      </div>

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
        title="Start a new chat?"
        subtitle={`Begin a fresh conversation with ${stylistName}.`}
      >
        <div className="space-y-4 pt-2">
          <p className="text-xs text-[#5C585E] leading-relaxed">
            Your current chat stays in the library so you can reopen it anytime. Wardrobe items and style preferences are unchanged.
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
              New Chat
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
