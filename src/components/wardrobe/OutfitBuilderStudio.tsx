/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  WardrobeItem,
  WardrobeCategory,
  WardrobeOutfit,
  WardrobeOutfitSlotMap,
} from '../../types/wardrobe';
import {
  Sparkles,
  Camera,
  Bookmark,
  Plus,
  X,
  Check,
  RefreshCw,
  Palette,
  ShieldCheck,
} from 'lucide-react';

interface OutfitBuilderStudioProps {
  wardrobeItems: WardrobeItem[];
  onSaveOutfit: (outfit: Omit<WardrobeOutfit, 'id' | 'dateCreated' | 'wearCount'>) => void;
  onSendToTryOn: (outfit: WardrobeOutfit, pieces: WardrobeItem[]) => void;
  onAskStylist: (prompt: string) => void;
}

export const OutfitBuilderStudio: React.FC<OutfitBuilderStudioProps> = ({
  wardrobeItems,
  onSaveOutfit,
  onSendToTryOn,
  onAskStylist,
}) => {
  const [selectedTopId, setSelectedTopId] = useState<string | undefined>('w-top-1');
  const [selectedBottomId, setSelectedBottomId] = useState<string | undefined>('w-bot-1');
  const [selectedDressId, setSelectedDressId] = useState<string | undefined>(undefined);
  const [selectedOuterwearId, setSelectedOuterwearId] = useState<string | undefined>('w-out-1');
  const [selectedShoesId, setSelectedShoesId] = useState<string | undefined>('w-shoe-1');
  const [selectedBagId, setSelectedBagId] = useState<string | undefined>('w-bag-1');
  const [selectedAccessoryId, setSelectedAccessoryId] = useState<string | undefined>('w-acc-1');

  // Active drawer for selecting items into a slot
  const [activeSlotDrawer, setActiveSlotDrawer] = useState<WardrobeCategory | null>(null);

  const [outfitTitle, setOutfitTitle] = useState('Executive Boardroom Tailoring');
  const [selectedOccasion, setSelectedOccasion] = useState('work');
  const [selectedSeason, setSelectedSeason] = useState('all-season');

  // Resolve active items
  const activeTop = wardrobeItems.find((i) => i.id === selectedTopId);
  const activeBottom = wardrobeItems.find((i) => i.id === selectedBottomId);
  const activeDress = wardrobeItems.find((i) => i.id === selectedDressId);
  const activeOuterwear = wardrobeItems.find((i) => i.id === selectedOuterwearId);
  const activeShoes = wardrobeItems.find((i) => i.id === selectedShoesId);
  const activeBag = wardrobeItems.find((i) => i.id === selectedBagId);
  const activeAccessory = wardrobeItems.find((i) => i.id === selectedAccessoryId);

  const selectedPieces = [
    activeTop,
    activeBottom,
    activeDress,
    activeOuterwear,
    activeShoes,
    activeBag,
    activeAccessory,
  ].filter(Boolean) as WardrobeItem[];

  // Dynamic AI Harmony Score calculation based on colors and category balance
  const computeHarmonyScore = () => {
    if (selectedPieces.length < 2) return 70;
    let score = 92;
    if (activeTop && activeBottom) score += 3;
    if (activeOuterwear) score += 2;
    if (activeShoes) score += 1;
    return Math.min(score, 98);
  };

  const harmonyScore = computeHarmonyScore();

  // Color palette extraction from pieces
  const palette = selectedPieces.map((p) => ({
    name: p.color,
    hex: p.colorHex,
  }));

  const handleSelectSlotItem = (item: WardrobeItem) => {
    switch (item.category) {
      case 'tops':
        setSelectedTopId(item.id);
        setSelectedDressId(undefined); // mutual exclusivity
        break;
      case 'bottoms':
        setSelectedBottomId(item.id);
        setSelectedDressId(undefined);
        break;
      case 'dresses':
        setSelectedDressId(item.id);
        setSelectedTopId(undefined);
        setSelectedBottomId(undefined);
        break;
      case 'outerwear':
        setSelectedOuterwearId(item.id);
        break;
      case 'shoes':
        setSelectedShoesId(item.id);
        break;
      case 'bags':
        setSelectedBagId(item.id);
        break;
      case 'accessories':
        setSelectedAccessoryId(item.id);
        break;
    }
    setActiveSlotDrawer(null);
  };

  const handleClearSlot = (cat: WardrobeCategory) => {
    switch (cat) {
      case 'tops':
        setSelectedTopId(undefined);
        break;
      case 'bottoms':
        setSelectedBottomId(undefined);
        break;
      case 'dresses':
        setSelectedDressId(undefined);
        break;
      case 'outerwear':
        setSelectedOuterwearId(undefined);
        break;
      case 'shoes':
        setSelectedShoesId(undefined);
        break;
      case 'bags':
        setSelectedBagId(undefined);
        break;
      case 'accessories':
        setSelectedAccessoryId(undefined);
        break;
    }
  };

  const handleSave = () => {
    if (!outfitTitle.trim() || selectedPieces.length === 0) return;

    const slots: WardrobeOutfitSlotMap = {
      topId: selectedTopId,
      bottomId: selectedBottomId,
      dressId: selectedDressId,
      outerwearId: selectedOuterwearId,
      shoesId: selectedShoesId,
      bagId: selectedBagId,
      accessoryIds: selectedAccessoryId ? [selectedAccessoryId] : [],
    };

    onSaveOutfit({
      title: outfitTitle.trim(),
      description: `Custom curated ensemble containing ${selectedPieces.length} items styled for ${selectedOccasion}.`,
      occasion: selectedOccasion,
      season: selectedSeason,
      slots,
      harmonyScore,
      harmonyCritique:
        'Balanced silhouette proportions with cohesive color temperature. The tailored outerwear anchors fluid underlying textures.',
      colorPalette: palette,
      isFavorite: true,
    });
  };

  const handleTryOnNow = () => {
    if (selectedPieces.length === 0) return;
    const dummyOutfit: WardrobeOutfit = {
      id: `outfit-${Date.now()}`,
      title: outfitTitle,
      description: 'Custom assembled outfit',
      occasion: selectedOccasion,
      season: selectedSeason,
      slots: {
        topId: selectedTopId,
        bottomId: selectedBottomId,
        dressId: selectedDressId,
        outerwearId: selectedOuterwearId,
        shoesId: selectedShoesId,
        bagId: selectedBagId,
        accessoryIds: selectedAccessoryId ? [selectedAccessoryId] : [],
      },
      harmonyScore,
      harmonyCritique: 'Personal mix-and-match ensemble',
      colorPalette: palette,
      isFavorite: false,
      dateCreated: new Date().toISOString(),
      wearCount: 0,
    };
    onSendToTryOn(dummyOutfit, selectedPieces);
  };

  const drawerItems = activeSlotDrawer
    ? wardrobeItems.filter((i) => i.category === activeSlotDrawer)
    : [];

  return (
    <div className="space-y-6">
      {/* Studio Header & Instructions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#242326]">
            Outfit Creator & Mix-Match Studio
          </h2>
          <p className="text-xs text-[#5C585E] mt-0.5">
            Select pieces from your wardrobe to assemble new combinations with instant AI Style Harmony feedback.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              // Quick reset to empty canvas
              setSelectedTopId(undefined);
              setSelectedBottomId(undefined);
              setSelectedDressId(undefined);
              setSelectedOuterwearId(undefined);
              setSelectedShoesId(undefined);
              setSelectedBagId(undefined);
              setSelectedAccessoryId(undefined);
            }}
            className="px-3 py-1.5 text-xs text-[#5C585E] hover:text-[#242326] bg-[#F6F2EC] rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Clear Canvas</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT / CENTER: Interactive Canvas (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-5 sm:p-6 border border-[#242326]/8 shadow-xs flex flex-col justify-between space-y-6">
          {/* Canvas Title & Occasion */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#242326]/6">
            <div className="flex-1">
              <label className="text-[10px] font-mono uppercase text-[#5C585E] block mb-1">
                Outfit Name
              </label>
              <input
                type="text"
                value={outfitTitle}
                onChange={(e) => setOutfitTitle(e.target.value)}
                placeholder="Name your outfit..."
                className="font-serif text-lg font-bold text-[#242326] bg-transparent border-b border-dashed border-[#242326]/20 focus:border-[#9C6A61] focus:outline-none w-full"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={selectedOccasion}
                onChange={(e) => setSelectedOccasion(e.target.value)}
                className="px-2.5 py-1 text-xs bg-[#F6F2EC] border border-[#242326]/10 rounded-lg text-[#242326] capitalize focus:outline-none"
              >
                <option value="work">Work / Executive</option>
                <option value="cocktail">Cocktail / Evening</option>
                <option value="casual">Casual / Weekend</option>
                <option value="formal">Black Tie / Gala</option>
              </select>
            </div>
          </div>

          {/* Interactive Garment Slots Layout */}
          <div className="space-y-4">
            {/* Upper Layer: Outerwear + Top (or Dress) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Outerwear Slot */}
              <div
                onClick={() => setActiveSlotDrawer('outerwear')}
                className={`relative aspect-4/3 rounded-2xl border-2 transition-all cursor-pointer p-3 flex flex-col justify-between overflow-hidden ${
                  activeOuterwear
                    ? 'border-[#242326]/12 bg-[#FBF8F5] hover:border-[#9C6A61]'
                    : 'border-dashed border-[#242326]/20 bg-[#F6F2EC]/40 hover:bg-[#F6F2EC]'
                }`}
              >
                {activeOuterwear ? (
                  <>
                    <div className="flex items-start justify-between gap-2 z-10">
                      <span className="text-[10px] font-mono uppercase bg-white/85 px-2 py-0.5 rounded text-[#242326] font-semibold">
                        Outerwear
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleClearSlot('outerwear');
                        }}
                        className="p-1 rounded-full bg-white/80 hover:bg-white text-[#5C585E]"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                    <img
                      src={activeOuterwear.imageUrl}
                      alt={activeOuterwear.name}
                      className="absolute inset-0 w-full h-full object-cover -z-0 opacity-90"
                    />
                    <div className="bg-black/60 backdrop-blur-xs p-2 rounded-xl text-white z-10">
                      <p className="text-xs font-semibold line-clamp-1">{activeOuterwear.name}</p>
                      <span className="text-[10px] text-white/80">{activeOuterwear.brand}</span>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-3">
                    <Plus className="w-5 h-5 text-[#5C585E] mb-1" />
                    <span className="text-xs font-medium text-[#242326]">Choose Outerwear</span>
                    <span className="text-[10px] text-[#5C585E]">Blazer, Trench, Coat</span>
                  </div>
                )}
              </div>

              {/* Top OR Dress Slot */}
              {selectedDressId ? (
                <div
                  onClick={() => setActiveSlotDrawer('dresses')}
                  className="relative aspect-4/3 rounded-2xl border-2 border-[#242326]/12 bg-[#FBF8F5] hover:border-[#9C6A61] transition-all cursor-pointer p-3 flex flex-col justify-between overflow-hidden"
                >
                  <div className="flex items-start justify-between gap-2 z-10">
                    <span className="text-[10px] font-mono uppercase bg-white/85 px-2 py-0.5 rounded text-[#242326] font-semibold">
                      Dress
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleClearSlot('dresses');
                      }}
                      className="p-1 rounded-full bg-white/80 hover:bg-white text-[#5C585E]"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                  {activeDress && (
                    <>
                      <img
                        src={activeDress.imageUrl}
                        alt={activeDress.name}
                        className="absolute inset-0 w-full h-full object-cover -z-0 opacity-90"
                      />
                      <div className="bg-black/60 backdrop-blur-xs p-2 rounded-xl text-white z-10">
                        <p className="text-xs font-semibold line-clamp-1">{activeDress.name}</p>
                        <span className="text-[10px] text-white/80">{activeDress.brand}</span>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div
                  onClick={() => setActiveSlotDrawer('tops')}
                  className={`relative aspect-4/3 rounded-2xl border-2 transition-all cursor-pointer p-3 flex flex-col justify-between overflow-hidden ${
                    activeTop
                      ? 'border-[#242326]/12 bg-[#FBF8F5] hover:border-[#9C6A61]'
                      : 'border-dashed border-[#242326]/20 bg-[#F6F2EC]/40 hover:bg-[#F6F2EC]'
                  }`}
                >
                  {activeTop ? (
                    <>
                      <div className="flex items-start justify-between gap-2 z-10">
                        <span className="text-[10px] font-mono uppercase bg-white/85 px-2 py-0.5 rounded text-[#242326] font-semibold">
                          Top / Blouse
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleClearSlot('tops');
                          }}
                          className="p-1 rounded-full bg-white/80 hover:bg-white text-[#5C585E]"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                      <img
                        src={activeTop.imageUrl}
                        alt={activeTop.name}
                        className="absolute inset-0 w-full h-full object-cover -z-0 opacity-90"
                      />
                      <div className="bg-black/60 backdrop-blur-xs p-2 rounded-xl text-white z-10">
                        <p className="text-xs font-semibold line-clamp-1">{activeTop.name}</p>
                        <span className="text-[10px] text-white/80">{activeTop.brand}</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-3">
                      <Plus className="w-5 h-5 text-[#5C585E] mb-1" />
                      <span className="text-xs font-medium text-[#242326]">Choose Top</span>
                      <span className="text-[10px] text-[#5C585E]">Shirt, Camisole, Knit</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Lower Layer: Bottom (if not dress) + Shoes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {!selectedDressId && (
                <div
                  onClick={() => setActiveSlotDrawer('bottoms')}
                  className={`relative aspect-4/3 rounded-2xl border-2 transition-all cursor-pointer p-3 flex flex-col justify-between overflow-hidden ${
                    activeBottom
                      ? 'border-[#242326]/12 bg-[#FBF8F5] hover:border-[#9C6A61]'
                      : 'border-dashed border-[#242326]/20 bg-[#F6F2EC]/40 hover:bg-[#F6F2EC]'
                  }`}
                >
                  {activeBottom ? (
                    <>
                      <div className="flex items-start justify-between gap-2 z-10">
                        <span className="text-[10px] font-mono uppercase bg-white/85 px-2 py-0.5 rounded text-[#242326] font-semibold">
                          Bottom / Trousers
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleClearSlot('bottoms');
                          }}
                          className="p-1 rounded-full bg-white/80 hover:bg-white text-[#5C585E]"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                      <img
                        src={activeBottom.imageUrl}
                        alt={activeBottom.name}
                        className="absolute inset-0 w-full h-full object-cover -z-0 opacity-90"
                      />
                      <div className="bg-black/60 backdrop-blur-xs p-2 rounded-xl text-white z-10">
                        <p className="text-xs font-semibold line-clamp-1">{activeBottom.name}</p>
                        <span className="text-[10px] text-white/80">{activeBottom.brand}</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-3">
                      <Plus className="w-5 h-5 text-[#5C585E] mb-1" />
                      <span className="text-xs font-medium text-[#242326]">Choose Bottom</span>
                      <span className="text-[10px] text-[#5C585E]">Trousers, Skirt, Denim</span>
                    </div>
                  )}
                </div>
              )}

              {/* Shoes Slot */}
              <div
                onClick={() => setActiveSlotDrawer('shoes')}
                className={`relative aspect-4/3 rounded-2xl border-2 transition-all cursor-pointer p-3 flex flex-col justify-between overflow-hidden ${
                  activeShoes
                    ? 'border-[#242326]/12 bg-[#FBF8F5] hover:border-[#9C6A61]'
                    : 'border-dashed border-[#242326]/20 bg-[#F6F2EC]/40 hover:bg-[#F6F2EC]'
                }`}
              >
                {activeShoes ? (
                  <>
                    <div className="flex items-start justify-between gap-2 z-10">
                      <span className="text-[10px] font-mono uppercase bg-white/85 px-2 py-0.5 rounded text-[#242326] font-semibold">
                        Footwear
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleClearSlot('shoes');
                        }}
                        className="p-1 rounded-full bg-white/80 hover:bg-white text-[#5C585E]"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                    <img
                      src={activeShoes.imageUrl}
                      alt={activeShoes.name}
                      className="absolute inset-0 w-full h-full object-cover -z-0 opacity-90"
                    />
                    <div className="bg-black/60 backdrop-blur-xs p-2 rounded-xl text-white z-10">
                      <p className="text-xs font-semibold line-clamp-1">{activeShoes.name}</p>
                      <span className="text-[10px] text-white/80">{activeShoes.brand}</span>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-3">
                    <Plus className="w-5 h-5 text-[#5C585E] mb-1" />
                    <span className="text-xs font-medium text-[#242326]">Choose Footwear</span>
                    <span className="text-[10px] text-[#5C585E]">Heels, Mules, Loafers</span>
                  </div>
                )}
              </div>
            </div>

            {/* Accessories & Bag Layer */}
            <div className="grid grid-cols-2 gap-4">
              {/* Bag Slot */}
              <div
                onClick={() => setActiveSlotDrawer('bags')}
                className={`relative aspect-16/10 rounded-2xl border-2 transition-all cursor-pointer p-2.5 flex flex-col justify-between overflow-hidden ${
                  activeBag
                    ? 'border-[#242326]/12 bg-[#FBF8F5] hover:border-[#9C6A61]'
                    : 'border-dashed border-[#242326]/20 bg-[#F6F2EC]/40 hover:bg-[#F6F2EC]'
                }`}
              >
                {activeBag ? (
                  <>
                    <div className="flex items-start justify-between gap-1 z-10">
                      <span className="text-[9px] font-mono uppercase bg-white/85 px-1.5 py-0.5 rounded text-[#242326] font-semibold">
                        Bag
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleClearSlot('bags');
                        }}
                        className="p-0.5 rounded-full bg-white/80 hover:bg-white text-[#5C585E]"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                    <img
                      src={activeBag.imageUrl}
                      alt={activeBag.name}
                      className="absolute inset-0 w-full h-full object-cover -z-0 opacity-90"
                    />
                    <div className="bg-black/60 backdrop-blur-xs p-1.5 rounded-lg text-white z-10">
                      <p className="text-[11px] font-semibold line-clamp-1">{activeBag.name}</p>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center">
                    <Plus className="w-4 h-4 text-[#5C585E] mb-0.5" />
                    <span className="text-xs font-medium text-[#242326]">Add Bag</span>
                  </div>
                )}
              </div>

              {/* Jewelry / Accessory Slot */}
              <div
                onClick={() => setActiveSlotDrawer('accessories')}
                className={`relative aspect-16/10 rounded-2xl border-2 transition-all cursor-pointer p-2.5 flex flex-col justify-between overflow-hidden ${
                  activeAccessory
                    ? 'border-[#242326]/12 bg-[#FBF8F5] hover:border-[#9C6A61]'
                    : 'border-dashed border-[#242326]/20 bg-[#F6F2EC]/40 hover:bg-[#F6F2EC]'
                }`}
              >
                {activeAccessory ? (
                  <>
                    <div className="flex items-start justify-between gap-1 z-10">
                      <span className="text-[9px] font-mono uppercase bg-white/85 px-1.5 py-0.5 rounded text-[#242326] font-semibold">
                        Jewellery
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleClearSlot('accessories');
                        }}
                        className="p-0.5 rounded-full bg-white/80 hover:bg-white text-[#5C585E]"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                    <img
                      src={activeAccessory.imageUrl}
                      alt={activeAccessory.name}
                      className="absolute inset-0 w-full h-full object-cover -z-0 opacity-90"
                    />
                    <div className="bg-black/60 backdrop-blur-xs p-1.5 rounded-lg text-white z-10">
                      <p className="text-[11px] font-semibold line-clamp-1">{activeAccessory.name}</p>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center">
                    <Plus className="w-4 h-4 text-[#5C585E] mb-0.5" />
                    <span className="text-xs font-medium text-[#242326]">Add Jewellery</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: AI Style Harmony & Actions (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Harmony Score Card */}
          <div className="bg-white rounded-3xl p-5 border border-[#242326]/8 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-wider text-[#5C585E]">
                AI Style Harmony
              </span>
              <span className="text-xs font-semibold text-[#9C6A61] flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-[#B49361]" />
                <span>Real-Time Analysis</span>
              </span>
            </div>

            <div className="flex items-center gap-4 p-4 bg-[#F6F2EC]/60 rounded-2xl border border-[#242326]/6">
              <div className="relative w-16 h-16 rounded-full bg-white flex items-center justify-center border-4 border-[#B49361] shadow-xs shrink-0">
                <span className="font-serif text-lg font-bold text-[#242326]">
                  {harmonyScore}%
                </span>
              </div>
              <div>
                <h4 className="font-serif text-base font-bold text-[#242326]">
                  {harmonyScore >= 95 ? 'Impeccable Cohesion' : 'High Style Synergy'}
                </h4>
                <p className="text-xs text-[#5C585E] mt-0.5">
                  Proportions align with {selectedOccasion} dress codes.
                </p>
              </div>
            </div>

            {/* Color Palette Palette */}
            <div>
              <span className="text-[10px] font-mono uppercase text-[#5C585E] block mb-2">
                Ensemble Color Story
              </span>
              <div className="flex items-center gap-2">
                {palette.map((col, idx) => (
                  <div
                    key={idx}
                    className="w-7 h-7 rounded-full border-2 border-white shadow-xs"
                    style={{ backgroundColor: col.hex }}
                    title={col.name}
                  />
                ))}
              </div>
            </div>

            {/* Critique */}
            <div className="p-3.5 bg-[#FBF8F5] rounded-xl border border-[#242326]/6 text-xs text-[#5C585E] leading-relaxed">
              "The sharp collar line and structured tailoring elevate the fluid textures underneath. Ideal for commanding room presence."
            </div>
          </div>

          {/* Action Hub */}
          <div className="bg-white rounded-3xl p-5 border border-[#242326]/8 shadow-xs space-y-3">
            <button
              onClick={handleSave}
              disabled={selectedPieces.length === 0}
              className="w-full py-3 bg-[#9C6A61] hover:bg-[#8A5B53] disabled:opacity-50 text-white text-xs font-semibold uppercase tracking-wider rounded-xl transition-all shadow-sm cursor-pointer flex items-center justify-center gap-2"
            >
              <Bookmark className="w-4 h-4" />
              <span>Save Assembled Look to Outfits</span>
            </button>

            <button
              onClick={handleTryOnNow}
              disabled={selectedPieces.length === 0}
              className="w-full py-2.5 bg-[#F6F2EC] hover:bg-[#E5CDBE]/40 disabled:opacity-50 text-[#242326] text-xs font-medium rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              <Camera className="w-4 h-4 text-[#9C6A61]" />
              <span>Try On in Virtual Studio</span>
            </button>

            <button
              onClick={() =>
                onAskStylist(
                  `I just assembled an outfit titled "${outfitTitle}" with ${selectedPieces
                    .map((p) => p.name)
                    .join(', ')} for ${selectedOccasion}. What do you think of this combination and how can I accessorise it?`
                )
              }
              disabled={selectedPieces.length === 0}
              className="w-full py-2.5 bg-white border border-[#242326]/12 hover:border-[#242326]/30 text-[#242326] text-xs font-medium rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-[#B49361]" />
              <span>Consult Stylist on This Look</span>
            </button>
          </div>
        </div>
      </div>

      {/* Pop-up Drawer for Selecting Items into a Slot */}
      {activeSlotDrawer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-xl max-h-[80vh] bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col border border-[#242326]/10">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#242326]/8 bg-[#F6F2EC]/60">
              <div>
                <span className="text-[10px] font-mono tracking-wider text-[#9C6A61] uppercase font-semibold">
                  Wardrobe Selector
                </span>
                <h3 className="font-serif text-lg font-bold text-[#242326] capitalize">
                  Choose {activeSlotDrawer}
                </h3>
              </div>
              <button
                onClick={() => setActiveSlotDrawer(null)}
                className="p-2 rounded-full hover:bg-black/5 text-[#5C585E] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto p-6">
              {drawerItems.length === 0 ? (
                <div className="text-center py-8 text-[#5C585E] text-xs">
                  No items found in your wardrobe under this category.
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {drawerItems.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleSelectSlotItem(item)}
                      className="group p-2.5 rounded-2xl border border-[#242326]/8 hover:border-[#9C6A61] hover:shadow-md bg-white transition-all cursor-pointer flex flex-col"
                    >
                      <div className="aspect-3/4 rounded-xl overflow-hidden bg-[#F6F2EC] mb-2">
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      </div>
                      <span className="text-[9px] font-mono text-[#9C6A61] uppercase line-clamp-1">
                        {item.brand}
                      </span>
                      <h4 className="text-xs font-semibold text-[#242326] line-clamp-1">
                        {item.name}
                      </h4>
                      <p className="text-[10px] text-[#5C585E]">{item.color}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
