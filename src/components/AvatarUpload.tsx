import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/context/LanguageContext';
import { toast } from 'sonner';

const BUCKET = 'avatars';
const MAX_ORIGINAL = 10 * 1024 * 1024;
const SIZE = 512;

export function initialsOf(name?: string | null) {
  return (name || '?').trim().split(/\s+/).slice(0, 2).map(p => p[0]?.toUpperCase() ?? '').join('') || '?';
}

async function toSquareWebp(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const side = Math.min(bitmap.width, bitmap.height);
  const canvas = document.createElement('canvas');
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas');
  ctx.drawImage(bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, SIZE, SIZE);
  bitmap.close?.();
  return new Promise((resolve, reject) =>
    canvas.toBlob(b => (b ? resolve(b) : reject(new Error('encode'))), 'image/webp', 0.85),
  );
}

/** Path inside the bucket from a stored public URL, if it belongs to the avatars bucket. */
function pathFromUrl(url?: string | null) {
  if (!url) return null;
  const marker = `/object/public/${BUCKET}/`;
  const i = url.indexOf(marker);
  return i >= 0 ? decodeURIComponent(url.slice(i + marker.length).split('?')[0]) : null;
}

export function AvatarUpload() {
  const { user, profile, refreshProfile } = useAuth();
  const { t } = useLanguage();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  if (!user || !profile) return null;

  const current = profile.avatar_url;

  const clearOthers = async (keep?: string) => {
    const { data } = await supabase.storage.from(BUCKET).list(user.id);
    const stale = (data ?? []).map(f => `${user.id}/${f.name}`).filter(p => p !== keep);
    const old = pathFromUrl(current);
    if (old && old !== keep && !stale.includes(old)) stale.push(old);
    if (stale.length) await supabase.storage.from(BUCKET).remove(stale);
  };

  const onFile = async (file?: File) => {
    if (!file) return;
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || file.size > MAX_ORIGINAL) {
      toast.error(t.avatar_error);
      return;
    }
    setBusy(true);
    try {
      const blob = await toSquareWebp(file);
      const path = `${user.id}/${Date.now()}.webp`;
      const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, blob, { contentType: 'image/webp', upsert: false });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
      const { error } = await supabase.from('profiles').update({ avatar_url: data.publicUrl }).eq('id', user.id);
      if (error) throw error;
      await clearOthers(path).catch(() => {});
      await refreshProfile();
      toast.success(t.avatar_saved);
    } catch {
      toast.error(t.avatar_error);
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const onRemove = async () => {
    setBusy(true);
    try {
      const { error } = await supabase.from('profiles').update({ avatar_url: null }).eq('id', user.id);
      if (error) throw error;
      await clearOthers().catch(() => {});
      await refreshProfile();
      toast.success(t.avatar_saved);
    } catch {
      toast.error(t.avatar_error);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex items-center gap-4">
      {current ? (
        <img src={current} alt={profile.full_name ?? ''} className="h-20 w-20 rounded-full object-cover border border-border" />
      ) : (
        <div className="h-20 w-20 rounded-full border border-border bg-secondary text-foreground flex items-center justify-center font-display text-2xl">
          {initialsOf(profile.full_name)}
        </div>
      )}
      <div className="space-y-2">
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" disabled={busy} onClick={() => inputRef.current?.click()}>
            {t.avatar_upload}
          </Button>
          {current && (
            <Button type="button" size="sm" variant="outline" disabled={busy} onClick={onRemove}>
              {t.avatar_remove}
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground">{t.avatar_hint}</p>
        <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden"
          onChange={e => onFile(e.target.files?.[0])} />
      </div>
    </div>
  );
}
