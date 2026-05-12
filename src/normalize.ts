/** Fold accents, strip hyphens/punctuation, and lowercase for name matching */
export function normalizeName(s: string): string {
  return s
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[-''`.]/g, ' ')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Fuzzy name match: returns true if two normalized names likely refer to the
 * same person. Handles Matt/Matthew, Will/William, Rob/Robert, etc. by checking
 * if last names match and one first name is a prefix of the other.
 */
export function fuzzyNameMatch(a: string, b: string): boolean {
  if (a === b) return true

  const partsA = a.split(' ')
  const partsB = b.split(' ')
  if (partsA.length < 2 || partsB.length < 2) return false

  const lastA = partsA[partsA.length - 1]
  const lastB = partsB[partsB.length - 1]
  if (lastA !== lastB) return false

  const firstA = partsA.slice(0, -1).join(' ')
  const firstB = partsB.slice(0, -1).join(' ')

  if (firstA.startsWith(firstB) || firstB.startsWith(firstA)) return true

  return false
}
