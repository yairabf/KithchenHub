import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LegalConsentModal } from './LegalConsentModal/LegalConsentModal';
import { LEGAL_ACCEPTED_STORAGE_KEY } from '../../../common/constants/legal';
import { openLegalUrl } from '../../../common/utils/legalLinks';
import { useLegalLinks } from '../../../contexts/LegalLinksContext';
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
  const { privacyPolicyUrl, termsOfServiceUrl } = useLegalLinks();
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

  if (accepted === null) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (accepted === false) {
    return (
      <LegalConsentModal
        visible
        onAccept={handleAccept}
        onOpenPrivacyPolicy={() => openLegalUrl(privacyPolicyUrl)}
        onOpenTerms={() => openLegalUrl(termsOfServiceUrl)}
      />
    );
  }

  return (
    <>
      {children}
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
