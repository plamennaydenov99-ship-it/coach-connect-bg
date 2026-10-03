import { useMemo, useState } from 'react';
import { ArrowUpDown } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import type { ClientSummary } from '@/hooks/coach/useCoachClients';
import { Avatar, fmtDate, fmtDateTime, isToday, stageKey } from './shared';

type SortKey = 'name' | 'next';

export function ClientTable({ clients, onOpen }: { clients: ClientSummary[]; onOpen: (id: string) => void }) {
  const { t, lang } = useLanguage();
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: 'name', dir: 1 });

  const rows = useMemo(() => {
    const r = [...clients];
    r.sort((a, b) => {
      if (sort.key === 'name') return a.display_name.localeCompare(b.display_name) * sort.dir;
      const av = a.nextSession?.starts_at ?? '9999';
      const bv = b.nextSession?.starts_at ?? '9999';
      return av.localeCompare(bv) * sort.dir;
    });
    return r;
  }, [clients, sort]);

  const toggle = (key: SortKey) => setSort((s) => ({ key, dir: s.key === key ? ((-s.dir) as 1 | -1) : 1 }));
  const th = 'text-left font-display uppercase tracking-[0.12em] text-[11px] text-portal-muted font-normal px-3 py-2';

  return (
    <div className="overflow-x-auto bg-portal-card border border-portal-border rounded-[4px]">
      <table className="w-full text-sm min-w-[760px]">
        <thead className="border-b border-portal-border">
          <tr>
            <th className={th}><button className="inline-flex items-center gap-1" onClick={() => toggle('name')}>{t.crm_name}<ArrowUpDown className="h-3 w-3" /></button></th>
            <th className={th}>{t.crm_stage}</th>
            <th className={th}>{t.crm_goal}</th>
            <th className={th}><button className="inline-flex items-center gap-1" onClick={() => toggle('next')}>{t.crm_next_session}<ArrowUpDown className="h-3 w-3" /></button></th>
            <th className={th}>{t.crm_sessions}</th>
            <th className={th}>{t.crm_open_tasks}</th>
            <th className={th}>{t.crm_last_updated}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((c) => (
            <tr key={c.id} onClick={() => onOpen(c.id)} className="border-b border-portal-border last:border-0 cursor-pointer hover:bg-portal-bg">
              <td className="px-3 py-2.5"><div className="flex items-center gap-2"><Avatar name={c.display_name} size={28} /><span className="font-medium">{c.display_name}</span></div></td>
              <td className="px-3 py-2.5 text-portal-muted-strong">{t[stageKey(c.stage)]}</td>
              <td className="px-3 py-2.5 text-portal-muted-strong max-w-[220px] truncate">{c.goal || '—'}</td>
              <td className={`px-3 py-2.5 ${c.nextSession && isToday(c.nextSession.starts_at) ? 'text-portal-copper font-medium' : 'text-portal-muted-strong'}`}>
                {c.nextSession ? fmtDateTime(c.nextSession.starts_at, lang) : '—'}
              </td>
              <td className="px-3 py-2.5">{c.attendedCount}</td>
              <td className="px-3 py-2.5">{c.openTasks}</td>
              <td className="px-3 py-2.5 text-portal-muted-strong">{fmtDate(c.updated_at, lang)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
