/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { UserProfile, NavigationTab, OccasionShortcut, StyleInspiration } from '../../types';
import { PersonalisedGreeting } from '../home/PersonalisedGreeting';
import { EditorialHero } from '../home/EditorialHero';
import { StyleInspirationSection } from '../home/StyleInspirationSection';
import { OccasionCarousel } from '../home/OccasionCarousel';
import { ShoppingPreview } from '../home/ShoppingPreview';
import { StyleProfileSummary } from '../home/StyleProfileSummary';
import { VirtualTryOnCard } from '../home/VirtualTryOnCard';
import { BeautySection } from '../home/BeautySection';
import { StylistInvitation } from '../home/StylistInvitation';
import { FamilyStylingCard } from '../home/FamilyStylingCard';
import { DigitalWardrobeCard } from '../home/DigitalWardrobeCard';
import { MembershipCard } from '../home/MembershipCard';
import { MembershipSubpageTab } from '../../types/membership';

interface HomeScreenProps {
  profile: UserProfile;
  onNavigate: (tab: NavigationTab) => void;
  onSelectOccasion: (occasion: OccasionShortcut) => void;
  onAskStylist: (initialPrompt?: string) => void;
  onExploreLook: (inspiration: StyleInspiration) => void;
  onStartOnboarding: () => void;
  onDiscoverStyles?: () => void;
  onOpenFamily?: () => void;
  onOpenWardrobe?: (tab?: 'pieces' | 'studio' | 'outfits' | 'planner' | 'gaps') => void;
  onOpenBeautyStudio?: () => void;
  onOpenMembership?: (tab?: MembershipSubpageTab) => void;
  wardrobeCounts?: { pieces: number; outfits: number } | null;
  usesAccount?: boolean;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  profile,
  onNavigate,
  onSelectOccasion,
  onAskStylist,
  onExploreLook,
  onStartOnboarding,
  onDiscoverStyles,
  onOpenFamily,
  onOpenWardrobe,
  onOpenBeautyStudio,
  onOpenMembership,
  wardrobeCounts = null,
  usesAccount = false,
}) => {
  const handleBeautyAdvice = (category: string) => {
    onAskStylist(`Recommend complementary ${category.toLowerCase()} that harmonize with my personal style aesthetic.`);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* 1. Personalised Greeting */}
      <PersonalisedGreeting
        firstName={profile.personal.firstName}
        isOnboardingCompleted={profile.isOnboardingCompleted}
      />

      {/* 2. Personalised Editorial Hero */}
      <EditorialHero
        userStyles={profile.styles}
        onAskStylist={onAskStylist}
        onDiscoverStyles={onDiscoverStyles}
      />

      {/* 3. Picked For Your Style */}
      <StyleInspirationSection
        userStyles={profile.styles}
        onExploreLook={onExploreLook}
        onDiscoverStyles={onDiscoverStyles}
      />

      {/* 4. Style For The Occasion (8 Curated Collections) */}
      <OccasionCarousel
        onSelectOccasion={onSelectOccasion}
      />

      {/* 5. Coordinated Family Styling Banner */}
      {onOpenFamily && (
        <FamilyStylingCard
          onOpenFamily={onOpenFamily}
          usesAccount={usesAccount}
        />
      )}

      {/* 5.5 Digital Wardrobe & Intelligent Outfit Planning */}
      {onOpenWardrobe && (
        <DigitalWardrobeCard
          onOpenWardrobe={onOpenWardrobe}
          accountCounts={wardrobeCounts}
          usesAccount={usesAccount}
        />
      )}

      {/* 6. Personalised Shopping Preview ("Shop your way") */}
      <ShoppingPreview
        shopping={profile.shopping}
        onNavigate={onNavigate}
      />

      {/* 6. Style Profile Summary ("Your Style DNA") */}
      <StyleProfileSummary
        profile={profile}
        onEditProfile={() => onNavigate('profile')}
        onStartOnboarding={onStartOnboarding}
      />

      {/* 7. Virtual Try-On Feature Preview */}
      <VirtualTryOnCard
        onNavigate={onNavigate}
      />

      {/* 8. Beauty Inspiration ("Beyond the Outfit") */}
      <BeautySection
        onAskBeautyAdvice={handleBeautyAdvice}
        onOpenBeautyStudio={onOpenBeautyStudio}
      />

      {/* 9. Membership, AI Credits & Settings Card */}
      {onOpenMembership && (
        <MembershipCard
          onOpenMembership={onOpenMembership}
        />
      )}

      {/* 10. Friendly Personal Stylist Invitation */}
      <StylistInvitation
        onAskStylist={() => onAskStylist()}
      />
    </div>
  );
};
