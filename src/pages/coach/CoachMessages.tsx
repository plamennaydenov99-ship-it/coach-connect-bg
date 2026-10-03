import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Inbox, Send, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/context/LanguageContext';
import { Skeleton } from '@/components/ui/skeleton';
import { useCoachTz } from '@/hooks/coach/useCoachCalendar';
import { useCoachInbox } from '@/hooks/coach/useCoachDashboard';
import { useUnreadCount } from '@/hooks/coach/useUnreadCount';
import { Avatar, LOCALES } from '@/components/coach/clients/shared';
import { toDateStr, toTimeStr } from '@/lib/tz';

interface Msg { id: string; conversation_id: string; sender_id: string; content: string; created_at: string; read_at: string | null }

export default function CoachMessages() {
  const { t, lang } = useLanguage();
  const tz = useCoachTz();
  const [params, setParams] = useSearchParams();
  const activeId = params.get('c');
  const { data: convos, isLoading } = useCoachInbox(100);
  const { byConvo } = useUnreadCount();
  const active = convos?.find((c) => c.id === activeId);

  const when = (iso: string) =>
    toDateStr(iso, tz) === toDateStr(new Date(), tz)
      ? toTimeStr(iso, tz)
      : new Date(iso).toLocaleDateString(LOCALES[lang], { timeZone: tz, day: '2-digit', month: 'short' });

  return (
    <div className="bg-portal-card border border-portal-border rounded-[4px] grid md:grid-cols-[320px_1fr] h-[calc(100vh-11rem)] md:h-[calc(100vh-8rem)] overflow-hidden">
      <div className={`${activeId ? 'hidden md:flex' : 'flex'} flex-col border-r border-portal-border min-h-0`}>
        <div className="px-4 h-14 flex items-center border-b border-portal-border font-display uppercase tracking-[0.1em] text-portal-ink">{t.portal_messages}</div>
        <div className="overflow-y-auto flex-1">
          {isLoading ? <div className="p-4 space-y-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-12" />)}</div>
            : !convos?.length ? (
              <div className="p-8 text-center text-sm text-portal-muted"><Inbox className="h-6 w-6 mx-auto mb-2" />{t.cmsg_empty}</div>
            ) : convos.map((c) => {
              const unread = (byConvo.get(c.id)?.length ?? 0) > 0;
              return (
                <button key={c.id} onClick={() => setParams({ c: c.id })}
                  className={`w-full text-left px-4 py-3 border-b border-portal-border flex gap-3 items-center ${c.id === activeId ? 'bg-portal-selected' : 'hover:bg-portal-bg'}`}>
                  <Avatar name={c.name} size={36} />
                  <span className="flex-1 min-w-0">
                    <span className="flex justify-between gap-2">
                      <span className={`truncate text-sm text-portal-ink ${unread ? 'font-semibold' : ''}`}>{c.name}</span>
                      <span className="text-xs text-portal-muted shrink-0">{when(c.last_message_at)}</span>
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="block truncate text-xs text-portal-muted flex-1">{c.preview ?? ''}</span>
                      {unread && <span aria-label={t.cmsg_unread} className="w-2 h-2 rounded-full bg-portal-copper shrink-0" />}
                    </span>
                  </span>
                </button>
              );
            })}
        </div>
      </div>
      <div className={`${activeId ? 'flex' : 'hidden md:flex'} flex-col min-h-0`}>
        {!activeId ? (
          <div className="flex-1 flex items-center justify-center text-sm text-portal-muted">{t.cmsg_select}</div>
        ) : (
          <Thread key={activeId} id={activeId} name={active?.name ?? ''} onBack={() => setParams({})} />
        )}
      </div>
    </div>
  );
}

