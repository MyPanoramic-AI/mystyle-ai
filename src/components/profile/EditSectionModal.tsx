/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import {
  UserProfile,
  PersonalDetails,
  ClothingSizes,
  ColourPreferences,
  ShoppingPreferences,
  ShoePreferences,
  TemporaryPhotos,
  FitPreference,
  ExperimentationLevel,
  BudgetTier,
} from '../../types';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { ShoePreferencesFields } from '../common/ShoePreferencesFields';
import { DEFAULT_SHOE_PREFERENCES } from '../../data/shoePreferences';
import {
  STYLE_CATEGORIES,
  SWATCH_COLORS,
  AVOID_COLORS_LIST,
  SIZE_OPTIONS,
  SOUTH_AFRICAN_RETAILERS,
} from '../../data/mockData';
import type { ProfilePhotoSlot } from '../../services/accountApi';
import { PrivatePhotoSlotsEditor } from './PrivatePhotoSlotsEditor';
import { HeightField } from '../common/HeightField';
import {
  type LengthUnit,
  formatLengthDisplay,
  inchesToCm,
  parseLengthCm,
} from '../../utils/measurements';

export type EditableSection = 'personal' | 'sizes' | 'styles' | 'colours' | 'shopping' | 'photos' | 'shoes';

interface EditSectionModalProps {
  section: EditableSection | null;
  profile: UserProfile;
  photos: TemporaryPhotos;
  isOpen: boolean;
  onClose: () => void;
  onSaveProfile: (updated: UserProfile) => void | Promise<void>;
  onUpdatePhotos: (photos: TemporaryPhotos) => void;
  usesAccount?: boolean;
  storageConsentGranted?: boolean;
  onGrantStorageConsent?: () => Promise<void>;
  onUploadPhotoSlot?: (slot: ProfilePhotoSlot, imageBase64: string) => Promise<{ mediaId: string }>;
  onDeletePhotoSlot?: (slot: ProfilePhotoSlot) => Promise<void>;
}

