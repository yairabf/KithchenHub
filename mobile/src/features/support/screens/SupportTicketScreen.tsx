import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Linking,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { ScreenHeader } from '../../../common/components/ScreenHeader';
import { colors, spacing, borderRadius, typography, boxShadow } from '../../../theme';
import type { MainStackParamList } from '../../../navigation/types';
import { useAuth } from '../../../contexts/AuthContext';
import {
  SUPPORT_EMAIL,
  buildSupportTicketMailtoUrl,
  createEmptySupportTicketDraft,
  getSupportTicketQualityNudges,
  isSupportTicketReadyToSubmit,
  type SupportTicketDraft,
} from '../supportTicket';

const SUPPORT_DRAFT_STORAGE_KEY = 'fullhouse.supportTicketDraft.v1';
const STEPS = ['topic', 'details', 'context', 'review'] as const;
type StepKey = typeof STEPS[number];

type FieldName = keyof SupportTicketDraft;

const PLATFORM_OPTIONS = ['iOS app', 'Android app', 'Website', 'Account', 'Billing', 'Other'];
const CATEGORY_OPTIONS = ['Bug', 'Account', 'Billing', 'Recipe', 'Shopping', 'Chores', 'Feedback', 'Other'];
const FREQUENCY_OPTIONS = ['Every time', 'Often', 'Sometimes', 'Once', 'Not sure'];

