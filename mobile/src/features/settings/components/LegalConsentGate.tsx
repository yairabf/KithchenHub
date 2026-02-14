import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LegalConsentModal } from './LegalConsentModal/LegalConsentModal';
import {
  LEGAL_ACCEPTED_STORAGE_KEY,
  PRIVACY_POLICY_URL,
  TERMS_OF_SERVICE_URL,
} from '../../../common/constants/legal';
import { openLegalUrl } from '../../../common/utils/legalLinks';
import { colors } from '../../../theme';

export interface LegalConsentGateProps {
  children: React.ReactNode;
}

/**
 * Gate that shows the legal consent modal on first app launch until the user
 * accepts. Reads and writes AsyncStorage key @kitchen_hub_legal_accepted_v1.
 * While the stored value is loading (accepted === null), shows a loading view
 * to avoid flicker when the modal appears.
 */
export function LegalConsentGate({ children }: LegalConsentGateProps) {
  const [accepted, setAccepted] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const value = await AsyncStorage.getItem(LEGAL_ACCEPTED_STORAGE_KEY);
        if (!cancelled) {
          setAccepted(value === 'true');
        }
      } catch {
        if (!cancelled) {
          setAccepted(true);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleAccept = async () => {
    try {
      await AsyncStorage.setItem(LEGAL_ACCEPTED_STORAGE_KEY, 'true');
      setAccepted(true);
    } catch {
      setAccepted(true);
    }
  };

  const showModal = accepted === false;
  const isLoading = accepted === null;

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <>
      {children}
      <LegalConsentModal
        visible={showModal}
        onAccept={handleAccept}
        onOpenPrivacyPolicy={() => openLegalUrl(PRIVACY_POLICY_URL)}
        onOpenTerms={() => openLegalUrl(TERMS_OF_SERVICE_URL)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
});
