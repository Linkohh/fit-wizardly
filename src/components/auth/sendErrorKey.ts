/**
 * Maps a Supabase error from sending the sign-in email to one of our own
 * translated messages, so people never see Supabase's English text (DEBT-085).
 */

export type SendErrorKey =
  | 'auth.send_error_rate_limit'
  | 'auth.send_error_invalid_email'
  | 'auth.send_error_offline'
  | 'auth.send_error_generic';

function readField(error: Error, field: 'code' | 'status'): unknown {
  return field in error ? Reflect.get(error, field) : undefined;
}

export function sendErrorKey(error: Error): SendErrorKey {
  const code = readField(error, 'code');
  const status = readField(error, 'status');

  if (code === 'over_email_send_rate_limit' || code === 'over_request_rate_limit' || status === 429) {
    return 'auth.send_error_rate_limit';
  }

  if (code === 'email_address_invalid' || code === 'email_address_not_authorized' || code === 'validation_failed') {
    return 'auth.send_error_invalid_email';
  }

  const offline = typeof navigator !== 'undefined' && navigator.onLine === false;
  if (offline || error.name === 'AuthRetryableFetchError' || status === 0) {
    return 'auth.send_error_offline';
  }

  return 'auth.send_error_generic';
}
