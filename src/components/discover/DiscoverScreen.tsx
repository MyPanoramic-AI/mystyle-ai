/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  FashionLook,
  FashionCollection,
  FashionCategoryType,
} from '../../types/discover';
import { UserProfile, NavigationTab } from '../../types';
import {
  STYLE_CATEGORIES,
  FASHION_COLLECTIONS,
  FASHION_LOOKS,
  getCuratedLooksForProfile,
  searchFashionLooks,
} from '../../data/discoverData';
import { OutfitCard } from './OutfitCard';
import { CollectionCard } from './CollectionCard';
import { OutfitDetailView } from './OutfitDetailView';
import { SavedLooksView } from './SavedLooksView';
import { savedLooksService } from '../../services/savedLooksService';
import {
  Search,
  X,
  Sparkles,
  ArrowLeft,
  Heart,
  SlidersHorizontal,
  Compass,
  Filter,
} from 'lucide-react';

interface DiscoverScreenProps {
  profile: UserProfile;
  initialCollectionId?: string;
  initialSelectedLookId?: string;
  onNavigate: (tab: NavigationTab) => void;
  onTryThisLook: (look: FashionLook) => void;
  onAskMyStylist: (look: FashionLook) => void;
  onFindSimilarClothes: (look: FashionLook) => void;
  onBackToHome: () => void;
}

