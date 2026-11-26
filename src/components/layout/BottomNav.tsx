/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { NavigationTab } from '../../types';
import { Home, Sparkles, Camera, ShoppingBag, User, Shirt, Layers } from 'lucide-react';

interface BottomNavProps {
  currentTab: NavigationTab;
  onNavigate: (tab: NavigationTab) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentTab, onNavigate }) => {
  const navItems = [
    { id: 'home' as NavigationTab, label: 'Home', shortLabel: 'Home', icon: Home },
    { id: 'stylist' as NavigationTab, label: 'My Stylist', shortLabel: 'Stylist', icon: Sparkles },
    { id: 'try-on' as NavigationTab, label: 'Fitting Room', shortLabel: 'Fit', icon: Camera },
    { id: 'shop' as NavigationTab, label: 'Shop', shortLabel: 'Shop', icon: ShoppingBag },
    { id: 'wardrobe' as NavigationTab, label: 'Wardrobe', shortLabel: 'Closet', icon: Shirt },
    { id: 'capsule' as NavigationTab, label: 'Capsule', shortLabel: 'Capsule', icon: Layers },
    { id: 'profile' as NavigationTab, label: 'Profile', shortLabel: 'You', icon: User },
  ];

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#242326]/8 pb-safe shadow-[0_-4px_24px_rgba(36,35,38,0.06)]"
      aria-label="Mobile Navigation"
    >
      <div className="grid grid-cols-7 items-stretch h-16 max-w-lg mx-auto px-0.5 sm:px-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
              className="flex flex-col items-center justify-center min-h-[48px] min-w-0 px-0.5 py-1 transition-all group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9C6A61]/40 rounded-lg"
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
              title={item.label}
            >
              <div
                className={`w-9 h-7 rounded-xl flex items-center justify-center transition-all ${
                  isActive
                    ? 'text-[#91635a] bg-[#9C6A61]/10'
                    : 'text-[#5C585E] group-hover:text-[#242326]'
                }`}
              >
                <Icon
                  className={`w-[18px] h-[18px] sm:w-5 sm:h-5 transition-transform ${
                    isActive ? 'stroke-[2.4px]' : 'stroke-[1.8px]'
                  }`}
                />
              </div>
              <span
                className={`text-[9px] sm:text-[10px] tracking-tight leading-tight mt-0.5 max-w-full truncate px-0.5 transition-colors ${
                  isActive
                    ? 'font-semibold text-[#91635a]'
                    : 'font-normal text-[#5C585E] group-hover:text-[#242326]'
                }`}
              >
                <span className="sm:hidden">{item.shortLabel}</span>
                <span className="hidden sm:inline">{item.label}</span>
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
