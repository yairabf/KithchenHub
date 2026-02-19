import { Share, Linking } from 'react-native';
import * as Clipboard from 'expo-clipboard';

// ============================================================================
// Constants (Issue 5: Extract hardcoded strings)
// ============================================================================

export const SHARE_STRINGS = {
  FOOTER: '\nShared from Kitchen Hub',
  DIVIDER: '────────────────────',
  COPIED_FEEDBACK: 'Copied to clipboard!',
  SHARE_FAILED: 'Could not share. Please try another option.',
  EMPTY_CHORES: 'No chores to share!',
  EMPTY_SHOPPING: 'No items yet.',
  EMPTY_RECIPE_INGREDIENTS: 'No ingredients listed.',
} as const;

// ============================================================================
// Share Target Types & Options
// ============================================================================

export type ShareTarget = 'whatsapp' | 'telegram' | 'web' | 'clipboard';

export interface ShareOption {
  id: ShareTarget;
  label: string;
  iconName: string;
  color: string;
}

export const SHARE_OPTIONS: ShareOption[] = [
  {
    id: 'whatsapp',
    label: 'WhatsApp',
    iconName: 'logo-whatsapp',
    color: '#25D366',
  },
  {
    id: 'telegram',
    label: 'Telegram',
    iconName: 'paper-plane',
    color: '#0088cc',
  },
  {
    id: 'web',
    label: 'Share...',
    iconName: 'share-social-outline',
    color: '#606c38',
  },
  {
    id: 'clipboard',
    label: 'Copy',
    iconName: 'copy-outline',
    color: '#6B7280',
  },
];

// ============================================================================
// Text Formatters (Issue 2: Extract formatters to utilities)
// ============================================================================

interface ShoppingItem {
  name: string;
  quantity: number;
  category: string;
}

interface Chore {
  title: string;
  isCompleted: boolean;
  icon?: string;
  assignee?: string;
  dueDate: string;
}

interface RecipeIngredient {
  name: string;
  quantityAmount?: number | string;
  quantityUnit?: string;
  quantity?: number | string;
  unit?: string;
}

interface RecipeInstruction {
  text?: string;
  instruction?: string;
}

interface Recipe {
  title?: string;
  name?: string;
  description?: string;
  prepTime?: string | number;
  servings?: number;
  ingredients: RecipeIngredient[];
  instructions: RecipeInstruction[];
}

/**
 * Format shopping list items into shareable text
 */
export function formatShoppingListText(
  listName: string,
  items: ShoppingItem[]
): string {
  const header = `Shopping List: ${listName}`;

  // Issue 4: Handle empty state
  if (items.length === 0) {
    return `${header}\n\n${SHARE_STRINGS.EMPTY_SHOPPING}${SHARE_STRINGS.FOOTER}`;
  }

  // Group items by category
  const itemsByCategory = items.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, ShoppingItem[]>);

  const itemLines: string[] = [];
  Object.entries(itemsByCategory).forEach(([category, categoryItems]) => {
    itemLines.push(`\n${category}:`);
    categoryItems.forEach(item => {
      // Use ceil to match "General Count" display strategy
      itemLines.push(`  • ${item.name} (${Math.ceil(item.quantity)})`);
    });
  });

  return `${header}\n${SHARE_STRINGS.DIVIDER}${itemLines.join('\n')}${SHARE_STRINGS.FOOTER}`;
}

/**
 * Format chores into shareable text
 */
export function formatChoresText(
  todayChores: Chore[],
  upcomingChores: Chore[]
): string {
  const header = 'Home Chores';

  // Issue 4: Handle empty state
  if (todayChores.length === 0 && upcomingChores.length === 0) {
    return `${header}\n\n${SHARE_STRINGS.EMPTY_CHORES}${SHARE_STRINGS.FOOTER}`;
  }

  const lines: string[] = [];

  if (todayChores.length > 0) {
    lines.push("\nToday's Chores:");
    todayChores.forEach(chore => {
      const status = chore.isCompleted ? '✓' : '○';
      const assignee = chore.assignee ? ` (${chore.assignee})` : '';
      lines.push(`  ${status} ${chore.icon || '📋'} ${chore.title}${assignee}`);
    });
  }

  if (upcomingChores.length > 0) {
    lines.push('\nUpcoming Chores:');
    upcomingChores.forEach(chore => {
      const status = chore.isCompleted ? '✓' : '○';
      const assignee = chore.assignee ? ` (${chore.assignee})` : '';
      lines.push(`  ${status} ${chore.icon || '📋'} ${chore.title} - ${chore.dueDate}${assignee}`);
    });
  }

  return `${header}\n${SHARE_STRINGS.DIVIDER}${lines.join('\n')}${SHARE_STRINGS.FOOTER}`;
}

