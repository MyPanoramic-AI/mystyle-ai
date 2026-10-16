/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { FamilyShoppingItem, ShoppingItemStatus } from '../../types/family';
import { Button } from '../common/Button';
import { ShoppingBag, CheckCircle2, CircleDollarSign, ArrowRight, Sparkles } from 'lucide-react';

interface FamilyShoppingListViewProps {
  initialItems: FamilyShoppingItem[];
  totalOccasionBudgetZar: number;
  onSendToShop: (neededItems: FamilyShoppingItem[]) => void;
}

export const FamilyShoppingListView: React.FC<FamilyShoppingListViewProps> = ({
  initialItems,
  totalOccasionBudgetZar,
  onSendToShop,
}) => {
  const [items, setItems] = useState<FamilyShoppingItem[]>(initialItems);

  // Group items by family member
  const groupedMembers = Array.from(new Set(items.map((i) => i.familyMemberName)));

  const handleStatusChange = (itemId: string, newStatus: ShoppingItemStatus) => {
    setItems((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, status: newStatus } : item))
    );
  };

  const neededItems = items.filter((i) => i.status === 'Need to Buy');
  const ownedItems = items.filter((i) => i.status === 'Already Owned');
  const neededTotalZar = neededItems.reduce((acc, i) => acc + i.estimatedPriceZar, 0);
  const ownedTotalZar = ownedItems.reduce((acc, i) => acc + i.estimatedPriceZar, 0);

  return (
    <div className="space-y-6">
      {/* Overview & Wardrobe Optimization Card */}
      <div className="bg-white rounded-3xl border border-[#242326]/10 p-5 sm:p-7 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-[#242326]/8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-1.5 rounded-lg bg-[#B49361]/20 text-[#B49361]">
                <ShoppingBag className="w-4 h-4" />
              </span>
              <h2 className="font-serif text-lg sm:text-xl font-semibold text-[#242326]">
                Family Wardrobe & Shopping Checklist
              </h2>
            </div>
            <p className="text-xs text-[#5C585E]">
              Track what you already own at home versus what needs to be shopped across South African retailers.
            </p>
          </div>

          <Button
            onClick={() => onSendToShop(neededItems.length > 0 ? neededItems : items)}
            variant="primary"
            className="w-full sm:w-auto shrink-0"
          >
            <span className="flex items-center gap-2">
              <span>Shop Needed Items ({neededItems.length})</span>
              <ArrowRight className="w-4 h-4" />
            </span>
          </Button>
        </div>

        {/* Budget & Wardrobe Math Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-5">
          <div className="p-4 rounded-2xl bg-[#F6F2EC]">
            <span className="text-[11px] uppercase tracking-wider text-[#5C585E] block mb-1">
              Need to Buy ({neededItems.length} pieces)
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="font-serif text-xl sm:text-2xl font-bold text-[#9C6A61]">
                R{neededTotalZar.toLocaleString()}
              </span>
              <span className="text-xs text-[#5C585E]">ZAR</span>
            </div>
            <p className="text-[11px] text-[#5C585E] mt-1">
              New wardrobe pieces to acquire
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#242326]/5">
            <span className="text-[11px] uppercase tracking-wider text-[#5C585E] block mb-1">
              Wardrobe Saved ({ownedItems.length} pieces)
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="font-serif text-xl sm:text-2xl font-bold text-emerald-800">
                R{ownedTotalZar.toLocaleString()}
              </span>
              <span className="text-xs text-emerald-700">saved</span>
            </div>
            <p className="text-[11px] text-[#5C585E] mt-1">
              Repurposed from existing home closets
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#242326]/5">
            <span className="text-[11px] uppercase tracking-wider text-[#5C585E] block mb-1">
              Total Occasion Budget
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="font-serif text-xl sm:text-2xl font-bold text-[#242326]">
                R{totalOccasionBudgetZar.toLocaleString()}
              </span>
              <span className="text-xs text-[#5C585E]">target</span>
            </div>
            <p className="text-[11px] text-[#5C585E] mt-1">
              {totalOccasionBudgetZar >= neededTotalZar
                ? `Under budget by R${(totalOccasionBudgetZar - neededTotalZar).toLocaleString()}`
                : `Over target by R${(neededTotalZar - totalOccasionBudgetZar).toLocaleString()}`}
            </p>
          </div>
        </div>
      </div>

      {/* Member by Member Breakdown */}
      <div className="space-y-4">
        {groupedMembers.map((memberName) => {
          const memberPieces = items.filter((i) => i.familyMemberName === memberName);
          const memberNeededZar = memberPieces
            .filter((p) => p.status === 'Need to Buy')
            .reduce((sum, p) => sum + p.estimatedPriceZar, 0);

          return (
            <div
              key={memberName}
              className="bg-white rounded-3xl border border-[#242326]/10 p-5 sm:p-6 shadow-xs"
            >
              <div className="flex items-center justify-between pb-3.5 border-b border-[#242326]/8 mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#E5CDBE]/50 text-[#9C6A61] font-serif font-bold text-sm flex items-center justify-center">
                    {memberName.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-serif text-base font-semibold text-[#242326]">
                      {memberName}
                    </h3>
                    <span className="text-[11px] text-[#5C585E]">
                      {memberPieces.length} ensemble pieces
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs font-semibold text-[#9C6A61]">
                    R{memberNeededZar.toLocaleString()} needed
                  </span>
                </div>
              </div>

              {/* Items List */}
              <div className="divide-y divide-[#242326]/6">
                {memberPieces.map((piece) => (
                  <div
                    key={piece.id}
                    className="py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-[#242326]">
                          {piece.pieceName}
                        </span>
                        <span className="text-[10px] text-[#5C585E] bg-[#F6F2EC] px-2 py-0.5 rounded-md">
                          {piece.category}
                        </span>
                      </div>
                      <span className="text-xs text-[#9C6A61] font-mono mt-0.5 block">
                        Est. R{piece.estimatedPriceZar.toLocaleString()}
                      </span>
                    </div>

                    {/* Status Toggle Pills */}
                    <div className="flex items-center gap-1.5 shrink-0 bg-[#F6F2EC] p-1 rounded-xl">
                      {(['Need to Buy', 'Already Owned', 'Planned'] as ShoppingItemStatus[]).map(
                        (statusOption) => {
                          const isActive = piece.status === statusOption;
                          return (
                            <button
                              key={statusOption}
                              type="button"
                              onClick={() => handleStatusChange(piece.id, statusOption)}
                              className={`px-2.5 py-1 text-[11px] font-medium rounded-lg transition-all cursor-pointer ${
                                isActive
                                  ? statusOption === 'Need to Buy'
                                    ? 'bg-[#9C6A61] text-white shadow-xs'
                                    : statusOption === 'Already Owned'
                                    ? 'bg-emerald-700 text-white shadow-xs'
                                    : 'bg-[#242326] text-white shadow-xs'
                                  : 'text-[#5C585E] hover:text-[#242326]'
                              }`}
                            >
                              {statusOption}
                            </button>
                          );
                        }
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
