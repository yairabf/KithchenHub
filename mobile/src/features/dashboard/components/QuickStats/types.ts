import type { TabKey } from "../../../../common/components/BottomPillNav";

export type QuickStatIconBgStyle = "shopping" | "recipes";
export type QuickStatIcon = "basket-outline" | "book-outline";

export interface QuickStatItem {
  icon: QuickStatIcon;
  label: string;
  value: string;
  route: TabKey | null;
  iconBgStyle: QuickStatIconBgStyle;
}

export interface QuickStatsRowProps {
  stats: QuickStatItem[];
  isRtl: boolean;
  onPressStat: (route: TabKey | null) => void;
}

export interface QuickStatCardProps {
  stat: QuickStatItem;
  isRtl: boolean;
  onPress: (route: TabKey | null) => void;
}
