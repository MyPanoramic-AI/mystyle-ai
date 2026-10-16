/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Button } from '../common/Button';
import { ImageWithFallback } from '../common/ImageWithFallback';
import { Sparkles, ArrowRight, ShieldCheck, Clock } from 'lucide-react';
import heroEditorialImg from '../../assets/images/hero_editorial_fashion_1791978397716.jpg';

interface Step1WelcomeProps {
  onNext: () => void;
  onSkip: () => void;
}

export const Step1Welcome: React.FC<Step1WelcomeProps> = ({ onNext, onSkip }) => {
  return (
    <div className="max-w-xl mx-auto py-2 sm:py-6 text-center animate-fadeIn">
      {/* Editorial Welcome Card */}
      <div className="relative rounded-3xl overflow-hidden bg-white border border-[#242326]/10 shadow-sm p-6 sm:p-10 mb-6">
        {/* Fashion Hero Image Badge */}
        <div className="relative w-full aspect-[16/10] sm:aspect-[16/9] rounded-2xl overflow-hidden mb-6 bg-[#E5CDBE]/20">
          <ImageWithFallback
            src={heroEditorialImg || '/images/hero.jpg'}
            alt="Editorial personal stylist consultation"
            fallbackTitle="MyStyle Personal Stylist"
            className="w-full h-full"
            imageClassName="object-cover object-[center_15%]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#242326]/60 via-transparent to-transparent" />
          <div className="absolute bottom-3 left-3 text-white text-left">
            <span className="text-[11px] font-medium tracking-wider uppercase text-[#E5CDBE] block">
              Meet Your Fashion Companion
            </span>
            <span className="font-serif text-sm sm:text-base font-semibold">
              Curated for your individuality
            </span>
          </div>
        </div>

        {/* Headlines */}
        <span className="text-xs font-semibold tracking-wider uppercase text-[#B49361] block mb-2">
          Personal Style Profile
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl font-semibold tracking-tight text-[#242326] leading-tight">
          Let's discover your style.
        </h1>
        <p className="mt-3 text-sm sm:text-base text-[#5C585E] max-w-md mx-auto leading-relaxed">
          A few little details will help me find looks you'll love.
        </p>

        {/* Trust & Duration markers */}
        <div className="flex items-center justify-center gap-6 mt-6 pt-5 border-t border-[#242326]/8 text-xs text-[#5C585E]">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-[#B49361]" />
            <span>2-minute setup</span>
          </div>
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-[#9C6A61]" />
            <span>Private & personalized</span>
          </div>
        </div>

        {/* Main CTA */}
        <div className="mt-8">
          <Button
            variant="primary"
            size="lg"
            fullWidth
            onClick={onNext}
            icon={<ArrowRight className="w-4 h-4" />}
            className="shadow-sm hover:shadow"
          >
            Let's Get Started
          </Button>
        </div>
      </div>

      {/* Skip affordance */}
      <button
        onClick={onSkip}
        className="text-xs font-medium text-[#5C585E] hover:text-[#242326] transition-colors py-2 cursor-pointer focus-visible:outline-none"
      >
        Explore the app first, I'll complete my profile later
      </button>
    </div>
  );
};
