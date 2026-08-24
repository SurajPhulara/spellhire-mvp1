// hiring team (organization specific)

import { EmployerRole } from './base';

export enum TeamMemberRole {
  RECRUITER = 'RECRUITER',
  INTERVIEWER = 'INTERVIEWER',
}

export enum TeamMemberStatus {
  INVITED = 'INVITED',
  ACTIVE = 'ACTIVE',
  REJECTED = 'REJECTED',
  DISABLED = 'DISABLED',
}

export interface TeamMember {
  id: string;

  first_name: string;
  last_name?: string | null;
  email: string;

  role: TeamMemberRole;
  status: TeamMemberStatus;

  job_title?: string | null;
  experience_years?: number | null;
  skills?: Array<Record<string, unknown>>;

  invited_at: string;
  accepted_at?: string | null;
}

export interface TeamMembersResponse {
  members: TeamMember[];
}

export interface TeamMemberCreate {
  first_name: string;
  last_name?: string;
  email: string;

  role: TeamMemberRole;

  job_title?: string;
  experience_years?: number;
  skills?: Array<Record<string, unknown>>;
}