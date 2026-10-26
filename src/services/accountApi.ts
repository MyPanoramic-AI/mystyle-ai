import type { WardrobeItem, WardrobeOccasion, WardrobeOutfit, WardrobeSeason } from '../types/wardrobe';

export class AccountApiError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'AccountApiError';
  }
}

export interface AuthResult {
  userId: string;
  csrfToken: string;
  emailVerified?: boolean;
}

export interface SessionResponse extends AuthResult {
  email: string;
  emailVerified: boolean;
  expiresAt: string;
}

export interface AccountApi {
  health(): Promise<{ ok: boolean; status?: string; database?: string }>;
  ready(): Promise<{ ok: boolean; status: string; database: string; persistence?: 'persistent' | 'ephemeral' | 'local' }>;
  session(): Promise<SessionResponse>;
  register(email: string, password: string): Promise<AuthResult>;
  login(email: string, password: string): Promise<AuthResult>;
  logout(): Promise<void>;
  emailStatus(): Promise<{ email: string; emailVerified: boolean; verifiedAt: string | null }>;
  requestEmailVerification(): Promise<{ ok: boolean; sent: boolean; message: string }>;
  confirmEmailVerification(token: string): Promise<{ ok: boolean; emailVerified: boolean }>;
  requestPasswordReset(email: string): Promise<{ ok: boolean; message: string }>;
  confirmPasswordReset(token: string, password: string): Promise<{ ok: boolean; message: string }>;
  devMailbox(): Promise<{ messages: { id: string; kind: string; recipient: string; subject: string; createdAt: string }[] }>;
  devMailboxAction(id: string): Promise<{ id: string; kind: string; path: string }>;
  getProfile(): Promise<Record<string, unknown>>;
  saveProfile(body: Record<string, unknown>): Promise<Record<string, unknown>>;
  getPreferences(): Promise<Record<string, unknown>>;
  savePreferences(body: Record<string, unknown>): Promise<Record<string, unknown>>;
  stylistAvailability(): Promise<StylistAvailability>;
  stylistConversations(): Promise<{ conversations: { id: string; title: string; lastActivityAt: string }[] }>;
  createStylistConversation(): Promise<{ id: string }>;
  stylistConversation(id: string): Promise<{ id: string; messages: StylistServerMessage[] }>;
  sendStylistMessage(id: string, text: string, idempotencyKey: string): Promise<{ message: StylistServerMessage }>;
  deleteStylistConversation(id: string): Promise<void>;
  wardrobeItems(): Promise<{ items: WardrobeRecord[] }>;
  createWardrobeItem(body: Record<string, unknown>): Promise<WardrobeRecord>;
  updateWardrobeItem(id: string, body: Record<string, unknown>): Promise<WardrobeRecord>;
  deleteWardrobeItem(id: string): Promise<void>;
  looks(): Promise<{ looks: LookRecord[] }>;
  createLook(body: Record<string, unknown>): Promise<LookRecord>;
  updateLook(id: string, body: Record<string, unknown>): Promise<LookRecord>;
  deleteLook(id: string): Promise<void>;
  outfitPlans(): Promise<{ plans: PlanRecord[] }>;
  createOutfitPlan(body: Record<string, unknown>): Promise<PlanRecord>;
  updateOutfitPlan(id: string, body: Record<string, unknown>): Promise<PlanRecord>;
  deleteOutfitPlan(id: string): Promise<void>;
  uploadWardrobePhoto(imageBase64: string): Promise<{ id: string }>;
  profilePhotos(): Promise<ProfilePhotosResponse>;
  uploadProfilePhotoSlot(slot: ProfilePhotoSlot, imageBase64: string): Promise<ProfilePhotoUploadResult>;
  deleteProfilePhotoSlot(slot: ProfilePhotoSlot): Promise<{ slot: ProfilePhotoSlot; removedMediaId: string | null }>;
  savedProducts(): Promise<{ products: SavedProductRecord[] }>;
  saveProduct(body: { retailerSource?: string; externalProductId: string }): Promise<SavedProductRecord>;
  deleteSavedProduct(id: string): Promise<void>;
  familyMembers(): Promise<{ members: Record<string, unknown>[] }>;
  createFamilyMember(body: Record<string, unknown>): Promise<Record<string, unknown>>;
  updateFamilyMember(id: string, body: Record<string, unknown>): Promise<Record<string, unknown>>;
  deleteFamilyMember(id: string): Promise<void>;
  familyEvents(): Promise<{ events: Record<string, unknown>[] }>;
  createFamilyEvent(body: Record<string, unknown>): Promise<Record<string, unknown>>;
  updateFamilyEvent(id: string, body: Record<string, unknown>): Promise<Record<string, unknown>>;
  deleteFamilyEvent(id: string): Promise<void>;
  beautyPreferences(): Promise<Record<string, unknown>>;
  saveBeautyPreferences(body: Record<string, unknown>): Promise<Record<string, unknown>>;
  beautyLooks(query?: string): Promise<{ looks: Record<string, unknown>[] }>;
  createBeautyLook(body: Record<string, unknown>): Promise<Record<string, unknown>>;
  updateBeautyLook(id: string, body: Record<string, unknown>): Promise<Record<string, unknown>>;
  deleteBeautyLook(id: string): Promise<void>;
  linkBeautyLook(id: string, body: Record<string, unknown>): Promise<Record<string, unknown>>;
  unlinkBeautyLook(id: string, linkId: string): Promise<Record<string, unknown>>;
  membershipPlans(): Promise<MembershipPlansResponse>;
  membershipEntitlement(): Promise<MembershipEntitlementResponse>;
  membershipCredits(): Promise<MembershipCreditsResponse>;
  membershipHistory(): Promise<MembershipCreditsResponse>;
  membershipUsage(): Promise<{ operations: unknown[]; note: string }>;
  privacyNotice(): Promise<Record<string, unknown>>;
  privacyConsent(): Promise<ConsentStateResponse>;
  setPrivacyConsent(body: { purpose: string; granted: boolean; captureMethod?: string }): Promise<ConsentStateResponse>;
  privacyMedia(): Promise<{ items: { id: string; purpose: string; byteSize: number; createdAt: string }[]; externalPhotoAiActive: boolean; note: string }>;
  requestPrivacyExport(password: string): Promise<{ exportId: string; status: string; downloadPath: string; expiresAt: string }>;
  privacyExportStatus(id: string): Promise<Record<string, unknown>>;
  downloadPrivacyExport(id: string): Promise<Blob>;
  privacyDeletionStatus(): Promise<Record<string, unknown>>;
  startPrivacyDeletion(): Promise<Record<string, unknown>>;
  cancelPrivacyDeletion(): Promise<Record<string, unknown>>;
  confirmPrivacyDeletion(password: string): Promise<Record<string, unknown>>;
  privacyRetentionPreview(): Promise<Record<string, unknown>>;
  deleteMedia(id: string): Promise<void>;
  tryOnAvailability(): Promise<TryOnAvailabilityResponse>;
  listTryOnGarments(): Promise<TryOnGarmentsResponse>;
  prepareTryOnJob(body: TryOnPrepareBody): Promise<TryOnPrepareResponse>;
  createTryOnJob(body: TryOnJobCreateBody): Promise<TryOnJobRecord>;
  getTryOnJob(id: string): Promise<TryOnJobRecord>;
  listTryOnJobs(): Promise<{ jobs: TryOnJobRecord[] }>;
  listTryOnFittings(): Promise<{ fittings: TryOnJobRecord[] }>;
  cancelTryOnJob(id: string): Promise<TryOnJobRecord>;
  deleteTryOnJob(id: string): Promise<{ deleted: true; id: string }>;
}

