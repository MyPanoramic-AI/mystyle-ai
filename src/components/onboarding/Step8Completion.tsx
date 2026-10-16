/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { UserProfile, TemporaryPhotos } from '../../types';
import { Button } from '../common/Button';
import { Sparkles, ArrowRight, CheckCircle2, User, Palette, Shirt, Tag } from 'lucide-react';

interface Step8CompletionProps {
  profile: UserProfile;
  photos: TemporaryPhotos;
  onExplore: () => void;
}

export const Step8Completion: React.FC<Step8CompletionProps> = ({
  profile,
  photos,
  onExplore,
}) => {
  return (
    <div className="max-w-xl mx-auto py-2 sm:py-6 animate-fadeIn">
      <div className="rounded-3xl bg-white border border-[#242326]/10 shadow-sm p-6 sm:p-10 text-center">
        {/* Animated Celebration Icon */}
        <div className="w-16 h-16 rounded-3xl bg-[#E5CDBE]/50 text-[#9C6A61] flex items-center justify-center mx-auto mb-4 shadow-xs">
          <Sparkles className="w-8 h-8 stroke-[1.8]" />
        </div>

        <span className="text-xs font-semibold tracking-wider uppercase text-[#B49361] block mb-1">
          Profile Curated
        </span>

        <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-[#242326] tracking-tight">
          Your style journey starts here.
        </h1>

        <p className="mt-2 text-xs sm:text-sm text-[#5C585E] max-w-md mx-auto leading-relaxed">
          Your personal style profile is ready. Let's find something amazing for you.
        </p>

        {/* Profile Summary Card */}
        <div className="mt-6 p-5 rounded-2xl bg-[#F6F2EC] border border-[#242326]/8 text-left space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#242326]/8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full overflow-hidden bg-[#E5CDBE] flex items-center justify-center text-[#242326] font-serif font-bold text-base">
                {photos.profilePhotoUrl ? (
                  <img
                    src={photos.profilePhotoUrl}
                    alt={profile.personal.firstName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  profile.personal.firstName.charAt(0)
                )}
              </div>
              <div>
                <span className="text-xs font-semibold text-[#242326] block">
                  {profile.personal.firstName}
                </span>
                <span className="text-[11px] text-[#5C585E]">
                  {profile.personal.country} · {profile.personal.currency}
                </span>
              </div>
            </div>

            <span className="text-[11px] font-semibold text-[#9C6A61] bg-white px-2.5 py-1 rounded-full border border-[#242326]/8 shadow-2xs">
              Style Ready
            </span>
          </div>

          {/* Aesthetic Styles */}
          <div>
            <span className="text-[11px] font-semibold text-[#242326] uppercase tracking-wider block mb-1.5">
              Selected Aesthetics
            </span>
            <div className="flex flex-wrap gap-1.5">
              {profile.styles.length > 0 ? (
                profile.styles.map((style) => (
                  <span
                    key={style}
                    className="text-xs px-2.5 py-1 rounded-lg bg-white text-[#242326] border border-[#242326]/8 font-medium"
                  >
                    {style}
                  </span>
                ))
              ) : (
                <span className="text-xs text-[#5C585E] italic">Versatile Contemporary</span>
              )}
            </div>
          </div>

          {/* Sizes and Fit */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <span className="text-[11px] font-semibold text-[#242326] uppercase tracking-wider block mb-1">
                Clothing Sizing
              </span>
              <p className="text-xs text-[#5C585E]">
                Tops: <strong className="text-[#242326] font-medium">{profile.sizes.topsSize}</strong>
                <br />
                Bottoms: <strong className="text-[#242326] font-medium">{profile.sizes.bottomsSize}</strong>
                <br />
                Shoes: <strong className="text-[#242326] font-medium">{profile.sizes.shoeSize}</strong>
              </p>
            </div>

            <div>
              <span className="text-[11px] font-semibold text-[#242326] uppercase tracking-wider block mb-1">
                Shopping & Fit
              </span>
              <p className="text-xs text-[#5C585E]">
                Budget: <strong className="text-[#242326] font-medium">{profile.shopping.itemBudget}</strong>
                <br />
                Fit: <strong className="text-[#242326] font-medium capitalize">{profile.colours.fitPreference}</strong>
              </p>
            </div>
          </div>

          {/* Favorite Colours */}
          {profile.colours.favoriteColors.length > 0 && (
            <div className="pt-2 border-t border-[#242326]/8">
              <span className="text-[11px] font-semibold text-[#242326] uppercase tracking-wider block mb-1.5">
                Signature Colour Palette
              </span>
              <div className="flex flex-wrap gap-1.5">
                {profile.colours.favoriteColors.map((color) => (
                  <span
                    key={color}
                    className="text-[11px] px-2.5 py-0.5 rounded-full bg-white text-[#242326] border border-[#242326]/8"
                  >
                    {color}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Explore Button */}
        <div className="mt-8">
          <Button
            variant="primary"
            size="lg"
            fullWidth
            onClick={onExplore}
            icon={<ArrowRight className="w-4 h-4" />}
            className="shadow-sm hover:shadow"
          >
            Explore MyStyle AI
          </Button>
        </div>
      </div>
    </div>
  );
};
