/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { FamilyStylePlan } from '../../types/family';
import { familyService } from '../../services/familyService';
import { Calendar, Users, Trash2, ArrowRight, Sparkles, Heart } from 'lucide-react';
import { Button } from '../common/Button';

interface SavedFamilyPlansViewProps {
  plans: FamilyStylePlan[];
  onLoadPlan: (plan: FamilyStylePlan) => void;
  onStartNewPlan: () => void;
  onPlanDeleted: () => void;
}

export const SavedFamilyPlansView: React.FC<SavedFamilyPlansViewProps> = ({
  plans,
  onLoadPlan,
  onStartNewPlan,
  onPlanDeleted,
}) => {
  const handleDelete = (e: React.MouseEvent, planId: string) => {
    e.stopPropagation();
    familyService.deletePlan(planId);
    onPlanDeleted();
  };

  if (plans.length === 0) {
    return (
      <div className="bg-white rounded-3xl border border-[#242326]/10 p-8 sm:p-12 text-center max-w-lg mx-auto shadow-xs">
        <div className="w-16 h-16 rounded-3xl bg-[#FAF7F2] border border-[#242326]/10 text-[#9C6A61] flex items-center justify-center mx-auto mb-4">
          <Heart className="w-8 h-8" />
        </div>
        <h3 className="font-serif text-xl font-semibold text-[#242326] mb-2">
          No Saved Family Plans Yet
        </h3>
        <p className="text-xs text-[#5C585E] leading-relaxed mb-6">
          Coordinate outfits for weddings, birthdays, holidays, or portraits, and save the looks here to reference anytime.
        </p>
        <Button onClick={onStartNewPlan} variant="primary">
          Plan Your First Occasion
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h2 className="font-serif text-lg sm:text-xl font-semibold text-[#242326]">
            Saved Family Occasion Plans
          </h2>
          <p className="text-xs text-[#5C585E]">
            {plans.length} coordinated {plans.length === 1 ? 'look' : 'looks'} saved
          </p>
        </div>
        <Button onClick={onStartNewPlan} variant="secondary" size="sm">
          + New Plan
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {plans.map((plan) => (
          <div
            key={plan.id}
            onClick={() => onLoadPlan(plan)}
            className="bg-white rounded-3xl border border-[#242326]/10 p-5 sm:p-6 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
          >
            <div>
              {/* Header */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-[#9C6A61] bg-[#E5CDBE]/30 px-2.5 py-0.5 rounded-full inline-block mb-1.5">
                    {plan.occasion} · {plan.formality}
                  </span>
                  <h3 className="font-serif text-lg font-semibold text-[#242326] group-hover:text-[#9C6A61] transition-colors">
                    {plan.title}
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={(e) => handleDelete(e, plan.id)}
                  className="p-2 text-[#5C585E] hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer shrink-0"
                  title="Delete Plan"
                  aria-label="Delete Plan"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Palette Swatches */}
              <div className="flex items-center gap-2 mb-4">
                <div className="flex items-center -space-x-1.5">
                  {plan.colorPalette.colors.map((c, i) => (
                    <div
                      key={i}
                      className="w-5 h-5 rounded-full border border-white shadow-2xs"
                      style={{ backgroundColor: c }}
                      title={c}
                    />
                  ))}
                </div>
                <span className="text-xs text-[#5C585E]">
                  {plan.colorPalette.name}
                </span>
              </div>

              {/* Meta details */}
              <div className="grid grid-cols-2 gap-2 text-xs bg-[#FAF7F2] p-3 rounded-2xl mb-4 border border-[#242326]/5">
                <div className="flex items-center gap-1.5 text-[#5C585E]">
                  <Users className="w-3.5 h-3.5 text-[#B49361]" />
                  <span>{plan.outfitConcepts.length} Family Members</span>
                </div>
                <div className="text-right font-medium text-[#242326]">
                  Budget: R{plan.totalBudgetZar.toLocaleString()}
                </div>
              </div>

              {/* Coordination Note */}
              <p className="text-xs text-[#5C585E] line-clamp-2 italic mb-4">
                "{plan.coordinationNote}"
              </p>
            </div>

            {/* Bottom Card Action */}
            <div className="pt-3 border-t border-[#242326]/8 flex items-center justify-between text-xs font-semibold text-[#9C6A61] group-hover:text-[#794E46]">
              <span>View Outfits & Pieces</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
