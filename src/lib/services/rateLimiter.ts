import { supabase } from '../supabase';

const MAX_REQUESTS_PER_USER = 10;

interface ApiRequestLog {
  user_id: string;
  request_count: number;
  reset_date: string;
}

export async function canMakeRequest(userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('user_api_requests')
      .select('request_count, reset_date')
      .eq('user_id', userId)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 is "no rows" which is expected for new users
      throw error;
    }

    if (!data) {
      // New user, no record yet - allow the request and create a record
      return true;
    }

    // Check if reset date has passed
    const resetDate = new Date(data.reset_date);
    const now = new Date();

    if (now > resetDate) {
      // Reset has happened, user can make requests again
      return true;
    }

    // Check if user has requests remaining
    return data.request_count < MAX_REQUESTS_PER_USER;
  } catch (error) {
    console.error('Rate limiter check error:', error);
    // Fail open - allow request if there's an error checking limit
    return true;
  }
}

export async function recordRequest(userId: string): Promise<void> {
  try {
    const { data: existing, error: selectError } = await supabase
      .from('user_api_requests')
      .select('request_count, reset_date')
      .eq('user_id', userId)
      .maybeSingle();

    if (selectError && selectError.code !== 'PGRST116') {
      throw selectError;
    }

    const now = new Date();
    const resetDate = new Date(now);
    resetDate.setUTCHours(24, 0, 0, 0); // Reset at midnight UTC next day

    if (!existing) {
      // Create new record
      const { error: insertError } = await supabase
        .from('user_api_requests')
        .insert({
          user_id: userId,
          request_count: 1,
          reset_date: resetDate.toISOString(),
        });

      if (insertError) {
        throw insertError;
      }
    } else {
      const existingResetDate = new Date(existing.reset_date);

      if (now > existingResetDate) {
        // Reset period has passed, reset the counter
        const { error: updateError } = await supabase
          .from('user_api_requests')
          .update({
            request_count: 1,
            reset_date: resetDate.toISOString(),
          })
          .eq('user_id', userId);

        if (updateError) {
          throw updateError;
        }
      } else {
        // Still in the same reset period, increment counter
        const { error: updateError } = await supabase
          .from('user_api_requests')
          .update({
            request_count: existing.request_count + 1,
          })
          .eq('user_id', userId);

        if (updateError) {
          throw updateError;
        }
      }
    }
  } catch (error) {
    console.error('Failed to record API request:', error);
    // Don't throw - we don't want to fail the actual API call
  }
}

export async function getRemainingRequests(userId: string): Promise<number> {
  try {
    const { data, error } = await supabase
      .from('user_api_requests')
      .select('request_count, reset_date')
      .eq('user_id', userId)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    if (!data) {
      return MAX_REQUESTS_PER_USER;
    }

    const resetDate = new Date(data.reset_date);
    const now = new Date();

    if (now > resetDate) {
      return MAX_REQUESTS_PER_USER;
    }

    return Math.max(0, MAX_REQUESTS_PER_USER - data.request_count);
  } catch (error) {
    console.error('Rate limiter check error:', error);
    // Return 0 on error to be conservative
    return 0;
  }
}

export function getMaxRequests(): number {
  return MAX_REQUESTS_PER_USER;
}
