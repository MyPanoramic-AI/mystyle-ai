/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  CompleteBeautyLook,
  HairstyleItem,
  HairColorItem,
  MakeupItem,
  NailItem,
  BeautyProductItem,
} from '../../types/beauty';
import { ImageWithFallback } from '../common/ImageWithFallback';
import { X, Sparkles, ShoppingBag, Check } from 'lucide-react';

interface BeautyDetailModalProps {
  item: CompleteBeautyLook | HairstyleItem | HairColorItem | MakeupItem | NailItem | null;
  isOpen: boolean;
  onClose: () => void;
  onAskStylist?: (prompt: string) => void;
  onAddToBag?: (product: BeautyProductItem) => void;
  onSendLookToShop?: (look: CompleteBeautyLook) => void;
}

export const BeautyDetailModal: React.FC<BeautyDetailModalProps> = ({
  item,
  isOpen,
  onClose,
  onAskStylist,
  onAddToBag,
  onSendLookToShop,
}) => {
  if (!isOpen || !item) return null;

  const isCompleteLook = item.category === 'complete-looks';
  const completeLook = isCompleteLook ? (item as CompleteBeautyLook) : null;

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
              Beauty Studio Consultation
            </span>
            <h3 className="font-serif text-lg font-bold text-[#242326] leading-tight">
              {item.title}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-black/5 text-[#5C585E] hover:text-[#242326] transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto p-6 space-y-6">
          {/* Main Visual showcase */}
          <div className="relative aspect-16/10 rounded-2xl overflow-hidden bg-[#F6F2EC]">
            <ImageWithFallback
              src={item.imageUrl}
              alt={item.title}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Description & Overview */}
          <div>
            <h4 className="text-xs font-mono tracking-wider uppercase text-[#5C585E] mb-1">
              Stylist Notes & Editorial Direction
            </h4>
            <p className="text-sm text-[#242326] leading-relaxed">
              {item.description}
            </p>
          </div>

          {/* Specific attributes for Hairstyles */}
          {item.category === 'hairstyles' && (
            <div className="space-y-4 bg-[#F6F2EC]/40 p-4 rounded-2xl border border-[#242326]/6">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="text-[#5C585E] block text-[10px] uppercase font-mono">Length & Texture</span>
                  <span className="font-semibold text-[#242326] capitalize">{(item as HairstyleItem).length} • {(item as HairstyleItem).texture}</span>
                </div>
                <div>
                  <span className="text-[#5C585E] block text-[10px] uppercase font-mono">Maintenance</span>
                  <span className="font-semibold text-[#242326] capitalize">{(item as HairstyleItem).maintenanceLevel} Maintenance</span>
                </div>
                <div>
                  <span className="text-[#5C585E] block text-[10px] uppercase font-mono">Vibe</span>
                  <span className="font-semibold text-[#242326]">{(item as HairstyleItem).vibe}</span>
                </div>
              </div>

              <div>
                <span className="text-[#5C585E] block text-[10px] uppercase font-mono mb-1">Recommended Neckline Pairings</span>
                <div className="flex flex-wrap gap-1.5">
                  {(item as HairstyleItem).necklinePairings.map((neck, i) => (
                    <span key={i} className="px-2.5 py-1 bg-white rounded-md text-xs font-medium text-[#242326] border border-[#242326]/6">
                      {neck}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <span className="text-[#5C585E] block text-[10px] uppercase font-mono mb-1">Ideal Face Shapes</span>
                <div className="flex flex-wrap gap-1.5">
                  {(item as HairstyleItem).faceShapes.map((shape, i) => (
                    <span key={i} className="px-2.5 py-1 bg-white rounded-md text-xs font-medium text-[#242326] border border-[#242326]/6">
                      {shape}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Specific attributes for Hair Colours */}
          {item.category === 'hair-colours' && (
            <div className="space-y-3 bg-[#F6F2EC]/40 p-4 rounded-2xl border border-[#242326]/6">
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-full border-2 border-white shadow-sm"
                  style={{ backgroundColor: (item as HairColorItem).swatchHex }}
                />
                <div>
                  <span className="text-[10px] font-mono uppercase text-[#5C585E]">Tone & Undertone</span>
                  <p className="text-xs font-semibold text-[#242326] capitalize">
                    {(item as HairColorItem).tone} Tone • {(item as HairColorItem).shadeFamily.replace('-', ' ')}
                  </p>
                </div>
              </div>
              <div>
                <span className="text-[#5C585E] block text-[10px] uppercase font-mono mb-1">Flattering Skin Undertones</span>
                <div className="flex flex-wrap gap-1.5">
                  {(item as HairColorItem).bestSkinUndertones.map((tone, i) => (
                    <span key={i} className="px-2.5 py-1 bg-white rounded-md text-xs font-medium text-[#242326] border border-[#242326]/6">
                      {tone}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Specific attributes for Makeup */}
          {item.category === 'makeup' && (
            <div className="space-y-3 bg-[#F6F2EC]/40 p-4 rounded-2xl border border-[#242326]/6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-6 h-6 rounded-full border-2 border-white shadow-xs shrink-0"
                    style={{ backgroundColor: (item as MakeupItem).lipHex }}
                  />
                  <div>
                    <span className="text-[#5C585E] block text-[10px] uppercase font-mono">Lip Profile</span>
                    <span className="font-semibold text-[#242326]">{(item as MakeupItem).lipShade}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-6 h-6 rounded-full border-2 border-white shadow-xs shrink-0"
                    style={{ backgroundColor: (item as MakeupItem).blushHex }}
                  />
                  <div>
                    <span className="text-[#5C585E] block text-[10px] uppercase font-mono">Cheek Glow</span>
                    <span className="font-semibold text-[#242326]">{(item as MakeupItem).blushTone}</span>
                  </div>
                </div>
              </div>
              <div className="pt-2 border-t border-[#242326]/6 text-xs">
                <span className="text-[#5C585E] block text-[10px] uppercase font-mono">Eye Styling</span>
                <span className="font-medium text-[#242326]">{(item as MakeupItem).eyeLook}</span>
              </div>
            </div>
          )}

          {/* Complete Look Breakdowns */}
          {completeLook && (
            <div className="space-y-4">
              <h4 className="text-xs font-mono tracking-wider uppercase text-[#5C585E]">
                Harmonised Look Elements
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-[#F6F2EC]/60 rounded-xl">
                  <span className="text-[10px] font-mono text-[#9C6A61] uppercase block">Hairstyle</span>
                  <span className="text-xs font-semibold text-[#242326] block mt-0.5">{completeLook.hairstyle.title}</span>
                  <span className="text-[11px] text-[#5C585E]">{completeLook.hairstyle.vibe}</span>
                </div>
                <div className="p-3 bg-[#F6F2EC]/60 rounded-xl">
                  <span className="text-[10px] font-mono text-[#9C6A61] uppercase block">Hair Colour</span>
                  <span className="text-xs font-semibold text-[#242326] block mt-0.5">{completeLook.hairColor.title}</span>
                  <span className="text-[11px] text-[#5C585E]">{completeLook.hairColor.tone} tone</span>
                </div>
                <div className="p-3 bg-[#F6F2EC]/60 rounded-xl">
                  <span className="text-[10px] font-mono text-[#9C6A61] uppercase block">Makeup</span>
                  <span className="text-xs font-semibold text-[#242326] block mt-0.5">{completeLook.makeup.style.replace('-', ' ')}</span>
                  <span className="text-[11px] text-[#5C585E]">{completeLook.makeup.lipShade}</span>
                </div>
                <div className="p-3 bg-[#F6F2EC]/60 rounded-xl">
                  <span className="text-[10px] font-mono text-[#9C6A61] uppercase block">Nail Aesthetic</span>
                  <span className="text-xs font-semibold text-[#242326] block mt-0.5">{completeLook.nails.title}</span>
                  <span className="text-[11px] text-[#5C585E]">{completeLook.nails.shape} shape</span>
                </div>
              </div>

              {/* Curated Products List */}
              <div className="pt-2">
                <h5 className="text-xs font-mono tracking-wider uppercase text-[#5C585E] mb-2">
                  Curated Retail Products ({completeLook.curatedProducts.length})
                </h5>
                <div className="space-y-2">
                  {completeLook.curatedProducts.map((prod) => (
                    <div
                      key={prod.id}
                      className="p-3 bg-white rounded-xl border border-[#242326]/8 flex items-center justify-between gap-3 shadow-xs"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={prod.imageUrl}
                          alt={prod.name}
                          className="w-12 h-12 rounded-lg object-cover bg-[#F6F2EC]"
                        />
                        <div>
                          <span className="text-[10px] font-mono text-[#9C6A61] uppercase block">{prod.brand}</span>
                          <span className="text-xs font-semibold text-[#242326] block">{prod.name}</span>
                          <span className="text-[11px] text-[#5C585E]">{prod.retailer}</span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-xs font-bold text-[#242326] block">R{prod.priceZar.toLocaleString()}</span>
                        {onAddToBag && (
                          <button
                            onClick={() => onAddToBag(prod)}
                            className="mt-1 px-2.5 py-1 text-[11px] font-medium text-[#9C6A61] hover:text-[#8A5B53] bg-[#E5CDBE]/20 rounded-md transition-colors cursor-pointer"
                          >
                            Add to Bag
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-[#242326]/8 bg-[#F6F2EC]/40 flex flex-wrap items-center justify-between gap-3">
          {onAskStylist && (
            <button
              onClick={() => {
                onAskStylist(
                  `I'd love advice on adopting "${item.title}". How would you tailor this beauty look for my personal undertone and wardrobe?`
                );
                onClose();
              }}
              className="px-4 py-2 text-xs font-medium text-[#242326] bg-white border border-[#242326]/12 hover:border-[#242326]/30 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#B49361]" />
              <span>Ask Personal Stylist</span>
            </button>
          )}

          {completeLook && onSendLookToShop && (
            <button
              onClick={() => {
                onSendLookToShop(completeLook);
                onClose();
              }}
              className="px-4 py-2 text-xs font-medium text-white bg-[#9C6A61] hover:bg-[#8A5B53] rounded-xl transition-all cursor-pointer shadow-xs flex items-center gap-1.5 ml-auto"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Shop Complete Look Products</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
