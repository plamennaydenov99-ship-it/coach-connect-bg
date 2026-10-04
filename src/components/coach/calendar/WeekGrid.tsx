import { useEffect, useRef } from 'react';
import { Check, UserX, Repeat } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import type { CalSession, OpenSlot } from '@/hooks/coach/useCoachCalendar';
import { addDays, labelDate, minutesOfDay, minutesToTime, toDateStr, toTimeStr, todayStr, type DateStr } from '@/lib/tz';
import { LOCALES } from '@/components/coach/clients/shared';

const HOUR = 48;
const MIN_PX = HOUR / 60;

interface Props {
  start: DateStr;
  days: number;
  tz: string;
  sessions: CalSession[];
  slots: OpenSlot[];
  onEmpty: (date: DateStr, time: string) => void;
  onSession: (s: CalSession) => void;
}

type Block = { top: number; height: number; lane: number; lanes: number };

/** Greedy lane layout so overlapping blocks sit side by side. */
function layout<T>(items: T[], range: (x: T) => [number, number]): (T & Block)[] {
  const sorted = [...items].sort((a, b) => range(a)[0] - range(b)[0]);
  const out: (T & Block)[] = [];
  let cluster: (T & Block)[] = [];
  let clusterEnd = -1;
  let laneEnds: number[] = [];
  const flush = () => { const n = laneEnds.length; cluster.forEach((c) => (c.lanes = n)); cluster = []; laneEnds = []; };
  for (const it of sorted) {
    const [s, e] = range(it);
    if (s >= clusterEnd) flush();
    let lane = laneEnds.findIndex((le) => le <= s);
    if (lane < 0) { lane = laneEnds.length; laneEnds.push(e); } else laneEnds[lane] = e;
    const b = { ...it, top: s * MIN_PX, height: Math.max((e - s) * MIN_PX, 20), lane, lanes: 1 } as T & Block;
    cluster.push(b); out.push(b);
    clusterEnd = Math.max(clusterEnd, e);
  }
  flush();
  return out;
}

export function WeekGrid({ start, days, tz, sessions, slots, onEmpty, onSession }: Props) {
  const { t, lang } = useLanguage();
  const scroller = useRef<HTMLDivElement>(null);
  const today = todayStr(tz);
  const dates = Array.from({ length: days }, (_, i) => addDays(start, i));

  useEffect(() => {
    if (scroller.current) scroller.current.scrollTop = 7 * HOUR;
  }, [start, days]);

  const nowMin = minutesOfDay(new Date(), tz);

  return (
    <div className="bg-portal-card border border-portal-border rounded-[4px] overflow-hidden">
      <div className="overflow-x-auto">
        <div style={{ minWidth: days > 1 ? 760 : undefined }}>
          <div className="grid border-b border-portal-border" style={{ gridTemplateColumns: `52px repeat(${days}, 1fr)` }}>
            <div />
            {dates.map((d) => (
              <div key={d} className={`px-2 py-2 text-center border-l border-portal-border ${d === today ? 'bg-portal-selected' : ''}`}>
                <div className="font-display uppercase tracking-[0.12em] text-[11px] text-portal-muted">{labelDate(d, LOCALES[lang], { weekday: 'short' })}</div>
                <div className={`font-display text-lg ${d === today ? 'text-portal-coral-text' : 'text-portal-ink'}`}>{labelDate(d, LOCALES[lang], { day: 'numeric' })}</div>
              </div>
            ))}
          </div>
          <div ref={scroller} className="overflow-y-auto" style={{ height: 15 * HOUR }}>
            <div className="grid relative" style={{ gridTemplateColumns: `52px repeat(${days}, 1fr)`, height: 24 * HOUR }}>
              <div className="relative">
                {Array.from({ length: 24 }, (_, h) => (
                  <div key={h} className="absolute right-2 text-[11px] text-portal-muted -translate-y-1/2" style={{ top: h * HOUR }}>{h ? minutesToTime(h * 60) : ''}</div>
                ))}
              </div>
              {dates.map((d) => {
                const daySessions = layout(sessions.filter((s) => toDateStr(s.starts_at, tz) === d), (s) => {
                  const a = minutesOfDay(s.starts_at, tz);
                  const b = toDateStr(s.ends_at, tz) === d ? minutesOfDay(s.ends_at, tz) : 24 * 60;
                  return [a, Math.max(b, a + 15)];
                });
                const daySlots = slots.filter((s) => s.date === d);
                return (
                  <div
                    key={d}
                    className="relative border-l border-portal-border cursor-pointer"
                    onClick={(e) => {
                      const y = e.clientY - (e.currentTarget as HTMLDivElement).getBoundingClientRect().top;
                      const min = Math.min(23 * 60 + 30, Math.max(0, Math.floor(y / MIN_PX / 30) * 30));
                      onEmpty(d, minutesToTime(min));
                    }}
                  >
                    {Array.from({ length: 24 }, (_, h) => (
                      <div key={h} className="absolute inset-x-0 border-t border-portal-border/70" style={{ top: h * HOUR }} />
                    ))}
                    {d === today && (
                      <div className="absolute inset-x-0 h-px bg-portal-copper z-20" style={{ top: nowMin * MIN_PX }} />
                    )}
                    {daySlots.map((sl) => {
                      const [sh, sm] = sl.start_time.split(':').map(Number);
                      const [eh, em] = sl.end_time.split(':').map(Number);
                      const a = sh * 60 + sm, b = eh * 60 + em;
                      return (
                        <div
                          key={sl.id}
                          onClick={(e) => { e.stopPropagation(); onEmpty(d, sl.start_time.slice(0, 5)); }}
                          className="absolute inset-x-1 rounded-[4px] border border-dashed border-portal-input bg-portal-card/60 px-1.5 py-0.5 text-[11px] text-portal-muted-strong overflow-hidden z-0"
                          style={{ top: a * MIN_PX, height: Math.max((b - a) * MIN_PX, 18) }}
                        >
                          {sl.start_time.slice(0, 5)} · {t.cal_open_slot}
                        </div>
                      );
                    })}
                    {daySessions.map((s) => {
                      const trial = s.kind === 'trial';
                      const cancelled = s.status === 'cancelled';
                      return (
                        <button
                          key={s.id}
                          onClick={(e) => { e.stopPropagation(); onSession(s); }}
                          className={`absolute rounded-[4px] border px-1.5 py-0.5 text-left text-[11px] leading-tight overflow-hidden z-10 ${
                            trial ? 'bg-portal-copper-tint border-portal-copper' : 'bg-portal-selected border-portal-selected-border'
                          } ${cancelled ? 'opacity-50 line-through' : ''} text-portal-ink hover:brightness-95`}
                          style={{
                            top: s.top, height: s.height,
                            left: `calc(${(s.lane / s.lanes) * 100}% + 2px)`,
                            width: `calc(${100 / s.lanes}% - 4px)`,
                          }}
                        >
                          <div className="flex items-center gap-1 font-medium">
                            <span>{toTimeStr(s.starts_at, tz)}</span>
                            {s.series_id && <Repeat className="h-3 w-3 shrink-0" aria-label={t.cal_repeats} />}
                            {s.status === 'attended' && <Check className="h-3 w-3 shrink-0" />}
                            {s.status === 'no_show' && <UserX className="h-3 w-3 shrink-0 text-portal-coral-text" />}
                          </div>
                          <div className="truncate">{s.client?.display_name ?? '—'}</div>
                          {s.status === 'no_show' && <div className="text-portal-coral-text">{t.cal_no_show}</div>}
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
    </div>
  );
}
