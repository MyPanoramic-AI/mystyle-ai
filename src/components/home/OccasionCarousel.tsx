/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef } from 'react';
import { OCCASION_SHORTCUTS } from '../../data/mockData';
import { OccasionShortcut } from '../../types';
import { ImageWithFallback } from '../common/ImageWithFallback';
import { ChevronLeft, ChevronRight, ArrowUpRight } from 'lucide-react';

interface OccasionCarouselProps {
  onSelectOccasion: (occasion: OccasionShortcut) => void;
}

export const OccasionCarousel: React.FC<OccasionCarouselProps> = ({ onSelectOccasion }) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const offset = direction === 'left' ? -300 : 300;
      scrollContainerRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  return (
    <section className="mb-10 sm:mb-12">
      {/* Header */}
      <div className="flex items-end justify-between mb-4">
        <div>
          <span className="text-xs font-semibold tracking-wider uppercase text-[#91635a] block mb-1">
            Curated Collections
          </span>
          <h2 className="font-serif text-2xl sm:text-3xl font-semibold tracking-tight text-[#242326]">
            Style for the Occasion
          </h2>
        </div>

        {/* Carousel arrows on desktop */}
        <div className="hidden sm:flex items-center gap-2">
          <button
            onClick={() => scroll('left')}
            aria-label="Scroll left"
            className="w-9 h-9 rounded-full bg-white border border-[#242326]/10 flex items-center justify-center text-[#242326] hover:bg-[#F6F2EC] hover:border-[#242326]/20 transition-all cursor-pointer shadow-2xs active:scale-95"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => scroll('right')}
            aria-label="Scroll right"
            className="w-9 h-9 rounded-full bg-white border border-[#242326]/10 flex items-center justify-center text-[#242326] hover:bg-[#F6F2EC] hover:border-[#242326]/20 transition-all cursor-pointer shadow-2xs active:scale-95"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 8 Occasion Cards Horizontally Scrollable on Mobile, Responsive Wrap on Large Displays */}
      <div
        ref={scrollContainerRef}
        className="flex gap-4 overflow-x-auto no-scrollbar scroll-smooth py-1 -mx-4 px-4 sm:mx-0 sm:px-0"
      >
        {OCCASION_SHORTCUTS.map((occasion) => (
          <button
            key={occasion.id}
            onClick={() => onSelectOccasion(occasion)}
            className="group relative flex-none w-[210px] sm:w-[240px] rounded-2xl overflow-hidden bg-white border border-[#242326]/10 text-left cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9C6A61]"
          >
            {/* Card Image Container (3:4 aspect ratio) */}
            <div className="relative aspect-[3/4] w-full overflow-hidden bg-[#E5CDBE]/20">
              <ImageWithFallback
                src={occasion.imageUrl}
                alt={occasion.title}
                fallbackTitle={occasion.title}
                className="w-full h-full"
                imageClassName="object-cover transition-transform duration-500 group-hover:scale-105"
              />

              {/* Scrim for contrast readability */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#242326]/85 via-[#242326]/25 to-transparent" />

              {/* Top Accent Pill */}
              <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/80 backdrop-blur-md flex items-center justify-center text-[#242326] opacity-0 group-hover:opacity-100 transition-opacity">
                <ArrowUpRight className="w-4 h-4" />
              </div>

              {/* Bottom Typography Content */}
              <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                <span className="text-[10px] font-medium tracking-wider uppercase text-[#E5CDBE] block mb-0.5">
                  Occasion
                </span>
                <h3 className="font-serif text-base sm:text-lg font-semibold tracking-tight leading-snug">
                  {occasion.title}
                </h3>
                <p className="text-[11px] text-white/80 line-clamp-1 mt-0.5">
                  {occasion.subtitle}
                </p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
};
