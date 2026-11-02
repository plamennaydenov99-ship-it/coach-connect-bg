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
import { rpc } from '@/lib/trending';
import { clubSlug } from '@/lib/slug';

type Row = { id: string; slug: string; name: string; sports: string[]; district: string | null; address: string | null; website: string | null; status: string; source_url: string | null; last_checked_at: string | null; claimed_profile_id: string | null };
type Claim = { id: string; message: string | null; created_at: string; club_listings: { name: string } | null; profiles: { full_name: string | null } | null };
const STATUSES = ['draft', 'published', 'hidden', 'removed'] as const;

const COLUMNS = ['name', 'sports', 'city', 'district', 'address', 'lat', 'lng', 'website', 'source_name', 'source_url', 'osm_id', 'status', 'slug'];
const EXAMPLE = ['Example Padel Club', 'padel;tennis', 'Sofia', 'Lozenets', 'ul. Example 1', '', '', 'https://example.org', 'Club website', 'https://example.org', '', 'draft', ''];
const mapRow = (r: Record<string, string>) => ({
  ...Object.fromEntries(COLUMNS.map(c => [c, r[c] ?? ''])),
  sports: (r.sports ?? '').split(/[;|,/]/).map(s => s.trim().toLowerCase()).filter(Boolean),
  slug: r.slug || (r.name ? clubSlug(r.name, r.district) : ''),
});
const reportLabel = (x: { name?: string }) => x.name ?? '';

