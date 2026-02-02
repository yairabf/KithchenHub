import React from 'react';
import { View } from 'react-native';
import { InstructionStep } from '../InstructionStep';
import { styles } from './styles';
import type { RecipeStepsProps } from './types';

/**
 * RecipeSteps component displays the preparation steps/instructions for a recipe.
 * Provides functionality to mark steps as completed.
 *
 * @param instructions - Array of instruction steps to display
 * @param completedSteps - Set of completed step IDs
 * @param onToggleStep - Callback function when a step is toggled (completed/uncompleted)
 *
 * @example
 * ```tsx
 * <RecipeSteps
 *   instructions={recipe.instructions}
 *   completedSteps={completedSteps}
 *   onToggleStep={handleToggleStep}
 * />
 * ```
 */
export function RecipeSteps({
  instructions,
  completedSteps,
  onToggleStep,
}: RecipeStepsProps) {
  const safeInstructions = instructions || [];
  
  return (
    <View style={styles.container}>
      <View style={styles.instructionsList}>
        {safeInstructions.map((step, index) => (
          <InstructionStep
            key={step.id || `step-${index}`}
            step={step}
            stepNumber={index + 1}
            isCompleted={completedSteps.has(step.id)}
            onToggle={() => onToggleStep(step.id)}
          />
        ))}
      </View>
    </View>
  );
}
