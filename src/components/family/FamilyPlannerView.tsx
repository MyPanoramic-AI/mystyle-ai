/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  FamilyProfile,
  OccasionType,
  FormalityLevel,
  StyleDirection,
  ColorPaletteOption,
  FamilyOutfitConcept,
  FamilyStylePlan,
  FamilyShoppingItem,
} from '../../types/family';
import { UserProfile } from '../../types';
import {
  OCCASION_CONFIGS,
  CURATED_PALETTES,
  STYLE_DIRECTIONS,
  generateCoordinatedConcepts,
} from '../../data/familyData';
import { familyService } from '../../services/familyService';
import { Button } from '../common/Button';
import {
  Sparkles,
  Users,
  Check,
  ArrowRight,
  Heart,
  ShoppingBag,
  Eye,
  MessageSquare,
  Sliders,
  DollarSign,
  Palette,
  ShieldCheck,
} from 'lucide-react';

interface FamilyPlannerViewProps {
  userProfile: UserProfile;
  familyMembers: FamilyProfile[];
  initialPlan?: FamilyStylePlan | null;
  onSendToTryOn: (concept: FamilyOutfitConcept) => void;
  onSendToShop: (shoppingItems: FamilyShoppingItem[]) => void;
  onAskStylist: (prompt: string) => void;
  onOpenShoppingList: (items: FamilyShoppingItem[]) => void;
  persistPlan?: (plan: Omit<FamilyStylePlan, 'id' | 'savedAt'> & { id?: string }) => Promise<void>;
}

