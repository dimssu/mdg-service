import type { ServiceRunStatus } from './enums';

export interface ServiceRun {
  id: string;
  dealerId: string;
  serviceId: string;
  dealerServiceId: string;
  startedAt: string;
  finishedAt?: string;
  status: ServiceRunStatus;
  durationMs?: number;
  output?: unknown;
  error?: {
    message: string;
    stack?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface RunsListQuery {
  dealerId?: string;
  serviceId?: string;
  status?: ServiceRunStatus;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
}
