import { supabase } from '@/lib/supabaseClient';
import { Database } from '@/lib/database.types';

type Issue = Database['public']['Tables']['issues']['Row'];
type User = Database['public']['Tables']['users']['Row'];
type Label = Database['public']['Tables']['labels']['Row'];

export interface IssueWithRelations extends Issue {
  assignee?: User | null;
  creator: User;
  labels?: Label[];
  comments_count?: number;
}

// Get all issues for a specific project
export async function getProjectIssues(projectId: string): Promise<IssueWithRelations[]> {
  try {
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
export async function getIssueById(issueId: string): Promise<IssueWithRelations | null> {
  try {
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
export async function updateIssueStatus(issueId: string, status: string): Promise<void> {
  try {
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
  value: any
): Promise<void> {
  try {
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
export async function deleteIssue(issueId: string): Promise<void> {
  try {
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
