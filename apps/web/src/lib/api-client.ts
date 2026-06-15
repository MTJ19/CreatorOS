/* eslint-disable */
/**
 * Typed API client for the CreatorOS NestJS backend.
 * Reads the access token from the NextAuth session and attaches it as a Bearer header.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly body?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(
  path: string,
  options: RequestInit & { accessToken?: string } = {},
): Promise<T> {
  const { accessToken, ...fetchOptions } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(fetchOptions.headers as Record<string, string>),
  };

  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...fetchOptions,
    headers,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(res.status, (body as { message?: string }).message ?? res.statusText, body);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

// ── Auth endpoints ────────────────────────────────────────────

export const authApi = {
  register: (data: { name: string; email: string; password: string }) =>
    request('/api/v1/auth/register', { method: 'POST', body: JSON.stringify(data) }),

  login: (data: { email: string; password: string }) =>
    request('/api/v1/auth/login', { method: 'POST', body: JSON.stringify(data) }),

  refresh: (refreshToken: string) =>
    request('/api/v1/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    }),
};

// ── Creator Profile endpoints ─────────────────────────────────

export const profileApi = {
  getMe: (accessToken: string) =>
    request('/api/v1/creator-profile/me', { accessToken }),

  upsert: (accessToken: string, data: Record<string, unknown>) =>
    request('/api/v1/creator-profile/me', {
      method: 'PATCH',
      body: JSON.stringify(data),
      accessToken,
    }),

  completeOnboarding: (accessToken: string) =>
    request('/api/v1/creator-profile/me/complete-onboarding', {
      method: 'POST',
      accessToken,
    }),
};

// ── Deals endpoints ───────────────────────────────────────────

export const dealsApi = {
  getAll: (accessToken: string) =>
    request<any[]>('/api/v1/deals', { accessToken }),

  getOne: (accessToken: string, id: string) =>
    request<any>(`/api/v1/deals/${id}`, { accessToken }),

  create: (accessToken: string, data: any) =>
    request<any>('/api/v1/deals', {
      method: 'POST',
      body: JSON.stringify(data),
      accessToken,
    }),

  update: (accessToken: string, id: string, data: any) =>
    request<any>(`/api/v1/deals/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
      accessToken,
    }),

  updateStage: (accessToken: string, id: string, stage: string) =>
    request<any>(`/api/v1/deals/${id}/stage`, {
      method: 'PATCH',
      body: JSON.stringify({ stage }),
      accessToken,
    }),

  delete: (accessToken: string, id: string) =>
    request<any>(`/api/v1/deals/${id}`, {
      method: 'DELETE',
      accessToken,
    }),

  getDashboardStats: (accessToken: string) =>
    request<any>('/api/v1/deals/dashboard/stats', { accessToken }),

  getBrief: (accessToken: string, id: string) =>
    request<any>(`/api/v1/deals/${id}/brief`, { accessToken }),

  uploadBrief: (accessToken: string, id: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return fetch(`${API_BASE}/api/v1/deals/${id}/brief/upload`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: formData,
    }).then(async (res) => {
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new ApiError(res.status, (body as any).message || res.statusText, body);
      }
      return res.json();
    });
  },

  updateBriefParsedData: (accessToken: string, id: string, parsedData: any) =>
    request<any>(`/api/v1/deals/${id}/brief/parsed`, {
      method: 'PUT',
      body: JSON.stringify(parsedData),
      accessToken,
    }),
};

// ── Rate Intelligence endpoints ───────────────────────────────

export const rateIntelligenceApi = {
  generateQuote: (accessToken: string, data: any) =>
    request<any>('/api/v1/rate-intelligence/quote', {
      method: 'POST',
      body: JSON.stringify(data),
      accessToken,
    }),

  getHistory: (accessToken: string, limit?: number) =>
    request<any[]>('/api/v1/rate-intelligence/history' + (limit ? `?limit=${limit}` : ''), {
      accessToken,
    }),
};

// ── Performance Log endpoints ─────────────────────────────────

export const performanceApi = {
  getAll: (accessToken: string) =>
    request<any[]>('/api/v1/performance', { accessToken }),

  getAverages: (accessToken: string) =>
    request<{
      rolling30: any;
      rolling60: any;
      rolling90: any;
    }>('/api/v1/performance/averages', { accessToken }),

  create: (accessToken: string, data: any) =>
    request<any>('/api/v1/performance', {
      method: 'POST',
      body: JSON.stringify(data),
      accessToken,
    }),

  update: (accessToken: string, id: string, data: any) =>
    request<any>(`/api/v1/performance/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
      accessToken,
    }),

  delete: (accessToken: string, id: string) =>
    request<void>(`/api/v1/performance/${id}`, {
      method: 'DELETE',
      accessToken,
    }),
};


// ── Contracts endpoints ────────────────────────────────────────

export const contractsApi = {
  getAll: (accessToken: string) =>
    request<any[]>('/api/v1/contracts', { accessToken }),

  getOne: (accessToken: string, id: string) =>
    request<any>(`/api/v1/contracts/${id}`, { accessToken }),

  generate: async (accessToken: string, data: any): Promise<Blob> => {
    const res = await fetch(`${API_BASE}/api/v1/contracts/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new ApiError(res.status, (body as any).message || res.statusText, body);
    }
    return res.blob();
  },

  upload: (accessToken: string, dealId: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return fetch(`${API_BASE}/api/v1/contracts/upload/${dealId}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: formData,
    }).then(async (res) => {
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new ApiError(res.status, (body as any).message || res.statusText, body);
      }
      return res.json();
    });
  },

  acknowledgeFlag: (accessToken: string, flagId: string) =>
    request<any>(`/api/v1/contracts/flags/${flagId}/acknowledge`, {
      method: 'PATCH',
      accessToken,
    }),
};

// ── Invoices endpoints ─────────────────────────────────────────

export const invoicesApi = {
  getAll: (accessToken: string) =>
    request<any[]>('/api/v1/invoices', { accessToken }),

  getOne: (accessToken: string, id: string) =>
    request<any>(`/api/v1/invoices/${id}`, { accessToken }),

  create: (accessToken: string, data: any) =>
    request<any>('/api/v1/invoices', {
      method: 'POST',
      body: JSON.stringify(data),
      accessToken,
    }),

  update: (accessToken: string, id: string, data: any) =>
    request<any>(`/api/v1/invoices/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
      accessToken,
    }),

  delete: (accessToken: string, id: string) =>
    request<void>(`/api/v1/invoices/${id}`, {
      method: 'DELETE',
      accessToken,
    }),

  markPaid: (accessToken: string, id: string, data: { paidAmount?: number; paidAt?: string }) =>
    request<any>(`/api/v1/invoices/${id}/mark-paid`, {
      method: 'PATCH',
      body: JSON.stringify(data),
      accessToken,
    }),
};

// ── Invisible Tax endpoints ────────────────────────────────────

export const invisibleTaxApi = {
  getSummary: (accessToken: string) =>
    request<any>('/api/v1/invisible-tax/summary', { accessToken }),
};

// ── Financial Runway endpoints ─────────────────────────────────

export const financialRunwayApi = {
  getProjection: (accessToken: string) =>
    request<any>('/api/v1/financial-runway/projection', { accessToken }),

  getSettings: (accessToken: string) =>
    request<any>('/api/v1/financial-runway/settings', { accessToken }),

  upsertSettings: (accessToken: string, data: { monthlyFixedCosts: number; currency?: string }) =>
    request<any>('/api/v1/financial-runway/settings', {
      method: 'PATCH',
      body: JSON.stringify(data),
      accessToken,
    }),

  updateDealConfidence: (accessToken: string, dealId: string, confidence: string) =>
    request<any>(`/api/v1/financial-runway/deals/${dealId}/confidence`, {
      method: 'PATCH',
      body: JSON.stringify({ confidence }),
      accessToken,
    }),
};

// ── Brand Portal endpoints (creator-facing) ────────────────────

export const brandPortalApi = {
  listTokens: (accessToken: string) =>
    request<any[]>('/api/v1/brand-portal/tokens', { accessToken }),

  generateToken: (accessToken: string, data: {
    brandName: string;
    brandEmail: string;
    dealId?: string;
    expiresInDays?: number;
    permissions?: string[];
    brandNote?: string;
  }) =>
    request<any>('/api/v1/brand-portal/tokens', {
      method: 'POST',
      body: JSON.stringify(data),
      accessToken,
    }),

  revokeToken: (accessToken: string, tokenId: string) =>
    request<any>(`/api/v1/brand-portal/tokens/${tokenId}/revoke`, {
      method: 'PATCH',
      accessToken,
    }),

  getActivity: (accessToken: string, tokenId: string) =>
    request<any>(`/api/v1/brand-portal/tokens/${tokenId}/activity`, {
      accessToken,
    }),

  addCreatorComment: (accessToken: string, tokenId: string, body: string) =>
    request<any>(`/api/v1/brand-portal/tokens/${tokenId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ body }),
      accessToken,
    }),
};

// ── Public Portal endpoints (brand-facing, token-authenticated) ─

export const publicPortalApi = {
  getContext: (token: string) =>
    request<any>('/api/v1/portal/context', {
      headers: { 'x-portal-token': token },
    }),

  submitBrief: (token: string, data: { googleDocUrl?: string; revisionNotes?: string }) =>
    request<any>('/api/v1/portal/submit-brief', {
      method: 'POST',
      body: JSON.stringify(data),
      headers: { 'x-portal-token': token },
    }),

  uploadBriefFile: (token: string, file: File, revisionNotes?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    if (revisionNotes) {
      formData.append('revisionNotes', revisionNotes);
    }
    return fetch(`${API_BASE}/api/v1/portal/upload`, {
      method: 'POST',
      headers: {
        'x-portal-token': token,
      },
      body: formData,
    }).then(async (res) => {
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new ApiError(res.status, (body as any).message || res.statusText, body);
      }
      return res.json();
    });
  },

  setApproval: (token: string, data: { approvalStatus: string; revisionNotes?: string }) =>
    request<any>('/api/v1/portal/approval', {
      method: 'PATCH',
      body: JSON.stringify(data),
      headers: { 'x-portal-token': token },
    }),

  addComment: (token: string, body: string) =>
    request<any>('/api/v1/portal/comments', {
      method: 'POST',
      body: JSON.stringify({ body }),
      headers: { 'x-portal-token': token },
    }),
};
