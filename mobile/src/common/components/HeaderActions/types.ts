export interface HeaderActionsProps {
  /** Handler for edit button press */
  onEditPress?: () => void;
  /** Handler for share button press */
  onSharePress?: () => void;
  /** Handler for add button press */
  onAddPress?: () => void;
  /** Accessibility label for edit button. Defaults to 'Edit'. */
  editLabel?: string;
  /** Accessibility label for share button. Defaults to 'Share'. */
  shareLabel?: string;
  /** Accessibility label for add button. Defaults to 'Add new item'. */
  addLabel?: string;
  /** Hide add button (for screens with share only, like RecipeDetail). Defaults to false. */
  hideAddButton?: boolean;
}
