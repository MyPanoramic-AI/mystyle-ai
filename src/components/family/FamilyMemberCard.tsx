/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { FamilyProfile } from '../../types/family';
import { User, Pencil, Trash2, ShieldCheck, Heart } from 'lucide-react';

interface FamilyMemberCardProps {
  member: FamilyProfile;
  onEdit: (member: FamilyProfile) => void;
  onDelete: (id: string) => void;
}

export const FamilyMemberCard: React.FC<FamilyMemberCardProps> = ({
  member,
  onEdit,
  onDelete,
}) => {
  const isChild = member.classification === 'Child';

  return (
    <div className="bg-white rounded-3xl border border-[#242326]/10 p-5 sm:p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
      <div>
        {/* Header with avatar, name & classification */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3.5">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-serif text-lg font-bold shrink-0 ${
              isChild
                ? 'bg-[#E5CDBE]/50 text-[#9C6A61] border border-[#9C6A61]/20'
                : 'bg-[#B49361]/20 text-[#242326] border border-[#B49361]/30'
            }`}>
              {member.name.charAt(0)}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif text-base sm:text-lg font-semibold text-[#242326]">
                  {member.name}
                </h3>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                  isChild ? 'bg-[#9C6A61]/15 text-[#9C6A61]' : 'bg-[#242326]/8 text-[#242326]'
                }`}>
                  {member.relationship}
                </span>
              </div>
              <p className="text-xs text-[#5C585E] mt-0.5">
                {member.classification} {member.ageRange ? `· ${member.ageRange}` : ''}
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => onEdit(member)}
              className="p-2 rounded-xl text-[#5C585E] hover:text-[#242326] hover:bg-[#F6F2EC] transition-colors cursor-pointer"
              title="Edit Profile"
              aria-label="Edit Profile"
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete(member.id)}
              className="p-2 rounded-xl text-[#5C585E] hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
              title="Remove Family Member"
              aria-label="Remove Family Member"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Sizes Grid */}
        <div className="grid grid-cols-3 gap-2 text-xs mb-3.5">
          <div className="p-2.5 rounded-xl bg-[#F6F2EC]">
            <span className="text-[10px] uppercase tracking-wider text-[#5C585E] block">Tops</span>
            <span className="font-semibold text-[#242326] truncate block">{member.sizes.topsSize || '—'}</span>
          </div>
          <div className="p-2.5 rounded-xl bg-[#F6F2EC]">
            <span className="text-[10px] uppercase tracking-wider text-[#5C585E] block">Bottoms</span>
            <span className="font-semibold text-[#242326] truncate block">{member.sizes.bottomsSize || '—'}</span>
          </div>
          <div className="p-2.5 rounded-xl bg-[#F6F2EC]">
            <span className="text-[10px] uppercase tracking-wider text-[#5C585E] block">Shoes</span>
            <span className="font-semibold text-[#242326] truncate block">{member.sizes.shoeSize || '—'}</span>
          </div>
        </div>

        {/* Aesthetics & Favorite Colors */}
        <div className="space-y-2 mb-3 text-xs">
          <div>
            <span className="text-[11px] text-[#5C585E] font-medium block mb-1">Style Aesthetics:</span>
            <div className="flex flex-wrap gap-1.5">
              {member.favoriteStyles.map((style) => (
                <span
                  key={style}
                  className="px-2.5 py-0.5 rounded-md bg-[#FAF7F2] text-[#242326] text-[11px] border border-[#242326]/6"
                >
                  {style}
                </span>
              ))}
            </div>
          </div>

          <div>
            <span className="text-[11px] text-[#5C585E] font-medium block mb-1">Favorite Colors:</span>
            <div className="flex flex-wrap gap-1.5">
              {member.favoriteColors.map((color) => (
                <span
                  key={color}
                  className="px-2 py-0.5 rounded-md bg-[#F6F2EC] text-[#5C585E] text-[10px]"
                >
                  {color}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Comfort & Sensory Preferences */}
        {member.comfortPreferences.length > 0 && (
          <div className="pt-2.5 border-t border-[#242326]/6">
            <span className="text-[11px] text-[#5C585E] font-medium block mb-1 flex items-center gap-1">
              <Heart className="w-3 h-3 text-[#9C6A61]" />
              Comfort & Sensory Needs:
            </span>
            <div className="flex flex-wrap gap-1">
              {member.comfortPreferences.map((pref) => (
                <span
                  key={pref}
                  className="px-2 py-0.5 rounded-md bg-[#E5CDBE]/30 text-[#794E46] text-[10px] font-medium"
                >
                  {pref}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Child Privacy Reassurance */}
      {isChild && (
        <div className="mt-4 pt-3 border-t border-[#242326]/6 flex items-center gap-1.5 text-[11px] text-[#5C585E]">
          <ShieldCheck className="w-3.5 h-3.5 text-[#9C6A61] shrink-0" />
          <span className="truncate">Private device sandbox protection active</span>
        </div>
      )}
    </div>
  );
};
