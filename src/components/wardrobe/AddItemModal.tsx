/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  WardrobeCategory,
  WardrobeSeason,
  WardrobeOccasion,
  WardrobeItem,
} from '../../types/wardrobe';
import { X, Plus, Check } from 'lucide-react';
import turtleneckImg from '../../assets/images/fashion_weekend_casual_1791978401075.jpg';
import skirtImg from '../../assets/images/fashion_date_night_1791978397788.jpg';
import blazerImg from '../../assets/images/fashion_work_office_1791978399975.jpg';
import gownImg from '../../assets/images/fashion_special_gala_1791978474099.jpg';
import loafersImg from '../../assets/images/style_classic_tailored_1791980329558.jpg';

interface AddItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  initial?: WardrobeItem | null;
  uploadPhoto?: (file: File) => Promise<string>;
  onSave: (item: Omit<WardrobeItem, 'id' | 'dateAdded' | 'timesWorn'> & { id?: string }, file?: File | null) => Promise<void> | void;
}

// Preset demonstration garments — local assets so populate works without external image hosts.
const PRESET_GARMENT_PHOTOS = [
  {
    name: 'Fine Gauge Merino Turtleneck',
    category: 'tops' as WardrobeCategory,
    subcategory: 'Knitwear',
    brand: 'Woolworths Classic',
    color: 'Ivory Cream',
    colorHex: '#F3EFE6',
    seasons: ['autumn', 'winter', 'spring'] as WardrobeSeason[],
    occasions: ['work', 'casual'] as WardrobeOccasion[],
    imageUrl: turtleneckImg,
    fabric: '100% Merino Wool',
  },
  {
    name: 'Pleated A-Line Satin Skirt',
    category: 'bottoms' as WardrobeCategory,
    subcategory: 'Skirt',
    brand: 'Country Road',
    color: 'Terracotta Rust',
    colorHex: '#B85848',
    seasons: ['all-season', 'autumn'] as WardrobeSeason[],
    occasions: ['cocktail', 'evening', 'work'] as WardrobeOccasion[],
    imageUrl: skirtImg,
    fabric: 'Fluid Satin Twill',
  },
  {
    name: 'Structured Double-Breasted Wool Blazer',
    category: 'outerwear' as WardrobeCategory,
    subcategory: 'Blazer',
    brand: 'Studio W',
    color: 'Chocolate Espresso',
    colorHex: '#38281F',
    seasons: ['autumn', 'winter', 'all-season'] as WardrobeSeason[],
    occasions: ['work', 'cocktail'] as WardrobeOccasion[],
    imageUrl: blazerImg,
    fabric: 'Wool Suiting Crepe',
  },
  {
    name: 'Draped Asymmetric Column Gown',
    category: 'dresses' as WardrobeCategory,
    subcategory: 'Evening Dress',
    brand: 'Poetry Stores',
    color: 'Deep Plum Wine',
    colorHex: '#4C1D2A',
    seasons: ['all-season', 'winter'] as WardrobeSeason[],
    occasions: ['evening', 'formal'] as WardrobeOccasion[],
    imageUrl: gownImg,
    fabric: 'Silk Georgette',
  },
  {
    name: 'Italian Leather Penny Loafers',
    category: 'shoes' as WardrobeCategory,
    subcategory: 'Loafers',
    brand: 'Trenery',
    color: 'Burnished Tan',
    colorHex: '#7C4623',
    seasons: ['all-season'] as WardrobeSeason[],
    occasions: ['work', 'weekend'] as WardrobeOccasion[],
    imageUrl: loafersImg,
    fabric: 'Calfskin Leather',
  },
];

