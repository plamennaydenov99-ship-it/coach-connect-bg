import { useEffect, useMemo, useState } from 'react';
import {
  DndContext, DragOverlay, PointerSensor, KeyboardSensor, closestCorners, useDroppable, useSensor, useSensors,
  type DragEndEvent, type DragOverEvent, type DragStartEvent,
} from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { CalendarClock, CheckSquare, MoreHorizontal, Activity } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useLanguage } from '@/context/LanguageContext';
import { useCoachTz } from '@/hooks/coach/useCoachCalendar';
import { BOARD_STAGES, useMoveClient, useReorderClients, type ClientSummary } from '@/hooks/coach/useCoachClients';
import { Avatar, fmtDateTime, isToday, stageKey, useCoarsePointer } from './shared';
import { toast } from 'sonner';

type Columns = Record<string, string[]>;

function buildColumns(clients: ClientSummary[]): Columns {
  const cols: Columns = Object.fromEntries(BOARD_STAGES.map((s) => [s, [] as string[]]));
  [...clients]
    .sort((a, b) => a.stage_position - b.stage_position)
    .forEach((c) => cols[c.stage]?.push(c.id));
  return cols;
}

export function ClientCard({ c, onOpen, touch, dragging }: { c: ClientSummary; onOpen?: () => void; touch?: boolean; dragging?: boolean }) {
  const { t, lang } = useLanguage();
  const tz = useCoachTz();
  const move = useMoveClient();
  const today = c.nextSession && isToday(c.nextSession.starts_at, tz);
  return (
    <div
      onClick={onOpen}
      className={`group bg-portal-card border border-portal-border rounded-[4px] p-3 space-y-2 cursor-pointer hover:border-portal-input ${dragging ? 'opacity-90 border-portal-selected-border' : ''}`}
    >
      <div className="flex items-start gap-2">
        <Avatar name={c.display_name} />
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium text-portal-ink truncate">{c.display_name}</div>
          <div className="text-xs text-portal-muted truncate">{c.goal || '—'}</div>
        </div>
        {touch && (
          <DropdownMenu>
            <DropdownMenuTrigger onClick={(e) => e.stopPropagation()} className="h-8 w-8 flex items-center justify-center rounded-[4px] text-portal-muted-strong" aria-label={t.crm_move_to}>
              <MoreHorizontal className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="coach-portal bg-portal-card border-portal-border text-portal-ink" onClick={(e) => e.stopPropagation()}>
              <DropdownMenuLabel className="text-xs text-portal-muted">{t.crm_move_to}</DropdownMenuLabel>
              {BOARD_STAGES.filter((s) => s !== c.stage).map((s) => (
                <DropdownMenuItem key={s} onClick={() => move.move(c.id, s).catch(() => toast.error(t.crm_error))}>
                  {t[stageKey(s)]}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
      <div className={`flex items-center gap-1.5 text-xs ${today ? 'text-portal-copper font-medium' : 'text-portal-muted-strong'}`}>
        <CalendarClock className="h-3.5 w-3.5" />
        {c.nextSession ? fmtDateTime(c.nextSession.starts_at, lang, tz) : t.crm_no_upcoming}
      </div>
      <div className="flex items-center gap-3 text-xs text-portal-muted-strong">
        <span className="inline-flex items-center gap-1" title={t.crm_attended}><Activity className="h-3.5 w-3.5" />{c.attendedCount}</span>
        <span className="inline-flex items-center gap-1" title={t.crm_open_tasks}><CheckSquare className="h-3.5 w-3.5" />{c.openTasks}</span>
        {c.athlete_id && (
          <span className="ml-auto font-display uppercase tracking-[0.1em] text-[10px] px-1.5 py-0.5 rounded-[4px] border border-portal-selected-border bg-portal-selected text-portal-ink">
            {t.crm_member}
          </span>
        )}
      </div>
    </div>
  );
}

function SortableCard({ c, onOpen }: { c: ClientSummary; onOpen: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: c.id });
  return (
    <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.3 : 1 }} {...attributes} {...listeners}>
      <ClientCard c={c} onOpen={onOpen} />
    </div>
  );
}

function Column({ stage, ids, byId, onOpen, touch }: { stage: string; ids: string[]; byId: Map<string, ClientSummary>; onOpen: (id: string) => void; touch: boolean }) {
  const { t } = useLanguage();
  const { setNodeRef, isOver } = useDroppable({ id: `col:${stage}` });
  return (
    <div className="w-[272px] md:w-auto md:flex-1 md:min-w-[220px] shrink-0 flex flex-col">
      <div className="flex items-center justify-between px-1 pb-2">
        <span className="font-display uppercase tracking-[0.14em] text-xs text-portal-muted-strong">{t[stageKey(stage)]}</span>
        <span className="text-xs text-portal-muted">{ids.length}</span>
      </div>
      <div ref={setNodeRef} className={`flex-1 min-h-[160px] space-y-2 p-2 rounded-[4px] border ${isOver ? 'border-portal-selected-border bg-portal-selected/40' : 'border-portal-border bg-portal-bg'}`}>
        {touch ? (
          ids.map((id) => <ClientCard key={id} c={byId.get(id)!} touch onOpen={() => onOpen(id)} />)
        ) : (
          <SortableContext items={ids} strategy={verticalListSortingStrategy}>
            {ids.map((id) => <SortableCard key={id} c={byId.get(id)!} onOpen={() => onOpen(id)} />)}
          </SortableContext>
        )}
      </div>
    </div>
  );
}

export function ClientBoard({ clients, onOpen }: { clients: ClientSummary[]; onOpen: (id: string) => void }) {
  const { t } = useLanguage();
  const touch = useCoarsePointer();
  const reorder = useReorderClients();
  const byId = useMemo(() => new Map(clients.map((c) => [c.id, c])), [clients]);
  const [cols, setCols] = useState<Columns>(() => buildColumns(clients));
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    if (!activeId) setCols(buildColumns(clients));
  }, [clients, activeId]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const findCol = (id: string) => (id.startsWith('col:') ? id.slice(4) : Object.keys(cols).find((k) => cols[k].includes(id)));

  const onDragStart = (e: DragStartEvent) => setActiveId(String(e.active.id));

  const onDragOver = ({ active, over }: DragOverEvent) => {
    if (!over) return;
    const from = findCol(String(active.id));
    const to = findCol(String(over.id));
    if (!from || !to || from === to) return;
    setCols((prev) => {
      const src = prev[from].filter((x) => x !== active.id);
      const dst = [...prev[to]];
      const overIdx = dst.indexOf(String(over.id));
      dst.splice(overIdx >= 0 ? overIdx : dst.length, 0, String(active.id));
      return { ...prev, [from]: src, [to]: dst };
    });
  };

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    const id = String(active.id);
    let next = cols;
    if (over) {
      const col = findCol(id);
      const overCol = findCol(String(over.id));
      if (col && col === overCol) {
        const a = cols[col].indexOf(id);
        const b = cols[col].indexOf(String(over.id));
        if (b >= 0 && a !== b) next = { ...cols, [col]: arrayMove(cols[col], a, b) };
      }
    }
    setCols(next);
    setActiveId(null);
    const changes: { id: string; stage: string; stage_position: number }[] = [];
    for (const [stage, ids] of Object.entries(next)) {
      ids.forEach((cid, i) => {
        const c = byId.get(cid);
        if (c && (c.stage !== stage || c.stage_position !== i)) changes.push({ id: cid, stage, stage_position: i });
      });
    }
    if (changes.length) reorder.mutate(changes, { onError: () => toast.error(t.crm_error) });
  };

  const board = (
    <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0">
      {BOARD_STAGES.map((s) => (
        <Column key={s} stage={s} ids={cols[s] ?? []} byId={byId} onOpen={onOpen} touch={touch} />
      ))}
    </div>
  );

  if (touch) return board;
  return (
    <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={onDragStart} onDragOver={onDragOver} onDragEnd={onDragEnd} onDragCancel={() => { setActiveId(null); setCols(buildColumns(clients)); }}>
      {board}
      <DragOverlay>{activeId && byId.get(activeId) ? <ClientCard c={byId.get(activeId)!} dragging /> : null}</DragOverlay>
    </DndContext>
  );
}
