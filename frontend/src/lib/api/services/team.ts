import { apiClient } from '../client';

import {
  ApiResponse,
} from '@/types';

import {
  TeamMember,
  TeamMembersResponse,
  TeamMemberCreate,
} from '@/types/team';


export class TeamService {

  static async getTeamMembers(): Promise<
    ApiResponse<TeamMembersResponse>
  > {
    return await apiClient.get<TeamMembersResponse>(
      '/team'
    );
  }


  static async addTeamMember(
    data: TeamMemberCreate
  ): Promise<ApiResponse<TeamMember>> {
    return await apiClient.post<TeamMember>(
      '/team',
      data
    );
  }
}


export default TeamService;