import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowDown, ArrowUp, Loader2, Pencil, Plus, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/context/LanguageContext';
import { PublicNav } from '@/components/layout/PublicNav';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

type Item = Database['public']['Tables']['trending_items']['Row'];
type ItemType = 'sport' | 'session' | 'event';
type PubSession = { id: string; title: string | null; sport: string | null; starts_at: string; spots_left: number | null };
type Owner = { id: string; name: string };

const CITIES = ['Sofia', 'Nice', 'Monaco'] as const;
const emptyForm = {
  type: 'sport' as ItemType, session_id: null as string | null, owner_id: null as string | null,
  title: '', blurb: '', sport: '', city: 'all', image_url: '', starts_on: '', ends_on: '',
};

export default function AdminTrending() {
  const { user, profile, loading, profileLoading } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [items, setItems] = useState<Item[]>([]);
  const [fetching, setFetching] = useState(true);
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [sessions, setSessions] = useState<PubSession[]>([]);
  const [owners, setOwners] = useState<Owner[]>([]);
  const [ownerLabel, setOwnerLabel] = useState('');

  const isAdmin = !!profile?.is_admin;

  const load = async () => {
    setFetching(true);
    const { data, error } = await supabase.from('trending_items').select('*').order('rank').order('created_at');
    if (error) toast.error(error.message);
    setItems(data ?? []);
    setFetching(false);
  };

  useEffect(() => {
    if (loading || profileLoading) return;
    if (!user || !isAdmin) { navigate('/', { replace: true }); return; }
    load();
  }, [loading, profileLoading, user, isAdmin, navigate]);

  // Pickers
  useEffect(() => {
    if (!open) return;
    const q = search.trim();
    const h = setTimeout(async () => {
      if (form.type === 'session') {
        let req = supabase.from('public_sessions').select('id, title, sport, starts_at, spots_left').order('starts_at').limit(20);
        if (q) req = req.ilike('title', `%${q}%`);
        const { data } = await req;
        setSessions((data ?? []) as PubSession[]);
      } else if (form.type === 'event') {
        if (!q) { setOwners([]); return; }
        const [coaches, clubs] = await Promise.all([
          supabase.from('coach_profiles').select('id, profiles!inner(full_name)').eq('application_status', 'approved').ilike('profiles.full_name', `%${q}%`).limit(10),
          supabase.from('club_profiles').select('id, name').eq('application_status', 'approved').ilike('name', `%${q}%`).limit(10),
        ]);
        setOwners([
          ...((coaches.data ?? []) as any[]).map(c => ({ id: c.id, name: c.profiles?.full_name ?? '—' })),
          ...((clubs.data ?? []) as any[]).map(c => ({ id: c.id, name: c.name })),
        ]);
      }
    }, 250);
    return () => clearTimeout(h);
  }, [search, form.type, open]);

  const openNew = () => { setEditId(null); setForm(emptyForm); setSearch(''); setOwnerLabel(''); setOpen(true); };
  const openEdit = (it: Item) => {
    setEditId(it.id);
    setForm({
      type: it.type as ItemType, session_id: it.session_id, owner_id: it.owner_id,
      title: it.title, blurb: it.blurb ?? '', sport: it.sport ?? '', city: it.city ?? 'all',
      image_url: it.image_url ?? '', starts_on: it.starts_on ?? '', ends_on: it.ends_on ?? '',
    });
    setSearch(''); setOwnerLabel(it.owner_id ? t.tr_owner_selected : ''); setOpen(true);
  };

  const save = async () => {
    if (!form.title.trim()) { toast.error(t.tr_title_required); return; }
    if (form.type === 'session' && !form.session_id) { toast.error(t.tr_session_required); return; }
    setSaving(true);
    const row = {
      type: form.type,
      session_id: form.type === 'session' ? form.session_id : null,
      owner_id: form.type === 'event' ? form.owner_id : null,
      title: form.title.trim().slice(0, 80),
      blurb: form.blurb.trim().slice(0, 240) || null,
      sport: form.sport.trim() || null,
      city: form.city === 'all' ? null : form.city,
      image_url: form.image_url.trim() || null,
      starts_on: form.starts_on || null,
      ends_on: form.ends_on || null,
    };
    const maxRank = items.reduce((m, i) => Math.max(m, i.rank), 0);
    const { error } = editId
      ? await supabase.from('trending_items').update(row).eq('id', editId)
      : await supabase.from('trending_items').insert({ ...row, rank: maxRank + 10 });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success(t.tr_saved);
    setOpen(false);
    load();
  };

  const move = async (idx: number, dir: -1 | 1) => {
    const a = items[idx], b = items[idx + dir];
    if (!a || !b) return;
    // Distinct ranks so the swap always changes order.
    const ra = a.rank === b.rank ? b.rank + dir : b.rank;
    const rb = a.rank;
    const [r1, r2] = await Promise.all([
      supabase.from('trending_items').update({ rank: ra }).eq('id', a.id),
      supabase.from('trending_items').update({ rank: rb }).eq('id', b.id),
    ]);
    if (r1.error || r2.error) toast.error((r1.error || r2.error)!.message);
    load();
  };

  const toggle = async (it: Item, active: boolean) => {
    setItems(prev => prev.map(i => (i.id === it.id ? { ...i, active } : i)));
    const { error } = await supabase.from('trending_items').update({ active }).eq('id', it.id);
    if (error) { toast.error(error.message); load(); }
  };

  const remove = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from('trending_items').delete().eq('id', deleteId);
    setDeleteId(null);
    if (error) { toast.error(error.message); return; }
    toast.success(t.tr_deleted);
    load();
  };

  const typeLabel = (ty: string) => (ty === 'session' ? t.tr_type_session : ty === 'event' ? t.tr_type_event : t.tr_type_sport);
  const fmtDate = (d: string) => new Date(d).toLocaleDateString();

  if (loading || profileLoading || !user || !isAdmin) return null;

  return (
    <div className="coach-portal min-h-screen bg-portal-bg text-portal-ink">
      <PublicNav />
      <main className="container max-w-4xl py-12">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-4xl uppercase tracking-[0.08em] font-semibold">{t.tr_page_title}</h1>
            <p className="mt-2 text-portal-muted">{t.tr_page_sub}</p>
          </div>
          <Button onClick={openNew} className="bg-portal-copper text-portal-ink hover:bg-portal-copper-hover">
            <Plus className="mr-1 h-4 w-4" /> {t.tr_add}
          </Button>
        </div>

        {fetching ? (
          <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-portal-muted" /></div>
        ) : items.length === 0 ? (
          <div className="mt-10 rounded-sm border border-portal-border bg-portal-card p-10 text-center">
            <p className="font-display uppercase tracking-[0.1em] text-lg">{t.tr_empty}</p>
          </div>
        ) : (
          <ul className="mt-10 space-y-3">
            {items.map((it, idx) => (
              <li key={it.id} className="flex flex-wrap items-center gap-4 rounded-sm border border-portal-border bg-portal-card p-4">
                <div className="flex flex-col">
                  <Button size="icon" variant="ghost" className="h-7 w-7" aria-label={t.tr_move_up} disabled={idx === 0} onClick={() => move(idx, -1)}><ArrowUp className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7" aria-label={t.tr_move_down} disabled={idx === items.length - 1} onClick={() => move(idx, 1)}><ArrowDown className="h-4 w-4" /></Button>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-condensed uppercase tracking-[0.12em] text-portal-muted">{typeLabel(it.type)} · {it.city ?? t.tr_city_all}</p>
                  <p className="font-display text-xl font-semibold truncate">{it.title}</p>
                  <p className="text-xs text-portal-muted">
                    {it.starts_on || it.ends_on ? `${it.starts_on ? fmtDate(it.starts_on) : '…'} – ${it.ends_on ? fmtDate(it.ends_on) : '…'}` : t.tr_no_dates}
                  </p>
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <Switch checked={it.active} onCheckedChange={v => toggle(it, v)} aria-label={t.tr_active} />
                  {t.tr_active}
                </label>
                <Button size="icon" variant="outline" aria-label={t.tr_edit} onClick={() => openEdit(it)}><Pencil className="h-4 w-4" /></Button>
                <Button size="icon" variant="outline" aria-label={t.tr_delete} onClick={() => setDeleteId(it.id)}><Trash2 className="h-4 w-4" /></Button>
              </li>
            ))}
          </ul>
        )}
      </main>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="coach-portal max-h-[90vh] overflow-y-auto bg-portal-card text-portal-ink">
          <DialogHeader><DialogTitle>{editId ? t.tr_edit : t.tr_add}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{t.tr_type}</Label>
              <Select value={form.type} onValueChange={v => { setForm(f => ({ ...f, type: v as ItemType, session_id: null, owner_id: null })); setSearch(''); setOwnerLabel(''); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="sport">{t.tr_type_sport}</SelectItem>
                  <SelectItem value="session">{t.tr_type_session}</SelectItem>
                  <SelectItem value="event">{t.tr_type_event}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {form.type === 'session' && (
              <div>
                <Label>{t.tr_pick_session}</Label>
                <Input value={search} onChange={e => setSearch(e.target.value)} placeholder={t.tr_search} />
                <ul className="mt-2 max-h-48 overflow-y-auto rounded-sm border border-portal-border">
                  {sessions.length === 0 && <li className="p-2 text-sm text-portal-muted">{t.tr_no_results}</li>}
                  {sessions.map(s => (
                    <li key={s.id}>
                      <button type="button"
                        className={`w-full p-2 text-left text-sm hover:bg-portal-selected ${form.session_id === s.id ? 'bg-portal-selected' : ''}`}
                        onClick={() => setForm(f => ({ ...f, session_id: s.id, title: (s.title ?? f.title).slice(0, 80), sport: s.sport ?? f.sport }))}>
                        {s.title ?? '—'} · {new Date(s.starts_at).toLocaleString()} · {t.tr_spots_left.replace('{n}', String(s.spots_left ?? 0))}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {form.type === 'event' && (
              <div>
                <Label>{t.tr_pick_owner}</Label>
                {ownerLabel && <p className="text-sm text-portal-muted">{ownerLabel}</p>}
                <Input value={search} onChange={e => setSearch(e.target.value)} placeholder={t.tr_search_owner} />
                {owners.length > 0 && (
                  <ul className="mt-2 max-h-40 overflow-y-auto rounded-sm border border-portal-border">
                    {owners.map(o => (
                      <li key={o.id}>
                        <button type="button"
                          className={`w-full p-2 text-left text-sm hover:bg-portal-selected ${form.owner_id === o.id ? 'bg-portal-selected' : ''}`}
                          onClick={() => { setForm(f => ({ ...f, owner_id: o.id })); setOwnerLabel(o.name); }}>
                          {o.name}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            <div><Label>{t.tr_title}</Label><Input maxLength={80} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} /></div>
            <div><Label>{t.tr_blurb}</Label><Textarea maxLength={240} value={form.blurb} onChange={e => setForm(f => ({ ...f, blurb: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>{t.tr_sport}</Label><Input value={form.sport} onChange={e => setForm(f => ({ ...f, sport: e.target.value }))} /></div>
              <div>
                <Label>{t.tr_city}</Label>
                <Select value={form.city} onValueChange={v => setForm(f => ({ ...f, city: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t.tr_city_all}</SelectItem>
                    {CITIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div><Label>{t.tr_image}</Label><Input type="url" value={form.image_url} onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>{t.tr_starts}</Label><Input type="date" value={form.starts_on} onChange={e => setForm(f => ({ ...f, starts_on: e.target.value }))} /></div>
              <div><Label>{t.tr_ends}</Label><Input type="date" value={form.ends_on} onChange={e => setForm(f => ({ ...f, ends_on: e.target.value }))} /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>{t.tr_cancel}</Button>
            <Button onClick={save} disabled={saving} className="bg-portal-copper text-portal-ink hover:bg-portal-copper-hover">{t.tr_save}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={o => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.tr_delete_title}</AlertDialogTitle>
            <AlertDialogDescription>{t.tr_delete_body}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.tr_cancel}</AlertDialogCancel>
            <AlertDialogAction onClick={remove}>{t.tr_delete}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
