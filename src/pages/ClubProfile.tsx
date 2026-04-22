import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { PublicNav } from '@/components/layout/PublicNav';
import { PublicFooter } from '@/components/layout/PublicFooter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { findClub, findCoach } from '@/lib/mockData';
import { PRODUCTS } from '@/lib/products';
import { ProductCard } from '@/components/marketplace/ProductCard';
import { BadgeCheck, MapPin, Star } from 'lucide-react';
import { toast } from 'sonner';

const ClubProfile = () => {
  const { slug } = useParams<{ slug: string }>();
  const club = slug ? findClub(slug) : undefined;
  const [form, setForm] = useState({ name: '', email: '', message: '' });

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

  const coaches = club.coachSlugs.map(s => findCoach(s)!).filter(Boolean);
  const clubProducts = PRODUCTS.filter(p => p.clubSlug === club.slug).slice(0, 4);

  return (
    <div className="min-h-screen flex flex-col">
      <PublicNav />

      <main className="flex-1">
        <section className="border-b border-border bg-card/40">
          <div className="container py-10">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="px-2 py-0.5 text-xs font-semibold rounded-md bg-secondary capitalize">{club.sport}</span>
              {club.verified && <span className="badge-verified"><BadgeCheck className="h-3 w-3" /> Verified</span>}
            </div>
            <h1 className="font-display">{club.name}</h1>
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4" /> {club.city}</span>
              <span className="flex items-center gap-1.5"><Star className="h-4 w-4 fill-primary text-primary" /> {club.rating.toFixed(2)} ({club.reviewCount} reviews)</span>
            </div>
          </div>
        </section>

        <section className="container py-10 space-y-10">
          <div>
            <h2 className="font-display text-2xl mb-4">Facility</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {club.gallery.map((g, i) => (
                <img key={i} src={g} alt={`${club.name} ${i + 1}`} loading="lazy"
                  className="aspect-[4/3] rounded-xl object-cover border border-border" />
              ))}
            </div>
          </div>

          <Tabs defaultValue="about" className="w-full">
            <TabsList className="flex flex-wrap h-auto">
              <TabsTrigger value="about">About</TabsTrigger>
              <TabsTrigger value="coaches">Coaches</TabsTrigger>
              <TabsTrigger value="programs">Programs</TabsTrigger>
              <TabsTrigger value="shop">Shop</TabsTrigger>
            </TabsList>

            <TabsContent value="about" className="mt-6">
              <div className="grid gap-8 md:grid-cols-2">
                <div className="surface p-6">
                  <h2 className="font-display text-2xl mb-3">About</h2>
                  <p className="text-muted-foreground leading-relaxed">{club.about}</p>
                </div>

                <div className="surface overflow-hidden">
                  <div className="aspect-video bg-secondary flex items-center justify-center text-muted-foreground text-sm">
                    <div className="text-center">
                      <MapPin className="h-6 w-6 mx-auto mb-2 text-primary" />
                      Location map
                    </div>
                  </div>
                  <div className="p-5">
                    <h3 className="font-display text-lg">Opening hours</h3>
                    <table className="mt-3 w-full text-sm">
                      <tbody>
                        {club.hours.map(h => (
                          <tr key={h.day} className="border-b border-border last:border-0">
                            <td className="py-2 text-muted-foreground">{h.day}</td>
                            <td className="py-2 text-right font-medium">{h.open}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="coaches" className="mt-6">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {coaches.map(c => (
                  <Link key={c.slug} to={`/coach/${c.slug}`} className="surface p-4 flex items-center gap-3 hover:border-primary/50 transition-colors">
                    <img src={c.avatar} alt={c.name} className="h-12 w-12 rounded-full object-cover" />
                    <div>
                      <p className="font-medium">{c.name}</p>
                      <p className="text-xs text-muted-foreground capitalize">{c.sport} · {c.city}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="programs" className="mt-6">
              <div className="grid gap-3 md:grid-cols-3">
                {club.programs.map(p => (
                  <div key={p.name} className="surface p-5 flex flex-col">
                    <p className="font-display text-lg">{p.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">{p.duration}</p>
                    <p className="font-display text-2xl text-primary mt-3">€{p.price}</p>
                    <Button className="mt-4 w-full" onClick={() => toast.success('Enquiry sent for this program.')}>
                      Book
                    </Button>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="shop" className="mt-6">
              {clubProducts.length === 0 ? (
                <p className="text-muted-foreground">This club hasn't added any products yet.</p>
              ) : (
                <>
                  <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                    {clubProducts.map(p => (
                      <ProductCard key={p.id} product={p} />
                    ))}
                  </div>
                  <div className="mt-6 text-center">
                    <Link to="/marketplace" className="text-sm text-primary hover:underline">
                      Visit full shop →
                    </Link>
                  </div>
                </>
              )}
            </TabsContent>
          </Tabs>

          <div className="surface p-6 max-w-2xl">
            <h2 className="font-display text-2xl">Membership enquiry</h2>
            <p className="text-sm text-muted-foreground mt-1">Tell us what you're after — we'll be in touch.</p>
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
