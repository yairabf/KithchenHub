import type { Instruction } from '../../../../mocks/recipes';

export interface RecipeStepsProps {
  instructions: Instruction[];
  completedSteps: Set<string>;
  onToggleStep: (stepId: string) => void;
}
