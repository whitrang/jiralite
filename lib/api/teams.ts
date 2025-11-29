import { supabase } from '@/lib/supabaseClient';
import { Database } from '@/lib/database.types';

type Team = Database['public']['Tables']['teams']['Row'];
type TeamMember = Database['public']['Tables']['team_members']['Row'];
type User = Database['public']['Tables']['users']['Row'];

export interface TeamWithRole extends Team {
  role: 'OWNER' | 'ADMIN' | 'MEMBER';
  memberCount: number;
  projectCount: number;
}

export interface TeamMemberWithUser extends TeamMember {
  user: User;
}

// Helper function to verify team membership
export async function verifyTeamMembership(
  teamId: string,
  userId: string
): Promise<{ isMember: boolean; role: 'OWNER' | 'ADMIN' | 'MEMBER' | null }> {
  try {
    const { data, error } = await supabase
      .from('team_members')
      .select('role')
      .eq('team_id', teamId)
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      return { isMember: false, role: null };
    }

    return { isMember: true, role: data.role };
  } catch (error) {
    return { isMember: false, role: null };
  }
}

// Get all teams for the current user
export async function getUserTeams(userId: string): Promise<TeamWithRole[]> {
  try {
    // Get teams where user is a member
    const { data: teamMembers, error: membersError } = await supabase
      .from('team_members')
      .select(`
        team_id,
        role,
        teams (
          id,
          name,
          owner_id,
          created_at,
          updated_at,
          deleted_at
        )
      `)
      .eq('user_id', userId)
      .is('teams.deleted_at', null);

    if (membersError) throw membersError;
    if (!teamMembers) return [];

    // Get counts for each team
    const teamsWithCounts = await Promise.all(
      teamMembers.map(async (tm: any) => {
        const team = tm.teams;
        if (!team) return null;

        // Get member count
        const { count: memberCount } = await supabase
          .from('team_members')
          .select('*', { count: 'exact', head: true })
          .eq('team_id', team.id);

        // Get project count
        const { count: projectCount } = await supabase
          .from('projects')
          .select('*', { count: 'exact', head: true })
          .eq('team_id', team.id)
          .is('deleted_at', null);

        return {
          ...team,
          role: tm.role,
          memberCount: memberCount || 0,
          projectCount: projectCount || 0,
        };
      })
    );

    return teamsWithCounts.filter(Boolean) as TeamWithRole[];
  } catch (error) {
    console.error('Error fetching user teams:', error);
    throw error;
  }
}

// Create a new team
export async function createTeam(name: string, ownerId: string): Promise<Team> {
  try {
    const { data, error } = await supabase
      .from('teams')
      .insert({
        name,
        owner_id: ownerId,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating team:', error);
    throw error;
  }
}

// Update team name
export async function updateTeam(teamId: string, name: string, userId: string): Promise<Team> {
  try {
    // Verify team membership and role
    const { isMember, role } = await verifyTeamMembership(teamId, userId);

    if (!isMember) {
      throw new Error('NOT_FOUND');
    }

    if (role !== 'OWNER' && role !== 'ADMIN') {
      throw new Error('FORBIDDEN');
    }

    const { data, error } = await supabase
      .from('teams')
      .update({ name })
      .eq('id', teamId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating team:', error);
    throw error;
  }
}

// Delete a team (soft delete) - Only OWNER can delete
export async function deleteTeam(teamId: string, userId: string): Promise<void> {
  try {
    // Verify team membership and role
    const { isMember, role } = await verifyTeamMembership(teamId, userId);

    if (!isMember) {
      throw new Error('NOT_FOUND');
    }

    if (role !== 'OWNER') {
      throw new Error('FORBIDDEN');
    }

    // Soft delete the team
    const { error } = await supabase
      .from('teams')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', teamId);

    if (error) throw error;

    // Note: Cascade delete of projects, issues, etc. should be handled by database triggers
    // or you can manually soft delete them here
  } catch (error) {
    console.error('Error deleting team:', error);
    throw error;
  }
}

// Get team by ID (with membership verification)
export async function getTeamById(teamId: string, userId?: string): Promise<Team | null> {
  try {
    // If userId is provided, verify membership
    if (userId) {
      const { isMember } = await verifyTeamMembership(teamId, userId);
      if (!isMember) {
        throw new Error('NOT_FOUND');
      }
    }

    const { data, error } = await supabase
      .from('teams')
      .select('*')
      .eq('id', teamId)
      .is('deleted_at', null)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching team:', error);
    throw error;
  }
}

// Check if user has recent activity in team
export async function hasRecentActivity(teamId: string): Promise<boolean> {
  try {
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    const { data, error } = await supabase
      .from('team_activity_logs')
      .select('id')
      .eq('team_id', teamId)
      .gte('created_at', oneDayAgo.toISOString())
      .limit(1);

    if (error) throw error;
    return data && data.length > 0;
  } catch (error) {
    console.error('Error checking recent activity:', error);
    return false;
  }
}
