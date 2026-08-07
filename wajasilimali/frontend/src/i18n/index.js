import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import sw from './sw.json';
import en from './en.json';

const savedLang = localStorage.getItem('wajasilimali_lang') || 'sw';

i18n.use(initReactI18next).init({
  resources: {
    sw: { translation: sw },
    en: { translation: en },
  },
  lng: savedLang,
  fallbackLng: 'sw',
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
