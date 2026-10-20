export interface FamilyPlanningBoundary {
  externalTransmission: 'disabled';
  dependentsIncluded: false;
  photographsIncluded: false;
  adultProfiles: { id: string; displayName: string }[];
}

export function familyPlanningBoundary(members: { id: string; displayName: string; memberKind: string }[]): FamilyPlanningBoundary {
  return {
    externalTransmission: 'disabled',
    dependentsIncluded: false,
    photographsIncluded: false,
    adultProfiles: members
      .filter((member) => member.memberKind === 'adult')
      .map((member) => ({ id: member.id, displayName: member.displayName })),
  };
}

export function splitBudgetCents(totalCents: number, count: number): number[] {
  if (!Number.isInteger(totalCents) || totalCents < 0 || count < 1) return [];
  const base = Math.floor(totalCents / count);
  const remainder = totalCents - base * count;
  return Array.from({ length: count }, (_unused, index) => base + (index < remainder ? 1 : 0));
}
