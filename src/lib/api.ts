// API helper functions for all CRUD operations

const API_BASE = '/api';

async function fetchAPI(endpoint: string, options?: RequestInit) {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `API Error: ${res.status}`);
  }
  return res.json();
}

// ─── Type Definitions ───

export interface Client {
  id: string;
  clientCode: string;
  clientName: string;
  mobileNumber: string | null;
  email: string | null;
  concernedPerson: string | null;
  projectsCount?: number;
  _count?: { projects: number; whatsappUsers?: number };
  projects?: Project[];
  createdAt: string;
  updatedAt: string;
}

export interface ProjectStep {
  id: string;
  stepNumber: number;
  stepName: string;
  status: string;
  dateValue: string | null;
  notes: string | null;
}

export interface ProjectBank {
  id: string;
  bankName: string;
  branchName: string | null;
  bankAndBranch: string | null;
  bankRelationshipMgr: string | null;
  loanAmount: number;
}

export interface Project {
  id: string;
  clientId: string;
  projectName: string;
  proposalType: string | null;
  teamLeaderId: string | null;
  teamEngaged: string | null;
  setSentVia: string | null;
  termLoanAmt: number;
  ccAmt: number;
  bgAmt: number;
  lcAmt: number;
  odAmt: number;
  lapAmt: number;
  lcWcdlAmt: number;
  totalLoanAmount: number;
  loanAppliedFor: number;
  attachmentUrl: string | null;
  clientJobCode: string | null;
  mailStatus: string | null;
  completionPct: number;
  createdAt: string;
  updatedAt: string;
  client?: { id: string; clientName: string; clientCode: string } | null;
  teamLeader?: { id: string; name: string } | null;
  steps?: ProjectStep[];
  banks?: ProjectBank[];
  _count?: { steps: number };
}

export interface TeamLeader {
  id: string;
  name: string;
  mobileNumber: string | null;
  totalProjectsInHand: number;
  workCompletionPct: number;
  projects?: Project[];
  _count?: { projects: number };
}

export interface WhatsAppUser {
  id: string;
  phone: string;
  name: string | null;
  role: string;
  clientId: string | null;
  teamLeaderId: string | null;
  isRegistered: boolean;
  registeredAt: string | null;
  lastMessageAt: string | null;
  client?: Client | null;
  teamLeader?: TeamLeader | null;
}

export interface ChatMessage {
  id: string;
  whatsappUserId: string;
  direction: string;
  messageText: string | null;
  messageType: string;
  payload: string | null;
  createdAt: string;
  whatsappUser?: {
    phone: string;
    name: string | null;
    role: string;
  };
}

export interface DashboardStats {
  overview: {
    totalClients: number;
    totalProjects: number;
    ongoingProjects: number;
    completedProjects: number;
    pendingProjects: number;
    inProgressProjects: number;
    avgCompletion: number;
    totalTeamLeaders: number;
    totalWhatsAppUsers: number;
    totalBanks?: number;
  };
  financials: {
    totalLoanAmount: number;
    totalTermLoan: number;
    totalCC: number;
    totalBG: number;
    totalLC: number;
    totalOD: number;
    totalLAP: number;
    totalLCWCDL: number;
    totalLoanAppliedFor: number;
  };
  projectsByTeamLeader: Array<{
    id: string;
    name: string;
    totalProjects: number;
    avgCompletion: number;
  }>;
  whatsappUsersByRole: Array<{
    role: string;
    count: number;
  }>;
  recentMessages: ChatMessage[];
  bankStats?: {
    totalBanks: number;
    totalBankLoanAmount: number;
  };
  syncInfo?: {
    lastSyncAt: string | null;
    lastSyncStatus: string | null;
    lastSyncRecords: number;
    totalSyncRuns: number;
  };
}

export interface SyncLog {
  id: string;
  sheetName: string;
  status: string;
  recordsSynced: number;
  errors: string | null;
  syncAt: string;
}

export interface MaytapiConfig {
  id: string;
  apiKey: string;
  productId: string;
  phoneId: string | null;
  webhookUrl: string | null;
  isActive: boolean;
  phoneNumber: string | null;
  createdAt: string;
  updatedAt: string;
}

// ─── API Endpoints ───

