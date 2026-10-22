/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { NavigationTab } from '../../types';
import { TopHeader } from './TopHeader';
import { BottomNav } from './BottomNav';

import { MembershipSubpageTab } from '../../types/membership';

interface AppShellProps {
  currentTab: NavigationTab;
  onNavigate: (tab: NavigationTab) => void;
  userAvatarName?: string;
  userAvatarPhoto?: string;
  onOpenMembership?: (tab?: MembershipSubpageTab) => void;
  usesAccount?: boolean;
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({
  currentTab,
  onNavigate,
  userAvatarName,
  userAvatarPhoto,
  onOpenMembership,
  usesAccount = false,
  children,
}) => {
  return (
    <div className="min-h-screen flex flex-col bg-[#F6F2EC] text-[#242326]">
      {/* Top Navigation */}
      <TopHeader
        currentTab={currentTab}
        onNavigate={onNavigate}
        userAvatarName={userAvatarName}
        userAvatarPhoto={userAvatarPhoto}
        onOpenMembership={onOpenMembership}
        usesAccount={usesAccount}
      />

      {/* Main Content Area - mobile optimized with responsive desktop breathing room */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-3 sm:pt-6 pb-28 lg:pb-16">
        {children}
      </main>

      {/* Mobile Fixed Bottom Navigation (hidden on desktop md:) */}
      <BottomNav currentTab={currentTab} onNavigate={onNavigate} />
    </div>
  );
};
