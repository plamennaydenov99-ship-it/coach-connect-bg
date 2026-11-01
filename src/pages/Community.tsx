import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { PublicNav } from '@/components/layout/PublicNav';
import { PublicFooter } from '@/components/layout/PublicFooter';
import { PageHeader } from '@/components/layout/PageHeader';
import { chip } from '@/lib/ui';
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
        <PageHeader title={t.community_hero_title} sub={t.community_hero_sub} tone="ink">
          <div className="flex flex-wrap gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span tabIndex={0}>
                    <button disabled className="h-12 cursor-not-allowed bg-[#F3EDE2] px-6 font-display text-base font-bold uppercase text-foreground opacity-60">{t.community_cta_post}</button>
                  </span>
                </TooltipTrigger>
                <TooltipContent>{t.sign_in_to_post}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <a href="#sport-tabs" className="inline-flex h-12 items-center bg-[#F3EDE2]/15 px-6 font-display text-base font-bold uppercase text-[#F3EDE2] transition-colors hover:bg-[#F3EDE2]/28">{t.community_cta_browse}</a>
          </div>
        </PageHeader>

        <section id="sport-tabs" className="sticky top-16 z-30 bg-background md:top-20">
          <div className="container overflow-x-auto">
            <div className="flex min-w-max gap-1.5 py-3">
              {SPORT_TABS.map(s => (
                <button
                  key={s}
                  onClick={() => setTab(s)}
                  className={chip(tab === s)}
                >
                  {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="container grid gap-8 py-10 md:py-14 lg:grid-cols-[65fr_35fr]">
          <div className="flex flex-col gap-4">
            {filtered.length ? filtered.map(p => <PostCard key={p.id} post={p} />) : (
              <div className="surface p-12 text-center text-foreground-muted">No posts yet.</div>
            )}
          </div>

          <aside className="flex flex-col gap-5">
            <div className="surface p-6">
              <h3 className="text-3xl">{t.join_community_title}</h3>
              <p className="mt-2 text-[13px] text-foreground-muted font-body normal-case">{t.join_community_sub}</p>
              <div className="mt-4 flex gap-2">
                <Link to="/start" className="flex-1 bg-background px-3 py-2.5 text-center font-display text-sm font-bold uppercase transition-colors hover:bg-card">
                  {t.sign_in}
                </Link>
                <Link to="/start" className="flex-1 bg-primary px-3 py-2.5 text-center font-display text-sm font-bold uppercase text-primary-foreground transition-colors hover:bg-primary-hover">
                  {t.register}
                </Link>
              </div>
            </div>

            <div className="surface p-6">
              <h3 className="text-3xl">{t.trending_sports}</h3>
              <ul className="mt-4 flex flex-col gap-3">
                {TRENDING.map(item => (
                  <li key={item.sport}>
                    <div className="flex items-center justify-between text-[13px]">
                      <span className="text-foreground">{item.sport}</span>
                      <span className="text-foreground-muted">{item.count} posts</span>
                    </div>
                    <div className="mt-1.5 h-2.5 bg-background">
                      <div className="h-full bg-primary" style={{ width: `${(item.count / trendingMax) * 100}%` }} />
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="surface p-6">
              <h3 className="text-3xl">{t.active_coaches}</h3>
              <ul className="mt-4 flex flex-col gap-3">
                {sidebarCoaches.map(c => (
                  <li key={c.slug} className="flex items-center gap-3">
                    <img src={c.avatar} alt={c.name} className="h-10 w-10 rounded-full object-cover" />
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-base font-semibold">{c.name}</p>
                      <p className="text-[12px] text-foreground-muted capitalize">{c.sport} · {c.city}</p>
                    </div>
                    <Link to={`/coaches/${c.slug}`} className="font-display text-sm font-bold uppercase text-primary hover:underline">
                      {t.view_profile}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="surface p-6">
              <h3 className="text-3xl">{t.upcoming_camps}</h3>
              <ul className="mt-4 flex flex-col gap-3">
                {sidebarCamps.map(c => (
                  <li key={c.id}>
                    <Link to={`/camps/${c.id}`} className="block bg-background p-3 transition-colors hover:bg-card">
                      <p className="truncate text-base font-semibold">{c.name}</p>
                      <div className="mt-1 flex items-center gap-3 text-[12px] text-foreground-muted">
                        <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {c.city}</span>
                        <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {c.dates}</span>
                      </div>
                      <span className="mt-2 inline-block font-display text-sm font-bold uppercase text-primary">View →</span>
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
