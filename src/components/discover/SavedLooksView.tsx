/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { FashionLook, SavedLookItem } from '../../types/discover';
import { FASHION_LOOKS } from '../../data/discoverData';
import { savedLooksService } from '../../services/savedLooksService';
import { ImageWithFallback } from '../common/ImageWithFallback';
import { Button } from '../common/Button';
import { Heart, Trash2, ArrowRight, Sparkles, Compass } from 'lucide-react';

interface SavedLooksViewProps {
  onOpenOutfit: (look: FashionLook) => void;
  onExploreDiscover: () => void;
  onToast?: (message: string) => void;
}

export const SavedLooksView: React.FC<SavedLooksViewProps> = ({
  onOpenOutfit,
  onExploreDiscover,
  onToast,
}) => {
  const [savedItems, setSavedItems] = useState<SavedLookItem[]>(() =>
    savedLooksService.getSavedLooks()
  );

  useEffect(() => {
    const unsubscribe = savedLooksService.subscribe(() => {
      setSavedItems(savedLooksService.getSavedLooks());
    });
    return unsubscribe;
  }, []);

  const handleRemove = (lookId: string, title: string, e: React.MouseEvent) => {
    e.stopPropagation();
    savedLooksService.removeSavedLook(lookId);
    if (onToast) {
      onToast(`Removed "${title}" from saved looks`);
    }
  };

  // Map IDs to look objects
  const savedLooksWithMeta = savedItems
    .map((item) => {
      const look = FASHION_LOOKS.find((l) => l.id === item.lookId);
      return look ? { look, savedAt: item.savedAt } : null;
    })
    .filter(Boolean) as Array<{ look: FashionLook; savedAt: string }>;

  // Empty state
  if (savedLooksWithMeta.length === 0) {
    return (
      <div className="rounded-3xl bg-white border border-[#242326]/10 p-8 sm:p-12 text-center max-w-lg mx-auto space-y-4 shadow-xs">
        <div className="w-14 h-14 rounded-full bg-[#FAF7F2] text-[#9C6A61] flex items-center justify-center mx-auto border border-[#242326]/5">
          <Heart className="w-6 h-6" />
        </div>

        <div className="space-y-1.5">
          <h3 className="font-serif text-xl sm:text-2xl font-semibold text-[#242326]">
            Your style collection starts here.
          </h3>
          <p className="text-xs sm:text-sm text-[#5C585E] leading-relaxed max-w-xs mx-auto">
            Save looks you love and find them whenever inspiration strikes.
          </p>
        </div>

        <div className="pt-2">
          <Button
            variant="primary"
            size="md"
            onClick={onExploreDiscover}
            className="inline-flex items-center gap-2"
          >
            <Compass className="w-4 h-4" />
            <span>Discover Looks</span>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-serif text-xl sm:text-2xl font-semibold text-[#242326]">
            Saved Looks ({savedLooksWithMeta.length})
          </h3>
          <p className="text-xs text-[#5C585E]">
            Your personal curated gallery of fashion inspirations
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {savedLooksWithMeta.map(({ look, savedAt }) => (
          <div
            key={look.id}
            onClick={() => onOpenOutfit(look)}
            className="group rounded-2xl bg-white border border-[#242326]/10 overflow-hidden shadow-2xs hover:shadow-md transition-all duration-300 cursor-pointer flex flex-col justify-between"
          >
            {/* Visual Photo */}
            <div className="relative aspect-4/3 w-full overflow-hidden bg-[#FAF7F2]">
              <ImageWithFallback
                src={look.imageUrl}
                alt={look.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-104"
                fallbackTitle={look.title}
              />

              <div className="absolute top-2.5 right-2.5">
                <button
                  type="button"
                  onClick={(e) => handleRemove(look.id, look.title, e)}
                  className="w-8 h-8 rounded-full bg-white/90 backdrop-blur-md text-[#5C585E] hover:text-red-600 hover:bg-white flex items-center justify-center transition-colors shadow-xs cursor-pointer"
                  title="Remove from saved"
                  aria-label="Remove look"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="absolute bottom-2.5 left-2.5">
                <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/90 backdrop-blur-md text-[#242326] shadow-xs">
                  {look.category}
                </span>
              </div>
            </div>

            {/* Info */}
            <div className="p-3.5 space-y-2 flex-1 flex flex-col justify-between">
              <div>
                <h4 className="font-serif text-base font-semibold text-[#242326] group-hover:text-[#9C6A61] transition-colors line-clamp-1">
                  {look.title}
                </h4>
                <p className="text-[11px] text-[#5C585E] line-clamp-1 mt-0.5">
                  {look.shortDescription}
                </p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-[#242326]/5 text-[11px]">
                <span className="text-[#5C585E]">Saved {savedAt}</span>
                <span className="font-semibold text-[#9C6A61] inline-flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                  <span>View Details</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
