/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { NavigationTab } from '../../types';
import { DEMO_USER_PROFILE } from '../../data/mockData';
import { Button } from '../common/Button';
import { User, Users, FolderArchive, ArrowLeft, Settings, Sparkles, MapPin, Heart } from 'lucide-react';

interface ProfilePlaceholderProps {
  onNavigate: (tab: NavigationTab) => void;
}

export const ProfilePlaceholder: React.FC<ProfilePlaceholderProps> = ({ onNavigate }) => {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={() => onNavigate('home')}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-[#5C585E] hover:text-[#242326] transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </button>

        <span className="text-xs font-semibold uppercase tracking-wider text-[#B49361]">
          My Profile & Family Wardrobes
        </span>
      </div>

      {/* Main Profile Card */}
      <div className="rounded-3xl bg-white border border-[#242326]/10 p-6 sm:p-8 shadow-sm">
        {/* User Identity Header */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left pb-6 border-b border-[#242326]/8">
          <div className="w-20 h-20 rounded-3xl bg-[#E5CDBE] text-[#242326] border-2 border-[#B49361]/30 flex items-center justify-center font-serif text-3xl font-bold shadow-xs">
            {DEMO_USER_PROFILE.name.charAt(0)}
          </div>
          <div className="flex-1">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-[#242326]">
                {DEMO_USER_PROFILE.name}
              </h1>
              <span className="text-xs font-medium text-[#9C6A61] bg-[#E5CDBE]/30 px-3 py-1 rounded-full self-center sm:self-auto">
                {DEMO_USER_PROFILE.stylePersona}
              </span>
            </div>

            <div className="flex items-center justify-center sm:justify-start gap-1.5 text-xs text-[#5C585E] mt-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#B49361]" />
              <span>{DEMO_USER_PROFILE.location}</span>
            </div>
          </div>
        </div>

        {/* Style Preferences Snapshot */}
        <div className="py-6 space-y-4 border-b border-[#242326]/8">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[#242326]">
            Style DNA & Measurement Preferences
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 rounded-2xl bg-[#F6F2EC] border border-[#242326]/5">
              <span className="text-[#5C585E] block">Silhouette & Body Shape</span>
              <span className="font-semibold text-[#242326] mt-0.5 block">
                {DEMO_USER_PROFILE.bodyShape}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#F6F2EC] border border-[#242326]/5">
              <span className="text-[#5C585E] block">Budget Preference</span>
              <span className="font-semibold text-[#242326] mt-0.5 block">
                {DEMO_USER_PROFILE.budgetTier}
              </span>
            </div>
          </div>

          <div>
            <span className="text-xs text-[#5C585E] block mb-2">
              Signature Color Harmony:
            </span>
            <div className="flex flex-wrap gap-2">
              {DEMO_USER_PROFILE.favoriteColors.map((color, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 text-xs rounded-lg bg-[#F6F2EC] text-[#242326] border border-[#242326]/8"
                >
                  {color}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Family Profiles & Digital Wardrobe Gateways */}
        <div className="pt-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#242326]">
              Sub-Profiles & Modules
            </h3>
            <span className="text-[11px] text-[#B49361] font-medium">Prompt 2 Focus</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-4 rounded-2xl bg-white border border-[#242326]/10 flex items-start gap-3">
              <Users className="w-5 h-5 text-[#9C6A61] shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-semibold text-[#242326] block">
                  Family Member Profiles
                </span>
                <p className="text-[11px] text-[#5C585E] mt-0.5 leading-snug">
                  Coordinate matching outfits for weddings, family dinners, and holiday photos.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-[#242326]/10 flex items-start gap-3">
              <FolderArchive className="w-5 h-5 text-[#B49361] shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-semibold text-[#242326] block">
                  Digital Closet Organizer
                </span>
                <p className="text-[11px] text-[#5C585E] mt-0.5 leading-snug">
                  Catalog and categorize your existing pieces to maximize outfit versatility.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
