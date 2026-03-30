export interface ConfirmationModalProps {
  visible: boolean;
  title: string;
  message: string;
  /** Optional error message shown below the modal body text (e.g. on delete failure). */
  errorMessage?: string;
  confirmText?: string;
  cancelText?: string;
  confirmColor?: string;
  confirmLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}
