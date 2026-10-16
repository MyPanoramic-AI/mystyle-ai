/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Button } from '../common/Button';
import { familyService } from '../../services/familyService';
import { FamilyProfile } from '../../types/family';
import { Users, Sparkles, ArrowRight, Palette, ShieldCheck } from 'lucide-react';

interface FamilyStylingCardProps {
  onOpenFamily: () => void;
}

export const FamilyStylingCard: React.FC<FamilyStylingCardProps> = ({ onOpenFamily }) => {
  const [members, setMembers] = useState<FamilyProfile[]>(() =>
    familyService.getFamilyMembers()
  );

  useEffect(() => {
    const unsub = familyService.subscribe(() => {
      setMembers(familyService.getFamilyMembers());
    });
    return unsub;
  }, []);

  return (
    <div className="relative rounded-3xl overflow-hidden bg-[#242326] text-white border border-[#242326]/10 shadow-sm">
      {/* Background Editorial Image */}
      <div className="absolute inset-0">
        <img
          src="https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=1200&q=80"
          alt="Coordinated Family Styling"
          className="w-full h-full object-cover opacity-25 object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#242326] via-[#242326]/90 to-transparent" />
      </div>

      {/* Content */}
      <div className="relative z-10 p-6 sm:p-8 max-w-xl">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[#B49361] bg-[#B49361]/20 px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
            <Users className="w-3 h-3" />
            Family Styling Hub
          </span>
          <span className="text-[10px] text-white/60">
            {members.length} Profiles Saved
          </span>
        </div>

        <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-white mb-2 leading-tight">
          Coordinated Outfits for Family Milestones
        </h2>

        <p className="text-xs sm:text-sm text-white/80 leading-relaxed mb-6">
          Take the stress out of wedding guest wear, family portraits, and holiday gatherings. Harmonise curated South African palettes so everyone looks cohesive, comfortable, and elegant.
        </p>

        {/* Member Avatars Row */}
        <div className="flex items-center gap-2 mb-6 bg-white/5 backdrop-blur-xs p-2.5 rounded-2xl border border-white/10 w-fit">
          <div className="flex items-center -space-x-2">
            {members.slice(0, 4).map((m) => (
              <div
                key={m.id}
                className="w-8 h-8 rounded-full bg-[#E5CDBE] text-[#242326] font-serif font-bold text-xs flex items-center justify-center border-2 border-[#242326] shadow-xs"
                title={`${m.name} (${m.relationship})`}
              >
                {m.name.charAt(0)}
              </div>
            ))}
          </div>
          <span className="text-xs text-white/90 font-medium pl-1">
            {members.map((m) => m.name).join(', ')}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={onOpenFamily} variant="primary">
            <span className="flex items-center gap-2">
              <span>Coordinate Family Outfits</span>
              <ArrowRight className="w-4 h-4" />
            </span>
          </Button>

          <div className="flex items-center gap-1.5 text-[11px] text-white/60">
            <ShieldCheck className="w-3.5 h-3.5 text-[#B49361]" />
            <span>Private device sandbox</span>
          </div>
        </div>
      </div>
    </div>
  );
};
