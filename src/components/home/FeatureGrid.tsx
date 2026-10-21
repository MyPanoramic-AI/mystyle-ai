/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { FEATURE_CARDS } from '../../data/mockData';
import { FeatureCardItem, NavigationTab } from '../../types';
import { Camera, ShoppingBag, Sparkles, FolderArchive, ArrowRight, Clock } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';

interface FeatureGridProps {
  onNavigate: (tab: NavigationTab) => void;
}

export const FeatureGrid: React.FC<FeatureGridProps> = ({ onNavigate }) => {
  const [selectedFeature, setSelectedFeature] = useState<FeatureCardItem | null>(null);

  const getIcon = (id: string) => {
    switch (id) {
      case 'virtual-try-on':
        return Camera;
      case 'shop-the-look':
        return ShoppingBag;
      case 'beauty-studio':
        return Sparkles;
      case 'my-wardrobe':
        return FolderArchive;
      default:
        return Sparkles;
    }
  };

  const handleCardClick = (item: FeatureCardItem) => {
    if (item.targetTab) {
      onNavigate(item.targetTab);
    } else {
      setSelectedFeature(item);
    }
  };

  return (
    <section className="mb-10 sm:mb-12">
      {/* Section Header */}
      <div className="mb-4">
        <span className="text-xs font-semibold tracking-wider uppercase text-[#866a40] block mb-1">
          Intelligent Fashion Suite
        </span>
        <h2 className="font-serif text-2xl sm:text-3xl font-semibold tracking-tight text-[#242326]">
          Discover Your Features
        </h2>
      </div>

      {/* Grid of Feature Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {FEATURE_CARDS.map((item) => {
          const Icon = getIcon(item.id);
          const isDirectNav = !!item.targetTab;

          return (
            <div
              key={item.id}
              onClick={() => handleCardClick(item)}
              className="group relative p-5 rounded-2xl bg-white border border-[#242326]/10 hover:border-[#9C6A61]/40 shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9C6A61]"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  handleCardClick(item);
                }
              }}
            >
              <div>
                {/* Icon & Phase indicator */}
                <div className="flex items-center justify-between mb-4">
                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center transition-colors ${
                      item.accent === 'rose'
                        ? 'bg-[#E5CDBE]/40 text-[#91635a]'
                        : item.accent === 'gold'
                        ? 'bg-[#B49361]/15 text-[#866a40]'
                        : 'bg-[#242326]/10 text-[#242326]'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>

                  <span className="text-[11px] font-medium text-[#5C585E] flex items-center gap-1">
                    {isDirectNav ? (
                      <span className="text-[#91635a] font-semibold">Explore</span>
                    ) : (
                      <>
                        <Clock className="w-3 h-3 text-[#866a40]" />
                        <span>Roadmap</span>
                      </>
                    )}
                  </span>
                </div>

                <h3 className="font-serif text-lg font-semibold text-[#242326] group-hover:text-[#91635a] transition-colors">
                  {item.title}
                </h3>

                <p className="mt-1.5 text-xs text-[#5C585E] leading-relaxed">
                  {item.description}
                </p>
              </div>

              {/* Bottom Card Action */}
              <div className="mt-5 pt-3 border-t border-[#242326]/6 flex items-center justify-between text-xs font-medium text-[#242326]">
                <span className="group-hover:translate-x-0.5 transition-transform">
                  {isDirectNav ? 'Open Feature' : 'Learn More'}
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-[#91635a] group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Feature Details Modal for upcoming modules */}
      {selectedFeature && (
        <Modal
          isOpen={!!selectedFeature}
          onClose={() => setSelectedFeature(null)}
          title={selectedFeature.title}
          subtitle={selectedFeature.upcomingPhase}
        >
          <div className="space-y-4 text-sm text-[#5C585E]">
            <p className="leading-relaxed">
              {selectedFeature.description}
            </p>

            <div className="p-4 rounded-xl bg-[#E5CDBE]/20 border border-[#242326]/8">
              <span className="text-xs font-semibold text-[#242326] block mb-1">
                Development Roadmap Note
              </span>
              <p className="text-xs text-[#5C585E] leading-relaxed">
                This feature is scheduled for implementation in {selectedFeature.upcomingPhase}. In this foundation release, navigation hooks and data structures are prepared for clean API integration.
              </p>
            </div>

            <div className="pt-2 flex justify-end">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setSelectedFeature(null)}
              >
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </section>
  );
};
