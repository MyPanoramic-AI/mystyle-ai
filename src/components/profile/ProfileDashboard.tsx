/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { UserProfile, TemporaryPhotos } from '../../types';
import { profileService } from '../../services/profileService';
import { EditSectionModal, EditableSection } from './EditSectionModal';
import { Button } from '../common/Button';
import {
  User,
  Ruler,
  Sparkles,
  Palette,
  ShoppingBag,
  Camera,
  RotateCcw,
  Pencil,
  CheckCircle2,
  ShieldAlert,
  ArrowRight,
  MapPin,
  Clock,
  Heart,
  Users,
  Layers,
} from 'lucide-react';
import { savedLooksService } from '../../services/savedLooksService';
import { familyService } from '../../services/familyService';
import { getWardrobeItems, getWardrobeOutfits } from '../../services/wardrobeService';
import { getSavedBeautyLooks } from '../../services/beautyService';
import { getMembership, getCreditBalance } from '../../services/membershipService';
import { MembershipSubpageTab } from '../../types/membership';
import { Crown, Coins, Shield, Bell, Settings } from 'lucide-react';

interface ProfileDashboardProps {
  profile: UserProfile;
  photos: TemporaryPhotos;
  onUpdateProfile: (updated: UserProfile) => void | Promise<void>;
  accountEmail?: string | null;
  saveMessage?: string | null;
  onLogout?: () => void;
  onUpdatePhotos: (photos: TemporaryPhotos) => void;
  onRestartOnboarding: () => void;
  onOpenSavedLooks?: () => void;
  onOpenFamily?: () => void;
  onOpenWardrobe?: (tab?: 'pieces' | 'studio' | 'outfits' | 'planner' | 'gaps') => void;
  onOpenBeautyStudio?: () => void;
  onOpenMembership?: (tab?: MembershipSubpageTab) => void;
}

