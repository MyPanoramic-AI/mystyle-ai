/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { FashionLook } from '../../types/discover';
import { savedLooksService } from '../../services/savedLooksService';
import { ImageWithFallback } from '../common/ImageWithFallback';
import { Button } from '../common/Button';
import {
  X,
  Heart,
  Camera,
  MessageCircle,
  ShoppingBag,
  Sparkles,
  Maximize2,
  Minimize2,
  Check,
  ChevronRight,
  ShieldCheck,
  Share2,
} from 'lucide-react';

interface OutfitDetailViewProps {
  look: FashionLook;
  onClose: () => void;
  onTryThisLook: (look: FashionLook) => void;
  onAskMyStylist: (look: FashionLook) => void;
  onFindSimilarClothes: (look: FashionLook) => void;
  onToast?: (message: string) => void;
}

export const OutfitDetailView: React.FC<OutfitDetailViewProps> = ({
  look,
  onClose,
  onTryThisLook,
  onAskMyStylist,
  onFindSimilarClothes,
  onToast,
}) => {
  const [isSaved, setIsSaved] = useState(() => savedLooksService.isLookSaved(look.id));
  const [isImageZoomed, setIsImageZoomed] = useState(false);

  useEffect(() => {
    const unsubscribe = savedLooksService.subscribe(() => {
      setIsSaved(savedLooksService.isLookSaved(look.id));
    });
    return unsubscribe;
  }, [look.id]);

  const handleToggleSave = () => {
    void savedLooksService.toggleSaveLook(look.id, look.title).then((nowSaved) => {
      setIsSaved(nowSaved);
      if (onToast) onToast(nowSaved ? `Saved "${look.title}" to your style collection` : `Removed "${look.title}"`);
    }).catch(() => {
      if (onToast) onToast('Unable to save. Please retry.');
    });
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `${look.title} · MyStyle AI`,
        text: `Check out this ${look.category} outfit inspiration on MyStyle AI.`,
        url: window.location.href,
      }).catch(() => {});
    } else if (onToast) {
      onToast('Look link copied to clipboard');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full sm:max-w-3xl h-full sm:h-auto sm:max-h-[92vh] bg-white sm:rounded-3xl shadow-2xl border-0 sm:border border-[#242326]/10 flex flex-col overflow-hidden"
        role="dialog"
        aria-modal="true"
      >
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-[#242326]/10 bg-[#FAF7F2] shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#9C6A61] px-2 py-0.5 rounded-sm bg-[#9C6A61]/10">
              {look.category}
            </span>
            <span className="text-xs text-[#5C585E] hidden sm:inline">
              · {look.occasions.slice(0, 2).join(' · ')}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleSave}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors cursor-pointer ${
                isSaved
                  ? 'bg-[#9C6A61] text-white border-[#9C6A61]'
                  : 'bg-white hover:bg-[#F6F2EC] text-[#242326] border-[#242326]/15'
              }`}
            >
              <Heart className={`w-3.5 h-3.5 ${isSaved ? 'fill-current' : ''}`} />
              <span>{isSaved ? 'Saved' : 'Save'}</span>
            </button>

            <button
              onClick={handleShare}
              className="w-8 h-8 rounded-full bg-white hover:bg-[#F6F2EC] text-[#5C585E] hover:text-[#242326] flex items-center justify-center border border-[#242326]/15 transition-colors cursor-pointer"
              title="Share look"
              aria-label="Share look"
            >
              <Share2 className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white hover:bg-[#E5CDBE]/20 text-[#5C585E] hover:text-[#242326] flex items-center justify-center border border-[#242326]/15 transition-colors cursor-pointer"
              aria-label="Close outfit detail"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* A. Large Outfit Image */}
          <div className="relative rounded-2xl overflow-hidden aspect-4/3 sm:aspect-16/10 bg-[#FAF7F2] border border-[#242326]/10 shadow-xs group">
            <ImageWithFallback
              src={look.imageUrl}
              alt={look.title}
              className={`w-full h-full object-cover transition-transform duration-300 ${
                isImageZoomed ? 'scale-125 cursor-zoom-out' : 'cursor-zoom-in'
              }`}
              onClick={() => setIsImageZoomed(!isImageZoomed)}
              fallbackTitle={look.title}
            />

            {/* Zoom Toggle Pill */}
            <button
              onClick={() => setIsImageZoomed(!isImageZoomed)}
              className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md text-white text-xs font-medium transition-colors cursor-pointer"
            >
              {isImageZoomed ? (
                <>
                  <Minimize2 className="w-3.5 h-3.5" />
                  <span>Standard View</span>
                </>
              ) : (
                <>
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span>Enlarge View</span>
                </>
              )}
            </button>
          </div>

          {/* B. Outfit Information */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-[#242326]">
                {look.title}
              </h2>
              <span className="text-xs font-medium text-[#9C6A61] uppercase tracking-wider">
                {look.seasons.join(' · ')}
              </span>
            </div>

            <p className="text-sm text-[#5C585E] leading-relaxed">
              {look.shortDescription}
            </p>

            {/* Suitable Occasions */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-xs font-semibold text-[#242326] mr-1">Best suited for:</span>
              {look.occasions.map((occ, idx) => (
                <span
                  key={idx}
                  className="text-xs px-2.5 py-1 rounded-full bg-[#FAF7F2] text-[#242326] border border-[#242326]/10 font-medium"
                >
                  {occ}
                </span>
              ))}
            </div>

            {/* Suggested Color Palette */}
            <div className="flex items-center gap-3 pt-2">
              <span className="text-xs font-semibold text-[#242326]">Harmonized Palette:</span>
              <div className="flex items-center gap-2">
                {look.colorPalette.map((col, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[#FAF7F2] border border-[#242326]/10 text-[11px] text-[#5C585E]"
                  >
                    <span
                      className="w-3.5 h-3.5 rounded-full border border-black/15 shadow-2xs"
                      style={{ backgroundColor: col }}
                    />
                    <span className="font-mono text-[10px] uppercase">{col}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* C. What's In This Look? */}
          <div className="rounded-2xl bg-[#FAF7F2]/70 border border-[#242326]/10 p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-base font-semibold text-[#242326] flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#9C6A61]" />
                <span>What's In This Look?</span>
              </h3>
              <span className="text-xs text-[#5C585E] font-medium">
                {look.pieces.length} curated pieces
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              {look.pieces.map((piece, idx) => (
                <div
                  key={piece.id || idx}
                  className="flex items-center justify-between p-3 rounded-xl bg-white border border-[#242326]/10 text-xs shadow-2xs"
                >
                  <div className="pr-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#9C6A61] block">
                      {piece.category}
                    </span>
                    <span className="font-medium text-[#242326] leading-snug">
                      {piece.name}
                    </span>
                  </div>
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                </div>
              ))}
            </div>
          </div>

          {/* D. Styling Advice: "Why This Look Works" */}
          <div className="rounded-2xl bg-gradient-to-br from-[#FAF7F2] to-white border border-[#9C6A61]/20 p-4 sm:p-5 space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#9C6A61] block">
              Editorial Style Rationale
            </span>
            <h4 className="font-serif text-base font-semibold text-[#242326]">
              Why This Look Works
            </h4>
            <p className="text-xs sm:text-sm text-[#5C585E] leading-relaxed">
              {look.whyItWorks}
            </p>
          </div>
        </div>

        {/* E. Action Buttons Bar (Sticky bottom) */}
        <div className="p-4 sm:px-6 bg-[#FAF7F2] border-t border-[#242326]/10 shrink-0">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {/* Action 1: Try This Look */}
            <button
              onClick={() => onTryThisLook(look)}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#9C6A61] hover:bg-[#83554D] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Camera className="w-4 h-4" />
              <span>Try This Look</span>
            </button>

            {/* Action 2: Ask My Stylist */}
            <button
              onClick={() => onAskMyStylist(look)}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#242326] hover:bg-black text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <MessageCircle className="w-4 h-4 text-[#E5CDBE]" />
              <span>Ask My Stylist</span>
            </button>

            {/* Action 3: Find Similar Clothes */}
            <button
              onClick={() => onFindSimilarClothes(look)}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-[#FAF7F2] text-[#242326] border border-[#242326]/20 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4 text-[#9C6A61]" />
              <span>Find Similar Clothes</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
