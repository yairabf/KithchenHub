export interface ShoppingQuickActionModalProps {
  visible: boolean;
  onClose: () => void;
  buttonPosition?: { x: number; y: number; width: number; height: number };
}
