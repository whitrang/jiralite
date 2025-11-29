import { supabase } from '@/lib/supabaseClient';
import { Database } from '@/lib/database.types';

type ActivityLog = Database['public']['Tables']['team_activity_logs']['Row'];
type User = Database['public']['Tables']['users']['Row'];

export interface ActivityLogWithActor extends ActivityLog {
  actor: User;
}

// Get all activity logs for a team
export async function getTeamActivityLogs(
  teamId: string
): Promise<ActivityLogWithActor[]> {
  try {
    const { data, error } = await supabase
      .from('team_activity_logs')
      .select(`
        *,
        actor:actor_id (
          id,
          name,
          email,
          profile_image
        )
      `)
      .eq('team_id', teamId)
      .order('created_at', { ascending: false });

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

    case 'TEAM_CREATED':
      return `${actorName} created the team`;

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
    case 'TEAM_CREATED':
      return 'users';
    default:
      return 'activity';
  }
}

// Log team activity
export async function logTeamActivity(
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