export const ProfileDashboard: React.FC<ProfileDashboardProps> = ({
  profile,
  photos,
  onUpdateProfile,
  onUpdatePhotos,
  accountEmail,
  saveMessage,
  onLogout,
  onRestartOnboarding,
  onOpenSavedLooks,
  onOpenFamily,
  onOpenWardrobe,
  onOpenBeautyStudio,
  onOpenMembership,
}) => {
  const [activeEditSection, setActiveEditSection] = useState<EditableSection | null>(null);

  const completeness = profileService.calculateCompleteness(profile);
  const familyMembers = familyService.getFamilyMembers();
  const wardrobeItems = getWardrobeItems();
  const wardrobeOutfits = getWardrobeOutfits();
  const savedBeauty = getSavedBeautyLooks();
  const membership = getMembership();
  const credits = getCreditBalance();
  const totalCredits = credits.remainingCredits + credits.bonusCredits;

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn pb-6">
      {/* Profile Overview Header Card */}
      <div className="rounded-3xl bg-white border border-[#242326]/10 p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
            {/* Avatar / Portrait Photo */}
            <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-3xl overflow-hidden bg-[#E5CDBE] border-2 border-[#B49361]/30 flex items-center justify-center font-serif text-3xl font-bold text-[#242326] shadow-xs shrink-0">
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
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1">
                <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-[#242326]">
                  {profile.personal.firstName}
                </h1>
                <span className="text-[11px] font-semibold tracking-wider uppercase text-[#9C6A61] bg-[#E5CDBE]/30 px-3 py-1 rounded-full">
                  {profile.styles[0] || 'Modern & Minimal'}
                </span>
              </div>

              <div className="flex items-center justify-center sm:justify-start gap-2 text-xs text-[#5C585E]">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-[#B49361]" />
                  {profile.personal.country}
                </span>
                <span aria-hidden="true">·</span>
                <span>{profile.personal.currency}</span>
                {profile.personal.ageRange && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span>{profile.personal.ageRange}</span>
                  </>
                )}
                {accountEmail && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span>{accountEmail}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Restart Onboarding Trigger */}
          <div className="shrink-0 flex items-center gap-2">
            {onLogout ? (
              <button
                type="button"
                onClick={onLogout}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-[#5C585E] hover:text-[#242326] bg-[#F6F2EC] hover:bg-[#E5CDBE]/40 border border-[#242326]/8 rounded-xl transition-all cursor-pointer"
              >
                Sign out
              </button>
            ) : null}
            <button
              onClick={onRestartOnboarding}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-[#5C585E] hover:text-[#242326] bg-[#F6F2EC] hover:bg-[#E5CDBE]/40 border border-[#242326]/8 rounded-xl transition-all cursor-pointer"
              title="Restart Onboarding"
            >
              <RotateCcw className="w-3.5 h-3.5 text-[#9C6A61]" />
              <span>Retake Style Quiz</span>
            </button>
          </div>
        </div>

        {saveMessage ? <p className="mt-4 text-sm text-[#9C6A61]" role="status">{saveMessage}</p> : null}
        {/* Profile Completeness Strip */}
        <div className="mt-6 pt-5 border-t border-[#242326]/8">
          <div className="flex items-center justify-between text-xs font-semibold text-[#242326] mb-2">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-[#B49361]" />
              Style Profile Completeness
            </span>
            <span className="font-mono text-[#9C6A61]">{completeness}%</span>
          </div>

          <div className="w-full h-2 bg-[#F6F2EC] rounded-full overflow-hidden border border-[#242326]/5">
            <div
              className="h-full bg-[#9C6A61] transition-all duration-500 rounded-full"
              style={{ width: `${completeness}%` }}
            />
          </div>

          {completeness < 100 && (
            <p className="text-[11px] text-[#5C585E] mt-2">
              Tip: Add your body measurements and favorite retailers to unlock high-precision garment filtering.
            </p>
          )}
        </div>
      </div>

      {/* Membership & Credits Quick Status Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-[#242326] via-[#2e2c31] to-[#1e1c1f] text-white p-5 sm:p-6 shadow-sm border border-[#B49361]/25 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-8 -mt-8 w-44 h-44 bg-[#B49361]/15 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 flex items-center justify-center text-[#E5CDBE] shrink-0 mt-0.5 sm:mt-0">
              <Crown className="w-5 h-5 text-[#B49361]" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="font-serif text-lg font-semibold text-white capitalize">
                  {membership.planId} Member
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#B49361] text-white uppercase tracking-wider">
                  {membership.status}
                </span>
              </div>
              <p className="text-xs text-[#E5CDBE]/80">
                Renews {membership.renewsOn} · {membership.billingCycle === 'monthly' ? 'Monthly billing' : 'Annual billing'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <button
              onClick={() => onOpenMembership?.('credits')}
              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold border border-white/15 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#B49361]" />
              <span>{totalCredits} Credits</span>
            </button>

            <button
              onClick={() => onOpenMembership?.('membership')}
              className="px-4 py-2 rounded-xl bg-[#B49361] hover:bg-[#a08152] text-white text-xs font-semibold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <span>Manage Plan</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Grid of Profile Section Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* CARD 1: PERSONAL DETAILS */}
        <div className="rounded-3xl bg-white border border-[#242326]/10 p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#E5CDBE]/40 text-[#9C6A61] flex items-center justify-center">
                  <User className="w-4 h-4" />
                </div>
                <h3 className="font-serif text-base font-semibold text-[#242326]">
                  Personal Details
                </h3>
              </div>
              <button
                onClick={() => setActiveEditSection('personal')}
                className="text-xs font-medium text-[#9C6A61] hover:text-[#794E46] flex items-center gap-1 cursor-pointer"
              >
                <Pencil className="w-3 h-3" />
                <span>Edit</span>
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-[#242326]/6">
                <span className="text-[#5C585E]">First Name:</span>
                <span className="font-medium text-[#242326]">{profile.personal.firstName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#242326]/6">
                <span className="text-[#5C585E]">Age Group:</span>
                <span className="font-medium text-[#242326]">{profile.personal.ageRange || 'Not specified'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#242326]/6">
                <span className="text-[#5C585E]">Height:</span>
                <span className="font-medium text-[#242326]">
                  {profile.personal.heightCm ? `${profile.personal.heightCm} cm` : 'Not specified'}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-[#5C585E]">Region & Currency:</span>
                <span className="font-medium text-[#242326]">
                  {profile.personal.country} ({profile.personal.currency})
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* CARD 2: CLOTHING SIZES */}
        <div className="rounded-3xl bg-white border border-[#242326]/10 p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#B49361]/15 text-[#B49361] flex items-center justify-center">
                  <Ruler className="w-4 h-4" />
                </div>
                <h3 className="font-serif text-base font-semibold text-[#242326]">
                  Sizes & Measurements
                </h3>
              </div>
              <button
                onClick={() => setActiveEditSection('sizes')}
                className="text-xs font-medium text-[#9C6A61] hover:text-[#794E46] flex items-center gap-1 cursor-pointer"
              >
                <Pencil className="w-3 h-3" />
                <span>Edit</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs mb-3">
              <div className="p-2.5 rounded-xl bg-[#F6F2EC]">
                <span className="text-[11px] text-[#5C585E] block">Tops</span>
                <span className="font-semibold text-[#242326] mt-0.5 block">{profile.sizes.topsSize}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#F6F2EC]">
                <span className="text-[11px] text-[#5C585E] block">Bottoms</span>
                <span className="font-semibold text-[#242326] mt-0.5 block">{profile.sizes.bottomsSize}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#F6F2EC]">
                <span className="text-[11px] text-[#5C585E] block">Dress</span>
                <span className="font-semibold text-[#242326] mt-0.5 block">{profile.sizes.dressSize}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#F6F2EC]">
                <span className="text-[11px] text-[#5C585E] block">Shoes</span>
                <span className="font-semibold text-[#242326] mt-0.5 block">{profile.sizes.shoeSize}</span>
              </div>
            </div>

            <div className="text-[11px] text-[#5C585E] flex justify-between px-1">
              <span>Bust: {profile.sizes.bustCm ? `${profile.sizes.bustCm}cm` : '—'}</span>
              <span>Waist: {profile.sizes.waistCm ? `${profile.sizes.waistCm}cm` : '—'}</span>
              <span>Hips: {profile.sizes.hipCm ? `${profile.sizes.hipCm}cm` : '—'}</span>
            </div>
          </div>
        </div>

        {/* CARD 3: STYLE PREFERENCES */}
        <div className="rounded-3xl bg-white border border-[#242326]/10 p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#9C6A61]/15 text-[#9C6A61] flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <h3 className="font-serif text-base font-semibold text-[#242326]">
                  Aesthetic DNA
                </h3>
              </div>
              <button
                onClick={() => setActiveEditSection('styles')}
                className="text-xs font-medium text-[#9C6A61] hover:text-[#794E46] flex items-center gap-1 cursor-pointer"
              >
                <Pencil className="w-3 h-3" />
                <span>Edit</span>
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5 mb-3">
              {profile.styles.map((style) => (
                <span
                  key={style}
                  className="px-3 py-1 rounded-xl bg-[#F6F2EC] text-[#242326] text-xs font-medium border border-[#242326]/8"
                >
                  {style}
                </span>
              ))}
            </div>

            <p className="text-[11px] text-[#5C585E] italic">
              Your stylist prioritizes these aesthetics during occasion look curation.
            </p>
          </div>
        </div>

        {/* CARD 4: COLOURS & FIT */}
        <div className="rounded-3xl bg-white border border-[#242326]/10 p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#E5CDBE]/50 text-[#242326] flex items-center justify-center">
                  <Palette className="w-4 h-4" />
                </div>
                <h3 className="font-serif text-base font-semibold text-[#242326]">
                  Colour Palette & Fit
                </h3>
              </div>
              <button
                onClick={() => setActiveEditSection('colours')}
                className="text-xs font-medium text-[#9C6A61] hover:text-[#794E46] flex items-center gap-1 cursor-pointer"
              >
                <Pencil className="w-3 h-3" />
                <span>Edit</span>
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-[#5C585E] block mb-1.5">Favourite Colours:</span>
                <div className="flex flex-wrap gap-1.5">
                  {profile.colours.favoriteColors.map((c) => (
                    <span
                      key={c}
                      className="px-2.5 py-0.5 rounded-md bg-[#F6F2EC] text-[#242326] text-[11px]"
                    >
                      {c}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-[#242326]/6">
                <span className="text-[#5C585E]">Silhouette Cut:</span>
                <span className="font-medium text-[#242326] capitalize">
                  {profile.colours.fitPreference}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[#5C585E]">Experimentation:</span>
                <span className="font-medium text-[#242326] capitalize">
                  {profile.colours.experimentation}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* CARD 5: SHOPPING & SA RETAILERS */}
        <div className="rounded-3xl bg-white border border-[#242326]/10 p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#B49361]/15 text-[#B49361] flex items-center justify-center">
                  <ShoppingBag className="w-4 h-4" />
                </div>
                <h3 className="font-serif text-base font-semibold text-[#242326]">
                  Shopping Preferences
                </h3>
              </div>
              <button
                onClick={() => setActiveEditSection('shopping')}
                className="text-xs font-medium text-[#9C6A61] hover:text-[#794E46] flex items-center gap-1 cursor-pointer"
              >
                <Pencil className="w-3 h-3" />
                <span>Edit</span>
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1 border-b border-[#242326]/6">
                <span className="text-[#5C585E]">Per-Item Budget:</span>
                <span className="font-medium text-[#242326]">{profile.shopping.itemBudget}</span>
              </div>

              <div>
                <span className="text-[#5C585E] block mb-1">Preferred Retailers:</span>
                <div className="flex flex-wrap gap-1">
                  {profile.shopping.favoriteRetailers.map((ret) => (
                    <span
                      key={ret}
                      className="px-2 py-0.5 rounded-md bg-[#F6F2EC] text-[#242326] text-[11px]"
                    >
                      {ret}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CARD 6: PHOTO MANAGEMENT */}
        <div className="rounded-3xl bg-white border border-[#242326]/10 p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#9C6A61]/15 text-[#9C6A61] flex items-center justify-center">
                  <Camera className="w-4 h-4" />
                </div>
                <h3 className="font-serif text-base font-semibold text-[#242326]">
                  Styling Photographs
                </h3>
              </div>
              <button
                onClick={() => setActiveEditSection('photos')}
                className="text-xs font-medium text-[#9C6A61] hover:text-[#794E46] flex items-center gap-1 cursor-pointer"
              >
                <Pencil className="w-3 h-3" />
                <span>Manage</span>
              </button>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl overflow-hidden bg-[#F6F2EC] border border-[#242326]/10 flex items-center justify-center shrink-0">
                {photos.profilePhotoUrl ? (
                  <img src={photos.profilePhotoUrl} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-5 h-5 text-[#5C585E]" />
                )}
              </div>
              <div className="w-14 h-14 rounded-2xl overflow-hidden bg-[#F6F2EC] border border-[#242326]/10 flex items-center justify-center shrink-0">
                {photos.fullBodyFrontUrl ? (
                  <img src={photos.fullBodyFrontUrl} alt="Front body" className="w-full h-full object-cover" />
                ) : (
                  <Camera className="w-5 h-5 text-[#5C585E]" />
                )}
              </div>
              <div className="text-xs text-[#5C585E] leading-snug">
                <span>
                  {photos.profilePhotoUrl || photos.fullBodyFrontUrl
                    ? 'Photos active in temporary browser memory'
                    : 'No fitting photos selected yet'}
                </span>
                <span className="block text-[10px] text-[#9C6A61] mt-0.5">
                  Stored locally for session only
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* CARD 6: SAVED LOOKS */}
        <div className="rounded-3xl bg-white border border-[#242326]/10 p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#FAF7F2] text-[#9C6A61] flex items-center justify-center border border-[#9C6A61]/20">
                  <Heart className="w-4 h-4 fill-current" />
                </div>
                <h3 className="font-serif text-base font-semibold text-[#242326]">
                  Saved Outfit Inspirations
                </h3>
              </div>
              <span className="text-xs font-semibold text-[#9C6A61] bg-[#FAF7F2] px-2.5 py-0.5 rounded-full border border-[#9C6A61]/20">
                {savedLooksService.getSavedLooks().length} Saved
              </span>
            </div>

            <p className="text-xs text-[#5C585E] leading-relaxed mb-4">
              Your curated collection of favorite editorial looks, styling rationale, and garment breakdowns from Discover.
            </p>

            {onOpenSavedLooks && (
              <button
                onClick={onOpenSavedLooks}
                className="w-full py-2.5 px-4 rounded-xl bg-[#F6F2EC] hover:bg-[#E5CDBE]/40 text-[#242326] text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer"
              >
                <span>View All Saved Looks</span>
                <ArrowRight className="w-4 h-4 text-[#9C6A61]" />
              </button>
            )}
          </div>
        </div>

        {/* CARD 7: FAMILY STYLE PROFILES & COORDINATION */}
        <div className="rounded-3xl bg-white border border-[#242326]/10 p-5 sm:p-6 shadow-xs flex flex-col justify-between md:col-span-2">
          <div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#E5CDBE]/50 text-[#9C6A61] flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-serif text-base font-semibold text-[#242326]">
                    Family Style Profiles & Coordinated Dressing
                  </h3>
                  <p className="text-xs text-[#5C585E]">
                    Manage individual sizes, comfort needs, and plan coordinated outfits for family occasions.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-xs font-semibold text-[#9C6A61] bg-[#FAF7F2] px-3 py-1 rounded-full border border-[#9C6A61]/20">
                  {familyMembers.length} Family Members
                </span>
              </div>
            </div>

            {/* Member preview avatars */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
              {familyMembers.map((member) => (
                <div
                  key={member.id}
                  className="p-3 rounded-2xl bg-[#FAF7F2] border border-[#242326]/6 flex items-center gap-3"
                >
                  <div className="w-10 h-10 rounded-xl bg-[#E5CDBE]/60 text-[#9C6A61] font-serif font-bold text-sm flex items-center justify-center shrink-0">
                    {member.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-semibold text-[#242326] block truncate">
                      {member.name}
                    </span>
                    <span className="text-[10px] text-[#5C585E] block truncate">
                      {member.relationship} · Tops {member.sizes.topsSize}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {onOpenFamily && (
              <button
                onClick={onOpenFamily}
                className="w-full py-3 px-4 rounded-xl bg-[#242326] hover:bg-[#38363a] text-white text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer"
              >
                <span>Open Family Styling Studio & Planner</span>
                <ArrowRight className="w-4 h-4 text-[#B49361]" />
              </button>
            )}
          </div>
        </div>

        {/* CARD 8: DIGITAL WARDROBE & OUTFIT STUDIO */}
        <div className="rounded-3xl bg-white border border-[#242326]/10 p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#FAF7F2] text-[#9C6A61] flex items-center justify-center border border-[#9C6A61]/20">
                  <Layers className="w-4 h-4" />
                </div>
                <h3 className="font-serif text-base font-semibold text-[#242326]">
                  Digital Wardrobe
                </h3>
              </div>
              <span className="text-xs font-semibold text-[#9C6A61] bg-[#FAF7F2] px-2.5 py-0.5 rounded-full border border-[#9C6A61]/20">
                {wardrobeItems.length} Pieces
              </span>
            </div>

            <p className="text-xs text-[#5C585E] leading-relaxed mb-4">
              Digitise clothing you own, craft mix-and-match outfits with instant style harmony, and schedule looks for upcoming events.
            </p>

            <div className="flex items-center gap-2 mb-4 text-xs text-[#5C585E]">
              <span className="font-medium text-[#242326]">{wardrobeOutfits.length} Saved Looks</span>
              <span>•</span>
              <span className="text-[#B49361] font-medium">Gap Intelligence Active</span>
            </div>

            {onOpenWardrobe && (
              <button
                onClick={() => onOpenWardrobe('pieces')}
                className="w-full py-2.5 px-4 rounded-xl bg-[#F6F2EC] hover:bg-[#E5CDBE]/40 text-[#242326] text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer"
              >
                <span>Open Wardrobe & Studio</span>
                <ArrowRight className="w-4 h-4 text-[#9C6A61]" />
              </button>
            )}
          </div>
        </div>

        {/* CARD 9: AI BEAUTY STUDIO */}
        <div className="rounded-3xl bg-white border border-[#242326]/10 p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#FAF7F2] text-[#B49361] flex items-center justify-center border border-[#B49361]/20">
                  <Sparkles className="w-4 h-4" />
                </div>
                <h3 className="font-serif text-base font-semibold text-[#242326]">
                  AI Beauty Studio
                </h3>
              </div>
              <span className="text-xs font-semibold text-[#B49361] bg-[#FAF7F2] px-2.5 py-0.5 rounded-full border border-[#B49361]/20">
                {savedBeauty.length} Looks Saved
              </span>
            </div>

            <p className="text-xs text-[#5C585E] leading-relaxed mb-4">
              Hairstyles, balayage hair colours, makeup palettes, and luxury nail designs harmonised with your seasonal color profile.
            </p>

            <div className="flex items-center gap-2 mb-4 text-xs text-[#5C585E]">
              <span className="font-medium text-[#242326]">Complete Ensembles</span>
              <span>•</span>
              <span className="text-[#9C6A61] font-medium">SA Retailers</span>
            </div>

            {onOpenBeautyStudio && (
              <button
                onClick={onOpenBeautyStudio}
                className="w-full py-2.5 px-4 rounded-xl bg-[#F6F2EC] hover:bg-[#E5CDBE]/40 text-[#242326] text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer"
              >
                <span>Consult Beauty Studio</span>
                <ArrowRight className="w-4 h-4 text-[#9C6A61]" />
              </button>
            )}
          </div>
        </div>

        {/* CARD 10: MEMBERSHIP & SUBSCRIPTION */}
        <div className="rounded-3xl bg-white border border-[#242326]/10 p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#FAF7F2] text-[#B49361] flex items-center justify-center border border-[#B49361]/20">
                  <Crown className="w-4 h-4" />
                </div>
                <h3 className="font-serif text-base font-semibold text-[#242326]">
                  Membership & Subscription
                </h3>
              </div>
              <span className="text-xs font-semibold text-[#B49361] bg-[#FAF7F2] px-2.5 py-0.5 rounded-full border border-[#B49361]/20 capitalize">
                {membership.planId} Tier
              </span>
            </div>

            <p className="text-xs text-[#5C585E] leading-relaxed mb-4">
              Manage your current styling subscription package, compare tier capabilities, and review billing schedules.
            </p>

            <div className="flex items-center gap-2 mb-4 text-xs text-[#5C585E]">
              <span className="font-medium text-[#242326]">Renews {membership.renewsOn}</span>
              <span>•</span>
              <span className="text-emerald-700 font-medium capitalize">{membership.billingCycle}</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => onOpenMembership?.('membership')}
                className="py-2.5 px-3 rounded-xl bg-[#242326] hover:bg-[#38363a] text-white text-xs font-semibold text-center transition-colors cursor-pointer"
              >
                My Membership
              </button>
              <button
                onClick={() => onOpenMembership?.('plans')}
                className="py-2.5 px-3 rounded-xl bg-[#F6F2EC] hover:bg-[#E5CDBE]/40 text-[#242326] text-xs font-semibold text-center transition-colors cursor-pointer"
              >
                Explore Plans
              </button>
            </div>
          </div>
        </div>

        {/* CARD 11: AI CREDITS & USAGE LEDGER */}
        <div className="rounded-3xl bg-white border border-[#242326]/10 p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#FAF7F2] text-[#9C6A61] flex items-center justify-center border border-[#9C6A61]/20">
                  <Coins className="w-4 h-4" />
                </div>
                <h3 className="font-serif text-base font-semibold text-[#242326]">
                  AI Image Credits
                </h3>
              </div>
              <span className="text-xs font-semibold text-[#9C6A61] bg-[#FAF7F2] px-2.5 py-0.5 rounded-full border border-[#9C6A61]/20">
                {totalCredits} Available
              </span>
            </div>

            <p className="text-xs text-[#5C585E] leading-relaxed mb-4">
              Purchase instant top-up packs for upcoming events, inspect credit deduction costs, and view your complete usage ledger.
            </p>

            <div className="flex items-center gap-2 mb-4 text-xs text-[#5C585E]">
              <span className="font-medium text-[#242326]">{credits.bonusCredits} Bonus Credits</span>
              <span>•</span>
              <span className="text-[#B49361] font-medium">Never Expire</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => onOpenMembership?.('credits')}
                className="py-2.5 px-3 rounded-xl bg-[#9C6A61] hover:bg-[#85564e] text-white text-xs font-semibold text-center transition-colors cursor-pointer"
              >
                Top Up Credits
              </button>
              <button
                onClick={() => onOpenMembership?.('credit-history')}
                className="py-2.5 px-3 rounded-xl bg-[#F6F2EC] hover:bg-[#E5CDBE]/40 text-[#242326] text-xs font-semibold text-center transition-colors cursor-pointer"
              >
                Usage History
              </button>
            </div>
          </div>
        </div>

        {/* CARD 12: ACCOUNT SETTINGS, PRIVACY & NOTIFICATIONS */}
        <div className="rounded-3xl bg-white border border-[#242326]/10 p-5 sm:p-6 shadow-xs flex flex-col justify-between md:col-span-2">
          <div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#E5CDBE]/50 text-[#242326] flex items-center justify-center">
                  <Settings className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-serif text-base font-semibold text-[#242326]">
                    Account, Security & Data Sovereignty
                  </h3>
                  <p className="text-xs text-[#5C585E]">
                    Control personal contact info, authentication, photo privacy policies, and curated notification alerts.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <button
                onClick={() => onOpenMembership?.('settings')}
                className="p-3.5 rounded-2xl bg-[#FAF7F2] hover:bg-[#F6F2EC] border border-[#242326]/8 text-left transition-colors cursor-pointer flex items-center justify-between group"
              >
                <div>
                  <span className="text-xs font-semibold text-[#242326] block">Account Settings</span>
                  <span className="text-[10px] text-[#5C585E] block">Name, Email, Phone, SA City</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-[#9C6A61] group-hover:translate-x-0.5 transition-transform" />
              </button>

              <button
                onClick={() => onOpenMembership?.('privacy')}
                className="p-3.5 rounded-2xl bg-[#FAF7F2] hover:bg-[#F6F2EC] border border-[#242326]/8 text-left transition-colors cursor-pointer flex items-center justify-between group"
              >
                <div>
                  <span className="text-xs font-semibold text-[#242326] block">Privacy & Data</span>
                  <span className="text-[10px] text-[#5C585E] block">Ephemeral photos & Export</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-[#B49361] group-hover:translate-x-0.5 transition-transform" />
              </button>

              <button
                onClick={() => onOpenMembership?.('notifications')}
                className="p-3.5 rounded-2xl bg-[#FAF7F2] hover:bg-[#F6F2EC] border border-[#242326]/8 text-left transition-colors cursor-pointer flex items-center justify-between group"
              >
                <div>
                  <span className="text-xs font-semibold text-[#242326] block">Notification Alerts</span>
                  <span className="text-[10px] text-[#5C585E] block">Style drops & Weather prompts</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-[#9C6A61] group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal Controller */}
      <EditSectionModal
        section={activeEditSection}
        profile={profile}
        photos={photos}
        isOpen={!!activeEditSection}
        onClose={() => setActiveEditSection(null)}
        onSaveProfile={onUpdateProfile}
        onUpdatePhotos={onUpdatePhotos}
      />
    </div>
  );
};
