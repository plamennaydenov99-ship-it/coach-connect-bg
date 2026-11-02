import { useEffect, useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2, Check, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { PublicNav } from '@/components/layout/PublicNav';
import { AdminNav } from '@/components/admin/AdminNav';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { rpc } from '@/lib/trending';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface AdminUserRow {
  id: string;
  email: string | null;
  email_confirmed: boolean;
  role: string;
  full_name: string | null;
  city: string | null;
  created_at: string;
  application_status: string | null;
}

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'athlete', label: 'Athletes' },
  { key: 'coach', label: 'Coaches' },
  { key: 'club', label: 'Clubs' },
] as const;

export default function AdminUsers() {
  const { user, profile, loading, profileLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [rows, setRows] = useState<AdminUserRow[]>([]);
  const [fetching, setFetching] = useState(true);
  const [params] = useSearchParams();
  const [filter, setFilter] = useState<string>(() => (['athlete', 'coach', 'club'].includes(params.get('role') ?? '') ? params.get('role')! : 'all'));
  const [query, setQuery] = useState('');
  const [toDelete, setToDelete] = useState<AdminUserRow | null>(null);
  const [actingId, setActingId] = useState<string | null>(null);

  const isAdmin = !!profile?.is_admin;

  useEffect(() => {
    if (loading || profileLoading) return;
    if (!user || !isAdmin) {
      navigate(user ? '/' : `/start?next=${encodeURIComponent(window.location.pathname)}`, { replace: true });
      return;
    }
    const load = async () => {
      setFetching(true);
      const { data, error } = await supabase.rpc('admin_list_users');
      if (error) {
        toast({ title: 'Could not load users', description: error.message, variant: 'destructive' });
      } else {
        setRows((data ?? []) as AdminUserRow[]);
      }
      setFetching(false);
    };
    load();
  }, [loading, profileLoading, user, isAdmin, navigate, toast]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter(r =>
      (filter === 'all' || r.role === filter) &&
      (!q || (r.full_name ?? '').toLowerCase().includes(q) || (r.email ?? '').toLowerCase().includes(q))
    );
  }, [rows, filter, query]);

  const deleteUser = async () => {
    if (!toDelete) return;
    const target = toDelete;
    setActingId(target.id);
    const { error } = await rpc('admin_delete_user', { _user_id: target.id });
    setActingId(null);
    setToDelete(null);
    if (error) {
      toast({ title: 'Could not delete', description: error.message, variant: 'destructive' });
      return;
    }
    setRows(prev => prev.filter(r => r.id !== target.id));
    toast({ title: 'Account deleted', description: target.email ?? target.full_name ?? '' });
  };

  const reviewClub = async (id: string, status: 'approved' | 'rejected') => {
    setActingId(id);
    const { error } = await rpc('admin_review_club', { _id: id, _status: status });
    setActingId(null);
    if (error) { toast({ title: 'Something went wrong', description: error.message, variant: 'destructive' }); return; }
    setRows(prev => prev.map(r => (r.id === id ? { ...r, application_status: status } : r)));
    toast({ title: status === 'approved' ? 'Club approved' : 'Club rejected' });
  };

  const confirmEmail = async (id: string) => {
    setActingId(id);
    const { error } = await supabase.rpc('admin_confirm_email', { _user_id: id });
    setActingId(null);
    if (error) {
      toast({ title: 'Something went wrong', description: error.message, variant: 'destructive' });
      return;
    }
    setRows(prev => prev.map(r => (r.id === id ? { ...r, email_confirmed: true } : r)));
    toast({ title: 'Email confirmed' });
  };

  if (loading || profileLoading || !user || !isAdmin) return null;

  return (
    <div className="min-h-screen bg-background">
      <PublicNav />
      <main className="container max-w-5xl py-12">
        <h1 className="text-5xl md:text-6xl">People</h1>
        <p className="mt-2 mb-8 text-foreground-muted">
          Everyone registered, confirmed or not. {rows.length > 0 && `${rows.length} accounts.`}
        </p>
        <AdminNav />

        <div className="flex flex-wrap items-center gap-2">
          <Input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search name or email" className="h-9 w-full max-w-xs rounded-none sm:mr-2" />
          {FILTERS.map(f => (
            <Button
              key={f.key}
              size="sm"
              variant={filter === f.key ? 'default' : 'outline'}
              onClick={() => setFilter(f.key)}
            >
              {f.label}
              {f.key !== 'all' && ` (${rows.filter(r => r.role === f.key).length})`}
            </Button>
          ))}
        </div>

        {fetching ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-foreground-muted" />
          </div>
        ) : visible.length === 0 ? (
          <div className="mt-10 rounded-sm border border-border bg-card p-10 text-center">
            <p className="font-display uppercase tracking-[0.02em] text-lg">No users</p>
          </div>
        ) : (
          <div className="mt-8 overflow-x-auto rounded-sm border border-border bg-card">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="px-4 py-3 font-display uppercase tracking-[0.02em] text-xs">Name</th>
                  <th className="px-4 py-3 font-display uppercase tracking-[0.02em] text-xs">Email</th>
                  <th className="px-4 py-3 font-display uppercase tracking-[0.02em] text-xs">Status</th>
                  <th className="px-4 py-3 font-display uppercase tracking-[0.02em] text-xs">Role</th>
                  <th className="px-4 py-3 font-display uppercase tracking-[0.02em] text-xs">Application</th>
                  <th className="px-4 py-3 font-display uppercase tracking-[0.02em] text-xs">Joined</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {visible.map(r => (
                  <tr key={r.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3">
                      <div>{r.full_name || '—'}</div>
                      {r.city && <div className="text-xs text-foreground-muted">{r.city}</div>}
                    </td>
                    <td className="px-4 py-3">{r.email || '—'}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-sm border px-2 py-1 text-xs ${
                          r.email_confirmed
                            ? 'border-border text-foreground-muted'
                            : 'border-primary text-primary'
                        }`}
                      >
                        {r.email_confirmed ? 'Confirmed' : 'Unconfirmed'}
                      </span>
                    </td>
                    <td className="px-4 py-3 capitalize">{r.role}</td>
                    <td className="px-4 py-3 capitalize">{r.application_status || '—'}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-foreground-muted">{new Date(r.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      {!r.email_confirmed && (
                        <Button
                          size="sm"
                          onClick={() => confirmEmail(r.id)}
                          disabled={actingId === r.id}
                        >
                          <Check className="mr-1 h-4 w-4" /> Confirm email
                        </Button>
                      )}
                      {r.role === 'club' && r.application_status === 'pending' && (
                        <>
                          <Button size="sm" className="ml-2" onClick={() => reviewClub(r.id, 'approved')} disabled={actingId === r.id}>Approve</Button>
                          <Button size="sm" variant="outline" className="ml-1" onClick={() => reviewClub(r.id, 'rejected')} disabled={actingId === r.id}>Reject</Button>
                        </>
                      )}
                      {r.id !== user?.id && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="ml-2 text-destructive hover:text-destructive"
                          onClick={() => setToDelete(r)}
                          disabled={actingId === r.id}
                          aria-label={`Delete ${r.email ?? r.full_name ?? 'account'}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      <AlertDialog open={!!toDelete} onOpenChange={o => !o && setToDelete(null)}>
        <AlertDialogContent className="rounded-none">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this account?</AlertDialogTitle>
            <AlertDialogDescription>
              {toDelete?.email ?? toDelete?.full_name} ({toDelete?.role}) will be removed for good, together with their
              bookings, clients, messages and sessions. This cannot be undone. The action is written to the audit log.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-none">Keep it</AlertDialogCancel>
            <AlertDialogAction className="rounded-none bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={deleteUser}>
              Delete account
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
