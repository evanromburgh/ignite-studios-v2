/**
 * Abbreviated initials from a display name (e.g. "Evan van Romburgh" → "EVR").
 * Extra whitespace is ignored; optional max length trims long names.
 */
export function initialsFromName(name: string, maxChars?: number): string {
  const raw = name
    .split(/\s+/)
    .filter(Boolean)
    .map(part => part[0])
    .join('')
    .toUpperCase()
  if (maxChars !== undefined && maxChars > 0) {
    return raw.slice(0, maxChars)
  }
  return raw
}
