/**
 * Generates a deterministic avatar image URL for a given assignee.
 *
 * Uses DiceBear Avataaars style with a seeded PRNG so the same assignee
 * name always resolves to the same avatar appearance across app sessions
 * and devices.
 *
 * @param assignee - Display name of the person to generate an avatar for.
 *   Falls back to a neutral "default" seed when undefined.
 * @returns Fully-qualified SVG avatar URL ready for use in an Image component.
 *
 * @example
 * ```tsx
 * <SafeImage uri={getAssigneeAvatarUri(chore.assignee)} style={styles.avatar} />
 * ```
 */
export function getAssigneeAvatarUri(assignee?: string): string {
  const seed = assignee ?? 'default';
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}`;
}
