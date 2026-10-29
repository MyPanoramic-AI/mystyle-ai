/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { UserProfile, StylistFilterLens } from '../../types';
import { Button } from '../common/Button';
import { X, Sliders, Check, Sparkles } from 'lucide-react';

interface ProfileLensModalProps {
  isOpen: boolean;
  onClose: () => void;
  lens: StylistFilterLens;
  onSaveLens: (newLens: StylistFilterLens) => void;
  profile: UserProfile;
}

const OCCASIONS = [
  'Everyday Versatile',
  'Date Night & Cocktails',
  'Wedding Guest',
  'Corporate Executive',
  'Weekend Brunch',
  'Coastal Resort',
  'High-Fashion Gala',
];

const FORMALITIES: Array<'Relaxed' | 'Smart-Casual' | 'Formal' | 'Black-Tie'> = [
  'Relaxed',
  'Smart-Casual',
  'Formal',
  'Black-Tie',
];

const BUDGET_TIERS = [
  { id: 'under-300', label: 'Under R300 (Value bargains)' },
  { id: '300-600', label: 'R300 – R600 (Smart staples)' },
  { id: '600-1000', label: 'R600 – R1,000 (Premium high street)' },
  { id: '1000-2000', label: 'R1,000 – R2,000 (Investment pieces)' },
  { id: '2000-plus', label: 'R2,000+ (Luxury & Designer)' },
  { id: 'flexible', label: 'Flexible budget' },
];

export const ProfileLensModal: React.FC<ProfileLensModalProps> = ({
  isOpen,
  onClose,
  lens,
  onSaveLens,
  profile,
}) => {
  const [selectedOccasion, setSelectedOccasion] = useState(lens.occasion);
  const [selectedFormality, setSelectedFormality] = useState(lens.formality);
  const [selectedBudget, setSelectedBudget] = useState(lens.budgetTier);

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveLens({
      occasion: selectedOccasion,
      formality: selectedFormality,
      budgetTier: selectedBudget,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-[#242326]/10 overflow-hidden flex flex-col max-h-[90vh]"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#242326]/10 bg-[#FAF7F2]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#9C6A61] text-white flex items-center justify-center">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-semibold text-[#242326]">
                Adjust Styling Lens
              </h3>
              <p className="text-[11px] text-[#5C585E]">
                Fine-tune {(profile.stylistPersona?.name || 'your stylist').trim() || 'your stylist'}’s recommendations for {profile.personal.firstName || 'your session'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white hover:bg-[#E5CDBE]/20 text-[#5C585E] hover:text-[#242326] flex items-center justify-center border border-[#242326]/10 transition-colors cursor-pointer"
            aria-label="Close styling lens"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Active Occasion */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-[#9C6A61] block mb-2">
              Primary Occasion Context
            </label>
            <div className="grid grid-cols-2 gap-2">
              {OCCASIONS.map((occ) => {
                const isSelected = selectedOccasion === occ;
                return (
                  <button
                    key={occ}
                    type="button"
                    onClick={() => setSelectedOccasion(occ)}
                    className={`text-left px-3 py-2 rounded-xl text-xs font-medium border transition-colors cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'bg-[#9C6A61] text-white border-[#9C6A61]'
                        : 'bg-white hover:bg-[#F6F2EC] text-[#242326] border-[#242326]/12'
                    }`}
                  >
                    <span className="truncate">{occ}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 shrink-0 ml-1" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Formality Level */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-[#9C6A61] block mb-2">
              Dress Code & Formality
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {FORMALITIES.map((f) => {
                const isSelected = selectedFormality === f;
                return (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setSelectedFormality(f)}
                    className={`py-2 px-2.5 rounded-xl text-xs font-medium border text-center transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-[#242326] text-white border-[#242326]'
                        : 'bg-white hover:bg-[#F6F2EC] text-[#5C585E] border-[#242326]/12'
                    }`}
                  >
                    {f}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Budget Range */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-[#9C6A61] block mb-2">
              Price Range Per Piece (ZAR)
            </label>
            <div className="space-y-1.5">
              {BUDGET_TIERS.map((tier) => {
                const isSelected = selectedBudget === tier.id;
                return (
                  <button
                    key={tier.id}
                    type="button"
                    onClick={() => setSelectedBudget(tier.id)}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium border transition-colors cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'bg-[#FAF7F2] text-[#9C6A61] border-[#9C6A61] font-semibold'
                        : 'bg-white hover:bg-[#F6F2EC] text-[#242326] border-[#242326]/10'
                    }`}
                  >
                    <span>{tier.label}</span>
                    {isSelected && <Check className="w-4 h-4 text-[#9C6A61]" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-[#FAF7F2] border-t border-[#242326]/10 flex items-center justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={handleSave}>
            Apply Lens to Chat
          </Button>
        </div>
      </div>
    </div>
  );
};