export const clientsAPI = {
  list: () => fetchAPI('/clients'),
  get: (id: string) => fetchAPI(`/clients/${id}`),
  create: (data: Partial<Client>) => fetchAPI('/clients', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<Client>) => fetchAPI(`/clients/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => fetchAPI(`/clients/${id}`, { method: 'DELETE' }),
};

export const projectsAPI = {
  list: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return fetchAPI(`/projects${query}`);
  },
  get: (id: string) => fetchAPI(`/projects/${id}`),
  create: (data: Partial<Project>) => fetchAPI('/projects', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<Project>) => fetchAPI(`/projects/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => fetchAPI(`/projects/${id}`, { method: 'DELETE' }),
};

export const stepsAPI = {
  list: (projectId: string) => fetchAPI(`/project-steps?projectId=${projectId}`),
  create: (data: Partial<ProjectStep>) => fetchAPI('/project-steps', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<ProjectStep>) => fetchAPI(`/project-steps/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => fetchAPI(`/project-steps/${id}`, { method: 'DELETE' }),
};

export const teamLeadersAPI = {
  list: () => fetchAPI('/team-leaders'),
  get: (id: string) => fetchAPI(`/team-leaders/${id}`),
  create: (data: Partial<TeamLeader>) => fetchAPI('/team-leaders', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<TeamLeader>) => fetchAPI(`/team-leaders/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => fetchAPI(`/team-leaders/${id}`, { method: 'DELETE' }),
};

export const whatsappUsersAPI = {
  list: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return fetchAPI(`/whatsapp-users${query}`);
  },
  get: (id: string) => fetchAPI(`/whatsapp-users/${id}`),
  create: (data: Partial<WhatsAppUser>) => fetchAPI('/whatsapp-users', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<WhatsAppUser>) => fetchAPI(`/whatsapp-users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => fetchAPI(`/whatsapp-users/${id}`, { method: 'DELETE' }),
};

export const chatMessagesAPI = {
  list: async (params?: Record<string, string>): Promise<ChatMessage[]> => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    const data = await fetchAPI(`/chat-messages${query}`);
    // API returns { messages, total, limit, offset, hasMore } - extract messages array
    if (data && typeof data === 'object' && Array.isArray(data.messages)) {
      return data.messages as ChatMessage[];
    }
    // Fallback: if it's already an array, return as-is
    if (Array.isArray(data)) {
      return data as ChatMessage[];
    }
    return [];
  },
};

export const maytapiConfigAPI = {
  get: () => fetchAPI('/maytapi-config'),
  save: (data: Record<string, string>) => fetchAPI('/maytapi-config', { method: 'POST', body: JSON.stringify(data) }),
  testConnection: () => fetchAPI('/maytapi-config/test', { method: 'POST' }),
};

export const dashboardAPI = {
  getStats: () => fetchAPI('/dashboard/stats'),
};

export const dataImportAPI = {
  import: (data: Record<string, unknown>) => fetchAPI('/data-import', { method: 'POST', body: JSON.stringify(data) }),
};

export const googleSyncAPI = {
  sync: (sheets?: string[]) => fetchAPI('/google-sync', { method: 'POST', body: JSON.stringify({ sheets }) }),
  history: async (): Promise<SyncLog[]> => {
    try {
      const data = await fetchAPI('/google-sync');
      if (Array.isArray(data)) return data as SyncLog[];
      return [];
    } catch {
      return [];
    }
  },
};

export const seedAPI = {
  seed: () => fetchAPI('/seed', { method: 'POST' }),
};

export const whatsappSendAPI = {
  send: (phone: string, message: string) => fetchAPI('/whatsapp/send', { method: 'POST', body: JSON.stringify({ phone, message }) }),
  broadcast: (message: string, role?: string) => fetchAPI('/whatsapp/broadcast', { method: 'POST', body: JSON.stringify({ message, role }) }),
};

// ─── Backward-compatible aliases (for existing components) ───
export const clientsApi = clientsAPI;
export const projectsApi = projectsAPI;
export const stepsApi = stepsAPI;
export const teamLeadersApi = teamLeadersAPI;
export const whatsappUsersApi = whatsappUsersAPI;
export const chatMessagesApi = chatMessagesAPI;
export const maytapiConfigApi = maytapiConfigAPI;
export const dashboardApi = dashboardAPI;
export const dataImportApi = dataImportAPI;
export const seedApi = seedAPI;
export const whatsappSendApi = whatsappSendAPI;

// ChatMessagesApi compatibility (some components use .getAll())
export const chatMessagesApiCompat = {
  ...chatMessagesAPI,
  getAll: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return fetchAPI(`/chat-messages${query}`);
  },
};
