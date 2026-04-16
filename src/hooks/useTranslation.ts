import { useLanguageStore } from '@/store/useLanguageStore';
import { translations } from '@/i18n/translations';

export const useTranslation = () => {
  const { language } = useLanguageStore();
  const t = (key: keyof typeof translations.en, params?: Record<string, string | number>) => {
    let text = translations[language][key] || translations.en[key] || key;
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        text = text.replace(`{${k}}`, String(v));
      });
    }
    return text;
  };
  return { t, language, isRTL: language === 'ar' };
};
