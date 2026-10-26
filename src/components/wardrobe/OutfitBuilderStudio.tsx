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
  RefreshCw,
} from 'lucide-react';

type OutfitBase = 'separates' | 'dress';

interface OutfitBuilderStudioProps {
  wardrobeItems: WardrobeItem[];
  onSaveOutfit: (outfit: Omit<WardrobeOutfit, 'id' | 'dateCreated' | 'wearCount'>) => void;
  onSendToTryOn: (outfit: WardrobeOutfit, pieces: WardrobeItem[]) => void;
  onAskStylist: (prompt: string) => void;
}

function SlotTile({
  label,
  hint,
  item,
  optional,
  onOpen,
  onClear,
}: {
  label: string;
  hint: string;
  item?: WardrobeItem;
  optional?: boolean;
  onOpen: () => void;
  onClear: () => void;
}) {
  return (
    <div
      onClick={onOpen}
      className={`relative aspect-4/3 rounded-2xl border-2 transition-all cursor-pointer p-3 flex flex-col justify-between overflow-hidden ${
        item
          ? 'border-[#242326]/12 bg-[#FBF8F5] hover:border-[#9C6A61]'
          : 'border-dashed border-[#242326]/20 bg-[#F6F2EC]/40 hover:bg-[#F6F2EC]'
      }`}
    >
      {item ? (
        <>
          <div className="flex items-start justify-between gap-2 z-10">
            <span className="text-[10px] font-mono uppercase bg-white/85 px-2 py-0.5 rounded text-[#242326] font-semibold">
              {label}
              {optional ? ' · optional' : ''}
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onClear();
              }}
              className="p-1 rounded-full bg-white/80 hover:bg-white text-[#5C585E] cursor-pointer"
              aria-label={`Remove ${label}`}
            >
              <X className="w-3 h-3" />
            </button>
          </div>
          <img
            src={item.imageUrl}
            alt={item.name}
            className="absolute inset-0 w-full h-full object-cover -z-0 opacity-90"
          />
          <div className="bg-black/60 backdrop-blur-xs p-2 rounded-xl text-white z-10">
            <p className="text-xs font-semibold line-clamp-1">{item.name}</p>
            <span className="text-[10px] text-white/80">{item.brand}</span>
          </div>
        </>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-3">
          <Plus className="w-5 h-5 text-[#5C585E] mb-1" />
          <span className="text-xs font-medium text-[#242326]">
            {optional ? `Add ${label}` : `Choose ${label}`}
          </span>
          <span className="text-[10px] text-[#5C585E]">{hint}</span>
        </div>
      )}
    </div>
  );
}

