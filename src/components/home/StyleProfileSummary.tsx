/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { UserProfile, NavigationTab } from '../../types';
import { Button } from '../common/Button';
import { Sparkles, Pencil, ArrowRight, CheckCircle2 } from 'lucide-react';

interface StyleProfileSummaryProps {
  profile: UserProfile;
  onEditProfile: () => void;
  onStartOnboarding: () => void;
}

export const StyleProfileSummary: React.FC<StyleProfileSummaryProps> = ({
  profile,
  onEditProfile,
  onStartOnboarding,
}) => {
  const isComplete = profile.isOnboardingCompleted;
  const hasPreferences = profile.styles.length > 0 || profile.colours.favoriteColors.length > 0;

  return (
    <section className="mb-10 sm:mb-12">
      <div className="rounded-3xl bg-white border border-[#242326]/10 p-5 sm:p-7 shadow-xs">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#E5CDBE]/50 text-[#91635a] flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-serif text-lg sm:text-xl font-semibold text-[#242326]">
                Your Style DNA
              </h2>
              <span className="text-[11px] text-[#5C585E]">
                Personalized preferences guiding your recommendations
              </span>
            </div>
          </div>

          <button
            onClick={onEditProfile}
            className="text-xs font-semibold text-[#91635a] hover:text-[#794E46] flex items-center gap-1 cursor-pointer transition-colors"
          >
            <Pencil className="w-3.5 h-3.5" />
            <span>Edit My Style</span>
          </button>
        </div>

        {/* Content based on profile completeness */}
        {hasPreferences ? (
          <div className="space-y-4">
            {/* Preferred Styles */}
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#5C585E] block mb-1.5">
                Signature Aesthetics
              </span>
              <div className="flex flex-wrap gap-1.5">
                {profile.styles.map((style) => (
                  <span
                    key={style}
                    className="text-xs px-3 py-1 rounded-xl bg-[#F6F2EC] text-[#242326] font-medium border border-[#242326]/6"
                  >
                    {style}
                  </span>
                ))}
              </div>
            </div>

            {/* Favorite Colours & Fit */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-[#242326]/6 text-xs">
              <div>
                <span className="text-[11px] text-[#5C585E] block mb-1">Favourite Colours</span>
                <div className="flex flex-wrap gap-1">
                  {profile.colours.favoriteColors.slice(0, 4).map((c) => (
                    <span
                      key={c}
                      className="px-2 py-0.5 rounded-md bg-[#F6F2EC] text-[#242326] text-[11px]"
                    >
                      {c}
                    </span>
                  ))}
                  {profile.colours.favoriteColors.length > 4 && (
                    <span className="text-[10px] text-[#5C585E] self-center">
                      +{profile.colours.favoriteColors.length - 4} more
                    </span>
                  )}
                </div>
              </div>

              <div>
                <span className="text-[11px] text-[#5C585E] block mb-1">Preferred Silhouette</span>
                <span className="font-medium text-[#242326] capitalize">
                  {profile.colours.fitPreference} Cut
                </span>
              </div>

              <div>
                <span className="text-[11px] text-[#5C585E] block mb-1">Target Item Budget</span>
                <span className="font-medium text-[#242326]">
                  {profile.shopping.itemBudget}
                </span>
              </div>
            </div>
          </div>
        ) : (
          /* Empty / Incomplete State */
          <div className="p-4 rounded-2xl bg-[#F6F2EC] border border-[#242326]/8 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <span className="text-xs font-semibold text-[#242326] block">
                Take the 2-Minute Style Quiz
              </span>
              <p className="text-xs text-[#5C585E] mt-0.5">
                Set your favorite colors, silhouettes and sizes to personalize your fashion feed.
              </p>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={onStartOnboarding}
              icon={<ArrowRight className="w-3.5 h-3.5" />}
              className="shrink-0 whitespace-nowrap"
            >
              Discover My Style
            </Button>
          </div>
        )}
      </div>
    </section>
  );
};