export const FamilyPlannerView: React.FC<FamilyPlannerViewProps> = ({
  userProfile,
  familyMembers,
  initialPlan,
  onSendToTryOn,
  onSendToShop,
  onAskStylist,
  onOpenShoppingList,
  persistPlan,
}) => {
  // Occasion & Formality
  const [selectedOccasion, setSelectedOccasion] = useState<OccasionType>(
    initialPlan?.occasion || 'Family Photoshoot'
  );
  const [formality, setFormality] = useState<FormalityLevel>(
    initialPlan?.formality || 'Smart Casual'
  );

  // Attendees selection (Mom is always available as self, plus other family members)
  const defaultAttendees = useMemo(() => {
    return ['self', ...familyMembers.map((m) => m.id)];
  }, [familyMembers]);

  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>(
    initialPlan?.participatingMemberIds || defaultAttendees
  );

  // Palette & Direction
  const [selectedPaletteId, setSelectedPaletteId] = useState<string>(
    initialPlan?.colorPalette.id || 'palette-coastal-sage'
  );
  const [selectedDirection, setSelectedDirection] = useState<StyleDirection>(
    initialPlan?.styleDirection || 'Coordinated Colours'
  );

  // Budget
  const [totalBudgetZar, setTotalBudgetZar] = useState<number>(
    initialPlan?.totalBudgetZar || 6500
  );

  // Saved notification state
  const [savedSuccessMsg, setSavedSuccessMsg] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [eventDate, setEventDate] = useState(initialPlan?.eventDate || '');
  const [savingPlan, setSavingPlan] = useState(false);

  // Active palette object
  const activePalette = useMemo(() => {
    return (
      CURATED_PALETTES.find((p) => p.id === selectedPaletteId) || CURATED_PALETTES[0]
    );
  }, [selectedPaletteId]);

  // Combined attendees list for generation
  const activeAttendeesList = useMemo(() => {
    const list: Array<{
      id: string;
      name: string;
      relationship: string;
      classification: 'Adult' | 'Child';
    }> = [];

    if (selectedMemberIds.includes('self')) {
      list.push({
        id: 'self',
        name: userProfile.personal.firstName || 'Elena',
        relationship: 'Self (Account Holder)',
        classification: 'Adult',
      });
    }

    familyMembers.forEach((m) => {
      if (selectedMemberIds.includes(m.id)) {
        list.push({
          id: m.id,
          name: m.name,
          relationship: m.relationship,
          classification: m.classification,
        });
      }
    });

    return list;
  }, [selectedMemberIds, familyMembers, userProfile]);

  // Generate or use concepts
  const outfitConcepts = useMemo(() => {
    if (initialPlan && initialPlan.occasion === selectedOccasion && initialPlan.colorPalette.id === selectedPaletteId) {
      return initialPlan.outfitConcepts;
    }
    return generateCoordinatedConcepts({
      occasion: selectedOccasion,
      palette: activePalette,
      styleDirection: selectedDirection,
      members: activeAttendeesList,
      totalBudgetZar,
    });
  }, [selectedOccasion, activePalette, selectedDirection, activeAttendeesList, totalBudgetZar, initialPlan]);

  // Derive shopping items from concepts
  const shoppingItems = useMemo<FamilyShoppingItem[]>(() => {
    const items: FamilyShoppingItem[] = [];
    outfitConcepts.forEach((concept) => {
      concept.pieces.forEach((piece) => {
        items.push({
          id: `shop-${piece.id}`,
          familyMemberId: concept.familyMemberId,
          familyMemberName: concept.familyMemberName,
          pieceName: piece.name,
          category: piece.category,
          status: 'Need to Buy',
          estimatedPriceZar: piece.estimatedPriceZar,
        });
      });
    });
    return items;
  }, [outfitConcepts]);

  const toggleMember = (id: string) => {
    if (selectedMemberIds.includes(id)) {
      if (selectedMemberIds.length > 1) {
        setSelectedMemberIds(selectedMemberIds.filter((m) => m !== id));
      }
    } else {
      setSelectedMemberIds([...selectedMemberIds, id]);
    }
  };

  const handleOccasionChange = (occ: OccasionType) => {
    setSelectedOccasion(occ);
    const config = OCCASION_CONFIGS.find((c) => c.type === occ);
    if (config) {
      setFormality(config.defaultFormality);
      setTotalBudgetZar(config.suggestedBudgetZar);
    }
  };

  const handleSavePlan = async () => {
    const coordinationRationale = `Harmonised ${selectedOccasion} aesthetic in ${activePalette.name} with ${selectedDirection.toLowerCase()} direction. These are planned outfit concepts, not shop prices or purchases.`;

    const planToSave = {
      id: initialPlan?.id,
      title: `${selectedOccasion} · ${activePalette.name}`,
      occasion: selectedOccasion,
      eventDate: eventDate || undefined,
      formality,
      styleDirection: selectedDirection,
      colorPalette: activePalette,
      totalBudgetZar,
      participatingMemberIds: selectedMemberIds,
      outfitConcepts,
      budgetAllocations: outfitConcepts.map((c) => ({
        familyMemberId: c.familyMemberId,
        familyMemberName: c.familyMemberName,
        allocatedAmountZar: c.allocatedBudgetZar,
      })),
      shoppingItems,
      coordinationNote: coordinationRationale,
    };

    setSaveError(null);
    setSavingPlan(true);
    try {
      if (persistPlan) await persistPlan(planToSave);
      else {
        const { id: _ignored, ...demoPlan } = planToSave;
        familyService.savePlan(demoPlan);
      }
      setSavedSuccessMsg('Event plan saved.');
      setTimeout(() => setSavedSuccessMsg(null), 4000);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Unable to save changes.');
    } finally {
      setSavingPlan(false);
    }
  };

  const handleAskStylistCoordination = () => {
    const adultNames = activeAttendeesList.filter((member) => member.classification === 'Adult').map((member) => member.name);
    const prompt = `Can you provide personal styling feedback on an adult family look for a ${selectedOccasion}? We are using the "${activePalette.name}" palette with a ${formality} dress code for ${adultNames.join(', ') || 'the adults attending'}. Please do not ask for or use details about children.`;
    onAskStylist(prompt);
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {saveError && (
        <div className="p-4 rounded-2xl bg-[#9C6A61]/10 border border-[#9C6A61]/20 text-xs text-[#9C6A61]">
          {saveError}
        </div>
      )}
      {savedSuccessMsg && (
        <div className="bg-emerald-800 text-white p-4 rounded-2xl shadow-lg flex items-center justify-between text-xs animate-fadeIn">
          <span className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-300" />
            {savedSuccessMsg}
          </span>
          <button
            onClick={() => setSavedSuccessMsg(null)}
            className="text-emerald-200 hover:text-white"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* STEP 1: OCCASION PICKER */}
      <div className="bg-white rounded-3xl border border-[#242326]/10 p-5 sm:p-7 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[#9C6A61] block mb-1">
              Step 1 of 3
            </span>
            <h2 className="font-serif text-lg sm:text-xl font-semibold text-[#242326]">
              Choose The Family Occasion
            </h2>
          </div>
          <span className="text-xs text-[#5C585E]">
            {OCCASION_CONFIGS.length} Curated Milestones
          </span>
        </div>

        {/* Scrollable Occasions Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {OCCASION_CONFIGS.map((config) => {
            const isSelected = selectedOccasion === config.type;
            return (
              <div
                key={config.type}
                onClick={() => handleOccasionChange(config.type)}
                className={`relative rounded-2xl overflow-hidden border p-3 text-left transition-all cursor-pointer flex flex-col justify-end min-h-[110px] group ${
                  isSelected
                    ? 'border-[#9C6A61] ring-2 ring-[#9C6A61]/30 shadow-sm'
                    : 'border-[#242326]/10 hover:border-[#242326]/30 bg-[#FAF7F2]'
                }`}
              >
                <img
                  src={config.imageUrl}
                  alt={config.title}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-30"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#242326]/90 via-[#242326]/40 to-transparent" />

                <div className="relative z-10">
                  <div className="flex items-center justify-between">
                    <h3 className="font-serif text-xs sm:text-sm font-semibold text-white leading-tight">
                      {config.title}
                    </h3>
                    {isSelected && (
                      <span className="w-4 h-4 rounded-full bg-[#9C6A61] text-white flex items-center justify-center shrink-0">
                        <Check className="w-2.5 h-2.5" />
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-white/80 mt-1 block">
                    {config.defaultFormality}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* STEP 2: PARTICIPATING MEMBERS & PALETTE */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Attendees Selector Card */}
        <div className="bg-white rounded-3xl border border-[#242326]/10 p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[#9C6A61] block mb-0.5">
                  Step 2
                </span>
                <h3 className="font-serif text-base font-semibold text-[#242326] flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#B49361]" />
                  Who Is Attending?
                </h3>
              </div>
              <span className="text-xs text-[#5C585E]">
                {activeAttendeesList.length} Selected
              </span>
            </div>

            <p className="text-xs text-[#5C585E] mb-3">
              Toggle family members participating in this coordinated styling session:
            </p>

            <div className="space-y-2">
              {/* Account Holder (Self) */}
              <div
                onClick={() => toggleMember('self')}
                className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                  selectedMemberIds.includes('self')
                    ? 'bg-[#FAF7F2] border-[#9C6A61]'
                    : 'bg-white border-[#242326]/10 opacity-60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#E5CDBE]/50 text-[#9C6A61] font-serif font-bold text-sm flex items-center justify-center">
                    {userProfile.personal.firstName.charAt(0)}
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-[#242326] block">
                      {userProfile.personal.firstName} (You)
                    </span>
                    <span className="text-[10px] text-[#5C585E]">
                      Adult · {userProfile.styles[0] || 'Modern Minimal'}
                    </span>
                  </div>
                </div>
                <div
                  className={`w-5 h-5 rounded-lg border flex items-center justify-center ${
                    selectedMemberIds.includes('self')
                      ? 'bg-[#9C6A61] border-[#9C6A61] text-white'
                      : 'border-[#242326]/20'
                  }`}
                >
                  {selectedMemberIds.includes('self') && <Check className="w-3 h-3" />}
                </div>
              </div>

              {/* Family Members */}
              {familyMembers.map((member) => {
                const isSelected = selectedMemberIds.includes(member.id);
                return (
                  <div
                    key={member.id}
                    onClick={() => toggleMember(member.id)}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'bg-[#FAF7F2] border-[#9C6A61]'
                        : 'bg-white border-[#242326]/10 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-[#B49361]/20 text-[#242326] font-serif font-bold text-sm flex items-center justify-center">
                        {member.name.charAt(0)}
                      </div>
                      <div>
                        <span className="text-xs font-semibold text-[#242326] block">
                          {member.name}
                        </span>
                        <span className="text-[10px] text-[#5C585E]">
                          {member.relationship} {member.ageRange ? `· ${member.ageRange}` : ''}
                        </span>
                      </div>
                    </div>
                    <div
                      className={`w-5 h-5 rounded-lg border flex items-center justify-center ${
                        isSelected
                          ? 'bg-[#9C6A61] border-[#9C6A61] text-white'
                          : 'border-[#242326]/20'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Coordinated Color Palette Card */}
        <div className="bg-white rounded-3xl border border-[#242326]/10 p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[#9C6A61] block mb-0.5">
                  Step 3
                </span>
                <h3 className="font-serif text-base font-semibold text-[#242326] flex items-center gap-2">
                  <Palette className="w-4 h-4 text-[#B49361]" />
                  Harmonious Colour Palette
                </h3>
              </div>
            </div>

            <p className="text-xs text-[#5C585E] mb-3">
              Choose an aesthetic palette calibrated for group portraits:
            </p>

            <div className="space-y-2.5">
              {CURATED_PALETTES.map((palette) => {
                const isSelected = selectedPaletteId === palette.id;
                return (
                  <div
                    key={palette.id}
                    onClick={() => setSelectedPaletteId(palette.id)}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#FAF7F2] border-[#9C6A61] ring-1 ring-[#9C6A61]/20'
                        : 'bg-white border-[#242326]/10 hover:border-[#242326]/30'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-semibold text-[#242326]">
                        {palette.name}
                      </span>
                      {isSelected && (
                        <span className="text-[10px] font-semibold text-[#9C6A61] bg-[#E5CDBE]/40 px-2 py-0.5 rounded-full">
                          Active Palette
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 mb-1.5">
                      {palette.colors.map((c, i) => (
                        <div
                          key={i}
                          className="w-6 h-6 rounded-lg border border-white shadow-xs"
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>

                    <p className="text-[11px] text-[#5C585E] leading-relaxed">
                      {palette.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* STEP 3: OCCASION BUDGET & STYLE DIRECTION */}
      <div className="bg-white rounded-3xl border border-[#242326]/10 p-5 sm:p-7 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="font-serif text-base sm:text-lg font-semibold text-[#242326] flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-[#B49361]" />
              Occasion Wardrobe Budget (ZAR)
            </h3>
            <p className="text-xs text-[#5C585E]">
              Allocated proportionally across {activeAttendeesList.length} attending members
            </p>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="font-serif text-2xl font-bold text-[#9C6A61]">
              R{totalBudgetZar.toLocaleString()}
            </span>
            <span className="text-xs text-[#5C585E]">Total ZAR</span>
          </div>
        </div>

        {/* Quick Budget Presets */}
        <div className="flex flex-wrap gap-2 mb-4">
          {[3500, 5500, 7500, 10000, 15000].map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => setTotalBudgetZar(preset)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                totalBudgetZar === preset
                  ? 'bg-[#242326] text-white border-[#242326]'
                  : 'bg-[#FAF7F2] text-[#5C585E] border-[#242326]/10 hover:border-[#242326]/30'
              }`}
            >
              R{preset.toLocaleString()}
            </button>
          ))}
        </div>

        {/* Slider */}
        <input
          type="range"
          min="2000"
          max="25000"
          step="250"
          value={totalBudgetZar}
          onChange={(e) => setTotalBudgetZar(Number(e.target.value))}
          className="w-full accent-[#9C6A61] cursor-pointer mb-4"
        />
        <label className="block text-xs text-[#5C585E] mb-4">
          Event date
          <input
            type="date"
            value={eventDate}
            onChange={(e) => setEventDate(e.target.value)}
            className="mt-1 block w-full rounded-xl border border-[#242326]/10 bg-[#FAF7F2] px-3 py-2 text-sm text-[#242326]"
          />
        </label>

        {/* Per-member budget breakdown chips */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-[#242326]/6">
          {outfitConcepts.map((c) => (
            <div
              key={c.id}
              className="px-3 py-1.5 rounded-xl bg-[#FAF7F2] border border-[#242326]/6 text-xs flex items-center gap-2"
            >
              <span className="text-[#5C585E]">{c.familyMemberName}:</span>
              <span className="font-semibold text-[#242326]">
                R{c.allocatedBudgetZar.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 4: COORDINATED OUTFIT CONCEPTS GALLERY */}
      <div className="space-y-4">
        {/* Coordination Rationale Banner */}
        <div className="bg-gradient-to-r from-[#FAF7F2] to-[#F6F2EC] rounded-3xl border border-[#242326]/10 p-5 sm:p-6 shadow-xs">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[#9C6A61] bg-[#E5CDBE]/40 px-2.5 py-0.5 rounded-full inline-block mb-1.5">
                Stylist Harmonisation Rationale
              </span>
              <h3 className="font-serif text-lg sm:text-xl font-semibold text-[#242326]">
                {selectedOccasion} · {activePalette.name}
              </h3>
              <p className="text-xs text-[#5C585E] mt-1 max-w-2xl leading-relaxed">
                By assigning {activePalette.colors.length} harmonised hues across individual cuts, the family looks visually unified in group portraits without matching identical fabrics.
              </p>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <Button onClick={() => { void handleSavePlan(); }} variant="primary" size="sm" disabled={savingPlan}>
                <span className="flex items-center gap-1.5">
                  <Heart className="w-3.5 h-3.5" />
                  <span>Save Plan</span>
                </span>
              </Button>

              <Button
                onClick={() => onOpenShoppingList(shoppingItems)}
                variant="secondary"
                size="sm"
              >
                <span className="flex items-center gap-1.5">
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>Shopping List</span>
                </span>
              </Button>

              <Button
                onClick={handleAskStylistCoordination}
                variant="secondary"
                size="sm"
              >
                <span className="flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-[#9C6A61]" />
                  <span>Stylist Advice</span>
                </span>
              </Button>
            </div>
          </div>
        </div>

        {/* Member Outfit Concepts Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {outfitConcepts.map((concept) => (
            <div
              key={concept.id}
              className="bg-white rounded-3xl border border-[#242326]/10 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                {/* Photo Header */}
                <div className="relative aspect-[16/10] overflow-hidden bg-[#E5CDBE]/20">
                  {concept.imageUrl ? (
                    <img
                      src={concept.imageUrl}
                      alt={concept.conceptTitle}
                      className="w-full h-full object-cover hover:scale-102 transition-transform duration-500"
                    />
                  ) : null}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#242326]/80 via-transparent to-black/20" />

                  {/* Member Name Badge */}
                  <div className="absolute top-3 left-3 bg-[#FAF7F2]/95 backdrop-blur-xs px-3 py-1.5 rounded-full border border-white/40 flex items-center gap-2 shadow-xs">
                    <div className="w-5 h-5 rounded-full bg-[#9C6A61] text-white font-serif font-bold text-[10px] flex items-center justify-center">
                      {concept.familyMemberName.charAt(0)}
                    </div>
                    <span className="text-xs font-semibold text-[#242326]">
                      {concept.familyMemberName}
                    </span>
                  </div>

                  {/* Palette Accent Swatches on Card */}
                  <div className="absolute top-3 right-3 flex items-center gap-1 bg-black/40 backdrop-blur-xs px-2 py-1 rounded-full">
                    {concept.colorPalette.map((c, idx) => (
                      <div
                        key={idx}
                        className="w-3.5 h-3.5 rounded-full border border-white/80"
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>

                  {/* Concept Title Overlay */}
                  <div className="absolute bottom-3 left-3 right-3 text-white">
                    <span className="text-[10px] uppercase tracking-wider text-white/80 block">
                      {concept.styleCategory} Ensemble
                    </span>
                    <h4 className="font-serif text-base sm:text-lg font-semibold leading-tight">
                      {concept.conceptTitle}
                    </h4>
                  </div>
                </div>

                {/* Content Section */}
                <div className="p-5 sm:p-6 space-y-4">
                  {/* Stylist Note */}
                  <div className="p-3 rounded-2xl bg-[#FAF7F2] border border-[#242326]/5 text-xs text-[#5C585E] leading-relaxed italic">
                    "{concept.stylingExplanation}"
                  </div>

                  {/* Key Pieces Breakdown */}
                  <div>
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-[#5C585E] block mb-2">
                      Curated Pieces & Estimated Budget
                    </span>
                    <div className="space-y-2">
                      {concept.pieces.map((piece) => (
                        <div
                          key={piece.id}
                          className="flex items-center justify-between text-xs py-1 border-b border-[#242326]/6"
                        >
                          <span className="text-[#242326] font-medium truncate max-w-[200px]">
                            {piece.name}
                          </span>
                          <span className="text-[#9C6A61] font-mono shrink-0">
                            R{piece.estimatedPriceZar.toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Member Allocation Total */}
                  <div className="flex items-center justify-between text-xs pt-2">
                    <span className="text-[#5C585E]">Allocated Member Budget:</span>
                    <span className="font-serif font-bold text-sm text-[#242326]">
                      R{concept.allocatedBudgetZar.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bottom Card Actions */}
              <div className="p-5 sm:p-6 pt-0 border-t border-[#242326]/8 mt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onSendToTryOn(concept)}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-[#F6F2EC] hover:bg-[#E5CDBE]/40 text-[#242326] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5 text-[#9C6A61]" />
                  <span>Try On in Studio</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    onSendToShop(
                      concept.pieces.map((p) => ({
                        id: `shop-${p.id}`,
                        familyMemberId: concept.familyMemberId,
                        familyMemberName: concept.familyMemberName,
                        pieceName: p.name,
                        category: p.category,
                        status: 'Need to Buy',
                        estimatedPriceZar: p.estimatedPriceZar,
                      }))
                    )
                  }
                  className="flex-1 py-2.5 px-3 rounded-xl bg-[#242326] hover:bg-[#38363a] text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>Shop Ensemble</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
