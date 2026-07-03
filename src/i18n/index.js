import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import ar from "./locales/ar.json";
import fr from "./locales/fr.json";

export const SUPPORTED_LANGUAGES = ["ar", "fr"];
export const RTL_LANGUAGES = ["ar"];
export const STORAGE_KEY = "jeemplus.lang";

export function isRtlLanguage(lng) {
  return RTL_LANGUAGES.includes((lng || "").split("-")[0]);
}

export function getDirection(lng) {
  return isRtlLanguage(lng) ? "rtl" : "ltr";
}

/** Keep <html lang/dir> in sync with the active language. */
export function applyDocumentDirection(lng) {
  const dir = getDirection(lng);
  const lang = (lng || "ar").split("-")[0];
  if (typeof document !== "undefined") {
    document.documentElement.setAttribute("dir", dir);
    document.documentElement.setAttribute("lang", lang);
  }
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      ar: { translation: ar },
      fr: { translation: fr },
    },
    fallbackLng: "ar",
    supportedLngs: SUPPORTED_LANGUAGES,
    nonExplicitSupportedLngs: true,
    load: "languageOnly",
    interpolation: { escapeValue: false },
    detection: {
      order: ["localStorage", "navigator"],
      lookupLocalStorage: STORAGE_KEY,
      caches: ["localStorage"],
    },
  });

applyDocumentDirection(i18n.language);
i18n.on("languageChanged", (lng) => applyDocumentDirection(lng));

export default i18n;
