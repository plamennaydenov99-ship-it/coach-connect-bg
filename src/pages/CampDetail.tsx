import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, MapPin, Calendar, Users, Award } from 'lucide-react';
import { PublicNav } from '@/components/layout/PublicNav';
import { PublicFooter } from '@/components/layout/PublicFooter';
import { PageHeader } from '@/components/layout/PageHeader';
import { findCamp, campImage } from '@/lib/camps';
import { useLanguage } from '@/context/LanguageContext';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

// Booking integration to be added in Phase 2
export default function CampDetail() {
  const { id } = useParams();
  const camp = findCamp(Number(id));
  const { t } = useLanguage();

  if (!camp) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <PublicNav />
        <main className="flex-1 container py-20 text-center">
          <h1 className="font-display text-4xl">Camp not found</h1>
          <Link to="/camps" className="mt-4 inline-block font-semibold text-primary underline">← Back to camps</Link>
        </main>
        <PublicFooter />
      </div>
    );
  }

  const schedule = Array.from({ length: Math.min(camp.durationDays, 5) }, (_, i) => ({
    day: `Day ${i + 1}`,
    items: [
      '08:00 — Morning warmup & mobility',
      '09:00 — Technical drills',
      '11:00 — Tactical session',
      '13:00 — Lunch & recovery',
      '15:00 — Match play / scrimmage',
      '17:00 — Cooldown & video review',
    ],
  }));

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PublicNav />

      <main className="flex-1">
        <PageHeader title={camp.name} tone="ink" image={campImage(camp.image)}>
          <div className="flex flex-wrap items-center gap-3">
            <Link to="/camps" className="inline-flex h-11 items-center gap-2 bg-[#F3EDE2]/15 px-4 font-display text-base font-bold uppercase text-[#F3EDE2] transition-colors hover:bg-[#F3EDE2]/28"><ArrowLeft className="h-4 w-4" /> Back</Link>
            <span className="bg-[#F3EDE2] px-2.5 py-1 text-sm font-semibold text-foreground">{camp.sport}</span>
          </div>
        </PageHeader>

        <section className="container grid gap-10 py-12 md:py-16 lg:grid-cols-[2fr_1fr]">
          <div className="flex flex-col gap-10">
            <div>
              <h2 className="text-4xl">About this camp</h2>
              <p className="mt-4 max-w-[62ch] text-lg leading-relaxed text-foreground-muted">
                Join {camp.coach} for an intensive {camp.duration.toLowerCase()} experience in {camp.city}. This camp is designed for {camp.ageGroup.toLowerCase()} at {camp.level.toLowerCase()} level — combining technical drills, tactical sessions and live match play. Limited to a small group to ensure personal attention and rapid progress.
              </p>
            </div>

            <div>
              <h2 className="text-4xl">Daily schedule</h2>
              <Accordion type="single" collapsible className="mt-4 bg-background-secondary">
                {schedule.map((d, i) => (
                  <AccordionItem key={i} value={`d-${i}`} className="px-5">
                    <AccordionTrigger className="font-display text-xl font-bold uppercase">{d.day}</AccordionTrigger>
                    <AccordionContent>
                      <ul className="space-y-1.5 text-base text-foreground-muted">
                        {d.items.map((it, j) => <li key={j}>{it}</li>)}
                      </ul>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>

            <div className="surface p-6">
              <h2 className="text-3xl">Hosted by</h2>
              <div className="mt-4 flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center bg-foreground font-display text-2xl font-extrabold text-background">
                  {camp.coach.split(' ').slice(-1)[0][0]}
                </div>
                <div>
                  <p className="text-lg font-semibold">{camp.coach}</p>
                  <p className="text-sm text-foreground-muted">Verified host on Lokka · Based in {camp.city}</p>
                </div>
              </div>
            </div>
          </div>

          <aside className="surface flex flex-col gap-4 self-start p-6 lg:sticky lg:top-24">
            <div>
              <p className="font-display text-6xl font-extrabold leading-none">{camp.price}</p>
              <p className="mt-1.5 text-sm text-foreground-muted">per person</p>
            </div>

            <ul className="flex flex-col gap-2.5 py-2 text-base text-foreground-muted">
              <li className="flex items-center gap-2"><Calendar className="h-3.5 w-3.5" /> {camp.dates}</li>
              <li className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5" /> {camp.city}</li>
              <li className="flex items-center gap-2"><Users className="h-3.5 w-3.5" /> {camp.ageGroup}</li>
              <li className="flex items-center gap-2"><Award className="h-3.5 w-3.5" /> {camp.level}</li>
              <li className={`flex items-center gap-2 ${camp.spotsLeft < 10 ? 'font-semibold text-accent' : ''}`}>
                <span className="h-2 w-2 rounded-full bg-current" /> {camp.spotsLeft} {t.spots_left}
              </li>
            </ul>

            <button className="h-12 w-full bg-primary font-display text-base font-bold uppercase text-primary-foreground transition-colors hover:bg-primary-hover">
              {t.apply_camp}
            </button>
            <button className="h-12 w-full bg-background font-display text-base font-bold uppercase transition-colors hover:bg-card">
              {t.ask_question}
            </button>
          </aside>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
