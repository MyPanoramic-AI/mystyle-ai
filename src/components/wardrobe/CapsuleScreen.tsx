/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Check, Shirt } from 'lucide-react';
import { ImageWithFallback } from '../common/ImageWithFallback';
import { accountApi, AccountApiError, type WardrobeCapsulePiece } from '../../services/accountApi';
import type { NavigationTab } from '../../types';

const SECTION_ORDER: { id: string; label: string; categories: string[] }[] = [
  { id: 'tops', label: 'Tops', categories: ['tops'] },
  { id: 'bottoms', label: 'Bottoms', categories: ['bottoms'] },
  { id: 'dresses', label: 'Dresses', categories: ['dresses'] },
  { id: 'outerwear', label: 'Outerwear', categories: ['outerwear'] },
  { id: 'shoes', label: 'Shoes', categories: ['shoes'] },
  { id: 'finish', label: 'Bags & accessories', categories: ['bags', 'accessories'] },
];

const FALLBACK_PALETTE = [
  { name: 'Black', hex: '#1E1D20' },
  { name: 'White', hex: '#FFFFFF' },
  { name: 'Cream', hex: '#F2E8D9' },
  { name: 'Beige', hex: '#C4A574' },
  { name: 'Cognac', hex: '#8B5E3C' },
  { name: 'Olive', hex: '#6B7355' },
  { name: 'Denim', hex: '#4A6FA5' },
  { name: 'Gold', hex: '#D4AF37' },
];

const FALLBACK_RULES = [
  'Stick to a cohesive neutral palette.',
  'Choose quality over quantity.',
  'Everything should mix and match.',
];

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
  const [palette, setPalette] = useState(FALLBACK_PALETTE);
  const [rules, setRules] = useState<string[]>(FALLBACK_RULES);
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
      if (capsule.palette?.length) setPalette(capsule.palette);
      if (capsule.rules?.length) setRules(capsule.rules);
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
  const sections = useMemo(
    () => SECTION_ORDER.map((section) => ({
      ...section,
      items: pieces.filter((piece) => section.categories.includes(piece.category)),
    })).filter((section) => section.items.length > 0),
    [pieces],
  );

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
              Mix-and-match foundations
            </p>
            <h1 className="font-serif text-xl sm:text-2xl font-bold text-[#242326]">
              Neutral Capsule Wardrobe
            </h1>
          </div>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 space-y-8">
        <div className="max-w-2xl space-y-3">
          <p className="text-sm text-[#5C585E]">
            The same capsule for everyone — neutrals that layer into dozens of outfits. Build toward these pieces; tick off what you already own.
          </p>
          <ul className="space-y-1.5">
            {rules.map((rule) => (
              <li key={rule} className="text-xs text-[#242326] flex items-start gap-2">
                <span className="mt-1.5 w-1 h-1 rounded-full bg-[#B49361] shrink-0" />
                {rule}
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[#91635a]">Palette</span>
            {palette.map((swatch) => (
              <span key={swatch.name} className="inline-flex items-center gap-1.5 text-[11px] text-[#5C585E]">
                <span
                  className="w-4 h-4 rounded-full border border-[#242326]/15 shrink-0"
                  style={{ backgroundColor: swatch.hex }}
                  title={swatch.name}
                />
                {swatch.name}
              </span>
            ))}
          </div>
        </div>

        {loading && <p className="text-xs text-[#5C585E]">Gathering your capsule checklist.</p>}
        {error && <p className="text-xs text-[#9C6A61]">{error}</p>}

        {!loading && !usesAccount && (
          <div className="rounded-2xl border border-[#242326]/8 bg-white p-6 max-w-lg">
            <p className="text-sm text-[#242326] mb-4">Sign in to see which capsule pieces are already in your wardrobe.</p>
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
            <p className="text-sm text-[#242326] mb-4">The capsule checklist could not be loaded. Open My Profile and try this tab again.</p>
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
            <p className="text-xs text-[#5C585E]">
              {ownedCount} of {pieces.length} already in your wardrobe.
            </p>

            {sections.map((section) => (
              <section key={section.id} className="space-y-3">
                <div className="flex items-baseline justify-between gap-3 border-b border-[#242326]/8 pb-2">
                  <h2 className="font-serif text-lg font-semibold text-[#242326]">{section.label}</h2>
                  <span className="text-[10px] uppercase tracking-wider text-[#5C585E] font-semibold">
                    {section.items.length} pieces
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                  {section.items.map((piece, index) => (
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
                          {index + 1}
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
                          <h3 className="font-serif text-sm font-semibold text-[#242326] leading-snug">{piece.name}</h3>
                          <p className="text-[11px] text-[#5C585E] mt-1">
                            {piece.colour}{piece.sizeLabel ? ` · ${piece.sizeLabel}` : ''}
                          </p>
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
              </section>
            ))}
          </>
        )}
      </main>
    </div>
  );
};