function Thread({ id, name, onBack }: { id: string; name: string; onBack: () => void }) {
  const { t } = useLanguage();
  const { user } = useAuth();
  const tz = useCoachTz();
  const qc = useQueryClient();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const key = ['coach', user?.id, 'thread', id];

  const { data: messages = [], isLoading } = useQuery({
    queryKey: key,
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from('messages').select('*').eq('conversation_id', id).order('created_at');
      if (error) throw error;
      return data as Msg[];
    },
  });

  useEffect(() => {
    const ch = supabase.channel(`cthread-${id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${id}` }, (p) => {
        qc.setQueryData<Msg[]>(key, (prev = []) => prev.some((m) => m.id === (p.new as Msg).id) ? prev : [...prev, p.new as Msg]);
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Mark the other participant's messages as read.
  const unreadIds = messages.filter((m) => m.sender_id !== user?.id && !m.read_at).map((m) => m.id).join(',');
  useEffect(() => {
    if (!user || !unreadIds) return;
    supabase.from('messages').update({ read_at: new Date().toISOString() })
      .eq('conversation_id', id).neq('sender_id', user.id).is('read_at', null)
      .then(({ error }) => { if (!error) qc.invalidateQueries({ queryKey: ['coach', user.id, 'unread'] }); });
  }, [unreadIds, id, user, qc]);

  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight }); }, [messages.length]);

  const send = async () => {
    const content = draft.trim().slice(0, 4000);
    if (!content || !user || sending) return;
    setSending(true);
    const { data, error } = await supabase.from('messages').insert({ conversation_id: id, sender_id: user.id, content }).select().single();
    setSending(false);
    if (error) { toast.error(t.crm_error); return; }
    setDraft('');
    qc.setQueryData<Msg[]>(key, (prev = []) => prev.some((m) => m.id === data.id) ? prev : [...prev, data as Msg]);
    qc.invalidateQueries({ queryKey: ['coach', user.id, 'inbox'] });
  };

  return (
    <>
      <div className="h-14 px-3 md:px-4 flex items-center gap-3 border-b border-portal-border">
        <button onClick={onBack} aria-label={t.cmsg_back} className="md:hidden h-9 w-9 flex items-center justify-center rounded-[4px] hover:bg-portal-bg"><ArrowLeft className="h-4 w-4" /></button>
        <Avatar name={name} size={32} />
        <span className="font-medium text-portal-ink truncate">{name}</span>
      </div>
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-portal-bg">
        {isLoading ? <Skeleton className="h-16 w-2/3" /> : messages.map((m) => {
          const mine = m.sender_id === user?.id;
          return (
            <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] px-3.5 py-2 text-sm rounded-[4px] border ${mine ? 'bg-portal-selected border-portal-selected-border' : 'bg-portal-card border-portal-border'} text-portal-ink`}>
                <p className="whitespace-pre-wrap break-words">{m.content}</p>
                <p className="text-[10px] mt-1 text-portal-muted">{toTimeStr(m.created_at, tz)}</p>
              </div>
            </div>
          );
        })}
      </div>
      <div className="px-4 py-1.5 border-t border-portal-border flex items-center gap-2 text-[11px] text-portal-muted">
        <ShieldCheck className="h-3.5 w-3.5 shrink-0" /><span>{t.dashmsg_safety}</span>
      </div>
      <form onSubmit={(e) => { e.preventDefault(); send(); }} className="p-3 border-t border-portal-border flex gap-2 items-end">
        <textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={2} maxLength={4000}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
          placeholder={t.dashmsg_reply_ph}
          className="flex-1 resize-none rounded-[4px] border border-portal-input bg-portal-card px-3 py-2 text-sm text-portal-ink focus:outline-none focus:border-portal-copper" />
        <button type="submit" disabled={sending || !draft.trim()}
          className="h-10 px-4 inline-flex items-center gap-1.5 rounded-[4px] bg-portal-copper hover:bg-portal-copper-hover text-portal-on-copper font-display uppercase tracking-[0.1em] text-sm disabled:opacity-50">
          <Send className="h-4 w-4" />{t.cmsg_send}
        </button>
      </form>
    </>
  );
}