export type TryOnCategory = 'tops' | 'bottoms' | 'one-pieces' | 'outerwear';
export type TryOnProviderId = 'mock' | 'fashn-tryon-v1.6' | 'fashn-tryon-max';

export interface TryOnAvailabilityResponse {
  liveEnabled: boolean;
  allowCustomerMock?: boolean;
  generationMode?: 'live' | 'local_mock' | 'unavailable';
  defaultLiveProviderId?: TryOnProviderId;
  maxBudgetUsd: number;
  spentUsd?: number;
  remainingBudgetUsd?: number;
  externalPhotoAiConsent: boolean;
  privatePhotoStorageConsent: boolean;
  aiImageEntitlement?: boolean;
  creditBalance?: number;
  estimatedCustomerCredits?: number;
  providers: {
    id: string;
    label: string;
    model: string;
    availability: string;
    liveCapable: boolean;
    note: string;
  }[];
  readiness?: {
    mockReady: boolean;
    liveReady: boolean;
    checks: Record<string, boolean>;
  };
  estimatedLiveCostUsd?: Record<string, number>;
  note: string;
}

export interface TryOnGarmentOption {
  id: string;
  source: 'wardrobe' | 'garment_reference';
  wardrobeItemId: string | null;
  name: string;
  category: string | null;
  mediaId: string;
  previewUrl: string;
  authorised: true;
  note: string;
}

