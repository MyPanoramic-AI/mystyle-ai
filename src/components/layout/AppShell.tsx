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
  // Chat screens need a fixed viewport height so the message list scrolls in-place.
  const lockViewport = currentTab === 'stylist';

  return (
    <div
      className={`${lockViewport ? 'h-dvh overflow-hidden' : 'min-h-dvh'} flex flex-col bg-[#F6F2EC] text-[#242326] overflow-x-hidden`}
    >
      {/* Top Navigation */}
      <TopHeader
        currentTab={currentTab}
        onNavigate={onNavigate}
        userAvatarName={userAvatarName}
        userAvatarPhoto={userAvatarPhoto}
        onOpenMembership={onOpenMembership}
        usesAccount={usesAccount}
      />

      {/* Main Content Area - room for bottom nav + home-indicator safe area on phones */}
      <main
        className={`flex-1 w-full min-w-0 max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 ${
          lockViewport
            ? 'min-h-0 overflow-hidden flex flex-col pt-0 sm:pt-0 pb-nav lg:pb-4'
            : 'pt-3 sm:pt-6 pb-nav lg:pb-16'
        }`}
      >
        {children}
      </main>

      {/* Mobile Fixed Bottom Navigation (hidden on desktop lg:) */}
      <BottomNav currentTab={currentTab} onNavigate={onNavigate} />
    </div>
  );
};
