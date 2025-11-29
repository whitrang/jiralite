import { supabase } from '@/lib/supabaseClient';
import { Database } from '@/lib/database.types';

type TeamMember = Database['public']['Tables']['team_members']['Row'];
type User = Database['public']['Tables']['users']['Row'];

export interface TeamMemberWithUser extends TeamMember {
  users: User;
}

// Get all members of a team
export async function getTeamMembers(teamId: string): Promise<TeamMemberWithUser[]> {
  try {
    const { data, error } = await supabase
      .from('team_members')
      .select(`
        *,
        users (
          id,
          email,
          name,
          profile_image,
          created_at
        )
      `)
      .eq('team_id', teamId)
      .order('role', { ascending: true })
      .order('joined_at', { ascending: true });

    if (error) throw error;
    return (data || []) as TeamMemberWithUser[];
  } catch (error) {
    console.error('Error fetching team members:', error);
    throw error;
  }
}

// Get user's role in a team
export async function getUserRole(teamId: string, userId: string): Promise<'OWNER' | 'ADMIN' | 'MEMBER' | null> {
  try {
    const { data, error } = await supabase
      .from('team_members')
      .select('role')
      .eq('team_id', teamId)
      .eq('user_id', userId)
      .single();

    if (error) throw error;
    return data?.role || null;
  } catch (error) {
    console.error('Error fetching user role:', error);
    return null;
  }
}

// Add multiple members to the team directly
export async function addMembersToTeam(
  teamId: string,
  userIds: string[],
  addedBy: string,
  role: 'OWNER' | 'ADMIN' | 'MEMBER' = 'MEMBER'
): Promise<void> {
  try {
    // Add all members
    const { error } = await supabase
      .from('team_members')
      .insert(
        userIds.map(userId => ({
          team_id: teamId,
          user_id: userId,
          role,
        }))
      );

    if (error) throw error;

    // Log the activity for each member
    for (const userId of userIds) {
      await logTeamActivity(teamId, addedBy, 'MEMBER_ADDED', 'user', userId);
    }
  } catch (error) {
    console.error('Error adding members to team:', error);
    throw error;
  }
}

// Invite a member to the team (create team invite) - Legacy email-based
export async function inviteMember(
  teamId: string,
  email: string,
  invitedBy: string
): Promise<void> {
  try {
    // Set expiration to 7 days from now
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const { error } = await supabase
      .from('team_invites')
      .insert({
        team_id: teamId,
        email,
        invited_by: invitedBy,
        status: 'pending',
        expires_at: expiresAt.toISOString(),
      });

    if (error) throw error;

    // TODO: Send email notification to the invitee
  } catch (error) {
    console.error('Error inviting member:', error);
    throw error;
  }
}

// Update member role (only OWNER can do this)
export async function updateMemberRole(
  teamId: string,
  userId: string,
  newRole: 'OWNER' | 'ADMIN' | 'MEMBER',
  currentUserId?: string
): Promise<void> {
  try {
    // If transferring OWNER role, demote current OWNER to ADMIN
    if (newRole === 'OWNER' && currentUserId) {
      // First, demote current OWNER to ADMIN
      const { error: demoteError } = await supabase
        .from('team_members')
        .update({ role: 'ADMIN' })
        .eq('team_id', teamId)
        .eq('user_id', currentUserId);

      if (demoteError) throw demoteError;

      // Update team owner_id
      const { error: teamError } = await supabase
        .from('teams')
        .update({ owner_id: userId })
        .eq('id', teamId);

      if (teamError) throw teamError;
    }

    // Update the target user's role
    const { error } = await supabase
      .from('team_members')
      .update({ role: newRole })
      .eq('team_id', teamId)
      .eq('user_id', userId);

    if (error) throw error;

    // Log the activity
    await logTeamActivity(teamId, userId, 'ROLE_CHANGED', 'user', userId, {
      newRole,
    });
  } catch (error) {
    console.error('Error updating member role:', error);
    throw error;
  }
}

// Remove a member from the team
export async function removeMember(
  teamId: string,
  userId: string,
  removedBy: string
): Promise<void> {
  try {
    const { error } = await supabase
      .from('team_members')
      .delete()
      .eq('team_id', teamId)
      .eq('user_id', userId);

    if (error) throw error;

    // Log the activity
    await logTeamActivity(teamId, removedBy, 'MEMBER_REMOVED', 'user', userId);
  } catch (error) {
    console.error('Error removing member:', error);
    throw error;
  }
}

// Leave a team
export async function leaveTeam(teamId: string, userId: string): Promise<void> {
  try {
    // Check if user is the owner
    const { data: team, error: teamError } = await supabase
      .from('teams')
      .select('owner_id')
      .eq('id', teamId)
      .single();

    if (teamError) throw teamError;

    if (team.owner_id === userId) {
      throw new Error('Team owner cannot leave the team. Please transfer ownership or delete the team.');
    }

    const { error } = await supabase
      .from('team_members')
      .delete()
      .eq('team_id', teamId)
      .eq('user_id', userId);

    if (error) throw error;

    // Log the activity
    await logTeamActivity(teamId, userId, 'MEMBER_LEFT', 'user', userId);
  } catch (error) {
    console.error('Error leaving team:', error);
    throw error;
  }
}

// Add a member to the team (used after accepting invite)
export async function addMemberToTeam(
  teamId: string,
  userId: string,
  role: 'OWNER' | 'ADMIN' | 'MEMBER' = 'MEMBER'
): Promise<void> {
  try {
    const { error } = await supabase
      .from('team_members')
      .insert({
        team_id: teamId,
        user_id: userId,
        role,
      });

    if (error) throw error;

    // Log the activity
    await logTeamActivity(teamId, userId, 'MEMBER_ADDED', 'user', userId);
  } catch (error) {
    console.error('Error adding member to team:', error);
    throw error;
  }
}

// Helper function to log team activity
async function logTeamActivity(
  teamId: string,
  actorId: string,
  actionType: string,
  targetType?: string,
  targetId?: string,
  metadata?: any
): Promise<void> {
  try {
    await supabase.from('team_activity_logs').insert({
      team_id: teamId,
      actor_id: actorId,
      action_type: actionType,
      target_type: targetType,
      target_id: targetId,
      metadata,
    });
  } catch (error) {
    console.error('Error logging team activity:', error);
    // Don't throw - activity logging is not critical
  }
}
