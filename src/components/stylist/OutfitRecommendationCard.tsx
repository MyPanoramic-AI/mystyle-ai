/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { StylistOutfitRecommendation, TemporaryPhotos, UserProfile } from '../../types';
import { PreloadedGarment } from '../../types/shop';
import { ImageWithFallback } from '../common/ImageWithFallback';
import { Sparkles, Camera, ShoppingBag, Heart, ChevronDown, ChevronUp } from 'lucide-react';

interface OutfitRecommendationCardProps {
  outfit: StylistOutfitRecommendation;
  profile?: UserProfile;
  photos?: TemporaryPhotos;
  onNavigateToShop: () => void;
  onSendToTryOn?: (garment: PreloadedGarment) => void;
  onSelectPrompt?: (prompt: string) => void;
}

function garmentFromOutfit(outfit: StylistOutfitRecommendation): PreloadedGarment {
  const primary = outfit.pieces.find((piece) => piece.category === 'tops' || piece.category === 'dress' || piece.category === 'outerwear')
    || outfit.pieces[0];
  return {
    productId: outfit.id,
    productName: primary?.name || outfit.title,
    retailer: primary?.retailer || 'Stylist recommendation',
    priceZar: primary?.priceZar ?? outfit.totalEstimatedZar,
    imageUrl: outfit.imageUrl,
    category: primary?.category || outfit.occasion || 'tops',
  };
}

