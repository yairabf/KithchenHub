import React from 'react';
import { View, Text, TouchableOpacity, I18nManager } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from './styles';
import type { InstructionStepProps } from './types';
import { useTranslation } from 'react-i18next';

export function InstructionStep({
  step,
  stepNumber,
  isCompleted,
  onToggle,
}: InstructionStepProps) {
  const { t, i18n } = useTranslation('recipes');
  const isRtlLayout = i18n.dir() === 'rtl' || I18nManager.isRTL;

  const stepNumberNode = (
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
  );

  const contentNode = (
    <View style={styles.content}>
      <Text
        style={[styles.stepText, isRtlLayout && styles.stepTextRtl, isCompleted && styles.stepTextCompleted]}
      >
        {step.instruction}
      </Text>
      {!isCompleted && (
        <Text style={[styles.markAsFinished, isRtlLayout && styles.markAsFinishedRtl]}>{t('detail.markAsFinished')}</Text>
      )}
    </View>
  );

  const checkNode = (
    <View style={styles.checkContainer}>
      {isCompleted ? (
        <View style={[styles.checkbox, styles.checkboxCompleted]}>
          <Ionicons name="checkmark" size={16} color="white" />
        </View>
      ) : (
        <View style={styles.checkbox} />
      )}
    </View>
  );

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
      {isRtlLayout ? (
        <>
          {checkNode}
          {contentNode}
          {stepNumberNode}
        </>
      ) : (
        <>
          {stepNumberNode}
          {contentNode}
          {checkNode}
        </>
      )}
    </TouchableOpacity>
  );
}
