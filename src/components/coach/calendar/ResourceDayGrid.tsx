import { useEffect, useRef } from 'react';
import { Repeat } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { sessionFill, type CalSession } from '@/hooks/coach/useCoachCalendar';
import type { ClubResource } from '@/hooks/coach/useClubResources';
import { minutesOfDay, minutesToTime, toDateStr, toTimeStr, todayStr, type DateStr } from '@/lib/tz';
import { HOUR, MIN_PX, layout } from './WeekGrid';

/** Club day view: one column per active facility plus a "No facility" column. */
export function ResourceDayGrid({ date, tz, sessions, resources, onEmpty, onSession }: {
  date: DateStr; tz: string; sessions: CalSession[]; resources: ClubResource[];
  onEmpty: (date: DateStr, time: string, resourceId?: string) => void; onSession: (s: CalSession) => void;
}) {
  const { t } = useLanguage();
  const scroller = useRef<HTMLDivElement>(null);
  useEffect(() => { if (scroller.current) scroller.current.scrollTop = 7 * HOUR; }, [date]);
  const ids = new Set(resources.map((r) => r.id));
  const cols = [...resources.map((r) => ({ id: r.id as string | null, name: r.name })), { id: null, name: t.cal_no_facility }];
  const day = sessions.filter((s) => toDateStr(s.starts_at, tz) === date);
  const isToday = date === todayStr(tz);
  const nowMin = minutesOfDay(new Date(), tz);

  return (
    <div className="bg-portal-card border border-portal-border rounded-[4px] overflow-hidden">
      <div className="overflow-x-auto">
        <div style={{ minWidth: 52 + cols.length * 150 }}>
          <div className="grid border-b border-portal-border" style={{ gridTemplateColumns: `52px repeat(${cols.length}, 1fr)` }}>
            <div />
            {cols.map((c) => <div key={c.id ?? 'none'} className="px-2 py-2 text-center border-l border-portal-border font-display uppercase tracking-[0.1em] text-xs truncate">{c.name}</div>)}
          </div>
          <div ref={scroller} className="relative grid overflow-y-auto max-h-[640px]" style={{ gridTemplateColumns: `52px repeat(${cols.length}, 1fr)`, height: 24 * HOUR }}>
            <div className="relative" style={{ height: 24 * HOUR }}>
              {Array.from({ length: 24 }, (_, h) => <div key={h} className="absolute right-1 text-[10px] text-portal-muted -translate-y-1/2" style={{ top: h * HOUR }}>{h ? `${String(h).padStart(2, '0')}:00` : ''}</div>)}
            </div>
            {cols.map((c) => {
              // Sessions on inactive facilities fall into "No facility" so nothing disappears.
              const list = day.filter((s) => (c.id ? s.resource_id === c.id : !s.resource_id || !ids.has(s.resource_id)));
              const blocks = layout(list, (s) => {
                const a = minutesOfDay(s.starts_at, tz);
                const b = toDateStr(s.ends_at, tz) === date ? minutesOfDay(s.ends_at, tz) : 24 * 60;
                return [a, Math.max(b, a + 15)];
              });
              return (
                <div key={c.id ?? 'none'} className="relative border-l border-portal-border cursor-pointer" style={{ height: 24 * HOUR }}
                  onClick={(e) => {
                    const y = e.clientY - (e.currentTarget as HTMLDivElement).getBoundingClientRect().top;
                    onEmpty(date, minutesToTime(Math.min(23 * 60 + 30, Math.max(0, Math.floor(y / MIN_PX / 30) * 30))), c.id ?? undefined);
                  }}>
                  {Array.from({ length: 24 }, (_, h) => <div key={h} className="absolute inset-x-0 border-t border-portal-border/70" style={{ top: h * HOUR }} />)}
                  {isToday && <div className="absolute inset-x-0 h-px bg-portal-copper z-20" style={{ top: nowMin * MIN_PX }} />}
                  {blocks.map((s) => {
                    const hire = s.kind === 'hire';
                    return (
                      <button key={s.id} onClick={(e) => { e.stopPropagation(); onSession(s); }}
                        className={`absolute rounded-[4px] border px-1.5 py-0.5 text-left text-[11px] leading-tight overflow-hidden z-10 text-portal-ink hover:brightness-95 ${hire ? 'bg-portal-bg border-portal-ink' : s.kind === 'trial' ? 'bg-portal-copper-tint border-portal-copper' : 'bg-portal-selected border-portal-selected-border'} ${s.status === 'cancelled' ? 'opacity-50 line-through' : ''}`}
                        style={{ top: s.top, height: s.height, left: `calc(${(s.lane / s.lanes) * 100}% + 2px)`, width: `calc(${100 / s.lanes}% - 4px)` }}>
                        <div className="flex items-center gap-1 font-medium">
                          <span>{toTimeStr(s.starts_at, tz)}–{toTimeStr(s.ends_at, tz)}</span>
                          {s.series_id && <Repeat className="h-3 w-3 shrink-0" aria-label={t.cal_repeats} />}
                          {s.capacity != null && s.is_public && <span className="ml-auto text-portal-blue">★</span>}
                        </div>
                        <div className="truncate">{hire ? `${t.hire_type} · ${s.title ?? ''}` : s.capacity != null ? `${s.title || t.group_type} · ${sessionFill(s)}/${s.capacity}` : s.client?.display_name ?? '—'}</div>
                        {s.capacity != null && s.led_by && <div className="truncate text-portal-muted-strong">{t.group_led_by_line.replace('{name}', s.led_by)}</div>}
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
