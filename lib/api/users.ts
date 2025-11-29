import { supabase } from '@/lib/supabaseClient';
import { Database } from '@/lib/database.types';

type User = Database['public']['Tables']['users']['Row'];

// Get all users (for team member selection)
export async function getAllUsers(): Promise<User[]> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .is('deleted_at', null)
      .order('name', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching all users:', error);
    throw error;
  }
}

// Get users not in a specific team
export async function getUsersNotInTeam(teamId: string): Promise<User[]> {
  try {
    // Get all team member user IDs
    const { data: teamMembers, error: membersError } = await supabase
      .from('team_members')
      .select('user_id')
      .eq('team_id', teamId);

    if (membersError) throw membersError;

    const memberUserIds = teamMembers?.map(tm => tm.user_id) || [];

    // Get all users not in the team
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .is('deleted_at', null)
      .not('id', 'in', `(${memberUserIds.join(',')})`)
      .order('name', { ascending: true });

    if (usersError) throw usersError;
    return users || [];
  } catch (error) {
    console.error('Error fetching users not in team:', error);
    throw error;
  }
}
