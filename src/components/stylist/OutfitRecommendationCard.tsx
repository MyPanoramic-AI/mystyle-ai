/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { StylistOutfitRecommendation, TemporaryPhotos, UserProfile } from '../../types';
import { ImageWithFallback } from '../common/ImageWithFallback';
import { ShareToFriendButton } from '../common/ShareToFriendButton';
import { listingSharePayload, outfitSharePayload } from '../../services/shareToFriend';
import { Sparkles, Camera, ShoppingBag, Heart, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';

interface OutfitRecommendationCardProps {
  outfit: StylistOutfitRecommendation;
  profile?: UserProfile;
  photos?: TemporaryPhotos;
  onNavigateToShop: () => void;
  onShopNow?: (outfit: StylistOutfitRecommendation) => void;
  /** Generate a stylist look visualization for this outfit in chat (does not open Fitting Room). */
  onGenerateLook?: (outfit: StylistOutfitRecommendation) => void | Promise<void>;
  generateLookBusy?: boolean;
  onSelectPrompt?: (prompt: string) => void;
}

export const OutfitRecommendationCard: React.FC<OutfitRecommendationCardProps> = ({
  outfit,
  onNavigateToShop,
  onShopNow,
  onGenerateLook,
  generateLookBusy = false,
}) => {
  const [isSaved, setIsSaved] = useState(false);
  const [showAllPieces, setShowAllPieces] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [localBusy, setLocalBusy] = useState(false);
  const busy = generateLookBusy || localBusy;

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
    <div className="rounded-2xl border border-[#242326]/10 bg-white overflow-hidden shadow-sm my-1 w-full max-w-2xl lg:max-w-3xl transition-all duration-200 hover:shadow-md">
      {/* Visual Image Header */}
      <div className="relative aspect-[2/1] sm:aspect-[16/7] bg-[#242326]/5 overflow-hidden">
        <ImageWithFallback
          src={outfit.imageUrl}
          alt={outfit.title}
          className="w-full h-full object-cover transition-transform duration-500 hover:scale-103"
          fallbackTitle={outfit.title}
        />

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-between p-4 sm:p-5 text-white">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-md text-white border border-white/20">
              {outfit.occasion}
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-[#1B382B]/80 backdrop-blur-md text-[#E5CDBE] border border-[#E5CDBE]/30">
              <Sparkles className="w-3 h-3 text-[#B49361]" /> {
                (outfit.ownedPieceCount ?? 0) > 0 && outfit.conceptOnly
                  ? 'From your wardrobe'
                  : (outfit.ownedPieceCount ?? 0) > 0
                    ? 'Wardrobe + shop gaps'
                    : outfit.conceptOnly
                      ? 'Style suggestion'
                      : 'Demonstration suggestion'
              }
            </span>
          </div>

          <div>
            <span className="text-xs text-[#E5CDBE] font-medium tracking-wide">
              {outfit.aesthetic}
            </span>
            <h4 className="font-serif text-xl sm:text-2xl font-semibold text-white drop-shadow-xs">
              {outfit.title}
            </h4>
          </div>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-4 sm:p-5 space-y-4">
        {/* Stylist Rationale */}
        <div className="p-3.5 rounded-xl bg-[#FAF7F2] border border-[#242326]/5 text-xs sm:text-[13px] text-[#5C585E] space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#9C6A61] block">
            Why this works
          </span>
          <p className="leading-relaxed text-[#242326]">
            {outfit.stylistRationale}
          </p>
        </div>

        {/* Palette Bar */}
        <div className="flex items-center justify-between gap-3 text-xs">
          <span className="text-[#5C585E] text-[11px] font-medium">Palette</span>
          <div className="flex items-center gap-1.5">
            {outfit.palette.map((color, idx) => (
              <div
                key={idx}
                className="w-5 h-5 rounded-full border border-black/10 shadow-2xs"
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>
        </div>

        {/* Individual Pieces List */}
        <div className="space-y-2.5 pt-1 border-t border-[#242326]/5">
          <div className="flex items-center justify-between gap-3 text-xs font-semibold text-[#242326]">
            <span>Included garments</span>
            <span className="text-[#9C6A61] font-medium">
              {(outfit.ownedPieceCount ?? 0) > 0 && outfit.conceptOnly
                ? 'Already owned'
                : outfit.conceptOnly
                  ? 'Not a shop listing'
                  : (outfit.ownedPieceCount ?? 0) > 0
                    ? `Gap est. R${outfit.totalEstimatedZar.toLocaleString()}`
                    : `Demo est. R${outfit.totalEstimatedZar.toLocaleString()}`}
            </span>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            {displayedPieces.map((piece, i) => (
              <div
                key={i}
                className="flex items-start gap-3 p-2.5 rounded-xl bg-[#F6F2EC]/70 border border-[#242326]/6 text-xs"
              >
                <div className="w-12 h-14 sm:w-14 sm:h-16 rounded-lg overflow-hidden bg-white border border-[#242326]/8 shrink-0">
                  <ImageWithFallback
                    src={piece.imageUrl || outfit.imageUrl}
                    alt={piece.name}
                    className="w-full h-full"
                    imageClassName="object-cover object-center"
                    fallbackTitle={piece.category}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-[#242326] leading-snug line-clamp-2">
                    {piece.name}
                  </p>
                  <p className="text-[11px] text-[#5C585E] mt-1">
                    {piece.owned ? (
                      <span className="font-semibold text-emerald-800">In your wardrobe</span>
                    ) : piece.productId ? (
                      <>
                        <span className="font-semibold text-[#9C6A61]">{piece.retailer}</span>
                        <span className="mx-1 text-[#242326]/30">·</span>
                        <span className="font-semibold text-[#242326]">Demo R{piece.priceZar.toLocaleString()}</span>
                      </>
                    ) : (
                      <span>Outfit concept</span>
                    )}
                  </p>
                  <div className="mt-1.5">
                    <ShareToFriendButton
                      variant="chip"
                      label={`Share ${piece.name} to a friend`}
                      payload={listingSharePayload({
                        name: piece.name,
                        retailer: piece.owned ? 'Your wardrobe' : piece.retailer,
                        priceZar: piece.owned ? 0 : piece.priceZar,
                        category: piece.category,
                        productId: piece.productId,
                        imageUrl: piece.imageUrl || outfit.imageUrl,
                      })}
                      onToast={showToast}
                    />
                  </div>
                </div>
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
        <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-[#242326]/10">
          {!onGenerateLook ? (
            <span className="flex-1 min-w-[9.5rem] inline-flex items-center justify-center gap-1.5 px-3 py-2.5 min-h-11 rounded-xl bg-[#F6F2EC] text-[#5C585E] text-xs font-semibold border border-[#242326]/10">
              <Camera className="w-3.5 h-3.5" />
              <span>Look preview unavailable</span>
            </span>
          ) : (
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                void (async () => {
                  setLocalBusy(true);
                  try {
                    await onGenerateLook(outfit);
                  } finally {
                    setLocalBusy(false);
                  }
                })();
              }}
              className="flex-1 min-w-[9.5rem] inline-flex items-center justify-center gap-1.5 px-3 py-2.5 min-h-11 rounded-xl bg-[#9C6A61] hover:bg-[#83554D] disabled:opacity-60 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              data-testid="stylist-generate-look"
              title="Ask the stylist to generate a look visualization of this outfit"
            >
              {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
              <span>{busy ? 'Creating look…' : 'See this look'}</span>
            </button>
          )}

          {(outfit.ownedPieceCount ?? 0) > 0 && outfit.conceptOnly ? (
            <span className="flex-1 min-w-[9.5rem] inline-flex items-center justify-center gap-1.5 px-3 py-2.5 min-h-11 rounded-xl bg-[#F6F2EC] text-[#5C585E] text-xs font-semibold border border-[#242326]/10">
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Owned — nothing to buy</span>
            </span>
          ) : (
            <button
              type="button"
              onClick={() => (onShopNow ? onShopNow(outfit) : onNavigateToShop())}
              className="flex-1 min-w-[9.5rem] inline-flex items-center justify-center gap-1.5 px-3 py-2.5 min-h-11 rounded-xl bg-[#242326] hover:bg-black text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              data-testid="stylist-shop-now"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>{(outfit.ownedPieceCount ?? 0) > 0 ? 'Shop gap pieces' : 'Shop now'}</span>
            </button>
          )}

          <ShareToFriendButton
            payload={outfitSharePayload(outfit)}
            onToast={showToast}
          />

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
