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
import { X, Camera, Plus, Check, Sparkles } from 'lucide-react';

interface AddItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  initial?: WardrobeItem | null;
  uploadPhoto?: (file: File) => Promise<string>;
  onSave: (item: Omit<WardrobeItem, 'id' | 'dateAdded' | 'timesWorn'> & { id?: string }, file?: File | null) => Promise<void> | void;
}

// Preset demonstration garment photos to make adding items effortless
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
    imageUrl: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=700&q=80',
    fabric: '100% Merino Wool',
  },
  {
    name: 'Pleated A-Line Satin Skirt',
    category: 'bottoms' as WardrobeCategory,
    subcategory: 'Skirt',
    brand: 'Country Road',
    color: 'Burnt Sienna',
    colorHex: '#9E4E39',
    seasons: ['all-season', 'autumn'] as WardrobeSeason[],
    occasions: ['cocktail', 'evening', 'work'] as WardrobeOccasion[],
    imageUrl: 'https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?auto=format&fit=crop&w=700&q=80',
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
    imageUrl: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=700&q=80',
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
    imageUrl: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=700&q=80',
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
    imageUrl: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=700&q=80',
    fabric: 'Calfskin Leather',
  },
];

const COLOR_SWATCH_PRESETS = [
  { name: 'Pure White', hex: '#FFFFFF' },
  { name: 'Ivory Cream', hex: '#F5F2EB' },
  { name: 'Oatmeal Natural', hex: '#D6C9B6' },
  { name: 'Camel Tan', hex: '#9E7453' },
  { name: 'Terracotta Rust', hex: '#B85848' },
  { name: 'Forest Pine', hex: '#253B30' },
  { name: 'Navy Midnight', hex: '#1D2A44' },
  { name: 'Onyx Black', hex: '#1E1D20' },
  { name: 'Gold Champagne', hex: '#CCA762' },
];

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
  const [color, setColor] = useState(initial?.color ?? 'Ivory Cream');
  const [colorHex, setColorHex] = useState(initial?.colorHex ?? '#F5F2EB');
  const [seasons, setSeasons] = useState<WardrobeSeason[]>(initial?.seasons ?? ['all-season']);
  const [occasions, setOccasions] = useState<WardrobeOccasion[]>(initial?.occasions ?? ['work', 'casual']);
  const [imageUrl, setImageUrl] = useState(initial?.imageUrl || 'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?auto=format&fit=crop&w=700&q=80');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fabric, setFabric] = useState(initial?.fabric ?? '100% Cotton');
  const [careNote, setCareNote] = useState(initial?.careNote ?? 'Gentle wash, cool iron');
  const [pairingNotes, setPairingNotes] = useState(initial?.pairingNotes ?? '');
  const [isCapsuleStaple, setIsCapsuleStaple] = useState(initial?.isCapsuleStaple ?? true);

  if (!isOpen) return null;

  const handleApplyPreset = (preset: typeof PRESET_GARMENT_PHOTOS[0]) => {
    setName(preset.name);
    setCategory(preset.category);
    setSubcategory(preset.subcategory);
    setBrand(preset.brand);
    setColor(preset.color);
    setColorHex(preset.colorHex);
    setSeasons(preset.seasons);
    setOccasions(preset.occasions);
    setImageUrl(preset.imageUrl);
    setFabric(preset.fabric);
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
      color,
      colorHex,
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
      setFormError(status === 401 ? 'Session expired.' : 'Unable to save. Please retry.');
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
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-mono uppercase text-[#5C585E] font-medium">
                Quick Preset Garment Inspiration:
              </label>
              <span className="text-[10px] text-[#B49361] font-medium">Click to populate</span>
            </div>
            <div className="grid grid-cols-5 gap-2">
              {PRESET_GARMENT_PHOTOS.map((preset, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => handleApplyPreset(preset)}
                  className="aspect-square rounded-xl overflow-hidden border border-[#242326]/12 hover:border-[#9C6A61] transition-all relative group cursor-pointer"
                  title={preset.name}
                >
                  <img
                    src={preset.imageUrl}
                    alt={preset.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors" />
                </button>
              ))}
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

          {/* Color Swatches */}
          <div>
            <label className="text-xs font-semibold text-[#242326] block mb-1.5">
              Primary Colour Palette: <span className="font-normal text-[#5C585E]">({color})</span>
            </label>
            <div className="flex flex-wrap items-center gap-2">
              {COLOR_SWATCH_PRESETS.map((swatch) => (
                <button
                  type="button"
                  key={swatch.name}
                  onClick={() => {
                    setColor(swatch.name);
                    setColorHex(swatch.hex);
                  }}
                  className={`w-7 h-7 rounded-full border-2 transition-all cursor-pointer shadow-xs ${
                    color === swatch.name ? 'ring-2 ring-[#9C6A61] scale-110 border-white' : 'border-black/10'
                  }`}
                  style={{ backgroundColor: swatch.hex }}
                  title={swatch.name}
                />
              ))}
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
