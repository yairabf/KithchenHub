import type { ComponentProps } from 'react';
import { Ionicons } from '@expo/vector-icons';

export type ListIconName = ComponentProps<typeof Ionicons>['name'];

export interface CreateListModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  confirmDisabled: boolean;
  listName: string;
  onChangeListName: (value: string) => void;
  selectedIcon: ListIconName;
  onSelectIcon: (icon: ListIconName) => void;
  selectedColor: string;
  onSelectColor: (color: string) => void;
}
