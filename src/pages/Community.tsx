import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { PublicNav } from '@/components/layout/PublicNav';
import { PublicFooter } from '@/components/layout/PublicFooter';
import { PostCard } from '@/components/community/PostCard';
import { COMMUNITY_POSTS } from '@/lib/communityData';
import { COACHES } from '@/lib/mockData';
import { CAMPS } from '@/lib/camps';
import { useLanguage } from '@/context/LanguageContext';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { MapPin, Calendar } from 'lucide-react';

const SPORT_TABS = ['all', 'football', 'tennis', 'padel', 'basketball', 'running', 'swimming', 'boxing', 'bjj', 'yoga', 'cycling', 'crossfit', 'golf'];
const TRENDING = [
  { sport: 'Football', count: 34 },
  { sport: 'Padel', count: 28 },
  { sport: 'Running', count: 21 },
  { sport: 'Tennis', count: 18 },
  { sport: 'CrossFit', count: 15 },
];

export default function Community() {
  const { t } = useLanguage();
  const [tab, setTab] = useState('all');

  const filtered = useMemo(
    () => tab === 'all' ? COMMUNITY_POSTS : COMMUNITY_POSTS.filter(p => p.sport === tab),
    [tab],
  );

  const trendingMax = Math.max(...TRENDING.map(t => t.count));
  const sidebarCoaches = COACHES.slice(0, 3);
  const sidebarCamps = CAMPS.slice(0, 2);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PublicNav />

      <main className="flex-1">
        <section className="border-b border-border py-14 md:py-16">
          <div className="container">
            <h1 className="font-display text-4xl md:text-5xl text-foreground">{t.community_hero_title}</h1>
            <p className="mt-4 max-w-2xl text-[16px] text-foreground-muted font-body normal-case">{t.community_hero_sub}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span tabIndex={0}>
                      <button
                        disabled
                        className="px-4 py-3 bg-accent-electric text-primary-foreground font-display uppercase tracking-[0.12em] text-[13px] rounded-sm opacity-60 cursor-not-allowed"
                      >
                        {t.community_cta_post}
                      </button>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>{t.sign_in_to_post}</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <a
                href="#sport-tabs"
                className="px-4 py-3 border border-border-hover text-foreground font-display uppercase tracking-[0.12em] text-[13px] rounded-sm hover:border-accent-electric transition-colors"
              >
                {t.community_cta_browse}
              </a>
            </div>
          </div>
        </section>

        <section id="sport-tabs" className="border-b border-border sticky top-16 md:top-20 z-30 bg-background">
          <div className="container overflow-x-auto">
            <div className="flex gap-6 py-3 min-w-max">
              {SPORT_TABS.map(s => (
                <button
                  key={s}
                  onClick={() => setTab(s)}
                  className={`pb-1 font-display uppercase tracking-[0.12em] text-[13px] transition-colors border-b-2 ${
                    tab === s ? 'border-accent-electric text-accent-electric' : 'border-transparent text-foreground-subtle hover:text-foreground-muted'
                  }`}
                >
                  {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="container py-10 grid gap-8 lg:grid-cols-[65fr_35fr]">
          <div className="flex flex-col gap-4">
            {filtered.length ? filtered.map(p => <PostCard key={p.id} post={p} />) : (
              <div className="border border-border bg-card p-12 text-center text-foreground-muted">No posts yet.</div>
            )}
          </div>

          <aside className="flex flex-col gap-5">
            <div className="border border-border bg-card p-5 rounded-sm">
              <h3 className="font-display text-[16px] text-foreground">{t.join_community_title}</h3>
              <p className="mt-2 text-[13px] text-foreground-muted font-body normal-case">{t.join_community_sub}</p>
              <div className="mt-4 flex gap-2">
                <Link to="/login" className="flex-1 text-center px-3 py-2 border border-border-hover text-foreground font-display uppercase tracking-[0.12em] text-[12px] rounded-sm hover:border-accent-electric transition-colors">
                  {t.sign_in}
                </Link>
                <Link to="/register" className="flex-1 text-center px-3 py-2 bg-accent-electric text-primary-foreground font-display uppercase tracking-[0.12em] text-[12px] rounded-sm hover:bg-accent-electric-dim transition-colors">
                  {t.register}
                </Link>
              </div>
            </div>

            <div className="border border-border bg-card p-5 rounded-sm">
              <h3 className="font-display text-[14px] text-foreground tracking-[0.1em]">{t.trending_sports}</h3>
              <ul className="mt-4 flex flex-col gap-3">
                {TRENDING.map(item => (
                  <li key={item.sport}>
                    <div className="flex items-center justify-between text-[13px]">
                      <span className="text-foreground">{item.sport}</span>
                      <span className="text-foreground-muted">{item.count} posts</span>
                    </div>
                    <div className="mt-1.5 h-0.5 bg-border">
                      <div className="h-full bg-accent-electric" style={{ width: `${(item.count / trendingMax) * 100}%` }} />
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="border border-border bg-card p-5 rounded-sm">
              <h3 className="font-display text-[14px] text-foreground tracking-[0.1em]">{t.active_coaches}</h3>
              <ul className="mt-4 flex flex-col gap-3">
                {sidebarCoaches.map(c => (
                  <li key={c.slug} className="flex items-center gap-3">
                    <img src={c.avatar} alt={c.name} className="h-10 w-10 rounded-full object-cover border border-border" />
                    <div className="flex-1 min-w-0">
                      <p className="font-display text-[14px] text-foreground truncate">{c.name}</p>
                      <p className="text-[12px] text-foreground-muted capitalize">{c.sport} · {c.city}</p>
                    </div>
                    <Link to={`/coach/${c.slug}`} className="text-[11px] font-display uppercase tracking-[0.1em] text-accent-electric hover:underline">
                      {t.view_profile}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="border border-border bg-card p-5 rounded-sm">
              <h3 className="font-display text-[14px] text-foreground tracking-[0.1em]">{t.upcoming_camps}</h3>
              <ul className="mt-4 flex flex-col gap-3">
                {sidebarCamps.map(c => (
                  <li key={c.id}>
                    <Link to={`/camps/${c.id}`} className="block p-3 border border-border hover:border-accent-electric transition-colors rounded-sm">
                      <p className="font-display text-[14px] text-foreground truncate">{c.name}</p>
                      <div className="mt-1 flex items-center gap-3 text-[12px] text-foreground-muted">
                        <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {c.city}</span>
                        <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {c.dates}</span>
                      </div>
                      <span className="mt-2 inline-block text-[11px] font-display uppercase tracking-[0.1em] text-accent-electric">View →</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
