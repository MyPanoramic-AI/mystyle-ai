/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { Send, Image, Mic, MicOff, X, Sparkles, Paperclip, Check } from 'lucide-react';
import { STARTER_SUGGESTIONS } from '../../data/stylistKnowledge';

// Sample wardrobe garment presets for quick test-drive
const SAMPLE_GARMENTS = [
  {
    name: 'Cream Sculptural Blazer',
    url: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=600&q=80',
  },
  {
    name: 'Forest Green Satin Slip Dress',
    url: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=600&q=80',
  },
  {
    name: 'Pointed Obsidian Ankle Boots',
    url: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=600&q=80',
  },
];

interface StylistInputBarProps {
  onSendMessage: (text: string, attachment?: { name: string; url: string }) => void;
  isGenerating: boolean;
  onSelectPrompt: (prompt: string) => void;
  inputPrefill?: string;
}

export const StylistInputBar: React.FC<StylistInputBarProps> = ({
  onSendMessage,
  isGenerating,
  onSelectPrompt,
  inputPrefill = '',
}) => {
  const [inputText, setInputText] = useState(inputPrefill);
  const [attachment, setAttachment] = useState<{ name: string; url: string } | null>(null);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync incoming inputPrefill
  React.useEffect(() => {
    if (inputPrefill) {
      setInputText(inputPrefill);
    }
  }, [inputPrefill]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if ((!inputText.trim() && !attachment) || isGenerating) return;

    onSendMessage(inputText.trim(), attachment || undefined);
    setInputText('');
    setAttachment(null);
    setShowAttachmentMenu(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setAttachment({
        name: file.name,
        url,
      });
      setShowAttachmentMenu(false);
    }
  };

  const handleSelectSample = (sample: { name: string; url: string }) => {
    setAttachment(sample);
    setShowAttachmentMenu(false);
    if (!inputText) {
      setInputText(`How would you style this ${sample.name.toLowerCase()} for an upcoming occasion?`);
    }
  };

  const handleToggleVoice = () => {
    if (isListening) {
      setIsListening(false);
    } else {
      setIsListening(true);
      // Realistic simulated voice dictation
      setTimeout(() => {
        setInputText('Curate a chic evening dinner outfit that pairs well with gold accessories and comfortable heels.');
        setIsListening(false);
      }, 1800);
    }
  };

  return (
    <div className="bg-white/95 backdrop-blur-md border-t border-[#242326]/10 p-3 sm:p-4 sticky bottom-16 sm:bottom-0 z-30 transition-all">
      <div className="max-w-4xl mx-auto space-y-2.5">
        {/* Quick Suggestion Chips Carousel */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#9C6A61] shrink-0 pl-1">
            Quick Inquiries:
          </span>
          {STARTER_SUGGESTIONS.map((sug) => (
            <button
              key={sug.id}
              onClick={() => onSelectPrompt(sug.prompt)}
              disabled={isGenerating}
              className="shrink-0 px-3 py-1.5 rounded-full bg-[#F6F2EC] hover:bg-[#E5CDBE]/40 text-[#242326] text-xs font-medium border border-[#242326]/5 transition-colors cursor-pointer whitespace-nowrap disabled:opacity-50"
            >
              {sug.label}
            </button>
          ))}
        </div>

        {/* Attachment Thumbnail Preview */}
        {attachment && (
          <div className="flex items-center gap-2 p-2 bg-[#FAF7F2] rounded-xl border border-[#9C6A61]/30 max-w-sm animate-in fade-in duration-150">
            <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 border border-black/10 bg-white">
              <img
                src={attachment.url}
                alt={attachment.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0 text-xs">
              <span className="text-[10px] uppercase font-bold text-[#9C6A61] block">
                Attached Garment
              </span>
              <p className="font-medium text-[#242326] truncate">{attachment.name}</p>
            </div>
            <button
              onClick={() => setAttachment(null)}
              className="w-6 h-6 rounded-full hover:bg-black/5 text-[#5C585E] flex items-center justify-center cursor-pointer"
              aria-label="Remove attachment"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Listening Indicator */}
        {isListening && (
          <div className="flex items-center gap-2 text-xs text-[#9C6A61] font-medium bg-[#FAF7F2] px-3 py-1.5 rounded-lg border border-[#9C6A61]/20 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-[#9C6A61]" />
            <span>Listening to your styling question...</span>
          </div>
        )}

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="relative flex items-end gap-2">
          {/* Attachment button */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
              className="w-10 h-10 rounded-xl bg-[#F6F2EC] hover:bg-[#E5CDBE]/30 text-[#5C585E] hover:text-[#242326] flex items-center justify-center border border-[#242326]/10 transition-colors cursor-pointer shrink-0"
              title="Attach photo or garment"
              aria-label="Attach photo"
            >
              <Paperclip className="w-4 h-4" />
            </button>

            {/* Attachment popover menu */}
            {showAttachmentMenu && (
              <div className="absolute bottom-12 left-0 w-64 bg-white rounded-2xl shadow-xl border border-[#242326]/10 p-3 z-40 space-y-2 animate-in fade-in zoom-in-95 duration-150">
                <div className="text-[11px] font-bold uppercase tracking-wider text-[#9C6A61]">
                  Style from Photo
                </div>

                {/* Real File Upload */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full text-left p-2 rounded-xl bg-[#FAF7F2] hover:bg-[#F6F2EC] text-xs font-medium text-[#242326] flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <Image className="w-4 h-4 text-[#9C6A61]" />
                  <span>Upload clothing photo</span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />

                {/* Preset sample items */}
                <div className="pt-1 border-t border-[#242326]/5">
                  <span className="text-[10px] text-[#5C585E] block mb-1.5 font-medium">
                    Or test with a sample piece:
                  </span>
                  <div className="space-y-1">
                    {SAMPLE_GARMENTS.map((garment, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSelectSample(garment)}
                        className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-[#FAF7F2] text-xs text-[#242326] flex items-center justify-between transition-colors cursor-pointer"
                      >
                        <span className="truncate">{garment.name}</span>
                        <Sparkles className="w-3 h-3 text-[#B49361]" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Voice input button */}
          <button
            type="button"
            onClick={handleToggleVoice}
            className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-colors cursor-pointer shrink-0 ${
              isListening
                ? 'bg-[#9C6A61] text-white border-[#9C6A61]'
                : 'bg-[#F6F2EC] hover:bg-[#E5CDBE]/30 text-[#5C585E] hover:text-[#242326] border-[#242326]/10'
            }`}
            title="Voice input"
            aria-label="Voice input"
          >
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>

          {/* Textarea */}
          <div className="flex-1 min-w-0 relative">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask Aria... 'Style a look for Cape Town brunch', 'What shoes go with my dress?'"
              rows={1}
              className="w-full bg-[#F6F2EC] focus:bg-white text-[#242326] placeholder-[#5C585E]/70 rounded-xl px-3.5 py-2.5 text-xs sm:text-[13px] border border-[#242326]/10 focus:border-[#9C6A61] focus:ring-1 focus:ring-[#9C6A61] outline-none transition-all resize-none max-h-32 min-h-[40px]"
            />
          </div>

          {/* Send button */}
          <button
            type="submit"
            disabled={(!inputText.trim() && !attachment) || isGenerating}
            className="w-10 h-10 rounded-xl bg-[#9C6A61] hover:bg-[#83554D] disabled:opacity-40 disabled:hover:bg-[#9C6A61] text-white flex items-center justify-center shadow-xs transition-colors cursor-pointer shrink-0"
            aria-label="Send message"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
