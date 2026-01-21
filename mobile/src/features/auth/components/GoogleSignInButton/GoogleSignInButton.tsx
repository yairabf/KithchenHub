import React from 'react';
import { TouchableOpacity, Text, View, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../../theme';
import { styles } from './styles';
import { GoogleSignInButtonProps } from './types';

export function GoogleSignInButton({ onPress, isLoading }: GoogleSignInButtonProps) {
  return (
    <TouchableOpacity
      style={styles.button}
      onPress={onPress}
      disabled={isLoading}
      activeOpacity={0.8}
    >
      {isLoading ? (
        <ActivityIndicator color={colors.textPrimary} />
      ) : (
        <>
          <View style={styles.iconContainer}>
            <Ionicons name="logo-google" size={20} color={colors.google} />
          </View>
          <Text style={styles.text}>Sign in with Google</Text>
        </>
      )}
    </TouchableOpacity>
  );
}
