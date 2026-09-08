import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { PublicNav } from '@/components/layout/PublicNav';
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
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [rows, setRows] = useState<AdminUserRow[]>([]);
  const [fetching, setFetching] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [actingId, setActingId] = useState<string | null>(null);

  const isAdmin = !!profile?.is_admin;

  useEffect(() => {
    if (loading) return;
    if (!user || !isAdmin) {
      navigate('/', { replace: true });
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
  }, [loading, user, isAdmin, navigate, toast]);

  const visible = useMemo(
    () => (filter === 'all' ? rows : rows.filter(r => r.role === filter)),
    [rows, filter]
  );

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

  if (loading || !user || !isAdmin) return null;

  return (
    <div className="min-h-screen bg-background">
      <PublicNav />
      <main className="container max-w-5xl py-12">
        <h1 className="font-display text-4xl uppercase tracking-[0.08em] font-semibold">All users</h1>
        <p className="mt-2 text-foreground-muted">
          Everyone registered, confirmed or not.
        </p>

        <div className="mt-8 flex flex-wrap gap-2">
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
            <p className="font-display uppercase tracking-[0.1em] text-lg">No users</p>
          </div>
        ) : (
          <div className="mt-8 overflow-x-auto rounded-sm border border-border bg-card">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="px-4 py-3 font-display uppercase tracking-[0.08em] text-xs">Name</th>
                  <th className="px-4 py-3 font-display uppercase tracking-[0.08em] text-xs">Email</th>
                  <th className="px-4 py-3 font-display uppercase tracking-[0.08em] text-xs">Status</th>
                  <th className="px-4 py-3 font-display uppercase tracking-[0.08em] text-xs">Role</th>
                  <th className="px-4 py-3 font-display uppercase tracking-[0.08em] text-xs">Application</th>
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
                    <td className="px-4 py-3 text-right">
                      {!r.email_confirmed && (
                        <Button
                          size="sm"
                          onClick={() => confirmEmail(r.id)}
                          disabled={actingId === r.id}
                        >
                          <Check className="mr-1 h-4 w-4" /> Confirm email
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
    </div>
  );
}
