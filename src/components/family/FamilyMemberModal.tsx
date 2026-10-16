/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  FamilyProfile,
  FamilyRelationship,
  FamilyClassification,
} from '../../types/family';
import { X, ShieldCheck, Heart, User, Sparkles, Check } from 'lucide-react';
import { Button } from '../common/Button';

interface FamilyMemberModalProps {
  isOpen: boolean;
  memberToEdit?: FamilyProfile | null;
  onClose: () => void;
  onSave: (member: Omit<FamilyProfile, 'id' | 'createdAt'>, idToUpdate?: string) => void;
}

const RELATIONSHIPS: FamilyRelationship[] = [
  'Partner / Spouse',
  'Son',
  'Daughter',
  'Parent',
  'Other Family Member',
];

const STYLE_OPTIONS = [
  'Smart Casual',
  'Classic Tailored',
  'Modern Minimal',
  'Playful Preppy',
  'Soft Pastels',
  'Sporty Classic',
  'Romantic Chic',
  'Relaxed Linen',
  'Streetwear Comfort',
];

const COLOR_OPTIONS = [
  'Navy',
  'Crisp White',
  'Warm Cream',
  'Sage Green',
  'Soft Rose',
  'Terracotta',
  'Camel',
  'Sand Beige',
  'Slate Grey',
  'Forest Green',
  'Sky Blue',
  'Buttercup Yellow',
];

const COMFORT_OPTIONS = [
  'Tagless neckline',
  'Soft elastic waistbands',
  'Breathable natural cotton',
  'Sensory-friendly seams',
  'Stretch fabric for active movement',
  'Loose relaxed cut',
  'No itchy wools or stiff fabrics',
  'Easy slip-on shoes',
];

