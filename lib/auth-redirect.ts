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
