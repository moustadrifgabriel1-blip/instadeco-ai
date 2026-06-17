'use client';

import { useLocale, useTranslations } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Globe } from 'lucide-react';

const LOCALE_CODES: Record<string, string> = {
  fr: 'FR',
  en: 'EN',
  de: 'DE',
};

export function LanguageSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations('LanguageSwitcher');

  return (
    <Select
      value={locale}
      onValueChange={(next) => {
        if (next !== locale) {
          router.replace(pathname, { locale: next });
        }
      }}
    >
      <SelectTrigger
        className="h-9 w-[100px] sm:w-[120px] border-[rgba(200,162,77,0.28)] bg-[#0c0a09]/30 text-[#faf8f4] gap-1"
        aria-label={t('label')}
      >
        <Globe className="h-4 w-4 shrink-0 opacity-70" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent align="end" className="prestige-app">
        {routing.locales.map((loc) => (
          <SelectItem key={loc} value={loc}>
            {LOCALE_CODES[loc]} {t(loc as 'fr' | 'en' | 'de')}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
