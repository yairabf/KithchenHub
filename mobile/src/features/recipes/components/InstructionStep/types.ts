import type { Instruction } from '../../../../mocks/recipes';

export interface InstructionStepProps {
  step: Instruction;
  stepNumber: number;
  isCompleted: boolean;
  onToggle: () => void;
}
