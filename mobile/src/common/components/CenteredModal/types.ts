export interface CenteredModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  cancelText?: string;
  confirmText?: string;
  onConfirm?: () => void;
  confirmColor?: string;
  showActions?: boolean;
  confirmDisabled?: boolean;
  confirmLoading?: boolean;
}