export function SupportTicketScreen() {
  const { t } = useTranslation('settings');
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const { user } = useAuth();
  const [stepIndex, setStepIndex] = React.useState(0);
  const [draft, setDraft] = React.useState<SupportTicketDraft>(() =>
    createEmptySupportTicketDraft({
      platform: Platform.OS === 'ios' ? 'iOS app' : Platform.OS === 'android' ? 'Android app' : 'Website',
      contactEmail: user?.email ?? '',
      deviceContext: `${Platform.OS} ${Platform.Version}`,
    })
  );
  const [isLoaded, setIsLoaded] = React.useState(false);
  const [submitState, setSubmitState] = React.useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

  const currentStep = STEPS[stepIndex];
  const isReady = isSupportTicketReadyToSubmit(draft);
  const nudges = getSupportTicketQualityNudges(draft);

  React.useEffect(() => {
    let isMounted = true;

    AsyncStorage.getItem(SUPPORT_DRAFT_STORAGE_KEY)
      .then((value) => {
        if (!isMounted || !value) return;
        const parsed = JSON.parse(value) as Partial<SupportTicketDraft>;
        setDraft((current) => ({ ...current, ...parsed, contactEmail: parsed.contactEmail ?? current.contactEmail }));
      })
      .catch(() => {
        // Draft restore is best-effort; the form remains usable without it.
      })
      .finally(() => {
        if (isMounted) setIsLoaded(true);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  React.useEffect(() => {
    if (!isLoaded) return;
    void AsyncStorage.setItem(SUPPORT_DRAFT_STORAGE_KEY, JSON.stringify(draft));
  }, [draft, isLoaded]);

  const updateField = (field: FieldName, value: string | boolean) => {
    setSubmitState('idle');
    setDraft((current) => ({ ...current, [field]: value }));
  };

  const openEmailFallback = async () => {
    const url = buildSupportTicketMailtoUrl(draft);
    const canOpen = await Linking.canOpenURL(url);
    if (!canOpen) {
      Alert.alert(t('support.emailUnavailableTitle'), t('support.emailUnavailableMessage', { email: SUPPORT_EMAIL }));
      return;
    }
    await Linking.openURL(url);
  };

  const submitTicket = async () => {
    if (!isReady || submitState === 'submitting') return;

    setSubmitState('submitting');
    try {
      await openEmailFallback();
      await AsyncStorage.removeItem(SUPPORT_DRAFT_STORAGE_KEY);
      setSubmitState('success');
    } catch {
      setSubmitState('error');
    }
  };

  const continueLabel = currentStep === 'review' ? t('support.submitTicket') : t('support.continue');
  const canContinue = currentStep === 'topic'
    ? draft.platform.length > 0 && draft.category.length > 0
    : currentStep === 'details'
      ? draft.summary.trim().length > 0
      : currentStep === 'context'
        ? draft.contactEmail.trim().length > 0 && draft.privacyAcknowledged
        : isReady;

  const handlePrimaryAction = () => {
    if (currentStep === 'review') {
      void submitTicket();
      return;
    }
    setStepIndex((current) => Math.min(current + 1, STEPS.length - 1));
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader
        title={t('support.title')}
        subtitle={t('support.subtitle')}
        leftIcon="back"
        onLeftPress={() => navigation.goBack()}
        titleIcon="help-buoy-outline"
      />
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer} keyboardShouldPersistTaps="handled">
          <View style={styles.introCard}>
            <Text style={styles.badge}>{t('support.badge')}</Text>
            <Text style={styles.introTitle}>{t('support.introTitle')}</Text>
            <Text style={styles.introText}>{t('support.introText')}</Text>
          </View>

          <View style={styles.stepRow} accessibilityLabel={t('support.stepProgress', { current: stepIndex + 1, total: STEPS.length })}>
            {STEPS.map((step, index) => (
              <View key={step} style={[styles.stepPill, index <= stepIndex ? styles.stepPillActive : undefined]}>
                <Text style={[styles.stepText, index <= stepIndex ? styles.stepTextActive : undefined]}>
                  {t(`support.steps.${step}`)}
                </Text>
              </View>
            ))}
          </View>

          {currentStep === 'topic' ? (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>{t('support.topicTitle')}</Text>
              <OptionGroup options={PLATFORM_OPTIONS} value={draft.platform} onChange={(value) => updateField('platform', value)} />
              <Text style={styles.fieldLabel}>{t('support.categoryLabel')}</Text>
              <OptionGroup options={CATEGORY_OPTIONS} value={draft.category} onChange={(value) => updateField('category', value)} />
            </View>
          ) : null}

          {currentStep === 'details' ? (
            <View style={styles.card}>
              <SupportInput label={t('support.summaryLabel')} value={draft.summary} onChangeText={(value) => updateField('summary', value)} placeholder={t('support.summaryPlaceholder')} />
              <SupportInput label={t('support.expectedLabel')} value={draft.expectedBehavior} onChangeText={(value) => updateField('expectedBehavior', value)} multiline />
              <SupportInput label={t('support.actualLabel')} value={draft.actualBehavior} onChangeText={(value) => updateField('actualBehavior', value)} multiline />
              <Text style={styles.fieldLabel}>{t('support.frequencyLabel')}</Text>
              <OptionGroup options={FREQUENCY_OPTIONS} value={draft.frequency} onChange={(value) => updateField('frequency', value)} />
            </View>
          ) : null}

          {currentStep === 'context' ? (
            <View style={styles.card}>
              <SupportInput label={t('support.stepsLabel')} value={draft.reproductionSteps} onChangeText={(value) => updateField('reproductionSteps', value)} multiline />
              <SupportInput label={t('support.contactEmailLabel')} value={draft.contactEmail} onChangeText={(value) => updateField('contactEmail', value)} keyboardType="email-address" autoCapitalize="none" />
              <SupportInput label={t('support.deviceLabel')} value={draft.deviceContext} onChangeText={(value) => updateField('deviceContext', value)} />
              <SupportInput label={t('support.attachmentsLabel')} value={draft.attachmentNote} onChangeText={(value) => updateField('attachmentNote', value)} placeholder={t('support.attachmentsPlaceholder')} multiline />
              <View style={styles.privacyRow}>
                <Text style={styles.privacyText}>{t('support.privacyNote')}</Text>
                <Switch value={draft.privacyAcknowledged} onValueChange={(value) => updateField('privacyAcknowledged', value)} />
              </View>
            </View>
          ) : null}

          {currentStep === 'review' ? (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>{t('support.reviewTitle')}</Text>
              <ReviewLine label={t('support.summaryLabel')} value={draft.summary} />
              <ReviewLine label={t('support.platformLabel')} value={draft.platform} />
              <ReviewLine label={t('support.categoryLabel')} value={draft.category} />
              <ReviewLine label={t('support.contactEmailLabel')} value={draft.contactEmail} />
              <View style={styles.nudgeBox}>
                <Text style={styles.nudgeTitle}>{t('support.detailCheckTitle')}</Text>
                {(nudges.length > 0 ? nudges : [t('support.detailCheckGood')]).slice(0, 4).map((nudge) => (
                  <Text key={nudge} style={styles.nudgeText}>• {nudge}</Text>
                ))}
              </View>
              {submitState === 'success' ? <Text style={styles.successText}>{t('support.successMessage')}</Text> : null}
              {submitState === 'error' ? <Text style={styles.errorText}>{t('support.errorMessage')}</Text> : null}
            </View>
          ) : null}
        </ScrollView>

        <View style={styles.actionBar}>
          {stepIndex > 0 ? (
            <TouchableOpacity style={styles.secondaryButton} onPress={() => setStepIndex((current) => Math.max(current - 1, 0))}>
              <Text style={styles.secondaryButtonText}>{t('support.back')}</Text>
            </TouchableOpacity>
          ) : null}
          <TouchableOpacity
            style={[styles.primaryButton, !canContinue || submitState === 'submitting' ? styles.primaryButtonDisabled : undefined]}
            onPress={handlePrimaryAction}
            disabled={!canContinue || submitState === 'submitting'}
          >
            <Text style={styles.primaryButtonText}>{submitState === 'submitting' ? t('support.submitting') : continueLabel}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.emailButton} onPress={openEmailFallback}>
            <Ionicons name="mail-outline" size={16} color={colors.primary} />
            <Text style={styles.emailButtonText}>{t('support.emailInstead')}</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function OptionGroup({ options, value, onChange }: { options: string[]; value: string; onChange: (value: string) => void }) {
  return (
    <View style={styles.optionGrid}>
      {options.map((option) => {
        const selected = option === value;
        return (
          <TouchableOpacity key={option} style={[styles.optionChip, selected ? styles.optionChipSelected : undefined]} onPress={() => onChange(option)} accessibilityRole="radio" accessibilityState={{ selected }}>
            <Text style={[styles.optionText, selected ? styles.optionTextSelected : undefined]}>{option}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function SupportInput({ label, ...props }: { label: string } & React.ComponentProps<typeof TextInput>) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        {...props}
        style={[styles.input, props.multiline ? styles.multilineInput : undefined]}
        placeholderTextColor={colors.textMuted}
        textAlignVertical={props.multiline ? 'top' : 'center'}
      />
    </View>
  );
}

function ReviewLine({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.reviewLine}>
      <Text style={styles.reviewLabel}>{label}</Text>
      <Text style={styles.reviewValue}>{value || 'Not provided'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  keyboardContainer: { flex: 1 },
  content: { flex: 1 },
  contentContainer: { padding: spacing.md, paddingBottom: 180 },
  introCard: { backgroundColor: colors.primary, borderRadius: borderRadius.xl, padding: spacing.lg, marginBottom: spacing.md },
  badge: { ...typography.tiny, color: colors.textLight, fontWeight: '800', textTransform: 'uppercase', marginBottom: spacing.sm },
  introTitle: { ...typography.h3, color: colors.textLight, marginBottom: spacing.sm },
  introText: { ...typography.body, color: colors.textLight, lineHeight: 22 },
  stepRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginBottom: spacing.md },
  stepPill: { paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: borderRadius.full, backgroundColor: colors.widgetBackground },
  stepPillActive: { backgroundColor: colors.primary },
  stepText: { ...typography.tiny, color: colors.textSecondary, fontWeight: '700' },
  stepTextActive: { color: colors.textLight },
  card: { backgroundColor: colors.surface, borderRadius: borderRadius.xl, padding: spacing.md, marginBottom: spacing.md, ...boxShadow(1, 4, 'rgba(0, 0, 0, 0.05)') },
  cardTitle: { ...typography.h4, color: colors.textPrimary, marginBottom: spacing.md },
  optionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  optionChip: { minHeight: 44, justifyContent: 'center', paddingHorizontal: spacing.md, borderRadius: borderRadius.full, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  optionChipSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  optionText: { ...typography.bodySmall, color: colors.textPrimary, fontWeight: '700' },
  optionTextSelected: { color: colors.textLight },
  fieldGroup: { marginBottom: spacing.md },
  fieldLabel: { ...typography.bodySmall, color: colors.textPrimary, fontWeight: '800', marginBottom: spacing.xs },
  input: { minHeight: 48, borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.lg, paddingHorizontal: spacing.md, color: colors.textPrimary, backgroundColor: colors.background },
  multilineInput: { minHeight: 96, paddingTop: spacing.md },
  privacyRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md, padding: spacing.md, borderRadius: borderRadius.lg, backgroundColor: colors.background },
  privacyText: { ...typography.bodySmall, color: colors.textSecondary, flex: 1, lineHeight: 20 },
  nudgeBox: { backgroundColor: colors.pastel.yellow, borderRadius: borderRadius.lg, padding: spacing.md, marginTop: spacing.md },
  nudgeTitle: { ...typography.body, color: colors.textPrimary, fontWeight: '800', marginBottom: spacing.xs },
  nudgeText: { ...typography.bodySmall, color: colors.textSecondary, marginTop: spacing.xs },
  reviewLine: { marginBottom: spacing.sm },
  reviewLabel: { ...typography.tiny, color: colors.textSecondary, fontWeight: '800', textTransform: 'uppercase' },
  reviewValue: { ...typography.body, color: colors.textPrimary, marginTop: spacing.xs },
  successText: { ...typography.body, color: colors.success, fontWeight: '800', marginTop: spacing.md },
  errorText: { ...typography.body, color: colors.error, fontWeight: '800', marginTop: spacing.md },
  actionBar: { position: 'absolute', left: 0, right: 0, bottom: 0, padding: spacing.md, paddingBottom: spacing.lg, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.divider, gap: spacing.sm },
  primaryButton: { minHeight: 52, borderRadius: borderRadius.full, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  primaryButtonDisabled: { backgroundColor: colors.buttonInactive },
  primaryButtonText: { ...typography.button, color: colors.textLight },
  secondaryButton: { minHeight: 44, borderRadius: borderRadius.full, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
  secondaryButtonText: { ...typography.button, color: colors.primary },
  emailButton: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs },
  emailButtonText: { ...typography.bodySmall, color: colors.primary, fontWeight: '800' },
});
