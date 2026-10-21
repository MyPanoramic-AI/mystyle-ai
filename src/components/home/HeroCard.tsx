/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { HERO_DATA } from '../../data/mockData';
import { ImageWithFallback } from '../common/ImageWithFallback';
import { Button } from '../common/Button';
import { Sparkles, ArrowRight } from 'lucide-react';

interface HeroCardProps {
  onAskStylist: (initialPrompt?: string) => void;
}

export const HeroCard: React.FC<HeroCardProps> = ({ onAskStylist }) => {
  return (
    <section className="mb-8 sm:mb-10">
      <div className="relative overflow-hidden rounded-3xl bg-white border border-[#242326]/10 shadow-sm transition-all hover:shadow-md">
        <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
          {/* Hero Fashion Image Showcase - top on mobile, right on desktop */}
          <div className="lg:col-span-6 lg:order-2 relative h-[210px] sm:h-[270px] lg:h-full min-h-[210px] lg:min-h-[380px] overflow-hidden bg-[#E5CDBE]/20">
            <ImageWithFallback
              src={HERO_DATA.imageUrl}
              alt="Stylish woman in elegant tailored cream blazer and pleated trousers"
              fallbackTitle="MyStyle Editorial"
              className="w-full h-full object-cover object-[center_20%]"
            />
            {/* Subtle editorial badge */}
            <div className="absolute top-3.5 right-3.5 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full border border-[#242326]/10 shadow-xs">
              <span className="text-[10px] sm:text-[11px] font-medium tracking-wider uppercase text-[#242326]">
                Featured Look
              </span>
            </div>
          </div>

          {/* Editorial Content Zone - bottom on mobile, left on desktop */}
          <div className="lg:col-span-6 lg:order-1 p-5 sm:p-7 lg:p-9 flex flex-col justify-between bg-white">
            <div>
              <div className="flex items-center gap-2 mb-2 sm:mb-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#B49361]" />
                <span className="text-[11px] sm:text-xs font-semibold tracking-wider uppercase text-[#866a40]">
                  Personalised Just For You
                </span>
              </div>

              <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight text-[#242326] leading-tight">
                {HERO_DATA.headline}
              </h2>

              <p className="mt-2 text-xs sm:text-sm text-[#5C585E] leading-relaxed">
                {HERO_DATA.subheadline}
              </p>

              {/* Prominent CTA Button */}
              <div className="mt-4 sm:mt-5">
                <Button
                  variant="primary"
                  size="md"
                  fullWidth
                  onClick={() => onAskStylist()}
                  icon={<Sparkles className="w-4 h-4" />}
                  className="justify-between px-5 sm:px-6 shadow-sm hover:shadow"
                >
                  <span className="font-medium">{HERO_DATA.ctaText}</span>
                  <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>
              </div>

              {/* Quick Style Inspiration Prompts */}
              <div className="mt-4 sm:mt-5 pt-3.5 sm:pt-4 border-t border-[#242326]/8">
                <p className="text-[11px] sm:text-xs font-medium text-[#242326]/70 mb-2">
                  Popular style consultations:
                </p>
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  {HERO_DATA.quickPrompts.map((prompt, idx) => (
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
