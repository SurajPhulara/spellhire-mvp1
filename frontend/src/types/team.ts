// hiring team (organization EmployerProfiles)

import { EmployerRole, Skill } from './base';
import { EmployerProfile } from './profile';

export interface TeamMembersResponse {
  members: EmployerProfile[];
}

export interface TeamMemberCreate {
  first_name: string;
  last_name?: string;
  email: string;
  role: EmployerRole;
  job_title?: string;
  experience_years?: number;
  skills?: Skill[];
}

export interface TeamMemberInviteResponse {
  member: EmployerProfile;
}

export interface TeamInviteAccept {
  first_name?: string;
  last_name?: string;
  phone?: string;
  job_title?: string;
  department?: string;
  bio?: string;
  skills?: Array<Record<string, unknown>>;
  experience_years?: number;
  password?: string;
}