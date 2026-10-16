/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { UserProfile, NavigationTab } from '../../types';
import {
  FamilyProfile,
  FamilyStylePlan,
  FamilyOutfitConcept,
  FamilyShoppingItem,
} from '../../types/family';
import { familyService } from '../../services/familyService';
import { FamilyPlannerView } from './FamilyPlannerView';
import { FamilyMemberCard } from './FamilyMemberCard';
import { FamilyMemberModal } from './FamilyMemberModal';
import { FamilyShoppingListView } from './FamilyShoppingListView';
import { SavedFamilyPlansView } from './SavedFamilyPlansView';
import { Button } from '../common/Button';
import {
  ArrowLeft,
  Users,
  Sparkles,
  ShoppingBag,
  Heart,
  Plus,
  ShieldCheck,
} from 'lucide-react';

interface FamilyStylingScreenProps {
  userProfile: UserProfile;
  initialTab?: 'planner' | 'members' | 'shopping' | 'saved';
  onNavigate: (tab: NavigationTab) => void;
  onSendToTryOn: (concept: FamilyOutfitConcept) => void;
  onSendToShop: (shoppingItems: FamilyShoppingItem[]) => void;
  onAskStylist: (prompt: string) => void;
  onBack: () => void;
}

export const FamilyStylingScreen: React.FC<FamilyStylingScreenProps> = ({
  userProfile,
  initialTab = 'planner',
  onNavigate,
  onSendToTryOn,
  onSendToShop,
  onAskStylist,
  onBack,
}) => {
  const [activeTab, setActiveTab] = useState<'planner' | 'members' | 'shopping' | 'saved'>(initialTab);
  const [familyMembers, setFamilyMembers] = useState<FamilyProfile[]>(() =>
    familyService.getFamilyMembers()
  );
  const [savedPlans, setSavedPlans] = useState<FamilyStylePlan[]>(() =>
    familyService.getSavedPlans()
  );
  const [loadedPlan, setLoadedPlan] = useState<FamilyStylePlan | null>(null);

  // Modal state
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [memberToEdit, setMemberToEdit] = useState<FamilyProfile | null>(null);

  // Active shopping items state
  const [shoppingItemsList, setShoppingItemsList] = useState<FamilyShoppingItem[]>([]);

  useEffect(() => {
    const unsubscribe = familyService.subscribe(() => {
      setFamilyMembers(familyService.getFamilyMembers());
      setSavedPlans(familyService.getSavedPlans());
    });
    return unsubscribe;
  }, []);

  const handleOpenAddMember = () => {
    setMemberToEdit(null);
    setIsMemberModalOpen(true);
  };

  const handleEditMember = (member: FamilyProfile) => {
    setMemberToEdit(member);
    setIsMemberModalOpen(true);
  };

  const handleDeleteMember = (id: string) => {
    if (window.confirm('Are you sure you want to remove this family member?')) {
      familyService.deleteFamilyMember(id);
    }
  };

  const handleSaveMember = (
    memberData: Omit<FamilyProfile, 'id' | 'createdAt'>,
    idToUpdate?: string
  ) => {
    if (idToUpdate) {
      const existing = familyMembers.find((m) => m.id === idToUpdate);
      if (existing) {
        familyService.updateFamilyMember({
          ...existing,
          ...memberData,
        });
      }
    } else {
      familyService.addFamilyMember(memberData);
    }
    setIsMemberModalOpen(false);
  };

  const handleLoadPlan = (plan: FamilyStylePlan) => {
    setLoadedPlan(plan);
    setActiveTab('planner');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenShoppingList = (items: FamilyShoppingItem[]) => {
    setShoppingItemsList(items);
    setActiveTab('shopping');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fadeIn pb-12">
      {/* Top Bar with Back Button */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium text-[#5C585E] hover:text-[#242326] bg-white border border-[#242326]/10 hover:border-[#242326]/20 transition-all cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back</span>
        </button>

        <div className="flex items-center gap-1.5 text-[11px] text-[#5C585E] bg-white px-3 py-1.5 rounded-xl border border-[#242326]/10">
          <ShieldCheck className="w-3.5 h-3.5 text-[#9C6A61]" />
          <span>Private Family Sandbox</span>
        </div>
      </div>

      {/* Screen Header */}
      <div className="bg-white rounded-3xl border border-[#242326]/10 p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="p-1.5 rounded-lg bg-[#E5CDBE]/50 text-[#9C6A61]">
                <Users className="w-4 h-4" />
              </span>
              <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-[#242326]">
                Coordinated Family Styling
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-[#5C585E] max-w-xl">
              Harmony, comfort, and timeless elegance for weddings, holidays, birthdays, and family portraits.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button onClick={handleOpenAddMember} variant="secondary" size="sm">
              <span className="flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5 text-[#9C6A61]" />
                <span>Add Family Member</span>
              </span>
            </Button>
          </div>
        </div>

        {/* Tab Navigation Strip */}
        <div className="flex items-center gap-2 mt-6 pt-5 border-t border-[#242326]/8 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('planner')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'planner'
                ? 'bg-[#242326] text-white shadow-xs'
                : 'text-[#5C585E] hover:text-[#242326] bg-[#F6F2EC] hover:bg-[#E5CDBE]/30'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Occasion Planner</span>
          </button>

          <button
            onClick={() => setActiveTab('members')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'members'
                ? 'bg-[#242326] text-white shadow-xs'
                : 'text-[#5C585E] hover:text-[#242326] bg-[#F6F2EC] hover:bg-[#E5CDBE]/30'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Family Profiles ({familyMembers.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('shopping')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'shopping'
                ? 'bg-[#242326] text-white shadow-xs'
                : 'text-[#5C585E] hover:text-[#242326] bg-[#F6F2EC] hover:bg-[#E5CDBE]/30'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Wardrobe Checklist</span>
          </button>

          <button
            onClick={() => setActiveTab('saved')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'saved'
                ? 'bg-[#242326] text-white shadow-xs'
                : 'text-[#5C585E] hover:text-[#242326] bg-[#F6F2EC] hover:bg-[#E5CDBE]/30'
            }`}
          >
            <Heart className="w-3.5 h-3.5" />
            <span>Saved Plans ({savedPlans.length})</span>
          </button>
        </div>
      </div>

      {/* TAB 1: OCCASION PLANNER */}
      {activeTab === 'planner' && (
        <FamilyPlannerView
          userProfile={userProfile}
          familyMembers={familyMembers}
          initialPlan={loadedPlan}
          onSendToTryOn={onSendToTryOn}
          onSendToShop={onSendToShop}
          onAskStylist={onAskStylist}
          onOpenShoppingList={handleOpenShoppingList}
        />
      )}

      {/* TAB 2: FAMILY PROFILES LIST */}
      {activeTab === 'members' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h2 className="font-serif text-lg sm:text-xl font-semibold text-[#242326]">
                Family Style Profiles
              </h2>
              <p className="text-xs text-[#5C585E]">
                Personalised measurements, sensory comfort needs, and aesthetic preferences
              </p>
            </div>
            <Button onClick={handleOpenAddMember} variant="primary" size="sm">
              <span className="flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5" />
                <span>Add Member</span>
              </span>
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {familyMembers.map((member) => (
              <FamilyMemberCard
                key={member.id}
                member={member}
                onEdit={handleEditMember}
                onDelete={handleDeleteMember}
              />
            ))}
          </div>

          {/* Child Protection Notice Card */}
          <div className="p-4 rounded-3xl bg-[#FAF7F2] border border-[#242326]/10 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-[#9C6A61] shrink-0 mt-0.5" />
            <div className="text-xs text-[#5C585E] leading-relaxed">
              <strong className="text-[#242326]">Minor Privacy & Safeguarding:</strong>
              {' '}Child measurements and profile preferences are strictly protected and never uploaded to public servers or external tracking networks. They remain exclusively in your client-side browser session.
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: WARDROBE SHOPPING LIST */}
      {activeTab === 'shopping' && (
        <FamilyShoppingListView
          initialItems={shoppingItemsList}
          totalOccasionBudgetZar={loadedPlan?.totalBudgetZar || 6500}
          onSendToShop={onSendToShop}
        />
      )}

      {/* TAB 4: SAVED PLANS */}
      {activeTab === 'saved' && (
        <SavedFamilyPlansView
          plans={savedPlans}
          onLoadPlan={handleLoadPlan}
          onStartNewPlan={() => {
            setLoadedPlan(null);
            setActiveTab('planner');
          }}
          onPlanDeleted={() => setSavedPlans(familyService.getSavedPlans())}
        />
      )}

      {/* Member Modal */}
      <FamilyMemberModal
        isOpen={isMemberModalOpen}
        memberToEdit={memberToEdit}
        onClose={() => setIsMemberModalOpen(false)}
        onSave={handleSaveMember}
      />
    </div>
  );
};