export interface TryOnGarmentsResponse {
  garments: TryOnGarmentOption[];
  preferredSource: 'wardrobe' | 'garment_reference' | 'upload';
  shop: { selection: 'client_preload'; note: string };
}

export interface TryOnPrepareBody {
  personMediaId: string;
  garmentMediaId?: string;
  wardrobeItemId?: string;
  garmentImageUrl?: string;
  garmentImageBase64?: string;
  category: TryOnCategory;
  providerId?: TryOnProviderId;
  quality?: 'draft' | 'standard' | 'high';
}

export interface TryOnPrepareResponse {
  ok: boolean;
  providerId: TryOnProviderId;
  live: boolean;
  demonstration: boolean;
  estimatedCredits: number;
  estimatedCostUsd: number;
  personMediaId: string;
  garmentMediaId: string;
  category: TryOnCategory;
  quality: string;
  blockers: string[];
  note: string;
}

export interface TryOnJobCreateBody {
  personMediaId: string;
  garmentMediaId?: string;
  wardrobeItemId?: string;
  garmentImageUrl?: string;
  garmentImageBase64?: string;
  category: TryOnCategory;
  providerId?: TryOnProviderId;
  quality?: 'draft' | 'standard' | 'high';
  idempotencyKey: string;
}

export interface TryOnJobRecord {
  id: string;
  status: 'queued' | 'running' | 'succeeded' | 'failed' | 'cancelled';
  providerId: string;
  model: string;
  category: TryOnCategory;
  quality: string;
  personMediaId: string;
  garmentMediaId: string;
  resultMediaId: string | null;
  resultKind: 'demonstration' | 'provider' | null;
  demonstration: boolean;
  label: string;
  errorCode: string | null;
  errorMessage: string | null;
  creditsReserved: number | null;
  createdAt: string;
  updatedAt: string;
  startedAt: string | null;
  finishedAt: string | null;
  duplicate?: boolean;
}

export interface ConsentStateResponse {
  noticeVersion: string;
  current: { purpose: string; granted: boolean; status: string; updatedAt: string | null }[];
  history: { purpose: string; status: string; createdAt: string }[];
  notes: Record<string, string>;
}

export type ProfilePhotoSlot = 'portrait' | 'full_body_front' | 'full_body_additional';

export interface ProfilePhotoSlots {
  portraitMediaId: string | null;
  fullBodyFrontMediaId: string | null;
  fullBodyAdditionalMediaId: string | null;
}

export interface ProfilePhotosResponse {
  photos: ProfilePhotoSlots;
  storageConsentRequired: string;
  externalAiConsent: string;
  note: string;
}

export interface ProfilePhotoUploadResult {
  slot: ProfilePhotoSlot;
  mediaId: string;
  contentType: string;
  byteSize: number;
  previousMediaId: string | null;
}

export interface SavedProductRecord {
  id: string;
  retailerSource: string;
  externalProductId: string;
  savedAt: string;
  demonstration?: boolean;
  sourceKind?: string;
  label?: string;
  duplicate?: boolean;
}

export interface MembershipPlanDefinition {
  planCode: string;
  displayName: string;
  indicativeMonthlyZar: number | null;
  priceStatus: string;
  allowanceStatus: string;
  proposedMonthlyCredits: number;
  priceNote: string;
  allowanceNote: string;
}

export interface MembershipPlansResponse {
  paymentsEnabled: boolean;
  plans: MembershipPlanDefinition[];
}

export interface MembershipEntitlementResponse {
  paid: boolean;
  current: {
    planCode: string;
    status: string;
    featureKeys: string[];
    source: string;
  } | null;
}

