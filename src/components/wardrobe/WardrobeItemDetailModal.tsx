/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { WardrobeItem } from '../../types/wardrobe';
import { ImageWithFallback } from '../common/ImageWithFallback';
import {
  X,
  Sparkles,
  Plus,
  CheckCircle2,
  Trash2,
  Clock,
  Star,
  Tag,
  Info,
} from 'lucide-react';

interface WardrobeItemDetailModalProps {
  item: WardrobeItem | null;
  isOpen: boolean;
  onClose: () => void;
  allWardrobeItems: WardrobeItem[];
  onAddToOutfit?: (item: WardrobeItem) => void;
  onLogWear?: (itemId: string) => void;
  onDelete?: (itemId: string) => void;
  onAskStylist?: (prompt: string) => void;
}

export const WardrobeItemDetailModal: React.FC<WardrobeItemDetailModalProps> = ({
  item,
  isOpen,
  onClose,
  allWardrobeItems,
  onAddToOutfit,
  onLogWear,
  onDelete,
  onAskStylist,
}) => {
  if (!isOpen || !item) return null;

  // Find complementary items from the wardrobe in other categories
  const suggestedPairings = allWardrobeItems
    .filter((i) => i.id !== item.id && i.category !== item.category)
    .slice(0, 3);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-2xl max-h-[90vh] bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col border border-[#242326]/10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#242326]/8 bg-[#F6F2EC]/60">
          <div>
            <span className="text-[10px] font-mono tracking-wider text-[#9C6A61] uppercase font-semibold">
              Wardrobe Piece Dossier
            </span>
            <h3 className="font-serif text-lg font-bold text-[#242326] leading-tight">
              {item.name}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-black/5 text-[#5C585E] hover:text-[#242326] transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto p-6 space-y-6">
          {/* Main Visual & Key Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="relative aspect-3/4 rounded-2xl overflow-hidden bg-[#F6F2EC] border border-[#242326]/6">
              <ImageWithFallback
                src={item.imageUrl}
                alt={item.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-3 left-3 bg-[#242326]/85 backdrop-blur-md px-2.5 py-1 rounded-md text-[10px] tracking-wider uppercase font-semibold text-white">
                {item.brand}
              </div>
              <div
                className="absolute top-3 right-3 w-6 h-6 rounded-full border-2 border-white shadow-md"
                style={{ backgroundColor: item.colorHex }}
                title={item.color}
              />
            </div>

            <div className="flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="p-3.5 bg-[#F6F2EC]/60 rounded-xl border border-[#242326]/6 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#5C585E]">Category:</span>
                    <span className="font-semibold text-[#242326] capitalize">
                      {item.category} ({item.subcategory})
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#5C585E]">Primary Shade:</span>
                    <span className="font-semibold text-[#242326]">{item.color}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#5C585E]">Seasons:</span>
                    <span className="font-semibold text-[#242326] capitalize">
                      {item.seasons.join(', ')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#5C585E]">Occasions:</span>
                    <span className="font-semibold text-[#242326] capitalize">
                      {item.occasions.join(', ')}
                    </span>
                  </div>
                </div>

                {/* Wear analytics */}
                <div className="p-3.5 bg-white rounded-xl border border-[#242326]/8 space-y-1.5 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-[#5C585E] flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-[#B49361]" />
                      <span>Wear History:</span>
                    </span>
                    <span className="text-sm font-bold text-[#242326]">{item.timesWorn} times</span>
                  </div>
                  {item.lastWornDate && (
                    <p className="text-[11px] text-[#5C585E]">Last worn {item.lastWornDate}</p>
                  )}
                  {item.isCapsuleStaple && (
                    <div className="pt-1.5 border-t border-[#242326]/6 flex items-center gap-1.5 text-xs text-[#B49361] font-medium">
                      <Star className="w-3.5 h-3.5 fill-current" />
                      <span>Curated Capsule Foundation Piece</span>
                    </div>
                  )}
                </div>

                {/* Fabric & Care */}
                {(item.fabric || item.careNote) && (
                  <div className="p-3 bg-[#F6F2EC]/40 rounded-xl text-xs space-y-1">
                    {item.fabric && (
                      <p className="text-[#242326]">
                        <span className="text-[#5C585E] font-medium">Fabric: </span>
                        {item.fabric}
                      </p>
                    )}
                    {item.careNote && (
                      <p className="text-[#5C585E] italic text-[11px]">Care: {item.careNote}</p>
                    )}
                  </div>
                )}
              </div>

              {/* Log wear button */}
              {onLogWear && (
                <button
                  onClick={() => onLogWear(item.id)}
                  className="w-full py-2 px-3 text-xs font-medium text-[#242326] bg-[#F6F2EC] hover:bg-[#E5CDBE]/40 rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#B49361]" />
                  <span>Log Worn Today (+1 Count)</span>
                </button>
              )}
            </div>
          </div>

          {/* Styling Notes */}
          {item.pairingNotes && (
            <div className="p-4 bg-[#FBF8F5] rounded-2xl border border-[#242326]/6">
              <h4 className="text-xs font-mono uppercase tracking-wider text-[#9C6A61] mb-1 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5" />
                <span>Personal Styling Direction</span>
              </h4>
              <p className="text-xs text-[#242326] leading-relaxed">{item.pairingNotes}</p>
            </div>
          )}

          {/* Complementary pieces from own wardrobe */}
          {suggestedPairings.length > 0 && (
            <div>
              <h4 className="text-xs font-mono uppercase tracking-wider text-[#5C585E] mb-2.5">
                Recommended Pairings From Your Wardrobe
              </h4>
              <div className="grid grid-cols-3 gap-3">
                {suggestedPairings.map((pair) => (
                  <div
                    key={pair.id}
                    className="p-2 bg-[#F6F2EC]/60 rounded-xl border border-[#242326]/6 flex flex-col items-center text-center group cursor-pointer hover:bg-[#E5CDBE]/20 transition-colors"
                    onClick={() => onAddToOutfit && onAddToOutfit(pair)}
                  >
                    <img
                      src={pair.imageUrl}
                      alt={pair.name}
                      className="w-16 h-16 rounded-lg object-cover mb-1.5 shadow-2xs"
                    />
                    <span className="text-[10px] font-mono text-[#9C6A61] uppercase line-clamp-1">
                      {pair.brand}
                    </span>
                    <span className="text-xs font-medium text-[#242326] line-clamp-1">
                      {pair.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 border-t border-[#242326]/8 bg-[#F6F2EC]/40 flex flex-wrap items-center justify-between gap-3">
          {onDelete && (
            <button
              onClick={() => {
                if (window.confirm(`Remove "${item.name}" from your wardrobe?`)) {
                  onDelete(item.id);
                  onClose();
                }
              }}
              className="px-3 py-1.5 text-xs text-[#B45309] hover:text-[#991B1B] transition-colors cursor-pointer flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Remove Piece</span>
            </button>
          )}

          <div className="flex items-center gap-2 ml-auto">
            {onAskStylist && (
              <button
                onClick={() => {
                  onAskStylist(
                    `How should I style my ${item.brand} "${item.name}" (${item.color}) for an upcoming event? What accessories and shoes pair best?`
                  );
                  onClose();
                }}
                className="px-3.5 py-2 text-xs font-medium text-[#242326] bg-white border border-[#242326]/12 hover:border-[#242326]/30 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#B49361]" />
                <span>Ask Stylist</span>
              </button>
            )}

            {onAddToOutfit && (
              <button
                onClick={() => {
                  onAddToOutfit(item);
                  onClose();
                }}
                className="px-4 py-2 text-xs font-medium text-white bg-[#9C6A61] hover:bg-[#8A5B53] rounded-xl transition-all cursor-pointer shadow-xs flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add to Outfit Builder</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
