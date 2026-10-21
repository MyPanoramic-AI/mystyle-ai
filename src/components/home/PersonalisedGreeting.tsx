/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { getTimeGreeting } from '../../utils/personalization';

interface PersonalisedGreetingProps {
  firstName?: string;
  isOnboardingCompleted?: boolean;
}

export const PersonalisedGreeting: React.FC<PersonalisedGreetingProps> = ({
  firstName,
  isOnboardingCompleted,
}) => {
  const { greeting, hasName } = getTimeGreeting(isOnboardingCompleted ? firstName : undefined);

  return (
    <section className="mb-4 sm:mb-5 pt-0.5 sm:pt-1">
      <div>
        <span className="text-[11px] sm:text-xs font-semibold tracking-wider uppercase text-[#866a40] block mb-1">
          Personal Styling Companion
        </span>

        {/* Dynamic greeting with customer name */}
        <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight text-[#242326] leading-[1.2]">
          {hasName ? (
            <>
              {greeting}{' '}
              <span className="text-[#91635a] block sm:inline font-normal italic">
                What are we styling today?
              </span>
            </>
          ) : (
            'Your style. Your way.'
          )}
        </h1>

        <p className="mt-1.5 text-xs sm:text-sm text-[#5C585E] max-w-xl leading-relaxed">
          {hasName
            ? "Let's find something you'll love."
            : 'Your personal AI stylist is ready to help you look and feel your best.'}
        </p>
      </div>
    </section>
  );
};
