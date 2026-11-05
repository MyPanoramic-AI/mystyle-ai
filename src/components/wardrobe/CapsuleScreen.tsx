/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { ArrowLeft, Check, Shirt } from 'lucide-react';
import { ImageWithFallback } from '../common/ImageWithFallback';
import { accountApi, AccountApiError, type WardrobeCapsulePiece } from '../../services/accountApi';
import type { NavigationTab } from '../../types';

const CATEGORY_LABEL: Record<string, string> = {
  tops: 'Top',
  bottoms: 'Bottom',
  dresses: 'Dress',
  outerwear: 'Outerwear',
  shoes: 'Shoes',
  bags: 'Bag',
  accessories: 'Accessory',
};

interface CapsuleScreenProps {
  usesAccount: boolean;
  onBack: () => void;
  onNavigate: (tab: NavigationTab) => void;
  onTryPiece: (piece: WardrobeCapsulePiece) => void;
}

export const CapsuleScreen: React.FC<CapsuleScreenProps> = ({
  usesAccount,
  onBack,
  onNavigate,
  onTryPiece,
}) => {
  const [pieces, setPieces] = useState<WardrobeCapsulePiece[]>([]);
  const [loading, setLoading] = useState(usesAccount);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!usesAccount) {
      setLoading(false);
      return undefined;
    }
    let cancelled = false;
    setLoading(true);
    void accountApi.wardrobeCapsule().then((capsule) => {
      if (cancelled) return;
      setPieces(capsule.pieces);
      setError(null);
    }).catch((caught: unknown) => {
      if (cancelled) return;
      setError(caught instanceof AccountApiError ? caught.message : 'Your style capsule could not be loaded.');
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [usesAccount]);

  const ownedCount = pieces.filter((piece) => piece.owned).length;

  return (
    <div className="min-h-screen bg-[#FBF8F5] pb-24">
      <div className="bg-white border-b border-[#242326]/8 sticky top-16 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 -ml-2 rounded-xl text-[#5C585E] hover:text-[#242326] hover:bg-[#F6F2EC] transition-colors cursor-pointer"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <p className="text-[10px] font-mono tracking-widest text-[#B49361] uppercase font-semibold">
              Everyone should own
            </p>
            <h1 className="font-serif text-xl sm:text-2xl font-bold text-[#242326]">
              Everyday staples
            </h1>
          </div>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-6">
        <p className="text-sm text-[#5C585E] max-w-2xl mb-6">
          These 10 staples are the same for everyone: a floral dress, black leggings, a gold necklace, a brown jacket, blue jeans, black boots, a handbag, nude heels, a black dress, and a colourful blouse.
        </p>

        {loading && <p className="text-xs text-[#5C585E]">Gathering your 10 basics.</p>}
        {error && <p className="text-xs text-[#9C6A61]">{error}</p>}

        {!loading && !usesAccount && (
          <div className="rounded-2xl border border-[#242326]/8 bg-white p-6 max-w-lg">
            <p className="text-sm text-[#242326] mb-4">Sign in to see which of the 10 everyday staples are already in your wardrobe.</p>
            <button
              type="button"
              onClick={() => onNavigate('profile')}
              className="px-3.5 py-2 bg-[#9C6A61] hover:bg-[#8A5B53] text-white text-xs font-medium rounded-xl cursor-pointer"
            >
              Open My Profile
            </button>
          </div>
        )}

        {!loading && usesAccount && !error && pieces.length === 0 && (
          <div className="rounded-2xl border border-[#242326]/8 bg-white p-6 max-w-lg">
            <p className="text-sm text-[#242326] mb-4">The 10 everyday staples could not be loaded. Open My Profile and try this tab again.</p>
            <button
              type="button"
              onClick={() => onNavigate('profile')}
              className="px-3.5 py-2 bg-[#9C6A61] hover:bg-[#8A5B53] text-white text-xs font-medium rounded-xl cursor-pointer"
            >
              Open My Profile
            </button>
          </div>
        )}

        {pieces.length > 0 && (
          <>
            <p className="text-xs text-[#5C585E] mb-4">
              {ownedCount} of {pieces.length} already in your wardrobe.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {pieces.map((piece, index) => (
                <article
                  key={piece.name}
                  className="bg-white rounded-2xl overflow-hidden border border-[#242326]/8 shadow-xs flex flex-col"
                >
                  <div className="relative aspect-3/4 bg-[#F6F2EC]">
                    <ImageWithFallback
                      src={piece.imageUrl}
                      alt={piece.name}
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute top-2.5 left-2.5 bg-[#242326]/85 text-white text-[9px] tracking-wider uppercase font-semibold px-2 py-0.5 rounded-md">
                      {index + 1} · {CATEGORY_LABEL[piece.category] ?? piece.category}
                    </span>
                    {piece.owned && (
                      <span className="absolute bottom-2.5 left-2.5 inline-flex items-center gap-1 bg-[#B49361]/90 text-white text-[9px] font-semibold px-2 py-0.5 rounded-md">
                        <Check className="w-2.5 h-2.5" />
                        In your wardrobe
                      </span>
                    )}
                  </div>
                  <div className="p-3.5 flex flex-col gap-2 flex-1">
                    <div>
                      <h2 className="font-serif text-sm font-semibold text-[#242326] leading-snug">{piece.name}</h2>
                      <p className="text-[11px] text-[#5C585E] mt-1">{piece.colour}{piece.sizeLabel ? ` · ${piece.sizeLabel}` : ''}</p>
                      <p className="text-[11px] text-[#242326] mt-1">
                        <span className="font-semibold uppercase tracking-wider text-[9px] text-[#91635a] mr-1.5">Material</span>
                        {piece.fabric}
                      </p>
                      <p className="text-[11px] text-[#5C585E] mt-1">{piece.pairingNotes}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onTryPiece(piece)}
                      className="mt-auto inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 text-[11px] font-medium text-[#9C6A61] bg-[#E5CDBE]/25 hover:bg-[#E5CDBE]/50 rounded-lg cursor-pointer"
                    >
                      <Shirt className="w-3 h-3" />
                      Try on
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
};
