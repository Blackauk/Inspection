import type { User } from '../contexts/AuthContext';

/**
 * Gets the display name for a user with fallback order:
 * displayName -> fullName (firstName + lastName) -> email prefix -> "User"
 */
export function getDisplayName(user: User | null | undefined): string {
  if (!user) return 'User';
  
  if (user.displayName) return user.displayName;
  
  const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
  if (fullName) return fullName;
  
  if (user.email) {
    const emailPrefix = user.email.split('@')[0];
    return emailPrefix || 'User';
  }
  
  return 'User';
}

/**
 * Gets initials from a display name string.
 * Rules:
 * - Single word: first letter (e.g., "Jonesy" => "J")
 * - Multiple words: first letter of first word + first letter of last word (e.g., "Matthew Jones" => "MJ")
 */
export function getInitialsFromDisplayName(displayName: string): string {
  if (!displayName || !displayName.trim()) return '';
  
  const words = displayName.trim().split(/\s+/);
  if (words.length === 1) {
    return words[0][0]?.toUpperCase() || '';
  }
  
  return `${words[0][0]?.toUpperCase() || ''}${words[words.length - 1][0]?.toUpperCase() || ''}`;
}

/**
 * Gets initials for a user.
 * Uses displayName if available, otherwise falls back to firstName + lastName.
 */
export function getUserInitials(user: User | null | undefined): string {
  if (!user) return 'U';
  
  if (user.displayName) {
    const initials = getInitialsFromDisplayName(user.displayName);
    if (initials) return initials;
  }
  
  // Fallback to firstName + lastName
  const firstInitial = user.firstName?.[0]?.toUpperCase() || '';
  const lastInitial = user.lastName?.[0]?.toUpperCase() || '';
  return firstInitial + lastInitial || 'U';
}



