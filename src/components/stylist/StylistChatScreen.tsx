/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useState, useEffect, useRef } from 'react';
import {
  UserProfile,
  TemporaryPhotos,
  NavigationTab,
  StylistNavigationState,
  StylistLookConsultation,
  ChatMessage,
  StylistFilterLens,
  StylistQuickAction,
} from '../../types';
import {
  getInitialConversation,
  generateStylistResponse,
} from '../../data/stylistKnowledge';
import {
  GARMENT_FOLLOW_UPS,
  garmentFollowUpActions,
  inferGarmentLabel,
  shopSearchForFollowUp,
  type GarmentFollowUpId,
} from '../../data/garmentFollowUps';
import { StylistHeader } from './StylistHeader';
import { ChatMessageItem } from './ChatMessageItem';
import { StylistInputBar } from './StylistInputBar';
import { StylistLiveVoicePanel } from './StylistLiveVoicePanel';
import { ProfileLensModal } from './ProfileLensModal';
import { StylistChatLibrary, type StylistLibraryItem } from './StylistChatLibrary';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Phone, Sparkles } from 'lucide-react';
import { AccountApiError, accountApi, type StylistServerMessage } from '../../services/accountApi';
import { toChatMessage } from '../../services/stylistView';
import { shopContextFromOutfit } from '../../services/stylistShopMatch';
import { fileToBase64 } from '../../services/profilePhotosClient';
import type { PreloadedGarment } from '../../types/shop';
import type { StylistOutfitRecommendation } from '../../types/stylist';
import type { WardrobeItem } from '../../types/wardrobe';
import { getWardrobeItems } from '../../services/wardrobeService';
import { itemFromRecord } from '../../services/wardrobeAccount';
import { resolveStylistPersona } from '../../data/stylistPersona';
import type { ShopPreloadedContext } from '../pages/ShopPlaceholder';
import { useGptLiveVoice, type GptLiveTranscriptTurn } from '../../hooks/useGptLiveVoice';
import { voiceAssistantPromisedLook, voiceWantsLookVisualization } from '../../utils/voiceVisualIntent';
import { spokenTextHasOutfitOptions, voiceOutfitCardsFromText } from '../../utils/voiceOutfitCards';
import type { VoiceLookVisual } from './StylistLiveVoicePanel';

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
  availability: () => Promise<{
    acceptingMessages: boolean;
    liveEnabled: boolean;
    label: string;
    voice?: { voiceEnabled: boolean; label: string };
  }>;
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
  onShopForGarment?: (context: ShopPreloadedContext) => void;
  onOpenBeautyStudio?: () => void;
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
  onShopForGarment,
  onOpenBeautyStudio,
  connection,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>(() =>
    getInitialConversation(profile, state)
  );
  const [wardrobeItems, setWardrobeItems] = useState<WardrobeItem[]>([]);
  const wardrobeItemsRef = useRef<WardrobeItem[]>([]);
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
  const [garmentContext, setGarmentContext] = useState<{ name: string; url: string } | null>(null);
  const [voiceMode, setVoiceMode] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [voiceLookVisual, setVoiceLookVisual] = useState<VoiceLookVisual | null>(null);
  const [voiceLookLoading, setVoiceLookLoading] = useState(false);
  const [voiceLookError, setVoiceLookError] = useState<string | null>(null);
  const [voiceOutfitCards, setVoiceOutfitCards] = useState<StylistOutfitRecommendation[]>([]);
  const [cardLookBusy, setCardLookBusy] = useState(false);
  /** Latest outfit + generated look so Shop the Look can attach them automatically. */
  const [activeShopOutfit, setActiveShopOutfit] = useState<StylistOutfitRecommendation | null>(null);
  const [activeLookImageUrl, setActiveLookImageUrl] = useState<string | null>(null);
  const [lens, setLens] = useState<StylistFilterLens>({
    occasion: state.occasionTitle || 'Everyday Versatile',
    formality: 'Smart-Casual',
    budgetTier: profile.shopping.itemBudget || '300-600',
  });
  const pendingVoiceTranscripts = useRef<GptLiveTranscriptTurn[]>([]);
  const voiceVisualInFlightRef = useRef(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const voiceVisualDoneForPromptRef = useRef<string | null>(null);
  const recentUserVoiceRef = useRef<string[]>([]);
  const conversationIdRef = useRef<string | null>(null);
  const messagesRef = useRef<ChatMessage[]>([]);
  const voiceAnnounceRef = useRef<(title: string) => void>(() => undefined);

  const stylistName = resolveStylistPersona(profile).name;

  const persistVoiceTurn = useCallback((turn: GptLiveTranscriptTurn) => {
    if (!turn.final || !turn.text.trim()) return;
    pendingVoiceTranscripts.current.push(turn);
    const conversation = conversationIdRef.current;
    if (!conversation || !connection) return;
    const batch = pendingVoiceTranscripts.current.splice(0, pendingVoiceTranscripts.current.length);
    void accountApi.appendStylistVoiceTranscripts(
      conversation,
      batch.map((item) => ({
        role: item.role,
        content: item.text,
        idempotencyKey: item.id,
      })),
    ).catch(() => {
      pendingVoiceTranscripts.current.unshift(...batch);
    });
  }, [connection]);

  const lookPromptFromOutfit = useCallback((outfit: StylistOutfitRecommendation) => {
    const pieces = outfit.pieces.map((piece) => piece.name).filter(Boolean).join(', ');
    return [
      `Show me a full-body look visualization of me wearing ${outfit.title}.`,
      pieces ? `Outfit pieces: ${pieces}.` : '',
      outfit.stylistRationale ? `Styling note: ${outfit.stylistRationale}` : '',
      'Keep my face and body from my profile photos. Head-to-toe fashion photograph, not a product shot.',
    ].filter(Boolean).join(' ').slice(0, 700);
  }, []);

  const requestVoiceLookVisual = useCallback(async (prompt: string, opts?: { force?: boolean }) => {
    const conversation = conversationIdRef.current;
    if (!conversation || !connection) {
      setServiceNotice('Start or open a live stylist chat to generate a look visualization.');
      return;
    }
    const cleaned = prompt.replace(/\s+/g, ' ').trim();
    if (cleaned.length < 8) return;
    if (voiceVisualInFlightRef.current) return;
    // Avoid regenerating the same ask repeatedly in one call.
    const dedupeKey = cleaned.slice(0, 160).toLowerCase();
    if (!opts?.force && voiceVisualDoneForPromptRef.current === dedupeKey) return;
    voiceVisualInFlightRef.current = true;
    setVoiceLookLoading(true);
    setCardLookBusy(true);
    setVoiceLookError(null);
    setServiceNotice(null);
    try {
      const result = await accountApi.createStylistVoiceVisual(conversation, cleaned);
      voiceVisualDoneForPromptRef.current = dedupeKey;
      setVoiceLookVisual({
        imageUrl: result.imageUrl,
        title: result.title,
        promptUsed: result.promptUsed,
      });
      setActiveLookImageUrl(result.imageUrl);
      setMessages((prev) => [
        ...prev,
        {
          id: `voice-look-${result.mediaId}`,
          sender: 'stylist',
          text: `Here is a look visualization for what we discussed.`,
          timestamp: new Date().toISOString(),
          lookImageUrl: result.imageUrl,
        },
      ]);
      voiceAnnounceRef.current(result.title);
      window.setTimeout(() => {
        const pane = chatScrollRef.current;
        if (pane) pane.scrollTo({ top: pane.scrollHeight, behavior: 'smooth' });
      }, 80);
    } catch (error) {
      const message = error instanceof AccountApiError
        ? error.message
        : 'Could not create a look visualization right now.';
      setVoiceLookError(message);
      setServiceNotice(message);
    } finally {
      voiceVisualInFlightRef.current = false;
      setVoiceLookLoading(false);
      setCardLookBusy(false);
    }
  }, [connection]);

  const handleGenerateLook = useCallback(async (outfit: StylistOutfitRecommendation) => {
    setActiveShopOutfit(outfit);
    await requestVoiceLookVisual(lookPromptFromOutfit(outfit), { force: true });
  }, [lookPromptFromOutfit, requestVoiceLookVisual]);

  const buildVoiceLookPrompt = useCallback((seed: string) => {
    const recentAssistant = [...messagesRef.current].reverse().find((message) => message.sender === 'stylist');
    const recentUser = recentUserVoiceRef.current.slice(-3).join(' ');
    return [seed, recentUser, recentAssistant?.text].filter(Boolean).join('. ').slice(0, 700);
  }, []);

  const voice = useGptLiveVoice({
    createSession: async (sdp) => {
      let id = conversationIdRef.current;
      if (!id && connection) {
        const fresh = await connection.startFresh();
        id = fresh.id;
        setConversationId(id);
        setMessages([]);
      }
      return accountApi.createStylistVoiceSession({
        sdp,
        conversationId: id,
        audioVoice: resolveStylistPersona(profile).audioVoice,
      });
    },
    closeSession: async (sessionId, body) => {
      await accountApi.closeStylistVoiceSession(sessionId, body);
      const leftover = pendingVoiceTranscripts.current.splice(0, pendingVoiceTranscripts.current.length);
      const conversation = conversationIdRef.current;
      if (leftover.length && conversation) {
        await accountApi.appendStylistVoiceTranscripts(
          conversation,
          leftover.map((item) => ({
            role: item.role,
            content: item.text,
            idempotencyKey: item.id,
          })),
        ).catch(() => undefined);
      }
    },
    onFinalTranscript: (turn) => {
      persistVoiceTurn(turn);
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        const sender = turn.role === 'user' ? 'user' : 'stylist';
        if (last && last.sender === sender && last.text === turn.text) return prev;
        return [
          ...prev,
          {
            id: turn.id,
            sender,
            text: turn.text,
            timestamp: new Date().toISOString(),
          },
        ];
      });
      if (turn.role === 'user') {
        recentUserVoiceRef.current = [...recentUserVoiceRef.current.slice(-4), turn.text.trim()].filter(Boolean);
        const combinedUser = recentUserVoiceRef.current.join(' ');
        const hasPriorLook = messagesRef.current.some((message) => Boolean(message.lookImageUrl));
        if (
          voiceWantsLookVisualization(turn.text, hasPriorLook)
          || voiceWantsLookVisualization(combinedUser, hasPriorLook)
        ) {
          void requestVoiceLookVisual(buildVoiceLookPrompt(combinedUser || turn.text));
        }
      } else if (turn.role === 'assistant') {
        if (spokenTextHasOutfitOptions(turn.text)) {
          const cards = voiceOutfitCardsFromText(turn.text, {
            idPrefix: `voice-${turn.id}`,
            profile,
            wardrobeItems: wardrobeItemsRef.current,
            occasion: lens.occasion || 'Outfit options',
          });
          if (cards.length) {
            setVoiceOutfitCards(cards);
            setActiveShopOutfit(cards[0]);
            setMessages((prev) => {
              const already = prev.some((message) => message.id === `voice-cards-${turn.id}`);
              if (already) return prev;
              return [
                ...prev,
                {
                  id: `voice-cards-${turn.id}`,
                  sender: 'stylist',
                  text: 'Here are garment previews for the options we just discussed.',
                  timestamp: new Date().toISOString(),
                  outfitCards: cards,
                  outfitCard: cards[0],
                },
              ];
            });
          }
        }
        if (voiceAssistantPromisedLook(turn.text)) {
          // Aria promised a look on screen — generate even if the user's ask was fragmented.
          const seed = recentUserVoiceRef.current.slice(-3).join(' ') || turn.text;
          void requestVoiceLookVisual(buildVoiceLookPrompt(seed));
        }
      }
    },
    onError: (message) => setServiceNotice(message),
  });

  voiceAnnounceRef.current = voice.announceOnScreenLook;
  conversationIdRef.current = conversationId;
  messagesRef.current = messages;

  const lastStateTimestampRef = useRef<number | undefined>(state.timestamp);

  const rememberGarmentFromMessages = (mapped: ChatMessage[]) => {
    const lastUpload = [...mapped].reverse().find((message) => message.userAttachmentUrl);
    if (lastUpload?.userAttachmentUrl) {
      setGarmentContext({
        name: lastUpload.userAttachmentName || 'Uploaded garment',
        url: lastUpload.userAttachmentUrl,
      });
      return;
    }
    setGarmentContext(null);
  };

  // Scroll only the chat pane — never the document (scrollIntoView blows the page up).
  const scrollToBottom = useCallback((smooth = true) => {
    const pane = chatScrollRef.current;
    if (!pane) return;
    if (smooth) {
      pane.scrollTo({ top: pane.scrollHeight, behavior: 'smooth' });
      return;
    }
    pane.scrollTop = pane.scrollHeight;
  }, []);

  useEffect(() => {
    scrollToBottom(true);
  }, [messages, isTyping, waitLineIndex, scrollToBottom]);

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
    let cancelled = false;
    const loadWardrobe = async () => {
      try {
        if (connection) {
          const listed = await accountApi.wardrobeItems();
          if (cancelled) return;
          const items = listed.items.map(itemFromRecord);
          wardrobeItemsRef.current = items;
          setWardrobeItems(items);
          return;
        }
        const local = getWardrobeItems();
        if (cancelled) return;
        wardrobeItemsRef.current = local;
        setWardrobeItems(local);
      } catch {
        if (cancelled) return;
        const local = getWardrobeItems();
        wardrobeItemsRef.current = local;
        setWardrobeItems(local);
      }
    };
    void loadWardrobe();
    return () => {
      cancelled = true;
    };
  }, [connection]);

  useEffect(() => {
    if (!connection) return;
    let cancelled = false;
    const openForLook = Boolean(state.lookConsultation?.pieces.length);
    void connection.availability().then(async (availability) => {
      if (cancelled) return;
      setServiceLabel(availability.label);
      setVoiceEnabled(Boolean(availability.voice?.voiceEnabled));
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
      if (restored.messages.length) {
        const mapped = restored.messages.map((message) => toChatMessage(message, {
          profile,
          wardrobeItems: wardrobeItemsRef.current,
        }));
        setMessages(mapped);
        rememberGarmentFromMessages(mapped);
      }
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
    const withGarmentFollowUps = mediaIds.length > 0 || Boolean(garmentContext);
    void connection!.send(id, typed, idempotencyKey, mediaIds).then((message) => {
      const chatMessage = toChatMessage(message, {
        includeGarmentFollowUps: withGarmentFollowUps,
        profile,
        wardrobeItems: wardrobeItemsRef.current,
      });
      const nextOutfit = chatMessage.outfitCards?.[0] || chatMessage.outfitCard || null;
      if (nextOutfit) setActiveShopOutfit(nextOutfit);
      if (chatMessage.lookImageUrl) setActiveLookImageUrl(chatMessage.lookImageUrl);
      setMessages((prev) => [...prev, chatMessage]);
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
    if (attachment) {
      setGarmentContext({ name: attachment.name, url: attachment.url });
    }

    if (!connection || localDemo) {
      setTimeout(() => {
        const response = generateStylistResponse(typed, profile, attachment);
        if (response.outfitCard) setActiveShopOutfit(response.outfitCard);
        const stylistMsg: ChatMessage = {
          id: `stylist-${Date.now()}`,
          sender: 'stylist',
          timestamp: 'Just now',
          text: response.text,
          outfitCard: response.outfitCard,
          beautyTip: response.beautyTip,
          quickActions: attachment
            ? (response.quickActions?.length
              ? response.quickActions
              : garmentFollowUpActions(`stylist-${Date.now()}`))
            : response.quickActions,
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
        const consentState = await accountApi.privacyConsent();
        const externalGranted = Array.isArray(consentState.current)
          && consentState.current.some((item) => item.purpose === 'external_photo_ai' && item.granted);
        if (!externalGranted) {
          const allowed = window.confirm(
            'This photograph will be sent to an external AI provider for styling analysis. Continue only if you agree.',
          );
          if (!allowed) {
            setIsTyping(false);
            setServiceNotice('Photo not sent. External AI photograph consent is required before the stylist can see images.');
            return;
          }
          await accountApi.setPrivacyConsent({
            purpose: 'external_photo_ai',
            granted: true,
            captureMethod: 'stylist_photo_attach_confirmed',
          });
        }
        const uploaded = await accountApi.uploadStylistAttachment(await fileToBase64(file));
        setGarmentContext({
          name: attachment.name,
          url: `/api/media/${uploaded.id}`,
        });
        setServiceNotice(`${stylistName} can see your photo and will style from it.`);
        sendServerText(conversationId, typed, [uploaded.id]);
      } catch (error: unknown) {
        const detail = error instanceof AccountApiError
          ? error.message
          : 'That photograph could not be uploaded to the stylist.';
        if (typed) {
          setServiceNotice(`${detail} Your message was still sent without the photo.`);
          sendServerText(conversationId, typed);
          return;
        }
        setIsTyping(false);
        setServiceNotice(detail);
      }
    })();
  };

  const handleSelectPrompt = (prompt: string) => {
    handleUserSend(prompt);
  };

  const openGarmentFollowUp = (followUpId: GarmentFollowUpId) => {
    const definition = GARMENT_FOLLOW_UPS.find((item) => item.id === followUpId);
    if (!definition) return;
    const label = inferGarmentLabel(garmentContext?.name);
    if (definition.openBeauty) {
      handleUserSend(definition.prompt);
      onOpenBeautyStudio?.();
      return;
    }
    if (definition.shop && onShopForGarment) {
      // Prefer the outfit/look just generated so Shop the Look includes those pieces.
      const recentOutfit = activeShopOutfit
        || [...messagesRef.current].reverse().find((message) => message.outfitCards?.length)?.outfitCards?.[0]
        || [...messagesRef.current].reverse().find((message) => message.outfitCard)?.outfitCard
        || null;
      const lookUrl = activeLookImageUrl
        || [...messagesRef.current].reverse().find((message) => message.lookImageUrl)?.lookImageUrl
        || null;
      if (recentOutfit) {
        onShopForGarment(shopContextFromOutfit(recentOutfit, profile, wardrobeItemsRef.current, {
          lookImageUrl: lookUrl,
          categoryOverride: definition.shop.category,
          searchQueryOverride: shopSearchForFollowUp(followUpId, label) || definition.shop.search || '',
        }));
      } else {
        onShopForGarment({
          outfitTitle: definition.shop.title.replace('your garment', label),
          category: definition.shop.category,
          pieces: lookUrl || garmentContext?.url
            ? [garmentContext?.name || label]
            : [`Complete ${label}`],
          searchQuery: shopSearchForFollowUp(followUpId, label) || definition.shop.search || '',
          lookImageUrl: lookUrl || undefined,
          completeWith: lookUrl
            ? {
                name: garmentContext?.name || label,
                imageUrl: lookUrl,
                category: 'dresses',
              }
            : garmentContext?.url
              ? {
                  name: garmentContext.name || label,
                  imageUrl: garmentContext.url,
                  category: 'dresses',
                }
              : undefined,
        });
      }
      handleUserSend(definition.prompt);
      return;
    }
    handleUserSend(definition.prompt);
  };

  const handleShopNow = (outfit: StylistOutfitRecommendation) => {
    setActiveShopOutfit(outfit);
    const lookUrl = activeLookImageUrl
      || [...messagesRef.current].reverse().find((message) => message.lookImageUrl)?.lookImageUrl
      || null;
    const context = shopContextFromOutfit(outfit, profile, wardrobeItemsRef.current, {
      lookImageUrl: lookUrl,
    });
    if (onShopForGarment) {
      onShopForGarment(context);
      return;
    }
    onNavigate('shop');
  };

  const handleSelectAction = (action: StylistQuickAction) => {
    if (action.followUpId) {
      openGarmentFollowUp(action.followUpId);
      return;
    }
    handleUserSend(action.prompt);
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
      const mapped = opened.messages.length
        ? opened.messages.map((message) => toChatMessage(message, {
          profile,
          wardrobeItems: wardrobeItemsRef.current,
        }))
        : getInitialConversation(profile, undefined);
      setMessages(mapped);
      rememberGarmentFromMessages(mapped);
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
        const mapped = next.messages.length
          ? next.messages.map((message) => toChatMessage(message, {
            profile,
            wardrobeItems: wardrobeItemsRef.current,
          }))
          : getInitialConversation(profile, undefined);
        setMessages(mapped);
        rememberGarmentFromMessages(mapped);
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
      setGarmentContext(null);
      setActiveShopOutfit(null);
      setActiveLookImageUrl(null);
      setVoiceOutfitCards([]);
      setVoiceLookVisual(null);
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
      setActiveShopOutfit(null);
      setActiveLookImageUrl(null);
      setVoiceOutfitCards([]);
      setVoiceLookVisual(null);
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
    <div className="relative flex flex-col h-full min-h-0 overflow-hidden bg-[linear-gradient(180deg,#F3EDE4_0%,#F6F2EC_42%,#F8F4EE_100%)]">
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

      <div className="relative flex-1 flex flex-col min-h-0 overflow-hidden">
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

      {/* Chat Messages Scroll Container — content hugs the composer */}
      <div
        ref={chatScrollRef}
        className="flex-1 min-h-0 overflow-y-auto overscroll-contain [scrollbar-gutter:stable] px-4 sm:px-6 lg:px-8"
      >
        <div className="max-w-5xl w-full mx-auto min-h-full flex flex-col justify-end py-5 sm:py-6">
          <div className="space-y-5 sm:space-y-6">
            {/* Session Intro Kicker */}
            <div className="text-center">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#9C6A61] px-3 py-1 rounded-full bg-white/80 border border-[#242326]/8 inline-flex items-center gap-1.5 shadow-xs">
                <Sparkles className="w-3 h-3 text-[#B49361]" />
                {localDemo || !connection ? 'Demonstration replies on this device' : serviceLabel}
              </span>
              {connection && !connection.aiConsent && !localDemo && (
                <div className="mt-3 rounded-2xl border border-[#242326]/10 bg-white/90 px-4 py-3 text-xs text-[#5C585E] text-left shadow-xs">
                  <p>Personalised styling is off, so saved colours, sizes, and budget stay out of the stylist. Your Wardrobe pieces are still available for outfit ideas.</p>
                  <button type="button" className="mt-2 font-semibold text-[#9C6A61]" onClick={() => void connection.onEnableConsent().catch((error: unknown) => {
                    setServiceNotice(error instanceof AccountApiError ? error.message : 'Personalised styling could not be turned on.');
                  })}>
                    Allow personalised styling
                  </button>
                </div>
              )}
              {serviceNotice && (
                <div className="mt-3 rounded-2xl border border-[#242326]/10 bg-white/90 px-4 py-3 text-xs text-[#5C585E] text-left shadow-xs">
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
                onShopNow={handleShopNow}
                onGenerateLook={handleGenerateLook}
                generateLookBusy={cardLookBusy}
                onSelectPrompt={handleSelectPrompt}
                onSelectAction={handleSelectAction}
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
        </div>
      </div>

      {voiceMode ? (
        <StylistLiveVoicePanel
          stylistName={stylistName}
          status={voice.status}
          muted={voice.muted}
          error={voice.error}
          elapsedSeconds={voice.elapsedSeconds}
          maxSessionSeconds={voice.limits?.maxSessionSeconds ?? null}
          transcripts={voice.transcripts}
          hearingYou={voice.hearingYou}
          promptingReply={voice.promptingReply}
          micLevel={voice.micLevel}
          micSilent={voice.micSilent}
          lookVisual={voiceLookVisual}
          lookVisualLoading={voiceLookLoading}
          lookVisualError={voiceLookError}
          outfitCards={voiceOutfitCards}
          profile={profile}
          photos={photos}
          onShopNow={(outfit) => {
            handleShopNow(outfit);
            void voice.endConversation().then(() => {
              setVoiceMode(false);
              setVoiceLookLoading(false);
              setVoiceLookError(null);
            });
          }}
          onGenerateLook={handleGenerateLook}
          generateLookBusy={cardLookBusy || voiceLookLoading}
          onNavigateToShop={() => {
            onNavigate('shop');
            void voice.endConversation().then(() => {
              setVoiceMode(false);
              setVoiceLookLoading(false);
              setVoiceLookError(null);
            });
          }}
          onMuteToggle={voice.toggleMute}
          onPlayAudio={() => {
            void voice.playAssistantAudio();
          }}
          onEnd={() => {
            void voice.endConversation().then(() => {
              setVoiceMode(false);
              setVoiceLookLoading(false);
              setVoiceLookError(null);
            });
          }}
          onBackToText={() => {
            void voice.endConversation().then(() => {
              setVoiceMode(false);
              setVoiceLookLoading(false);
              setVoiceLookError(null);
            });
          }}
        />
      ) : (
        <div className="shrink-0 border-t border-[#242326]/10 bg-white/95 backdrop-blur-md shadow-[0_-8px_28px_rgba(36,35,38,0.06)]">
          {connection && !localDemo && (
            <div className="px-4 sm:px-6 lg:px-8 pt-3 max-w-5xl w-full mx-auto flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={!serverReady || isTyping || voice.isActive}
                aria-busy={voice.isActive}
                title={
                  !voice.support.ok
                    ? (voice.support.reason ?? 'Live voice is not available in this browser.')
                    : !voiceEnabled
                      ? 'Checking whether live voice is available…'
                      : `Start a live voice conversation with ${stylistName}`
                }
                onClick={() => {
                  void (async () => {
                    if (!voice.support.ok) {
                      const reason = voice.support.reason ?? 'Live voice is not available in this browser.';
                      setServiceNotice(reason);
                      return;
                    }
                    let enabled = voiceEnabled;
                    if (!enabled) {
                      try {
                        const availability = await accountApi.stylistVoiceAvailability();
                        enabled = Boolean(availability.voiceEnabled);
                        setVoiceEnabled(enabled);
                        if (!enabled) {
                          const reason = typeof availability.label === 'string'
                            ? availability.label
                            : 'Live voice is switched off on the server. Text chat still works.';
                          setServiceNotice(reason);
                          return;
                        }
                      } catch (error) {
                        const reason = error instanceof AccountApiError
                          ? error.message
                          : 'Could not check live voice availability.';
                        setServiceNotice(reason);
                        return;
                      }
                    }
                    setVoiceMode(true);
                    setVoiceLookVisual(null);
                    setVoiceLookError(null);
                    setVoiceLookLoading(false);
                    setVoiceOutfitCards([]);
                    voiceVisualDoneForPromptRef.current = null;
                    recentUserVoiceRef.current = [];
                    setServiceNotice(null);
                    await voice.startConversation();
                  })();
                }}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full border border-[#9C6A61]/25 bg-[#FAF7F2] hover:bg-[#F2EAE1] text-xs font-semibold text-[#794E46] transition-colors disabled:opacity-40"
              >
                <Phone className="w-3.5 h-3.5 text-[#9C6A61]" />
                Talk to {stylistName}
              </button>
              {serviceNotice && (
                <p className="text-[11px] text-[#5C585E]" role="status">
                  {serviceNotice}
                </p>
              )}
            </div>
          )}
          <StylistInputBar
            onSendMessage={handleUserSend}
            isGenerating={isTyping}
            onSelectPrompt={handleSelectPrompt}
            onSelectAction={handleSelectAction}
            inputPrefill={inputPrefill}
            stylistName={stylistName}
            contextualActions={garmentContext ? garmentFollowUpActions('composer') : undefined}
            contextualLabel={garmentContext ? `Complete ${inferGarmentLabel(garmentContext.name)}` : undefined}
            embedded
          />
        </div>
      )}
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
