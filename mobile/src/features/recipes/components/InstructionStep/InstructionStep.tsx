import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from './styles';
import type { InstructionStepProps } from './types';

export function InstructionStep({
  step,
  stepNumber,
  isCompleted,
  onToggle,
}: InstructionStepProps) {
  return (
    <TouchableOpacity
      style={[
        styles.card,
        !isCompleted && styles.cardActive,
        isCompleted && styles.cardCompleted,
      ]}
      onPress={onToggle}
      activeOpacity={0.7}
    >
      <View
        style={[
          styles.stepNumberContainer,
          !isCompleted && styles.stepNumberContainerActive,
          isCompleted && styles.stepNumberContainerCompleted,
        ]}
      >
        <Text
          style={[
            styles.stepNumber,
            !isCompleted && styles.stepNumberActive,
            isCompleted && styles.stepNumberCompleted,
          ]}
        >
          {stepNumber}
        </Text>
      </View>

      <View style={styles.content}>
        <Text
          style={[styles.stepText, isCompleted && styles.stepTextCompleted]}
        >
          {step.text}
        </Text>
        {!isCompleted && (
          <Text style={styles.markAsFinished}>Mark as finished</Text>
        )}
      </View>

      <View style={styles.checkContainer}>
        {isCompleted ? (
          <View style={[styles.checkbox, styles.checkboxCompleted]}>
            <Ionicons name="checkmark" size={16} color="white" />
          </View>
        ) : (
          <View style={styles.checkbox} />
        )}
      </View>
    </TouchableOpacity>
  );
}
