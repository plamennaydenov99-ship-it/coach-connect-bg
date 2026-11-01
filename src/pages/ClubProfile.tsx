import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { PublicNav } from '@/components/layout/PublicNav';
import { PublicFooter } from '@/components/layout/PublicFooter';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BadgeCheck, MapPin, MessageSquare } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/context/LanguageContext';
import { messageOwner } from '@/lib/athleteActions';
import { useAuth } from '@/hooks/useAuth';

interface ClubData {
  id: string;
  name: string;
  sport: string | null;
  sports: string[] | null;
  city: string | null;
  about: string | null;
  hours: string | null;
  programs: any;
  verified: boolean;
}

const ClubProfile = () => {
  const { id } = useParams<{ id: string }>();
  const { t } = useLanguage();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [club, setClub] = useState<ClubData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from('club_profiles')
        .select('*')
        .eq('id', id)
        .eq('application_status', 'approved')
        .maybeSingle();
      setClub(data as any);
      setLoading(false);
    })();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <PublicNav />
        <main className="flex-1 container py-20 text-center text-muted-foreground">{t.coach_loading}</main>
        <PublicFooter />
      </div>
    );
  }

  if (!club) {
    return (
      <div className="min-h-screen flex flex-col">
        <PublicNav />
        <main className="flex-1 container py-20 text-center">
          <h1 className="font-display">{t.club_not_found}</h1>
          <Link to="/search"><Button className="mt-6">{t.coach_back_to_search}</Button></Link>
        </main>
        <PublicFooter />
      </div>
    );
  }

  const openMessage = () => messageOwner({ userId: user?.id, role: profile?.role, navigate, signInText: t.coach_sign_in_required, athleteOnlyText: t.disc_only_athletes }, club.id);

  const programs: Array<{ name: string; duration?: string; price?: number }> =
    Array.isArray(club.programs) ? club.programs : [];

  return (
    <div className="min-h-screen flex flex-col">
      <PublicNav />

      <main className="flex-1">
        <PageHeader title={club.name} tone="blue">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            <div className="flex flex-wrap items-center gap-1.5">
              {(club.sports?.length ? club.sports : club.sport ? [club.sport] : []).map(s => (
                <span key={s} className="bg-[#F3EDE2] px-2.5 py-1 text-sm font-semibold capitalize text-foreground">{s}</span>
              ))}
              {club.verified && <span className="inline-flex items-center gap-1 bg-[#F3EDE2] px-2.5 py-1 text-sm font-semibold text-foreground"><BadgeCheck className="h-4 w-4 text-primary" /> {t.verified}</span>}
            </div>
            {club.city && <span className="flex items-center gap-1.5 text-base"><MapPin className="h-4 w-4" /> {club.city}</span>}
            <button type="button" onClick={openMessage} className="inline-flex h-12 items-center gap-2 bg-[#F3EDE2] px-6 font-display text-base font-bold uppercase text-foreground transition-colors hover:bg-white">
              <MessageSquare className="h-4 w-4" /> {t.coach_message} {club.name}
            </button>
          </div>
        </PageHeader>

        <section className="container space-y-10 py-12 md:py-16">
          <Tabs defaultValue="about" className="w-full">
            <TabsList className="flex flex-wrap h-auto">
              <TabsTrigger value="about">{t.club_about}</TabsTrigger>
              <TabsTrigger value="programs">{t.club_programs}</TabsTrigger>
            </TabsList>

            <TabsContent value="about" className="mt-6">
              <div className="grid gap-8 md:grid-cols-2">
                <div className="surface p-6">
                  <h2 className="mb-4 text-4xl">{t.club_about}</h2>
                  <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                    {club.about || t.club_no_desc}
                  </p>
                </div>
                {club.hours && (
                  <div className="surface p-6">
                    <h3 className="mb-3 text-3xl">{t.club_hours}</h3>
                    <p className="text-sm text-muted-foreground whitespace-pre-line">{club.hours}</p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="programs" className="mt-6">
              {programs.length === 0 ? (
                <p className="text-muted-foreground">{t.club_no_programs}</p>
              ) : (
                <div className="grid gap-3 md:grid-cols-3">
                  {programs.map((p, i) => (
                    <div key={i} className="surface p-5 flex flex-col">
                      <p className="t-plain text-xl">{p.name}</p>
                      {p.duration && <p className="text-xs text-muted-foreground mt-1">{p.duration}</p>}
                      {p.price != null && (
                        <p className="mt-3 font-display text-5xl font-extrabold leading-none">€{p.price}</p>
                      )}

                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>


        </section>
      </main>

      <PublicFooter />
    </div>
  );
};

export default ClubProfile;
