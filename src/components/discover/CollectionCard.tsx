/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { FashionCollection } from '../../types/discover';
import { ImageWithFallback } from '../common/ImageWithFallback';
import { ArrowRight, Sparkles } from 'lucide-react';

interface CollectionCardProps {
  collection: FashionCollection;
  lookCount: number;
  isSelected?: boolean;
  onExplore: (collection: FashionCollection) => void;
}

export const CollectionCard: React.FC<CollectionCardProps> = ({
  collection,
  lookCount,
  isSelected,
  onExplore,
}) => {
  return (
    <div
      onClick={() => onExplore(collection)}
      className={`group relative flex flex-col rounded-3xl overflow-hidden bg-white border transition-all duration-300 cursor-pointer text-left shadow-xs hover:shadow-lg shrink-0 w-[260px] sm:w-[300px] ${
        isSelected
          ? 'border-[#9C6A61] ring-2 ring-[#9C6A61]/30 shadow-md'
          : 'border-[#242326]/10 hover:border-[#9C6A61]/50'
      }`}
    >
      {/* Visual Image Banner */}
      <div className="relative aspect-16/10 w-full overflow-hidden bg-[#FAF7F2]">
        <ImageWithFallback
          src={collection.imageUrl}
          alt={collection.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-104"
          fallbackTitle={collection.title}
        />

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent flex flex-col justify-between p-3.5 text-white">
          <div className="flex items-center justify-between">
            {collection.seasonBadge && (
              <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-[#E5CDBE] border border-white/20">
                {collection.seasonBadge}
              </span>
            )}
            <span className="text-[11px] font-medium text-white/90">
              {lookCount} curated {lookCount === 1 ? 'look' : 'looks'}
            </span>
          </div>

          <div>
            <span className="text-xs text-[#E5CDBE] font-medium tracking-wide">
              {collection.subtitle}
            </span>
            <h3 className="font-serif text-lg font-semibold text-white drop-shadow-xs">
              {collection.title}
            </h3>
          </div>
        </div>
      </div>

      {/* Description & Action */}
      <div className="p-3.5 space-y-3 flex-1 flex flex-col justify-between bg-white">
        <p className="text-xs text-[#5C585E] leading-relaxed line-clamp-2">
          {collection.description}
        </p>

        <div className="flex items-center justify-between pt-2 border-t border-[#242326]/5">
          <span className="text-xs font-semibold text-[#9C6A61] group-hover:text-[#242326] transition-colors inline-flex items-center gap-1">
            <span>Explore Collection</span>
            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
          </span>

          {isSelected && (
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-sm">
              Active
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
