import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, X, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { PublicNav } from '@/components/layout/PublicNav';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface PendingCoach {
  id: string;
  sport: string | null;
  bio: string | null;
  certifications: string[];
  created_at: string;
  full_name: string | null;
  city: string | null;
}

export default function AdminReview() {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [items, setItems] = useState<PendingCoach[]>([]);
  const [fetching, setFetching] = useState(true);
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
      const { data, error } = await supabase
        .from('coach_profiles')
        .select('id, sport, bio, certifications, created_at, profiles!inner(full_name, city)')
        .eq('application_status', 'pending')
        .order('created_at', { ascending: true });
      if (!error && data) {
        setItems(
          data.map((row: any) => ({
            id: row.id,
            sport: row.sport,
            bio: row.bio,
            certifications: row.certifications ?? [],
            created_at: row.created_at,
            full_name: row.profiles?.full_name ?? null,
            city: row.profiles?.city ?? null,
          }))
        );
      }
      setFetching(false);
    };
    load();
  }, [loading, user, isAdmin, navigate]);

  const act = async (id: string, status: 'approved' | 'rejected') => {
    if (!user) return;
    setActingId(id);
    const { error } = await supabase
      .from('coach_profiles')
      .update({
        application_status: status,
        reviewed_at: new Date().toISOString(),
        reviewed_by: user.id,
      })
      .eq('id', id);
    setActingId(null);
    if (error) {
      toast({ title: 'Something went wrong', description: error.message, variant: 'destructive' });
      return;
    }
    setItems(prev => prev.filter(c => c.id !== id));
  };

  if (loading || !user || !isAdmin) return null;

  return (
    <div className="min-h-screen bg-background">
      <PublicNav />
      <main className="container max-w-3xl py-12">
        <h1 className="font-display text-4xl uppercase tracking-[0.08em] font-semibold">
          Coach applications
        </h1>
        <p className="mt-2 text-foreground-muted">
          Pending applications awaiting review.
        </p>

        {fetching ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-foreground-muted" />
          </div>
        ) : items.length === 0 ? (
          <div className="mt-10 rounded-sm border border-border bg-card p-10 text-center">
            <p className="font-display uppercase tracking-[0.1em] text-lg">All caught up</p>
            <p className="mt-1 text-sm text-foreground-muted">
              There are no coach applications waiting for review right now.
            </p>
          </div>
        ) : (
          <ul className="mt-10 space-y-4">
            {items.map(c => (
              <li key={c.id} className="rounded-sm border border-border bg-card p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="font-display uppercase tracking-[0.08em] text-xl font-semibold">
                      {c.full_name || 'Unnamed coach'}
                    </p>
                    <p className="mt-1 text-sm text-foreground-muted">
                      {[c.sport, c.city].filter(Boolean).join(' · ') || 'No sport or city listed'}
                    </p>
                    <p className="mt-1 text-xs text-foreground-muted">
                      Submitted {new Date(c.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => act(c.id, 'approved')}
                      disabled={actingId === c.id}
                    >
                      <Check className="mr-1 h-4 w-4" /> Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => act(c.id, 'rejected')}
                      disabled={actingId === c.id}
                    >
                      <X className="mr-1 h-4 w-4" /> Reject
                    </Button>
                  </div>
                </div>
                {c.bio && <p className="mt-4 text-sm leading-relaxed">{c.bio}</p>}
                {c.certifications.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {c.certifications.map(cert => (
                      <span
                        key={cert}
                        className="rounded-sm border border-border px-2 py-1 text-xs text-foreground-muted"
                      >
                        {cert}
                      </span>
                    ))}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
