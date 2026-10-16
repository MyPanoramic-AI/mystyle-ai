/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  UserProfile,
  PersonalDetails,
  ClothingSizes,
  ColourPreferences,
  ShoppingPreferences,
  TemporaryPhotos,
  FitPreference,
  ExperimentationLevel,
  BudgetTier,
} from '../../types';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import {
  STYLE_CATEGORIES,
  SWATCH_COLORS,
  AVOID_COLORS_LIST,
  SIZE_OPTIONS,
  SOUTH_AFRICAN_RETAILERS,
} from '../../data/mockData';
import { Check, Upload, X, ShieldCheck } from 'lucide-react';

export type EditableSection = 'personal' | 'sizes' | 'styles' | 'colours' | 'shopping' | 'photos';

interface EditSectionModalProps {
  section: EditableSection | null;
  profile: UserProfile;
  photos: TemporaryPhotos;
  isOpen: boolean;
  onClose: () => void;
  onSaveProfile: (updated: UserProfile) => void;
  onUpdatePhotos: (photos: TemporaryPhotos) => void;
}

export const EditSectionModal: React.FC<EditSectionModalProps> = ({
  section,
  profile,
  photos,
  isOpen,
  onClose,
  onSaveProfile,
  onUpdatePhotos,
}) => {
  // Local state for whichever section is active
  const [personal, setPersonal] = useState<PersonalDetails>(profile.personal);
  const [sizes, setSizes] = useState<ClothingSizes>(profile.sizes);
  const [styles, setStyles] = useState<string[]>(profile.styles);
  const [colours, setColours] = useState<ColourPreferences>(profile.colours);
  const [shopping, setShopping] = useState<ShoppingPreferences>(profile.shopping);

  if (!section) return null;

  const handleSave = () => {
    let updated: UserProfile = { ...profile };
    if (section === 'personal') updated.personal = personal;
    if (section === 'sizes') updated.sizes = sizes;
    if (section === 'styles') updated.styles = styles;
    if (section === 'colours') updated.colours = colours;
    if (section === 'shopping') updated.shopping = shopping;

    onSaveProfile(updated);
    onClose();
  };

  const getTitle = () => {
    switch (section) {
      case 'personal':
        return 'Edit Personal Details';
      case 'sizes':
        return 'Edit Clothing Sizes & Measurements';
      case 'styles':
        return 'Edit Style Aesthetics';
      case 'colours':
        return 'Edit Colour & Fit Preferences';
      case 'shopping':
        return 'Edit Shopping & Budget Preferences';
      case 'photos':
        return 'Manage Styling Photographs';
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={getTitle()}
      subtitle="Changes update your personal style recommendations"
    >
      <div className="space-y-5">
        {/* SECTION 1: PERSONAL */}
        {section === 'personal' && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#242326] uppercase mb-1">
                Preferred First Name
              </label>
              <input
                type="text"
                value={personal.firstName}
                onChange={(e) => setPersonal({ ...personal, firstName: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#242326]/15 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#242326] uppercase mb-1">
                Age Range
              </label>
              <select
                value={personal.ageRange || '25–34'}
                onChange={(e) => setPersonal({ ...personal, ageRange: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#242326]/15 text-sm"
              >
                {['18–24', '25–34', '35–44', '45–54', '55+', 'Prefer not to say'].map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#242326] uppercase mb-1">
                Height (cm)
              </label>
              <input
                type="number"
                value={personal.heightCm || ''}
                onChange={(e) =>
                  setPersonal({
                    ...personal,
                    heightCm: e.target.value ? parseInt(e.target.value, 10) : undefined,
                  })
                }
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#242326]/15 text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#242326] uppercase mb-1">
                  Country
                </label>
                <input
                  type="text"
                  value={personal.country}
                  onChange={(e) => setPersonal({ ...personal, country: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#242326]/15 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#242326] uppercase mb-1">
                  Currency
                </label>
                <input
                  type="text"
                  value={personal.currency}
                  onChange={(e) => setPersonal({ ...personal, currency: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#242326]/15 text-sm"
                />
              </div>
            </div>
          </div>
        )}

        {/* SECTION 2: SIZES */}
        {section === 'sizes' && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#242326] uppercase mb-1">
                Tops Size
              </label>
              <select
                value={sizes.topsSize}
                onChange={(e) => setSizes({ ...sizes, topsSize: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#242326]/15 text-sm"
              >
                {SIZE_OPTIONS.tops.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#242326] uppercase mb-1">
                Bottoms Size
              </label>
              <select
                value={sizes.bottomsSize}
                onChange={(e) => setSizes({ ...sizes, bottomsSize: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#242326]/15 text-sm"
              >
                {SIZE_OPTIONS.bottoms.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#242326] uppercase mb-1">
                Dress Size
              </label>
              <select
                value={sizes.dressSize}
                onChange={(e) => setSizes({ ...sizes, dressSize: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#242326]/15 text-sm"
              >
                {SIZE_OPTIONS.dresses.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#242326] uppercase mb-1">
                Shoe Size (SA / UK)
              </label>
              <select
                value={sizes.shoeSize}
                onChange={(e) => setSizes({ ...sizes, shoeSize: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#242326]/15 text-sm"
              >
                {SIZE_OPTIONS.shoes.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-3 gap-2 pt-1">
              <div>
                <span className="text-[11px] text-[#5C585E] block mb-1">Bust (cm)</span>
                <input
                  type="text"
                  value={sizes.bustCm || ''}
                  onChange={(e) => setSizes({ ...sizes, bustCm: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-[#242326]/15 text-xs"
                />
              </div>
              <div>
                <span className="text-[11px] text-[#5C585E] block mb-1">Waist (cm)</span>
                <input
                  type="text"
                  value={sizes.waistCm || ''}
                  onChange={(e) => setSizes({ ...sizes, waistCm: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-[#242326]/15 text-xs"
                />
              </div>
              <div>
                <span className="text-[11px] text-[#5C585E] block mb-1">Hips (cm)</span>
                <input
                  type="text"
                  value={sizes.hipCm || ''}
                  onChange={(e) => setSizes({ ...sizes, hipCm: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-[#242326]/15 text-xs"
                />
              </div>
            </div>
          </div>
        )}

        {/* SECTION 3: STYLES */}
        {section === 'styles' && (
          <div>
            <p className="text-xs text-[#5C585E] mb-3">
              Tap any style to toggle it in your signature persona:
            </p>
            <div className="grid grid-cols-2 gap-2 max-h-72 overflow-y-auto no-scrollbar">
              {STYLE_CATEGORIES.map((cat) => {
                const isSelected = styles.includes(cat.title);
                return (
                  <button
                    type="button"
                    key={cat.id}
                    onClick={() =>
                      setStyles((prev) =>
                        prev.includes(cat.title)
                          ? prev.filter((s) => s !== cat.title)
                          : [...prev, cat.title]
                      )
                    }
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                      isSelected
                        ? 'border-[#9C6A61] bg-[#E5CDBE]/20 text-[#242326]'
                        : 'border-[#242326]/10 bg-white text-[#5C585E]'
                    }`}
                  >
                    <span className="text-xs font-semibold block">{cat.title}</span>
                    <span className="text-[10px] text-[#5C585E] line-clamp-1 mt-0.5">
                      {cat.description}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* SECTION 4: COLOURS & FIT */}
        {section === 'colours' && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#242326] uppercase mb-2">
                Favourite Colours
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-48 overflow-y-auto no-scrollbar">
                {SWATCH_COLORS.map((swatch) => {
                  const isSelected = colours.favoriteColors.includes(swatch.name);
                  return (
                    <button
                      type="button"
                      key={swatch.name}
                      onClick={() =>
                        setColours({
                          ...colours,
                          favoriteColors: isSelected
                            ? colours.favoriteColors.filter((c) => c !== swatch.name)
                            : [...colours.favoriteColors, swatch.name],
                        })
                      }
                      className={`flex items-center gap-2 p-2 rounded-xl border text-left cursor-pointer ${
                        isSelected
                          ? 'border-[#9C6A61] bg-[#E5CDBE]/20'
                          : 'border-[#242326]/10 bg-white'
                      }`}
                    >
                      <span
                        className="w-4 h-4 rounded-full border border-black/10 shrink-0"
                        style={{ backgroundColor: swatch.hex }}
                      />
                      <span className="text-xs truncate">{swatch.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#242326] uppercase mb-1">
                Preferred Fit
              </label>
              <select
                value={colours.fitPreference}
                onChange={(e) =>
                  setColours({ ...colours, fitPreference: e.target.value as FitPreference })
                }
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#242326]/15 text-sm"
              >
                <option value="relaxed">Relaxed</option>
                <option value="regular">Regular</option>
                <option value="fitted">Fitted</option>
                <option value="no-preference">No Preference</option>
              </select>
            </div>
          </div>
        )}

        {/* SECTION 5: SHOPPING */}
        {section === 'shopping' && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#242326] uppercase mb-1">
                Target Budget Per Item
              </label>
              <select
                value={shopping.itemBudget}
                onChange={(e) =>
                  setShopping({ ...shopping, itemBudget: e.target.value as BudgetTier })
                }
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#242326]/15 text-sm"
              >
                <option value="under-300">Under R300</option>
                <option value="300-600">R300 – R600</option>
                <option value="600-1000">R600 – R1,000</option>
                <option value="1000-2000">R1,000 – R2,000</option>
                <option value="2000-plus">R2,000+</option>
                <option value="flexible">Flexible</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#242326] uppercase mb-2">
                Favourite South African Retailers
              </label>
              <div className="flex flex-wrap gap-1.5">
                {SOUTH_AFRICAN_RETAILERS.map((r) => {
                  const isSelected = shopping.favoriteRetailers.includes(r);
                  return (
                    <button
                      type="button"
                      key={r}
                      onClick={() =>
                        setShopping({
                          ...shopping,
                          favoriteRetailers: isSelected
                            ? shopping.favoriteRetailers.filter((item) => item !== r)
                            : [...shopping.favoriteRetailers, r],
                        })
                      }
                      className={`px-3 py-1.5 text-xs font-medium rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#9C6A61] text-white border-[#9C6A61]'
                          : 'bg-white text-[#5C585E] border-[#242326]/10'
                      }`}
                    >
                      {r}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* SECTION 6: PHOTOS */}
        {section === 'photos' && (
          <div className="space-y-4">
            <div className="p-3.5 rounded-xl bg-[#E5CDBE]/20 border border-[#242326]/10 flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-[#9C6A61] shrink-0 mt-0.5" />
              <p className="text-xs text-[#242326]">
                Photos uploaded in this prototype are preserved only in temporary browser memory. When refreshed, new photos can be selected.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-white border border-[#242326]/10 text-center">
                <span className="text-xs font-semibold block mb-2">Profile Photo</span>
                {photos.profilePhotoUrl ? (
                  <div className="relative aspect-square rounded-lg overflow-hidden mb-2">
                    <img src={photos.profilePhotoUrl} alt="Profile" className="w-full h-full object-cover" />
                    <button
                      onClick={() => onUpdatePhotos({ ...photos, profilePhotoUrl: undefined })}
                      className="absolute top-1 right-1 p-1 bg-black/60 text-white rounded-full"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <span className="text-xs text-[#5C585E] block py-6">No photo selected</span>
                )}
              </div>

              <div className="p-3 rounded-xl bg-white border border-[#242326]/10 text-center">
                <span className="text-xs font-semibold block mb-2">Front Full-Body</span>
                {photos.fullBodyFrontUrl ? (
                  <div className="relative aspect-square rounded-lg overflow-hidden mb-2">
                    <img src={photos.fullBodyFrontUrl} alt="Front body" className="w-full h-full object-cover" />
                    <button
                      onClick={() => onUpdatePhotos({ ...photos, fullBodyFrontUrl: undefined })}
                      className="absolute top-1 right-1 p-1 bg-black/60 text-white rounded-full"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <span className="text-xs text-[#5C585E] block py-6">No photo selected</span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="pt-4 border-t border-[#242326]/8 flex items-center justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={handleSave}>
            Save Changes
          </Button>
        </div>
      </div>
    </Modal>
  );
};
