import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/context/LanguageContext';
import { toast } from 'sonner';

const BUCKET = 'certificates';
const MAX = 10 * 1024 * 1024;
const TYPES = ['application/pdf', 'image/png', 'image/jpeg', 'image/webp'];

type Cert = {
  id: string; title: string; issuer: string | null; issued_on: string | null;
  file_path: string; file_name: string | null; status: string; rejection_reason: string | null;
};

export async function openCertificate(path: string, errorText: string) {
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, 60);
  if (error || !data) return toast.error(errorText);
  window.open(data.signedUrl, '_blank', 'noopener');
}

export function CertificatesManager() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [items, setItems] = useState<Cert[]>([]);
  const [title, setTitle] = useState('');
  const [issuer, setIssuer] = useState('');
  const [issuedOn, setIssuedOn] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    if (!user) return;
    const { data } = await supabase.from('coach_certificates')
      .select('id, title, issuer, issued_on, file_path, file_name, status, rejection_reason')
      .eq('owner_id', user.id).order('created_at', { ascending: false });
    setItems((data as Cert[]) ?? []);
  };
  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [user?.id]);

  if (!user) return null;

  const pick = (f?: File) => {
    if (!f) return setFile(null);
    if (!TYPES.includes(f.type) || f.size > MAX) {
      toast.error(t.cert_file_invalid);
      if (fileRef.current) fileRef.current.value = '';
      return setFile(null);
    }
    setFile(f);
  };

  const submit = async () => {
    if (!title.trim()) return toast.error(t.cert_title_required);
    if (!file) return toast.error(t.cert_file_required);
    setBusy(true);
    const safe = file.name.replace(/[^a-zA-Z0-9._-]+/g, '_').slice(-80);
    const path = `${user.id}/${Date.now()}-${safe}`;
    const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, file, { contentType: file.type });
    if (upErr) { setBusy(false); return toast.error(t.cert_error); }
    const { error } = await supabase.from('coach_certificates').insert({
      owner_id: user.id, title: title.trim().slice(0, 120), issuer: issuer.trim().slice(0, 120) || null,
      issued_on: issuedOn || null, file_path: path, file_name: file.name,
    });
    if (error) {
      await supabase.storage.from(BUCKET).remove([path]);
      setBusy(false);
      return toast.error(t.cert_error);
    }
    setTitle(''); setIssuer(''); setIssuedOn(''); setFile(null);
    if (fileRef.current) fileRef.current.value = '';
    setBusy(false);
    toast.success(t.cert_added);
    load();
  };

  const remove = async (c: Cert) => {
    const { error } = await supabase.from('coach_certificates').delete().eq('id', c.id);
    if (error) return toast.error(t.cert_error);
    await supabase.storage.from(BUCKET).remove([c.file_path]);
    setItems(list => list.filter(x => x.id !== c.id));
  };

  const badge = (s: string) =>
    s === 'approved' ? <span className="text-xs px-2 py-0.5 rounded-md border border-border bg-secondary text-foreground">{t.cert_approved}</span>
    : s === 'rejected' ? <span className="text-xs px-2 py-0.5 rounded-md border border-destructive text-destructive">{t.cert_rejected}</span>
    : <span className="text-xs px-2 py-0.5 rounded-md border border-border text-muted-foreground">{t.cert_pending}</span>;

  return (
    <div className="space-y-4">
      {items.length > 0 && (
        <ul className="space-y-2">
          {items.map(c => (
            <li key={c.id} className="border border-border rounded-md px-3 py-2 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-medium truncate">{c.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {[c.issuer, c.issued_on?.slice(0, 4)].filter(Boolean).join(' · ')}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {badge(c.status)}
                  <Button type="button" size="sm" variant="outline" onClick={() => openCertificate(c.file_path, t.cert_error)}>{t.cert_view}</Button>
                  <Button type="button" size="sm" variant="ghost" onClick={() => remove(c)}>{t.cert_delete}</Button>
                </div>
              </div>
              {c.status === 'rejected' && c.rejection_reason && (
                <p className="mt-1 text-xs text-destructive">{c.rejection_reason}</p>
              )}
            </li>
          ))}
        </ul>
      )}
      <div className="grid gap-3 sm:grid-cols-2 border border-border rounded-md p-4">
        <div className="grid gap-1.5 sm:col-span-2">
          <Label htmlFor="cert-title">{t.cert_title} *</Label>
          <Input id="cert-title" maxLength={120} value={title} onChange={e => setTitle(e.target.value)} />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="cert-issuer">{t.cert_issuer}</Label>
          <Input id="cert-issuer" maxLength={120} value={issuer} onChange={e => setIssuer(e.target.value)} />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="cert-date">{t.cert_issued_on}</Label>
          <Input id="cert-date" type="date" value={issuedOn} onChange={e => setIssuedOn(e.target.value)} />
        </div>
        <div className="grid gap-1.5 sm:col-span-2">
          <Label htmlFor="cert-file">{t.cert_file} *</Label>
          <Input id="cert-file" ref={fileRef} type="file" accept="application/pdf,image/png,image/jpeg,image/webp"
            onChange={e => pick(e.target.files?.[0])} />
          <p className="text-xs text-muted-foreground">{t.cert_file_hint}</p>
        </div>
        <div className="sm:col-span-2">
          <Button type="button" disabled={busy || !file || !title.trim()} onClick={submit}>{t.cert_add}</Button>
        </div>
      </div>
    </div>
  );
}
