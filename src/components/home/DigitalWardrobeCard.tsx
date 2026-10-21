/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Layers, Sparkles, ArrowRight, Calendar, TrendingUp } from 'lucide-react';
import { getWardrobeItems, getWardrobeOutfits } from '../../services/wardrobeService';

interface DigitalWardrobeCardProps {
  onOpenWardrobe: (tab?: 'pieces' | 'studio' | 'outfits' | 'planner' | 'gaps') => void;
  accountCounts?: { pieces: number; outfits: number } | null;
  usesAccount?: boolean;
}

export const DigitalWardrobeCard: React.FC<DigitalWardrobeCardProps> = ({
  onOpenWardrobe,
  accountCounts = null,
  usesAccount = false,
}) => {
  const items = usesAccount ? [] : getWardrobeItems();
  const outfits = usesAccount ? [] : getWardrobeOutfits();
  const pieceCount = accountCounts ? accountCounts.pieces : items.length;
  const outfitCount = accountCounts ? accountCounts.outfits : outfits.length;

  return (
    <section className="mb-10 sm:mb-12">
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-[#242326] via-[#2F2C33] to-[#1C1A1E] text-white p-6 sm:p-8 shadow-md border border-[#242326]/10">
        {/* Decorative backdrop glow */}
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-64 h-64 bg-[#9C6A61]/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-12 w-64 h-64 bg-[#B49361]/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-xl space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono tracking-widest text-[#866a40] uppercase font-semibold">
                Smart Wardrobe Architecture
              </span>
              <span className="text-[10px] bg-white/10 text-white/90 px-2 py-0.5 rounded font-medium">
                New Feature
              </span>
            </div>

            <h2 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight leading-tight">
              Digital Wardrobe & Outfit Studio
            </h2>

            <p className="text-xs sm:text-sm text-white/80 leading-relaxed">
              Curate the clothes you already own, experiment with our interactive mix-and-match canvas, plan looks for upcoming events, and discover missing foundation pieces.
            </p>

            {/* Micro Stats */}
            <div className="flex flex-wrap items-center gap-4 pt-1 text-xs">
              <div className="flex items-center gap-1.5 text-white/90">
                <Layers className="w-3.5 h-3.5 text-[#866a40]" />
                <span>{pieceCount} Digitised Pieces</span>
              </div>
              <div className="flex items-center gap-1.5 text-white/90">
                <Sparkles className="w-3.5 h-3.5 text-[#91635a]" />
                <span>{outfitCount} Created Outfits</span>
              </div>
              <div className="flex items-center gap-1.5 text-white/90">
                <TrendingUp className="w-3.5 h-3.5 text-[#866a40]" />
                <span>{accountCounts ? 'Gap suggestions are a demonstration' : 'Gap Intelligence Active'}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row md:flex-col gap-2.5 shrink-0">
            <button
              onClick={() => onOpenWardrobe('studio')}
              className="px-5 py-3 rounded-xl bg-[#9C6A61] hover:bg-[#8A5B53] text-white text-xs font-semibold uppercase tracking-wider transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer active:scale-98"
            >
              <span>Open Outfit Creator</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => onOpenWardrobe('pieces')}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-medium transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>Browse All {pieceCount} Wardrobe Pieces</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
