/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { NavigationTab, StylistNavigationState } from '../../types';
import { Button } from '../common/Button';
import { Sparkles, ArrowLeft, Send, Sparkle, Compass, Info } from 'lucide-react';

interface StylistPlaceholderProps {
  state: StylistNavigationState;
  onNavigate: (tab: NavigationTab) => void;
  onClearState: () => void;
}

export const StylistPlaceholder: React.FC<StylistPlaceholderProps> = ({
  state,
  onNavigate,
  onClearState,
}) => {
  const [inputText, setInputText] = useState(state.suggestedPrompt || '');
  const [queryFeedback, setQueryFeedback] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    setQueryFeedback(
      `Your styling request "${inputText.trim()}" has been captured. Conversational AI styling will be fully wired in Phase 2.`
    );
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Top back navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => {
            onClearState();
            onNavigate('home');
          }}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-[#5C585E] hover:text-[#242326] transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </button>

        <span className="text-xs font-semibold uppercase tracking-wider text-[#B49361]">
          My Stylist · Phase 2 Roadmap
        </span>
      </div>

      {/* Main Stylist Stage Card */}
      <div className="rounded-3xl bg-white border border-[#242326]/10 p-6 sm:p-8 shadow-sm">
        <div className="flex items-start gap-4 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-[#9C6A61] text-white flex items-center justify-center shrink-0 shadow-sm">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-[#242326]">
              Personal Style Assistant
            </h1>
            <p className="text-xs sm:text-sm text-[#5C585E] mt-1">
              Intelligent wardrobe curation tailored to your appearance, body shape, and lifestyle occasions.
            </p>
          </div>
        </div>

        {/* Passed Occasion Context Banner if navigated from Occasion or Hero */}
        {state.occasionTitle && (
          <div className="mb-6 p-4 rounded-2xl bg-[#F6F2EC] border border-[#B49361]/30 flex items-start gap-3">
            <Sparkle className="w-5 h-5 text-[#B49361] shrink-0 mt-0.5" />
            <div className="text-xs">
              <span className="font-semibold text-[#242326] block">
                Active Styling Context: {state.occasionTitle}
              </span>
              <p className="text-[#5C585E] mt-0.5">
                The stylist will anchor outfit recommendations around {state.occasionTitle.toLowerCase()} aesthetics.
              </p>
            </div>
          </div>
        )}

        {/* Phase 2 Architecture Notice */}
        <div className="p-4 rounded-2xl bg-[#E5CDBE]/25 border border-[#242326]/8 mb-6">
          <div className="flex items-start gap-2.5">
            <Info className="w-4 h-4 text-[#9C6A61] shrink-0 mt-0.5" />
            <div className="text-xs leading-relaxed text-[#242326]">
              <span className="font-semibold block mb-0.5">
                Under Development for Phase 2
              </span>
              In Phase 2, this view will feature full multi-turn conversational AI styling, South African store product matching, and color season analysis.
            </div>
          </div>
        </div>

        {/* Interactive Consultation Input Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="stylist-input"
              className="block text-xs font-semibold text-[#242326] mb-1.5 uppercase tracking-wider"
            >
              Style Inquiry or Occasion Description
            </label>
            <div className="relative">
              <textarea
                id="stylist-input"
                rows={3}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="e.g. Help me choose an outfit for an outdoor autumn wedding in Franschhoek, budget under R2,500..."
                className="w-full rounded-2xl border border-[#242326]/15 bg-[#F6F2EC]/50 p-4 text-sm text-[#242326] placeholder:text-[#5C585E]/70 focus:outline-none focus:ring-2 focus:ring-[#9C6A61] focus:border-transparent transition-all resize-none"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-[#B49361]" />
              <span className="text-xs text-[#5C585E]">
                Try: "Minimalist workwear" · "Cape Town evening dinner"
              </span>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="md"
              icon={<Send className="w-3.5 h-3.5" />}
            >
              Send to Stylist
            </Button>
          </div>
        </form>

        {/* User Submission Feedback */}
        {queryFeedback && (
          <div className="mt-6 p-4 rounded-2xl bg-white border border-[#9C6A61]/30 shadow-xs animate-fadeIn">
            <p className="text-xs text-[#242326] leading-relaxed">
              {queryFeedback}
            </p>
          </div>
        )}
      </div>

      {/* Return Actions */}
      <div className="flex justify-center pt-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            onClearState();
            onNavigate('home');
          }}
        >
          Return to Fashion Feed
        </Button>
      </div>
    </div>
  );
};
