import { useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { rpc } from '@/lib/trending';
import { parseCsv } from '@/lib/csv';

type ImportResult = { dry: boolean; inserted: number; updated: number; errors: { row: number; slug: string | null; message: string }[] };

/** Paste or upload a CSV, check it (nothing is saved), then import it. Re-importing a row with the same slug updates it. */
export function ImportPanel({ title, hint, columns, example, mapRow, fn, onDone }: {
  title: string; hint: string; columns: string[]; example: string[];
  mapRow: (r: Record<string, string>) => Record<string, unknown>;
  fn: 'admin_import_events' | 'admin_import_clubs';
  onDone: () => void;
}) {
  const { toast } = useToast();
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const rows = useMemo(() => { try { return parseCsv(text).map(mapRow); } catch { return []; } }, [text, mapRow]);

  const run = async (dry: boolean) => {
    if (!rows.length) return toast({ title: 'Nothing to import', description: 'Paste a CSV with a header row and at least one line.', variant: 'destructive' });
    setBusy(true);
    const { data, error } = await rpc<ImportResult>(fn, { _rows: rows, _dry: dry });
    setBusy(false);
    if (error) return toast({ title: 'Import failed', description: error.message, variant: 'destructive' });
    setResult(data);
    if (!dry) { toast({ title: 'Imported', description: `${data?.inserted ?? 0} new, ${data?.updated ?? 0} updated` }); setText(''); onDone(); }
  };

  const template = () => {
    const q = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const blob = new Blob(['﻿' + columns.join(',') + '\n' + example.map(q).join(',') + '\n'], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = `${fn.replace('admin_import_', '')}-template.csv`; a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <details className="bg-background-secondary p-5">
      <summary className="cursor-pointer font-display text-xl font-extrabold uppercase">{title}</summary>
      <div className="mt-4 space-y-4">
        <p className="text-sm text-foreground-muted">{hint}</p>
        <div className="flex flex-wrap items-center gap-3">
          <Button type="button" variant="outline" size="sm" onClick={template}>Download template</Button>
          <label className="text-sm font-medium underline underline-offset-4">
            Choose a CSV file
            <input type="file" accept=".csv,text/csv" className="sr-only" onChange={async e => { const f = e.target.files?.[0]; if (f) { setText(await f.text()); setResult(null); } e.target.value = ''; }} />
          </label>
        </div>
        <textarea value={text} onChange={e => { setText(e.target.value); setResult(null); }} rows={6} placeholder={columns.join(',')} className="w-full border-2 border-foreground/20 bg-background p-3 font-mono text-xs outline-none focus:border-primary" />
        <div className="flex flex-wrap items-center gap-3">
          <Button type="button" variant="outline" disabled={busy || !text.trim()} onClick={() => run(true)}>{busy ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : null}Check (saves nothing)</Button>
          <Button type="button" disabled={busy || !result || result.dry === false || result.errors.length > 0} onClick={() => run(false)}>Import {rows.length} rows</Button>
          <span className="text-sm text-foreground-muted">{rows.length} rows read</span>
        </div>
        {result && (
          <div className="space-y-2 text-sm" role="status">
            <p className="font-semibold">{result.dry ? 'Check result' : 'Done'}: {result.inserted} new, {result.updated} would update, {result.errors.length} with problems.</p>
            {result.errors.length > 0 && (
              <ul className="max-h-48 space-y-1 overflow-auto bg-background p-3">
                {result.errors.map(e => <li key={`${e.row}-${e.slug}`}><span className="font-semibold">Row {e.row}</span>{e.slug ? ` (${e.slug})` : ''}: {e.message}</li>)}
              </ul>
            )}
            {result.errors.length > 0 && <p className="text-foreground-muted">Fix these rows in your sheet and check again. Import is switched on only when every row passes.</p>}
          </div>
        )}
      </div>
    </details>
  );
}
