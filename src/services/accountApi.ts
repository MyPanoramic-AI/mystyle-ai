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
}

export interface SessionResponse extends AuthResult {
  email: string;
  expiresAt: string;
}

export interface AccountApi {
  health(): Promise<{ ok: boolean; database: string }>;
  session(): Promise<SessionResponse>;
  register(email: string, password: string): Promise<AuthResult>;
  login(email: string, password: string): Promise<AuthResult>;
  logout(): Promise<void>;
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
  familyMembers(): Promise<{ members: Record<string, unknown>[] }>;
  createFamilyMember(body: Record<string, unknown>): Promise<Record<string, unknown>>;
  updateFamilyMember(id: string, body: Record<string, unknown>): Promise<Record<string, unknown>>;
  deleteFamilyMember(id: string): Promise<void>;
  familyEvents(): Promise<{ events: Record<string, unknown>[] }>;
  createFamilyEvent(body: Record<string, unknown>): Promise<Record<string, unknown>>;
  updateFamilyEvent(id: string, body: Record<string, unknown>): Promise<Record<string, unknown>>;
  deleteFamilyEvent(id: string): Promise<void>;
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
    session: async () => remember(await request<SessionResponse>('/api/auth/session')),
    register: async (email, password) => remember(await request<AuthResult>('/api/auth/register', { method: 'POST', body: { email, password } })),
    login: async (email, password) => remember(await request<AuthResult>('/api/auth/login', { method: 'POST', body: { email, password } })),
    logout: async () => {
      await request('/api/auth/logout', { method: 'POST', csrf: true });
      csrfToken = null;
    },
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
    familyMembers: () => request('/api/family'),
    createFamilyMember: (body) => request('/api/family', { method: 'POST', body, csrf: true }),
    updateFamilyMember: (id, body) => request(`/api/family/${id}`, { method: 'PATCH', body, csrf: true }),
    deleteFamilyMember: (id) => request(`/api/family/${id}`, { method: 'DELETE', csrf: true }),
    familyEvents: () => request('/api/family-events'),
    createFamilyEvent: (body) => request('/api/family-events', { method: 'POST', body, csrf: true }),
    updateFamilyEvent: (id, body) => request(`/api/family-events/${id}`, { method: 'PATCH', body, csrf: true }),
    deleteFamilyEvent: (id) => request(`/api/family-events/${id}`, { method: 'DELETE', csrf: true }),
  };
}

export const accountApi = createAccountApi();