const COLOR_SWATCH_PRESETS = [
  { name: 'Pure White', hex: '#FFFFFF', border: true },
  { name: 'Ivory Cream', hex: '#F5F2EB', border: true },
  { name: 'Warm Ivory', hex: '#F6F2EC', border: true },
  { name: 'Soft Blush', hex: '#E5CDBE', border: false },
  { name: 'Oatmeal Natural', hex: '#D6C9B6', border: false },
  { name: 'Sand Stone', hex: '#C8B8A8', border: false },
  { name: 'Camel Tan', hex: '#9E7453', border: false },
  { name: 'Camel / Tan', hex: '#C49A6C', border: false },
  { name: 'Burnished Tan', hex: '#7C4623', border: false },
  { name: 'Terracotta Rust', hex: '#B85848', border: false },
  { name: 'Muted Rose', hex: '#9C6A61', border: false },
  { name: 'Soft Coral', hex: '#D9896C', border: false },
  { name: 'Burgundy Wine', hex: '#5E1914', border: false },
  { name: 'Deep Plum Wine', hex: '#4C1D2A', border: false },
  { name: 'Forest Pine', hex: '#253B30', border: false },
  { name: 'Forest Emerald', hex: '#1B382B', border: false },
  { name: 'Deep Olive', hex: '#4B5320', border: false },
  { name: 'Sage Soft', hex: '#8A9A84', border: false },
  { name: 'Navy Midnight', hex: '#1D2A44', border: false },
  { name: 'Navy Blue', hex: '#1B263B', border: false },
  { name: 'Slate Blue', hex: '#4E6B8A', border: false },
  { name: 'Charcoal Grey', hex: '#242326', border: false },
  { name: 'Onyx Black', hex: '#1E1D20', border: false },
  { name: 'Rich Chocolate', hex: '#3E2723', border: false },
  { name: 'Chocolate Espresso', hex: '#38281F', border: false },
  { name: 'Gold Champagne', hex: '#CCA762', border: false },
  { name: 'Soft Gold', hex: '#B49361', border: false },
  { name: 'Silver Mist', hex: '#B9AFA1', border: false },
];

type ColourSwatch = { name: string; hex: string };

function parseInitialColours(initial?: WardrobeItem | null): ColourSwatch[] {
  if (!initial) return [{ name: 'Ivory Cream', hex: '#F5F2EB' }];
  const names = initial.color.split(',').map((part) => part.trim()).filter(Boolean);
  if (names.length === 0) return [{ name: 'Ivory Cream', hex: initial.colorHex || '#F5F2EB' }];
  return names.map((name, index) => {
    const preset = COLOR_SWATCH_PRESETS.find((swatch) => swatch.name.toLowerCase() === name.toLowerCase());
    return {
      name,
      hex: index === 0 ? (initial.colorHex || preset?.hex || '#F5F2EB') : (preset?.hex || initial.colorHex || '#F5F2EB'),
    };
  });
}

