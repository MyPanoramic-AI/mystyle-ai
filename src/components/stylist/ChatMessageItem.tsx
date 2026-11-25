/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ChatMessage, StylistQuickAction, TemporaryPhotos, UserProfile } from '../../types';
import type { StylistOutfitRecommendation } from '../../types/stylist';
import { PreloadedGarment } from '../../types/shop';
import { OutfitRecommendationCard } from './OutfitRecommendationCard';
import { BeautyTipCard } from './BeautyTipCard';
import { Sparkles, Paperclip } from 'lucide-react';
import { ImageWithFallback } from '../common/ImageWithFallback';
import { ShareToFriendButton } from '../common/ShareToFriendButton';
import { imageSharePayload } from '../../services/shareToFriend';

interface ChatMessageItemProps {
  message: ChatMessage;
  profile: UserProfile;
  photos: TemporaryPhotos;
  onNavigateToShop: () => void;
  onShopNow?: (outfit: StylistOutfitRecommendation) => void;
  onSendToTryOn?: (garment: PreloadedGarment) => void;
  onSelectPrompt: (prompt: string) => void;
  onSelectAction?: (action: StylistQuickAction) => void;
}

export const ChatMessageItem: React.FC<ChatMessageItemProps> = ({
  message,
  profile,
  photos,
  onNavigateToShop,
  onShopNow,
  onSendToTryOn,
  onSelectPrompt,
  onSelectAction,
}) => {
  const isStylist = message.sender === 'stylist';
  const [shareToast, setShareToast] = useState<string | null>(null);
  const showShareToast = (msg: string) => {
    setShareToast(msg);
    window.setTimeout(() => setShareToast(null), 2500);
  };

  // Format simple markdown bolding and linebreaks
  const renderFormattedText = (rawText: string) => {
    const paragraphs = rawText.split('\n\n');
    return paragraphs.map((para, pIdx) => {
      const lines = para.split('\n');
      return (
        <p key={pIdx} className="mb-2 last:mb-0 leading-relaxed">
          {lines.map((line, lIdx) => {
            // Check for bullets
            const isBullet = line.trim().startsWith('•') || line.trim().startsWith('-');
            const cleanLine = isBullet ? line.trim().replace(/^[•-]\s*/, '') : line;

            // Simple parser for **bold**
            const parts = cleanLine.split(/(\*\*.*?\*\*)/g);

            return (
              <span key={lIdx} className={isBullet ? 'flex items-start gap-1.5 my-1' : 'block'}>
                {isBullet && <span className="text-[#9C6A61] font-bold mt-0.5">•</span>}
                <span>
                  {parts.map((part, partIdx) => {
                    if (part.startsWith('**') && part.endsWith('**')) {
                      return (
                        <strong key={partIdx} className="font-semibold text-[#242326]">
                          {part.slice(2, -2)}
                        </strong>
                      );
                    }
                    return part;
                  })}
                </span>
              </span>
            );
          })}
        </p>
      );
    });
  };

  return (
    <div className={`flex gap-3 sm:gap-3.5 ${isStylist ? 'items-start' : 'items-start flex-row-reverse'}`}>
      {/* Avatar */}
      {isStylist ? (
        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#9C6A61] text-white flex items-center justify-center shrink-0 shadow-xs border border-white">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
      ) : (
        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#242326] text-[#E5CDBE] flex items-center justify-center shrink-0 overflow-hidden border border-[#242326]/10">
          {photos.profilePhotoUrl ? (
            <img
              src={photos.profilePhotoUrl}
              alt="You"
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-xs font-semibold">
              {(profile.personal.firstName || 'U').charAt(0).toUpperCase()}
            </span>
          )}
        </div>
      )}

      {/* Message Content Container */}
      <div className={`max-w-[88%] sm:max-w-[82%] space-y-2 ${isStylist ? 'text-left' : 'text-right'}`}>
        {/* Name and time */}
        <div className={`flex items-center gap-2 text-[11px] text-[#5C585E] ${isStylist ? 'justify-start' : 'justify-end'}`}>
          <span className="font-semibold text-[#242326]">
            {isStylist
              ? `${(profile.stylistPersona?.name || 'Aria').trim() || 'Aria'} · Personal Stylist`
              : profile.personal.firstName || 'You'}
          </span>
          <span>·</span>
          <span>{message.timestamp}</span>
        </div>

        {/* User image attachment(s) — single upload or assembled look gallery */}
        {(message.userAttachments?.length || message.userAttachmentUrl) && (
          <div className={`inline-block rounded-2xl overflow-hidden border border-[#242326]/10 shadow-xs text-left bg-white p-2 ${
            (message.userAttachments?.length ?? 0) > 1 ? 'max-w-sm' : 'max-w-xs'
          }`}>
            {message.userAttachments && message.userAttachments.length > 0 ? (
              <div className={`grid gap-1.5 ${message.userAttachments.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                {message.userAttachments.map((item) => (
                  <div key={`${item.url}-${item.name}`} className="rounded-xl overflow-hidden bg-[#242326]/5">
                    <div className="aspect-square relative">
                      <img
                        src={item.url}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-1.5 right-1.5">
                        <ShareToFriendButton
                          variant="icon"
                          className="w-8 h-8 bg-white/95 shadow-xs"
                          label={`Share ${item.name} to a friend`}
                          payload={imageSharePayload({
                            title: item.name,
                            caption: `A piece from my IStyleU chat: ${item.name}`,
                            imageUrl: item.url,
                          })}
                          onToast={showShareToast}
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-1 px-1.5 py-1 text-[10px] text-[#5C585E]">
                      <Paperclip className="w-2.5 h-2.5 text-[#9C6A61] shrink-0" />
                      <span className="truncate">{item.name}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <>
                <div className="w-48 h-48 rounded-xl overflow-hidden bg-[#242326]/5 relative">
                  <img
                    src={message.userAttachmentUrl}
                    alt={message.userAttachmentName || 'Attached clothing item'}
                    className="w-full h-full object-cover"
                  />
                  {message.userAttachmentUrl && (
                    <div className="absolute top-1.5 right-1.5">
                      <ShareToFriendButton
                        variant="icon"
                        className="w-8 h-8 bg-white/95 shadow-xs"
                        label="Share image to a friend"
                        payload={imageSharePayload({
                          title: message.userAttachmentName || 'Chat image',
                          caption: message.userAttachmentName
                            ? `A piece from my IStyleU chat: ${message.userAttachmentName}`
                            : 'An image from my IStyleU stylist chat.',
                          imageUrl: message.userAttachmentUrl,
                        })}
                        onToast={showShareToast}
                      />
                    </div>
                  )}
                </div>
                {message.userAttachmentName && (
                  <div className="flex items-center gap-1.5 pt-1.5 px-1 text-[11px] text-[#5C585E]">
                    <Paperclip className="w-3 h-3 text-[#9C6A61]" />
                    <span className="truncate">{message.userAttachmentName}</span>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Bubble text */}
        <div
          className={`rounded-2xl px-4 py-3 sm:px-4.5 sm:py-3.5 text-xs sm:text-[13px] shadow-xs text-left ${
            isStylist
              ? 'bg-white text-[#242326] border border-[#242326]/10'
              : 'bg-[#242326] text-white ml-auto'
          }`}
        >
          {renderFormattedText(message.text)}
        </div>

        {/* Generated look visualization (hair, accessories, styled finish) */}
        {isStylist && message.lookImageUrl && (
          <div className="rounded-2xl overflow-hidden border border-[#242326]/10 shadow-xs bg-white max-w-sm">
            <div className="aspect-3/4 bg-[#242326]/5 relative">
              <ImageWithFallback
                src={message.lookImageUrl}
                alt="Generated look"
                className="w-full h-full object-cover"
                fallbackTitle="Generated look"
              />
              <div className="absolute top-2 right-2">
                <ShareToFriendButton
                  variant="icon"
                  className="w-8 h-8 bg-white/95 shadow-xs"
                  label="Share look to a friend"
                  payload={imageSharePayload({
                    title: 'Look visualization',
                    caption: message.text?.slice(0, 160) || 'A look from my IStyleU stylist.',
                    imageUrl: message.lookImageUrl,
                  })}
                  onToast={showShareToast}
                />
              </div>
            </div>
            <div className="px-3 py-2 text-[11px] text-[#5C585E] flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 min-w-0">
                <Sparkles className="w-3 h-3 text-[#9C6A61] shrink-0" />
                <span className="truncate">Look visualization</span>
              </span>
              <ShareToFriendButton
                variant="chip"
                label="Share look to a friend"
                payload={imageSharePayload({
                  title: 'Look visualization',
                  caption: message.text?.slice(0, 160) || 'A look from my IStyleU stylist.',
                  imageUrl: message.lookImageUrl,
                })}
                onToast={showShareToast}
              />
            </div>
          </div>
        )}

        {/* Embedded outfit option cards (skip when a look image already shows the visual) */}
        {!message.lookImageUrl && (message.outfitCards?.length ? message.outfitCards : message.outfitCard ? [message.outfitCard] : []).map((outfit) => (
          <OutfitRecommendationCard
            key={outfit.id}
            outfit={outfit}
            profile={profile}
            photos={photos}
            onNavigateToShop={onNavigateToShop}
            onShopNow={onShopNow}
            onSendToTryOn={onSendToTryOn}
            onSelectPrompt={onSelectPrompt}
          />
        ))}

        {/* Embedded Beauty Tip Card */}
        {message.beautyTip && <BeautyTipCard tip={message.beautyTip} />}

        {/* Quick action buttons attached to this message */}
        {message.quickActions && message.quickActions.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {message.quickActions.map((action) => (
              <button
                key={action.id}
                type="button"
                onClick={() => (onSelectAction ? onSelectAction(action) : onSelectPrompt(action.prompt))}
                className="inline-flex items-center gap-1 text-[11px] sm:text-xs font-medium px-3 py-1.5 rounded-full bg-white hover:bg-[#FAF7F2] text-[#242326] border border-[#242326]/15 hover:border-[#9C6A61] transition-all cursor-pointer shadow-2xs"
              >
                <span>{action.label}</span>
              </button>
            ))}
          </div>
        )}

        {shareToast && (
          <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-[#242326] text-white text-xs font-medium shadow-lg">
            {shareToast}
          </div>
        )}
      </div>
    </div>
  );
};
