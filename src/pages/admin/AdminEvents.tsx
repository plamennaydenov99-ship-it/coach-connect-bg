import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2, Trash2, Check } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { PublicNav } from '@/components/layout/PublicNav';
import { AdminNav } from '@/components/admin/AdminNav';
import { ImportPanel } from '@/components/admin/ImportPanel';
import { ReportsList } from '@/components/admin/ReportsList';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/db';
import { eventSlug } from '@/lib/slug';
import { todayIso } from '@/lib/events';

type Row = { id: string; slug: string; title: string; kind: string; sport: string | null; starts_on: string; ends_on: string | null; venue: string | null; status: string; source_url: string; last_checked_at: string | null };
const STATUSES = ['draft', 'pending', 'published', 'cancelled'] as const;

const COLUMNS = ['title', 'kind', 'sport', 'starts_on', 'ends_on', 'recurrence', 'venue', 'district', 'address', 'lat', 'lng', 'price_text', 'level', 'age_group', 'registration_url', 'source_url', 'source_name', 'summary', 'organiser_name', 'status', 'slug'];
const EXAMPLE = ['Sofia Half Marathon', 'race', 'running', '2027-04-04', '', '', 'Alexander Nevsky Square', 'Center', '', '', '', 'from €25', 'All levels', '', 'https://example.org/register', 'https://example.org/event', 'Organiser website', 'A road half marathon through the centre of Sofia.', 'Organiser name', 'draft', ''];
const mapRow = (r: Record<string, string>) => ({ ...Object.fromEntries(COLUMNS.map(c => [c, r[c] ?? ''])), slug: r.slug || (r.title && r.starts_on ? eventSlug(r.title, r.starts_on) : '') });
const reportLabel = (x: { title?: string }) => x.title ?? '';

export default function AdminEvents() {
  const { user, profile, loading, profileLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [rows, setRows] = useState<Row[]>([]);
  const [fetching, setFetching] = useState(true);
  const [filter, setFilter] = useState<'all' | (typeof STATUSES)[number]>('all');
  const isAdmin = !!profile?.is_admin;

  const load = useCallback(async () => {
    setFetching(true);
    const { data, error } = await db.from('events').select('id, slug, title, kind, sport, starts_on, ends_on, venue, status, source_url, last_checked_at').order('starts_on', { ascending: true }).limit(1000);
    if (error) toast({ title: 'Could not load events', description: error.message, variant: 'destructive' });
    setRows((data ?? []) as Row[]);
    setFetching(false);
  }, [toast]);

  useEffect(() => {
    if (loading || profileLoading) return;
    if (!user || !isAdmin) { navigate(user ? '/' : `/start?next=${encodeURIComponent(window.location.pathname)}`, { replace: true }); return; }
    load();
  }, [loading, profileLoading, user, isAdmin, navigate, load]);

  const visible = useMemo(() => rows.filter(r => filter === 'all' || r.status === filter), [rows, filter]);
  const drafts = useMemo(() => visible.filter(r => r.status === 'draft'), [visible]);
  const stale = (r: Row) => r.status === 'published' && (!r.last_checked_at || Date.now() - new Date(r.last_checked_at).getTime() > 30 * 864e5);

  const patch = async (ids: string[], values: Record<string, unknown>, ok: string) => {
    const { error } = await db.from('events').update(values).in('id', ids);
    if (error) return toast({ title: 'Could not save', description: error.message, variant: 'destructive' });
    toast({ title: ok }); load();
  };
  const remove = async (r: Row) => {
    if (!window.confirm(`Delete "${r.title}"? This cannot be undone.`)) return;
    const { error } = await db.from('events').delete().eq('id', r.id);
    if (error) return toast({ title: 'Could not delete', description: error.message, variant: 'destructive' });
    load();
  };

  if (loading || profileLoading || !user || !isAdmin) return null;
  const today = todayIso();

  return (
    <div className="min-h-screen bg-background">
      <PublicNav />
      <main className="container max-w-6xl py-12">
        <h1 className="text-5xl md:text-6xl">Events</h1>
        <p className="mb-8 mt-2 text-foreground-muted">Races, tournaments, open days and camps athletes can take part in. Every one needs a source link.</p>
        <AdminNav />

        <div className="space-y-8">
          <ImportPanel
            title="Import from a spreadsheet"
            hint="One row per event. Required: title, starts_on (YYYY-MM-DD), source_url. kind is race, tournament, open_day, clinic, workshop or camp. sport uses a sport slug such as padel or running. Leave status empty to import as draft. To correct an event, import it again with the same slug."
            columns={COLUMNS} example={EXAMPLE} mapRow={mapRow} fn="admin_import_events" onDone={load}
          />
          <ReportsList targetType="event" table="events" label={reportLabel} onChange={load} />

          <section>
            <div className="mb-4 flex flex-wrap items-center gap-1.5">
              {(['all', ...STATUSES] as const).map(s => (
                <Button key={s} size="sm" variant={filter === s ? 'default' : 'outline'} onClick={() => setFilter(s)} className="capitalize">
                  {s}{s !== 'all' && ` (${rows.filter(r => r.status === s).length})`}
                </Button>
              ))}
              {drafts.length > 0 && <Button size="sm" className="ml-auto" onClick={() => window.confirm(`Publish ${drafts.length} drafts?`) && patch(drafts.map(d => d.id), { status: 'published' }, `${drafts.length} published`)}>Publish {drafts.length} drafts</Button>}
            </div>

            {fetching ? <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-foreground-muted" /></div> : visible.length === 0 ? (
              <p className="bg-background-secondary p-8 text-center text-foreground-muted">No events here yet. Import a spreadsheet above.</p>
            ) : (
              <div className="overflow-x-auto bg-card">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-border text-left font-display text-xs uppercase">
                    <th className="px-4 py-3">Event</th><th className="px-4 py-3">Date</th><th className="px-4 py-3">Source</th><th className="px-4 py-3">Status</th><th className="px-4 py-3" />
                  </tr></thead>
                  <tbody>
                    {visible.map(r => (
                      <tr key={r.id} className="border-b border-border last:border-0">
                        <td className="px-4 py-3">
                          {r.status === 'published' ? <Link to={`/events/${r.slug}`} className="font-semibold underline-offset-4 hover:underline">{r.title}</Link> : <span className="font-semibold">{r.title}</span>}
                          <div className="text-xs text-foreground-muted">{[r.kind, r.sport, r.venue].filter(Boolean).join(' · ')}</div>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3">{r.starts_on}{r.ends_on ? ` → ${r.ends_on}` : ''}{(r.ends_on ?? r.starts_on) < today && <span className="ml-2 text-xs text-foreground-muted">past</span>}</td>
                        <td className="px-4 py-3"><a href={r.source_url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4 hover:text-primary">link</a>
                          <div className="text-xs text-foreground-muted">{r.last_checked_at ? `checked ${new Date(r.last_checked_at).toLocaleDateString()}` : 'never checked'}{stale(r) && <span className="ml-1 font-semibold text-accent">· stale</span>}</div></td>
                        <td className="px-4 py-3">
                          <select value={r.status} onChange={e => patch([r.id], { status: e.target.value }, 'Saved')} className="h-9 border border-border bg-background px-2 capitalize">
                            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-right">
                          <Button size="sm" variant="ghost" aria-label="Mark as checked today" title="Mark as checked today" onClick={() => patch([r.id], { last_checked_at: new Date().toISOString() }, 'Marked as checked')}><Check className="h-4 w-4" /></Button>
                          <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" aria-label={`Delete ${r.title}`} onClick={() => remove(r)}><Trash2 className="h-4 w-4" /></Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
