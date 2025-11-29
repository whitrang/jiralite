import { supabase } from '@/lib/supabaseClient';
import { Database } from '@/lib/database.types';
import { verifyTeamMembership } from './teams';

type Project = Database['public']['Tables']['projects']['Row'];

// Helper function to verify project access through team membership
async function verifyProjectAccess(
  projectId: string,
  userId: string
): Promise<{ hasAccess: boolean; teamId: string | null; role: 'OWNER' | 'ADMIN' | 'MEMBER' | null }> {
  try {
    // Get project's team_id
    const { data: project, error } = await supabase
      .from('projects')
      .select('team_id')
      .eq('id', projectId)
      .is('deleted_at', null)
      .single();

    if (error || !project) {
      return { hasAccess: false, teamId: null, role: null };
    }

    // Verify team membership
    const { isMember, role } = await verifyTeamMembership(project.team_id, userId);

    return {
      hasAccess: isMember,
      teamId: project.team_id,
      role,
    };
  } catch (error) {
    return { hasAccess: false, teamId: null, role: null };
  }
}

// Create a new project
export async function createProject(
  teamId: string,
  name: string,
  description: string | null,
  ownerId: string
): Promise<Project> {
  try {
    // Verify team membership
    const { isMember } = await verifyTeamMembership(teamId, ownerId);

    if (!isMember) {
      throw new Error('FORBIDDEN');
    }

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
export async function getTeamProjects(teamId: string, userId: string): Promise<Project[]> {
  try {
    // Verify team membership
    const { isMember } = await verifyTeamMembership(teamId, userId);

    if (!isMember) {
      throw new Error('NOT_FOUND');
    }

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
export async function getProjectById(projectId: string, userId?: string): Promise<Project | null> {
  try {
    // If userId is provided, verify access
    if (userId) {
      const { hasAccess } = await verifyProjectAccess(projectId, userId);
      if (!hasAccess) {
        throw new Error('NOT_FOUND');
      }
    }

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
  description: string | null,
  userId: string
): Promise<Project> {
  try {
    // Verify project access
    const { hasAccess, role } = await verifyProjectAccess(projectId, userId);

    if (!hasAccess) {
      throw new Error('NOT_FOUND');
    }

    if (role !== 'OWNER' && role !== 'ADMIN') {
      throw new Error('FORBIDDEN');
    }

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
  isArchived: boolean,
  userId: string
): Promise<void> {
  try {
    // Verify project access
    const { hasAccess, role } = await verifyProjectAccess(projectId, userId);

    if (!hasAccess) {
      throw new Error('NOT_FOUND');
    }

    if (role !== 'OWNER' && role !== 'ADMIN') {
      throw new Error('FORBIDDEN');
    }

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
export async function deleteProject(projectId: string, userId: string): Promise<void> {
  try {
    // Verify project access
    const { hasAccess, role } = await verifyProjectAccess(projectId, userId);

    if (!hasAccess) {
      throw new Error('NOT_FOUND');
    }

    if (role !== 'OWNER' && role !== 'ADMIN') {
      throw new Error('FORBIDDEN');
    }

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
