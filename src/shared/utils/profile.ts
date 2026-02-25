const USERNAME_PATTERN = /^[a-z]+$/

export function isValidUsername(username: string): boolean {
  return USERNAME_PATTERN.test(username)
}

export function sanitizeDisplayName(displayName: string): string {
  return displayName
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .trim()
}

export function resolveUserTitle(username: string | null, displayName: string | null): string {
  if (displayName && displayName.length > 0) {
    return displayName
  }
  if (username && username.length > 0) {
    return `@${username}`
  }
  return 'User'
}
