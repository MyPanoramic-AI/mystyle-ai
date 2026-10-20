/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import type { ReadyAccount } from './account/AccountRoot';
import {
  NavigationTab,
  OccasionShortcut,
  StyleInspiration,
  StylistNavigationState,
  UserProfile,
  TemporaryPhotos,
  FashionLook,
  PreloadedGarment,
  FamilyOutfitConcept,
  FamilyShoppingItem,
} from './types';
import { AppShell } from './components/layout/AppShell';
import { HomeScreen } from './components/pages/HomeScreen';
import { StylistChatScreen } from './components/stylist/StylistChatScreen';
import { TryOnPlaceholder } from './components/pages/TryOnPlaceholder';
import { ShopPreloadedContext } from './components/pages/ShopPlaceholder';
import { ShopScreen } from './components/shop/ShopScreen';
import { ProfileDashboard } from './components/profile/ProfileDashboard';
import { OnboardingFlow } from './components/onboarding/OnboardingFlow';
import { DiscoverScreen } from './components/discover/DiscoverScreen';
import { FamilyStylingScreen } from './components/family/FamilyStylingScreen';
import { WardrobeScreen } from './components/wardrobe/WardrobeScreen';
import { BeautyStudioScreen } from './components/beauty/BeautyStudioScreen';
import { MembershipHubScreen } from './components/membership/MembershipHubScreen';
import {
  BeautyCategory,
  BeautyProductItem,
  WardrobeItem,
  WardrobeOutfit,
  MembershipSubpageTab,
} from './types';