export const OutfitRecommendationCard: React.FC<OutfitRecommendationCardProps> = ({
  outfit,
  onNavigateToShop,
  onSendToTryOn,
}) => {
  const [isSaved, setIsSaved] = useState(false);
  const [showAllPieces, setShowAllPieces] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleToggleSave = () => {
    setIsSaved(!isSaved);
    showToast(!isSaved
      ? 'Kept on this screen only. It was not saved to your wardrobe or account.'
      : 'Removed from this screen.');
  };

  const displayedPieces = showAllPieces ? outfit.pieces : outfit.pieces.slice(0, 2);

  return (
    <div className="rounded-2xl border border-[#242326]/12 bg-white overflow-hidden shadow-sm my-3 max-w-xl transition-all duration-200 hover:shadow-md">
      {/* Visual Image Header */}
      <div className="relative aspect-16/10 sm:aspect-16/9 bg-[#242326]/5 overflow-hidden">
        <ImageWithFallback
          src={outfit.imageUrl}
          alt={outfit.title}
          className="w-full h-full object-cover transition-transform duration-500 hover:scale-103"
          fallbackTitle={outfit.title}
        />

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent flex flex-col justify-between p-4 text-white">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-md text-white border border-white/20">
              {outfit.occasion}
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-[#1B382B]/80 backdrop-blur-md text-[#E5CDBE] border border-[#E5CDBE]/30">
              <Sparkles className="w-3 h-3 text-[#B49361]" /> {outfit.conceptOnly ? 'Style suggestion' : 'Demonstration suggestion'}
            </span>
          </div>

          <div>
            <span className="text-xs text-[#E5CDBE] font-medium tracking-wide">
              {outfit.aesthetic}
            </span>
            <h4 className="font-serif text-lg sm:text-xl font-semibold text-white drop-shadow-xs">
              {outfit.title}
            </h4>
          </div>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-4 sm:p-5 space-y-4">
        {/* Stylist Rationale */}
        <div className="p-3 rounded-xl bg-[#FAF7F2] border border-[#242326]/5 text-xs text-[#5C585E] space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#9C6A61] block">
            Why this works for your profile
          </span>
          <p className="leading-relaxed text-[#242326]">
            {outfit.stylistRationale}
          </p>
        </div>

        {/* Palette Bar */}
        <div className="flex items-center justify-between text-xs pt-0.5">
          <span className="text-[#5C585E] text-[11px]">Harmonized Palette:</span>
          <div className="flex items-center gap-1.5">
            {outfit.palette.map((color, idx) => (
              <div
                key={idx}
                className="w-4.5 h-4.5 rounded-full border border-black/10 shadow-2xs"
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>
        </div>

        {/* Individual Pieces List */}
        <div className="space-y-2 pt-1 border-t border-[#242326]/5">
          <div className="flex items-center justify-between text-xs font-semibold text-[#242326]">
            <span>Included Garments ({outfit.pieces.length} items)</span>
            <span className="text-[#9C6A61]">
              {outfit.conceptOnly ? 'Not a shop listing' : `Demo est. R${outfit.totalEstimatedZar.toLocaleString()}`}
            </span>
          </div>

          <div className="space-y-1.5">
            {displayedPieces.map((piece, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-2.5 rounded-lg bg-[#F6F2EC]/60 border border-[#242326]/5 text-xs"
              >
                <div className="pr-2">
                  <p className="font-medium text-[#242326] leading-tight line-clamp-1">
                    {piece.name}
                  </p>
                  <p className="text-[11px] text-[#5C585E] mt-0.5">
                    {outfit.conceptOnly ? (
                      <span>Outfit concept</span>
                    ) : (
                      <>
                        <span className="font-semibold text-[#9C6A61]">{piece.retailer}</span>
                        <span className="mx-1">·</span>
                        <span className="text-emerald-700">Demonstration</span>
                      </>
                    )}
                  </p>
                </div>
                {outfit.conceptOnly ? null : (
                  <span className="font-bold text-[#242326] shrink-0">
                    Demo R{piece.priceZar.toLocaleString()}
                  </span>
                )}
              </div>
            ))}
          </div>

          {outfit.pieces.length > 2 && (
            <button
              onClick={() => setShowAllPieces(!showAllPieces)}
              className="w-full text-center py-1.5 text-[11px] font-semibold text-[#9C6A61] hover:text-[#242326] flex items-center justify-center gap-1 transition-colors cursor-pointer"
            >
              <span>{showAllPieces ? 'Show fewer items' : `+ View ${outfit.pieces.length - 2} more items`}</span>
              {showAllPieces ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#242326]/10">
          {outfit.conceptOnly || !onSendToTryOn ? (
            <span className="flex-1 min-w-[130px] inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-[#F6F2EC] text-[#5C585E] text-xs font-semibold border border-[#242326]/10">
              <Camera className="w-3.5 h-3.5" />
              <span>Try-on is not connected</span>
            </span>
          ) : (
            <button
              type="button"
              onClick={() => onSendToTryOn(garmentFromOutfit(outfit))}
              className="flex-1 min-w-[130px] inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-[#9C6A61] hover:bg-[#83554D] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              data-testid="stylist-virtual-try-on"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Virtual Try-On</span>
            </button>
          )}

          {outfit.conceptOnly ? (
            <span className="flex-1 min-w-[130px] inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-[#F6F2EC] text-[#5C585E] text-xs font-semibold border border-[#242326]/10">
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Shopping is not connected</span>
            </span>
          ) : (
            <button
              onClick={onNavigateToShop}
              className="flex-1 min-w-[130px] inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-[#242326] hover:bg-black text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Shop The Look</span>
            </button>
          )}

          <button
            onClick={handleToggleSave}
            className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-colors cursor-pointer ${
              isSaved
                ? 'bg-[#9C6A61] text-white border-[#9C6A61]'
                : 'bg-white hover:bg-[#FAF7F2] text-[#5C585E] border-[#242326]/15'
            }`}
            title={isSaved ? 'Saved to Wardrobe' : 'Save to Wardrobe'}
            aria-label="Save outfit"
          >
            <Heart className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
          </button>
        </div>
      </div>

      {/* Floating toast */}
      {toastMessage && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-[#242326] text-white text-xs font-medium shadow-lg animate-in fade-in duration-150">
          {toastMessage}
        </div>
      )}
    </div>
  );
};
