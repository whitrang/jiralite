import { supabase } from '@/lib/supabaseClient';
import { Database } from '@/lib/database.types';
import { verifyTeamMembership } from './teams';

type Issue = Database['public']['Tables']['issues']['Row'];
type User = Database['public']['Tables']['users']['Row'];
type Label = Database['public']['Tables']['labels']['Row'];

export interface IssueWithRelations extends Issue {
  assignee?: User | null;
  creator: User;
  labels?: Label[];
  comments_count?: number;
}

// Helper function to verify issue access through project's team membership
async function verifyIssueAccess(
  issueId: string,
  userId: string
): Promise<{ hasAccess: boolean; projectId: string | null; role: 'OWNER' | 'ADMIN' | 'MEMBER' | null }> {
  try {
    // Get issue's project_id
    const { data: issue, error: issueError } = await supabase
      .from('issues')
      .select('project_id')
      .eq('id', issueId)
      .is('deleted_at', null)
      .single();

    if (issueError || !issue) {
      return { hasAccess: false, projectId: null, role: null };
    }

    // Get project's team_id
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('team_id')
      .eq('id', issue.project_id)
      .is('deleted_at', null)
      .single();

    if (projectError || !project) {
      return { hasAccess: false, projectId: null, role: null };
    }

    // Verify team membership
    const { isMember, role } = await verifyTeamMembership(project.team_id, userId);

    return {
      hasAccess: isMember,
      projectId: issue.project_id,
      role,
    };
  } catch (error) {
    return { hasAccess: false, projectId: null, role: null };
  }
}

// Helper function to verify project access for creating issues
async function verifyProjectAccessForIssue(
  projectId: string,
  userId: string
): Promise<{ hasAccess: boolean; role: 'OWNER' | 'ADMIN' | 'MEMBER' | null }> {
  try {
    // Get project's team_id
    const { data: project, error } = await supabase
      .from('projects')
      .select('team_id')
      .eq('id', projectId)
      .is('deleted_at', null)
      .single();

    if (error || !project) {
      return { hasAccess: false, role: null };
    }

    // Verify team membership
    const { isMember, role } = await verifyTeamMembership(project.team_id, userId);

    return {
      hasAccess: isMember,
      role,
    };
  } catch (error) {
    return { hasAccess: false, role: null };
  }
}

// Get all issues for a specific project
export async function getProjectIssues(projectId: string, userId: string): Promise<IssueWithRelations[]> {
  try {
    // Verify project access
    const { hasAccess } = await verifyProjectAccessForIssue(projectId, userId);

    if (!hasAccess) {
      throw new Error('NOT_FOUND');
    }

    const { data, error } = await supabase
      .from('issues')
      .select(`
        *,
        assignee:assignee_user_id(id, name, profile_image),
        creator:creator_id(id, name, profile_image),
        issue_labels(
          label:label_id(id, name, color)
        )
      `)
      .eq('project_id', projectId)
      .is('deleted_at', null)
      .order('position', { ascending: true });

    if (error) throw error;
    return (data || []) as IssueWithRelations[];
  } catch (error) {
    console.error('Error fetching project issues:', error);
    throw error;
  }
}

// Get a single issue by ID
export async function getIssueById(issueId: string, userId?: string): Promise<IssueWithRelations | null> {
  try {
    // If userId is provided, verify access
    if (userId) {
      const { hasAccess } = await verifyIssueAccess(issueId, userId);
      if (!hasAccess) {
        throw new Error('NOT_FOUND');
      }
    }

    const { data, error } = await supabase
      .from('issues')
      .select(`
        *,
        assignee:assignee_user_id(id, name, profile_image),
        creator:creator_id(id, name, profile_image),
        issue_labels(
          label:label_id(id, name, color)
        )
      `)
      .eq('id', issueId)
      .is('deleted_at', null)
      .single();

    if (error) throw error;
    return data as IssueWithRelations;
  } catch (error) {
    console.error('Error fetching issue:', error);
    return null;
  }
}

// Update issue status
export async function updateIssueStatus(issueId: string, status: string, userId: string): Promise<void> {
  try {
    // Verify issue access
    const { hasAccess } = await verifyIssueAccess(issueId, userId);

    if (!hasAccess) {
      throw new Error('NOT_FOUND');
    }

    const { error } = await supabase
      .from('issues')
      .update({ status })
      .eq('id', issueId);

    if (error) throw error;
  } catch (error) {
    console.error('Error updating issue status:', error);
    throw error;
  }
}

// Update issue field
export async function updateIssueField(
  issueId: string,
  field: string,
  value: any,
  userId: string
): Promise<void> {
  try {
    // Verify issue access
    const { hasAccess } = await verifyIssueAccess(issueId, userId);

    if (!hasAccess) {
      throw new Error('NOT_FOUND');
    }

    const { error } = await supabase
      .from('issues')
      .update({ [field]: value })
      .eq('id', issueId);

    if (error) throw error;
  } catch (error) {
    console.error(`Error updating issue ${field}:`, error);
    throw error;
  }
}

// Delete issue (soft delete)
export async function deleteIssue(issueId: string, userId: string): Promise<void> {
  try {
    // Verify issue access
    const { hasAccess } = await verifyIssueAccess(issueId, userId);

    if (!hasAccess) {
      throw new Error('NOT_FOUND');
    }

    const { error } = await supabase
      .from('issues')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', issueId);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting issue:', error);
    throw error;
  }
}
