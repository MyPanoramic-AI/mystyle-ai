/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface HomeHeaderProps {
  userName?: string;
  onStartOnboarding?: () => void;
}

export const HomeHeader: React.FC<HomeHeaderProps> = ({ userName, onStartOnboarding }) => {
  return (
    <section className="mb-4 sm:mb-5 pt-0.5 sm:pt-1">
      <div className="flex items-start justify-between gap-4">
        <div>
          <span className="text-[11px] sm:text-xs font-semibold tracking-wider uppercase text-[#B49361] block mb-1">
            Personal Styling Companion
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight text-[#242326] leading-[1.2]">
            Your style. Your way.
          </h1>
          <p className="mt-1.5 text-xs sm:text-sm text-[#5C585E] max-w-xl leading-relaxed">
            Your personal AI stylist is ready to help you look and feel your best.
          </p>
        </div>

        {onStartOnboarding && (
          <button
            onClick={onStartOnboarding}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#9C6A61] bg-white border border-[#242326]/10 rounded-xl hover:bg-[#E5CDBE]/20 transition-all cursor-pointer shadow-2xs whitespace-nowrap"
          >
            <span>Update Style Quiz</span>
          </button>
        )}
      </div>
    </section>
  );
};
