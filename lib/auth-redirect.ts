export const PKCE_MISMATCH_FRIENDLY_MESSAGE =
  'Sign-in was started on a different address. Please try again from this page.'

/**
 * Validates that `next` is a safe same-origin relative path.
 * Rejects absolute URLs, protocol-relative URLs (`//evil.com`), and backslash paths (`/\evil.com`).
 */
export function sanitizeNextPath(next: string | null | undefined): string {
  if (!next || typeof next !== 'string') return '/dashboard'
  const trimmed = next.trim()
  if (
    !trimmed.startsWith('/') ||
    trimmed.startsWith('//') ||
    trimmed.startsWith('/\\') ||
    trimmed.includes('://')
  ) {
    return '/dashboard'
  }
  return trimmed
}

/**
 * Maps raw Supabase exchangeCodeForSession errors (such as missing PKCE code verifier)
 * to a clear user-facing message.
 */
export function formatAuthCallbackError(rawMessage: string | null | undefined): string {
  if (!rawMessage) return 'Authentication failed'
  if (/code[_\s-]?verifier/i.test(rawMessage) || /pkce/i.test(rawMessage)) {
    return PKCE_MISMATCH_FRIENDLY_MESSAGE
  }
  return rawMessage
}
