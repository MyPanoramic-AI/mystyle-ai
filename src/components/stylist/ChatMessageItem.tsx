/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ChatMessage, TemporaryPhotos, UserProfile } from '../../types';
import { OutfitRecommendationCard } from './OutfitRecommendationCard';
import { BeautyTipCard } from './BeautyTipCard';
import { Sparkles, User, Paperclip } from 'lucide-react';
import { ImageWithFallback } from '../common/ImageWithFallback';

interface ChatMessageItemProps {
  message: ChatMessage;
  profile: UserProfile;
  photos: TemporaryPhotos;
  onNavigateToShop: () => void;
  onSelectPrompt: (prompt: string) => void;
}

export const ChatMessageItem: React.FC<ChatMessageItemProps> = ({
  message,
  profile,
  photos,
  onNavigateToShop,
  onSelectPrompt,
}) => {
  const isStylist = message.sender === 'stylist';

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
            {isStylist ? 'Aria · Lead AI Stylist' : profile.personal.firstName || 'You'}
          </span>
          <span>·</span>
          <span>{message.timestamp}</span>
        </div>

        {/* User image attachment if present */}
        {message.userAttachmentUrl && (
          <div className="inline-block rounded-2xl overflow-hidden border border-[#242326]/10 shadow-xs max-w-xs text-left bg-white p-2">
            <div className="w-48 h-48 rounded-xl overflow-hidden bg-[#242326]/5">
              <img
                src={message.userAttachmentUrl}
                alt={message.userAttachmentName || 'Attached clothing item'}
                className="w-full h-full object-cover"
              />
            </div>
            {message.userAttachmentName && (
              <div className="flex items-center gap-1.5 pt-1.5 px-1 text-[11px] text-[#5C585E]">
                <Paperclip className="w-3 h-3 text-[#9C6A61]" />
                <span className="truncate">{message.userAttachmentName}</span>
              </div>
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

        {/* Embedded Outfit Recommendation Card */}
        {message.outfitCard && (
          <OutfitRecommendationCard
            outfit={message.outfitCard}
            profile={profile}
            photos={photos}
            onNavigateToShop={onNavigateToShop}
            onSelectPrompt={onSelectPrompt}
          />
        )}

        {/* Embedded Beauty Tip Card */}
        {message.beautyTip && <BeautyTipCard tip={message.beautyTip} />}

        {/* Quick action buttons attached to this message */}
        {message.quickActions && message.quickActions.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {message.quickActions.map((action) => (
              <button
                key={action.id}
                onClick={() => onSelectPrompt(action.prompt)}
                className="inline-flex items-center gap-1 text-[11px] sm:text-xs font-medium px-3 py-1.5 rounded-full bg-white hover:bg-[#FAF7F2] text-[#242326] border border-[#242326]/15 hover:border-[#9C6A61] transition-all cursor-pointer shadow-2xs"
              >
                <span>{action.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
