import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { LayoutGrid, List, Plus, Search, Users } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { useLanguage } from '@/context/LanguageContext';
import { useClientList } from '@/hooks/coach/useCoachClients';
import { ClientBoard } from '@/components/coach/clients/ClientBoard';
import { ClientTable } from '@/components/coach/clients/ClientTable';
import { ClientDrawer } from '@/components/coach/clients/ClientDrawer';
import { NewClientDialog } from '@/components/coach/clients/NewClientDialog';
import { portalBtnPrimary, portalInput } from '@/components/coach/clients/shared';

type View = 'board' | 'table';
const VIEW_KEY = 'lokka_coach_clients_view';

export default function CoachClients() {
  const { t } = useLanguage();
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: clients = [], isLoading, error } = useClientList();
  const [q, setQ] = useState('');
  const [view, setView] = useState<View>(() => (localStorage.getItem(VIEW_KEY) as View) || 'board');
  const [showArchived, setShowArchived] = useState(false);
  const [newOpen, setNewOpen] = useState(false);

  const setViewPersist = (v: View) => { setView(v); localStorage.setItem(VIEW_KEY, v); };
  const open = (cid: string) => navigate(`${peoplePath}/${cid}`);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return clients.filter((c) => !s || c.display_name.toLowerCase().includes(s) || (c.goal ?? '').toLowerCase().includes(s));
  }, [clients, q]);

  const active = clients.filter((c) => c.stage !== 'archived');
  const forBoard = filtered.filter((c) => c.stage !== 'archived');
  const forTable = showArchived ? filtered : forBoard;

  const toggleBtn = (v: View, Icon: typeof List, label: string) => (
    <button
      onClick={() => setViewPersist(v)}
      className={`inline-flex items-center gap-1.5 h-9 px-3 text-sm border rounded-[4px] ${view === v ? 'bg-portal-selected border-portal-selected-border text-portal-ink' : 'border-transparent text-portal-muted-strong hover:text-portal-ink'}`}
    >
      <Icon className="h-4 w-4" />{label}
    </button>
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="font-display text-3xl uppercase tracking-[0.08em] text-portal-ink">{t.crm_clients}</h1>
        <span className="text-sm text-portal-muted">{active.length} {t.crm_total}</span>
        <div className="flex-1" />
        <button className={portalBtnPrimary} onClick={() => setNewOpen(true)}><Plus className="h-4 w-4" />{t.crm_new_client}</button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-portal-muted" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t.crm_search_ph} className={`${portalInput} pl-9`} />
        </div>
        <div className="flex gap-1 p-0.5 rounded-[4px] border border-portal-border bg-portal-card">
          {toggleBtn('board', LayoutGrid, t.crm_view_board)}
          {toggleBtn('table', List, t.crm_view_table)}
        </div>
        {view === 'table' && (
          <label className="flex items-center gap-2 text-sm text-portal-muted-strong">
            <Switch checked={showArchived} onCheckedChange={setShowArchived} />
            {t.crm_show_archived}
          </label>
        )}
      </div>

      {isLoading ? (
        <div className="flex gap-3 overflow-hidden">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="w-[272px] md:flex-1 shrink-0 space-y-2">
              <Skeleton className="h-4 w-24" /><Skeleton className="h-28 w-full" /><Skeleton className="h-28 w-full" />
            </div>
          ))}
        </div>
      ) : error ? (
        <p className="text-sm text-portal-coral-text">{t.crm_error}</p>
      ) : clients.length === 0 ? (
        <div className="bg-portal-card border border-portal-border rounded-[4px] p-10 text-center space-y-3">
          <Users className="h-8 w-8 mx-auto text-portal-muted" />
          <h2 className="font-display text-xl uppercase tracking-[0.08em]">{t.crm_empty_title}</h2>
          <p className="text-sm text-portal-muted max-w-sm mx-auto">{t.crm_empty_body}</p>
          <button className={portalBtnPrimary} onClick={() => setNewOpen(true)}><Plus className="h-4 w-4" />{t.crm_new_client}</button>
        </div>
      ) : view === 'board' ? (
        <>
          {q && forBoard.length === 0 && <p className="text-sm text-portal-muted">{t.crm_no_match}</p>}
          <ClientBoard clients={forBoard} onOpen={open} />
        </>
      ) : forTable.length === 0 ? (
        <p className="text-sm text-portal-muted">{t.crm_no_match}</p>
      ) : (
        <ClientTable clients={forTable} onOpen={open} />
      )}

      <NewClientDialog open={newOpen} onOpenChange={setNewOpen} onCreated={open} />
      <ClientDrawer clientId={id} onClose={() => navigate(peoplePath)} />
    </div>
  );
}
