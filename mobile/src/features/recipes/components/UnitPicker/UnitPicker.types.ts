import type { UnitType } from '../../constants';

export interface UnitPickerProps {
  visible: boolean;
  onClose: () => void;
  selectedUnit: string;
  onSelectUnit: (code: string) => void;
  initialFilter?: UnitType;
}
