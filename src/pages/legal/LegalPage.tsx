/*
 * Draft generated for review by qualified counsel. Not legal advice.
 */
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { PublicNav } from '@/components/layout/PublicNav';
import { PublicFooter } from '@/components/layout/PublicFooter';
import { PageHeader } from '@/components/layout/PageHeader';
import { useLanguage } from '@/context/LanguageContext';
import { usePageMeta } from '@/hooks/usePageMeta';
import { UPDATED, type LegalSet } from '@/lib/legal/owner';
import { privacy } from '@/lib/legal/privacy';
import { terms } from '@/lib/legal/terms';
import { notice } from '@/lib/legal/notice';
import { cookies } from '@/lib/legal/cookies';
import { accessibility } from '@/lib/legal/accessibility';

const DOCS: Record<string, LegalSet> = { privacy, terms, legal: notice, cookies, accessibility };
const DRAFT_COMMENT = '<!-- Draft generated for review by qualified counsel. Not legal advice. -->';

/** Legal pages are written in Bulgarian and English; French readers get the English text. */
export default function LegalPage({ doc }: { doc: keyof typeof DOCS }) {
  const { lang, t } = useLanguage();
  const { hash } = useLocation();
  const l = lang === 'bg' ? 'bg' : 'en';
  const d = DOCS[doc][l];

  usePageMeta(d.title, d.summary);

  useEffect(() => {
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView();
    else window.scrollTo(0, 0);
  }, [hash, doc]);

  return (
    <div className="min-h-screen bg-background">
      <PublicNav />
      <main>
        <div hidden dangerouslySetInnerHTML={{ __html: DRAFT_COMMENT }} />
        <PageHeader title={d.title} sub={d.summary} tone="sand" />
        <article className="container max-w-3xl py-12 md:py-16" lang={l}>
          <p className="mb-2 text-sm text-foreground-muted">{t.legal_updated} {UPDATED[l]}</p>
          <p className="mb-10 border-l-4 border-accent bg-background-secondary px-4 py-3 text-sm">{t.legal_draft}</p>
          {lang === 'fr' && <p className="mb-10 text-sm text-foreground-muted">{t.legal_lang_note}</p>}
          <div className="space-y-10">
            {d.blocks.map(b => (
              <section key={b.h} id={b.id} className="scroll-mt-24">
                <h2 className="mb-4 text-3xl md:text-4xl">{b.h}</h2>
                {b.p?.map(p => <p key={p} className="mb-3 text-base leading-relaxed">{p}</p>)}
                {b.list && (
                  <ul className="mb-3 list-disc space-y-2 pl-6 text-base leading-relaxed">
                    {b.list.map(i => <li key={i}>{i}</li>)}
                  </ul>
                )}
                {b.table && (
                  <div className="mb-3 overflow-x-auto">
                    <table className="w-full min-w-[560px] border-collapse text-left text-sm">
                      <thead>
                        <tr>{b.table[0].map(c => <th key={c} scope="col" className="border-b-2 border-foreground px-3 py-2 align-bottom font-semibold">{c}</th>)}</tr>
                      </thead>
                      <tbody>
                        {b.table.slice(1).map(row => (
                          <tr key={row[0]} className="border-b border-foreground/15">
                            {row.map((c, i) => i === 0
                              ? <th key={i} scope="row" className="px-3 py-3 align-top font-medium">{c}</th>
                              : <td key={i} className="px-3 py-3 align-top">{c}</td>)}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            ))}
          </div>
        </article>
      </main>
      <PublicFooter />
    </div>
  );
}
