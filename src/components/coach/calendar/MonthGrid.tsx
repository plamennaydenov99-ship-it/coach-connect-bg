import { Repeat } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import type { CalSession } from '@/hooks/coach/useCoachCalendar';
import { addDays, labelDate, toDateStr, toTimeStr, todayStr, type DateStr } from '@/lib/tz';
import { LOCALES } from '@/components/coach/clients/shared';

export function MonthGrid({ gridStart, month, tz, sessions, onDay, onSession }: {
  gridStart: DateStr; month: string; tz: string; sessions: CalSession[];
  onDay: (d: DateStr) => void; onSession: (s: CalSession) => void;
}) {
  const { t, lang } = useLanguage();
  const today = todayStr(tz);
  const days = Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));
  return (
    <div className="bg-portal-card border border-portal-border rounded-[4px] overflow-hidden">
      <div className="grid grid-cols-7 border-b border-portal-border">
        {days.slice(0, 7).map((d) => (
          <div key={d} className="px-2 py-2 font-display uppercase tracking-[0.12em] text-[11px] text-portal-muted">{labelDate(d, LOCALES[lang], { weekday: 'short' })}</div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((d) => {
          const list = sessions.filter((s) => toDateStr(s.starts_at, tz) === d);
          const inMonth = d.startsWith(month);
          return (
            <div key={d} onClick={() => onDay(d)} className={`min-h-[96px] p-1.5 border-b border-r border-portal-border cursor-pointer hover:bg-portal-bg ${inMonth ? '' : 'opacity-50'}`}>
              <div className={`text-xs mb-1 ${d === today ? 'text-portal-coral-text font-semibold' : 'text-portal-muted-strong'}`}>{Number(d.slice(8))}</div>
              <div className="space-y-0.5">
                {list.slice(0, 3).map((s) => (
                  <button
                    key={s.id}
                    onClick={(e) => { e.stopPropagation(); onSession(s); }}
                    className={`w-full text-left truncate text-[11px] px-1 rounded-[4px] border flex items-center gap-1 ${s.kind === 'trial' ? 'bg-portal-copper-tint border-portal-copper' : 'bg-portal-selected border-portal-selected-border'} ${s.status === 'cancelled' ? 'opacity-50 line-through' : ''}`}
                  >
                    {s.series_id && <Repeat className="h-2.5 w-2.5 shrink-0" />}
                    <span className="truncate">{toTimeStr(s.starts_at, tz)} {s.client?.display_name}</span>
                  </button>
                ))}
                {list.length > 3 && <div className="text-[11px] text-portal-muted">+{list.length - 3} {t.cal_more}</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
