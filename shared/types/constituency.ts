export enum ConstituencyType {
  PARLIAMENTARY = 'PARLIAMENTARY',
  ASSEMBLY = 'ASSEMBLY',
  MUNICIPAL = 'MUNICIPAL',
  COUNCIL = 'COUNCIL',
}

export interface Constituency {
  id: string;
  name: string;
  code: string;
  electionId: string;
  type: ConstituencyType;
  state?: string;
  district?: string;
  totalVoters?: number;
  totalSeats?: number;
  geoJson?: Record<string, any>;
  demographics?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface CreateConstituencyDto {
  name: string;
  code: string;
  electionId: string;
  type: ConstituencyType;
  state?: string;
  district?: string;
  totalVoters?: number;
  totalSeats?: number;
  geoJson?: Record<string, any>;
  demographics?: Record<string, any>;
}

export interface UpdateConstituencyDto {
  name?: string;
  state?: string;
  district?: string;
  totalVoters?: number;
  totalSeats?: number;
  geoJson?: Record<string, any>;
  demographics?: Record<string, any>;
}
