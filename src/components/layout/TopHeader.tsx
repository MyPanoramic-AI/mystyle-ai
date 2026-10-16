/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { NavigationTab } from '../../types';
import { Sparkles, User, Zap } from 'lucide-react';
import { MembershipSubpageTab } from '../../types/membership';
import { getCreditBalance } from '../../services/membershipService';

interface TopHeaderProps {
  currentTab: NavigationTab;
  onNavigate: (tab: NavigationTab) => void;
  userAvatarName?: string;
  userAvatarPhoto?: string;
  onOpenMembership?: (tab?: MembershipSubpageTab) => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  currentTab,
  onNavigate,
  userAvatarName = 'Nandi',
  userAvatarPhoto,
  onOpenMembership,
}) => {
  const [credits, setCredits] = React.useState(getCreditBalance());

  React.useEffect(() => {
    const handleUpdate = () => setCredits(getCreditBalance());
    window.addEventListener('mystyle_credits_updated', handleUpdate);
    return () => window.removeEventListener('mystyle_credits_updated', handleUpdate);
  }, []);
  return (
    <header className="sticky top-0 z-40 bg-[#F6F2EC]/90 backdrop-blur-md border-b border-[#242326]/8 transition-all">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Brand Wordmark (Single text element in editorial display face) */}
        <button
          onClick={() => onNavigate('home')}
          className="flex items-center gap-2 text-left group focus-visible:outline-none shrink-0"
        >
          <span className="font-serif text-2xl font-bold tracking-tight text-[#242326] group-hover:text-[#9C6A61] transition-colors whitespace-nowrap">
            MyStyle <span className="font-sans text-xs uppercase tracking-widest text-[#B49361] font-semibold ml-0.5">AI</span>
          </span>
        </button>

        {/* Zone 2: Nav Links for Desktop/Tablet (Single-line whitespace-nowrap) */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-[#5C585E]">
          <button
            onClick={() => onNavigate('home')}
            className={`whitespace-nowrap transition-colors py-1 cursor-pointer ${
              currentTab === 'home'
                ? 'text-[#242326] font-semibold border-b-2 border-[#9C6A61]'
                : 'hover:text-[#242326]'
            }`}
          >
            Home
          </button>
          <button
            onClick={() => onNavigate('stylist')}
            className={`whitespace-nowrap transition-colors py-1 cursor-pointer ${
              currentTab === 'stylist'
                ? 'text-[#242326] font-semibold border-b-2 border-[#9C6A61]'
                : 'hover:text-[#242326]'
            }`}
          >
            My Stylist
          </button>
          <button
            onClick={() => onNavigate('try-on')}
            className={`whitespace-nowrap transition-colors py-1 cursor-pointer ${
              currentTab === 'try-on'
                ? 'text-[#242326] font-semibold border-b-2 border-[#9C6A61]'
                : 'hover:text-[#242326]'
            }`}
          >
            Try On
          </button>
          <button
            onClick={() => onNavigate('shop')}
            className={`whitespace-nowrap transition-colors py-1 cursor-pointer ${
              currentTab === 'shop'
                ? 'text-[#242326] font-semibold border-b-2 border-[#9C6A61]'
                : 'hover:text-[#242326]'
            }`}
          >
            Shop
          </button>
          <button
            onClick={() => onNavigate('profile')}
            className={`whitespace-nowrap transition-colors py-1 cursor-pointer ${
              currentTab === 'profile'
                ? 'text-[#242326] font-semibold border-b-2 border-[#9C6A61]'
                : 'hover:text-[#242326]'
            }`}
          >
            My Profile
          </button>
        </nav>

        {/* Zone 3: Primary Action / User Avatar Affordance */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => onNavigate('stylist')}
            className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-[#9C6A61] rounded-lg hover:bg-[#8A5B53] transition-all cursor-pointer shadow-sm active:scale-95"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Consult Stylist</span>
          </button>

          {/* AI Credit balance pill */}
          <button
            onClick={() => onOpenMembership ? onOpenMembership('credits') : onNavigate('profile')}
            title="View AI Credits & Membership"
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/80 hover:bg-white text-[11px] font-semibold text-[#242326] border border-[#B49361]/30 hover:border-[#B49361] transition-all shadow-xs cursor-pointer active:scale-95"
          >
            <Sparkles className="w-3 h-3 text-[#B49361]" />
            <span>{credits.remainingCredits} Credits</span>
          </button>

          {/* User profile avatar trigger */}
          <button
            onClick={() => onNavigate('profile')}
            aria-label={`Open profile for ${userAvatarName}`}
            className="flex items-center gap-2 p-1 rounded-full hover:bg-[#E5CDBE]/30 active:scale-95 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9C6A61]"
          >
            <div className="w-9 h-9 rounded-full overflow-hidden bg-[#E5CDBE] text-[#242326] border border-[#B49361]/30 flex items-center justify-center font-serif text-sm font-semibold shadow-xs">
              {userAvatarPhoto ? (
                <img src={userAvatarPhoto} alt={userAvatarName} className="w-full h-full object-cover" />
              ) : (
                userAvatarName.charAt(0)
              )}
            </div>
            <span className="hidden lg:inline text-xs font-medium text-[#242326]">
              {userAvatarName}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};
