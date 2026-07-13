import { useEffect, useState } from 'react';
import { Bookmark } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type Props = {
  targetType: 'coach' | 'event';
  targetId: string;
  variant?: 'icon' | 'default';
  className?: string;
};

export function BookmarkButton({ targetType, targetId, variant = 'default', className }: Props) {
  const { user, profile } = useAuth();
  const [bookmarked, setBookmarked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const isAthlete = !!user && profile?.role === 'athlete';

  useEffect(() => {
    if (!isAthlete || !user) { setLoaded(true); return; }
    (async () => {
      const { data } = await supabase
        .from('bookmarks')
        .select('id')
        .eq('athlete_id', user.id)
        .eq('target_type', targetType)
        .eq('target_id', targetId)
        .maybeSingle();
      setBookmarked(!!data);
      setLoaded(true);
    })();
  }, [isAthlete, user, targetType, targetId]);

  if (!isAthlete) return null;

  const toggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user || busy) return;
    setBusy(true);
    if (bookmarked) {
      const { error } = await supabase
        .from('bookmarks')
        .delete()
        .eq('athlete_id', user.id)
        .eq('target_type', targetType)
        .eq('target_id', targetId);
      if (error) toast.error(error.message);
      else { setBookmarked(false); toast.success('Removed from bookmarks'); }
    } else {
      const { error } = await supabase
        .from('bookmarks')
        .insert({ athlete_id: user.id, target_type: targetType, target_id: targetId });
      if (error) toast.error(error.message);
      else { setBookmarked(true); toast.success('Bookmarked'); }
    }
    setBusy(false);
  };

  if (!loaded) return null;

  return (
    <Button
      onClick={toggle}
      disabled={busy}
      variant={variant === 'icon' ? 'ghost' : 'outline'}
      size={variant === 'icon' ? 'icon' : 'sm'}
      className={className}
      aria-label={bookmarked ? 'Remove bookmark' : 'Add bookmark'}
    >
      <Bookmark className={`h-4 w-4 ${bookmarked ? 'fill-gold text-gold' : ''}`} />
      {variant === 'default' && (
        <span className="ml-2">{bookmarked ? 'Bookmarked' : 'Bookmark'}</span>
      )}
    </Button>
  );
}