export const FamilyMemberModal: React.FC<FamilyMemberModalProps> = ({
  isOpen,
  memberToEdit,
  onClose,
  onSave,
}) => {
  const [name, setName] = useState('');
  const [relationship, setRelationship] = useState<FamilyRelationship>('Partner / Spouse');
  const [classification, setClassification] = useState<FamilyClassification>('Adult');
  const [ageRange, setAgeRange] = useState('');
  const [topsSize, setTopsSize] = useState('');
  const [bottomsSize, setBottomsSize] = useState('');
  const [shoeSize, setShoeSize] = useState('');
  const [dressSize, setDressSize] = useState('');
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedComfort, setSelectedComfort] = useState<string[]>([]);
  const [individualBudgetZar, setIndividualBudgetZar] = useState<number>(2500);

  useEffect(() => {
    if (memberToEdit) {
      setName(memberToEdit.name);
      setRelationship(memberToEdit.relationship);
      setClassification(memberToEdit.classification);
      setAgeRange(memberToEdit.ageRange || '');
      setTopsSize(memberToEdit.sizes.topsSize);
      setBottomsSize(memberToEdit.sizes.bottomsSize);
      setShoeSize(memberToEdit.sizes.shoeSize);
      setDressSize(memberToEdit.sizes.dressSize || '');
      setSelectedStyles(memberToEdit.favoriteStyles || []);
      setSelectedColors(memberToEdit.favoriteColors || []);
      setSelectedComfort(memberToEdit.comfortPreferences || []);
      setIndividualBudgetZar(memberToEdit.individualBudgetZar || 2500);
    } else {
      // Defaults for adding a new member
      setName('');
      setRelationship('Partner / Spouse');
      setClassification('Adult');
      setAgeRange('');
      setTopsSize('M');
      setBottomsSize('32');
      setShoeSize('8 UK');
      setDressSize('');
      setSelectedStyles(['Smart Casual', 'Classic Tailored']);
      setSelectedColors(['Navy', 'Warm Cream', 'Sage Green']);
      setSelectedComfort(['Breathable natural cotton']);
      setIndividualBudgetZar(2500);
    }
  }, [memberToEdit, isOpen]);

  if (!isOpen) return null;

  const toggleItem = (list: string[], item: string, setter: (val: string[]) => void) => {
    if (list.includes(item)) {
      setter(list.filter((i) => i !== item));
    } else {
      setter([...list, item]);
    }
  };

  const handleClassificationChange = (c: FamilyClassification) => {
    setClassification(c);
    if (c === 'Child') {
      if (relationship === 'Partner / Spouse') {
        setRelationship('Daughter');
      }
      setTopsSize('7-8Y');
      setBottomsSize('7-8Y');
      setShoeSize('2 UK');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSave(
      {
        name: name.trim(),
        relationship,
        classification,
        ageRange: ageRange.trim() || undefined,
        sizes: {
          topsSize: topsSize.trim() || 'M',
          bottomsSize: bottomsSize.trim() || '32',
          shoeSize: shoeSize.trim() || '7 UK',
          dressSize: dressSize.trim() || undefined,
        },
        favoriteStyles: selectedStyles.length > 0 ? selectedStyles : ['Smart Casual'],
        favoriteColors: selectedColors.length > 0 ? selectedColors : ['Navy', 'Cream'],
        comfortPreferences: selectedComfort,
        individualBudgetZar: Number(individualBudgetZar) || 2500,
        photoConsentNotice:
          classification === 'Child'
            ? 'Minor privacy active: all fitting data strictly client-side sandbox'
            : undefined,
      },
      memberToEdit?.id
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#242326]/60 backdrop-blur-xs overflow-y-auto animate-fadeIn">
      <div className="bg-[#FAF7F2] rounded-3xl max-w-xl w-full max-h-[90vh] overflow-y-auto border border-[#242326]/10 shadow-2xl p-6 sm:p-8 my-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#242326]/10 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#E5CDBE]/50 text-[#9C6A61] flex items-center justify-center">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-serif text-xl sm:text-2xl font-semibold text-[#242326]">
                {memberToEdit ? `Edit ${memberToEdit.name}'s Profile` : 'Add Family Member'}
              </h2>
              <p className="text-xs text-[#5C585E]">
                Personalise sizes, aesthetics, and comfort preferences
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[#5C585E] hover:text-[#242326] rounded-xl hover:bg-[#F6F2EC] transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Classification Toggle: Adult / Child */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-[#5C585E] block mb-2">
              Profile Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleClassificationChange('Adult')}
                className={`py-2.5 px-4 rounded-xl text-xs font-medium border text-center transition-all cursor-pointer ${
                  classification === 'Adult'
                    ? 'bg-[#242326] text-white border-[#242326] shadow-xs'
                    : 'bg-white text-[#5C585E] border-[#242326]/10 hover:border-[#242326]/20'
                }`}
              >
                Adult
              </button>
              <button
                type="button"
                onClick={() => handleClassificationChange('Child')}
                className={`py-2.5 px-4 rounded-xl text-xs font-medium border text-center transition-all cursor-pointer ${
                  classification === 'Child'
                    ? 'bg-[#9C6A61] text-white border-[#9C6A61] shadow-xs'
                    : 'bg-white text-[#5C585E] border-[#242326]/10 hover:border-[#242326]/20'
                }`}
              >
                Child / Teen
              </button>
            </div>
          </div>

          {/* Basic Info: Name, Relationship & Age */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-1">
              <label className="text-xs font-semibold text-[#242326] block mb-1">
                First Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. David"
                className="w-full px-3.5 py-2.5 text-xs bg-white rounded-xl border border-[#242326]/15 focus:outline-none focus:border-[#9C6A61] focus:ring-1 focus:ring-[#9C6A61]"
              />
            </div>

            <div className="sm:col-span-1">
              <label className="text-xs font-semibold text-[#242326] block mb-1">
                Relationship
              </label>
              <select
                value={relationship}
                onChange={(e) => setRelationship(e.target.value as FamilyRelationship)}
                className="w-full px-3 py-2.5 text-xs bg-white rounded-xl border border-[#242326]/15 focus:outline-none focus:border-[#9C6A61] focus:ring-1 focus:ring-[#9C6A61] cursor-pointer"
              >
                {RELATIONSHIPS.map((rel) => (
                  <option key={rel} value={rel}>
                    {rel}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-1">
              <label className="text-xs font-semibold text-[#242326] block mb-1">
                Age / Bracket
              </label>
              <input
                type="text"
                value={ageRange}
                onChange={(e) => setAgeRange(e.target.value)}
                placeholder={classification === 'Child' ? 'e.g. 8 Years' : 'e.g. 35-44'}
                className="w-full px-3.5 py-2.5 text-xs bg-white rounded-xl border border-[#242326]/15 focus:outline-none focus:border-[#9C6A61] focus:ring-1 focus:ring-[#9C6A61]"
              />
            </div>
          </div>

          {/* Clothing Sizes */}
          <div className="bg-white p-4 rounded-2xl border border-[#242326]/10 space-y-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#5C585E] block">
              Clothing Sizes
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div>
                <label className="text-[11px] text-[#5C585E] block mb-1">Tops</label>
                <input
                  type="text"
                  value={topsSize}
                  onChange={(e) => setTopsSize(e.target.value)}
                  placeholder={classification === 'Child' ? '7-8Y' : 'M / 38'}
                  className="w-full px-2.5 py-2 text-xs bg-[#FAF7F2] rounded-lg border border-[#242326]/10 focus:outline-none focus:border-[#9C6A61]"
                />
              </div>
              <div>
                <label className="text-[11px] text-[#5C585E] block mb-1">Bottoms</label>
                <input
                  type="text"
                  value={bottomsSize}
                  onChange={(e) => setBottomsSize(e.target.value)}
                  placeholder={classification === 'Child' ? '7-8Y' : '32 Regular'}
                  className="w-full px-2.5 py-2 text-xs bg-[#FAF7F2] rounded-lg border border-[#242326]/10 focus:outline-none focus:border-[#9C6A61]"
                />
              </div>
              <div>
                <label className="text-[11px] text-[#5C585E] block mb-1">Shoes (UK)</label>
                <input
                  type="text"
                  value={shoeSize}
                  onChange={(e) => setShoeSize(e.target.value)}
                  placeholder={classification === 'Child' ? '2 UK' : '9 UK'}
                  className="w-full px-2.5 py-2 text-xs bg-[#FAF7F2] rounded-lg border border-[#242326]/10 focus:outline-none focus:border-[#9C6A61]"
                />
              </div>
              <div>
                <label className="text-[11px] text-[#5C585E] block mb-1">Dress (Optional)</label>
                <input
                  type="text"
                  value={dressSize}
                  onChange={(e) => setDressSize(e.target.value)}
                  placeholder="34 / 10"
                  className="w-full px-2.5 py-2 text-xs bg-[#FAF7F2] rounded-lg border border-[#242326]/10 focus:outline-none focus:border-[#9C6A61]"
                />
              </div>
            </div>
          </div>

          {/* Aesthetic Styles */}
          <div>
            <label className="text-xs font-semibold text-[#242326] block mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#B49361]" />
                Preferred Aesthetics
              </span>
              <span className="text-[11px] text-[#5C585E] font-normal">Select 1-3</span>
            </label>
            <div className="flex flex-wrap gap-1.5">
              {STYLE_OPTIONS.map((style) => {
                const isSelected = selectedStyles.includes(style);
                return (
                  <button
                    key={style}
                    type="button"
                    onClick={() => toggleItem(selectedStyles, style, setSelectedStyles)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-[#242326] text-white border-[#242326]'
                        : 'bg-white text-[#5C585E] border-[#242326]/10 hover:border-[#242326]/30'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 text-[#B49361]" />}
                    {style}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Favorite Colors */}
          <div>
            <label className="text-xs font-semibold text-[#242326] block mb-1.5">
              Favorite Palette Colors
            </label>
            <div className="flex flex-wrap gap-1.5">
              {COLOR_OPTIONS.map((color) => {
                const isSelected = selectedColors.includes(color);
                return (
                  <button
                    key={color}
                    type="button"
                    onClick={() => toggleItem(selectedColors, color, setSelectedColors)}
                    className={`px-2.5 py-1 rounded-lg text-xs transition-all cursor-pointer border ${
                      isSelected
                        ? 'bg-[#9C6A61] text-white border-[#9C6A61]'
                        : 'bg-white text-[#5C585E] border-[#242326]/10 hover:border-[#242326]/30'
                    }`}
                  >
                    {color}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Comfort & Sensory Preferences */}
          <div>
            <label className="text-xs font-semibold text-[#242326] block mb-1.5 flex items-center gap-1.5">
              <Heart className="w-3.5 h-3.5 text-[#9C6A61]" />
              Comfort & Sensory Needs
            </label>
            <div className="flex flex-wrap gap-1.5">
              {COMFORT_OPTIONS.map((pref) => {
                const isSelected = selectedComfort.includes(pref);
                return (
                  <button
                    key={pref}
                    type="button"
                    onClick={() => toggleItem(selectedComfort, pref, setSelectedComfort)}
                    className={`px-2.5 py-1 rounded-lg text-xs transition-all cursor-pointer border ${
                      isSelected
                        ? 'bg-[#E5CDBE] text-[#242326] font-medium border-[#B49361]/40'
                        : 'bg-white text-[#5C585E] border-[#242326]/10 hover:border-[#242326]/30'
                    }`}
                  >
                    {pref}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Target Individual Budget (ZAR) */}
          <div className="bg-white p-4 rounded-2xl border border-[#242326]/10">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-[#242326]">
                Target Occasion Budget (ZAR)
              </label>
              <span className="font-serif font-bold text-sm text-[#9C6A61]">
                R{individualBudgetZar.toLocaleString()}
              </span>
            </div>
            <input
              type="range"
              min="500"
              max="8000"
              step="100"
              value={individualBudgetZar}
              onChange={(e) => setIndividualBudgetZar(Number(e.target.value))}
              className="w-full accent-[#9C6A61] cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-[#5C585E] mt-1">
              <span>R500</span>
              <span>R4,000</span>
              <span>R8,000+</span>
            </div>
          </div>

          {/* Minor Safety & Privacy Reassurance */}
          {classification === 'Child' && (
            <div className="p-3 rounded-2xl bg-[#E5CDBE]/30 border border-[#9C6A61]/20 flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-[#9C6A61] shrink-0 mt-0.5" />
              <p className="text-[11px] text-[#794E46] leading-relaxed">
                <strong>Privacy & Safety Notice:</strong> Children’s profiles and any temporary try-on imagery are strictly isolated to your personal device. No data is shared with external services or advertising networks.
              </p>
            </div>
          )}

          {/* Submit Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#242326]/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-medium text-[#5C585E] hover:text-[#242326] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <Button type="submit" variant="primary">
              {memberToEdit ? 'Save Changes' : 'Add to Family'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
