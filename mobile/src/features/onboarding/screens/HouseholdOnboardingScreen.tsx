import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    TouchableWithoutFeedback,
    Keyboard,
    SafeAreaView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../theme';
import { boxShadow } from '../../../theme/shadows';
import { householdService } from '../../../services/householdService';
import { useAuth } from '../../../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';

export function HouseholdOnboardingScreen() {
    const { user, refreshUser } = useAuth(); // Assuming refreshUser exists, or we need to implement it
    const [mode, setMode] = useState<'create' | 'join'>('create');
    const [name, setName] = useState('');
    const [inviteCode, setInviteCode] = useState('');
    const [loading, setLoading] = useState(false);

    const handleCreate = async () => {
        if (!name.trim()) {
            Alert.alert('Error', 'Please enter a household name');
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
            Alert.alert('Error', error.message || 'Failed to create household');
        } finally {
            setLoading(false);
        }
    };

    const handleJoin = async () => {
        if (!inviteCode.trim()) {
            Alert.alert('Error', 'Please enter an invite code');
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
            Alert.alert('Error', error.message || 'Failed to join household');
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
                            <Text style={styles.title}>Welcome to KitchenHub!</Text>
                            <Text style={styles.subtitle}>
                                To get started, create a new household or join an existing one using an invite code.
                            </Text>
                        </View>

                        <View style={styles.tabContainer}>
                            <TouchableOpacity
                                style={[styles.tab, mode === 'create' && styles.activeTab]}
                                onPress={() => setMode('create')}
                            >
                                <Text style={[styles.tabText, mode === 'create' && styles.activeTabText]}>
                                    Create New
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.tab, mode === 'join' && styles.activeTab]}
                                onPress={() => setMode('join')}
                            >
                                <Text style={[styles.tabText, mode === 'join' && styles.activeTabText]}>
                                    Join Existing
                                </Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.formContainer}>
                            {mode === 'create' ? (
                                <>
                                    <Text style={styles.label}>Household Name</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="e.g. The Smiths, Cozy Cottage"
                                        placeholderTextColor={colors.textMuted}
                                        value={name}
                                        onChangeText={setName}
                                        autoCapitalize="words"
                                    />
                                    <Text style={styles.helperText}>
                                        Give your shared space a name. You can change this later.
                                    </Text>
                                    <TouchableOpacity
                                        style={[styles.button, !name.trim() && styles.buttonDisabled]}
                                        onPress={handleCreate}
                                        disabled={loading || !name.trim()}
                                    >
                                        {loading ? (
                                            <ActivityIndicator color="#fff" />
                                        ) : (
                                            <Text style={styles.buttonText}>Create Household</Text>
                                        )}
                                    </TouchableOpacity>
                                </>
                            ) : (
                                <>
                                    <Text style={styles.label}>Invite Code</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Paste invite code here"
                                        placeholderTextColor={colors.textMuted}
                                        value={inviteCode}
                                        onChangeText={setInviteCode}
                                        autoCapitalize="none"
                                        autoCorrect={false}
                                    />
                                    <Text style={styles.helperText}>
                                        Ask a household member to share their invite code with you.
                                    </Text>
                                    <TouchableOpacity
                                        style={[styles.button, !inviteCode.trim() && styles.buttonDisabled]}
                                        onPress={handleJoin}
                                        disabled={loading || !inviteCode.trim()}
                                    >
                                        {loading ? (
                                            <ActivityIndicator color="#fff" />
                                        ) : (
                                            <Text style={styles.buttonText}>Join Household</Text>
                                        )}
                                    </TouchableOpacity>
                                </>
                            )}
                        </View>
                    </View>
                </TouchableWithoutFeedback>
            </KeyboardAvoidingView>
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
        padding: 24,
        justifyContent: 'center',
    },
    header: {
        marginBottom: 32,
        alignItems: 'center',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: colors.textPrimary,
        marginBottom: 12,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: colors.textMuted,
        textAlign: 'center',
        lineHeight: 24,
    },
    tabContainer: {
        flexDirection: 'row',
        marginBottom: 24,
        backgroundColor: colors.surface,
        borderRadius: 12,
        padding: 4,
    },
    tab: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        borderRadius: 8,
    },
    activeTab: {
        backgroundColor: colors.primary,
    },
    tabText: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.textMuted,
    },
    activeTabText: {
        color: '#fff',
    },
    formContainer: {
        backgroundColor: colors.surface,
        borderRadius: 16,
        padding: 24,
        ...boxShadow(2, 8, 'rgba(0, 0, 0, 0.1)'),
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.textPrimary,
        marginBottom: 8,
        marginLeft: 4,
    },
    input: {
        backgroundColor: colors.background,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
        color: colors.textPrimary,
        borderWidth: 1,
        borderColor: colors.border,
        marginBottom: 8,
    },
    helperText: {
        fontSize: 13,
        color: colors.textMuted,
        marginBottom: 24,
        marginLeft: 4,
    },
    button: {
        backgroundColor: colors.primary,
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
        ...boxShadow(4, 8, 'rgba(96, 108, 56, 0.3)'),
    },
    buttonDisabled: {
        backgroundColor: colors.border,
    },
    buttonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff',
    },
});
