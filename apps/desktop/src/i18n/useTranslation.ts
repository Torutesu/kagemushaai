import { useSyncExternalStore, useCallback } from "react";
import { t, getLocale, setLocale, type Locale } from "./translations";

let listeners: Array<() => void> = [];

function subscribe(listener: () => void) {
  listeners.push(listener);
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}

function getSnapshot() {
  return getLocale();
}

export function useTranslation() {
  const locale = useSyncExternalStore(subscribe, getSnapshot);

  const changeLocale = useCallback((newLocale: Locale) => {
    setLocale(newLocale);
    listeners.forEach((l) => l());
  }, []);

  return { t, locale, changeLocale };
}
