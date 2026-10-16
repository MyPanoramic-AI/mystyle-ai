/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Button } from '../common/Button';
import { Sparkles, MessageCircle } from 'lucide-react';

interface StylistInvitationProps {
  onAskStylist: () => void;
}

export const StylistInvitation: React.FC<StylistInvitationProps> = ({ onAskStylist }) => {
  return (
    <section className="mt-8 mb-6">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#E5CDBE]/35 via-white to-[#F6F2EC] border border-[#242326]/10 p-6 sm:p-8 lg:p-10 shadow-xs text-center flex flex-col items-center">
        {/* Subtle conversational badge */}
        <div className="w-12 h-12 rounded-2xl bg-[#9C6A61]/10 text-[#9C6A61] flex items-center justify-center mb-4">
          <MessageCircle className="w-6 h-6 stroke-[1.8]" />
        </div>

        <span className="text-xs font-semibold tracking-wider uppercase text-[#B49361] mb-2">
          Your Personal Style Concierge
        </span>

        <h3 className="font-serif text-xl sm:text-2xl lg:text-3xl font-semibold tracking-tight text-[#242326] leading-snug max-w-xl">
          Have something special coming up?
        </h3>

        <p className="mt-2.5 text-xs sm:text-sm text-[#5C585E] max-w-md leading-relaxed">
          Tell your personal stylist about the occasion, and let's put together a look you'll love.
        </p>

        <div className="mt-6">
          <Button
            variant="primary"
            size="lg"
            onClick={onAskStylist}
            icon={<Sparkles className="w-4 h-4" />}
            className="px-8 shadow-sm hover:shadow"
          >
            Ask My Stylist
          </Button>
        </div>
      </div>
    </section>
  );
};
