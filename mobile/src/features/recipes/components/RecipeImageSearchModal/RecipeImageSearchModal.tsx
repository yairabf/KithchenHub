import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { colors } from '../../../../theme';
import {
  RecipeImageSearchResult,
  searchRecipeImages,
} from '../../services/recipeImageSearchService';
import { styles } from './styles';
import type { RecipeImageSearchModalProps } from './types';

const pairResults = (results: RecipeImageSearchResult[]) => {
  const rows: RecipeImageSearchResult[][] = [];
  for (let index = 0; index < results.length; index += 2) {
    rows.push(results.slice(index, index + 2));
  }
  return rows;
};

export function RecipeImageSearchModal({
  visible,
  initialQuery = '',
  isRtl = false,
  onClose,
  onSelect,
  searchImages = searchRecipeImages,
}: RecipeImageSearchModalProps) {
  const { t } = useTranslation('recipes');
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<RecipeImageSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const rows = useMemo(() => pairResults(results), [results]);

  useEffect(() => {
    if (visible) {
      setQuery(initialQuery);
      setResults([]);
      setError(null);
    }
  }, [visible, initialQuery]);

  useEffect(() => {
    if (!visible) {
      return;
    }

    const trimmedQuery = query.trim();
    if (trimmedQuery.length < 2) {
      setResults([]);
      setError(null);
      setIsLoading(false);
      return;
    }

    let isCurrent = true;
    setIsLoading(true);
    setError(null);

    const timeout = setTimeout(() => {
      searchImages(trimmedQuery)
        .then((nextResults) => {
          if (isCurrent) {
            setResults(nextResults);
          }
        })
        .catch(() => {
          if (isCurrent) {
            setResults([]);
            setError(t('form.webImageSearch.error'));
          }
        })
        .finally(() => {
          if (isCurrent) {
            setIsLoading(false);
          }
        });
    }, 300);

    return () => {
      isCurrent = false;
      clearTimeout(timeout);
    };
  }, [query, searchImages, t, visible]);

  const renderState = () => {
    if (isLoading) {
      return (
        <View style={styles.centerState} testID="recipe-image-search-loading">
          <ActivityIndicator color={colors.recipes} />
          <Text style={styles.stateText}>{t('form.webImageSearch.loading')}</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.centerState}>
          <Ionicons name="cloud-offline-outline" size={28} color={colors.textMuted} />
          <Text style={styles.stateTitle}>{error}</Text>
          <Text style={styles.stateText}>{t('form.webImageSearch.errorHint')}</Text>
        </View>
      );
    }

    if (query.trim().length < 2) {
      return (
        <View style={styles.centerState}>
          <Ionicons name="search-outline" size={28} color={colors.textMuted} />
          <Text style={styles.stateTitle}>{t('form.webImageSearch.startTitle')}</Text>
          <Text style={styles.stateText}>{t('form.webImageSearch.startHint')}</Text>
        </View>
      );
    }

    if (results.length === 0) {
      return (
        <View style={styles.centerState}>
          <Ionicons name="image-outline" size={28} color={colors.textMuted} />
          <Text style={styles.stateTitle}>{t('form.webImageSearch.emptyTitle')}</Text>
          <Text style={styles.stateText}>{t('form.webImageSearch.emptyHint')}</Text>
        </View>
      );
    }

    return null;
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.sheet}>
          <View style={[styles.header, isRtl && styles.headerRtl]}>
            <Text style={[styles.title, isRtl && styles.textRtl]}>
              {t('form.webImageSearch.title')}
            </Text>
            <Pressable
              accessibilityLabel={t('form.webImageSearch.close')}
              onPress={onClose}
              style={styles.closeButton}
              testID="recipe-image-search-close"
            >
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </Pressable>
          </View>

          <View style={[styles.searchRow, isRtl && styles.searchRowRtl]}>
            <Ionicons name="search-outline" size={18} color={colors.textMuted} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder={t('form.webImageSearch.placeholder')}
              placeholderTextColor={colors.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
              style={[styles.searchInput, isRtl && styles.textRtl]}
              testID="recipe-image-search-input"
            />
          </View>

          <Text style={[styles.helperText, isRtl && styles.textRtl]}>
            {t('form.webImageSearch.usageNote')}
          </Text>

          {renderState() ?? (
            <ScrollView contentContainerStyle={styles.gridContent}>
              {rows.map((row) => (
                <View key={row.map((item) => item.id).join('-')} style={styles.resultRow}>
                  {row.map((item) => (
                    <Pressable
                      key={item.id}
                      style={styles.resultTile}
                      onPress={() => onSelect(item)}
                      testID={`recipe-image-search-result-${item.id}`}
                    >
                      <Image
                        source={{ uri: item.thumbnailUrl || item.imageUrl }}
                        style={styles.resultImage}
                      />
                      <View style={styles.resultMeta}>
                        <Text numberOfLines={2} style={[styles.resultTitle, isRtl && styles.textRtl]}>
                          {item.title}
                        </Text>
                        {!!item.sourceDisplayName && (
                          <Text numberOfLines={1} style={[styles.sourceText, isRtl && styles.textRtl]}>
                            {item.sourceDisplayName}
                          </Text>
                        )}
                      </View>
                    </Pressable>
                  ))}
                  {row.length === 1 && <View style={styles.resultTile} />}
                </View>
              ))}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}
