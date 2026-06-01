import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, MapPin, Calendar, Users, Award } from 'lucide-react';
import { AnnouncementBar } from '@/components/layout/AnnouncementBar';
import { PublicNav } from '@/components/layout/PublicNav';
import { PublicFooter } from '@/components/layout/PublicFooter';
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
          <Link to="/camps" className="mt-4 inline-block text-accent-electric">← Back to camps</Link>
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
      <AnnouncementBar />
      <PublicNav />

      <main className="flex-1">
        <section className="relative h-[400px] overflow-hidden">
          <img src={campImage(camp.image)} alt={camp.name} className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-background/30" />
          <div className="container relative h-full flex flex-col justify-between py-6">
            <Link to="/camps" className="self-start inline-flex items-center gap-2 px-3 py-2 bg-background/60 backdrop-blur border border-border text-foreground font-display uppercase tracking-[0.12em] text-[12px] rounded-sm hover:border-accent-electric transition-colors">
              <ArrowLeft className="h-4 w-4" /> Back
            </Link>
            <div>
              <span className="px-2 py-1 bg-background/85 backdrop-blur font-display uppercase tracking-[0.12em] text-[11px] text-accent-electric rounded-sm">
                {camp.sport}
              </span>
              <h1 className="font-display text-4xl md:text-6xl text-foreground mt-3">{camp.name}</h1>
            </div>
          </div>
        </section>

        <section className="container py-12 grid gap-10 lg:grid-cols-[2fr_1fr]">
          <div className="flex flex-col gap-10">
            <div>
              <span className="label-eyebrow text-accent-electric">About this camp</span>
              <p className="mt-3 text-foreground-muted font-body text-[15px] leading-relaxed normal-case">
                Join {camp.coach} for an intensive {camp.duration.toLowerCase()} experience in {camp.city}. This camp is designed for {camp.ageGroup.toLowerCase()} at {camp.level.toLowerCase()} level — combining technical drills, tactical sessions and live match play. Limited to a small group to ensure personal attention and rapid progress.
              </p>
            </div>

            <div>
              <span className="label-eyebrow text-accent-electric">Daily schedule</span>
              <Accordion type="single" collapsible className="mt-3 border border-border rounded-sm">
                {schedule.map((d, i) => (
                  <AccordionItem key={i} value={`d-${i}`} className="border-b border-border last:border-b-0 px-4">
                    <AccordionTrigger className="font-display uppercase tracking-[0.1em] text-[14px]">{d.day}</AccordionTrigger>
                    <AccordionContent>
                      <ul className="space-y-1.5 text-[14px] text-foreground-muted font-body">
                        {d.items.map((it, j) => <li key={j}>{it}</li>)}
                      </ul>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>

            <div className="border border-border bg-card p-5 rounded-sm">
              <span className="label-eyebrow text-accent-electric">Hosted by</span>
              <div className="mt-3 flex items-center gap-4">
                <div className="h-14 w-14 bg-background-tertiary border border-border rounded-sm flex items-center justify-center font-display text-xl text-accent-electric">
                  {camp.coach.split(' ').slice(-1)[0][0]}
                </div>
                <div>
                  <p className="font-display text-[18px] text-foreground">{camp.coach}</p>
                  <p className="text-[13px] text-foreground-muted">Verified host on Atleta · Based in {camp.city}</p>
                </div>
              </div>
            </div>
          </div>

          <aside className="lg:sticky lg:top-24 self-start border border-border bg-card p-6 rounded-sm flex flex-col gap-4">
            <div>
              <p className="font-display text-[32px] text-foreground leading-none">{camp.price}</p>
              <p className="text-[12px] text-foreground-muted mt-1">per person</p>
            </div>

            <ul className="flex flex-col gap-2.5 text-[13px] text-foreground-muted border-t border-b border-border py-4">
              <li className="flex items-center gap-2"><Calendar className="h-3.5 w-3.5" /> {camp.dates}</li>
              <li className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5" /> {camp.city}</li>
              <li className="flex items-center gap-2"><Users className="h-3.5 w-3.5" /> {camp.ageGroup}</li>
              <li className="flex items-center gap-2"><Award className="h-3.5 w-3.5" /> {camp.level}</li>
              <li className={`flex items-center gap-2 ${camp.spotsLeft < 10 ? 'text-accent-electric' : ''}`}>
                <span className="h-1.5 w-1.5 bg-current rounded-full" /> {camp.spotsLeft} {t.spots_left}
              </li>
            </ul>

            <button className="w-full px-4 py-3 bg-accent-electric text-primary-foreground font-display uppercase tracking-[0.12em] text-[13px] rounded-sm hover:bg-accent-electric-dim transition-colors">
              {t.apply_camp}
            </button>
            <button className="w-full px-4 py-3 border border-border-hover text-foreground font-display uppercase tracking-[0.12em] text-[13px] rounded-sm hover:border-accent-electric transition-colors">
              {t.ask_question}
            </button>
          </aside>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
