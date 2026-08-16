"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { formatCurrency, formatDate, formatDateTime, formatMonthLabel } from "@/lib/format";
import { DEFAULT_COUNTRY, type CountryCode } from "@/lib/locale/countries";

type LocaleApi = {
  countryCode: CountryCode;
  formatCurrency: (value: number | null | undefined) => string;
  formatDate: (value: string | null | undefined) => string;
  formatDateTime: (value: string | null | undefined) => string;
  formatMonthLabel: (yearMonth: string) => string;
};

function buildApi(countryCode: CountryCode): LocaleApi {
  return {
    countryCode,
    formatCurrency: (value) => formatCurrency(value, countryCode),
    formatDate: (value) => formatDate(value, countryCode),
    formatDateTime: (value) => formatDateTime(value, countryCode),
    formatMonthLabel: (yearMonth) => formatMonthLabel(yearMonth, countryCode),
  };
}

const LocaleContext = createContext<LocaleApi>(buildApi(DEFAULT_COUNTRY));

export function LocaleProvider({ countryCode, children }: { countryCode: CountryCode; children: ReactNode }) {
  const value = useMemo(() => buildApi(countryCode), [countryCode]);
  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  return useContext(LocaleContext);
}
