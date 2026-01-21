export interface HeaderActionsProps {
  /** Handler for share button press */
  onSharePress?: () => void;
  /** Handler for add button press */
  onAddPress?: () => void;
  /** Accessibility label for share button. Defaults to 'Share'. */
  shareLabel?: string;
  /** Accessibility label for add button. Defaults to 'Add new item'. */
  addLabel?: string;
  /** Hide add button (for screens with share only, like RecipeDetail). Defaults to false. */
  hideAddButton?: boolean;
}
