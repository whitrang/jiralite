import { supabase } from '@/lib/supabaseClient';
import { Database } from '@/lib/database.types';

type Project = Database['public']['Tables']['projects']['Row'];

// Create a new project
export async function createProject(
  teamId: string,
  name: string,
  description: string | null,
  ownerId: string
): Promise<Project> {
  try {
    const { data, error } = await supabase
      .from('projects')
      .insert({
        team_id: teamId,
        name,
        description,
        owner_id: ownerId,
        is_archived: false,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating project:', error);
    throw error;
  }
}

// Get all projects for a team
export async function getTeamProjects(teamId: string): Promise<Project[]> {
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('team_id', teamId)
      .is('deleted_at', null)
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching team projects:', error);
    throw error;
  }
}

// Get a single project by ID
export async function getProjectById(projectId: string): Promise<Project | null> {
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .is('deleted_at', null)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching project:', error);
    return null;
  }
}

// Update project
export async function updateProject(
  projectId: string,
  name: string,
  description: string | null
): Promise<Project> {
  try {
    const { data, error } = await supabase
      .from('projects')
      .update({ name, description })
      .eq('id', projectId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating project:', error);
    throw error;
  }
}

// Archive/Unarchive project
export async function toggleProjectArchive(
  projectId: string,
  isArchived: boolean
): Promise<void> {
  try {
    const { error } = await supabase
      .from('projects')
      .update({ is_archived: isArchived })
      .eq('id', projectId);

    if (error) throw error;
  } catch (error) {
    console.error('Error toggling project archive:', error);
    throw error;
  }
}

// Delete project (soft delete)
export async function deleteProject(projectId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('projects')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', projectId);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting project:', error);
    throw error;
  }
}