export default function App({ account }: { account: ReadyAccount }) {
  const [currentTab, setCurrentTab] = useState<NavigationTab>('home');
  const [activeSubpage, setActiveSubpage] = useState<'discover' | 'family' | 'beauty' | 'wardrobe' | 'membership' | null>(null);
  const [discoverInitialCollectionId, setDiscoverInitialCollectionId] = useState<string | undefined>(undefined);
  const [discoverInitialLookId, setDiscoverInitialLookId] = useState<string | undefined>(undefined);
  const [familyInitialTab, setFamilyInitialTab] = useState<'planner' | 'members' | 'shopping' | 'saved'>('planner');
  const [wardrobeInitialTab, setWardrobeInitialTab] = useState<'pieces' | 'studio' | 'outfits' | 'planner' | 'gaps' | 'capsules'>('pieces');
  const [beautyInitialTab, setBeautyInitialTab] = useState<BeautyCategory | 'saved' | 'bag'>('complete-looks');
  const [membershipInitialTab, setMembershipInitialTab] = useState<MembershipSubpageTab>('membership');

  // Preloaded data passed across tabs
  const [tryOnPreloadedLook, setTryOnPreloadedLook] = useState<FashionLook | null>(null);
  const [tryOnPreloadedGarment, setTryOnPreloadedGarment] = useState<PreloadedGarment | null>(null);
  const [tryOnFamilyMemberName, setTryOnFamilyMemberName] = useState<string | null>(null);
  const [shopPreloadedContext, setShopPreloadedContext] = useState<ShopPreloadedContext | null>(null);
  const [stylistState, setStylistState] = useState<StylistNavigationState>({});

  // Profile and temporary memory photos
  const [profile, setProfile] = useState<UserProfile>(account.profile);
  const [photos, setPhotos] = useState<TemporaryPhotos>({});
  const [isOnboardingActive, setIsOnboardingActive] = useState<boolean>(account.mode === 'account' && account.profile.onboardingStatus === 'pending');
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [accountError, setAccountError] = useState<string | null>(null);
  const [wardrobeCounts, setWardrobeCounts] = useState<{ pieces: number; outfits: number } | null>(null);

  useEffect(() => {
    if (!account.wardrobe) {
      setWardrobeCounts(null);
      return;
    }
    let cancelled = false;
    void account.wardrobe.load().then((loaded) => {
      if (!cancelled) setWardrobeCounts({ pieces: loaded.items.length, outfits: loaded.outfits.length });
    }).catch(() => {
      if (!cancelled) setWardrobeCounts({ pieces: 0, outfits: 0 });
    });
    return () => {
      cancelled = true;
    };
  }, [account.wardrobe]);

  const handleUpdateProfile = async (newProfile: UserProfile) => {
    const saved = await account.saveProfile(newProfile);
    setProfile(saved);
    setSaveMessage('Your style profile is saved.');
    setAccountError(null);
  };

  const handleUpdatePhotos = (newPhotos: TemporaryPhotos) => {
    setPhotos(newPhotos);
  };

  const handleNavigate = (tab: NavigationTab) => {
    setActiveSubpage(null);
    setCurrentTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Open internal Discover page
  const handleOpenDiscover = (collectionId?: string, lookId?: string) => {
    setDiscoverInitialCollectionId(collectionId);
    setDiscoverInitialLookId(lookId);
    setActiveSubpage('discover');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectOccasion = (occasion: OccasionShortcut) => {
    setActiveSubpage(null);
    setStylistState({
      occasionTitle: occasion.title,
      suggestedPrompt: occasion.promptSuggestion,
      origin: 'occasion',
      timestamp: Date.now(),
    });
    setCurrentTab('stylist');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAskStylist = (initialPrompt?: string) => {
    setActiveSubpage(null);
    setStylistState({
      suggestedPrompt: initialPrompt || '',
      origin: 'hero',
      timestamp: Date.now(),
    });
    setCurrentTab('stylist');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleStyleSimilar = (inspiration: StyleInspiration) => {
    setActiveSubpage(null);
    setStylistState({
      occasionTitle: inspiration.occasion,
      suggestedPrompt: `Help me style an outfit inspired by "${inspiration.title}" with a ${inspiration.aesthetic} aesthetic for ${inspiration.occasion}.`,
      origin: 'inspiration',
      timestamp: Date.now(),
    });
    setCurrentTab('stylist');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Discover Action 1: Try This Look -> Navigates to Try On
  const handleTryThisLook = (look: FashionLook) => {
    setTryOnPreloadedLook(look);
    setActiveSubpage(null);
    setCurrentTab('try-on');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Discover Action 2: Ask My Stylist -> Navigates to Stylist with rich look context
  const handleAskMyStylistFromLook = (look: FashionLook) => {
    setStylistState({
      occasionTitle: look.occasions[0] || look.category,
      suggestedPrompt: `Help me personalise this look: "${look.title}" (${look.category} style). How can I adapt it for my silhouette and budget?`,
      origin: 'inspiration',
      timestamp: Date.now(),
    });
    setActiveSubpage(null);
    setCurrentTab('stylist');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Discover Action 3: Find Similar Clothes -> Navigates to Shop
  const handleFindSimilarClothes = (look: FashionLook) => {
    setShopPreloadedContext({
      outfitTitle: look.title,
      category: look.category,
      pieces: look.pieces.map((p) => p.name),
    });
    setActiveSubpage(null);
    setCurrentTab('shop');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Shop Action: Try This Item -> Navigates to Try On with preloaded garment
  const handleSendToTryOnFromShop = (garment: PreloadedGarment) => {
    setTryOnPreloadedGarment(garment);
    setTryOnPreloadedLook(null);
    setTryOnFamilyMemberName(null);
    setActiveSubpage(null);
    setCurrentTab('try-on');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Family Action: Open Family Hub
  const handleOpenFamily = (tab: 'planner' | 'members' | 'shopping' | 'saved' = 'planner') => {
    setFamilyInitialTab(tab);
    setActiveSubpage('family');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Family Action: Try On in Studio
  const handleSendFamilyToTryOn = (concept: FamilyOutfitConcept) => {
    const garment: PreloadedGarment = {
      productId: concept.id,
      productName: `${concept.familyMemberName}'s ${concept.conceptTitle}`,
      retailer: 'Family Styling Ensemble',
      priceZar: concept.pieces.reduce((sum, p) => sum + p.estimatedPriceZar, 0),
      imageUrl: concept.imageUrl,
      category: 'Family Styling',
    };
    setTryOnPreloadedGarment(garment);
    setTryOnPreloadedLook(null);
    setTryOnFamilyMemberName(concept.familyMemberName);
    setActiveSubpage(null);
    setCurrentTab('try-on');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Family Action: Send items to Shop
  const handleSendFamilyToShop = (items: FamilyShoppingItem[]) => {
    setShopPreloadedContext({
      outfitTitle: 'Coordinated Family Outfits',
      category: 'Family Collection',
      pieces: items.map((i) => `${i.familyMemberName}: ${i.pieceName}`),
    });
    setActiveSubpage(null);
    setCurrentTab('shop');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Family Action: Ask Stylist advice
  const handleAskStylistFamily = (prompt: string) => {
    setActiveSubpage(null);
    setStylistState({
      occasionTitle: 'Family Styling',
      suggestedPrompt: prompt,
      origin: 'occasion',
      timestamp: Date.now(),
    });
    setCurrentTab('stylist');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Wardrobe Action: Open Digital Wardrobe Hub
  const handleOpenWardrobe = (tab: 'pieces' | 'studio' | 'outfits' | 'planner' | 'gaps' | 'capsules' = 'pieces') => {
    setWardrobeInitialTab(tab);
    setActiveSubpage('wardrobe');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Wardrobe Action: Send assembled look to Virtual Try-On
  const handleSendWardrobeToTryOn = (outfit: WardrobeOutfit, pieces: WardrobeItem[]) => {
    const garment: PreloadedGarment = {
      productId: outfit.id,
      productName: outfit.title,
      retailer: 'Personal Wardrobe Ensemble',
      priceZar: 0,
      imageUrl: pieces[0]?.imageUrl || '',
      category: outfit.occasion,
    };
    setTryOnPreloadedGarment(garment);
    setTryOnPreloadedLook(null);
    setTryOnFamilyMemberName(null);
    setActiveSubpage(null);
    setCurrentTab('try-on');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Wardrobe Action: Send Gap requirement to Shop
  const handleSendWardrobeToShop = (searchQuery: string, title?: string) => {
    setShopPreloadedContext({
      outfitTitle: title || 'Wardrobe Gap Foundational Item',
      category: 'Wardrobe Gap',
      pieces: [searchQuery],
    });
    setActiveSubpage(null);
    setCurrentTab('shop');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Wardrobe Action: Ask Stylist advice
  const handleAskStylistWardrobe = (prompt: string) => {
    setActiveSubpage(null);
    setStylistState({
      occasionTitle: 'Wardrobe Planning',
      suggestedPrompt: prompt,
      origin: 'occasion',
      timestamp: Date.now(),
    });
    setCurrentTab('stylist');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Beauty Action: Open Beauty Studio
  const handleOpenBeauty = (tab: BeautyCategory | 'saved' | 'bag' = 'complete-looks') => {
    setBeautyInitialTab(tab);
    setActiveSubpage('beauty');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Beauty Action: Send products to Shop
  const handleSendBeautyToShop = (products: BeautyProductItem[], outfitTitle?: string) => {
    setShopPreloadedContext({
      outfitTitle: outfitTitle || 'Curated Beauty Essentials',
      category: 'Beauty Studio',
      pieces: products.map((p) => `${p.brand} ${p.name}`),
    });
    setActiveSubpage(null);
    setCurrentTab('shop');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Beauty Action: Ask Stylist advice
  const handleAskStylistBeauty = (prompt: string) => {
    setActiveSubpage(null);
    setStylistState({
      occasionTitle: 'Beauty Consultation',
      suggestedPrompt: prompt,
      origin: 'occasion',
      timestamp: Date.now(),
    });
    setCurrentTab('stylist');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Membership Action: Open Membership, Credits & Settings Hub
  const handleOpenMembership = (tab: MembershipSubpageTab = 'membership') => {
    setMembershipInitialTab(tab);
    setActiveSubpage('membership');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleClearStylistState = () => {
    setStylistState({});
  };

  const handleOnboardingComplete = async (completedProfile: UserProfile, completedPhotos: TemporaryPhotos) => {
    const saved = await account.saveProfile({ ...completedProfile, isOnboardingCompleted: true, onboardingStatus: 'completed' });
    setProfile(saved);
    setPhotos(completedPhotos);
    setSaveMessage('Your style profile is saved.');
    setIsOnboardingActive(false);
    setActiveSubpage(null);
    setCurrentTab('home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleExitOnboarding = async () => {
    if (account.mode === 'account' && profile.onboardingStatus === 'pending') {
      try {
        const saved = await account.deferOnboarding();
        setProfile(saved);
      } catch (error) {
        setAccountError(error instanceof Error ? error.message : 'Onboarding could not be saved.');
        return;
      }
    }
    setIsOnboardingActive(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // If onboarding flow is active, render full-screen guided experience
  if (isOnboardingActive) {
    return (
      <OnboardingFlow
        initialProfile={profile}
        initialPhotos={photos}
        onComplete={handleOnboardingComplete}
        onExit={handleExitOnboarding}
        saveError={accountError}
      />
    );
  }

  return (
    <AppShell
      currentTab={currentTab}
      onNavigate={handleNavigate}
      userAvatarName={profile.personal.firstName || 'Guest'}
      userAvatarPhoto={photos.profilePhotoUrl}
      onOpenMembership={handleOpenMembership}
    >
      {account.mode === 'demo' ? (
        <div className="max-w-4xl mx-auto mb-4 rounded-2xl border border-[#B49361]/40 bg-[#E5CDBE]/30 px-4 py-3 text-sm text-[#242326] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <span>Demonstration profile. This is not a saved customer account.</span>
          <button type="button" className="text-xs font-semibold uppercase tracking-wider text-[#9C6A61]" onClick={account.leaveDemo}>Leave demonstration</button>
        </div>
      ) : null}
      {/* 1. Internal Discover Page */}
      {activeSubpage === 'discover' && (
        <DiscoverScreen
          profile={profile}
          initialCollectionId={discoverInitialCollectionId}
          initialSelectedLookId={discoverInitialLookId}
          onNavigate={handleNavigate}
          onTryThisLook={handleTryThisLook}
          onAskMyStylist={handleAskMyStylistFromLook}
          onFindSimilarClothes={handleFindSimilarClothes}
          onBackToHome={() => {
            setActiveSubpage(null);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
      )}

      {/* 2. Internal Family Styling Hub */}
      {activeSubpage === 'family' && (
        <FamilyStylingScreen
          userProfile={profile}
          initialTab={familyInitialTab}
          onNavigate={handleNavigate}
          onSendToTryOn={handleSendFamilyToTryOn}
          onSendToShop={handleSendFamilyToShop}
          onAskStylist={handleAskStylistFamily}
          browserNotice={account.mode === 'account' ? 'These family records stay in this browser. They are not part of your saved account and are not uploaded.' : undefined}
          onBack={() => {
            setActiveSubpage(null);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
      )}

      {/* 2.5. Internal Digital Wardrobe & Intelligent Outfit Planning Hub */}
      {activeSubpage === 'wardrobe' && (
        <WardrobeScreen
          accountStore={account.wardrobe}
          initialTab={wardrobeInitialTab}
          onBack={() => {
            setActiveSubpage(null);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onSendToTryOn={handleSendWardrobeToTryOn}
          onSendToShop={handleSendWardrobeToShop}
          onAskStylist={handleAskStylistWardrobe}
        />
      )}

      {/* 2.6. Internal AI Beauty Studio */}
      {activeSubpage === 'beauty' && (
        <BeautyStudioScreen
          initialTab={beautyInitialTab}
          onBack={() => {
            setActiveSubpage(null);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onSendToShop={handleSendBeautyToShop}
          onAskStylist={handleAskStylistBeauty}
        />
      )}

      {/* 2.7. Internal Memberships, AI Credits & Account Settings Hub */}
      {activeSubpage === 'membership' && (
        <MembershipHubScreen
          initialTab={membershipInitialTab}
          onBack={() => {
            setActiveSubpage(null);
            setCurrentTab('profile');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
      )}

      {/* 3. Primary Tabs (when not on a subpage) */}
      {!activeSubpage && currentTab === 'home' && (
        <HomeScreen
          profile={profile}
          onNavigate={handleNavigate}
          onSelectOccasion={handleSelectOccasion}
          onAskStylist={handleAskStylist}
          onExploreLook={handleStyleSimilar}
          onStartOnboarding={() => setIsOnboardingActive(true)}
          onDiscoverStyles={() => handleOpenDiscover()}
          onOpenFamily={() => handleOpenFamily('planner')}
          onOpenWardrobe={handleOpenWardrobe}
          onOpenBeautyStudio={() => handleOpenBeauty('complete-looks')}
          onOpenMembership={handleOpenMembership}
          wardrobeCounts={wardrobeCounts}
          usesAccount={account.mode === 'account'}
        />
      )}

      {!activeSubpage && currentTab === 'stylist' && (
        <StylistChatScreen
          profile={profile}
          photos={photos}
          state={stylistState}
          onNavigate={handleNavigate}
          onClearState={handleClearStylistState}
          onOpenDiscover={() => handleOpenDiscover()}
          connection={account.stylist ? {
            aiConsent: account.aiConsent,
            onEnableConsent: () => account.setAiConsent(true),
            availability: account.stylist.availability,
            restore: account.stylist.restore,
            send: account.stylist.send,
            remove: account.stylist.remove,
          } : undefined}
        />
      )}

      {!activeSubpage && currentTab === 'try-on' && (
        <TryOnPlaceholder
          onNavigate={handleNavigate}
          preloadedOutfit={tryOnPreloadedLook}
          preloadedGarment={tryOnPreloadedGarment}
          familyMemberName={tryOnFamilyMemberName}
          photos={photos}
          onClearGarment={() => {
            setTryOnPreloadedGarment(null);
            setTryOnFamilyMemberName(null);
          }}
          onClearOutfit={() => setTryOnPreloadedLook(null)}
        />
      )}

      {!activeSubpage && currentTab === 'shop' && (
        <ShopScreen
          profile={profile}
          preloadedContext={shopPreloadedContext}
          onNavigate={handleNavigate}
          onSendToTryOn={handleSendToTryOnFromShop}
          onClearPreloadedContext={() => setShopPreloadedContext(null)}
        />
      )}

      {!activeSubpage && currentTab === 'profile' && (
        <ProfileDashboard
          profile={profile}
          photos={photos}
          onUpdateProfile={handleUpdateProfile}
          onUpdatePhotos={handleUpdatePhotos}
          accountEmail={account.email}
          saveMessage={saveMessage}
          onLogout={account.mode === 'account' ? () => { void account.logout(); } : undefined}
          onRestartOnboarding={() => setIsOnboardingActive(true)}
          onOpenSavedLooks={() => handleOpenDiscover()}
          onOpenFamily={() => handleOpenFamily('members')}
          onOpenWardrobe={handleOpenWardrobe}
          onOpenBeautyStudio={() => handleOpenBeauty('complete-looks')}
          onOpenMembership={handleOpenMembership}
          wardrobeCounts={wardrobeCounts}
          usesAccount={account.mode === 'account'}
        />
      )}
    </AppShell>
  );
}
