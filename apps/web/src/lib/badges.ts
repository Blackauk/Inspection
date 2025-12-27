/**
 * Badge utility functions for consistent UI styling
 */

/**
 * Get badge variant based on numeric count
 * 0 → "default" (neutral)
 * 1-2 → "warning"
 * 3+ → "error" (critical)
 */
export function getCountBadgeVariant(count: number | null | undefined): 'default' | 'warning' | 'error' {
  const numCount = Number(count ?? 0);
  
  if (numCount === 0) {
    return 'default';
  } else if (numCount <= 2) {
    return 'warning';
  } else {
    return 'error';
  }
}
