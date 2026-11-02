import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { db } from '@/lib/db';

type Report = { id: string; target_id: string; reason: string; contact: string | null; message: string | null; created_at: string };

/** Open "something is wrong / please remove" requests from visitors. */
export function ReportsList({ targetType, table, label, onChange }: { targetType: 'club' | 'event'; table: 'events' | 'club_listings'; label: (row: { title?: string; name?: string }) => string; onChange?: () => void }) {
  const [reports, setReports] = useState<Report[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    const { data } = await db.from('listing_reports').select('id, target_id, reason, contact, message, created_at').eq('target_type', targetType).eq('status', 'open').order('created_at');
    const rows = (data ?? []) as Report[];
    setReports(rows);
    if (rows.length) {
      const { data: t } = await db.from(table).select(table === 'events' ? 'id, title' : 'id, name').in('id', rows.map(r => r.target_id));
      setNames(Object.fromEntries(((t ?? []) as { id: string; title?: string; name?: string }[]).map(x => [x.id, label(x)])));
    }
  }, [targetType, table, label]);
  useEffect(() => { load(); }, [load]);

  const close = async (id: string, status: 'done' | 'dismissed') => { await db.from('listing_reports').update({ status }).eq('id', id); await load(); onChange?.(); };
  if (!reports.length) return null;

  return (
    <section>
      <h2 className="mb-3 text-2xl">Reports from visitors ({reports.length})</h2>
      <ul className="space-y-2">
        {reports.map(r => (
          <li key={r.id} className="flex flex-wrap items-start justify-between gap-3 bg-accent/10 p-4 text-sm">
            <div className="min-w-0">
              <p className="font-semibold">{r.reason === 'removal' ? 'Wants it removed' : 'Says something is wrong'}: {names[r.target_id] ?? r.target_id}</p>
              {r.message && <p className="mt-1">{r.message}</p>}
              <p className="mt-1 text-foreground-muted">{r.contact || 'No contact left'} · {new Date(r.created_at).toLocaleDateString()}</p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => close(r.id, 'done')}>Handled</Button>
              <Button size="sm" variant="outline" onClick={() => close(r.id, 'dismissed')}>Dismiss</Button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