export interface MembershipCreditEntry {
  entryType: string;
  delta: number;
  reason: string;
  createdAt: string;
}

export interface MembershipCreditsResponse {
  balance: number;
  unit: string;
  label?: string;
  entries: MembershipCreditEntry[];
}

export interface WardrobeRecord {
  id: string;
  name: string;
  category: WardrobeItem['category'];
  colour: string | null;
  colourHex: string | null;
  sizeLabel: string | null;
  mediaId: string | null;
  brand: string | null;
  subcategory: string | null;
  seasons: WardrobeSeason[];
  occasions: WardrobeOccasion[];
  notes: string | null;
  fabric: string | null;
  careNote: string | null;
  pairingNotes: string | null;
  imageUrl: string | null;
  isFavorite: boolean;
  isCapsule: boolean;
  timesWorn: number;
  lastWornAt: string | null;
  createdAt: string;
}

export interface LookRecord {
  id: string;
  title: string;
  notes: string | null;
  kind: 'wardrobe_outfit' | 'inspiration' | 'concept';
  occasion: string | null;
  season: string | null;
  description: string | null;
  sourceKey: string | null;
  slots: WardrobeOutfit['slots'] | null;
  isFavorite: boolean;
  wearCount: number;
  lastWornAt: string | null;
  harmonyScore: number | null;
  harmonyNote: string | null;
  colorPalette: { name: string; hex: string }[] | null;
  wardrobeItemIds: string[];
  createdAt: string;
  duplicate?: boolean;
}

export interface PlanRecord {
  id: string;
  title: string;
  planDate: string;
  occasion: string | null;
  notes: string | null;
  outfitId: string | null;
  timeLabel: string | null;
  locationLabel: string | null;
  weatherLabel: string | null;
  completed: boolean;
}

export interface StylistAvailability {
  provider: string;
  liveEnabled: boolean;
  acceptingMessages: boolean;
  label: string;
}

export interface StylistServerMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  recommendation: Record<string, unknown> | null;
  provider: string | null;
  createdAt: string;
  duplicate?: boolean;
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  csrf?: boolean;
  headers?: Record<string, string>;
}

