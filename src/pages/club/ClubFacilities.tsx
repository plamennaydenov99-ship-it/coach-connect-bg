import { Building2 } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

export default function ClubFacilities() {
  const { t } = useLanguage();
  return (
    <div className="max-w-xl">
      <h1 className="font-display uppercase tracking-[0.08em] text-3xl text-portal-ink">{t.portal_facilities}</h1>
      <div className="mt-6 flex items-center gap-3 bg-portal-card border border-portal-border rounded-[4px] p-6 text-portal-muted-strong">
        <Building2 className="h-5 w-5 text-portal-blue shrink-0" />
        <p>{t.facilities_coming}</p>
      </div>
    </div>
  );
}
