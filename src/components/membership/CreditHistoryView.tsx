/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { CreditTransaction, CreditActivityCategory } from '../../types/membership';
import {
  History,
  Sparkles,
  Camera,
  Users,
  Coins,
  Crown,
  Layers,
  ArrowDownRight,
  ArrowUpRight,
  Search,
  Filter,
} from 'lucide-react';

interface CreditHistoryViewProps {
  transactions: CreditTransaction[];
  onBackToCredits: () => void;
}

export const CreditHistoryView: React.FC<CreditHistoryViewProps> = ({
  transactions,
  onBackToCredits,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = transactions.filter((tx) => {
    const matchesCategory =
      selectedCategory === 'all' ||
      (selectedCategory === 'try_on' && tx.category === 'try_on') ||
      (selectedCategory === 'beauty' && tx.category === 'beauty_studio') ||
      (selectedCategory === 'family' && tx.category === 'family_coordination') ||
      (selectedCategory === 'topups' && (tx.category === 'pack_purchase' || tx.category === 'subscription'));

    const matchesSearch =
      tx.activityName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (tx.details && tx.details.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesCategory && matchesSearch;
  });

  const getCategoryIcon = (category: CreditActivityCategory) => {
    switch (category) {
      case 'try_on':
        return <Camera className="w-4 h-4 text-[#9C6A61]" />;
      case 'beauty_studio':
        return <Sparkles className="w-4 h-4 text-[#B49361]" />;
      case 'family_coordination':
        return <Users className="w-4 h-4 text-[#9C6A61]" />;
      case 'pack_purchase':
        return <Coins className="w-4 h-4 text-emerald-600" />;
      case 'subscription':
        return <Crown className="w-4 h-4 text-[#B49361]" />;
      default:
        return <Layers className="w-4 h-4 text-[#5C585E]" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E5CDBE]/40 text-[#9C6A61] text-xs font-semibold uppercase tracking-wider mb-1.5">
            <History className="w-3.5 h-3.5" />
            <span>Audit & Verification</span>
          </div>
          <h2 className="font-serif text-2xl font-semibold text-[#242326]">
            Credit Usage Ledger
          </h2>
          <p className="text-xs text-[#5C585E]">
            Transparent chronological record of every AI generation deduction and credit replenishment.
          </p>
        </div>

        <button
          onClick={onBackToCredits}
          className="self-start sm:self-auto px-4 py-2 rounded-xl bg-[#F6F2EC] hover:bg-[#E5CDBE]/40 text-[#242326] text-xs font-semibold border border-[#242326]/10 transition-colors cursor-pointer"
        >
          Back to AI Credits
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5C585E]" />
          <input
            type="text"
            placeholder="Search activity or look..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-white border border-[#242326]/15 focus:outline-hidden focus:border-[#9C6A61]"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {[
            { id: 'all', label: 'All Activities' },
            { id: 'try_on', label: 'Try-On' },
            { id: 'beauty', label: 'Beauty' },
            { id: 'family', label: 'Family' },
            { id: 'topups', label: 'Replenishments' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-[#242326] text-white'
                  : 'bg-white border border-[#242326]/10 text-[#5C585E] hover:text-[#242326]'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Ledger Table / List */}
      <div className="rounded-3xl bg-white border border-[#242326]/10 shadow-xs overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-xs text-[#5C585E]">
            No credit transactions found matching your filters.
          </div>
        ) : (
          <div className="divide-y divide-[#242326]/6">
            {filtered.map((tx) => {
              const isPositive = tx.creditsChange > 0;

              return (
                <div
                  key={tx.id}
                  className="p-4 sm:p-5 flex items-start sm:items-center justify-between gap-4 hover:bg-[#FAF7F2]/60 transition-colors"
                >
                  <div className="flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-2xl bg-[#F6F2EC] flex items-center justify-center shrink-0 border border-[#242326]/6 mt-0.5 sm:mt-0">
                      {getCategoryIcon(tx.category)}
                    </div>

                    <div>
                      <span className="text-xs font-semibold text-[#242326] block">
                        {tx.activityName}
                      </span>
                      {tx.details && (
                        <span className="text-[11px] text-[#5C585E] block leading-tight mt-0.5">
                          {tx.details}
                        </span>
                      )}
                      <div className="flex items-center gap-2 text-[10px] text-[#5C585E] mt-1">
                        <span>{tx.date} at {tx.time}</span>
                        <span>·</span>
                        <span>Balance after: {tx.balanceAfter} credits</span>
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0 text-right">
                    <span
                      className={`inline-flex items-center gap-1 font-mono text-xs sm:text-sm font-bold px-2.5 py-1 rounded-full ${
                        isPositive
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-[#F6F2EC] text-[#9C6A61] border border-[#242326]/8'
                      }`}
                    >
                      {isPositive ? (
                        <>
                          <ArrowUpRight className="w-3.5 h-3.5 stroke-[2.5]" />
                          +{tx.creditsChange}
                        </>
                      ) : (
                        <>
                          <ArrowDownRight className="w-3.5 h-3.5 stroke-[2.5]" />
                          {tx.creditsChange}
                        </>
                      )}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
