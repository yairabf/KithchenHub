import { Share, Linking } from 'react-native';
import * as Clipboard from 'expo-clipboard';

export type ShareLocalize = (
  key: string,
  options?: Record<string, string | number | undefined>
) => string;

// ============================================================================
// Constants
// ============================================================================

export const SHARE_STRINGS = {
  DIVIDER: '────────────────────',
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
// Text Formatters
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
  cookTime?: string | number;
  prepTime?: string | number;
  servings?: number;
  ingredients: RecipeIngredient[];
  instructions: RecipeInstruction[];
}

function getDefaultLocalizer(): ShareLocalize {
  return (key, options) => {
    switch (key) {
      case 'shopping:share.shoppingListHeader':
        return `Shopping List: ${options?.listName ?? ''}`;
      case 'shopping:share.emptyShopping':
        return SHARE_STRINGS.EMPTY_SHOPPING;
      case 'shopping:share.categoryHeader':
        return `${options?.category ?? ''}:`;
      case 'chores:share.header':
        return 'Home Chores';
      case 'chores:share.empty':
        return SHARE_STRINGS.EMPTY_CHORES;
      case 'chores:share.todaySection':
        return "Today's Chores:";
      case 'chores:share.upcomingSection':
        return 'Upcoming Chores:';
      case 'recipes:share.notAvailable':
        return 'Recipe not available';
      case 'recipes:share.untitledRecipe':
        return 'Untitled Recipe';
      case 'recipes:share.header':
        return `Recipe: ${options?.name ?? ''}`;
      case 'recipes:share.cookTime':
        return 'Cook Time';
      case 'recipes:share.prepTime':
        return 'Prep Time';
      case 'recipes:share.servings':
        return 'Servings';
      case 'recipes:share.ingredients':
        return 'Ingredients';
      case 'recipes:share.instructions':
        return 'Instructions';
      case 'recipes:share.notAvailableValue':
        return 'N/A';
      case 'recipes:share.emptyIngredients':
        return SHARE_STRINGS.EMPTY_RECIPE_INGREDIENTS;
      case 'common:share.footer':
        return 'Shared from Kitchen Hub';
      default:
        return '';
    }
  };
}

/**
 * Format shopping list items into shareable text
 */
export function formatShoppingListText(
  listName: string,
  items: ShoppingItem[],
  t?: ShareLocalize,
): string {
  const localize = t ?? getDefaultLocalizer();
  const header = localize('shopping:share.shoppingListHeader', { listName });

  if (items.length === 0) {
    return `${header}\n\n${localize('shopping:share.emptyShopping')}\n\n${localize('common:share.footer')}`;
  }

  const itemsByCategory = items.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, ShoppingItem[]>);

  const itemLines: string[] = [];
  Object.entries(itemsByCategory).forEach(([category, categoryItems]) => {
    const categoryKey = category.trim().toLowerCase();
    const translatedCategory = localize(`categories:${categoryKey}`, { defaultValue: category }) || category;

    itemLines.push(`\n${localize('shopping:share.categoryHeader', { category: translatedCategory })}`);
    categoryItems.forEach(item => {
      itemLines.push(`  • ${item.name} (${Math.ceil(item.quantity)})`);
    });
  });

  return `${header}\n${SHARE_STRINGS.DIVIDER}${itemLines.join('\n')}\n\n${localize('common:share.footer')}`;
}

/**
 * Format chores into shareable text
 */
export function formatChoresText(
  todayChores: Chore[],
  upcomingChores: Chore[],
  t?: ShareLocalize,
): string {
  const localize = t ?? getDefaultLocalizer();
  const header = localize('chores:share.header');

  if (todayChores.length === 0 && upcomingChores.length === 0) {
    return `${header}\n\n${localize('chores:share.empty')}\n\n${localize('common:share.footer')}`;
  }

  const lines: string[] = [];

  if (todayChores.length > 0) {
    lines.push(`\n${localize('chores:share.todaySection')}`);
    todayChores.forEach(chore => {
      const status = chore.isCompleted ? '✓' : '○';
      const assignee = chore.assignee ? ` (${chore.assignee})` : '';
      lines.push(`  ${status} ${chore.icon || '📋'} ${chore.title}${assignee}`);
    });
  }

  if (upcomingChores.length > 0) {
    lines.push(`\n${localize('chores:share.upcomingSection')}`);
    upcomingChores.forEach(chore => {
      const status = chore.isCompleted ? '✓' : '○';
      const assignee = chore.assignee ? ` (${chore.assignee})` : '';
      lines.push(`  ${status} ${chore.icon || '📋'} ${chore.title} - ${chore.dueDate}${assignee}`);
    });
  }

  return `${header}\n${SHARE_STRINGS.DIVIDER}${lines.join('\n')}\n\n${localize('common:share.footer')}`;
}

/**
 * Format recipe into shareable text
 */
export function formatRecipeText(recipe: Recipe, t?: ShareLocalize): string {
  const localize = t ?? getDefaultLocalizer();

  if (!recipe) {
    return localize('recipes:share.notAvailable');
  }

  const recipeName = recipe.title || recipe.name || localize('recipes:share.untitledRecipe');
  const header = localize('recipes:share.header', { name: recipeName });
  const lines: string[] = [];

  if (recipe.description) {
    lines.push(`\n${recipe.description}`);
  }

  const cookTime = recipe.cookTime || localize('recipes:share.notAvailableValue');
  lines.push(`\n${localize('recipes:share.cookTime')}: ${cookTime}`);
  if (recipe.prepTime) {
    lines.push(`${localize('recipes:share.prepTime')}: ${recipe.prepTime}`);
  }
  if (recipe.servings) {
    lines.push(`${localize('recipes:share.servings')}: ${recipe.servings}`);
  }

  lines.push(`\n${localize('recipes:share.ingredients')}:`);
  const ingredients = recipe.ingredients || [];
  if (ingredients.length === 0) {
    lines.push(`  ${localize('recipes:share.emptyIngredients')}`);
  } else {
    ingredients.forEach(ing => {
      const quantity = ing.quantityAmount ?? ing.quantity ?? '';
      const unit = ing.quantityUnit ?? ing.unit ?? '';
      const name = ing.name || '';
      lines.push(`  • ${quantity} ${unit} ${name}`.trim());
    });
  }

  lines.push(`\n${localize('recipes:share.instructions')}:`);
  const instructions = recipe.instructions || [];
  if (instructions.length === 0) {
    lines.push(`  ${localize('recipes:share.emptyIngredients')}`);
  } else {
    instructions.forEach((step, index) => {
      const instruction = step?.instruction || step?.text || '';
      lines.push(`  ${index + 1}. ${instruction}`);
    });
  }

  return `${header}\n${SHARE_STRINGS.DIVIDER}${lines.join('\n')}\n\n${localize('common:share.footer')}`;
}

// ============================================================================
// Share Functions
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
