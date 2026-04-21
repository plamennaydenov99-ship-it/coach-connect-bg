import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send } from 'lucide-react';

interface Msg { from: 'me' | 'them'; text: string; time: string; }
interface Convo { id: string; name: string; avatar: string; last: string; time: string; messages: Msg[]; }

const CONVOS: Convo[] = [
  {
    id: '1',
    name: 'Sofia M.',
    avatar: 'https://i.pravatar.cc/300?img=20',
    last: 'Perfect, see you Tuesday at 18:30!',
    time: '2h',
    messages: [
      { from: 'them', text: 'Hi! Would you have any availability next Tuesday evening for a 1-hour session?', time: '10:14' },
      { from: 'me', text: 'Hey Sofia — yes, I have 18:30 free. Would that work?', time: '10:32' },
      { from: 'them', text: 'Perfect, see you Tuesday at 18:30!', time: '10:40' },
    ],
  },
  {
    id: '2',
    name: 'Diogo R.',
    avatar: 'https://i.pravatar.cc/300?img=33',
    last: 'I\'m an intermediate player, mostly doubles.',
    time: '1d',
    messages: [
      { from: 'them', text: 'Looking to start training my serve. Do you focus on technique?', time: 'Yesterday 14:01' },
      { from: 'me', text: 'Absolutely — serve mechanics are one of my main areas. What\'s your level?', time: 'Yesterday 14:18' },
      { from: 'them', text: 'I\'m an intermediate player, mostly doubles.', time: 'Yesterday 14:22' },
    ],
  },
  {
    id: '3',
    name: 'Mariana C.',
    avatar: 'https://i.pravatar.cc/300?img=45',
    last: 'Goal is to prep for an amateur league.',
    time: '2d',
    messages: [
      { from: 'them', text: 'Are you taking new clients in October?', time: 'Mon 09:00' },
      { from: 'them', text: 'Goal is to prep for an amateur league.', time: 'Mon 09:01' },
    ],
  },
];

const Messages = () => {
  const [activeId, setActiveId] = useState('1');
  const [draft, setDraft] = useState('');
  const [convos, setConvos] = useState(CONVOS);
  const active = convos.find(c => c.id === activeId)!;

  const send = () => {
    if (!draft.trim()) return;
    setConvos(prev => prev.map(c => c.id === activeId
      ? { ...c, messages: [...c.messages, { from: 'me', text: draft.trim(), time: 'Now' }], last: draft.trim(), time: 'Now' }
      : c));
    setDraft('');
  };

  return (
    <div className="max-w-6xl space-y-6">
      <div>
        <h1 className="font-display text-3xl">Messages</h1>
        <p className="text-muted-foreground mt-1">Reply to client enquiries.</p>
      </div>

      <div className="surface overflow-hidden grid md:grid-cols-[280px_1fr] h-[calc(100vh-220px)] min-h-[500px]">
        {/* List */}
        <div className="border-r border-border overflow-y-auto">
          {convos.map(c => (
            <button
              key={c.id}
              onClick={() => setActiveId(c.id)}
              className={`w-full text-left p-4 border-b border-border flex gap-3 transition-colors ${
                c.id === activeId ? 'bg-primary/10' : 'hover:bg-secondary/50'
              }`}
            >
              <img src={c.avatar} alt={c.name} className="h-10 w-10 rounded-full object-cover shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="flex justify-between gap-2 items-center">
                  <p className="font-medium text-sm truncate">{c.name}</p>
                  <span className="text-xs text-muted-foreground shrink-0">{c.time}</span>
                </div>
                <p className="text-xs text-muted-foreground truncate mt-0.5">{c.last}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Thread */}
        <div className="flex flex-col min-h-0">
          <div className="p-4 border-b border-border flex items-center gap-3">
            <img src={active.avatar} alt={active.name} className="h-9 w-9 rounded-full object-cover" />
            <p className="font-medium">{active.name}</p>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {active.messages.map((m, i) => (
              <div key={i} className={`flex ${m.from === 'me' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${
                  m.from === 'me'
                    ? 'bg-primary text-primary-foreground rounded-br-sm'
                    : 'bg-secondary rounded-bl-sm'
                }`}>
                  <p>{m.text}</p>
                  <p className={`text-[10px] mt-1 ${m.from === 'me' ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>{m.time}</p>
                </div>
              </div>
            ))}
          </div>
          <form
            onSubmit={(e) => { e.preventDefault(); send(); }}
            className="p-3 border-t border-border flex gap-2"
          >
            <Input value={draft} onChange={e => setDraft(e.target.value)} placeholder="Write a reply..." />
            <Button type="submit" size="icon"><Send className="h-4 w-4" /></Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Messages;