export const DiscoverScreen: React.FC<DiscoverScreenProps> = ({
  profile,
  initialCollectionId,
  initialSelectedLookId,
  onNavigate,
  onTryThisLook,
  onAskMyStylist,
  onFindSimilarClothes,
  onBackToHome,
}) => {
  // Navigation / active sub-view
  const [activeTab, setActiveTab] = useState<'browse' | 'saved'>('browse');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<FashionCategoryType>('All Styles');
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(
    initialCollectionId || null
  );

  // Selected look for detail view
  const [selectedLook, setSelectedLook] = useState<FashionLook | null>(() => {
    if (initialSelectedLookId) {
      return FASHION_LOOKS.find((l) => l.id === initialSelectedLookId) || null;
    }
    return null;
  });

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Curated looks for the customer's style profile
  const curatedLooks = useMemo(() => {
    return getCuratedLooksForProfile(profile.styles);
  }, [profile.styles]);

  // Main filtered gallery looks
  const filteredGalleryLooks = useMemo(() => {
    let looks = searchFashionLooks(searchQuery, selectedCategory);

    if (selectedCollectionId) {
      looks = looks.filter((l) => l.collectionIds.includes(selectedCollectionId));
    }

    return looks;
  }, [searchQuery, selectedCategory, selectedCollectionId]);

  const activeCollection = useMemo(() => {
    if (!selectedCollectionId) return null;
    return FASHION_COLLECTIONS.find((c) => c.id === selectedCollectionId) || null;
  }, [selectedCollectionId]);

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('All Styles');
    setSelectedCollectionId(null);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fadeIn pb-12">
      {/* Top Navigation & Header */}
      <div className="space-y-4">
        {/* Back and Tab Switcher */}
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={onBackToHome}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[#5C585E] hover:text-[#242326] transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </button>

          {/* Browse vs Saved Toggle */}
          <div className="flex items-center gap-1 p-1 bg-[#F6F2EC] rounded-full border border-[#242326]/5 text-xs">
            <button
              onClick={() => setActiveTab('browse')}
              className={`px-3.5 py-1.5 rounded-full font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'browse'
                  ? 'bg-white text-[#242326] shadow-2xs font-semibold'
                  : 'text-[#5C585E] hover:text-[#242326]'
              }`}
            >
              <Compass className="w-3.5 h-3.5 text-[#9C6A61]" />
              <span>Discover</span>
            </button>
            <button
              onClick={() => setActiveTab('saved')}
              className={`px-3.5 py-1.5 rounded-full font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'saved'
                  ? 'bg-white text-[#242326] shadow-2xs font-semibold'
                  : 'text-[#5C585E] hover:text-[#242326]'
              }`}
            >
              <Heart className="w-3.5 h-3.5 text-[#9C6A61]" />
              <span>Saved Looks</span>
            </button>
          </div>
        </div>

        {/* Header Titles */}
        {activeTab === 'browse' ? (
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold tracking-wider uppercase text-[#9C6A61]">
                Editorial Lookbook
              </span>
              <span className="text-xs text-[#5C585E]">· South African Curation</span>
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-[#242326] tracking-tight mt-1">
              Discover Your Next Look
            </h1>
            <p className="text-sm text-[#5C585E] max-w-xl mt-1 leading-relaxed">
              Find inspiration, explore your style and discover looks you'll love.
            </p>
          </div>
        ) : null}
      </div>

      {/* Main Tab Content */}
      {activeTab === 'saved' ? (
        <SavedLooksView
          onOpenOutfit={(look) => setSelectedLook(look)}
          onExploreDiscover={() => setActiveTab('browse')}
          onToast={showToast}
        />
      ) : (
        <div className="space-y-10">
          {/* 1. Search Field */}
          <div className="relative max-w-xl">
            <div className="relative flex items-center">
              <Search className="absolute left-4 w-4 h-4 text-[#5C585E] pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search styles, outfits or occasions (e.g. black dress, wedding, office)..."
                className="w-full bg-white text-[#242326] placeholder-[#5C585E]/60 text-xs sm:text-sm pl-11 pr-10 py-3 rounded-2xl border border-[#242326]/12 focus:border-[#9C6A61] focus:ring-1 focus:ring-[#9C6A61] outline-none shadow-2xs transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 w-6 h-6 rounded-full hover:bg-[#F6F2EC] text-[#5C585E] flex items-center justify-center cursor-pointer"
                  aria-label="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* 2. Style Category Filters (Horizontally Scrollable) */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              {STYLE_CATEGORIES.map((cat) => {
                const isActive = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`shrink-0 px-4 py-2 rounded-full text-xs font-medium border transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[#9C6A61] text-white border-[#9C6A61] shadow-2xs font-semibold'
                        : 'bg-white hover:bg-[#FAF7F2] text-[#5C585E] hover:text-[#242326] border-[#242326]/10'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Collection Filter Bar (if user filtered by collection) */}
          {activeCollection && (
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#FAF7F2] border border-[#9C6A61]/30">
              <div className="flex items-center gap-2.5">
                <span className="w-2 h-2 rounded-full bg-[#9C6A61]" />
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#9C6A61]">
                    Viewing Collection:
                  </span>
                  <p className="text-xs font-semibold text-[#242326]">{activeCollection.title}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedCollectionId(null)}
                className="text-xs font-medium text-[#9C6A61] hover:text-[#242326] inline-flex items-center gap-1 cursor-pointer"
              >
                <span>Clear collection filter</span>
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* 3. Featured Fashion Collections Carousel (Shown when no search/collection filter is active) */}
          {!searchQuery && !selectedCollectionId && selectedCategory === 'All Styles' && (
            <section className="space-y-4">
              <div className="flex items-baseline justify-between">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#9C6A61] block mb-0.5">
                    Curated Themes
                  </span>
                  <h2 className="font-serif text-xl sm:text-2xl font-semibold text-[#242326]">
                    Featured Fashion Collections
                  </h2>
                </div>
                <span className="text-xs text-[#5C585E]">
                  {FASHION_COLLECTIONS.length} Collections
                </span>
              </div>

              {/* Horizontal scroll container on mobile, multi-column on desktop */}
              <div className="flex items-stretch gap-4 overflow-x-auto pb-3 pt-1 scrollbar-none">
                {FASHION_COLLECTIONS.map((col) => {
                  const count = FASHION_LOOKS.filter((l) => l.collectionIds.includes(col.id)).length;
                  return (
                    <CollectionCard
                      key={col.id}
                      collection={col}
                      lookCount={count}
                      isSelected={selectedCollectionId === col.id}
                      onExplore={(c) => {
                        setSelectedCollectionId(c.id);
                        showToast(`Filtered gallery by "${c.title}"`);
                      }}
                    />
                  );
                })}
              </div>
            </section>
          )}

          {/* 4. "Curated For You" Section (Personalized by Style Profile) */}
          {!searchQuery && !selectedCollectionId && selectedCategory === 'All Styles' && (
            <section className="space-y-4 pt-2">
              <div className="flex items-baseline justify-between">
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#9C6A61] mb-0.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#B49361]" />
                    <span>Curated For You</span>
                  </div>
                  <h2 className="font-serif text-xl sm:text-2xl font-semibold text-[#242326]">
                    Matched to Your Style DNA
                  </h2>
                </div>
                <p className="text-xs text-[#5C585E] hidden sm:block">
                  Tailored for {profile.personal.firstName || 'You'} · {profile.styles.slice(0, 2).join(' & ') || 'Classic Elegance'}
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 sm:gap-4">
                {curatedLooks.map((look) => (
                  <OutfitCard
                    key={`curated-${look.id}`}
                    look={look}
                    onSelectLook={(l) => setSelectedLook(l)}
                    onToast={showToast}
                  />
                ))}
              </div>
            </section>
          )}

          {/* 5. Outfit Discovery Gallery */}
          <section className="space-y-4 pt-2">
            <div className="flex items-baseline justify-between border-b border-[#242326]/10 pb-3">
              <div>
                <h2 className="font-serif text-xl sm:text-2xl font-semibold text-[#242326]">
                  {selectedCategory !== 'All Styles' ? `${selectedCategory} Looks` : 'All Outfit Inspirations'}
                </h2>
                <p className="text-xs text-[#5C585E] mt-0.5">
                  Showing {filteredGalleryLooks.length} {filteredGalleryLooks.length === 1 ? 'outfit' : 'outfits'}
                  {searchQuery ? ` matching "${searchQuery}"` : ''}
                </p>
              </div>

              {(searchQuery || selectedCategory !== 'All Styles' || selectedCollectionId) && (
                <button
                  onClick={handleClearFilters}
                  className="text-xs font-semibold text-[#9C6A61] hover:text-[#242326] transition-colors cursor-pointer"
                >
                  Reset all filters
                </button>
              )}
            </div>

            {/* Gallery Grid: 2-column mobile, multi-column desktop */}
            {filteredGalleryLooks.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5 sm:gap-5">
                {filteredGalleryLooks.map((look) => (
                  <OutfitCard
                    key={look.id}
                    look={look}
                    onSelectLook={(l) => setSelectedLook(l)}
                    onToast={showToast}
                  />
                ))}
              </div>
            ) : (
              /* Friendly Empty State */
              <div className="rounded-3xl bg-white border border-[#242326]/10 p-8 sm:p-12 text-center max-w-md mx-auto space-y-4 my-8">
                <div className="w-12 h-12 rounded-full bg-[#FAF7F2] text-[#5C585E] flex items-center justify-center mx-auto">
                  <Filter className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-serif text-lg font-semibold text-[#242326]">
                    No outfits found
                  </h3>
                  <p className="text-xs text-[#5C585E] leading-relaxed">
                    We couldn't find any looks matching your current search or category filter.
                  </p>
                </div>
                <button
                  onClick={handleClearFilters}
                  className="px-4 py-2 rounded-xl bg-[#242326] text-white text-xs font-semibold shadow-xs hover:bg-black transition-colors cursor-pointer"
                >
                  View All Outfits
                </button>
              </div>
            )}
          </section>
        </div>
      )}

      {/* Outfit Detail View Overlay Modal */}
      {selectedLook && (
        <OutfitDetailView
          look={selectedLook}
          onClose={() => setSelectedLook(null)}
          onTryThisLook={(look) => {
            setSelectedLook(null);
            onTryThisLook(look);
          }}
          onAskMyStylist={(look) => {
            setSelectedLook(null);
            onAskMyStylist(look);
          }}
          onFindSimilarClothes={(look) => {
            setSelectedLook(null);
            onFindSimilarClothes(look);
          }}
          onToast={showToast}
        />
      )}

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-20 sm:bottom-8 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-full bg-[#242326] text-white text-xs font-medium shadow-xl border border-white/10 animate-in fade-in zoom-in-95 duration-150">
          {toastMessage}
        </div>
      )}
    </div>
  );
};
