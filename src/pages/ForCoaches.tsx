import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { PublicNav } from '@/components/layout/PublicNav';
import { PublicFooter } from '@/components/layout/PublicFooter';
import { Reveal } from '@/components/Reveal';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { SPORTS } from '@/lib/mockData';
import { usePageMeta } from '@/hooks/usePageMeta';

const btnLight = 'inline-flex h-14 items-center gap-3 bg-[#F3EDE2] px-7 font-display text-lg font-bold uppercase text-foreground transition-colors hover:bg-white';
const btnGhost = 'inline-flex h-14 items-center gap-3 bg-[#F3EDE2]/15 px-7 font-display text-lg font-bold uppercase text-[#F3EDE2] transition-colors hover:bg-[#F3EDE2]/28';

export default function ForCoaches() {
  const { t, lang } = useLanguage();
  usePageMeta(t.meta_forcoaches_t, t.meta_forcoaches_d);
  const { profile } = useAuth();
  const staff = profile?.role === 'coach' || profile?.role === 'club';
  const words = SPORTS.map(s => (lang === 'bg' ? s.labelBg : s.label));
  const blocks = [[t.fc_b1_t, t.fc_b1_b, 'bg-background-secondary'], [t.fc_b2_t, t.fc_b2_b, 'bg-primary text-primary-foreground'], [t.fc_b3_t, t.fc_b3_b, 'bg-accent text-white']];
  const steps = [[t.fc_s1_t, t.fc_s1_b], [t.fc_s2_t, t.fc_s2_b], [t.fc_s3_t, t.fc_s3_b]];
  const faq = [[t.fc_q1, t.fc_a1], [t.fc_q2, t.fc_a2], [t.fc_q3, t.fc_a3], [t.fc_q4, t.fc_a4], [t.fc_q5, t.fc_a5]];
  const cta = staff ? (
    <Link to={`/${profile?.role}/dashboard`} className={btnLight}>{t.fc_cta_open}<ArrowRight className="h-5 w-5" /></Link>
  ) : (
    <>
      <Link to="/start?role=coach&mode=signup" className={btnLight}>{t.fc_cta_coach}<ArrowRight className="h-5 w-5" /></Link>
      <Link to="/start?role=club&mode=signup" className={btnGhost}>{t.fc_cta_club}</Link>
    </>
  );

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <main className="flex-1">
        <section className="relative overflow-hidden bg-foreground text-[#F3EDE2]">
          <PublicNav variant="overlay" />
          <div className="container relative pb-10 pt-36 md:pt-48">
            <h1 className="max-w-[14ch]" style={{ fontSize: 'clamp(56px, 9vw, 150px)', lineHeight: 0.9, color: 'inherit' }}>{t.fc_hero_title}</h1>
            <p className="mt-8 max-w-[44ch] text-xl md:text-2xl">{t.fc_hero_sub}</p>
            <div className="mt-10 flex flex-wrap gap-3">{cta}</div>
          </div>
          <div className="relative mt-6 overflow-hidden pb-8" aria-hidden="true">
            <div className="flex w-max animate-marquee gap-10 whitespace-nowrap font-display font-extrabold uppercase leading-none text-[#F3EDE2]/25" style={{ fontSize: 'clamp(80px, 11vw, 180px)' }}>
              {[...words, ...words, ...words, ...words].map((w, i) => <span key={i}>{w}<span className="mx-10 inline-block h-[0.14em] w-[0.14em] rounded-full bg-current align-middle" /></span>)}
            </div>
          </div>
        </section>

        <section className="container py-20 md:py-28" aria-labelledby="h-what">
          <h2 id="h-what" className="max-w-[18ch] text-5xl md:text-7xl">{t.fc_what_title}</h2>
          <div className="mt-12 grid gap-3 md:grid-cols-3">
            {blocks.map(([title, body, tone], i) => (
              <Reveal key={title} delay={i * 120} className={`flex min-h-[380px] flex-col justify-between p-8 transition-transform duration-500 hover:-translate-y-2 ${tone}`}>
                <h3 className="font-display text-6xl font-extrabold uppercase leading-[0.9] md:text-7xl">{title}</h3>
                <p className="max-w-[30ch] text-lg md:text-xl">{body}</p>
              </Reveal>
            ))}
          </div>
        </section>

        <section className="bg-background-secondary py-20 md:py-28" aria-labelledby="h-how">
          <div className="container">
            <h2 id="h-how" className="max-w-[12ch] text-5xl md:text-7xl">{t.fc_how_title}</h2>
            <ol className="mt-12 grid gap-10 md:grid-cols-3">
              {steps.map(([title, body], i) => (
                <Reveal as="li" key={title} delay={i * 120} className="list-none">
                  <span aria-hidden="true" className="block font-display text-[140px] font-extrabold leading-[0.8] text-primary">{i + 1}</span>
                  <h3 className="mt-5 text-4xl">{title}</h3>
                  <p className="mt-3 max-w-[32ch] text-lg text-foreground-muted">{body}</p>
                </Reveal>
              ))}
            </ol>
          </div>
        </section>

        <section className="container py-20 md:py-28" aria-labelledby="h-faq">
          <div className="grid gap-10 md:grid-cols-12">
            <h2 id="h-faq" className="max-w-[10ch] text-5xl md:col-span-4 md:text-7xl">{t.fc_faq_title}</h2>
            <Accordion type="single" collapsible className="md:col-span-8">
              {faq.map(([q, a], i) => (
                <AccordionItem key={q} value={`q${i}`} className="mb-2 border-0 bg-background-secondary px-6">
                  <AccordionTrigger className="py-6 text-left font-display text-2xl font-extrabold uppercase hover:no-underline">{q}</AccordionTrigger>
                  <AccordionContent className="pb-6 text-lg text-foreground-muted">{a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>

        <section className="bg-primary py-20 text-primary-foreground md:py-28">
          <div className="container">
            <h2 className="max-w-[12ch]" style={{ fontSize: 'clamp(48px, 7vw, 110px)', lineHeight: 0.9, color: 'inherit' }}>{t.fc_close_title}</h2>
            <div className="mt-10 flex flex-wrap gap-3">{cta}</div>
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
