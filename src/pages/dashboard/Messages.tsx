import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, ShieldCheck, Inbox } from 'lucide-react';

interface Convo {
  id: string;
  athlete_id: string;
  coach_id: string;
  last_message_at: string;
  other: { id: string; full_name: string | null; avatar_url: string | null };
  last?: string;
}

interface Msg {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
}

const Messages = () => {
  const { user, profile } = useAuth();
  const [params, setParams] = useSearchParams();
  const [convos, setConvos] = useState<Convo[]>([]);
  const [activeId, setActiveId] = useState<string | null>(params.get('c'));
  const [messages, setMessages] = useState<Msg[]>([]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load conversations
  useEffect(() => {
    if (!user || !profile) return;
    (async () => {
      setLoading(true);
      const isCoach = profile.role === 'coach';
      const col = isCoach ? 'coach_id' : 'athlete_id';
      const otherCol = isCoach ? 'athlete_id' : 'coach_id';
      const { data } = await supabase
        .from('conversations')
        .select(`id, athlete_id, coach_id, last_message_at, other:profiles!conversations_${otherCol}_fkey(id, full_name, avatar_url)`)
        .eq(col, user.id)
        .order('last_message_at', { ascending: false });
      setConvos((data as any) ?? []);
      setLoading(false);
      if (!activeId && data && data.length > 0) {
        setActiveId((data[0] as any).id);
      }
    })();
  }, [user, profile]);

  // Realtime new conversations
  useEffect(() => {
    if (!user) return;
    const ch = supabase
      .channel('convo-list')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, () => {
        // reload list
        (async () => {
          if (!profile) return;
          const isCoach = profile.role === 'coach';
          const col = isCoach ? 'coach_id' : 'athlete_id';
          const otherCol = isCoach ? 'athlete_id' : 'coach_id';
          const { data } = await supabase
            .from('conversations')
            .select(`id, athlete_id, coach_id, last_message_at, other:profiles!conversations_${otherCol}_fkey(id, full_name, avatar_url)`)
            .eq(col, user.id)
            .order('last_message_at', { ascending: false });
          setConvos((data as any) ?? []);
        })();
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user, profile]);

  // Load messages for active
  useEffect(() => {
    if (!activeId) { setMessages([]); return; }
    (async () => {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', activeId)
        .order('created_at', { ascending: true });
      setMessages((data as Msg[]) ?? []);
      setTimeout(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight }), 50);
    })();
  }, [activeId]);

  // Realtime messages
  useEffect(() => {
    if (!activeId) return;
    const ch = supabase
      .channel(`msg-${activeId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${activeId}` }, (payload) => {
        setMessages(prev => [...prev, payload.new as Msg]);
        setTimeout(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' }), 50);
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [activeId]);

  const active = convos.find(c => c.id === activeId) || null;

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.trim() || !activeId || !user) return;
    const content = draft.trim();
    setDraft('');
    const { error } = await supabase.from('messages').insert({
      conversation_id: activeId,
      sender_id: user.id,
      content,
    });
    if (error) { setDraft(content); return; }
    await supabase.from('conversations').update({ last_message_at: new Date().toISOString() }).eq('id', activeId);
  };

  return (
    <div className="max-w-6xl space-y-6">
      <div>
        <h1 className="font-display text-3xl">Messages</h1>
        <p className="text-muted-foreground mt-1">All conversations happen through Zenit.</p>
      </div>

      <div className="surface overflow-hidden grid md:grid-cols-[280px_1fr] h-[calc(100vh-220px)] min-h-[500px]">
        <div className="border-r border-border overflow-y-auto">
          {loading ? (
            <p className="p-4 text-sm text-muted-foreground">Loading…</p>
          ) : convos.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground flex flex-col items-center">
              <Inbox className="h-6 w-6 mb-2 text-muted-foreground/50" />
              No conversations yet.
            </div>
          ) : convos.map(c => (
            <button
              key={c.id}
              onClick={() => { setActiveId(c.id); setParams({ c: c.id }); }}
              className={`w-full text-left p-4 border-b border-border flex gap-3 transition-colors ${
                c.id === activeId ? 'bg-gold/10' : 'hover:bg-secondary/50'
              }`}
            >
              <img
                src={c.other?.avatar_url || `https://i.pravatar.cc/150?u=${c.other?.id}`}
                alt=""
                className="h-10 w-10 rounded-full object-cover shrink-0"
              />
              <div className="min-w-0 flex-1">
                <p className="font-medium text-sm truncate">{c.other?.full_name || 'User'}</p>
                <p className="text-xs text-muted-foreground truncate mt-0.5">
                  {new Date(c.last_message_at).toLocaleDateString()}
                </p>
              </div>
            </button>
          ))}
        </div>

        <div className="flex flex-col min-h-0">
          {!active ? (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              Select a conversation
            </div>
          ) : (
            <>
              <div className="p-4 border-b border-border flex items-center gap-3">
                <img
                  src={active.other?.avatar_url || `https://i.pravatar.cc/150?u=${active.other?.id}`}
                  alt=""
                  className="h-9 w-9 rounded-full object-cover"
                />
                <p className="font-medium">{active.other?.full_name || 'User'}</p>
              </div>
              <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map(m => (
                  <div key={m.id} className={`flex ${m.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] px-4 py-2.5 text-sm ${
                      m.sender_id === user?.id
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary'
                    }`}>
                      <p className="whitespace-pre-wrap">{m.content}</p>
                      <p className={`text-[10px] mt-1 ${m.sender_id === user?.id ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                        {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="px-4 py-2 border-t border-border flex items-center gap-2 text-[11px] text-muted-foreground bg-background-secondary/50">
                <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
                <span>All communication happens through Zenit. Do not share personal contact details.</span>
              </div>
              <form onSubmit={send} className="p-3 border-t border-border flex gap-2">
                <Input value={draft} onChange={e => setDraft(e.target.value)} placeholder="Write a reply..." />
                <Button type="submit" size="icon"><Send className="h-4 w-4" /></Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Messages;
