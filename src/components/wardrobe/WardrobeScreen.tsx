/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  WardrobeCategory,
  WardrobeSeason,
  WardrobeOccasion,
  WardrobeItem,
  WardrobeOutfit,
  PlannedEvent,
  WardrobeGap,
} from '../../types/wardrobe';
import {
  getWardrobeItems,
  saveWardrobeItem,
  toggleFavoriteItem,
  logItemWorn,
  deleteWardrobeItem,
  getWardrobeOutfits,
  saveWardrobeOutfit,
  toggleFavoriteOutfit,
  deleteWardrobeOutfit,
  getPlannedEvents,
  savePlannedEvent,
  getWardrobeGaps,
  getCapsuleCollections,
} from '../../services/wardrobeService';
import { WardrobeItemCard } from './WardrobeItemCard';
import { WardrobeOutfitCard } from './WardrobeOutfitCard';
import { WardrobeItemDetailModal } from './WardrobeItemDetailModal';
import { AddItemModal } from './AddItemModal';
import { OutfitBuilderStudio } from './OutfitBuilderStudio';
import { EventPlannerView } from './EventPlannerView';
import { WardrobeGapsView } from './WardrobeGapsView';
import { CapsuleCollectionsView } from './CapsuleCollectionsView';
import {
  ArrowLeft,
  Plus,
  Search,
  Filter,
  Sparkles,
  Bookmark,
  Calendar,
  Layers,
  TrendingUp,
  Check,
  Grid,
} from 'lucide-react';

interface WardrobeScreenProps {
  onBack: () => void;
  onSendToTryOn: (outfit: WardrobeOutfit, pieces: WardrobeItem[]) => void;
  onSendToShop: (searchQuery: string, title?: string) => void;
  onAskStylist: (prompt: string) => void;
  initialTab?: 'pieces' | 'studio' | 'outfits' | 'planner' | 'gaps' | 'capsules';
}

