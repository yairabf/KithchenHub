export interface ConfirmationModalProps {
  visible: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmColor?: string;
  confirmLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}
