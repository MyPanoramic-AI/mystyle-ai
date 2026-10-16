/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { CapsuleCollection, WardrobeItem } from '../../types/wardrobe';
import { Sparkles, Layers, ArrowRight } from 'lucide-react';

interface CapsuleCollectionsViewProps {
  capsules: CapsuleCollection[];
  wardrobeItems: WardrobeItem[];
  onExploreCapsuleInStudio: (capsule: CapsuleCollection) => void;
  onAskStylistCapsule: (capsule: CapsuleCollection) => void;
}

export const CapsuleCollectionsView: React.FC<CapsuleCollectionsViewProps> = ({
  capsules,
  wardrobeItems,
  onExploreCapsuleInStudio,
  onAskStylistCapsule,
}) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#242326]">
          Curated Capsule Wardrobes
        </h2>
        <p className="text-xs text-[#5C585E] mt-0.5">
          Mathematical styling efficiency: Small, versatile collections designed to yield dozens of high-harmony outfits.
        </p>
      </div>

      <div className="space-y-6">
        {capsules.map((capsule) => {
          const matchingItems = capsule.itemIds
            .map((id) => wardrobeItems.find((i) => i.id === id))
            .filter(Boolean) as WardrobeItem[];

          return (
            <div
              key={capsule.id}
              className="bg-white rounded-3xl overflow-hidden border border-[#242326]/8 shadow-xs hover:shadow-md transition-all flex flex-col md:flex-row"
            >
              {/* Visual image */}
              <div className="md:w-1/3 aspect-4/3 md:aspect-auto overflow-hidden bg-[#F6F2EC] relative shrink-0">
                <img
                  src={capsule.imageUrl}
                  alt={capsule.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-3 left-3 bg-[#242326]/85 backdrop-blur-md px-2.5 py-1 rounded-md text-[10px] uppercase font-bold text-white">
                  {capsule.season}
                </div>
              </div>

              {/* Capsule Content */}
              <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs text-[#9C6A61] font-mono uppercase font-semibold">
                    <Layers className="w-3.5 h-3.5" />
                    <span>{capsule.itemCount} Essential Pieces • {capsule.potentialOutfitsCount}+ Outfits</span>
                  </div>

                  <h3 className="font-serif text-xl font-bold text-[#242326]">
                    {capsule.title}
                  </h3>
                  <p className="text-xs text-[#B49361] font-medium">
                    {capsule.subtitle}
                  </p>
                  <p className="text-xs text-[#5C585E] leading-relaxed">
                    {capsule.description}
                  </p>

                  {/* Items Strip */}
                  <div className="pt-3">
                    <span className="text-[10px] font-mono uppercase text-[#5C585E] block mb-2">
                      Core Foundation Garments ({matchingItems.length} in Wardrobe):
                    </span>
                    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
                      {matchingItems.map((item) => (
                        <div
                          key={item.id}
                          className="w-12 h-14 rounded-xl overflow-hidden shrink-0 border border-[#242326]/10 relative group"
                          title={`${item.name} (${item.brand})`}
                        >
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-4 border-t border-[#242326]/6 flex items-center justify-between gap-3">
                  <button
                    onClick={() => onAskStylistCapsule(capsule)}
                    className="px-3.5 py-2 text-xs font-medium text-[#242326] bg-[#F6F2EC] hover:bg-[#E5CDBE]/40 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-[#B49361]" />
                    <span>Consult Stylist on Capsule</span>
                  </button>

                  <button
                    onClick={() => onExploreCapsuleInStudio(capsule)}
                    className="px-4 py-2 text-xs font-medium text-white bg-[#9C6A61] hover:bg-[#8A5B53] rounded-xl transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                  >
                    <span>Style in Outfit Studio</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
