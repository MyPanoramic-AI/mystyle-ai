/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Button } from '../common/Button';
import { Sparkles, MessageCircle } from 'lucide-react';

interface AIInvitationCardProps {
  onFindLook: () => void;
}

export const AIInvitationCard: React.FC<AIInvitationCardProps> = ({ onFindLook }) => {
  return (
    <section className="mt-8 mb-6">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#E5CDBE]/40 via-white to-[#F6F2EC] border border-[#242326]/10 p-6 sm:p-8 lg:p-10 shadow-xs">
        <div className="max-w-2xl mx-auto text-center flex flex-col items-center">
          {/* Subtle icon container */}
          <div className="w-12 h-12 rounded-2xl bg-[#9C6A61]/10 text-[#9C6A61] flex items-center justify-center mb-4">
            <MessageCircle className="w-6 h-6 stroke-[1.8]" />
          </div>

          <span className="text-xs font-semibold tracking-wider uppercase text-[#B49361] mb-2">
            Personal Styling Consultation
          </span>

          <h3 className="font-serif text-xl sm:text-2xl lg:text-3xl font-semibold tracking-tight text-[#242326] leading-snug">
            Not sure what to wear? Tell me what's happening, and let's find your perfect look.
          </h3>

          <p className="mt-2.5 text-xs sm:text-sm text-[#5C585E] max-w-md">
            Whether it's an impromptu dinner, an anniversary getaway, or refreshing your Monday routine.
          </p>

          <div className="mt-6">
            <Button
              variant="primary"
              size="lg"
              onClick={onFindLook}
              icon={<Sparkles className="w-4 h-4" />}
              className="px-8"
            >
              Let's find my look
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};