/**
 * Format recipe into shareable text
 */
export function formatRecipeText(recipe: Recipe): string {
  // Defensive check: ensure recipe has required fields
  if (!recipe) {
    return 'Recipe not available';
  }

  const recipeName = recipe.title || recipe.name || 'Untitled Recipe';
  const header = `Recipe: ${recipeName}`;
  const lines: string[] = [];

  if (recipe.description) {
    lines.push(`\n${recipe.description}`);
  }

  const prepTime = recipe.prepTime || 'N/A';
  lines.push(`\nPrep Time: ${prepTime}`);
  if (recipe.servings) {
    lines.push(`Servings: ${recipe.servings}`);
  }

  lines.push('\nIngredients:');
  const ingredients = recipe.ingredients || [];
  if (ingredients.length === 0) {
    lines.push(`  ${SHARE_STRINGS.EMPTY_RECIPE_INGREDIENTS}`);
  } else {
    ingredients.forEach(ing => {
      const quantity = ing.quantityAmount ?? ing.quantity ?? '';
      const unit = ing.quantityUnit ?? ing.unit ?? '';
      const name = ing.name || '';
      lines.push(`  • ${quantity} ${unit} ${name}`.trim());
    });
  }

  lines.push('\nInstructions:');
  const instructions = recipe.instructions || [];
  if (instructions.length === 0) {
    lines.push(`  ${SHARE_STRINGS.EMPTY_RECIPE_INGREDIENTS}`); // Reuse empty string constant
  } else {
    instructions.forEach((step, index) => {
      const instruction = step?.instruction || step?.text || '';
      lines.push(`  ${index + 1}. ${instruction}`);
    });
  }

  return `${header}\n${SHARE_STRINGS.DIVIDER}${lines.join('\n')}${SHARE_STRINGS.FOOTER}`;
}

// ============================================================================
// Share Functions (Issue 6: Add error logging)
// ============================================================================

/**
 * Share to WhatsApp using deep link
 */
export async function shareToWhatsApp(text: string): Promise<boolean> {
  const encoded = encodeURIComponent(text);
  const url = `whatsapp://send?text=${encoded}`;

  try {
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
      return true;
    }

    // Fallback to web WhatsApp
    const webUrl = `https://wa.me/?text=${encoded}`;
    await Linking.openURL(webUrl);
    return true;
  } catch (error) {
    console.warn('[shareUtils] WhatsApp share failed:', error);
    return false;
  }
}

/**
 * Share to Telegram using deep link
 */
export async function shareToTelegram(text: string): Promise<boolean> {
  const encoded = encodeURIComponent(text);
  const url = `tg://msg?text=${encoded}`;

  try {
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
      return true;
    }

    // Fallback to web Telegram
    const webUrl = `https://t.me/share/url?text=${encoded}`;
    await Linking.openURL(webUrl);
    return true;
  } catch (error) {
    console.warn('[shareUtils] Telegram share failed:', error);
    return false;
  }
}

/**
 * Share using Web Share API (React Native Share)
 */
export async function shareViaWebShare(
  title: string,
  text: string
): Promise<boolean> {
  try {
    const result = await Share.share({
      message: text,
      title: title,
    });

    return result.action === Share.sharedAction;
  } catch (error) {
    console.warn('[shareUtils] Web share failed:', error);
    return false;
  }
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await Clipboard.setStringAsync(text);
    return true;
  } catch (error) {
    console.warn('[shareUtils] Clipboard copy failed:', error);
    return false;
  }
}

/**
 * Execute share action based on target
 */
export async function executeShare(
  target: ShareTarget,
  title: string,
  text: string
): Promise<boolean> {
  switch (target) {
    case 'whatsapp':
      return shareToWhatsApp(text);
    case 'telegram':
      return shareToTelegram(text);
    case 'web':
      return shareViaWebShare(title, text);
    case 'clipboard':
      return copyToClipboard(text);
    default:
      return false;
  }
}
