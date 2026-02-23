import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ActivityIndicator,
    StyleSheet,
    Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useTranslation } from 'react-i18next';
import { colors, spacing, borderRadius, typography } from '../../../theme';
import { CenteredModal } from '../../../common/components/CenteredModal';
import { householdService } from '../../../services/householdService';

interface InviteMemberModalProps {
    visible: boolean;
    onClose: () => void;
}

export function InviteMemberModal({ visible, onClose }: InviteMemberModalProps) {
    const { t } = useTranslation('settings');
    const [inviteToken, setInviteToken] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [copied, setCopied] = useState(false);

    const handleGenerateInvite = async () => {
        try {
            setIsGenerating(true);
            const { inviteToken } = await householdService.inviteMember();
            setInviteToken(inviteToken);
        } catch (error) {
            console.error('Error generating invite:', error);
        } finally {
            setIsGenerating(false);
        }
    };

    const copyToClipboard = async () => {
        if (inviteToken) {
            await Clipboard.setStringAsync(inviteToken);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleShare = async () => {
        if (!inviteToken) return;
        try {
            await Share.share({
                message: t('inviteMemberModal.shareMessage', { code: inviteToken }),
                title: t('inviteMemberModal.shareTitle'),
            });
        } catch (error) {
            console.error('Error sharing:', error);
        }
    };

    const handleClose = () => {
        setInviteToken(null);
        onClose();
    };

    return (
        <CenteredModal
            visible={visible}
            onClose={handleClose}
            title={t('inviteMemberModal.title')}
            showActions={false}
        >
            <View style={styles.container}>
                <Text style={styles.description}>
                    {t('inviteMemberModal.description')}
                </Text>

                {inviteToken ? (
                    <View style={styles.codeSection}>
                        <View style={styles.codeContainer}>
                            <Text style={styles.codeText}>{inviteToken}</Text>
                        </View>
                        <TouchableOpacity
                            style={[styles.copyButton, copied && styles.copiedButton]}
                            onPress={copyToClipboard}
                        >
                            <Ionicons
                                name={copied ? "checkmark-circle" : "copy-outline"}
                                size={22}
                                color="#fff"
                            />
                            <Text style={styles.copyButtonText}>
                                {copied ? t('inviteMemberModal.copiedToClipboard') : t('inviteMemberModal.copyCode')}
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
                            <Ionicons name="share-social-outline" size={24} color={colors.primary} />
                            <Text style={styles.shareButtonText}>{t('inviteMemberModal.shareViaApps')}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.refreshButton} onPress={handleGenerateInvite} disabled={isGenerating}>
                            <Text style={styles.refreshButtonText}>{t('inviteMemberModal.generateNewCode')}</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <TouchableOpacity
                        style={styles.generateButton}
                        onPress={handleGenerateInvite}
                        disabled={isGenerating}
                    >
                        {isGenerating ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <>
                                <Ionicons name="person-add-outline" size={24} color="#fff" />
                                <Text style={styles.generateButtonText}>{t('inviteMemberModal.generateInviteCode')}</Text>
                            </>
                        )}
                    </TouchableOpacity>
                )}
            </View>
        </CenteredModal>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: spacing.md,
        alignItems: 'center',
    },
    description: {
        ...typography.body,
        color: colors.textSecondary,
        textAlign: 'center',
        marginBottom: spacing.xl,
    },
    generateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.primary,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.xl,
        borderRadius: borderRadius.lg,
        width: '100%',
        gap: spacing.sm,
    },
    generateButtonText: {
        ...typography.button,
        color: '#fff',
    },
    codeSection: {
        width: '100%',
        alignItems: 'center',
    },
    codeContainer: {
        backgroundColor: colors.background,
        padding: spacing.lg,
        borderRadius: borderRadius.lg,
        width: '100%',
        alignItems: 'center',
        marginBottom: spacing.lg,
        borderWidth: 1,
        borderColor: colors.border,
    },
    codeText: {
        fontSize: 32,
        fontWeight: '800',
        color: colors.primary,
        letterSpacing: 4,
    },
    copyButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.primary,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.xl,
        borderRadius: borderRadius.lg,
        width: '100%',
        gap: spacing.sm,
        marginBottom: spacing.md,
    },
    copyButtonText: {
        ...typography.button,
        color: '#fff',
    },
    refreshButton: {
        padding: spacing.sm,
    },
    refreshButtonText: {
        ...typography.bodySmall,
        color: colors.textMuted,
        textDecorationLine: 'underline',
    },
    shareButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'transparent',
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.xl,
        borderRadius: borderRadius.lg,
        width: '100%',
        gap: spacing.sm,
        marginBottom: spacing.md,
        borderWidth: 1,
        borderColor: colors.primary,
    },
    shareButtonText: {
        ...typography.button,
        color: colors.primary,
        fontWeight: '600',
    },
    copiedButton: {
        backgroundColor: colors.success,
    },
});