function needsLightCheck(hex: string): boolean {
  const value = hex.replace('#', '');
  if (value.length !== 6) return false;
  const r = Number.parseInt(value.slice(0, 2), 16);
  const g = Number.parseInt(value.slice(2, 4), 16);
  const b = Number.parseInt(value.slice(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 170;
}

export const AddItemModal: React.FC<AddItemModalProps> = ({
  isOpen,
  onClose,
  initial = null,
  uploadPhoto,
  onSave,
}) => {
  const [name, setName] = useState(initial?.name ?? '');
  const [category, setCategory] = useState<WardrobeCategory>(initial?.category ?? 'tops');
  const [subcategory, setSubcategory] = useState(initial?.subcategory ?? 'Blouse');
  const [brand, setBrand] = useState(initial?.brand ?? 'Woolworths Studio W');
  const [sizeLabel, setSizeLabel] = useState(initial?.sizeLabel ?? '');
  const [selectedColours, setSelectedColours] = useState<ColourSwatch[]>(() => parseInitialColours(initial));
  const [customHex, setCustomHex] = useState('#9C6A61');
  const [seasons, setSeasons] = useState<WardrobeSeason[]>(initial?.seasons ?? ['all-season']);
  const [occasions, setOccasions] = useState<WardrobeOccasion[]>(initial?.occasions ?? ['work', 'casual']);
  const [imageUrl, setImageUrl] = useState(initial?.imageUrl || turtleneckImg);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fabric, setFabric] = useState(initial?.fabric ?? '100% Cotton');
  const [careNote, setCareNote] = useState(initial?.careNote ?? 'Gentle wash, cool iron');
  const [pairingNotes, setPairingNotes] = useState(initial?.pairingNotes ?? '');
  const [isCapsuleStaple, setIsCapsuleStaple] = useState(initial?.isCapsuleStaple ?? true);
  const [activePresetIndex, setActivePresetIndex] = useState<number | null>(null);

  if (!isOpen) return null;

  const primaryColour = selectedColours[0] ?? { name: 'Ivory Cream', hex: '#F5F2EB' };
  const colourLabel = selectedColours.map((swatch) => swatch.name).join(', ');

  const handleApplyPreset = (preset: typeof PRESET_GARMENT_PHOTOS[0], index: number) => {
    setActivePresetIndex(index);
    setName(preset.name);
    setCategory(preset.category);
    setSubcategory(preset.subcategory);
    setBrand(preset.brand);
    setSelectedColours([{ name: preset.color, hex: preset.colorHex }]);
    setSeasons(preset.seasons);
    setOccasions(preset.occasions);
    setImageUrl(preset.imageUrl);
    setPhotoFile(null);
    setFabric(preset.fabric);
    setFormError(null);
  };

  const handlePopulateNext = () => {
    const nextIndex = activePresetIndex == null
      ? 0
      : (activePresetIndex + 1) % PRESET_GARMENT_PHOTOS.length;
    const preset = PRESET_GARMENT_PHOTOS[nextIndex];
    if (preset) handleApplyPreset(preset, nextIndex);
  };

  const handleToggleColour = (swatch: ColourSwatch) => {
    setSelectedColours((prev) => {
      const exists = prev.some((item) => item.name === swatch.name);
      if (exists) {
        if (prev.length === 1) return prev;
        return prev.filter((item) => item.name !== swatch.name);
      }
      if (prev.length >= 6) return prev;
      return [...prev, swatch];
    });
  };

  const handleAddCustomColour = () => {
    const hex = customHex.toUpperCase();
    const label = `Custom ${hex}`;
    setSelectedColours((prev) => {
      if (prev.some((item) => item.hex.toUpperCase() === hex)) return prev;
      if (prev.length >= 6) return prev;
      return [...prev, { name: label, hex }];
    });
  };

  const handleToggleSeason = (season: WardrobeSeason) => {
    if (seasons.includes(season)) {
      if (seasons.length > 1) {
        setSeasons(seasons.filter((s) => s !== season));
      }
    } else {
      setSeasons([...seasons, season]);
    }
  };

  const handleToggleOccasion = (occ: WardrobeOccasion) => {
    if (occasions.includes(occ)) {
      if (occasions.length > 1) {
        setOccasions(occasions.filter((o) => o !== occ));
      }
    } else {
      setOccasions([...occasions, occ]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || saving) return;
    setSaving(true);
    setFormError(null);
    void Promise.resolve(onSave({
      id: initial?.id,
      name: name.trim(),
      category,
      subcategory: subcategory.trim() || 'Garment',
      brand: brand.trim() || 'Wardrobe Classic',
      sizeLabel: sizeLabel.trim() || undefined,
      color: colourLabel || primaryColour.name,
      colorHex: primaryColour.hex,
      seasons,
      occasions,
      imageUrl,
      fabric,
      careNote,
      pairingNotes,
      isFavorite: initial?.isFavorite ?? false,
      isCapsuleStaple,
    }, photoFile)).then(() => {
      onClose();
    }).catch((error: unknown) => {
      const status = typeof error === 'object' && error && 'status' in error ? Number((error as { status: number }).status) : 0;
      const message = error instanceof Error && error.message.trim() ? error.message : 'Unable to save. Please retry.';
      setFormError(status === 401 ? 'Session expired.' : message);
      setSaving(false);
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-xl max-h-[92vh] bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col border border-[#242326]/10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#242326]/8 bg-[#F6F2EC]/60">
          <div>
            <span className="text-[10px] font-mono tracking-wider text-[#9C6A61] uppercase font-semibold">
              Wardrobe Digitisation
            </span>
            <h3 className="font-serif text-lg font-bold text-[#242326]">
              Add Piece to Your Digital Wardrobe
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-black/5 text-[#5C585E] hover:text-[#242326] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-5">
          {/* Preset Photo Quick Picker */}
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <label className="text-xs font-mono uppercase text-[#5C585E] font-medium">
                Quick Preset Garment Inspiration
              </label>
              <button
                type="button"
                onClick={handlePopulateNext}
                className="shrink-0 px-2.5 py-1 rounded-lg text-[10px] font-semibold text-[#B49361] bg-[#B49361]/10 hover:bg-[#B49361]/20 border border-[#B49361]/25 cursor-pointer transition-colors"
              >
                Click to populate
              </button>
            </div>
            <p className="text-[11px] text-[#5C585E] mb-2">
              Tap a thumbnail or use populate to fill name, colour, seasons, and photo.
            </p>
            <div className="grid grid-cols-5 gap-2">
              {PRESET_GARMENT_PHOTOS.map((preset, idx) => {
                const isActive = activePresetIndex === idx;
                return (
                  <button
                    type="button"
                    key={preset.name}
                    onClick={() => handleApplyPreset(preset, idx)}
                    className={`aspect-square rounded-xl overflow-hidden border-2 transition-all relative group cursor-pointer ${
                      isActive
                        ? 'border-[#9C6A61] ring-2 ring-[#9C6A61]/30'
                        : 'border-[#242326]/12 hover:border-[#9C6A61]'
                    }`}
                    title={`Use preset: ${preset.name}`}
                    aria-pressed={isActive}
                    aria-label={`Populate form with ${preset.name}`}
                  >
                    <img
                      src={preset.imageUrl}
                      alt=""
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform pointer-events-none"
                    />
                    <div className={`absolute inset-0 transition-colors pointer-events-none ${
                      isActive ? 'bg-[#9C6A61]/15' : 'bg-black/15 group-hover:bg-transparent'
                    }`} />
                    {isActive && (
                      <span className="absolute bottom-1 right-1 w-5 h-5 rounded-full bg-[#9C6A61] text-white flex items-center justify-center shadow-sm">
                        <Check className="w-3 h-3" strokeWidth={3} />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Garment Image Preview & URL */}
          <div className="flex items-center gap-4 p-3 bg-[#F6F2EC]/50 rounded-2xl border border-[#242326]/6">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt="Preview"
                className="w-16 h-20 rounded-xl object-cover bg-white shadow-2xs border border-[#242326]/8 shrink-0"
              />
            ) : (
              <div className="w-16 h-20 rounded-xl bg-white border border-[#242326]/8 shrink-0" aria-hidden="true" />
            )}
            <div className="flex-1 min-w-0">
              <label className="text-[10px] font-mono uppercase text-[#5C585E] block mb-1">
                Photograph URL or Upload Simulator:
              </label>
              <input
                type="text"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-white border border-[#242326]/15 rounded-lg focus:outline-none focus:border-[#9C6A61]"
                placeholder="https://..."
              />
              {uploadPhoto && (
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="mt-2 block w-full text-[11px] text-[#5C585E]"
                  onChange={(event) => {
                    const file = event.target.files?.[0] ?? null;
                    setPhotoFile(file);
                    if (file) setImageUrl(URL.createObjectURL(file));
                  }}
                />
              )}
            </div>
          </div>

          {/* Item Name */}
          <div>
            <label className="text-xs font-semibold text-[#242326] block mb-1">
              Garment Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Silk Satin Camisole, Belted Trench Coat"
              className="w-full px-3.5 py-2 text-sm bg-white border border-[#242326]/15 rounded-xl focus:outline-none focus:border-[#9C6A61]"
            />
          </div>

          {/* Category & Subcategory */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-[#242326] block mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as WardrobeCategory)}
                className="w-full px-3 py-2 text-xs bg-white border border-[#242326]/15 rounded-xl capitalize focus:outline-none focus:border-[#9C6A61]"
              >
                <option value="tops">Tops & Blouses</option>
                <option value="bottoms">Bottoms & Trousers</option>
                <option value="dresses">Dresses & Jumpsuits</option>
                <option value="outerwear">Outerwear & Blazers</option>
                <option value="shoes">Shoes</option>
                <option value="bags">Bags</option>
                <option value="accessories">Accessories & Jewellery</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-[#242326] block mb-1">
                Subcategory / Silhouette
              </label>
              <input
                type="text"
                value={subcategory}
                onChange={(e) => setSubcategory(e.target.value)}
                placeholder="e.g. Wide-Leg Trousers, Blazer"
                className="w-full px-3 py-2 text-xs bg-white border border-[#242326]/15 rounded-xl focus:outline-none focus:border-[#9C6A61]"
              />
            </div>
          </div>

          {/* Brand & Fabric */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-[#242326] block mb-1">
                Brand / Retailer
              </label>
              <input
                type="text"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="e.g. Woolworths Studio W, Country Road, Poetry"
                className="w-full px-3 py-2 text-xs bg-white border border-[#242326]/15 rounded-xl focus:outline-none focus:border-[#9C6A61]"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-[#242326] block mb-1">
                Size
              </label>
              <input
                type="text"
                value={sizeLabel}
                onChange={(e) => setSizeLabel(e.target.value)}
                placeholder="e.g. M, 32, UK 6"
                className="w-full px-3 py-2 text-xs bg-white border border-[#242326]/15 rounded-xl focus:outline-none focus:border-[#9C6A61]"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-[#242326] block mb-1">
                Fabric Composition
              </label>
              <input
                type="text"
                value={fabric}
                onChange={(e) => setFabric(e.target.value)}
                placeholder="e.g. 100% Silk, French Linen"
                className="w-full px-3 py-2 text-xs bg-white border border-[#242326]/15 rounded-xl focus:outline-none focus:border-[#9C6A61]"
              />
            </div>
          </div>

          {/* Color Swatches — multi-select for prints, colour-blocked, and tonal pieces */}
          <div>
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <label className="text-xs font-semibold text-[#242326]">
                Colour Palette
              </label>
              <span className="text-[10px] text-[#5C585E]">
                Select up to 6 · first is primary
              </span>
            </div>
            <p className="text-[11px] text-[#5C585E] mb-2 leading-relaxed">
              Selected: <span className="font-medium text-[#242326]">{colourLabel}</span>
            </p>
            <div className="flex flex-wrap items-center gap-2">
              {COLOR_SWATCH_PRESETS.map((swatch) => {
                const isSelected = selectedColours.some((item) => item.name === swatch.name);
                const isPrimary = selectedColours[0]?.name === swatch.name;
                return (
                  <button
                    type="button"
                    key={swatch.name}
                    onClick={() => handleToggleColour({ name: swatch.name, hex: swatch.hex })}
                    className={`relative w-8 h-8 rounded-full border-2 transition-all cursor-pointer shadow-xs ${
                      isSelected
                        ? 'ring-2 ring-[#9C6A61] scale-110 border-white'
                        : swatch.border
                          ? 'border-[#242326]/25'
                          : 'border-black/10'
                    }`}
                    style={{ backgroundColor: swatch.hex }}
                    title={`${swatch.name}${isPrimary ? ' (primary)' : ''}`}
                    aria-pressed={isSelected}
                    aria-label={swatch.name}
                  >
                    {isSelected && (
                      <Check
                        className={`absolute inset-0 m-auto w-3.5 h-3.5 ${
                          needsLightCheck(swatch.hex) ? 'text-[#242326]' : 'text-white'
                        }`}
                        strokeWidth={3}
                      />
                    )}
                  </button>
                );
              })}
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <label className="text-[10px] font-medium text-[#5C585E] uppercase tracking-wide">
                Custom
              </label>
              <input
                type="color"
                value={customHex}
                onChange={(event) => setCustomHex(event.target.value)}
                className="w-8 h-8 rounded-lg border border-[#242326]/15 cursor-pointer bg-transparent p-0.5"
                title="Pick a custom colour"
                aria-label="Custom colour"
              />
              <button
                type="button"
                onClick={handleAddCustomColour}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium bg-[#F6F2EC] text-[#242326] hover:bg-[#E5CDBE]/50 border border-[#242326]/10 cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                Add custom colour
              </button>
            </div>
          </div>

          {/* Seasons */}
          <div>
            <label className="text-xs font-semibold text-[#242326] block mb-1.5">
              Suitable Seasons
            </label>
            <div className="flex flex-wrap gap-1.5">
              {(['all-season', 'summer', 'autumn', 'winter', 'spring'] as WardrobeSeason[]).map((s) => {
                const isSelected = seasons.includes(s);
                return (
                  <button
                    type="button"
                    key={s}
                    onClick={() => handleToggleSeason(s)}
                    className={`px-3 py-1 rounded-lg text-xs capitalize transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-[#242326] text-white font-medium'
                        : 'bg-[#F6F2EC] text-[#5C585E] hover:text-[#242326]'
                    }`}
                  >
                    {s.replace('-', ' ')}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Occasions */}
          <div>
            <label className="text-xs font-semibold text-[#242326] block mb-1.5">
              Appropriate Occasions
            </label>
            <div className="flex flex-wrap gap-1.5">
              {(['work', 'evening', 'casual', 'cocktail', 'formal', 'weekend', 'vacation'] as WardrobeOccasion[]).map((occ) => {
                const isSelected = occasions.includes(occ);
                return (
                  <button
                    type="button"
                    key={occ}
                    onClick={() => handleToggleOccasion(occ)}
                    className={`px-3 py-1 rounded-lg text-xs capitalize transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-[#9C6A61] text-white font-medium'
                        : 'bg-[#F6F2EC] text-[#5C585E] hover:text-[#242326]'
                    }`}
                  >
                    {occ}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Capsule Staple Toggle */}
          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="isCapsule"
              checked={isCapsuleStaple}
              onChange={(e) => setIsCapsuleStaple(e.target.checked)}
              className="w-4 h-4 text-[#9C6A61] rounded-sm focus:ring-[#9C6A61]"
            />
            <label htmlFor="isCapsule" className="text-xs font-medium text-[#242326] cursor-pointer">
              Mark as a Capsule Wardrobe Essential Foundation Piece
            </label>
          </div>

          {/* Submit */}
          <div className="pt-3 space-y-2">
            {formError && <p className="text-xs text-[#9C6A61]">{formError}</p>}
            <button
              type="submit"
              disabled={saving}
              className="w-full py-3 bg-[#9C6A61] hover:bg-[#8A5B53] disabled:opacity-60 text-white text-xs font-semibold uppercase tracking-wider rounded-xl transition-all shadow-sm cursor-pointer"
            >
              {saving ? 'Saving your item.' : initial ? 'Save changes' : 'Save Piece to Wardrobe'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
