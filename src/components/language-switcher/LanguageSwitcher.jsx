import { useTranslation } from "react-i18next";
import { SUPPORTED_LANGUAGES } from "../../i18n";
import styles from "./LanguageSwitcher.module.scss";

const SHORT_LABELS = { ar: "ع", fr: "FR" };

export default function LanguageSwitcher() {
  const { i18n, t } = useTranslation();
  const current = (i18n.language || "ar").split("-")[0];

  return (
    <div
      className={styles.switcher}
      role="group"
      aria-label={t("common.language")}
    >
      {SUPPORTED_LANGUAGES.map((lng) => (
        <button
          key={lng}
          type="button"
          className={
            styles.option + (current === lng ? " " + styles.optionActive : "")
          }
          onClick={() => i18n.changeLanguage(lng)}
          aria-pressed={current === lng}
          title={t(`languages.${lng}`)}
        >
          {SHORT_LABELS[lng] || lng.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
