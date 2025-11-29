// Database types based on Supabase schema

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          password_hash: string | null;
          name: string;
          profile_image: string | null;
          auth_provider: 'email' | 'google';
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id: string;
          email: string;
          password_hash?: string | null;
          name: string;
          profile_image?: string | null;
          auth_provider?: 'email' | 'google';
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          email?: string;
          password_hash?: string | null;
          name?: string;
          profile_image?: string | null;
          auth_provider?: 'email' | 'google';
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
      };
      teams: {
        Row: {
          id: string;
          name: string;
          owner_id: string;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          owner_id: string;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          owner_id?: string;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
      };
      team_members: {
        Row: {
          id: string;
          team_id: string;
          user_id: string;
          role: 'OWNER' | 'ADMIN' | 'MEMBER';
          joined_at: string;
        };
        Insert: {
          id?: string;
          team_id: string;
          user_id: string;
          role: 'OWNER' | 'ADMIN' | 'MEMBER';
          joined_at?: string;
        };
        Update: {
          id?: string;
          team_id?: string;
          user_id?: string;
          role?: 'OWNER' | 'ADMIN' | 'MEMBER';
          joined_at?: string;
        };
      };
      projects: {
        Row: {
          id: string;
          team_id: string;
          name: string;
          description: string | null;
          owner_id: string;
          is_archived: boolean;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          team_id: string;
          name: string;
          description?: string | null;
          owner_id: string;
          is_archived?: boolean;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          team_id?: string;
          name?: string;
          description?: string | null;
          owner_id?: string;
          is_archived?: boolean;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
      };
      issues: {
        Row: {
          id: string;
          project_id: string;
          title: string;
          description: string | null;
          status: string;
          priority: 'HIGH' | 'MEDIUM' | 'LOW';
          assignee_user_id: string | null;
          creator_id: string;
          due_date: string | null;
          position: number;
          ai_summary_cache: string | null;
          ai_suggestion_cache: string | null;
          ai_cache_invalidated_at: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          project_id: string;
          title: string;
          description?: string | null;
          status?: string;
          priority?: 'HIGH' | 'MEDIUM' | 'LOW';
          assignee_user_id?: string | null;
          creator_id: string;
          due_date?: string | null;
          position: number;
          ai_summary_cache?: string | null;
          ai_suggestion_cache?: string | null;
          ai_cache_invalidated_at?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          project_id?: string;
          title?: string;
          description?: string | null;
          status?: string;
          priority?: 'HIGH' | 'MEDIUM' | 'LOW';
          assignee_user_id?: string | null;
          creator_id?: string;
          due_date?: string | null;
          position?: number;
          ai_summary_cache?: string | null;
          ai_suggestion_cache?: string | null;
          ai_cache_invalidated_at?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
      };
      labels: {
        Row: {
          id: string;
          project_id: string;
          name: string;
          color: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          name: string;
          color: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          name?: string;
          color?: string;
          created_at?: string;
        };
      };
      issue_labels: {
        Row: {
          id: string;
          issue_id: string;
          label_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          issue_id: string;
          label_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          issue_id?: string;
          label_id?: string;
          created_at?: string;
        };
      };
      comments: {
        Row: {
          id: string;
          issue_id: string;
          user_id: string;
          content: string;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          issue_id: string;
          user_id: string;
          content: string;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          issue_id?: string;
          user_id?: string;
          content?: string;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
      };
    };
  };
}

// Helper types for the application
export type Issue = Database['public']['Tables']['issues']['Row'];
export type Project = Database['public']['Tables']['projects']['Row'];
export type Team = Database['public']['Tables']['teams']['Row'];
export type User = Database['public']['Tables']['users']['Row'];
export type Label = Database['public']['Tables']['labels']['Row'];
export type Comment = Database['public']['Tables']['comments']['Row'];

// Extended types with relations
export interface IssueWithRelations extends Issue {
  assignee?: User | null;
  creator: User;
  labels?: Label[];
  comments_count?: number;
  project?: Project;
}
