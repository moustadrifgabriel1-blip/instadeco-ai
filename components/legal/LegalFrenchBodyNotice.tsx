import { getLocale, getTranslations } from 'next-intl/server';

/**
 * Bandeau informatif lorsque la locale n'est pas le français :
 * le corps juridique peut rester en français (version de référence).
 */
export async function LegalFrenchBodyNotice() {
  const locale = await getLocale();
  if (locale === 'fr') return null;

  const t = await getTranslations('Legal');
  return (
    <div className="mb-8 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
      {t('frenchBodyNotice')}
    </div>
  );
}
