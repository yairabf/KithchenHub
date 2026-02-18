import React from 'react';
import { CenteredModal } from '../CenteredModal';
import { colors } from '../../../theme';
import type { EntityFormModalProps } from './types';

/**
 * Generic modal wrapper for add/edit entity forms.
 *
 * The caller is responsible for passing translated `title` and `submitText`
 * strings. This component is intentionally i18n-agnostic so it can be reused
 * across any feature without coupling to a specific translation namespace.
 *
 * @example
 * ```tsx
 * <EntityFormModal
 *   title={mode === 'add' ? t('chores.addTitle') : t('chores.editTitle')}
 *   submitText={mode === 'add' ? t('common.add') : t('common.save')}
 *   ...
 * >
 *   <ChoreFormFields />
 * </EntityFormModal>
 * ```
 */
export function EntityFormModal({
  visible,
  onClose,
  onSubmit,
  title,
  submitText = 'Save',
  children,
  submitColor = colors.primary,
  submitDisabled = false,
  submitLoading = false,
  cancelText = 'Cancel',
}: EntityFormModalProps) {
  return (
    <CenteredModal
      visible={visible}
      onClose={onClose}
      title={title}
      confirmText={submitText}
      cancelText={cancelText}
      onConfirm={onSubmit}
      confirmColor={submitColor}
      confirmDisabled={submitDisabled}
      confirmLoading={submitLoading}
    >
      {children}
    </CenteredModal>
  );
}
