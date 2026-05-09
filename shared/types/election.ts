export enum ElectionType {
  GENERAL = 'GENERAL',
  STATE = 'STATE',
  LOCAL = 'LOCAL',
  BY_ELECTION = 'BY_ELECTION',
  REFERENDUM = 'REFERENDUM',
}

export enum ElectionStatus {
  DRAFT = 'DRAFT',
  PROCESSING = 'PROCESSING',
  READY = 'READY',
  COMPLETED = 'COMPLETED',
  ARCHIVED = 'ARCHIVED',
}

export interface Election {
  id: string;
  name: string;
  description?: string;
  electionType: ElectionType;
  date: string;
  status: ElectionStatus;
  country: string;
  region?: string;
  totalSeats: number;
  totalVoters?: number;
  turnout?: number;
  createdBy: string;
  organizationId?: string;
  datasetUrl?: string;
  datasetSize?: number;
  processedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateElectionDto {
  name: string;
  description?: string;
  electionType: ElectionType;
  date: string;
  country: string;
  region?: string;
  totalSeats: number;
}

export interface UpdateElectionDto {
  name?: string;
  description?: string;
  date?: string;
  totalSeats?: number;
  totalVoters?: number;
  turnout?: number;
}

export interface ElectionFilters {
  page?: number;
  limit?: number;
  status?: ElectionStatus;
  type?: ElectionType;
  country?: string;
  dateFrom?: string;
  dateTo?: string;
}
