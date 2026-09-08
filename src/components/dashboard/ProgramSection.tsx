import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/context/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Trash2, Send } from 'lucide-react';
import { getOrCreateConversation } from '@/lib/messaging';

interface Task {
  id: string;
  task_date: string;
  title: string;
  description: string | null;
  completed: boolean;
}
interface Program {
  id: string;
  title: string;
  description: string | null;
  status: 'draft' | 'sent';
  created_at: string;
  sent_at: string | null;
  tasks: Task[];
}

interface Props {
  relationshipId: string;
  athleteId: string;
}

export function ProgramSection({ relationshipId, athleteId }: Props) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [taskDrafts, setTaskDrafts] = useState<Record<string, { date: string; title: string; description: string }>>({});

  const load = async () => {
    const { data: progs } = await supabase
      .from('training_programs')
      .select('*')
      .eq('relationship_id', relationshipId)
      .order('created_at', { ascending: false });
    const list = ((progs as any[]) ?? []);
    const ids = list.map(p => p.id);
    let tasks: any[] = [];
    if (ids.length) {
      const { data } = await supabase.from('program_tasks').select('*').in('program_id', ids).order('task_date');
      tasks = (data as any[]) ?? [];
    }
    setPrograms(list.map(p => ({ ...p, tasks: tasks.filter(tk => tk.program_id === p.id) })));
  };

  useEffect(() => { load(); }, [relationshipId]);

  const createProgram = async () => {
    if (!newTitle.trim()) return;
    const { error } = await supabase.from('training_programs').insert({
      relationship_id: relationshipId,
      title: newTitle.trim(),
      description: newDesc.trim() || null,
    });
    if (error) { toast.error(error.message); return; }
    setNewTitle(''); setNewDesc('');
    load();
  };

  const draftFor = (pid: string) => taskDrafts[pid] ?? { date: '', title: '', description: '' };
  const setDraft = (pid: string, patch: Partial<{ date: string; title: string; description: string }>) =>
    setTaskDrafts(d => ({ ...d, [pid]: { ...draftFor(pid), ...patch } }));

  const addTask = async (pid: string) => {
    const d = draftFor(pid);
    if (!d.date || !d.title.trim()) return;
    const { error } = await supabase.from('program_tasks').insert({
      program_id: pid,
      task_date: d.date,
      title: d.title.trim(),
      description: d.description.trim() || null,
    });
    if (error) { toast.error(error.message); return; }
    setTaskDrafts(x => ({ ...x, [pid]: { date: '', title: '', description: '' } }));
    load();
  };

  const updateTask = async (taskId: string, patch: Partial<Task>) => {
    const { error } = await supabase.from('program_tasks').update(patch).eq('id', taskId);
    if (error) { toast.error(error.message); return; }
    load();
  };

  const removeTask = async (taskId: string) => {
    const { error } = await supabase.from('program_tasks').delete().eq('id', taskId);
    if (error) { toast.error(error.message); return; }
    load();
  };

  const sendProgram = async (p: Program) => {
    if (!user) return;
    const { error } = await supabase
      .from('training_programs')
      .update({ status: 'sent', sent_at: new Date().toISOString() })
      .eq('id', p.id);
    if (error) { toast.error(error.message); return; }
    try {
      const cid = await getOrCreateConversation(athleteId, user.id);
      await supabase.from('messages').insert({
        conversation_id: cid,
        sender_id: user.id,
        content: `${t.program_message_prefix} "${p.title}" — ${t.program_message_suffix}`,
      });
    } catch (e: any) {
      toast.error(e.message);
    }
    toast.success(t.program_sent_toast);
    load();
  };

  return (
    <section className="space-y-4">
      <h2 className="font-display text-xl">{t.program_title}</h2>

      <div className="border border-border rounded-lg p-4 space-y-3">
        <Input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder={t.program_new_title_ph} />
        <Textarea value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder={t.program_new_desc_ph} rows={2} />
        <Button onClick={createProgram} disabled={!newTitle.trim()}>{t.program_create}</Button>
      </div>

      {programs.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t.program_empty}</p>
      ) : (
        <div className="space-y-4">
          {programs.map(p => {
            const isDraft = p.status === 'draft';
            const d = draftFor(p.id);
            return (
              <div key={p.id} className="border border-border rounded-lg p-4 space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{p.title}</p>
                    {p.description && <p className="text-sm text-muted-foreground">{p.description}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase tracking-wide border border-border rounded-full px-2 py-0.5">
                      {isDraft ? t.program_status_draft : t.program_status_sent}
                    </span>
                    {isDraft && (
                      <Button size="sm" onClick={() => sendProgram(p)}>
                        <Send className="h-3.5 w-3.5 mr-1.5" /> {t.program_send}
                      </Button>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  {p.tasks.length === 0 ? (
                    <p className="text-sm text-muted-foreground">{t.program_no_tasks}</p>
                  ) : (
                    p.tasks.map(tk => (
                      <div key={tk.id} className="border border-border rounded p-2 space-y-2">
                        {isDraft ? (
                          <div className="flex flex-col sm:flex-row gap-2">
                            <Input
                              type="date"
                              value={tk.task_date}
                              onChange={e => updateTask(tk.id, { task_date: e.target.value })}
                              className="sm:w-44"
                            />
                            <Input
                              defaultValue={tk.title}
                              onBlur={e => e.target.value !== tk.title && updateTask(tk.id, { title: e.target.value })}
                            />
                            <Input
                              defaultValue={tk.description ?? ''}
                              placeholder={t.program_task_desc_ph}
                              onBlur={e => (e.target.value || null) !== tk.description && updateTask(tk.id, { description: e.target.value || null })}
                            />
                            <Button size="icon" variant="ghost" onClick={() => removeTask(tk.id)} aria-label={t.program_remove_task}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <div className="text-sm">
                            <span className="text-muted-foreground mr-2">{new Date(tk.task_date).toLocaleDateString()}</span>
                            <span>{tk.title}</span>
                            {tk.description && <p className="text-xs text-muted-foreground">{tk.description}</p>}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>

                {isDraft && (
                  <div className="flex flex-col sm:flex-row gap-2 pt-1">
                    <Input type="date" value={d.date} onChange={e => setDraft(p.id, { date: e.target.value })} className="sm:w-44" />
                    <Input value={d.title} onChange={e => setDraft(p.id, { title: e.target.value })} placeholder={t.program_task_title_ph} />
                    <Input value={d.description} onChange={e => setDraft(p.id, { description: e.target.value })} placeholder={t.program_task_desc_ph} />
                    <Button onClick={() => addTask(p.id)} disabled={!d.date || !d.title.trim()}>{t.program_add_task}</Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