export default function AdminClubs() {
  const { user, profile, loading, profileLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [rows, setRows] = useState<Row[]>([]);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [fetching, setFetching] = useState(true);
  const [filter, setFilter] = useState<'all' | (typeof STATUSES)[number]>('all');
  const isAdmin = !!profile?.is_admin;

  const load = useCallback(async () => {
    setFetching(true);
    const [l, c] = await Promise.all([
      db.from('club_listings').select('id, slug, name, sports, district, address, website, status, source_url, last_checked_at, claimed_profile_id').order('name').limit(1000),
      db.from('club_claims').select('id, message, created_at, club_listings(name), profiles!club_claims_claimant_id_fkey(full_name)').eq('status', 'pending').order('created_at'),
    ]);
    if (l.error) toast({ title: 'Could not load clubs', description: l.error.message, variant: 'destructive' });
    setRows((l.data ?? []) as Row[]);
    setClaims((c.data ?? []) as Claim[]);
    setFetching(false);
  }, [toast]);

  useEffect(() => {
    if (loading || profileLoading) return;
    if (!user || !isAdmin) { navigate(user ? '/' : `/start?next=${encodeURIComponent(window.location.pathname)}`, { replace: true }); return; }
    load();
  }, [loading, profileLoading, user, isAdmin, navigate, load]);

  const visible = useMemo(() => rows.filter(r => filter === 'all' || r.status === filter), [rows, filter]);
  const drafts = useMemo(() => visible.filter(r => r.status === 'draft'), [visible]);
  const stale = (r: Row) => r.status === 'published' && (!r.last_checked_at || Date.now() - new Date(r.last_checked_at).getTime() > 90 * 864e5);

  const patch = async (ids: string[], values: Record<string, unknown>, ok: string) => {
    const { error } = await db.from('club_listings').update(values).in('id', ids);
    if (error) return toast({ title: 'Could not save', description: error.message, variant: 'destructive' });
    toast({ title: ok }); load();
  };
  const remove = async (r: Row) => {
    if (!window.confirm(`Delete "${r.name}"? This cannot be undone. (Use Removed to keep a record that it was taken down.)`)) return;
    const { error } = await db.from('club_listings').delete().eq('id', r.id);
    if (error) return toast({ title: 'Could not delete', description: error.message, variant: 'destructive' });
    load();
  };
  const resolve = async (c: Claim, approve: boolean) => {
    const { error } = await rpc('admin_resolve_claim', { _claim: c.id, _approve: approve });
    if (error) return toast({ title: 'Could not save', description: error.message, variant: 'destructive' });
    toast({ title: approve ? 'Claim approved' : 'Claim rejected' }); load();
  };

  if (loading || profileLoading || !user || !isAdmin) return null;

  return (
    <div className="min-h-screen bg-background">
      <PublicNav />
      <main className="container max-w-6xl py-12">
        <h1 className="text-5xl md:text-6xl">Clubs</h1>
        <p className="mb-8 mt-2 text-foreground-muted">Club pages that exist before the club has joined. Facts only: name, address, sports, website. No ratings, photos or copied text.</p>
        <AdminNav />

        <div className="space-y-8">
          {claims.length > 0 && (
            <section>
              <h2 className="mb-3 text-2xl">Claims waiting ({claims.length})</h2>
              <ul className="space-y-2">
                {claims.map(c => (
                  <li key={c.id} className="flex flex-wrap items-start justify-between gap-3 bg-accent/10 p-4 text-sm">
                    <div className="min-w-0">
                      <p className="font-semibold">{c.profiles?.full_name || 'A club account'} wants to claim {c.club_listings?.name ?? 'a listing'}</p>
                      {c.message && <p className="mt-1">{c.message}</p>}
                      <p className="mt-1 text-foreground-muted">{new Date(c.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className="flex gap-2"><Button size="sm" onClick={() => resolve(c, true)}>Approve</Button><Button size="sm" variant="outline" onClick={() => resolve(c, false)}>Reject</Button></div>
                  </li>
                ))}
              </ul>
            </section>
          )}
          <ReportsList targetType="club" table="club_listings" label={reportLabel} onChange={load} />

          <ImportPanel
            title="Import from a spreadsheet"
            hint="One row per club. Required: name. sports is a list separated by semicolons (padel;tennis) using sport slugs. Leave status empty to import as draft. To correct a club, import it again with the same slug. Check source_url on every row."
            columns={COLUMNS} example={EXAMPLE} mapRow={mapRow} fn="admin_import_clubs" onDone={load}
          />

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
              <p className="bg-background-secondary p-8 text-center text-foreground-muted">No clubs here yet. Import a spreadsheet above.</p>
            ) : (
              <div className="overflow-x-auto bg-card">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-border text-left font-display text-xs uppercase">
                    <th className="px-4 py-3">Club</th><th className="px-4 py-3">Where</th><th className="px-4 py-3">Source</th><th className="px-4 py-3">Status</th><th className="px-4 py-3" />
                  </tr></thead>
                  <tbody>
                    {visible.map(r => (
                      <tr key={r.id} className="border-b border-border last:border-0">
                        <td className="px-4 py-3">
                          {r.status === 'published' ? <Link to={`/clubs/${r.slug}`} className="font-semibold underline-offset-4 hover:underline">{r.name}</Link> : <span className="font-semibold">{r.name}</span>}
                          <div className="text-xs text-foreground-muted">{r.sports.join(', ')}{r.claimed_profile_id && ' · claimed'}</div>
                        </td>
                        <td className="px-4 py-3">{[r.district, r.address].filter(Boolean).join(' · ') || '—'}</td>
                        <td className="px-4 py-3">{r.source_url ? <a href={r.source_url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4 hover:text-primary">link</a> : '—'}
                          <div className="text-xs text-foreground-muted">{r.last_checked_at ? `checked ${new Date(r.last_checked_at).toLocaleDateString()}` : 'never checked'}{stale(r) && <span className="ml-1 font-semibold text-accent">· stale</span>}</div></td>
                        <td className="px-4 py-3">
                          <select value={r.status} onChange={e => patch([r.id], { status: e.target.value }, 'Saved')} className="h-9 border border-border bg-background px-2 capitalize">
                            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-right">
                          <Button size="sm" variant="ghost" aria-label="Mark as checked today" title="Mark as checked today" onClick={() => patch([r.id], { last_checked_at: new Date().toISOString() }, 'Marked as checked')}><Check className="h-4 w-4" /></Button>
                          <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" aria-label={`Delete ${r.name}`} onClick={() => remove(r)}><Trash2 className="h-4 w-4" /></Button>
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
