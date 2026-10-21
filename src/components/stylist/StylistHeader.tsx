/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { NavigationTab, StylistFilterLens, UserProfile } from '../../types';
import { ArrowLeft, Sparkles, Sliders, RotateCcw, Compass } from 'lucide-react';

interface StylistHeaderProps {
  profile: UserProfile;
  lens: StylistFilterLens;
  onOpenLensModal: () => void;
  onResetSession: () => void;
  onNavigateHome: () => void;
  onOpenDiscover?: () => void;
}

export const StylistHeader: React.FC<StylistHeaderProps> = ({
  profile,
  lens,
  onOpenLensModal,
  onResetSession,
  onNavigateHome,
  onOpenDiscover,
}) => {
  return (
    <div className="bg-white/95 backdrop-blur-md border-b border-[#242326]/10 px-4 sm:px-6 py-3.5 sticky top-14 sm:top-16 z-30 transition-all">
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-2">
        {/* Left: Back affordance + Stylist info */}
        <div className="flex items-center gap-2 min-w-0">
          <button
            onClick={onNavigateHome}
            className="w-8 h-8 rounded-full bg-[#F6F2EC] hover:bg-[#E5CDBE]/30 text-[#5C585E] hover:text-[#242326] flex items-center justify-center border border-[#242326]/5 transition-colors cursor-pointer shrink-0"
            aria-label="Back to home"
            title="Back to Home"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2 min-w-0">
            <div className="relative shrink-0">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-tr from-[#9C6A61] to-[#B49361] text-white flex items-center justify-center shadow-xs">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              {/* Online indicator */}
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="font-serif text-sm sm:text-base font-semibold text-[#242326] leading-none">
                  Aria
                </h1>
                <span className="hidden sm:inline text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-sm bg-[#9C6A61]/10 text-[#9C6A61]">
                  Personal Stylist
                </span>
              </div>
              <p className="text-[11px] text-[#5C585E] mt-0.5 truncate">
                Calibrated for {profile.personal.firstName || 'You'} · {profile.styles[0] || 'Classic Elegance'}
              </p>
            </div>
          </div>
        </div>

        {/* Right: Active styling lens badge + Restart session */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Active Lens trigger */}
          <button
            onClick={onOpenLensModal}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#FAF7F2] hover:bg-[#F6F2EC] border border-[#242326]/10 text-xs font-medium text-[#242326] transition-colors cursor-pointer"
            title="Adjust styling lens"
          >
            <Sliders className="w-3.5 h-3.5 text-[#9C6A61]" />
            <span className="truncate max-w-[130px]">{lens.occasion}</span>
          </button>

          {/* Explore Inspiration button */}
          {onOpenDiscover && (
            <button
              onClick={onOpenDiscover}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#FAF7F2] hover:bg-[#F6F2EC] border border-[#242326]/10 text-xs font-medium text-[#242326] transition-colors cursor-pointer"
              title="Explore style discovery & outfit inspirations"
            >
              <Compass className="w-3.5 h-3.5 text-[#9C6A61]" />
              <span className="hidden sm:inline">Explore Inspiration</span>
              <span className="sm:hidden">Discover</span>
            </button>
          )}

          {/* New consultation button */}
          <button
            onClick={onResetSession}
            className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-full bg-white hover:bg-[#FAF7F2] border border-[#242326]/12 text-xs font-medium text-[#5C585E] hover:text-[#242326] transition-colors cursor-pointer"
            title="Start new consultation"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">New Session</span>
          </button>
        </div>
      </div>
    </div>
  );
};
