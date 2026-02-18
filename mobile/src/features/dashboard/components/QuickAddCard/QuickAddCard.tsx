import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  I18nManager,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { colors } from "../../../../theme";
import { GrocerySearchBar } from "../../../shopping/components/GrocerySearchBar";
import { styles } from "./styles";
import type { QuickAddCardProps } from "./types";
import { TextBlock } from "../../../../common/components/TextBlock";

export function QuickAddCard({
  isTablet,
  isRtl,
  searchValue,
  onSearchChange,
  searchResults,
  onSelectItem,
  onQuickAddItem,
  showSuggestedItems,
  onToggleSuggestedItems,
  suggestedItems,
  onSuggestionPress,
}: QuickAddCardProps) {
  const { t } = useTranslation("dashboard");
  const isRtlLayout = isRtl ?? I18nManager.isRTL;
  const isMobile = Platform.OS !== "web" && !isTablet;

  return (
    <View
      style={[
        styles.shoppingCard,
        isMobile && styles.shoppingCardMobile,
      ]}
    >
      <View style={styles.shoppingCardHeader}>
        <TextBlock 
          title={t("quickAdd.title")} 
          subtitle={t("quickAdd.subtitle")} 
          isRtl={isRtlLayout}
          containerStyle={styles.shoppingCardTitleBlock}
          containerRtlStyle={styles.shoppingCardTitleBlockRtl}
          titleStyle={styles.shoppingCardTitle}
          titleRtlStyle={styles.shoppingCardTitleIosRtl}
          subtitleStyle={styles.shoppingCardSubtitle}
          subtitleRtlStyle={styles.shoppingCardSubtitleIosRtl}
        />
        <View style={styles.mainListBadge}>
          <Text style={[styles.mainListBadgeText, isRtlLayout && styles.mainListBadgeTextRtl]}>
            {t("quickAdd.mainListBadge")}
          </Text>
        </View>
      </View>

      <View style={styles.inputRowWithDropdown}>
        <View style={styles.grocerySearchBarWrapper}>
          <GrocerySearchBar
            items={searchValue ? searchResults : []}
            value={searchValue}
            onChangeText={onSearchChange}
            onSelectItem={onSelectItem}
            onQuickAddItem={onQuickAddItem}
            placeholder={t("search.placeholder", { ns: "shopping" })}
            isRtl={isRtlLayout}
            variant="surface"
            showShadow={true}
            allowCustomItems={true}
            searchMode="remote"
          />
        </View>
        <TouchableOpacity
          style={styles.micButton}
          accessibilityLabel={t("quickAdd.voiceInput")}
          accessibilityRole="button"
          accessibilityHint={t("quickAdd.voiceInputHint")}
        >
          <Ionicons
            name="mic-outline"
            size={22}
            color={colors.textMuted}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.suggestedSection}>
        <View style={styles.suggestedHeader}>
          <Text style={[styles.suggestedLabel, isRtlLayout && styles.suggestedLabelRtl]}>
            {t("quickAdd.suggestedItems")}
          </Text>
          <TouchableOpacity
            onPress={onToggleSuggestedItems}
            activeOpacity={0.7}
            accessibilityLabel={
              showSuggestedItems
                ? t("quickAdd.hide")
                : t("quickAdd.show")
            }
            accessibilityRole="button"
            accessibilityHint={t("quickAdd.toggleSuggestedHint")}
          >
            <Text style={styles.suggestedToggleText}>
              {showSuggestedItems ? t("quickAdd.hide") : t("quickAdd.show")}
            </Text>
          </TouchableOpacity>
        </View>

        {showSuggestedItems ? (
          <ScrollView
            style={styles.suggestionScrollArea}
            contentContainerStyle={styles.suggestionChipsRow}
            nestedScrollEnabled
            showsVerticalScrollIndicator={false}
          >
            {suggestedItems.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.suggestionChip}
                onPress={() => onSuggestionPress(item)}
                activeOpacity={0.7}
                accessibilityLabel={t("quickAdd.addItemLabel", { name: item.name })}
                accessibilityRole="button"
                accessibilityHint={t("quickAdd.addItemHint", { name: item.name })}
              >
                <Ionicons
                  name="add"
                  size={14}
                  color={colors.textSecondary}
                />
                <Text style={styles.suggestionChipText}>
                  {item.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        ) : null}
      </View>
    </View>
  );
}
