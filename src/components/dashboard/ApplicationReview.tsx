import { Link, useNavigate } from 'react-router-dom';
import { Clock, XCircle, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/context/LanguageContext';
import { toast } from 'sonner';

export function ApplicationReview({ status }: { status: 'pending' | 'rejected' }) {
  const { t } = useLanguage();
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const logout = async () => {
    await signOut();
    toast.success(t.auth_signed_out);
    navigate('/start', { replace: true });
  };

  const pending = status === 'pending';

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="surface max-w-md w-full p-8 text-center">
        <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center border border-border">
          {pending ? <Clock className="h-6 w-6" /> : <XCircle className="h-6 w-6" />}
        </div>
        <h1 className="font-display text-2xl uppercase tracking-[0.1em]">
          {pending ? t.review_pending_title : t.review_rejected_title}
        </h1>
        <p className="text-sm text-muted-foreground mt-3">
          {pending ? t.review_pending_body : t.review_rejected_body}
        </p>
        <div className="mt-7 space-y-3">
          <Link to="/">
            <Button className="w-full" size="lg">{t.review_browse}</Button>
          </Link>
          <Button variant="outline" className="w-full" onClick={logout}>
            <LogOut className="h-3.5 w-3.5 mr-2" /> {t.auth_logout}
          </Button>
        </div>
      </div>
    </div>
  );
}
