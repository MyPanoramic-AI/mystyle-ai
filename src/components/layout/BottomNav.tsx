/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { NavigationTab } from '../../types';
import { Home, Sparkles, Camera, ShoppingBag, User } from 'lucide-react';

interface BottomNavProps {
  currentTab: NavigationTab;
  onNavigate: (tab: NavigationTab) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentTab, onNavigate }) => {
  const navItems = [
    { id: 'home' as NavigationTab, label: 'Home', icon: Home },
    { id: 'stylist' as NavigationTab, label: 'My Stylist', icon: Sparkles },
    { id: 'try-on' as NavigationTab, label: 'Try On', icon: Camera },
    { id: 'shop' as NavigationTab, label: 'Shop', icon: ShoppingBag },
    { id: 'profile' as NavigationTab, label: 'My Profile', icon: User },
  ];

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#FFFFFF]/95 backdrop-blur-md border-t border-[#242326]/8 pb-safe shadow-lg"
      aria-label="Mobile Navigation"
    >
      <div className="grid grid-cols-5 items-center h-16 max-w-lg mx-auto px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className="flex flex-col items-center justify-center min-h-[48px] py-1 transition-all group focus-visible:outline-none"
              aria-current={isActive ? 'page' : undefined}
            >
              <div
                className={`w-10 h-7 rounded-xl flex items-center justify-center transition-all ${
                  isActive
                    ? 'text-[#9C6A61] scale-105'
                    : 'text-[#5C585E] group-hover:text-[#242326]'
                }`}
              >
                <Icon
                  className={`w-5 h-5 transition-transform ${
                    isActive ? 'stroke-[2.4px]' : 'stroke-[1.8px]'
                  }`}
                />
              </div>
              <span
                className={`text-[10px] tracking-tight leading-none mt-0.5 transition-colors whitespace-nowrap ${
                  isActive
                    ? 'font-semibold text-[#9C6A61]'
                    : 'font-normal text-[#5C585E] group-hover:text-[#242326]'
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
