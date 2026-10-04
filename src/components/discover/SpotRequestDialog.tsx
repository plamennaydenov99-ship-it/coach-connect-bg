import { useState } from 'react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useIsMobile } from '@/hooks/use-mobile';
import { useLanguage } from '@/context/LanguageContext';
import { requestSpot, type AthleteActionContext } from '@/lib/athleteActions';

export type RequestSession = { id: string; ownerId: string; title: string; date: string; summary: string };
export function SpotRequestDialog({ session, ctx, onClose, onRequested }: { session: RequestSession; ctx: AthleteActionContext; onClose: () => void; onRequested: (id: string) => void }) {
  const { t } = useLanguage();
  const mobile = useIsMobile();
  const [content, setContent] = useState(t.disc_request_prefill.replace('{title}', session.title).replace('{date}', session.date));
  const [busy, setBusy] = useState(false);
  const send = async () => {
    if (!content.trim() || busy) return;
    setBusy(true);
    try {
      const result = await requestSpot(ctx, session.id, session.ownerId, content);
      if (result) { onRequested(session.id); toast.success(result === 'sent' ? t.disc_request_sent : t.disc_requested); onClose(); }
    } catch (error) { toast.error((error as { message?: string }).message || t.crm_error); }
    finally { setBusy(false); }
  };
  const form = <div className="space-y-4 mt-4">
    <Label htmlFor="spot-message">{t.disc_message}</Label>
    <Textarea id="spot-message" value={content} onChange={e => setContent(e.target.value)} rows={5} maxLength={4000} />
    <div className="flex justify-end gap-2"><Button variant="outline" onClick={onClose}>{t.tr_cancel}</Button><Button onClick={send} disabled={busy || !content.trim()}>{busy ? t.coach_sending : t.coach_send_request}</Button></div>
  </div>;
  if (mobile) return <Sheet open onOpenChange={open => !open && onClose()}><SheetContent side="bottom" className="coach-portal bg-portal-card max-h-[90dvh] overflow-y-auto"><SheetTitle>{t.disc_request}</SheetTitle><SheetDescription>{session.summary}</SheetDescription>{form}</SheetContent></Sheet>;
  return <Dialog open onOpenChange={open => !open && onClose()}><DialogContent className="coach-portal bg-portal-card"><DialogTitle>{t.disc_request}</DialogTitle><DialogDescription>{session.summary}</DialogDescription>{form}</DialogContent></Dialog>;
}
