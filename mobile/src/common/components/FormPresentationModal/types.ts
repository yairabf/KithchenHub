import type { ReactNode } from 'react';

export type FormPresentationMode = 'fullScreen' | 'sheet';

export interface FormPresentationModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit?: () => void;
  title: string;
  children: ReactNode;
  cancelText?: string;
  submitText?: string;
  submitDisabled?: boolean;
  submitLoading?: boolean;
  submitColor?: string;
  presentation?: FormPresentationMode;
  showFooter?: boolean;
}
