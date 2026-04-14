import { useLanguageStore } from '@/store/useLanguageStore';
import { translations } from '@/i18n/translations';

export const useTranslation = () => {
  const { language } = useLanguageStore();
  const t = (key: keyof typeof translations.en) => translations[language][key];
  return { t, language, isRTL: language === 'ar' };
};
