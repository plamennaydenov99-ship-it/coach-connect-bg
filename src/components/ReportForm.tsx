import { useState } from 'react';
import { Link } from 'react-router-dom';
import { db } from '@/lib/db';
import { useLanguage } from '@/context/LanguageContext';

/** "Spot a mistake, or want this removed?" Anyone can send it; only admins can read it. */
export function ReportForm({ targetType, targetId }: { targetType: 'club' | 'event'; targetId: string }) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<'removal' | 'correction'>('correction');
  const [contact, setContact] = useState('');
  const [message, setMessage] = useState('');
  const [trap, setTrap] = useState(''); // honeypot: people never see this field, bots fill it in
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!message.trim() && reason === 'correction') return setError(t.form_report_need_message);
    if (trap) return setSent(true);
    setBusy(true);
    const { error: err } = await db.from('listing_reports').insert({
      target_type: targetType, target_id: targetId, reason,
      contact: contact.trim() || null, message: message.trim() || null,
    });
    setBusy(false);
    if (err) return setError(err.message.includes('too many') ? t.form_rate_limited : err.message);
    setSent(true);
  };

  if (sent) return <p className="bg-background-secondary p-4 text-sm" role="status">{t.rd_rep_thanks}</p>;
  if (!open) return <button type="button" onClick={() => setOpen(true)} className="text-sm font-medium underline underline-offset-4 hover:text-primary">{t.rd_rep_open}</button>;

  const field = 'h-12 w-full border-0 border-b-2 border-foreground/25 bg-transparent text-base outline-none transition-colors focus:border-primary';
  return (
    <form onSubmit={send} className="relative space-y-4 bg-background-secondary p-5" noValidate>
      <p className="font-display text-xl font-extrabold uppercase">{t.rd_rep_title}</p>
      <div className="flex flex-wrap gap-1.5" role="group">
        {(['correction', 'removal'] as const).map(r => (
          <button key={r} type="button" aria-pressed={reason === r} onClick={() => setReason(r)} className={`h-10 px-4 text-sm font-medium transition-colors ${reason === r ? 'bg-foreground text-background' : 'bg-background hover:bg-background-tertiary'}`}>
            {r === 'removal' ? t.rd_rep_removal : t.rd_rep_correction}
          </button>
        ))}
      </div>
      <label className="block text-sm"><span className="font-semibold">{t.rd_rep_message}</span>
        <textarea
          value={message}
          onChange={e => { setMessage(e.target.value); setError(null); }}
          maxLength={1000}
          rows={3}
          aria-invalid={!!error || undefined}
          aria-describedby={error ? 'report-error' : undefined}
          className="mt-1 w-full border-0 border-b-2 border-foreground/25 bg-transparent py-2 text-base outline-none focus:border-primary"
        />
      </label>
      <label className="block text-sm"><span className="font-semibold">{t.rd_rep_contact}</span>
        <input value={contact} onChange={e => setContact(e.target.value)} maxLength={200} type="email" autoComplete="email" className={field} />
      </label>
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label htmlFor={`report-website-${targetId}`}>Website</label>
        <input id={`report-website-${targetId}`} name="website" type="text" tabIndex={-1} autoComplete="off" value={trap} onChange={e => setTrap(e.target.value)} />
      </div>
      {error && <p id="report-error" role="alert" className="border-l-4 border-destructive bg-background px-4 py-3 text-sm font-medium text-destructive">{error}</p>}
      <p className="text-xs text-foreground-muted">{t.form_notice_report} <Link to="/privacy" className="font-semibold text-foreground underline underline-offset-4">{t.footer_privacy}</Link></p>
      <button type="submit" disabled={busy} className="h-11 bg-foreground px-6 font-display text-base font-bold uppercase text-background transition-colors hover:bg-primary disabled:opacity-70">{t.rd_rep_send}</button>
    </form>
  );
}
