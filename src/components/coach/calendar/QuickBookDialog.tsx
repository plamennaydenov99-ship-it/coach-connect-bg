import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';
import { useCoachTz } from '@/hooks/coach/useCoachCalendar';
import { useLanguage } from '@/context/LanguageContext';
import { todayStr, toTimeStr } from '@/lib/tz';
import { QuickBookForm } from './QuickBookForm';

export function QuickBookDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const mobile = useIsMobile();
  const tz = useCoachTz();
  const { t } = useLanguage();
  const close = () => onOpenChange(false);
  const form = open ? <QuickBookForm initial={{ date: todayStr(tz), time: toTimeStr(new Date(Date.now() + 3600000), tz).slice(0, 2) + ':00' }} onDone={close} onClose={close} /> : null;
  if (mobile) return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="coach-portal bg-portal-card border-portal-border max-h-[92dvh] overflow-y-auto [&>button]:hidden">
        <SheetTitle className="sr-only">{t.cal_quick_book}</SheetTitle>
        <SheetDescription className="sr-only">{t.cal_quick_book}</SheetDescription>
        {form}
      </SheetContent>
    </Sheet>
  );
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="coach-portal bg-portal-card border-portal-border rounded-[4px] max-w-md max-h-[90vh] overflow-y-auto [&>button]:hidden">
        <DialogTitle className="sr-only">{t.cal_quick_book}</DialogTitle>
        <DialogDescription className="sr-only">{t.cal_quick_book}</DialogDescription>
        {form}
      </DialogContent>
    </Dialog>
  );
}