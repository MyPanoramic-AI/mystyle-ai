import type { AccountApi } from './accountApi';
import { AccountApiError } from './accountApi';
import type { ColorPaletteOption, FamilyProfile, FamilyRelationship, FamilyStylePlan } from '../types/family';
import { CURATED_PALETTES } from '../data/familyData';

export function familyStatus(error: unknown): string {
  if (error instanceof AccountApiError) {
    if (error.status === 401) return 'Session expired.';
    if (error.status === 0) return 'Backend unavailable.';
    return 'Unable to save changes.';
  }
  return 'Backend unavailable.';
}

function cents(zar: number | undefined): number | null {
  if (zar == null || !Number.isFinite(zar)) return null;
  return Math.max(0, Math.round(zar * 100));
}

function profileFrom(row: Record<string, unknown>): FamilyProfile {
  const sizes = (row.sizes ?? {}) as Record<string, string>;
  return {
    id: String(row.id),
    name: String(row.displayName),
    relationship: (row.relationshipLabel || 'Other Family Member') as FamilyRelationship,
    classification: row.memberKind === 'dependent' ? 'Child' : 'Adult',
    sizes: {
      topsSize: sizes.topsSize || '',
      bottomsSize: sizes.bottomsSize || '',
      shoeSize: sizes.shoeSize || '',
      dressSize: sizes.dressSize || undefined,
    },
    favoriteStyles: Array.isArray(row.styles) ? row.styles as string[] : [],
    favoriteColors: Array.isArray(row.colours) ? row.colours as string[] : [],
    comfortPreferences: Array.isArray(row.comfort) ? row.comfort as string[] : [],
    individualBudgetZar: typeof row.budgetCents === 'number' ? row.budgetCents / 100 : undefined,
    createdAt: String(row.createdAt),
  };
}

function profileBody(member: Omit<FamilyProfile, 'id' | 'createdAt'>): Record<string, unknown> {
  return {
    displayName: member.name,
    memberKind: member.classification === 'Child' ? 'dependent' : 'adult',
    relationshipLabel: member.relationship,
    styles: member.favoriteStyles,
    colours: member.favoriteColors,
    comfort: member.comfortPreferences,
    sizes: member.sizes,
    budgetCents: cents(member.individualBudgetZar),
  };
}

function paletteOf(value: unknown): ColorPaletteOption {
  const record = value && typeof value === 'object' ? value as ColorPaletteOption : null;
  if (record?.id && Array.isArray(record.colors)) return record;
  return CURATED_PALETTES[0];
}

function planFrom(row: Record<string, unknown>): FamilyStylePlan {
  const participants = Array.isArray(row.participants) ? row.participants as { memberId: string; allocatedBudgetCents: number; outfitNote: string | null }[] : [];
  const palette = paletteOf(row.colourTheme);
  return {
    id: String(row.id),
    title: String(row.title),
    occasion: String(row.occasion) as FamilyStylePlan['occasion'],
    eventDate: typeof row.eventDate === 'string' ? row.eventDate : undefined,
    formality: (row.formality || 'Smart Casual') as FamilyStylePlan['formality'],
    styleDirection: (row.styleDirection || 'Coordinated Colours') as FamilyStylePlan['styleDirection'],
    colorPalette: palette,
    totalBudgetZar: Number(row.totalBudgetCents || 0) / 100,
    participatingMemberIds: participants.map((participant) => participant.memberId),
    outfitConcepts: participants.map((participant) => ({
      id: `saved-${participant.memberId}`,
      familyMemberId: participant.memberId,
      familyMemberName: participant.memberId === 'self' ? 'You' : participant.memberId,
      conceptTitle: participant.outfitNote || 'Planned outfit',
      imageUrl: '',
      pieces: [],
      colorPalette: palette.colors.slice(0, 2),
      stylingExplanation: 'Saved as a planned concept. Prices shown while planning are estimates, not shop prices.',
      styleCategory: 'Planned',
      allocatedBudgetZar: participant.allocatedBudgetCents / 100,
    })),
    budgetAllocations: participants.map((participant) => ({
      familyMemberId: participant.memberId,
      familyMemberName: participant.memberId,
      allocatedAmountZar: participant.allocatedBudgetCents / 100,
    })),
    shoppingItems: [],
    coordinationNote: typeof row.notes === 'string' ? row.notes : '',
    savedAt: String(row.updatedAt || row.createdAt),
  };
}

export function createAccountFamily(api: AccountApi) {
  return {
    async loadMembers() {
      const listed = await api.familyMembers();
      return listed.members.map(profileFrom);
    },
    async loadPlans() {
      const listed = await api.familyEvents();
      return listed.events.map(planFrom);
    },
    async saveMember(member: Omit<FamilyProfile, 'id' | 'createdAt'>, id?: string) {
      const saved = id ? await api.updateFamilyMember(id, profileBody(member)) : await api.createFamilyMember(profileBody(member));
      return profileFrom(saved);
    },
    deleteMember: (id: string) => api.deleteFamilyMember(id),
    async savePlan(plan: Omit<FamilyStylePlan, 'id' | 'savedAt'> & { id?: string }) {
      const body = {
        title: plan.title,
        occasion: plan.occasion,
        eventDate: plan.eventDate || null,
        formality: plan.formality,
        styleDirection: plan.styleDirection,
        colourTheme: plan.colorPalette,
        totalBudgetCents: cents(plan.totalBudgetZar) ?? 0,
        notes: plan.coordinationNote,
        status: 'planned',
        participants: plan.participatingMemberIds.map((memberId) => {
          const concept = plan.outfitConcepts.find((item) => item.familyMemberId === memberId);
          return {
            memberId,
            allocatedBudgetCents: cents(concept?.allocatedBudgetZar) ?? undefined,
            outfitNote: concept?.conceptTitle ?? null,
          };
        }),
      };
      const saved = plan.id ? await api.updateFamilyEvent(plan.id, body) : await api.createFamilyEvent(body);
      return planFrom(saved);
    },
    deletePlan: (id: string) => api.deleteFamilyEvent(id),
  };
}

export type AccountFamily = ReturnType<typeof createAccountFamily>;
