import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import { PublicNav } from '@/components/layout/PublicNav';
import { PublicFooter } from '@/components/layout/PublicFooter';
import { PageHeader } from '@/components/layout/PageHeader';
import { ReportForm } from '@/components/ReportForm';
import { useAuth } from '@/hooks/useAuth';
import { usePageMeta } from '@/hooks/usePageMeta';
import { useLanguage } from '@/context/LanguageContext';
import { db } from '@/lib/db';
import { hostOf } from '@/lib/events';
import { sportLabel } from '@/lib/trending';
import type { ClubListing } from '@/hooks/useClubs';

/** "Is this your club?" Signed-out visitors and non-club accounts are sent to sign in as a club, then back here. */
function ClaimPanel({ listing }: { listing: ClubListing }) {
  const { t } = useLanguage();
  const { user, profile } = useAuth();
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [mine, setMine] = useState<string | null>(null);
  const isClub = !!user && profile?.role === 'club';

  useEffect(() => {
    if (!isClub || !user) { setMine(null); return; }
    db.from('club_claims').select('status').eq('listing_id', listing.id).eq('claimant_id', user.id).maybeSingle()
      .then(({ data }: { data: { status: string } | null }) => setMine(data?.status ?? null));
  }, [isClub, user, listing.id]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setBusy(true);
    const { error } = await db.from('club_claims').insert({ listing_id: listing.id, claimant_id: user.id, message: message.trim() || null });
    setBusy(false);
    if (error) return toast.error(error.message);
    setMine('pending');
    toast.success(t.rd_claim_sent);
  };

  const line = 'h-12 w-full border-0 border-b-2 border-[#F3EDE2]/50 bg-transparent text-base text-white outline-none placeholder:text-white/60 focus:border-white';
  return (
    <div className="bg-accent p-6 text-white md:p-8">
      <h2 className="font-display text-4xl font-extrabold uppercase leading-[0.95]" style={{ color: 'inherit' }}>{t.rd_claim_h}</h2>
      <p className="mt-3 max-w-[44ch] text-lg">{t.rd_claim_b}</p>
      <div className="mt-6">
        {mine ? (
          <p className="bg-white/15 p-4" role="status">{mine === 'pending' ? t.rd_claim_pending : t.rd_claim_sent}</p>
        ) : isClub ? (
          <form onSubmit={send} className="space-y-4">
            <label className="block text-sm font-semibold">{t.rd_claim_msg}
              <textarea value={message} onChange={e => setMessage(e.target.value)} maxLength={1000} rows={3} className={`${line} mt-1 py-2`} />
            </label>
            <p className="text-xs text-white/90">{t.form_notice_claim} <Link to="/privacy" className="font-semibold underline underline-offset-4">{t.footer_privacy}</Link></p>
            <button type="submit" disabled={busy} className="h-12 bg-[#F3EDE2] px-6 font-display text-base font-bold uppercase text-foreground transition-colors hover:bg-white disabled:opacity-70">{t.rd_claim_send}</button>
          </form>
        ) : (
          <Link to={`/start?role=club&next=${encodeURIComponent(`/clubs/${listing.slug}`)}`} className="inline-flex h-12 items-center gap-2 bg-[#F3EDE2] px-6 font-display text-base font-bold uppercase text-foreground transition-colors hover:bg-white">{user ? t.rd_claim_btn : t.rd_claim_signin}<ArrowUpRight className="h-5 w-5" /></Link>
        )}
      </div>
    </div>
  );
}

/** A club that has not joined yet, shown from public facts only. */
export function ListingView({ listing }: { listing: ClubListing }) {
  const { t, lang } = useLanguage();
  usePageMeta(listing.name, t.meta_club_d.replace('{name}', listing.name));
  const mapHref = listing.lat != null && listing.lng != null
    ? `https://www.openstreetmap.org/?mlat=${listing.lat}&mlon=${listing.lng}#map=17/${listing.lat}/${listing.lng}`
    : listing.address ? `https://www.openstreetmap.org/search?query=${encodeURIComponent(`${listing.name}, ${listing.address}, ${listing.city}`)}` : null;

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <PublicNav />
      <main className="flex-1">
        <PageHeader title={listing.name} tone="blue">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            <div className="flex flex-wrap items-center gap-1.5">
              {listing.sports.map(s => <span key={s} className="bg-[#F3EDE2] px-2.5 py-1 text-sm font-semibold text-foreground">{sportLabel(s, lang)}</span>)}
              <span className="border border-[#F3EDE2] px-2.5 py-1 text-sm font-semibold">{t.rd_unclaimed}</span>
            </div>
            {(listing.district || listing.city) && <span className="flex items-center gap-1.5 text-base"><MapPin className="h-4 w-4" />{[listing.district, listing.city].filter(Boolean).join(', ')}</span>}
          </div>
        </PageHeader>

        <section className="container grid gap-10 py-10 md:py-14 lg:grid-cols-12">
          <div className="space-y-8 lg:col-span-7">
            <dl className="grid gap-2 sm:grid-cols-2">
              <div className="bg-background-secondary p-5 sm:col-span-2">
                <dt className="font-display text-xs font-bold uppercase tracking-[0.08em] text-foreground-muted">{t.rd_address}</dt>
                <dd className="mt-2 text-lg font-semibold">{listing.address || t.rd_no_address}</dd>
                {mapHref && <a href={mapHref} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex items-center gap-1 text-primary underline-offset-4 hover:underline">{t.rd_open_map}<ArrowUpRight className="h-4 w-4" /></a>}
              </div>
              {listing.website && (
                <div className="bg-background-secondary p-5">
                  <dt className="font-display text-xs font-bold uppercase tracking-[0.08em] text-foreground-muted">{t.rd_website}</dt>
                  <dd className="mt-2 break-all text-lg font-semibold"><a href={listing.website} target="_blank" rel="noopener noreferrer nofollow" className="underline underline-offset-4 hover:text-primary">{hostOf(listing.website)}</a></dd>
                </div>
              )}
              {listing.sports.length > 0 && (
                <div className="bg-background-secondary p-5">
                  <dt className="font-display text-xs font-bold uppercase tracking-[0.08em] text-foreground-muted">{t.rd_sports_l}</dt>
                  <dd className="mt-2 text-lg font-semibold">{listing.sports.map(s => sportLabel(s, lang)).join(', ')}</dd>
                </div>
              )}
            </dl>
            <div className="space-y-2 text-sm text-foreground-muted">
              <p>{t.rd_listed_from}{listing.source_url && <> · <a href={listing.source_url} target="_blank" rel="noopener noreferrer nofollow" className="underline underline-offset-4 hover:text-foreground">{listing.source_name || hostOf(listing.source_url)}</a></>}</p>
              <p>Map data © OpenStreetMap contributors</p>
            </div>
            <ReportForm targetType="club" targetId={listing.id} />
          </div>
          <aside className="lg:col-span-5"><ClaimPanel listing={listing} /></aside>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
