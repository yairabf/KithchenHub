import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  I18nManager,
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
  showMainListBadge = true,
}: QuickAddCardProps) {
  const { t } = useTranslation("dashboard");
  const isRtlLayout = isRtl ?? I18nManager.isRTL;
  const isMobile = !isTablet;

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
        {showMainListBadge ? (
          <View style={styles.mainListBadge}>
            <Text style={[styles.mainListBadgeText, isRtlLayout && styles.mainListBadgeTextRtl]}>
              {t("quickAdd.mainListBadge")}
            </Text>
          </View>
        ) : null}
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
    </View>
  );
}