export const OutfitBuilderStudio: React.FC<OutfitBuilderStudioProps> = ({
  wardrobeItems,
  onSaveOutfit,
  onSendToTryOn,
  onAskStylist,
}) => {
  const [base, setBase] = useState<OutfitBase>('separates');
  const [selectedTopId, setSelectedTopId] = useState<string | undefined>();
  const [selectedBottomId, setSelectedBottomId] = useState<string | undefined>();
  const [selectedDressId, setSelectedDressId] = useState<string | undefined>();
  const [selectedOuterwearId, setSelectedOuterwearId] = useState<string | undefined>();
  const [selectedShoesId, setSelectedShoesId] = useState<string | undefined>();
  const [selectedBagId, setSelectedBagId] = useState<string | undefined>();
  const [selectedAccessoryId, setSelectedAccessoryId] = useState<string | undefined>();
  const [activeSlotDrawer, setActiveSlotDrawer] = useState<WardrobeCategory | null>(null);
  const [outfitTitle, setOutfitTitle] = useState('');
  const [selectedOccasion, setSelectedOccasion] = useState('work');
  const [selectedSeason] = useState('all-season');

  const activeTop = wardrobeItems.find((i) => i.id === selectedTopId);
  const activeBottom = wardrobeItems.find((i) => i.id === selectedBottomId);
  const activeDress = wardrobeItems.find((i) => i.id === selectedDressId);
  const activeOuterwear = wardrobeItems.find((i) => i.id === selectedOuterwearId);
  const activeShoes = wardrobeItems.find((i) => i.id === selectedShoesId);
  const activeBag = wardrobeItems.find((i) => i.id === selectedBagId);
  const activeAccessory = wardrobeItems.find((i) => i.id === selectedAccessoryId);

  const corePieces = (
    base === 'dress'
      ? [activeDress, activeBottom]
      : [activeTop, activeBottom]
  ).filter(Boolean) as WardrobeItem[];

  const selectedPieces = [
    ...corePieces,
    activeOuterwear,
    activeShoes,
    activeBag,
    activeAccessory,
  ].filter(Boolean) as WardrobeItem[];

  const hasCore =
    base === 'dress'
      ? Boolean(activeDress)
      : Boolean(activeTop && activeBottom);

  const computeHarmonyScore = () => {
    if (!hasCore) return selectedPieces.length ? 68 : 55;
    let score = 88;
    if (base === 'separates' && activeTop && activeBottom) score += 4;
    if (base === 'dress' && activeDress) score += 4;
    if (base === 'dress' && activeBottom) score += 1;
    if (activeOuterwear) score += 2;
    if (activeShoes) score += 2;
    if (activeBag || activeAccessory) score += 1;
    return Math.min(score, 98);
  };

  const harmonyScore = computeHarmonyScore();
  const palette = selectedPieces.map((p) => ({ name: p.color, hex: p.colorHex }));

  const switchBase = (next: OutfitBase) => {
    setBase(next);
    if (next === 'dress') {
      setSelectedTopId(undefined);
    } else {
      setSelectedDressId(undefined);
    }
  };

  const handleSelectSlotItem = (item: WardrobeItem) => {
    switch (item.category) {
      case 'tops':
        setBase('separates');
        setSelectedTopId(item.id);
        setSelectedDressId(undefined);
        break;
      case 'bottoms':
        setSelectedBottomId(item.id);
        if (base !== 'dress') setSelectedDressId(undefined);
        break;
      case 'dresses':
        setBase('dress');
        setSelectedDressId(item.id);
        setSelectedTopId(undefined);
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

  const ownedSlot = (id?: string) => (id && wardrobeItems.some((item) => item.id === id) ? id : undefined);

  const buildSlots = (): WardrobeOutfitSlotMap => {
    const accessoryId = ownedSlot(selectedAccessoryId);
    if (base === 'dress') {
      return {
        dressId: ownedSlot(selectedDressId),
        bottomId: ownedSlot(selectedBottomId),
        outerwearId: ownedSlot(selectedOuterwearId),
        shoesId: ownedSlot(selectedShoesId),
        bagId: ownedSlot(selectedBagId),
        accessoryIds: accessoryId ? [accessoryId] : [],
      };
    }
    return {
      topId: ownedSlot(selectedTopId),
      bottomId: ownedSlot(selectedBottomId),
      outerwearId: ownedSlot(selectedOuterwearId),
      shoesId: ownedSlot(selectedShoesId),
      bagId: ownedSlot(selectedBagId),
      accessoryIds: accessoryId ? [accessoryId] : [],
    };
  };

  const handleSave = () => {
    if (!outfitTitle.trim() || !hasCore) return;
    const slots = buildSlots();
    onSaveOutfit({
      title: outfitTitle.trim(),
      description:
        base === 'dress'
          ? `Dress-based look${activeBottom ? ' with layered bottom' : ''} styled for ${selectedOccasion}.`
          : `Top and bottoms ensemble styled for ${selectedOccasion}.`,
      occasion: selectedOccasion,
      season: selectedSeason,
      slots,
      harmonyScore,
      harmonyCritique:
        base === 'dress'
          ? 'Dress foundation with balanced optional layers for proportion and polish.'
          : 'Top and bottoms foundation with cohesive colour temperature and silhouette balance.',
      colorPalette: palette,
      isFavorite: true,
    });
  };

  const handleTryOnNow = () => {
    if (!hasCore) return;
    const dummyOutfit: WardrobeOutfit = {
      id: `outfit-${Date.now()}`,
      title: outfitTitle.trim() || 'Untitled outfit',
      description: 'Custom assembled outfit',
      occasion: selectedOccasion,
      season: selectedSeason,
      slots: buildSlots(),
      harmonyScore,
      harmonyCritique: 'Personal mix-and-match ensemble',
      colorPalette: palette,
      isFavorite: false,
      dateCreated: new Date().toISOString(),
      wearCount: 0,
    };
    onSendToTryOn(dummyOutfit, selectedPieces);
  };

  const clearCanvas = () => {
    setSelectedTopId(undefined);
    setSelectedBottomId(undefined);
    setSelectedDressId(undefined);
    setSelectedOuterwearId(undefined);
    setSelectedShoesId(undefined);
    setSelectedBagId(undefined);
    setSelectedAccessoryId(undefined);
  };

  const drawerItems = activeSlotDrawer
    ? wardrobeItems.filter((i) => i.category === activeSlotDrawer)
    : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#242326]">
            Outfit Creator & Mix-Match Studio
          </h2>
          <p className="text-xs text-[#5C585E] mt-0.5">
            Build from a top and bottoms, or a dress — then layer optional pieces.
          </p>
        </div>

        <button
          type="button"
          onClick={clearCanvas}
          className="px-3 py-1.5 text-xs text-[#5C585E] hover:text-[#242326] bg-[#F6F2EC] rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Clear Canvas</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-white rounded-3xl p-5 sm:p-6 border border-[#242326]/8 shadow-xs flex flex-col justify-between space-y-6">
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

          <div className="space-y-2">
            <p className="text-[10px] font-mono uppercase tracking-wider text-[#5C585E]">
              Outfit foundation
            </p>
            <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-[#F6F2EC]/80 border border-[#242326]/8">
              <button
                type="button"
                onClick={() => switchBase('separates')}
                className={`px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                  base === 'separates'
                    ? 'bg-white text-[#242326] shadow-xs border border-[#242326]/10'
                    : 'text-[#5C585E] hover:text-[#242326]'
                }`}
              >
                Top &amp; bottoms
              </button>
              <button
                type="button"
                onClick={() => switchBase('dress')}
                className={`px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                  base === 'dress'
                    ? 'bg-white text-[#242326] shadow-xs border border-[#242326]/10'
                    : 'text-[#5C585E] hover:text-[#242326]'
                }`}
              >
                Dress
              </button>
            </div>
            <p className="text-[11px] text-[#5C585E] leading-relaxed">
              {base === 'separates'
                ? 'Choose a top and a bottom. Outerwear, shoes, bag, and jewellery are optional.'
                : 'Choose a dress as the base. You can optionally add a bottom for layering, plus outerwear and accessories.'}
            </p>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {base === 'separates' ? (
                <>
                  <SlotTile
                    label="Top"
                    hint="Shirt, blouse, knit, camisole"
                    item={activeTop}
                    onOpen={() => setActiveSlotDrawer('tops')}
                    onClear={() => setSelectedTopId(undefined)}
                  />
                  <SlotTile
                    label="Bottom"
                    hint="Trousers, skirt, denim"
                    item={activeBottom}
                    onOpen={() => setActiveSlotDrawer('bottoms')}
                    onClear={() => setSelectedBottomId(undefined)}
                  />
                </>
              ) : (
                <>
                  <SlotTile
                    label="Dress"
                    hint="Day dress, midi, jumpsuit one-piece"
                    item={activeDress}
                    onOpen={() => setActiveSlotDrawer('dresses')}
                    onClear={() => setSelectedDressId(undefined)}
                  />
                  <SlotTile
                    label="Bottom"
                    hint="Optional layer — skirt, shorts, trousers"
                    item={activeBottom}
                    optional
                    onOpen={() => setActiveSlotDrawer('bottoms')}
                    onClear={() => setSelectedBottomId(undefined)}
                  />
                </>
              )}
            </div>

            <div>
              <p className="text-[10px] font-mono uppercase tracking-wider text-[#5C585E] mb-2">
                Optional layers
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <SlotTile
                  label="Outerwear"
                  hint="Blazer, trench, coat"
                  item={activeOuterwear}
                  optional
                  onOpen={() => setActiveSlotDrawer('outerwear')}
                  onClear={() => setSelectedOuterwearId(undefined)}
                />
                <SlotTile
                  label="Footwear"
                  hint="Heels, mules, loafers"
                  item={activeShoes}
                  optional
                  onOpen={() => setActiveSlotDrawer('shoes')}
                  onClear={() => setSelectedShoesId(undefined)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <SlotTile
                label="Bag"
                hint="Tote, clutch, crossbody"
                item={activeBag}
                optional
                onOpen={() => setActiveSlotDrawer('bags')}
                onClear={() => setSelectedBagId(undefined)}
              />
              <SlotTile
                label="Jewellery"
                hint="Earrings, necklace, belt"
                item={activeAccessory}
                optional
                onOpen={() => setActiveSlotDrawer('accessories')}
                onClear={() => setSelectedAccessoryId(undefined)}
              />
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 space-y-5">
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
                  {!hasCore
                    ? base === 'dress'
                      ? 'Add a dress to start'
                      : 'Add a top and bottom'
                    : harmonyScore >= 95
                      ? 'Impeccable Cohesion'
                      : 'High Style Synergy'}
                </h4>
                <p className="text-xs text-[#5C585E] mt-0.5">
                  {base === 'dress' ? 'Dress-based' : 'Separates'} look for {selectedOccasion}.
                </p>
              </div>
            </div>

            {palette.length > 0 && (
              <div>
                <span className="text-[10px] font-mono uppercase text-[#5C585E] block mb-2">
                  Ensemble Color Story
                </span>
                <div className="flex items-center gap-2">
                  {palette.map((col, idx) => (
                    <div
                      key={`${col.hex}-${idx}`}
                      className="w-7 h-7 rounded-full border-2 border-white shadow-xs"
                      style={{ backgroundColor: col.hex }}
                      title={col.name}
                    />
                  ))}
                </div>
              </div>
            )}

            <div className="p-3.5 bg-[#FBF8F5] rounded-xl border border-[#242326]/6 text-xs text-[#5C585E] leading-relaxed">
              {base === 'dress'
                ? 'Start with the dress silhouette, then layer a bottom only if you want extra coverage or contrast. Outerwear and accessories finish the proportion.'
                : 'A top and bottom set the silhouette. Outerwear, footwear, and accessories are optional polish — not required to save the look.'}
            </div>
          </div>

          <div className="bg-white rounded-3xl p-5 border border-[#242326]/8 shadow-xs space-y-3">
            {!hasCore && (
              <p className="text-[11px] text-[#9C6A61] text-center">
                {base === 'dress'
                  ? 'Select a dress before saving.'
                  : 'Select both a top and a bottom before saving.'}
              </p>
            )}
            <button
              type="button"
              onClick={handleSave}
              disabled={!hasCore || !outfitTitle.trim()}
              className="w-full py-3 bg-[#9C6A61] hover:bg-[#8A5B53] disabled:opacity-50 text-white text-xs font-semibold uppercase tracking-wider rounded-xl transition-all shadow-sm cursor-pointer flex items-center justify-center gap-2"
            >
              <Bookmark className="w-4 h-4" />
              <span>Save Assembled Look to Outfits</span>
            </button>

            <button
              type="button"
              onClick={handleTryOnNow}
              disabled={!hasCore}
              className="w-full py-2.5 bg-[#F6F2EC] hover:bg-[#E5CDBE]/40 disabled:opacity-50 text-[#242326] text-xs font-medium rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              <Camera className="w-4 h-4 text-[#9C6A61]" />
              <span>Try On in Virtual Studio</span>
            </button>

            <button
              type="button"
              onClick={() =>
                onAskStylist(
                  `I assembled a ${base === 'dress' ? 'dress-based' : 'top and bottoms'} outfit titled "${outfitTitle || 'Untitled'}" with ${selectedPieces
                    .map((p) => p.name)
                    .join(', ')} for ${selectedOccasion}. What do you think and how should I accessorise it?`,
                )
              }
              disabled={!hasCore}
              className="w-full py-2.5 bg-white border border-[#242326]/12 hover:border-[#242326]/30 text-[#242326] text-xs font-medium rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-[#B49361]" />
              <span>Consult Stylist on This Look</span>
            </button>
          </div>
        </div>
      </div>

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
                type="button"
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
                    <button
                      type="button"
                      key={item.id}
                      onClick={() => handleSelectSlotItem(item)}
                      className="group p-2.5 rounded-2xl border border-[#242326]/8 hover:border-[#9C6A61] hover:shadow-md bg-white transition-all cursor-pointer flex flex-col text-left"
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
                    </button>
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
