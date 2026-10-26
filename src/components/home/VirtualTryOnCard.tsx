/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { NavigationTab } from '../../types';
import { ImageWithFallback } from '../common/ImageWithFallback';
import { Button } from '../common/Button';
import { Camera, ArrowRight } from 'lucide-react';
import tryOnPreviewImg from '../../assets/images/hero_editorial_fashion_1791978397716.jpg';

interface VirtualTryOnCardProps {
  onNavigate: (tab: NavigationTab) => void;
}

export const VirtualTryOnCard: React.FC<VirtualTryOnCardProps> = ({ onNavigate }) => {
  return (
    <section className="mb-10 sm:mb-12">
      <div className="relative overflow-hidden rounded-3xl bg-white border border-[#242326]/10 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-12 items-center">
          <div className="sm:col-span-7 p-6 sm:p-8 lg:p-9 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#9C6A61]" />
                <span className="text-[11px] font-semibold tracking-wider uppercase text-[#91635a]">
                  Virtual Fitting Room
                </span>
              </div>

              <h3 className="font-serif text-xl sm:text-2xl lg:text-3xl font-semibold text-[#242326] leading-tight">
                Wondering how it would look on you?
              </h3>

              <p className="mt-2 text-xs sm:text-sm text-[#5C585E] leading-relaxed">
                Choose a Shop or Wardrobe garment, confirm your private photograph, and open the fitting room. Live AI generation stays off until explicitly authorised.
              </p>
            </div>

            <div className="mt-6">
              <Button
                variant="primary"
                size="md"
                onClick={() => onNavigate('try-on')}
                icon={<Camera className="w-4 h-4" />}
                className="shadow-sm hover:shadow"
              >
                <span>Open Fitting Room</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>

          <div className="sm:col-span-5 relative h-48 sm:h-full min-h-[190px] overflow-hidden bg-[#E5CDBE]/20">
            <ImageWithFallback
              src={tryOnPreviewImg || '/images/hero.jpg'}
              alt="Virtual fitting room preview"
              fallbackTitle="Virtual Try-On"
              className="w-full h-full"
              imageClassName="object-cover object-[center_15%]"
            />
            <div className="absolute inset-0 bg-gradient-to-t sm:bg-gradient-to-r from-white via-transparent to-transparent opacity-90 sm:opacity-50" />
          </div>
        </div>
      </div>
    </section>
  );
};
