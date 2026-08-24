import { apiClient } from '../client';
import {
  ApiResponse,
  EmployerProfile,
  TeamInviteAccept,
  TeamMemberCreate,
  TeamMemberInviteResponse,
  TeamMembersResponse,
} from '@/types';
import { API_CONFIG } from '@/lib/config/api';

export class TeamService {
  static async listTeam(): Promise<ApiResponse<TeamMembersResponse>> {
    return await apiClient.get<TeamMembersResponse>(API_CONFIG.ENDPOINTS.TEAM.LIST);
  }

  static async inviteMember(data: TeamMemberCreate): Promise<ApiResponse<TeamMemberInviteResponse>> {
    return await apiClient.post<TeamMemberInviteResponse>(API_CONFIG.ENDPOINTS.TEAM.CREATE, data);
  }

  static async getInvitation(token: string): Promise<ApiResponse<TeamMemberInviteResponse>> {
    return await apiClient.get<TeamMemberInviteResponse>(`/team/invite/${token}`);
  }

  static async acceptInvitation(
    token: string,
    data: TeamInviteAccept = {}
  ): Promise<ApiResponse<TeamMemberInviteResponse>> {
    return await apiClient.post<TeamMemberInviteResponse>(`/team/invite/${token}/accept`, data);
  }

  static async rejectInvitation(token: string): Promise<ApiResponse<TeamMemberInviteResponse>> {
    return await apiClient.post<TeamMemberInviteResponse>(`/team/invite/${token}/reject`);
  }
}

export default TeamService;
