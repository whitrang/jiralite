import { supabase } from '@/lib/supabaseClient';

const RATE_LIMITS = {
  minute: 10,  // 10 requests per minute
  day: 100,    // 100 requests per day
};

interface RateLimitResult {
  allowed: boolean;
  remaining?: number;
  resetTime?: Date;
  error?: string;
}

/**
 * Check if user has exceeded rate limits
 * @param userId - User ID to check
 * @returns RateLimitResult indicating if request is allowed
 */
export async function checkRateLimit(userId: string): Promise<RateLimitResult> {
  try {
    const now = new Date();

    // Check minute limit
    const minuteStart = new Date(now);
    minuteStart.setSeconds(0, 0);

    const { data: minuteLimit, error: minuteError } = await supabase
      .from('ai_rate_limits')
      .select('*')
      .eq('user_id', userId)
      .eq('window_type', 'minute')
      .eq('window_start', minuteStart.toISOString())
      .single();

    if (minuteError && minuteError.code !== 'PGRST116') {
      throw minuteError;
    }

    if (minuteLimit && minuteLimit.request_count >= RATE_LIMITS.minute) {
      const resetTime = new Date(minuteStart);
      resetTime.setMinutes(resetTime.getMinutes() + 1);

      return {
        allowed: false,
        remaining: 0,
        resetTime,
        error: `Rate limit exceeded. You can make ${RATE_LIMITS.minute} requests per minute. Please try again in ${Math.ceil((resetTime.getTime() - now.getTime()) / 1000)} seconds.`,
      };
    }

    // Check daily limit
    const dayStart = new Date(now);
    dayStart.setHours(0, 0, 0, 0);

    const { data: dayLimit, error: dayError } = await supabase
      .from('ai_rate_limits')
      .select('*')
      .eq('user_id', userId)
      .eq('window_type', 'day')
      .eq('window_start', dayStart.toISOString())
      .single();

    if (dayError && dayError.code !== 'PGRST116') {
      throw dayError;
    }

    if (dayLimit && dayLimit.request_count >= RATE_LIMITS.day) {
      const resetTime = new Date(dayStart);
      resetTime.setDate(resetTime.getDate() + 1);

      return {
        allowed: false,
        remaining: 0,
        resetTime,
        error: `Daily rate limit exceeded. You can make ${RATE_LIMITS.day} requests per day. Please try again tomorrow.`,
      };
    }

    // Calculate remaining requests
    const minuteRemaining = RATE_LIMITS.minute - (minuteLimit?.request_count || 0);
    const dayRemaining = RATE_LIMITS.day - (dayLimit?.request_count || 0);
    const remaining = Math.min(minuteRemaining, dayRemaining);

    return {
      allowed: true,
      remaining,
    };
  } catch (error) {
    console.error('Error checking rate limit:', error);
    // Allow request on error to avoid blocking users
    return { allowed: true };
  }
}

/**
 * Increment rate limit counter for a user
 * @param userId - User ID
 */
export async function incrementRateLimit(userId: string): Promise<void> {
  try {
    const now = new Date();

    // Increment minute counter
    const minuteStart = new Date(now);
    minuteStart.setSeconds(0, 0);

    const { error: minuteError } = await supabase.rpc('increment_rate_limit', {
      p_user_id: userId,
      p_window_type: 'minute',
      p_window_start: minuteStart.toISOString(),
    });

    if (minuteError) {
      // If RPC doesn't exist or fails, use upsert
      await supabase
        .from('ai_rate_limits')
        .upsert({
          user_id: userId,
          window_type: 'minute',
          window_start: minuteStart.toISOString(),
          request_count: 1,
        }, {
          onConflict: 'user_id,window_type,window_start',
        });
    }

    // Increment day counter
    const dayStart = new Date(now);
    dayStart.setHours(0, 0, 0, 0);

    const { error: dayError } = await supabase.rpc('increment_rate_limit', {
      p_user_id: userId,
      p_window_type: 'day',
      p_window_start: dayStart.toISOString(),
    });

    if (dayError) {
      // If RPC doesn't exist or fails, use upsert
      await supabase
        .from('ai_rate_limits')
        .upsert({
          user_id: userId,
          window_type: 'day',
          window_start: dayStart.toISOString(),
          request_count: 1,
        }, {
          onConflict: 'user_id,window_type,window_start',
        });
    }
  } catch (error) {
    console.error('Error incrementing rate limit:', error);
    // Don't throw - rate limiting is not critical
  }
}

/**
 * Get current rate limit status for a user
 * @param userId - User ID
 * @returns Object with minute and day usage stats
 */
export async function getRateLimitStatus(userId: string): Promise<{
  minute: { used: number; limit: number; remaining: number };
  day: { used: number; limit: number; remaining: number };
}> {
  try {
    const now = new Date();

    // Get minute usage
    const minuteStart = new Date(now);
    minuteStart.setSeconds(0, 0);

    const { data: minuteLimit } = await supabase
      .from('ai_rate_limits')
      .select('request_count')
      .eq('user_id', userId)
      .eq('window_type', 'minute')
      .eq('window_start', minuteStart.toISOString())
      .single();

    const minuteUsed = minuteLimit?.request_count || 0;

    // Get day usage
    const dayStart = new Date(now);
    dayStart.setHours(0, 0, 0, 0);

    const { data: dayLimit } = await supabase
      .from('ai_rate_limits')
      .select('request_count')
      .eq('user_id', userId)
      .eq('window_type', 'day')
      .eq('window_start', dayStart.toISOString())
      .single();

    const dayUsed = dayLimit?.request_count || 0;

    return {
      minute: {
        used: minuteUsed,
        limit: RATE_LIMITS.minute,
        remaining: Math.max(0, RATE_LIMITS.minute - minuteUsed),
      },
      day: {
        used: dayUsed,
        limit: RATE_LIMITS.day,
        remaining: Math.max(0, RATE_LIMITS.day - dayUsed),
      },
    };
  } catch (error) {
    console.error('Error getting rate limit status:', error);
    return {
      minute: { used: 0, limit: RATE_LIMITS.minute, remaining: RATE_LIMITS.minute },
      day: { used: 0, limit: RATE_LIMITS.day, remaining: RATE_LIMITS.day },
    };
  }
}
