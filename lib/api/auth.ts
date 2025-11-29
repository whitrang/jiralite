import { supabase } from '@/lib/supabaseClient';
import { Database } from '@/lib/database.types';

type User = Database['public']['Tables']['users']['Row'];

// Get current authenticated user
export async function getCurrentUser(): Promise<User | null> {
  try {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user) {
      return null;
    }

    // Get user details from our users table
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', session.user.email)
      .is('deleted_at', null)
      .single();

    if (error) {
      console.error('Error fetching user:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

// Get current user ID from auth session
export async function getCurrentUserId(): Promise<string | null> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.user?.id || null;
  } catch (error) {
    console.error('Error getting current user ID:', error);
    return null;
  }
}
