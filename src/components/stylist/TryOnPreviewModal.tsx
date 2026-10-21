/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { StylistOutfitRecommendation, TemporaryPhotos, UserProfile } from '../../types';
import { ImageWithFallback } from '../common/ImageWithFallback';
import { Button } from '../common/Button';
import { X, Sparkles, Check, Heart, ShoppingBag, ShieldCheck, RefreshCw } from 'lucide-react';

interface TryOnPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  outfit: StylistOutfitRecommendation | null;
  profile: UserProfile;
  photos: TemporaryPhotos;
  onNavigateToShop: () => void;
}

export const TryOnPreviewModal: React.FC<TryOnPreviewModalProps> = ({
  isOpen,
  onClose,
  outfit,
  profile,
  photos,
  onNavigateToShop,
}) => {
  const [activeView, setActiveView] = useState<'fit' | 'details'>('fit');
  const [isSaved, setIsSaved] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  if (!isOpen || !outfit) return null;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleToggleSave = () => {
    setIsSaved(!isSaved);
    showToast(!isSaved ? 'Look saved to your digital wardrobe!' : 'Removed from saved wardrobe');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-[#242326]/10 overflow-hidden flex flex-col max-h-[90vh]"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#242326]/10 bg-[#FAF7F2]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#9C6A61] text-white flex items-center justify-center shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs uppercase tracking-wider font-semibold text-[#B49361]">
                Virtual Fitting Room
              </span>
              <h3 className="font-serif text-lg font-semibold text-[#242326] leading-tight">
                {outfit.title}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white hover:bg-[#E5CDBE]/20 text-[#5C585E] hover:text-[#242326] flex items-center justify-center border border-[#242326]/10 transition-colors cursor-pointer"
            aria-label="Close fitting room"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Main Visual Dual Preview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-stretch">
            {/* Outfit Editorial Card */}
            <div className="relative rounded-2xl overflow-hidden aspect-3/4 bg-[#242326]/5 border border-[#242326]/10 group">
              <ImageWithFallback
                src={outfit.imageUrl}
                alt={outfit.title}
                className="w-full h-full object-cover"
                fallbackTitle={outfit.title}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex flex-col justify-end p-4 text-white">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#E5CDBE]">
                  Curated Ensemble
                </span>
                <span className="text-sm font-medium">{outfit.aesthetic}</span>
              </div>
            </div>

            {/* Simulated Try-On Fitting Card */}
            <div className="relative rounded-2xl overflow-hidden aspect-3/4 bg-[#F6F2EC] border border-[#242326]/10 flex flex-col justify-between p-5">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#9C6A61] uppercase tracking-wider">
                    Silhouette Fit Simulation
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-[#1B382B]/10 text-[#1B382B] font-medium">
                    <Check className="w-3 h-3" /> Demonstration preview
                  </span>
                </div>

                <h4 className="font-serif text-base font-semibold text-[#242326]">
                  Tailored for {profile.personal.firstName || 'You'}
                </h4>

                <div className="text-xs text-[#5C585E] space-y-1.5 pt-1">
                  <p>
                    • <strong>Proportions:</strong> Scaled for {profile.personal.heightCm ? `${profile.personal.heightCm}cm` : 'your height'} with vertical seamline elongation.
                  </p>
                  <p>
                    • <strong>Sizing:</strong> Optimized for Top {profile.sizes.topsSize || 'M'} & Bottom {profile.sizes.bottomsSize || '34'}.
                  </p>
                  <p>
                    • <strong>Comfort:</strong> Breathable textile drape with {profile.colours.fitPreference || 'regular'} tailored movement.
                  </p>
                </div>
              </div>

              {/* Garment details card */}
              <div className="bg-white/90 backdrop-blur-xs rounded-xl p-3 border border-[#242326]/10 shadow-xs space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#5C585E]">Demo estimate (ZAR):</span>
                  <span className="font-serif font-bold text-[#242326] text-sm">
                    R{outfit.totalEstimatedZar.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center gap-2 pt-1 border-t border-[#242326]/5 text-[11px] text-[#5C585E]">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#B49361] shrink-0" />
                  <span>Available at South African partner boutiques</span>
                </div>
              </div>
            </div>
          </div>

          {/* Pieces breakdown list */}
          <div>
            <h4 className="font-serif text-sm font-semibold text-[#242326] mb-3">
              Included Garments & Retailers
            </h4>
            <div className="space-y-2">
              {outfit.pieces.map((piece, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-xl bg-[#F6F2EC]/50 border border-[#242326]/5 text-xs"
                >
                  <div className="space-y-0.5">
                    <span className="font-medium text-[#242326]">{piece.name}</span>
                    <div className="text-[11px] text-[#5C585E] flex items-center gap-2">
                      <span className="text-[#9C6A61] font-medium">{piece.retailer}</span>
                      <span>·</span>
                      <span className="text-emerald-700">Demonstration</span>
                    </div>
                  </div>
                  <span className="font-semibold text-[#242326] shrink-0">
                    Demo R{piece.priceZar.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 bg-[#FAF7F2] border-t border-[#242326]/10 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={handleToggleSave}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium border transition-colors cursor-pointer ${
              isSaved
                ? 'bg-[#9C6A61] text-white border-[#9C6A61]'
                : 'bg-white text-[#242326] border-[#242326]/15 hover:bg-[#F6F2EC]'
            }`}
          >
            <Heart className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
            <span>{isSaved ? 'Saved to Wardrobe' : 'Save Look'}</span>
          </button>

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={onClose}
            >
              Close
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                onClose();
                onNavigateToShop();
              }}
              className="inline-flex items-center gap-1.5"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Shop All Pieces</span>
            </Button>
          </div>
        </div>

        {/* Toast confirmation */}
        {toastMessage && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-[#242326] text-white text-xs font-medium shadow-lg animate-in fade-in duration-150">
            {toastMessage}
          </div>
        )}
      </div>
    </div>
  );
};
