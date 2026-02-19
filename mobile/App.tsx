import React, { useEffect, useState } from 'react';
import { I18nManager, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native';
import { configureReanimatedLogger, ReanimatedLogLevel } from 'react-native-reanimated';

// Reduce "Reading from value during component render" warnings (e.g. from third-party or complex animations)
configureReanimatedLogger({ level: ReanimatedLogLevel.warn, strict: false });
import { Provider as PaperProvider } from 'react-native-paper';
import { getLocales } from './src/i18n/localize';
import { AuthProvider } from './src/contexts/AuthContext';
import { HouseholdProvider } from './src/contexts/HouseholdContext';
import { OnboardingProvider } from './src/features/auth/contexts/OnboardingContext';
import { RootNavigator } from './src/navigation/RootNavigator';
import { LegalConsentGate } from './src/features/settings';
import { getStoredLanguage } from './src/i18n/storage';
import { normalizeLocale } from './src/i18n/localeNormalization';
import { isRtlLanguage } from './src/i18n/rtl';

export default function App() {
  const [bootstrapped, setBootstrapped] = useState(false);
  const [layoutDirection, setLayoutDirection] = useState<'ltr' | 'rtl'>('ltr');
  const [treeKey, setTreeKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    let detachLanguageChanged: (() => void) | undefined;
    (async () => {
      try {
        const stored = await getStoredLanguage();
        const deviceLocale = getLocales()[0]?.languageTag ?? null;
        const locale = stored ?? deviceLocale ?? 'en';
        const normalized = normalizeLocale(locale);
        const initialLocale = normalized !== '' ? normalized : 'en';
        const isRTL = isRtlLanguage(initialLocale);
        I18nManager.allowRTL(true);
        I18nManager.swapLeftAndRightInRTL(true);
        I18nManager.forceRTL(isRTL);
        setLayoutDirection(isRTL ? 'rtl' : 'ltr');
        const { i18n } = await import('./src/i18n');

        const onLanguageChanged = (lng: string) => {
          const nextRtl = isRtlLanguage(lng);
          const nextDirection = nextRtl ? 'rtl' : 'ltr';
          setLayoutDirection((current) => {
            if (current !== nextDirection) {
              setTreeKey((k) => k + 1);
            }
            return nextDirection;
          });
        };

        i18n.on('languageChanged', onLanguageChanged);
        detachLanguageChanged = () => {
          i18n.off('languageChanged', onLanguageChanged);
        };
      } catch (err) {
        if (typeof console !== 'undefined' && console.warn) {
          console.warn('[App] RTL/i18n bootstrap failed, using default', err);
        }
        await import('./src/i18n');
      }
      if (!cancelled) setBootstrapped(true);
    })();
    return () => {
      cancelled = true;
      if (detachLanguageChanged) {
        detachLanguageChanged();
      }
    };
  }, []);

  if (!bootstrapped) {
    return <View style={styles.container} />;
  }

  return (
    <GestureHandlerRootView style={[styles.container, { direction: layoutDirection }]}>
      <PaperProvider>
        <OnboardingProvider>
          <AuthProvider>
            <HouseholdProvider>
              <LegalConsentGate>
                <StatusBar style="auto" />
                {/*
                 * key={treeKey} forces a full unmount+remount of the navigator
                 * when the RTL direction changes (e.g. switching Hebrew ↔ English).
                 * This is the simplest way to apply I18nManager.forceRTL across the
                 * entire layout tree synchronously.
                 *
                 * Trade-off: navigation state (current screen, stack history) is
                 * reset on language change. This is acceptable UX because language
                 * switching is a rare, deliberate action, and preserving a deep
                 * navigation stack across an RTL flip would be confusing.
                 *
                 * If preservation becomes a requirement, pass an `initialState`
                 * prop sourced from react-navigation's persistence API.
                 */}
                <RootNavigator key={`root-nav-${treeKey}`} />
              </LegalConsentGate>
            </HouseholdProvider>
          </AuthProvider>
        </OnboardingProvider>
      </PaperProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
