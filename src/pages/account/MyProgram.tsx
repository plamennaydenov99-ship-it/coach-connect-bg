import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/context/LanguageContext';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';

interface Task {
  id: string;
  program_id: string;
  task_date: string;
  title: string;
  description: string | null;
  completed: boolean;
}
interface Program {
  id: string;
  title: string;
  description: string | null;
  sent_at: string | null;
  coachName: string;
  tasks: Task[];
}

const MyProgram = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!user) return;
    const { data: rels } = await supabase
      .from('coach_clients')
      .select('id, coach:profiles!coach_clients_coach_id_fkey(full_name)')
      .eq('athlete_id', user.id);
    const relList = (rels as any[]) ?? [];
    if (relList.length === 0) { setPrograms([]); setLoading(false); return; }

    const { data: progs } = await supabase
      .from('training_programs')
      .select('*')
      .in('relationship_id', relList.map(r => r.id))
      .eq('status', 'sent')
      .order('sent_at', { ascending: false });
    const progList = (progs as any[]) ?? [];
    if (progList.length === 0) { setPrograms([]); setLoading(false); return; }

    const { data: tasks } = await supabase
      .from('program_tasks')
      .select('*')
      .in('program_id', progList.map(p => p.id))
      .order('task_date');

    setPrograms(progList.map(p => ({
      ...p,
      coachName: relList.find(r => r.id === p.relationship_id)?.coach?.full_name ?? t.program_unknown_coach,
      tasks: ((tasks as any[]) ?? []).filter(tk => tk.program_id === p.id),
    })));
    setLoading(false);
  };

  useEffect(() => { load(); }, [user]);

  const toggle = async (task: Task) => {
    const { error } = await supabase.from('program_tasks').update({ completed: !task.completed }).eq('id', task.id);
    if (error) { toast.error(error.message); return; }
    setPrograms(ps => ps.map(p => ({
      ...p,
      tasks: p.tasks.map(tk => tk.id === task.id ? { ...tk, completed: !tk.completed } : tk),
    })));
  };

  const byCoach = programs.reduce<Record<string, Program[]>>((acc, p) => {
    (acc[p.coachName] ||= []).push(p);
    return acc;
  }, {});

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h1 className="font-display text-3xl">{t.myprogram_title}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t.myprogram_sub}</p>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">{t.clients_loading}</p>
      ) : programs.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t.myprogram_empty}</p>
      ) : (
        Object.entries(byCoach).map(([coach, list]) => (
          <section key={coach} className="space-y-4">
            <h2 className="font-display text-xl">{coach}</h2>
            {list.map(p => (
              <div key={p.id} className="border border-border rounded-lg p-4 space-y-3">
                <div>
                  <p className="font-medium">{p.title}</p>
                  {p.description && <p className="text-sm text-muted-foreground">{p.description}</p>}
                </div>
                {p.tasks.length === 0 ? (
                  <p className="text-sm text-muted-foreground">{t.program_no_tasks}</p>
                ) : (
                  <div className="divide-y divide-border">
                    {p.tasks.map(tk => (
                      <label key={tk.id} className="flex items-start gap-3 py-2 cursor-pointer">
                        <Checkbox checked={tk.completed} onCheckedChange={() => toggle(tk)} className="mt-0.5" />
                        <span className="flex-1">
                          <span className="text-xs text-muted-foreground block">{new Date(tk.task_date).toLocaleDateString()}</span>
                          <span className={`text-sm ${tk.completed ? 'line-through text-muted-foreground' : ''}`}>{tk.title}</span>
                          {tk.description && <span className="block text-xs text-muted-foreground">{tk.description}</span>}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </section>
        ))
      )}
    </div>
  );
};

export default MyProgram;
