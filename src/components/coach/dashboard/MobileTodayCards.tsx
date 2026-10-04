import { useState } from 'react';
import { Check, MapPin, Plus, X } from 'lucide-react';
import { toast } from 'sonner';
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet';
import { useLanguage } from '@/context/LanguageContext';
import { useCoachTz, useSessionStatus, type CalSession } from '@/hooks/coach/useCoachCalendar';
import { useAddNote } from '@/hooks/coach/useCoachClients';
import { LOCALES, portalBtnPrimary } from '@/components/coach/clients/shared';
import { labelDate, toDateStr, toTimeStr } from '@/lib/tz';

/** Mobile "Today" session cards with large touch targets. */
export function MobileTodayCards({ sessions }: { sessions: CalSession[] }) {
  const { t } = useLanguage();
  const tz = useCoachTz();
  const setStatus = useSessionStatus();
  const [noteFor, setNoteFor] = useState<CalSession | null>(null);
  const now = Date.now();
  const nextId = sessions.find((s) => s.status === 'scheduled' && new Date(s.starts_at).getTime() >= now)?.id;

  const chip = (s: CalSession): [string, string] => {
    if (s.status === 'attended') return [t.dash_chip_done, 'bg-portal-bg text-portal-success'];
    if (s.status === 'no_show') return [t.dash_chip_noshow, 'bg-portal-bg text-portal-coral-text'];
    if (s.status === 'cancelled') return [t.dash_chip_cancelled, 'bg-portal-bg text-portal-muted line-through'];
    if (s.id === nextId) return [t.dash_chip_next, 'bg-portal-selected text-portal-ink border border-portal-selected-border'];
    if (s.kind === 'trial') return [t.dash_chip_trial, 'bg-portal-copper-tint text-portal-ink border border-portal-copper'];
    return [t.dash_session, 'bg-portal-bg text-portal-muted-strong'];
  };
  const mark = (id: string, status: 'attended' | 'no_show') =>
    setStatus.mutate({ id, status }, { onSuccess: () => toast.success(t.cal_updated), onError: () => toast.error(t.crm_error) });

  return (
    <>
      <ul className="space-y-3">
        {sessions.map((s) => {
          const [label, cls] = chip(s);
          const past = s.status === 'scheduled' && new Date(s.starts_at).getTime() <= now;
          return (
            <li key={s.id} data-testid="today-card" className="motion-card bg-portal-card border border-portal-border rounded-[4px] p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-display text-2xl leading-none text-portal-ink">{toTimeStr(s.starts_at, tz)}–{toTimeStr(s.ends_at, tz)}</p>
                  <p className={`mt-1.5 text-base truncate ${s.status === 'cancelled' ? 'line-through text-portal-muted' : 'text-portal-ink'}`}>{s.client?.display_name ?? '—'}</p>
                  <p className="text-sm text-portal-muted flex items-center gap-1 truncate">
                    {s.kind === 'trial' ? t.dash_chip_trial : t.dash_session}
                    {s.location && <><span>·</span><MapPin className="h-3.5 w-3.5 shrink-0" />{s.location}</>}
                  </p>
                </div>
                <span className={`shrink-0 text-[11px] font-display uppercase tracking-[0.08em] px-2 py-1 rounded-[4px] ${cls}`}>{label}</span>
              </div>
              <div className="flex gap-2 mt-3">
                {past && (
                  <>
                    <button disabled={setStatus.isPending} onClick={() => mark(s.id, 'attended')}
                      className="flex-1 h-11 inline-flex items-center justify-center gap-1.5 rounded-[4px] bg-portal-copper hover:bg-portal-copper-hover text-portal-on-copper text-sm font-medium">
                      <Check className="h-4 w-4" />{t.dash_mark_attended}
                    </button>
                    <button disabled={setStatus.isPending} onClick={() => mark(s.id, 'no_show')}
                      className="flex-1 h-11 inline-flex items-center justify-center gap-1.5 rounded-[4px] border border-portal-border text-portal-ink text-sm">
                      <X className="h-4 w-4" />{t.dash_chip_noshow}
                    </button>
                  </>
                )}
                <button onClick={() => setNoteFor(s)}
                  className={`${past ? '' : 'flex-1'} h-11 px-4 inline-flex items-center justify-center gap-1.5 rounded-[4px] border border-portal-border text-portal-ink text-sm`}>
                  <Plus className="h-4 w-4" />{t.dash_note}
                </button>
              </div>
            </li>
          );
        })}
      </ul>
      <Sheet open={!!noteFor} onOpenChange={(o) => !o && setNoteFor(null)}>
        <SheetContent side="bottom" className="coach-portal bg-portal-card border-portal-border">
          {noteFor && <NoteForm key={noteFor.id} session={noteFor} onDone={() => setNoteFor(null)} />}
        </SheetContent>
      </Sheet>
    </>
  );
}

function NoteForm({ session, onDone }: { session: CalSession; onDone: () => void }) {
  const { t, lang } = useLanguage();
  const tz = useCoachTz();
  const add = useAddNote(session.client_id);
  const [text, setText] = useState('');
  const prefix = labelDate(toDateStr(session.starts_at, tz), LOCALES[lang], { day: '2-digit', month: 'short' }).replace(/\.$/, '');
  const save = (e: React.FormEvent) => {
    e.preventDefault();
    const v = text.trim().slice(0, 2000);
    if (!v) return;
    add.mutate(`${prefix} · ${v}`, { onSuccess: () => { toast.success(t.dash_note_saved); onDone(); }, onError: () => toast.error(t.crm_error) });
  };
  return (
    <form onSubmit={save} className="space-y-3">
      <SheetTitle className="font-display uppercase tracking-[0.1em] text-portal-ink">{t.dash_note_title}</SheetTitle>
      <SheetDescription className="text-sm text-portal-muted">{session.client?.display_name} · {prefix}</SheetDescription>
      <textarea autoFocus value={text} onChange={(e) => setText(e.target.value)} rows={4} maxLength={2000}
        placeholder={t.dash_note_ph}
        className="w-full rounded-[4px] border border-portal-input bg-portal-card px-3 py-2 text-base text-portal-ink focus:outline-none focus:border-portal-copper" />
      <button type="submit" disabled={add.isPending || !text.trim()} className={`${portalBtnPrimary} w-full h-11`}>{t.dash_note_save}</button>
    </form>
  );
}
