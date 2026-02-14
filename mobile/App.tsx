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
import { getStoredLanguage } from './src/i18n/storage';
import { normalizeLocale } from './src/i18n/localeNormalization';
import { isRtlLanguage } from './src/i18n/rtl';

export default function App() {
  const [bootstrapped, setBootstrapped] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const stored = await getStoredLanguage();
        const deviceLocale = getLocales()[0]?.languageTag ?? null;
        const locale = stored ?? deviceLocale ?? 'en';
        const normalized = normalizeLocale(locale);
        const initialLocale = normalized !== '' ? normalized : 'en';
        const isRTL = isRtlLanguage(initialLocale);
        I18nManager.allowRTL(true);
        I18nManager.forceRTL(isRTL);
        await import('./src/i18n');
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
    };
  }, []);

  if (!bootstrapped) {
    return <View style={styles.container} />;
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      <PaperProvider>
        <OnboardingProvider>
          <AuthProvider>
            <HouseholdProvider>
              <StatusBar style="auto" />
              <RootNavigator />
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
