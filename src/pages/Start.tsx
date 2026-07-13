import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { PublicNav } from '@/components/layout/PublicNav';
import { PublicFooter } from '@/components/layout/PublicFooter';
import { useLanguage } from '@/context/LanguageContext';

const Start = () => {
  const { t } = useLanguage();
  const panels = [
    {
      role: 'athlete',
      title: t.start_athlete_title,
      tagline: t.start_athlete_tagline,
      image: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=1600&q=80',
    },
    {
      role: 'coach',
      title: t.start_coach_title,
      tagline: t.start_coach_tagline,
      image: 'https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?w=1600&q=80',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PublicNav />
      <main className="flex-1 flex flex-col">
        <div className="grid grid-cols-1 md:grid-cols-2 flex-1 min-h-[70vh]">
          {panels.map((p) => (
            <Link
              key={p.role}
              to={`/login?role=${p.role}`}
              className="group relative overflow-hidden border-b md:border-b-0 md:border-r border-border last:border-0 min-h-[50vh] md:min-h-[70vh]"
            >
              <img
                src={p.image}
                alt=""
                aria-hidden="true"
                className="absolute inset-0 h-full w-full object-cover grayscale opacity-60 transition-all duration-700 group-hover:opacity-80 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-background/30" />
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage:
                    'repeating-linear-gradient(45deg, rgba(255,255,255,0.03) 0 1px, transparent 1px 14px)',
                }}
              />
              <div className="relative z-10 h-full flex flex-col justify-end p-8 md:p-16">
                <span className="label-eyebrow text-gold">{t.start_continue_as}</span>
                <h2
                  className="mt-4 font-display text-foreground tracking-tight"
                  style={{ fontSize: 'clamp(40px, 6vw, 72px)', lineHeight: 0.9 }}
                >
                  {p.title}
                </h2>
                <p className="mt-4 text-foreground-muted font-body text-base max-w-md">
                  {p.tagline}
                </p>
                <span className="mt-6 inline-flex items-center gap-2 font-display uppercase tracking-[0.12em] text-sm text-foreground group-hover:text-gold transition-colors">
                  {t.start_continue} <ArrowRight className="h-4 w-4" />
                </span>
              </div>
            </Link>
          ))}
        </div>
        <div className="border-t border-border py-6 text-center">
          <a
            href="mailto:hello@zenit.app?subject=Club%20partnership"
            className="font-body text-sm text-foreground-subtle hover:text-foreground-muted transition-colors"
          >
            {t.start_club_prompt} <span className="underline underline-offset-4">{t.start_get_in_touch}</span>
          </a>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
};

export default Start;