export const WardrobeScreen: React.FC<WardrobeScreenProps> = ({
  onBack,
  onSendToTryOn,
  onSendToShop,
  onAskStylist,
  initialTab = 'pieces',
}) => {
  const [activeTab, setActiveTab] = useState<
    'pieces' | 'studio' | 'outfits' | 'planner' | 'gaps' | 'capsules'
  >(initialTab);

  const [items, setItems] = useState<WardrobeItem[]>([]);
  const [outfits, setOutfits] = useState<WardrobeOutfit[]>([]);
  const [events, setEvents] = useState<PlannedEvent[]>([]);
  const [gaps, setGaps] = useState<WardrobeGap[]>([]);
  const [capsules, setCapsules] = useState(getCapsuleCollections());

  // Search & Filter state for pieces
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<WardrobeCategory | 'all'>('all');
  const [selectedSeason, setSelectedSeason] = useState<WardrobeSeason | 'all'>('all');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  // Modals state
  const [selectedItemForDetail, setSelectedItemForDetail] = useState<WardrobeItem | null>(null);
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    setItems(getWardrobeItems());
    setOutfits(getWardrobeOutfits());
    setEvents(getPlannedEvents());
    setGaps(getWardrobeGaps());
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleAddItem = (newItem: Omit<WardrobeItem, 'id' | 'dateAdded' | 'timesWorn'>) => {
    const saved = saveWardrobeItem(newItem);
    setItems(getWardrobeItems());
    showToast(`Added "${saved.name}" to your Digital Wardrobe`);
  };

  const handleToggleFavoriteItem = (id: string) => {
    const updated = toggleFavoriteItem(id);
    setItems(updated);
  };

  const handleLogWearItem = (id: string) => {
    const updated = logItemWorn(id);
    setItems(updated);
    showToast('Wear count logged for today');
  };

  const handleDeleteItem = (id: string) => {
    const updated = deleteWardrobeItem(id);
    setItems(updated);
    showToast('Item removed from wardrobe');
  };

  const handleSaveOutfit = (newOutfit: Omit<WardrobeOutfit, 'id' | 'dateCreated' | 'wearCount'>) => {
    saveWardrobeOutfit(newOutfit);
    setOutfits(getWardrobeOutfits());
    setActiveTab('outfits');
    showToast(`Created outfit: "${newOutfit.title}"`);
  };

  const handleToggleFavoriteOutfit = (id: string) => {
    const updated = toggleFavoriteOutfit(id);
    setOutfits(updated);
  };

  const handleLogWearOutfit = (id: string) => {
    const current = getWardrobeOutfits();
    const updated = current.map((o) =>
      o.id === id ? { ...o, wearCount: o.wearCount + 1, lastWornDate: 'Today' } : o
    );
    localStorage.setItem('mystyle_wardrobe_outfits_v1', JSON.stringify(updated));
    setOutfits(updated);
    showToast('Outfit wear logged for today');
  };

  const handleAddEvent = (event: Omit<PlannedEvent, 'id'>) => {
    savePlannedEvent(event);
    setEvents(getPlannedEvents());
    showToast(`Added event "${event.title}" to planner`);
  };

  const handleAssignOutfitToEvent = (eventId: string, outfitId: string) => {
    const event = events.find((e) => e.id === eventId);
    if (!event) return;
    savePlannedEvent({ ...event, outfitId });
    setEvents(getPlannedEvents());
    showToast('Assigned outfit to event');
  };

  const handleShopGap = (gap: WardrobeGap) => {
    onSendToShop(gap.searchQuery, gap.title);
  };

  // Filter items
  const filteredItems = items.filter((item) => {
    if (selectedCategory !== 'all' && item.category !== selectedCategory) return false;
    if (selectedSeason !== 'all' && !item.seasons.includes(selectedSeason) && !item.seasons.includes('all-season')) return false;
    if (showFavoritesOnly && !item.isFavorite) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        item.name.toLowerCase().includes(q) ||
        item.brand.toLowerCase().includes(q) ||
        item.subcategory.toLowerCase().includes(q) ||
        item.color.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-[#FBF8F5] pb-24">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed top-20 right-4 z-50 bg-[#242326] text-white text-xs px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <Check className="w-3.5 h-3.5 text-[#B49361]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Sticky Header */}
      <div className="bg-white border-b border-[#242326]/8 sticky top-16 z-30 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-2 -ml-2 rounded-xl text-[#5C585E] hover:text-[#242326] hover:bg-[#F6F2EC] transition-colors cursor-pointer"
              aria-label="Back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono tracking-widest text-[#B49361] uppercase font-semibold">
                  Personal Archive
                </span>
                <span className="text-[10px] bg-[#E5CDBE]/40 text-[#9C6A61] px-2 py-0.5 rounded-md font-medium">
                  {items.length} Pieces Owned
                </span>
              </div>
              <h1 className="font-serif text-xl sm:text-2xl font-bold text-[#242326]">
                Digital Wardrobe & Outfit Planner
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAddItemOpen(true)}
              className="px-3.5 py-2 bg-[#9C6A61] hover:bg-[#8A5B53] text-white text-xs font-medium rounded-xl transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Add Clothing Piece</span>
              <span className="sm:hidden">Add</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center gap-2 overflow-x-auto no-scrollbar pb-3 pt-1">
          {[
            { id: 'pieces', label: `Wardrobe (${items.length})` },
            { id: 'studio', label: 'Outfit Studio' },
            { id: 'outfits', label: `Saved Looks (${outfits.length})` },
            { id: 'planner', label: `Event Planner (${events.length})` },
            { id: 'gaps', label: `Wardrobe Gaps (${gaps.length})` },
            { id: 'capsules', label: 'Capsules' },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2 text-xs font-medium rounded-xl whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#242326] text-white shadow-xs'
                    : 'bg-[#F6F2EC] text-[#5C585E] hover:text-[#242326] hover:bg-[#E5CDBE]/40'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Viewport */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-6">
        {/* TAB 1: Wardrobe Pieces */}
        {activeTab === 'pieces' && (
          <div className="space-y-6">
            {/* Search and Filters Bar */}
            <div className="bg-white rounded-2xl p-4 border border-[#242326]/8 shadow-xs flex flex-col md:flex-row items-center gap-3 justify-between">
              {/* Search */}
              <div className="relative w-full md:w-80">
                <Search className="w-4 h-4 text-[#5C585E] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search brand, category, colour..."
                  className="w-full pl-9 pr-3.5 py-2 text-xs bg-[#F6F2EC] border border-transparent rounded-xl focus:bg-white focus:border-[#9C6A61] focus:outline-none transition-all"
                />
              </div>

              {/* Category Dropdown */}
              <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value as any)}
                  className="px-3 py-2 text-xs bg-[#F6F2EC] border border-[#242326]/10 rounded-xl capitalize focus:outline-none"
                >
                  <option value="all">All Categories</option>
                  <option value="tops">Tops & Blouses</option>
                  <option value="bottoms">Bottoms & Trousers</option>
                  <option value="dresses">Dresses</option>
                  <option value="outerwear">Outerwear & Blazers</option>
                  <option value="shoes">Shoes</option>
                  <option value="bags">Bags</option>
                  <option value="accessories">Accessories</option>
                </select>

                <select
                  value={selectedSeason}
                  onChange={(e) => setSelectedSeason(e.target.value as any)}
                  className="px-3 py-2 text-xs bg-[#F6F2EC] border border-[#242326]/10 rounded-xl capitalize focus:outline-none"
                >
                  <option value="all">All Seasons</option>
                  <option value="summer">Summer</option>
                  <option value="autumn">Autumn</option>
                  <option value="winter">Winter</option>
                  <option value="spring">Spring</option>
                </select>

                <button
                  onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                  className={`px-3 py-2 text-xs rounded-xl transition-colors cursor-pointer ${
                    showFavoritesOnly
                      ? 'bg-[#9C6A61] text-white font-medium'
                      : 'bg-[#F6F2EC] text-[#5C585E] hover:text-[#242326]'
                  }`}
                >
                  ★ Favorites
                </button>
              </div>
            </div>

            {/* Grid of Items */}
            {filteredItems.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-3xl border border-[#242326]/8 p-8">
                <Grid className="w-8 h-8 text-[#5C585E]/40 mx-auto mb-2" />
                <h3 className="font-serif text-base font-semibold text-[#242326]">
                  No clothing pieces match your filter
                </h3>
                <p className="text-xs text-[#5C585E] mt-1 max-w-sm mx-auto">
                  Try adjusting your search criteria or add new garments from your wardrobe.
                </p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('all');
                    setSelectedSeason('all');
                    setShowFavoritesOnly(false);
                  }}
                  className="mt-4 px-4 py-2 bg-[#9C6A61] text-white text-xs font-medium rounded-xl hover:bg-[#8A5B53] cursor-pointer"
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-5">
                {filteredItems.map((item) => (
                  <WardrobeItemCard
                    key={item.id}
                    item={item}
                    onInspect={(it) => setSelectedItemForDetail(it)}
                    onToggleFavorite={handleToggleFavoriteItem}
                    onAddToOutfit={(it) => {
                      setActiveTab('studio');
                      showToast(`Added ${it.name} to Studio canvas`);
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: Outfit Creator & Studio */}
        {activeTab === 'studio' && (
          <OutfitBuilderStudio
            wardrobeItems={items}
            onSaveOutfit={handleSaveOutfit}
            onSendToTryOn={onSendToTryOn}
            onAskStylist={onAskStylist}
          />
        )}

        {/* TAB 3: Saved Looks */}
        {activeTab === 'outfits' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#242326]">
                  Saved Wardrobe Ensembles ({outfits.length})
                </h2>
                <p className="text-xs text-[#5C585E] mt-0.5">
                  Pre-assembled outfit formulas ready to wear with one tap.
                </p>
              </div>
              <button
                onClick={() => setActiveTab('studio')}
                className="self-start sm:self-auto px-4 py-2 bg-[#9C6A61] hover:bg-[#8A5B53] text-white text-xs font-medium rounded-xl transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create New Combination</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {outfits.map((outfit) => (
                <WardrobeOutfitCard
                  key={outfit.id}
                  outfit={outfit}
                  wardrobeItems={items}
                  onSendToTryOn={onSendToTryOn}
                  onAskStylist={(o) =>
                    onAskStylist(
                      `I'm wearing my saved look "${o.title}" for a ${o.occasion} event. How can I adapt it with jewelry and outerwear?`
                    )
                  }
                  onToggleFavorite={handleToggleFavoriteOutfit}
                  onLogWear={handleLogWearOutfit}
                />
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: Event Planner */}
        {activeTab === 'planner' && (
          <EventPlannerView
            events={events}
            outfits={outfits}
            wardrobeItems={items}
            onAddEvent={handleAddEvent}
            onAssignOutfit={handleAssignOutfitToEvent}
            onAskStylist={onAskStylist}
            onSendToTryOn={onSendToTryOn}
          />
        )}

        {/* TAB 5: Wardrobe Gaps & Smart Shopping */}
        {activeTab === 'gaps' && (
          <WardrobeGapsView
            gaps={gaps}
            onShopGap={handleShopGap}
            onAskStylist={(gap) =>
              onAskStylist(
                `Tell me more about why a "${gap.title}" is recommended for my wardrobe. How does it unlock ${gap.outfitPotentialCount} new outfits?`
              )
            }
          />
        )}

        {/* TAB 6: Capsules */}
        {activeTab === 'capsules' && (
          <CapsuleCollectionsView
            capsules={capsules}
            wardrobeItems={items}
            onExploreCapsuleInStudio={(c) => {
              setActiveTab('studio');
              showToast(`Exploring "${c.title}" in Studio`);
            }}
            onAskStylistCapsule={(c) =>
              onAskStylist(
                `How can I adapt the "${c.title}" capsule wardrobe for South African seasonal weather and my silhouette?`
              )
            }
          />
        )}
      </main>

      {/* Item Detail Modal */}
      <WardrobeItemDetailModal
        item={selectedItemForDetail}
        isOpen={Boolean(selectedItemForDetail)}
        onClose={() => setSelectedItemForDetail(null)}
        allWardrobeItems={items}
        onLogWear={handleLogWearItem}
        onDelete={handleDeleteItem}
        onAddToOutfit={(it) => {
          setActiveTab('studio');
          showToast(`Added ${it.name} to Studio`);
        }}
        onAskStylist={onAskStylist}
      />

      {/* Add Item Modal */}
      <AddItemModal
        isOpen={isAddItemOpen}
        onClose={() => setIsAddItemOpen(false)}
        onSave={handleAddItem}
      />
    </div>
  );
};
