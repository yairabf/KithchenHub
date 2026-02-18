export type EntityFormModalMode = 'add' | 'edit';

export interface EntityFormModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: () => void;
  /**
   * Translated title string for the modal header.
   * The caller is responsible for providing a localised string,
   * e.g. t('chores.modal.addTitle') or t('chores.modal.editTitle').
   */
  title: string;
  /**
   * Translated label for the primary action button.
   * Defaults to a generic confirm label if not provided.
   */
  submitText?: string;
  children: React.ReactNode;
  submitColor?: string;
  submitDisabled?: boolean;
  submitLoading?: boolean;
  cancelText?: string;
}
