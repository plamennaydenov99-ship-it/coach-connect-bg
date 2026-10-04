import { classFill } from '@/lib/sessionMetrics';
import { useStaffRole } from '@/context/StaffRoleContext';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, CalendarClock, Inbox, Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { useQueryClient } from '@tanstack/react-query';
import { useIsMobile } from '@/hooks/use-mobile';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { useCalendarRange, useCoachTz, usePendingRequests, useSeriesTopUp, type CalSession } from '@/hooks/coach/useCoachCalendar';
import { addDays, addMonths, labelDate, startOfMonth, startOfWeek, todayStr, toTimeStr, type DateStr } from '@/lib/tz';
import { WeekGrid } from '@/components/coach/calendar/WeekGrid';
import { MonthGrid } from '@/components/coach/calendar/MonthGrid';
import { QuickBookForm } from '@/components/coach/calendar/QuickBookForm';
import { SessionSheet } from '@/components/coach/calendar/SessionSheet';
import { LOCALES, portalBtnGhost, portalBtnPrimary } from '@/components/coach/clients/shared';
import Availability from '@/pages/dashboard/Availability';
import BookingRequests from '@/pages/dashboard/BookingRequests';

type View = 'week' | 'day' | 'month';

export default function CoachCalendar() {
  const { t, lang } = useLanguage();
  const role = useStaffRole();
  const { user } = useAuth();
  const tz = useCoachTz();
  const isMobile = useIsMobile();
  const qc = useQueryClient();
  const [params, setParams] = useSearchParams();
  const [view, setView] = useState<View>(() => (window.innerWidth < 768 ? 'day' : 'week'));
  const [anchor, setAnchor] = useState<DateStr>(() => todayStr(tz));
  const [book, setBook] = useState<{ date: DateStr; time: string; clientId?: string } | null>(null);
  const [selected, setSelected] = useState<CalSession | null>(null);
  const [availOpen, setAvailOpen] = useState(false);
  const [reqOpen, setReqOpen] = useState(false);

  useSeriesTopUp();
  const { data: pending = 0 } = usePendingRequests();

  // ?new=1 or ?client=<id> opens the quick-book panel; params are cleared when it closes
  // (kept until then so a remount of the page doesn't lose the panel).
  useEffect(() => {
    const client = params.get('client');
    if ((params.get('new') || client) && !book) {
      const nowT = toTimeStr(new Date(Date.now() + 3600000), tz).slice(0, 2) + ':00';
      setBook({ date: todayStr(tz), time: nowT, clientId: client ?? undefined });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params, tz]);
  const closeBook = () => {
    setBook(null);
    if (params.get('new') || params.get('client')) setParams({}, { replace: true });
  };

  const range = useMemo(() => {
    if (view === 'day') return { start: anchor, days: 1, from: anchor, to: addDays(anchor, 1) };
    if (view === 'week') { const s = startOfWeek(anchor); return { start: s, days: 7, from: s, to: addDays(s, 7) }; }
    const gs = startOfWeek(startOfMonth(anchor));
    return { start: gs, days: 42, from: gs, to: addDays(gs, 42) };
  }, [view, anchor]);

  const { data, isLoading } = useCalendarRange(range.from, range.to);
  const sessions = data?.sessions ?? [];

  const step = (dir: 1 | -1) => setAnchor((a) => (view === 'day' ? addDays(a, dir) : view === 'week' ? addDays(a, 7 * dir) : addMonths(a, dir)));
  const loc = LOCALES[lang];
  const title =
    view === 'month'
      ? labelDate(startOfMonth(anchor), loc, { month: 'long', year: 'numeric' })
      : view === 'day'
        ? labelDate(anchor, loc, { weekday: 'long', day: 'numeric', month: 'long' })
        : `${labelDate(range.start, loc, { day: 'numeric', month: 'short' })} – ${labelDate(addDays(range.start, 6), loc, { day: 'numeric', month: 'short', year: 'numeric' })}`;

  const viewBtn = (v: View, label: string) => (
    <button onClick={() => setView(v)} className={`h-8 px-3 text-sm rounded-[4px] border ${view === v ? 'bg-portal-selected border-portal-selected-border text-portal-ink' : 'border-transparent text-portal-muted-strong'}`}>{label}</button>
  );

  const form = book && (
    <QuickBookForm initial={{ ...book, kind: role === 'club' ? 'group' : undefined }} onDone={closeBook} onClose={closeBook} />
  );

  return (
    <div className="flex gap-6">
      <div className="flex-1 min-w-0 space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-display text-3xl uppercase tracking-[0.08em]">{t.cal_title}</h1>
          <div className="flex-1" />
          {pending > 0 && (
            <button className={portalBtnGhost} onClick={() => setReqOpen(true)}><Inbox className="h-4 w-4" />{t.cal_requests} ({pending})</button>
          )}
          <button className={portalBtnGhost} onClick={() => setAvailOpen(true)}><CalendarClock className="h-4 w-4" />{t.cal_manage_availability}</button>
          <button className={portalBtnPrimary} onClick={() => setBook({ date: view === 'week' ? todayStr(tz) : anchor, time: '09:00' })}><Plus className="h-4 w-4" />{t.portal_new_session}</button>
        </div>

        {role === 'club' && view === 'week' && !isLoading && (() => { const f = classFill(sessions); return (
          <p className="text-sm text-portal-muted-strong">{t.cal_class_summary.replace('{n}', String(f.classes)).replace('{fill}', String(f.fill))}</p>
        ); })()}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1">
            <button aria-label={t.cal_prev} onClick={() => step(-1)} className={`${portalBtnGhost} px-2`}><ChevronLeft className="h-4 w-4" /></button>
            <button onClick={() => setAnchor(todayStr(tz))} className={portalBtnGhost}>{t.cal_today}</button>
            <button aria-label={t.cal_next} onClick={() => step(1)} className={`${portalBtnGhost} px-2`}><ChevronRight className="h-4 w-4" /></button>
          </div>
          <span className="font-display text-lg tracking-[0.04em] capitalize">{title}</span>
          <div className="flex-1" />
          <div className="flex gap-1 p-0.5 rounded-[4px] border border-portal-border bg-portal-card">
            {viewBtn('day', t.cal_day)}{viewBtn('week', t.cal_week)}{viewBtn('month', t.cal_month)}
          </div>
        </div>

        {isLoading ? (
          <Skeleton className="h-[600px] w-full" />
        ) : view === 'month' ? (
          <MonthGrid gridStart={range.start} month={startOfMonth(anchor).slice(0, 7)} tz={tz} sessions={sessions}
            onDay={(d) => { setAnchor(d); setView('day'); }} onSession={setSelected} />
        ) : (
          <>
            {sessions.length === 0 && <p className="text-sm text-portal-muted">{t.cal_empty_week}</p>}
            <WeekGrid start={range.start} days={range.days} tz={tz} sessions={sessions} slots={data?.slots ?? []}
              onEmpty={(date, time) => setBook({ date, time })} onSession={setSelected} />
          </>
        )}
      </div>

      {book && !isMobile && (
        <aside className="w-[340px] shrink-0 self-start sticky top-24 bg-portal-card border border-portal-border rounded-[4px] p-4 max-h-[calc(100vh-7rem)] overflow-y-auto">
          {form}
        </aside>
      )}
      {isMobile && (
        <Sheet open={!!book} onOpenChange={(o) => !o && closeBook()}>
          <SheetContent side="bottom" className="coach-portal bg-portal-card border-portal-border max-h-[92vh] overflow-y-auto [&>button]:hidden">
            <SheetTitle className="sr-only">{t.cal_quick_book}</SheetTitle>
            <SheetDescription className="sr-only">{t.cal_quick_book}</SheetDescription>
            {form}
          </SheetContent>
        </Sheet>
      )}

      <SessionSheet session={selected} onClose={() => setSelected(null)} />

      <Dialog open={availOpen} onOpenChange={(o) => { setAvailOpen(o); if (!o) qc.invalidateQueries({ queryKey: ['coach', user?.id] }); }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto rounded-[4px]">
          <DialogTitle className="sr-only">{t.cal_manage_availability}</DialogTitle>
          <Availability />
        </DialogContent>
      </Dialog>
      <Dialog open={reqOpen} onOpenChange={(o) => { setReqOpen(o); if (!o) qc.invalidateQueries({ queryKey: ['coach', user?.id] }); }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto rounded-[4px]">
          <DialogTitle className="sr-only">{t.cal_requests}</DialogTitle>
          <BookingRequests />
        </DialogContent>
      </Dialog>
    </div>
  );
}
