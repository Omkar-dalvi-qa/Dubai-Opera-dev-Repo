import type { Locale } from './config';

/**
 * Switch locale in the current pathname.
 * e.g. switchLocale('/en/programs', 'ar') → '/ar/programs'
 */
export function switchLocale(pathname: string, newLocale: Locale): string {
  // pathname always starts with /en or /ar
  const segments = pathname.split('/');
  segments[1] = newLocale;
  return segments.join('/') || `/${newLocale}`;
}
