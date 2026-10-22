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
  deletePlannedEvent,
  getWardrobeGaps,
  getCapsuleCollections,
} from '../../services/wardrobeService';
import { AccountApiError } from '../../services/accountApi';
import type { AccountWardrobe } from '../../services/wardrobeAccount';
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
  accountStore?: AccountWardrobe | null;
}

export const WardrobeScreen: React.FC<WardrobeScreenProps> = ({
  onBack,
  onSendToTryOn,
  onSendToShop,
  onAskStylist,
  initialTab = 'pieces',
  accountStore = null,
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
  const [editingItem, setEditingItem] = useState<WardrobeItem | null>(null);
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [screenError, setScreenError] = useState<string | null>(null);
  const [loading, setLoading] = useState(Boolean(accountStore));

  const explain = (error: unknown): string => {
    if (error instanceof AccountApiError && error.status === 401) return 'Session expired.';
    if (error instanceof AccountApiError && error.message.toLowerCase().includes('image')) return 'Image upload failed.';
    return 'Unable to save. Please retry.';
  };

  const refreshAccount = async () => {
    if (!accountStore) return;
    const loaded = await accountStore.load();
    setItems(loaded.items);
    setOutfits(loaded.outfits);
    setEvents(loaded.events);
  };

  useEffect(() => {
    let cancelled = false;
    if (!accountStore) {
      setItems(getWardrobeItems());
      setOutfits(getWardrobeOutfits());
      setEvents(getPlannedEvents());
      setGaps(getWardrobeGaps());
      setLoading(false);
      return;
    }
    setLoading(true);
    void accountStore.load().then((loaded) => {
      if (cancelled) return;
      setItems(loaded.items);
      setOutfits(loaded.outfits);
      setEvents(loaded.events);
      setGaps(getWardrobeGaps());
      setScreenError(null);
    }).catch((error: unknown) => {
      if (!cancelled) setScreenError(explain(error));
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [accountStore]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleAddItem = async (newItem: Omit<WardrobeItem, 'id' | 'dateAdded' | 'timesWorn'> & { id?: string }, file?: File | null) => {
    if (accountStore) {
      const saved = await accountStore.saveItem(newItem, file);
      await refreshAccount();
      showToast(newItem.id ? `Saved changes to "${saved.name}"` : `Added "${saved.name}" to your Digital Wardrobe`);
      return;
    }
    const saved = saveWardrobeItem(newItem);
    setItems(getWardrobeItems());
    showToast(`Added "${saved.name}" to your Digital Wardrobe`);
  };

  const handleToggleFavoriteItem = (id: string) => {
    if (accountStore) {
      const item = items.find((entry) => entry.id === id);
      if (!item) return;
      void accountStore.updateItem({ ...item, isFavorite: !item.isFavorite }).then(() => refreshAccount()).catch((error: unknown) => setScreenError(explain(error)));
      return;
    }
    const updated = toggleFavoriteItem(id);
    setItems(updated);
  };

  const handleLogWearItem = (id: string) => {
    if (accountStore) {
      const item = items.find((entry) => entry.id === id);
      if (!item) return;
      void accountStore.updateItem({ ...item, timesWorn: item.timesWorn + 1, lastWornDate: 'Today' }).then(() => {
        return refreshAccount();
      }).then(() => showToast('Wear count logged for today')).catch((error: unknown) => setScreenError(explain(error)));
      return;
    }
    const updated = logItemWorn(id);
    setItems(updated);
    showToast('Wear count logged for today');
  };

  const handleDeleteItem = (id: string) => {
    if (accountStore) {
      void accountStore.deleteItem(id).then(() => refreshAccount()).then(() => showToast('Item removed from wardrobe')).catch((error: unknown) => setScreenError(explain(error)));
      return;
    }
    const updated = deleteWardrobeItem(id);
    setItems(updated);
    showToast('Item removed from wardrobe');
  };

  const handleSaveOutfit = (newOutfit: Omit<WardrobeOutfit, 'id' | 'dateCreated' | 'wearCount'>) => {
    if (accountStore) {
      setScreenError(null);
      void accountStore.saveOutfit(newOutfit).then(async (saved) => {
        await refreshAccount();
        setActiveTab('outfits');
        showToast(`Outfit saved successfully: "${saved.title}"`);
      }).catch((error: unknown) => setScreenError(explain(error)));
      return;
    }
    saveWardrobeOutfit(newOutfit);
    setOutfits(getWardrobeOutfits());
    setActiveTab('outfits');
    showToast(`Created outfit: "${newOutfit.title}"`);
  };

  const handleToggleFavoriteOutfit = (id: string) => {
    if (accountStore) {
      const outfit = outfits.find((entry) => entry.id === id);
      if (!outfit) return;
      void accountStore.updateOutfit({ ...outfit, isFavorite: !outfit.isFavorite }).then(() => refreshAccount()).catch((error: unknown) => setScreenError(explain(error)));
      return;
    }
    const updated = toggleFavoriteOutfit(id);
    setOutfits(updated);
  };

  const handleLogWearOutfit = (id: string) => {
    if (accountStore) {
      const outfit = outfits.find((entry) => entry.id === id);
      if (!outfit) return;
      void accountStore.updateOutfit({ ...outfit, wearCount: outfit.wearCount + 1, lastWornDate: 'Today' }).then(() => refreshAccount()).then(() => showToast('Outfit wear logged for today')).catch((error: unknown) => setScreenError(explain(error)));
      return;
    }
    const current = getWardrobeOutfits();
    const updated = current.map((o) =>
      o.id === id ? { ...o, wearCount: o.wearCount + 1, lastWornDate: 'Today' } : o
    );
    localStorage.setItem('mystyle_wardrobe_outfits_v1', JSON.stringify(updated));
    setOutfits(updated);
    showToast('Outfit wear logged for today');
  };

  const handleDeleteOutfit = (id: string) => {
    const outfit = outfits.find((entry) => entry.id === id);
    if (!outfit || !window.confirm(`Remove "${outfit.title}" from your saved outfits?`)) return;
    if (accountStore) {
      void accountStore.deleteOutfit(id).then(() => refreshAccount()).then(() => showToast('Outfit removed')).catch((error: unknown) => setScreenError(explain(error)));
      return;
    }
    setOutfits(deleteWardrobeOutfit(id));
    showToast('Outfit removed');
  };

  const handleRenameOutfit = (id: string) => {
    const outfit = outfits.find((entry) => entry.id === id);
    if (!outfit) return;
    const title = window.prompt('Outfit name', outfit.title);
    if (!title || !title.trim() || title.trim() === outfit.title) return;
    if (accountStore) {
      void accountStore.updateOutfit({ ...outfit, title: title.trim() }).then(() => refreshAccount()).then(() => showToast('Outfit saved successfully.')).catch((error: unknown) => setScreenError(explain(error)));
      return;
    }
    saveWardrobeOutfit({ ...outfit, id, title: title.trim() });
    setOutfits(getWardrobeOutfits());
  };

  const handleAddEvent = (event: Omit<PlannedEvent, 'id'>) => {
    if (accountStore) {
      void accountStore.saveEvent(event).then(() => refreshAccount()).then(() => showToast(`Added event "${event.title}" to planner`)).catch((error: unknown) => setScreenError(explain(error)));
      return;
    }
    savePlannedEvent(event);
    setEvents(getPlannedEvents());
    showToast(`Added event "${event.title}" to planner`);
  };

  const handleAssignOutfitToEvent = (eventId: string, outfitId: string) => {
    const event = events.find((e) => e.id === eventId);
    if (!event) return;
    if (accountStore) {
      void accountStore.saveEvent({ ...event, outfitId }).then(() => refreshAccount()).then(() => showToast('Assigned outfit to event')).catch((error: unknown) => setScreenError(explain(error)));
      return;
    }
    savePlannedEvent({ ...event, outfitId });
    setEvents(getPlannedEvents());
    showToast('Assigned outfit to event');
  };

  const handleRemoveEvent = (eventId: string) => {
    if (!window.confirm('Remove this planned outfit?')) return;
    if (accountStore) {
      void accountStore.deleteEvent(eventId).then(() => refreshAccount()).then(() => showToast('Planned outfit removed')).catch((error: unknown) => setScreenError(explain(error)));
      return;
    }
    setEvents(deletePlannedEvent(eventId));
    showToast('Planned outfit removed');
  };

  const handleUpdateEventDate = (eventId: string, date: string) => {
    const event = events.find((row) => row.id === eventId);
    if (!event) return;
    if (accountStore) {
      void accountStore.saveEvent({ ...event, date }).then(() => refreshAccount()).then(() => showToast('Plan date updated')).catch((error: unknown) => setScreenError(explain(error)));
      return;
    }
    savePlannedEvent({ ...event, date });
    setEvents(getPlannedEvents());
    showToast('Plan date updated');
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
              aria-label="Add Clothing Piece"
              className="px-3.5 py-2 bg-[#9C6A61] hover:bg-[#8A5B53] text-white text-xs font-medium rounded-xl transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Add Clothing Piece</span>
              <span className="sm:hidden">Add</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="w-full max-w-6xl mx-auto min-w-0 px-4 sm:px-6 flex items-center gap-2 overflow-x-auto no-scrollbar pb-3 pt-1">
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
        {loading && <p className="text-xs text-[#5C585E] mb-4">Loading your wardrobe.</p>}
        {screenError && <p className="text-xs text-[#9C6A61] mb-4">{screenError}</p>}
        {accountStore && <p className="text-[11px] text-[#5C585E] mb-4">Saved to your account. Demonstration wardrobe samples stay in this browser and are not imported.</p>}
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
                  {items.length === 0 ? 'Your wardrobe is empty.' : 'No clothing pieces match your filter'}
                </h3>
                <p className="text-xs text-[#5C585E] mt-1 max-w-sm mx-auto">
                  {items.length === 0 ? 'Add your first item.' : 'Try adjusting your search criteria or add new garments from your wardrobe.'}
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
                  onDelete={handleDeleteOutfit}
                  onRename={handleRenameOutfit}
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
            onRemoveEvent={handleRemoveEvent}
            onUpdateEventDate={handleUpdateEventDate}
            onAssignOutfit={handleAssignOutfitToEvent}
            onAskStylist={onAskStylist}
            onSendToTryOn={onSendToTryOn}
          />
        )}

        {/* TAB 5: Wardrobe Gaps & Smart Shopping */}
        {activeTab === 'gaps' && (
          <div className="space-y-4">
            <p className="text-xs text-[#5C585E]">These gap suggestions are a demonstration. They are not calculated from your saved wardrobe.</p>
          <WardrobeGapsView
            gaps={gaps}
            onShopGap={handleShopGap}
            onAskStylist={(gap) =>
              onAskStylist(
                `Tell me more about why a "${gap.title}" is recommended for my wardrobe. How does it unlock ${gap.outfitPotentialCount} new outfits?`
              )
            }
          />
          </div>
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
        onEdit={(item) => {
          setSelectedItemForDetail(null);
          setEditingItem(item);
          setIsAddItemOpen(true);
        }}
        onAddToOutfit={(it) => {
          setActiveTab('studio');
          showToast(`Added ${it.name} to Studio`);
        }}
        onAskStylist={onAskStylist}
      />

      {/* Add Item Modal */}
      <AddItemModal
        key={editingItem?.id ?? 'new-item'}
        isOpen={isAddItemOpen}
        initial={editingItem}
        uploadPhoto={accountStore ? async () => '' : undefined}
        onClose={() => {
          setIsAddItemOpen(false);
          setEditingItem(null);
        }}
        onSave={handleAddItem}
      />
    </div>
  );
};