export const EditSectionModal: React.FC<EditSectionModalProps> = ({
  section,
  profile,
  photos,
  isOpen,
  onClose,
  onSaveProfile,
  onUpdatePhotos,
  usesAccount = false,
  storageConsentGranted = false,
  onGrantStorageConsent,
  onUploadPhotoSlot,
  onDeletePhotoSlot,
}) => {
  // Local state for whichever section is active
  const [personal, setPersonal] = useState<PersonalDetails>(profile.personal);
  const [sizes, setSizes] = useState<ClothingSizes>(profile.sizes);
  const [shoePreferences, setShoePreferences] = useState<ShoePreferences>(
    profile.shoePreferences ?? { ...DEFAULT_SHOE_PREFERENCES },
  );
  const [styles, setStyles] = useState<string[]>(profile.styles);
  const [colours, setColours] = useState<ColourPreferences>(profile.colours);
  const [shopping, setShopping] = useState<ShoppingPreferences>(profile.shopping);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [bodyUnit, setBodyUnit] = useState<LengthUnit>('cm');

  useEffect(() => {
    if (!isOpen || !section) return;
    setPersonal(profile.personal);
    setSizes(profile.sizes);
    setShoePreferences(profile.shoePreferences ?? { ...DEFAULT_SHOE_PREFERENCES });
    setStyles(profile.styles);
    setColours(profile.colours);
    setShopping(profile.shopping);
    setSaveError(null);
  }, [isOpen, section, profile]);

  if (!section) return null;

  const setBodyMeasure = (key: 'bustCm' | 'waistCm' | 'hipCm', displayValue: string) => {
    if (!displayValue.trim()) {
      setSizes({ ...sizes, [key]: undefined });
      return;
    }
    const n = Number(displayValue);
    if (!Number.isFinite(n) || n <= 0) return;
    const cm = bodyUnit === 'in' ? inchesToCm(n) : Math.round(n);
    setSizes({ ...sizes, [key]: String(cm) });
  };

  const handleSave = async () => {
    if (section === 'photos') {
      onClose();
      return;
    }
    let updated: UserProfile = { ...profile };
    if (section === 'personal') updated.personal = personal;
    if (section === 'sizes') {
      updated.sizes = sizes;
      updated.shoePreferences = shoePreferences;
    }
    if (section === 'shoes') updated.shoePreferences = shoePreferences;
    if (section === 'styles') updated.styles = styles;
    if (section === 'colours') updated.colours = colours;
    if (section === 'shopping') updated.shopping = shopping;
    setSaving(true);
    setSaveError(null);
    try {
      await onSaveProfile(updated);
      onClose();
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'The profile could not be saved.');
    } finally {
      setSaving(false);
    }
  };

  const getTitle = () => {
    switch (section) {
      case 'personal':
        return 'Edit Personal Details';
      case 'sizes':
        return 'Edit Sizes, Measurements & Shoe Preferences';
      case 'shoes':
        return 'Edit Shoe Preferences';
      case 'styles':
        return 'Edit Style Aesthetics';
      case 'colours':
        return 'Edit Colour & Fit Preferences';
      case 'shopping':
        return 'Edit Shopping & Budget Preferences';
      case 'photos':
        return 'Manage photos · Portrait, front & back';
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
            <HeightField
              valueCm={personal.heightCm}
              onChangeCm={(heightCm) => setPersonal({ ...personal, heightCm })}
            />
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
            <div className="pt-3 border-t border-[#242326]/8">
              <ShoePreferencesFields value={shoePreferences} onChange={setShoePreferences} compact />
            </div>
            <div className="pt-1">
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-xs font-semibold text-[#242326] uppercase tracking-wider">
                  Body measurements
                </span>
                <div className="inline-flex rounded-lg border border-[#242326]/12 bg-white p-0.5" role="group" aria-label="Body measurement unit">
                  {([
                    { id: 'cm' as const, label: 'cm' },
                    { id: 'in' as const, label: 'in' },
                  ]).map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setBodyUnit(option.id)}
                      className={`px-2.5 py-1 text-[10px] font-semibold rounded-md cursor-pointer transition-colors ${
                        bodyUnit === option.id
                          ? 'bg-[#242326] text-white'
                          : 'text-[#5C585E] hover:text-[#242326]'
                      }`}
                      aria-pressed={bodyUnit === option.id}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {([
                  { key: 'bustCm' as const, label: 'Bust' },
                  { key: 'waistCm' as const, label: 'Waist' },
                  { key: 'hipCm' as const, label: 'Hips' },
                ]).map((field) => (
                  <div key={field.key}>
                    <span className="text-[11px] text-[#5C585E] block mb-1">
                      {field.label} ({bodyUnit})
                    </span>
                    <input
                      type="number"
                      min={bodyUnit === 'cm' ? 40 : 16}
                      max={bodyUnit === 'cm' ? 200 : 80}
                      step={bodyUnit === 'cm' ? 1 : 0.5}
                      value={formatLengthDisplay(sizes[field.key], bodyUnit)}
                      onChange={(e) => setBodyMeasure(field.key, e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-[#242326]/15 text-xs"
                    />
                  </div>
                ))}
              </div>
              {(parseLengthCm(sizes.bustCm) || parseLengthCm(sizes.waistCm) || parseLengthCm(sizes.hipCm)) && bodyUnit === 'in' && (
                <p className="mt-1.5 text-[11px] text-[#5C585E]">
                  Saved in centimetres
                  {parseLengthCm(sizes.bustCm) ? ` · bust ${parseLengthCm(sizes.bustCm)} cm` : ''}
                  {parseLengthCm(sizes.waistCm) ? ` · waist ${parseLengthCm(sizes.waistCm)} cm` : ''}
                  {parseLengthCm(sizes.hipCm) ? ` · hips ${parseLengthCm(sizes.hipCm)} cm` : ''}
                </p>
              )}
            </div>
          </div>
        )}

        {section === 'shoes' && (
          <div className="space-y-3">
            <p className="text-xs text-[#5C585E] leading-relaxed">
              Tell us what you can comfortably wear so recommendations stay realistic — for example no high heels, or heels only for special occasions.
            </p>
            <ShoePreferencesFields value={shoePreferences} onChange={setShoePreferences} />
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
          <PrivatePhotoSlotsEditor
            photos={photos}
            onUpdatePhotos={onUpdatePhotos}
            usesAccount={usesAccount}
            storageConsentGranted={storageConsentGranted}
            onGrantStorageConsent={onGrantStorageConsent}
            onUploadSlot={onUploadPhotoSlot}
            onDeleteSlot={onDeletePhotoSlot}
          />
        )}

        {/* Footer Actions */}
        <div className="pt-4 border-t border-[#242326]/8 flex items-center justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={onClose}>
            {section === 'photos' ? 'Close' : 'Cancel'}
          </Button>
          <Button variant="primary" size="sm" onClick={() => { void handleSave(); }} disabled={saving}>
            {section === 'photos' ? 'Done' : saving ? 'Saving…' : 'Save Changes'}
          </Button>
          {saveError ? <p className="text-xs text-[#9C6A61]" role="alert">{saveError}</p> : null}
        </div>
      </div>
    </Modal>
  );
};
