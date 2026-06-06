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

const FLAGS: Record<string, string> = {
  fr: '🇫🇷',
  en: '🇬🇧',
  de: '🇩🇪',
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
        className="h-9 w-[100px] sm:w-[120px] border-[#F0E6E0] bg-white/80 text-[#2D2D2D] gap-1"
        aria-label={t('label')}
      >
        <Globe className="h-4 w-4 shrink-0 opacity-70" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent align="end">
        {routing.locales.map((loc) => (
          <SelectItem key={loc} value={loc}>
            {FLAGS[loc]} {t(loc as 'fr' | 'en' | 'de')}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
