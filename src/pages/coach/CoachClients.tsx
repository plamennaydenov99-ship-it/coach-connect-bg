import { useStaffPaths } from '@/context/StaffRoleContext';
import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { LayoutGrid, List, MoreHorizontal, Plus, Search, Users } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/useAuth';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { useLanguage } from '@/context/LanguageContext';
import { pipelineLabel, stageLabel, useArchivePipeline, useClientList, useCreatePipeline, usePipelines, useRenamePipeline } from '@/hooks/coach/useCoachClients';
import { ClientBoard, categoryColumns, type BoardColumn } from '@/components/coach/clients/ClientBoard';
import { ClientTable } from '@/components/coach/clients/ClientTable';
import { ClientDrawer } from '@/components/coach/clients/ClientDrawer';
import { NewClientDialog } from '@/components/coach/clients/NewClientDialog';
import { portalBtnGhost, portalBtnPrimary, portalInput, portalLabel } from '@/components/coach/clients/shared';

type View = 'board' | 'table';
const VIEW_KEY = 'lokka_coach_clients_view';
const pipelineKey = (uid?: string) => `lokka_crm_pipeline_${uid ?? 'anon'}`;
const readLS = (k: string) => { try { return localStorage.getItem(k); } catch { return null; } };
const writeLS = (k: string, v: string) => { try { localStorage.setItem(k, v); } catch { /* ignore */ } };

export default function CoachClients() {
  const { t } = useLanguage();
  const { base, peoplePath } = useStaffPaths();
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: clients = [], isLoading, error } = useClientList();
  const { data: pipelines = [] } = usePipelines();
  const createPipeline = useCreatePipeline();
  const renamePipeline = useRenamePipeline();
  const archivePipeline = useArchivePipeline();
  const [selected, setSelected] = useState<string>(() => readLS(pipelineKey(user?.id)) || 'all');
  const selectPipeline = (id: string) => { setSelected(id); writeLS(pipelineKey(user?.id), id); };
  const current = pipelines.find((p) => p.id === selected) ?? null;
  const [nameDialog, setNameDialog] = useState<{ mode: 'new' | 'rename'; id?: string; name: string } | null>(null);
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
  const inScope = current ? filtered.filter((c) => c.pipeline_id === current.id) : filtered;
  const forBoard = inScope.filter((c) => c.stage !== 'archived');
  const columns: BoardColumn[] = useMemo(
    () => current
      ? current.stages.filter((s) => s.category !== 'archived').map((s) => ({ key: s.id, label: stageLabel(s, t), category: s.category, stage: s }))
      : categoryColumns(t),
    [current, t],
  );

  const submitName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameDialog || !nameDialog.name.trim()) return;
    try {
      if (nameDialog.mode === 'new') {
        const p = await createPipeline.mutateAsync(nameDialog.name);
        selectPipeline(p.id);
      } else if (nameDialog.id) {
        await renamePipeline.mutateAsync({ id: nameDialog.id, name: nameDialog.name });
      }
      setNameDialog(null);
    } catch { toast.error(t.crm_error); }
  };

  const archive = (id: string) => {
    const p = pipelines.find((x) => x.id === id);
    if (!p || p.is_default) return;
    if (clients.some((c) => c.pipeline_id === id && c.stage !== 'archived')) { toast.error(t.crm_pipeline_has_clients); return; }
    archivePipeline.mutate(id, {
      onSuccess: () => { if (selected === id) selectPipeline('all'); },
      onError: () => toast.error(t.crm_error),
    });
  };

  const chip = (id: string, label: string) => (
    <button key={id} onClick={() => selectPipeline(id)}
      className={`h-8 px-3 text-sm border rounded-[4px] whitespace-nowrap ${selected === id || (id === 'all' && !current) ? 'bg-portal-selected border-portal-selected-border text-portal-ink' : 'border-portal-border bg-portal-card text-portal-muted-strong hover:text-portal-ink'}`}>
      {label}
    </button>
  );
  const forTable = showArchived ? inScope : forBoard;

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

      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {chip('all', t.crm_all_pipelines)}
        {pipelines.map((p) => chip(p.id, pipelineLabel(p, t)))}
        <button onClick={() => setNameDialog({ mode: 'new', name: '' })} className="h-8 px-3 text-sm inline-flex items-center gap-1 text-portal-muted-strong hover:text-portal-ink whitespace-nowrap">
          <Plus className="h-3.5 w-3.5" />{t.crm_new_pipeline}
        </button>
        {current && (
          <DropdownMenu>
            <DropdownMenuTrigger className="h-8 w-8 flex items-center justify-center rounded-[4px] text-portal-muted-strong hover:text-portal-ink" aria-label={t.crm_pipeline}>
              <MoreHorizontal className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="coach-portal bg-portal-card border-portal-border text-portal-ink">
              <DropdownMenuItem onClick={() => setNameDialog({ mode: 'rename', id: current.id, name: pipelineLabel(current, t) })}>{t.crm_rename}</DropdownMenuItem>
              {!current.is_default && <DropdownMenuItem onClick={() => archive(current.id)}>{t.crm_archive_pipeline}</DropdownMenuItem>}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
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
          <ClientBoard clients={forBoard} columns={columns} onOpen={open} />
        </>
      ) : forTable.length === 0 ? (
        <p className="text-sm text-portal-muted">{t.crm_no_match}</p>
      ) : (
        <ClientTable clients={forTable} onOpen={open} />
      )}

      <NewClientDialog open={newOpen} onOpenChange={setNewOpen} onCreated={open} pipelineId={current?.id ?? null} />
      <Dialog open={!!nameDialog} onOpenChange={(o) => !o && setNameDialog(null)}>
        <DialogContent className="coach-portal bg-portal-card border-portal-border rounded-[4px] max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display uppercase tracking-[0.1em] text-portal-ink">{nameDialog?.mode === 'rename' ? t.crm_rename : t.crm_new_pipeline}</DialogTitle>
          </DialogHeader>
          <form onSubmit={submitName} className="space-y-3">
            <label className="block space-y-1">
              <span className={portalLabel}>{t.crm_pipeline_name}</span>
              <input autoFocus maxLength={60} className={portalInput} value={nameDialog?.name ?? ''} onChange={(e) => nameDialog && setNameDialog({ ...nameDialog, name: e.target.value })} />
            </label>
            <div className="flex justify-end gap-2">
              <button type="button" className={portalBtnGhost} onClick={() => setNameDialog(null)}>{t.crm_cancel}</button>
              <button type="submit" className={portalBtnPrimary} disabled={!nameDialog?.name.trim() || createPipeline.isPending || renamePipeline.isPending}>{nameDialog?.mode === 'rename' ? t.crm_rename : t.crm_create}</button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      <ClientDrawer clientId={id} onClose={() => navigate(peoplePath)} />
    </div>
  );
}