export function createAccountApi(options?: { baseUrl?: string; fetchImpl?: typeof fetch }): AccountApi {
  const baseUrl = options?.baseUrl ?? '';
  const fetchImpl = options?.fetchImpl ?? fetch;
  let csrfToken: string | null = null;

  function remember<T extends { csrfToken: string }>(payload: T): T {
    csrfToken = payload.csrfToken;
    return payload;
  }

  async function request<T>(path: string, requestOptions: RequestOptions = {}, allowCsrfRetry = true): Promise<T> {
    const method = requestOptions.method ?? 'GET';
    const headers: Record<string, string> = {};
    if (requestOptions.body !== undefined) headers['content-type'] = 'application/json';
    if (requestOptions.csrf && csrfToken) headers['x-csrf-token'] = csrfToken;
    Object.assign(headers, requestOptions.headers);
    let response: Response;
    try {
      response = await fetchImpl(`${baseUrl}${path}`, {
        method,
        credentials: 'include',
        headers,
        body: requestOptions.body !== undefined ? JSON.stringify(requestOptions.body) : undefined,
      });
    } catch {
      throw new AccountApiError('network_error', 'The account service could not be reached.', 0);
    }
    const text = await response.text();
    let payload: { code?: string; message?: string; csrfToken?: string } = {};
    if (text) {
      try {
        payload = JSON.parse(text) as typeof payload;
      } catch {
        throw new AccountApiError('invalid_response', 'The account service returned an unexpected response.', response.status);
      }
    }
    if (response.status === 403 && payload.code === 'invalid_csrf' && allowCsrfRetry) {
      const session = await request<SessionResponse>('/api/auth/session');
      remember(session);
      return request<T>(path, requestOptions, false);
    }
    if (!response.ok) {
      throw new AccountApiError(payload.code ?? 'request_failed', payload.message ?? 'The request was not accepted.', response.status);
    }
    return payload as T;
  }

  return {
    health: () => request('/api/health'),
    ready: () => request('/api/ready'),
    session: async () => remember(await request<SessionResponse>('/api/auth/session')),
    register: async (email, password) => remember(await request<AuthResult>('/api/auth/register', { method: 'POST', body: { email, password } })),
    login: async (email, password) => remember(await request<AuthResult>('/api/auth/login', { method: 'POST', body: { email, password } })),
    logout: async () => {
      await request('/api/auth/logout', { method: 'POST', csrf: true });
      csrfToken = null;
    },
    emailStatus: () => request('/api/auth/email-status'),
    requestEmailVerification: () => request('/api/auth/verify-email/request', { method: 'POST', csrf: true }),
    confirmEmailVerification: (token) => request('/api/auth/verify-email/confirm', { method: 'POST', body: { token } }),
    requestPasswordReset: (email) => request('/api/auth/password-reset/request', { method: 'POST', body: { email } }),
    confirmPasswordReset: async (token, password) => {
      const result = await request<{ ok: boolean; message: string }>('/api/auth/password-reset/confirm', { method: 'POST', body: { token, password } });
      csrfToken = null;
      return result;
    },
    devMailbox: () => request('/api/dev/mailbox'),
    devMailboxAction: (id) => request(`/api/dev/mailbox/${id}/action`),
    getProfile: () => request('/api/profile'),
    saveProfile: (body) => request('/api/profile', { method: 'PUT', body, csrf: true }),
    getPreferences: () => request('/api/preferences'),
    savePreferences: (body) => request('/api/preferences', { method: 'PUT', body, csrf: true }),
    stylistAvailability: () => request('/api/stylist/availability'),
    stylistConversations: () => request('/api/stylist/conversations'),
    createStylistConversation: () => request('/api/stylist/conversations', { method: 'POST', csrf: true }),
    stylistConversation: (id) => request(`/api/stylist/conversations/${id}`),
    sendStylistMessage: (id, text, idempotencyKey) => request(`/api/stylist/conversations/${id}/messages`, {
      method: 'POST',
      body: { text },
      csrf: true,
      headers: { 'x-idempotency-key': idempotencyKey },
    }),
    deleteStylistConversation: (id) => request(`/api/stylist/conversations/${id}`, { method: 'DELETE', csrf: true }),
    wardrobeItems: () => request('/api/wardrobe'),
    createWardrobeItem: (body) => request('/api/wardrobe', { method: 'POST', body, csrf: true }),
    updateWardrobeItem: (id, body) => request(`/api/wardrobe/${id}`, { method: 'PATCH', body, csrf: true }),
    deleteWardrobeItem: (id) => request(`/api/wardrobe/${id}`, { method: 'DELETE', csrf: true }),
    looks: () => request('/api/looks'),
    createLook: (body) => request('/api/looks', { method: 'POST', body, csrf: true }),
    updateLook: (id, body) => request(`/api/looks/${id}`, { method: 'PATCH', body, csrf: true }),
    deleteLook: (id) => request(`/api/looks/${id}`, { method: 'DELETE', csrf: true }),
    outfitPlans: () => request('/api/outfit-plans'),
    createOutfitPlan: (body) => request('/api/outfit-plans', { method: 'POST', body, csrf: true }),
    updateOutfitPlan: (id, body) => request(`/api/outfit-plans/${id}`, { method: 'PATCH', body, csrf: true }),
    deleteOutfitPlan: (id) => request(`/api/outfit-plans/${id}`, { method: 'DELETE', csrf: true }),
    uploadWardrobePhoto: (imageBase64) => request('/api/media', { method: 'POST', body: { purpose: 'wardrobe', imageBase64 }, csrf: true }),
    profilePhotos: () => request('/api/profile/photos'),
    uploadProfilePhotoSlot: (slot, imageBase64) => request(`/api/profile/photos/${slot}`, { method: 'PUT', body: { imageBase64 }, csrf: true }),
    deleteProfilePhotoSlot: (slot) => request(`/api/profile/photos/${slot}`, { method: 'DELETE', csrf: true }),
    savedProducts: () => request('/api/saved-products'),
    saveProduct: (body) => request('/api/saved-products', { method: 'POST', body, csrf: true }),
    deleteSavedProduct: (id) => request(`/api/saved-products/${id}`, { method: 'DELETE', csrf: true }),
    familyMembers: () => request('/api/family'),
    createFamilyMember: (body) => request('/api/family', { method: 'POST', body, csrf: true }),
    updateFamilyMember: (id, body) => request(`/api/family/${id}`, { method: 'PATCH', body, csrf: true }),
    deleteFamilyMember: (id) => request(`/api/family/${id}`, { method: 'DELETE', csrf: true }),
    familyEvents: () => request('/api/family-events'),
    createFamilyEvent: (body) => request('/api/family-events', { method: 'POST', body, csrf: true }),
    updateFamilyEvent: (id, body) => request(`/api/family-events/${id}`, { method: 'PATCH', body, csrf: true }),
    deleteFamilyEvent: (id) => request(`/api/family-events/${id}`, { method: 'DELETE', csrf: true }),
    beautyPreferences: () => request('/api/beauty-preferences'),
    saveBeautyPreferences: (body) => request('/api/beauty-preferences', { method: 'PUT', body, csrf: true }),
    beautyLooks: (query = '') => request(`/api/beauty-looks${query}`),
    createBeautyLook: (body) => request('/api/beauty-looks', { method: 'POST', body, csrf: true }),
    updateBeautyLook: (id, body) => request(`/api/beauty-looks/${id}`, { method: 'PATCH', body, csrf: true }),
    deleteBeautyLook: (id) => request(`/api/beauty-looks/${id}`, { method: 'DELETE', csrf: true }),
    linkBeautyLook: (id, body) => request(`/api/beauty-looks/${id}/links`, { method: 'POST', body, csrf: true }),
    unlinkBeautyLook: (id, linkId) => request(`/api/beauty-looks/${id}/links/${linkId}`, { method: 'DELETE', csrf: true }),
    membershipPlans: () => request('/api/plans'),
    membershipEntitlement: () => request('/api/entitlements'),
    membershipCredits: () => request('/api/credits'),
    membershipHistory: () => request('/api/credits/history'),
    membershipUsage: () => request('/api/usage/summary'),
    privacyNotice: () => request('/api/privacy/notice'),
    privacyConsent: () => request('/api/privacy/consent'),
    setPrivacyConsent: (body) => request('/api/privacy/consent', { method: 'POST', body, csrf: true }),
    privacyMedia: () => request('/api/privacy/media'),
    requestPrivacyExport: (password) => request('/api/privacy/export', { method: 'POST', body: { password }, csrf: true }),
    privacyExportStatus: (id) => request(`/api/privacy/export/${id}`),
    downloadPrivacyExport: async (id) => {
      const response = await fetchImpl(`${baseUrl}/api/privacy/export/${id}/download`, { credentials: 'include' });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({})) as { code?: string; message?: string };
        throw new AccountApiError(payload.code ?? 'request_failed', payload.message ?? 'The export download was not accepted.', response.status);
      }
      return response.blob();
    },
    privacyDeletionStatus: () => request('/api/privacy/deletion'),
    startPrivacyDeletion: () => request('/api/privacy/deletion/start', { method: 'POST', csrf: true }),
    cancelPrivacyDeletion: () => request('/api/privacy/deletion/cancel', { method: 'POST', csrf: true }),
    confirmPrivacyDeletion: (password) => request('/api/privacy/deletion/confirm', { method: 'POST', body: { password }, csrf: true }),
    privacyRetentionPreview: () => request('/api/privacy/retention/preview'),
    deleteMedia: (id) => request(`/api/media/${id}`, { method: 'DELETE', csrf: true }),
    tryOnAvailability: () => request('/api/tryon/availability'),
    listTryOnGarments: () => request('/api/tryon/garments'),
    prepareTryOnJob: (body) => request('/api/tryon/prepare', { method: 'POST', body, csrf: true }),
    createTryOnJob: (body) => request('/api/tryon/jobs', { method: 'POST', body, csrf: true }),
    getTryOnJob: (id) => request(`/api/tryon/jobs/${id}`),
    listTryOnJobs: () => request('/api/tryon/jobs'),
    listTryOnFittings: () => request('/api/tryon/fittings'),
    cancelTryOnJob: (id) => request(`/api/tryon/jobs/${id}/cancel`, { method: 'POST', csrf: true }),
    deleteTryOnJob: (id) => request(`/api/tryon/jobs/${id}`, { method: 'DELETE', csrf: true }),
  };
}

export const accountApi = createAccountApi();
