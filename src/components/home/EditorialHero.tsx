/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { getPersonalizedHero } from '../../utils/personalization';
import { ImageWithFallback } from '../common/ImageWithFallback';
import { Button } from '../common/Button';
import { Sparkles, ArrowRight, Compass } from 'lucide-react';

interface EditorialHeroProps {
  userStyles?: string[];
  onAskStylist: (initialPrompt?: string) => void;
  onDiscoverStyles?: () => void;
}

export const EditorialHero: React.FC<EditorialHeroProps> = ({
  userStyles,
  onAskStylist,
  onDiscoverStyles,
}) => {
  const heroContent = getPersonalizedHero(userStyles);

  return (
    <section className="mb-8 sm:mb-10">
      <div className="relative overflow-hidden rounded-3xl bg-white border border-[#242326]/10 shadow-sm transition-all hover:shadow-md">
        <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
          {/* Fashion Photography Showcase - top on mobile, right on desktop */}
          <div className="lg:col-span-6 lg:order-2 relative h-[220px] sm:h-[280px] lg:h-full min-h-[220px] lg:min-h-[380px] overflow-hidden bg-[#E5CDBE]/20">
            <ImageWithFallback
              src={heroContent.imageUrl}
              alt={heroContent.altText}
              fallbackTitle="MyStyle Editorial"
              className="w-full h-full"
              imageClassName="object-cover object-[center_18%]"
            />
            {/* Subtle editorial badge */}
            <div className="absolute top-3.5 right-3.5 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full border border-[#242326]/10 shadow-xs">
              <span className="text-[10px] sm:text-[11px] font-medium tracking-wider uppercase text-[#242326]">
                Curated Look
              </span>
            </div>
          </div>

          {/* Editorial Content Zone - bottom on mobile, left on desktop */}
          <div className="lg:col-span-6 lg:order-1 p-5 sm:p-7 lg:p-9 flex flex-col justify-between bg-white">
            <div>
              <div className="flex items-center gap-2 mb-2 sm:mb-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#B49361]" />
                <span className="text-[11px] sm:text-xs font-semibold tracking-wider uppercase text-[#866a40]">
                  {heroContent.tagline}
                </span>
              </div>

              <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight text-[#242326] leading-tight">
                {heroContent.headline}
              </h2>

              <p className="mt-2 text-xs sm:text-sm text-[#5C585E] leading-relaxed">
                {heroContent.subheadline}
              </p>

              {/* Prominent CTA Button: "Style My Look" */}
              <div className="mt-4 sm:mt-5 flex flex-col sm:flex-row gap-2.5">
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => onAskStylist(heroContent.quickPrompts[0])}
                  icon={<Sparkles className="w-4 h-4" />}
                  className="flex-1 justify-between px-5 sm:px-6 shadow-sm hover:shadow"
                >
                  <span className="font-medium">{heroContent.ctaText}</span>
                  <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>
                {onDiscoverStyles && (
                  <Button
                    variant="secondary"
                    size="md"
                    onClick={onDiscoverStyles}
                    icon={<Compass className="w-4 h-4 text-[#91635a]" />}
                    className="justify-center px-4"
                  >
                    <span>Discover Styles</span>
                  </Button>
                )}
              </div>

              {/* Quick Consultation Chips */}
              <div className="mt-4 sm:mt-5 pt-3.5 sm:pt-4 border-t border-[#242326]/8">
                <p className="text-[11px] sm:text-xs font-medium text-[#242326]/70 mb-2">
                  Style ideas for your aesthetic:
                </p>
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  {heroContent.quickPrompts.map((prompt, idx) => (
                    <button
                      key={idx}
                      onClick={() => onAskStylist(prompt)}
                      className="text-[11px] sm:text-xs px-2.5 py-1.5 rounded-lg bg-[#F6F2EC] hover:bg-[#E5CDBE]/50 text-[#242326] transition-colors cursor-pointer border border-[#242326]/5 active:scale-95 text-left"
                    >
                      "{prompt}"
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
