import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { PublicNav } from '@/components/layout/PublicNav';
import { PublicFooter } from '@/components/layout/PublicFooter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BadgeCheck, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface ClubData {
  id: string;
  name: string;
  sport: string | null;
  city: string | null;
  about: string | null;
  hours: string | null;
  programs: any;
  verified: boolean;
}

const ClubProfile = () => {
  const { id } = useParams<{ id: string }>();
  const [club, setClub] = useState<ClubData | null>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: '', email: '', message: '' });

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from('club_profiles')
        .select('*')
        .eq('id', id)
        .eq('verified', true)
        .maybeSingle();
      setClub(data as any);
      setLoading(false);
    })();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <PublicNav />
        <main className="flex-1 container py-20 text-center text-muted-foreground">Loading…</main>
        <PublicFooter />
      </div>
    );
  }

  if (!club) {
    return (
      <div className="min-h-screen flex flex-col">
        <PublicNav />
        <main className="flex-1 container py-20 text-center">
          <h1 className="font-display">Club not found</h1>
          <Link to="/search"><Button className="mt-6">Back to search</Button></Link>
        </main>
        <PublicFooter />
      </div>
    );
  }

  const programs: Array<{ name: string; duration?: string; price?: number }> =
    Array.isArray(club.programs) ? club.programs : [];

  return (
    <div className="min-h-screen flex flex-col">
      <PublicNav />

      <main className="flex-1">
        <section className="border-b border-border bg-card/40">
          <div className="container py-10">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              {club.sport && (
                <span className="px-2 py-0.5 text-xs font-semibold rounded-md bg-secondary capitalize">{club.sport}</span>
              )}
              <span className="badge-verified"><BadgeCheck className="h-3 w-3" /> Verified</span>
            </div>
            <h1 className="font-display">{club.name}</h1>
            {club.city && (
              <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4" /> {club.city}</span>
              </div>
            )}
          </div>
        </section>

        <section className="container py-10 space-y-10">
          <Tabs defaultValue="about" className="w-full">
            <TabsList className="flex flex-wrap h-auto">
              <TabsTrigger value="about">About</TabsTrigger>
              <TabsTrigger value="programs">Programs</TabsTrigger>
            </TabsList>

            <TabsContent value="about" className="mt-6">
              <div className="grid gap-8 md:grid-cols-2">
                <div className="surface p-6">
                  <h2 className="font-display text-2xl mb-3">About</h2>
                  <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                    {club.about || 'No description yet.'}
                  </p>
                </div>
                {club.hours && (
                  <div className="surface p-6">
                    <h3 className="font-display text-lg mb-3">Opening hours</h3>
                    <p className="text-sm text-muted-foreground whitespace-pre-line">{club.hours}</p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="programs" className="mt-6">
              {programs.length === 0 ? (
                <p className="text-muted-foreground">No programs listed yet.</p>
              ) : (
                <div className="grid gap-3 md:grid-cols-3">
                  {programs.map((p, i) => (
                    <div key={i} className="surface p-5 flex flex-col">
                      <p className="font-display text-lg">{p.name}</p>
                      {p.duration && <p className="text-xs text-muted-foreground mt-1">{p.duration}</p>}
                      {p.price != null && (
                        <p className="font-display text-2xl text-primary mt-3">€{p.price}</p>
                      )}
                      <Button className="mt-4 w-full" onClick={() => toast.success('Enquiry sent.')}>
                        Book
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>

          <div className="surface p-6 max-w-2xl">
            <h2 className="font-display text-2xl">Membership enquiry</h2>
            <form
              className="mt-5 grid gap-4"
              onSubmit={(e) => {
                e.preventDefault();
                if (!form.name || !form.email || !form.message) {
                  toast.error('Please complete all fields.');
                  return;
                }
                toast.success('Enquiry sent.');
                setForm({ name: '', email: '', message: '' });
              }}
            >
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="cname">Name</Label>
                  <Input id="cname" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="cemail">Email</Label>
                  <Input id="cemail" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="cmsg">Message</Label>
                <Textarea id="cmsg" rows={4} value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} />
              </div>
              <Button type="submit">Send enquiry</Button>
            </form>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
};

export default ClubProfile;
