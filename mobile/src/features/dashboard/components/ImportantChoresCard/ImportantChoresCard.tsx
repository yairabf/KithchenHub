import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  I18nManager,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { SafeImage } from "../../../../common/components/SafeImage";
import { ListItemSkeleton } from "../../../../common/components/ListItemSkeleton";
import { formatChoreDueDateTime } from "../../../../common/utils/choreDisplayUtils";
import { colors } from "../../../../theme";
import { styles } from "./styles";
import type { ImportantChoresCardProps } from "./types";
import { TextBlock } from "../../../../common/components/TextBlock";
import { getAssigneeAvatarUri } from "../../../../common/utils/avatarUtils";

function getChoreRowBackground(completed: boolean): string {
  return completed ? colors.pastel.green : colors.pastel.peach;
}

export function ImportantChoresCard({
  isTablet,
  isRtl,
  choresLoading,
  chores,
  onToggleChore,
  onNavigateToChores,
  onOpenChoresModal,
}: ImportantChoresCardProps) {
  const { t } = useTranslation(["dashboard", "chores"]);
  const isRtlLayout = isRtl ?? I18nManager.isRTL;

  return (
    <View style={[styles.rightColumn, !isTablet && styles.fullWidthColumn]}>
      <View style={styles.choresCard}>
        <View style={styles.choresSectionHeader}>
          <TextBlock
            title={t("choresPanel.title")}
            subtitle={t("choresPanel.subtitle")}
            isRtl={isRtlLayout}
            containerStyle={styles.choresTitleBlock}
            containerRtlStyle={styles.choresTitleBlockRtl}
            titleStyle={styles.choresSectionTitle}
            titleRtlStyle={styles.choresSectionTitleIosRtl}
            subtitleStyle={styles.choresSectionSubtitle}
            subtitleRtlStyle={styles.choresSectionSubtitleIosRtl}
          />
          <TouchableOpacity
            onPress={onNavigateToChores}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityLabel={t("choresPanel.viewAllLabel")}
            accessibilityRole="button"
            accessibilityHint={t("choresPanel.viewAllHint")}
          >
            <Text style={[styles.viewAllLink, isRtlLayout && styles.viewAllLinkRtl]}>
              {t("choresPanel.viewAll")}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.choreList}>
          {choresLoading ? (
            <>
              <ListItemSkeleton />
              <ListItemSkeleton />
              <ListItemSkeleton />
            </>
          ) : (
            chores.map((chore) => (
              <TouchableOpacity
                key={chore.id}
                style={[
                  styles.choreRow,
                  chore.isCompleted && styles.choreRowDone,
                  { backgroundColor: getChoreRowBackground(chore.isCompleted) },
                ]}
                onPress={() => onToggleChore(chore.id)}
                activeOpacity={0.8}
                accessibilityLabel={`${chore.title}, ${chore.isCompleted ? t("status.done", { ns: "chores" }) : t("status.pending", { ns: "chores" })}, ${chore.assignee ?? t("choresPanel.unassigned")}`}
                accessibilityRole="button"
                accessibilityHint={
                  chore.isCompleted
                    ? t("choresPanel.markIncomplete")
                    : t("choresPanel.markComplete")
                }
              >
                <View style={styles.choreLeftSection}>
                  <View style={styles.choreTopRow}>
                    <View style={styles.choreAvatarContainer}>
                      <SafeImage
                        uri={getAssigneeAvatarUri(chore.assignee)}
                        style={styles.choreAvatar}
                      />
                    </View>
                    <View style={styles.choreContent}>
                      <Text
                        style={[
                          styles.choreTitle,
                          chore.isCompleted && styles.choreTitleDone,
                        ]}
                        numberOfLines={2}
                        ellipsizeMode="tail"
                      >
                        {chore.title}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.choreMetaRow}>
                    <Text style={styles.choreMetaText} numberOfLines={1}>
                      {chore.assignee ?? t("choresPanel.unassigned")}
                    </Text>
                    <View style={styles.choreMetaDot} />
                    <Text style={styles.choreMetaText} numberOfLines={1}>
                      {formatChoreDueDateTime(chore.dueDate, chore.dueTime)}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        <TouchableOpacity
          style={styles.addHouseholdTaskButton}
          onPress={onOpenChoresModal}
          activeOpacity={0.7}
          accessibilityLabel={t("choresPanel.addTaskLabel")}
          accessibilityRole="button"
          accessibilityHint={t("choresPanel.addTaskHint")}
        >
          <Ionicons name="add" size={16} color={colors.textMuted} />
          <Text style={styles.addHouseholdTaskText}>{t("choresPanel.addTask")}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
