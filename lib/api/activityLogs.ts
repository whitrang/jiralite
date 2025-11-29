import { supabase } from '@/lib/supabaseClient';
import { Database } from '@/lib/database.types';

type ActivityLog = Database['public']['Tables']['team_activity_logs']['Row'];
type User = Database['public']['Tables']['users']['Row'];

export interface ActivityLogWithActor extends ActivityLog {
  actor: User;
}

// Get activity logs for a team with pagination
export async function getTeamActivityLogs(
  teamId: string,
  limit: number = 20,
  offset: number = 0
): Promise<ActivityLogWithActor[]> {
  try {
    const { data, error } = await supabase
      .from('team_activity_logs')
      .select(`
        *,
        actor:users!team_activity_logs_actor_id_fkey (
          id,
          name,
          email,
          profile_image
        )
      `)
      .eq('team_id', teamId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return (data || []) as ActivityLogWithActor[];
  } catch (error) {
    console.error('Error fetching activity logs:', error);
    throw error;
  }
}

// Format activity log message
export function formatActivityMessage(log: ActivityLogWithActor): string {
  const actorName = log.actor.name;
  const metadata = log.metadata || {};

  switch (log.action_type) {
    case 'MEMBER_ADDED':
      return `${actorName} added a member to the team`;

    case 'MEMBER_REMOVED':
      return `${actorName} removed a member from the team`;

    case 'MEMBER_LEFT':
      return `${actorName} left the team`;

    case 'ROLE_CHANGED':
      const newRole = metadata.newRole || 'unknown';
      return `${actorName} changed a member's role to ${newRole}`;

    case 'PROJECT_CREATED':
      const projectName = metadata.projectName || 'a project';
      return `${actorName} created project "${projectName}"`;

    case 'PROJECT_DELETED':
      const deletedProjectName = metadata.projectName || 'a project';
      return `${actorName} deleted project "${deletedProjectName}"`;

    case 'PROJECT_ARCHIVED':
      const archivedProjectName = metadata.projectName || 'a project';
      return `${actorName} archived project "${archivedProjectName}"`;

    case 'TEAM_UPDATED':
      return `${actorName} updated team information`;

    default:
      return `${actorName} performed an action`;
  }
}

// Get activity icon based on action type
export function getActivityIcon(actionType: string): string {
  switch (actionType) {
    case 'MEMBER_ADDED':
      return 'user-plus';
    case 'MEMBER_REMOVED':
    case 'MEMBER_LEFT':
      return 'user-minus';
    case 'ROLE_CHANGED':
      return 'shield';
    case 'PROJECT_CREATED':
      return 'folder-plus';
    case 'PROJECT_DELETED':
      return 'folder-minus';
    case 'PROJECT_ARCHIVED':
      return 'archive';
    case 'TEAM_UPDATED':
      return 'settings';
    default:
      return 'activity';
  }
}
