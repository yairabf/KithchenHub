import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { CenteredModal } from '../CenteredModal';
import { executeShare, SHARE_OPTIONS, type ShareTarget } from '../../utils/shareUtils';
import { styles } from './styles';
import { useTranslation } from 'react-i18next';
import type { ShareModalProps } from './types';

type IoniconsName = ComponentProps<typeof Ionicons>['name'];

export function ShareModal({ visible, onClose, title, shareText }: ShareModalProps) {
  const { t } = useTranslation('common');
  const [feedback, setFeedback] = useState<string | null>(null);

  const previewText = useMemo(() => {
    const lines = shareText.split('\n');
    if (lines.length > 6) {
      return lines.slice(0, 6).join('\n') + '\n...';
    }
    return shareText;
  }, [shareText]);

  const handleShare = async (target: ShareTarget) => {
    const success = await executeShare(target, title, shareText);

    if (target === 'clipboard' && success) {
      setFeedback(t('share.feedback.copied'));
      setTimeout(() => setFeedback(null), 2000);
    } else if (!success && target !== 'clipboard') {
      setFeedback(t('share.feedback.failed'));
      setTimeout(() => setFeedback(null), 2000);
    }
  };

  const handleClose = () => {
    setFeedback(null);
    onClose();
  };

  return (
    <CenteredModal
      visible={visible}
      onClose={handleClose}
      title={title}
      showActions={false}
    >
      <View style={styles.container}>
        <View style={styles.optionsGrid}>
          {SHARE_OPTIONS.map(option => (
            <TouchableOpacity
              key={option.id}
              style={styles.optionButton}
              onPress={() => handleShare(option.id)}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={t('share.optionAccessibility', { option: t(`share.options.${option.id}`) })}
            >
              <View
                style={[
                  styles.optionIconWrapper,
                  { backgroundColor: option.color + '20' },
                ]}
              >
                <Ionicons
                  name={option.iconName as IoniconsName}
                  size={28}
                  color={option.color}
                />
              </View>
              <Text style={styles.optionLabel}>{t(`share.options.${option.id}`)}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {feedback && <Text style={styles.feedbackText}>{feedback}</Text>}

        <View style={styles.previewSection}>
          <Text style={styles.previewLabel}>{t('share.previewLabel')}</Text>
          <ScrollView style={styles.previewBox} nestedScrollEnabled>
            <Text style={styles.previewText}>{previewText}</Text>
          </ScrollView>
        </View>
      </View>
    </CenteredModal>
  );
}
