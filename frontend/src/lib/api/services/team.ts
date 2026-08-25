import { apiClient } from '../client';
import { ApiResponse, TeamInviteAccept, TeamMemberCreate, TeamMemberInviteResponse, TeamMembersResponse } from '@/types';

export class TeamService {
  static async listTeam(): Promise<ApiResponse<TeamMembersResponse>> {
    return await apiClient.get<TeamMembersResponse>('/team');
  }

  static async inviteMember(data: TeamMemberCreate): Promise<ApiResponse<TeamMemberInviteResponse>> {
    return await apiClient.post<TeamMemberInviteResponse>('/team', data);
  }

  static async getInvitation(token: string): Promise<ApiResponse<TeamMemberInviteResponse>> {
    return await apiClient.get<TeamMemberInviteResponse>(`/team/invite/${encodeURIComponent(token)}`);
  }

  static async acceptInvitation(token: string, data: TeamInviteAccept = {}): Promise<ApiResponse<TeamMemberInviteResponse>> {
    return await apiClient.post<TeamMemberInviteResponse>(`/team/invite/${encodeURIComponent(token)}/accept`, data);
  }

  static async rejectInvitation(token: string): Promise<ApiResponse<TeamMemberInviteResponse>> {
    return await apiClient.post<TeamMemberInviteResponse>(`/team/invite/${encodeURIComponent(token)}/reject`, {});
  }
}

export default TeamService;