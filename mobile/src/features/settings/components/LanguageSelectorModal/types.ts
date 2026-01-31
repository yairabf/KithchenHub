export interface LanguageSelectorModalProps {
  visible: boolean;
  onClose: () => void;
  /** Normalized current language code (e.g. from normalizeLocale(i18n.language)). */
  currentLanguageCode: string;
}
