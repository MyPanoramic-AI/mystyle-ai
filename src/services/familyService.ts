/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Local persistence service for Family Profiles and Coordinated Family Plans.
 * Stores non-sensitive profiles and plans securely in localStorage.
 */

import { FamilyProfile, FamilyStylePlan } from '../types/family';

const FAMILY_MEMBERS_KEY = 'mystyle_family_members_v1';
const SAVED_PLANS_KEY = 'mystyle_saved_family_plans_v1';

export const INITIAL_DEMO_FAMILY_MEMBERS: FamilyProfile[] = [
  {
    id: 'fam-member-1',
    name: 'David',
    relationship: 'Partner / Spouse',
    classification: 'Adult',
    ageRange: '36-45',
    sizes: {
      topsSize: 'L / 42',
      bottomsSize: '34 / Regular',
      shoeSize: '10 UK',
    },
    favoriteStyles: ['Smart Casual', 'Classic Tailored', 'Modern Minimal'],
    favoriteColors: ['Navy', 'Slate Grey', 'Forest Green', 'Crisp White'],
    comfortPreferences: ['Breathable linen blends', 'Unstructured jackets', 'No stiff collars'],
    individualBudgetZar: 3200,
    avatarSeed: 'david',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'fam-member-2',
    name: 'Chloe',
    relationship: 'Daughter',
    classification: 'Child',
    ageRange: '8 Years',
    sizes: {
      topsSize: '7-8Y',
      bottomsSize: '7-8Y',
      shoeSize: '2 UK',
      dressSize: '7-8Y',
    },
    favoriteStyles: ['Playful Preppy', 'Soft Pastels', 'Comfort First'],
    favoriteColors: ['Soft Rose', 'Buttercup Yellow', 'Sage Green', 'Warm Cream'],
    comfortPreferences: ['Tagless neckline', 'Soft elastic waistbands', 'Spin-friendly skirts', 'Breathable cotton'],
    individualBudgetZar: 1400,
    avatarSeed: 'chloe',
    photoConsentNotice: 'Protected: minor details stay exclusively on this private device',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'fam-member-3',
    name: 'Liam',
    relationship: 'Son',
    classification: 'Child',
    ageRange: '12 Years',
    sizes: {
      topsSize: '11-12Y',
      bottomsSize: '12Y',
      shoeSize: '5 UK',
    },
    favoriteStyles: ['Casual Modern', 'Sporty Classic'],
    favoriteColors: ['Sand Beige', 'Denim Blue', 'Crisp White', 'Olive'],
    comfortPreferences: ['Flexible stretch chinos', 'Soft Oxford cotton', 'Lightweight trainers'],
    individualBudgetZar: 1600,
    avatarSeed: 'liam',
    photoConsentNotice: 'Protected: minor details stay exclusively on this private device',
    createdAt: new Date().toISOString(),
  },
];

class FamilyService {
  private listeners: Array<() => void> = [];

  constructor() {
    // Demonstration profiles are returned only when a screen asks for browser storage.
    // They are never written until the demonstration user edits them, and never uploaded.
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify(): void {
    this.listeners.forEach((l) => l());
  }

  // --- Family Members CRUD ---

  public getFamilyMembers(): FamilyProfile[] {
    try {
      const data = localStorage.getItem(FAMILY_MEMBERS_KEY);
      if (!data) return INITIAL_DEMO_FAMILY_MEMBERS;
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_DEMO_FAMILY_MEMBERS;
    } catch {
      return INITIAL_DEMO_FAMILY_MEMBERS;
    }
  }

  public saveFamilyMembers(members: FamilyProfile[]): void {
    try {
      localStorage.setItem(FAMILY_MEMBERS_KEY, JSON.stringify(members));
      this.notify();
    } catch (e) {
      console.warn('Failed to save family members to localStorage:', e);
    }
  }

  public addFamilyMember(member: Omit<FamilyProfile, 'id' | 'createdAt'>): FamilyProfile {
    const newMember: FamilyProfile = {
      ...member,
      id: `fam-member-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    const current = this.getFamilyMembers();
    const updated = [...current, newMember];
    this.saveFamilyMembers(updated);
    return newMember;
  }

  public updateFamilyMember(updatedMember: FamilyProfile): void {
    const current = this.getFamilyMembers();
    const updated = current.map((m) => (m.id === updatedMember.id ? updatedMember : m));
    this.saveFamilyMembers(updated);
  }

  public deleteFamilyMember(id: string): void {
    const current = this.getFamilyMembers();
    const updated = current.filter((m) => m.id !== id);
    this.saveFamilyMembers(updated);
  }

  public resetToDefaultMembers(): void {
    this.saveFamilyMembers(INITIAL_DEMO_FAMILY_MEMBERS);
  }

  // --- Saved Family Styling Plans ---

  public getSavedPlans(): FamilyStylePlan[] {
    try {
      const data = localStorage.getItem(SAVED_PLANS_KEY);
      if (!data) return [];
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  public savePlan(plan: Omit<FamilyStylePlan, 'id' | 'savedAt'>): FamilyStylePlan {
    const newPlan: FamilyStylePlan = {
      ...plan,
      id: `plan-${Date.now()}`,
      savedAt: new Date().toISOString(),
    };
    const current = this.getSavedPlans();
    // Replace if same title/occasion or add
    const filtered = current.filter((p) => p.id !== newPlan.id);
    const updated = [newPlan, ...filtered];
    try {
      localStorage.setItem(SAVED_PLANS_KEY, JSON.stringify(updated));
      this.notify();
    } catch (e) {
      console.warn('Failed to save family plan:', e);
    }
    return newPlan;
  }

  public deletePlan(planId: string): void {
    const current = this.getSavedPlans();
    const updated = current.filter((p) => p.id !== planId);
    try {
      localStorage.setItem(SAVED_PLANS_KEY, JSON.stringify(updated));
      this.notify();
    } catch (e) {
      console.warn('Failed to delete family plan:', e);
    }
  }
}

export const familyService = new FamilyService();
