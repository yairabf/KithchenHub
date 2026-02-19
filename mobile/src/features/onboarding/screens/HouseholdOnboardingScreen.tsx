import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    TouchableWithoutFeedback,
    Keyboard,
    SafeAreaView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { colors, spacing, borderRadius } from '../../../theme';
import { typography } from '../../../theme/typography';
import { boxShadow } from '../../../theme/shadows';
import { householdService } from '../../../services/householdService';
import { useAuth } from '../../../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { Toast } from '../../../common/components/Toast';

export function HouseholdOnboardingScreen() {
    const { t } = useTranslation('auth');
    const { user, refreshUser } = useAuth();
    const [mode, setMode] = useState<'create' | 'join'>('create');
    const [name, setName] = useState('');
    const [inviteCode, setInviteCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [toastVisible, setToastVisible] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [toastType, setToastType] = useState<'error' | 'success' | 'info'>('error');

    const showToast = (message: string, type: 'error' | 'success' | 'info' = 'error') => {
        setToastMessage(message);
        setToastType(type);
        setToastVisible(true);
    };

    const handleCreate = async () => {
        if (!name.trim()) {
            showToast(t('onboarding.errors.enterHouseholdName'));
            return;
        }

        try {
            setLoading(true);
            await householdService.createHousehold(name.trim());
            // Refresh auth context to pick up the new householdId
            if (refreshUser) {
                await refreshUser();
            }
        } catch (error: any) {
            console.error('Create household error:', error);
            showToast(error.message || t('onboarding.errors.createFailed'));
        } finally {
            setLoading(false);
        }
    };

    const handleJoin = async () => {
        if (!inviteCode.trim()) {
            showToast(t('onboarding.errors.enterInviteCode'));
            return;
        }

        try {
            setLoading(true);
            await householdService.joinHousehold(inviteCode.trim());
            // Refresh auth context to pick up the new householdId
            if (refreshUser) {
                await refreshUser();
            }
        } catch (error: any) {
            console.error('Join household error:', error);
            showToast(error.message || t('onboarding.errors.joinFailed'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.container}
            >
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                    <View style={styles.content}>
                        <View style={styles.header}>
                            <Text style={styles.title}>{t('onboarding.title')}</Text>
                            <Text style={styles.subtitle}>
                                {t('onboarding.subtitle')}
                            </Text>
                        </View>

                        <View style={styles.tabContainer}>
                            <TouchableOpacity
                                style={[styles.tab, mode === 'create' && styles.activeTab]}
                                onPress={() => setMode('create')}
                                accessibilityLabel={t('onboarding.createNewLabel')}
                                accessibilityRole="button"
                                accessibilityState={{ selected: mode === 'create' }}
                            >
                                <Text style={[styles.tabText, mode === 'create' && styles.activeTabText]}>
                                    {t('onboarding.createNew')}
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.tab, mode === 'join' && styles.activeTab]}
                                onPress={() => setMode('join')}
                                accessibilityLabel={t('onboarding.joinExistingLabel')}
                                accessibilityRole="button"
                                accessibilityState={{ selected: mode === 'join' }}
                            >
                                <Text style={[styles.tabText, mode === 'join' && styles.activeTabText]}>
                                    {t('onboarding.joinExisting')}
                                </Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.formContainer}>
                            {mode === 'create' ? (
                                <>
                                    <Text style={styles.label}>{t('onboarding.householdName')}</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder={t('onboarding.householdNamePlaceholder')}
                                        placeholderTextColor={colors.textMuted}
                                        value={name}
                                        onChangeText={setName}
                                        autoCapitalize="words"
                                        accessibilityLabel={t('onboarding.householdNameLabel')}
                                        accessibilityHint={t('onboarding.householdNameHint')}
                                    />
                                    <Text style={styles.helperText}>
                                        {t('onboarding.householdHelper')}
                                    </Text>
                                    <TouchableOpacity
                                        style={[styles.button, !name.trim() && styles.buttonDisabled]}
                                        onPress={handleCreate}
                                        disabled={loading || !name.trim()}
                                        accessibilityLabel={t('onboarding.createHouseholdLabel')}
                                        accessibilityRole="button"
                                        accessibilityHint={t('onboarding.createHouseholdHint')}
                                    >
                                        {loading ? (
                                            <ActivityIndicator color="#fff" />
                                        ) : (
                                            <Text style={styles.buttonText}>{t('onboarding.createHousehold')}</Text>
                                        )}
                                    </TouchableOpacity>
                                </>
                            ) : (
                                <>
                                    <Text style={styles.label}>{t('onboarding.inviteCode')}</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder={t('onboarding.inviteCodePlaceholder')}
                                        placeholderTextColor={colors.textMuted}
                                        value={inviteCode}
                                        onChangeText={setInviteCode}
                                        autoCapitalize="none"
                                        autoCorrect={false}
                                        accessibilityLabel={t('onboarding.inviteCodeLabel')}
                                        accessibilityHint={t('onboarding.inviteCodeHint')}
                                    />
                                    <Text style={styles.helperText}>
                                        {t('onboarding.inviteHelper')}
                                    </Text>
                                    <TouchableOpacity
                                        style={[styles.button, !inviteCode.trim() && styles.buttonDisabled]}
                                        onPress={handleJoin}
                                        disabled={loading || !inviteCode.trim()}
                                        accessibilityLabel={t('onboarding.joinHouseholdLabel')}
                                        accessibilityRole="button"
                                        accessibilityHint={t('onboarding.joinHouseholdHint')}
                                    >
                                        {loading ? (
                                            <ActivityIndicator color="#fff" />
                                        ) : (
                                            <Text style={styles.buttonText}>{t('onboarding.joinHousehold')}</Text>
                                        )}
                                    </TouchableOpacity>
                                </>
                            )}
                        </View>
                    </View>
                </TouchableWithoutFeedback>
            </KeyboardAvoidingView>
            <Toast
                visible={toastVisible}
                message={toastMessage}
                type={toastType}
                onHide={() => setToastVisible(false)}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: colors.background,
    },
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
        padding: spacing.lg,
        justifyContent: 'center',
    },
    header: {
        marginBottom: spacing.xxl,
        alignItems: 'center',
    },
    title: {
        ...typography.h2,
        marginBottom: spacing.sm,
        textAlign: 'center',
    },
    subtitle: {
        ...typography.body,
        color: colors.textMuted,
        textAlign: 'center',
    },
    tabContainer: {
        flexDirection: 'row',
        marginBottom: spacing.lg,
        backgroundColor: colors.surface,
        borderRadius: borderRadius.lg,
        padding: 4,
    },
    tab: {
        flex: 1,
        paddingVertical: spacing.sm,
        alignItems: 'center',
        borderRadius: borderRadius.md,
    },
    activeTab: {
        backgroundColor: colors.primary,
    },
    tabText: {
        ...typography.button,
        color: colors.textMuted,
    },
    activeTabText: {
        color: colors.textLight,
    },
    formContainer: {
        backgroundColor: colors.surface,
        borderRadius: borderRadius.xl,
        padding: spacing.lg,
        ...boxShadow(2, 8, 'rgba(0, 0, 0, 0.1)'),
    },
    label: {
        ...typography.label,
        marginBottom: spacing.xs,
        marginStart: 4,
    },
    input: {
        backgroundColor: colors.background,
        borderRadius: borderRadius.lg,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        ...typography.body,
        borderWidth: 1,
        borderColor: colors.border,
        marginBottom: spacing.xs,
    },
    helperText: {
        ...typography.caption,
        color: colors.textMuted,
        marginBottom: spacing.lg,
        marginStart: 4,
    },
    button: {
        backgroundColor: colors.primary,
        borderRadius: borderRadius.lg,
        paddingVertical: spacing.md,
        alignItems: 'center',
        ...boxShadow(4, 8, 'rgba(96, 108, 56, 0.3)'),
    },
    buttonDisabled: {
        backgroundColor: colors.border,
    },
    buttonText: {
        ...typography.button,
        fontWeight: 'bold',
        color: colors.textLight,
    },
});
