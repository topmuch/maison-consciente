import Negotiator from "negotiator";
import { type Locale } from "@/contexts/I18nContext";

export const SUPPORTED_LOCALES: Locale[] = [
  "fr",
  "en",
  "es",
  "de",
  "it",
  "pt",
  "nl",
  "pl",
  "ja",
  "ar",
];

export function detectLocale(acceptLanguage: string): Locale {
  const negotiator = new Negotiator({
    headers: { "accept-language": acceptLanguage },
  });
  const lang = negotiator.language(
    SUPPORTED_LOCALES as unknown as string[]
  );
  return (lang || "fr") as Locale;
}

export function isRTLLocale(locale: Locale): boolean {
  return locale === "ar";
}
