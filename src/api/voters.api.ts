import { client } from './client';

export interface Voter {
  id: string;
  sheetRowIndex: number | null;
  fCardNo: string | null;
  cardNo: string | null;
  memberName: string;
  fatherName: string;
  orakh: string;
  fullName: string;
  phone?: string;
  isArrived: boolean;
  arrivedAt: string | null;
  markedArrivedBy?: { id: string; fullName: string } | null;
  coordinator?: { id: string; fullName: string } | null;
}

export interface Coordinator {
  id: string;
  username: string;
  fullName: string;
  phone?: string;
  mustChangePassword: boolean;
}

export interface DashboardStats {
  totalVoters: number;
  arrivedVoters: number;
  pendingVoters: number;
  coordinatorCount?: number;
  markingEnabled?: boolean;
}

export interface SyncEnqueueResult {
  jobId: string;
  message: string;
}

export interface SyncStatusResult {
  jobId: string;
  state: 'waiting' | 'active' | 'completed' | 'failed' | 'unknown';
  progress: number;
  result: {
    coordinatorsCreated: number;
    coordinatorsUpdated: number;
    votersCreated: number;
    votersUpdated: number;
    skipped: number;
    durationMs: number;
  } | null;
  failReason: string | null;
  startedAt: number | null;
  finishedAt: number | null;
}

export interface CreateCoordinatorPayload {
  username: string;
  fullName: string;
  phone?: string;
  password: string;
}

export const votersApi = {
  // Coordinator
  getPending: (params: { search?: string; page?: number; limit?: number }) =>
    client.get<{ data: Voter[]; total: number }>('/voters/pending', { params }).then((r) => r.data),

  getAll: (params: { search?: string; page?: number; limit?: number }) =>
    client.get<{ data: Voter[]; total: number }>('/voters/all', { params }).then((r) => r.data),

  markArrived: (voterId: string) =>
    client.patch(`/voters/${voterId}/arrive`).then((r) => r.data),

  unmarkArrived: (voterId: string) =>
    client.patch(`/voters/${voterId}/unmark`).then((r) => r.data),

  getDashboard: () =>
    client.get<DashboardStats>('/voters/dashboard/stats').then((r) => r.data),

  // Admin — voters
  adminGetVoters: (params: { search?: string; coordinatorId?: string; status?: string; page?: number; limit?: number }) =>
    client.get<{ data: Voter[]; total: number }>('/admin/voters', { params }).then((r) => r.data),

  adminMarkArrived: (voterId: string) =>
    client.patch(`/admin/voters/${voterId}/arrive`).then((r) => r.data),

  assignCoordinator: (voterId: string, coordinatorId: string | null) =>
    client.patch(`/admin/voters/${voterId}/coordinator`, { coordinatorId }).then((r) => r.data),

  // Admin — coordinators
  getCoordinators: () =>
    client.get<Coordinator[]>('/admin/coordinators').then((r) => r.data),

  createCoordinator: (payload: CreateCoordinatorPayload) =>
    client.post<Coordinator>('/admin/coordinators', payload).then((r) => r.data),

  deleteCoordinator: (coordinatorId: string) =>
    client.delete(`/admin/coordinators/${coordinatorId}`).then((r) => r.data),

  // Admin — sync
  triggerSync: () =>
    client.post<SyncEnqueueResult>('/admin/sync').then((r) => r.data),

  getSyncStatus: (jobId: string) =>
    client.get<SyncStatusResult>(`/admin/sync/status/${jobId}`).then((r) => r.data),


  // Admin — coordinator stats
  getCoordinatorStats: () =>
    client.get<{ coordinatorId: string; coordinatorName: string; total: number; arrived: number; pending: number }[]>('/admin/coordinators/stats').then((r) => r.data),

  // Admin dashboard
  adminGetDashboard: () =>
    client.get<DashboardStats>('/admin/dashboard').then((r) => r.data),

  // Admin — reset all arrived
  resetAllArrived: () =>
    client.patch<{ reset: number }>('/admin/voters/reset-arrived').then((r) => r.data),

  // Admin — marking toggle
  enableMarking: () =>
    client.patch<{ markingEnabled: boolean; message: string }>('/admin/marking/enable').then((r) => r.data),

  disableMarking: () =>
    client.patch<{ markingEnabled: boolean; message: string }>('/admin/marking/disable').then((r) => r.data),
};
