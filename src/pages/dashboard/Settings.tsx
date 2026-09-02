import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { useLanguage } from '@/context/LanguageContext';


const Settings = () => {
  const { t } = useLanguage();
  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="font-display text-3xl">{t.dashsettings_title}</h1>
        <p className="text-muted-foreground mt-1">{t.dashsettings_sub}</p>
      </div>

      <section className="surface p-6 space-y-4">
        <h2 className="font-display text-xl">{t.dashsettings_account}</h2>
        <div className="grid gap-2">
          <Label htmlFor="email">{t.dashsettings_email}</Label>
          <Input id="email" type="email" defaultValue="rui@atleta.app" />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="phone">{t.dashsettings_phone}</Label>
          <Input id="phone" type="tel" defaultValue="+351 912 345 678" />
        </div>
        <Button onClick={() => toast.success(t.dashsettings_saved)}>{t.dashsettings_save}</Button>
      </section>

      <section className="surface p-6 space-y-4">
        <h2 className="font-display text-xl">{t.dashsettings_notifications}</h2>
        {[
          { id: 'n1', label: t.dashsettings_n1, def: true },
          { id: 'n2', label: t.dashsettings_n2, def: true },
          { id: 'n3', label: t.dashsettings_n3, def: false },
        ].map(n => (
          <div key={n.id} className="flex items-center justify-between">
            <Label htmlFor={n.id} className="text-sm cursor-pointer">{n.label}</Label>
            <Switch id={n.id} defaultChecked={n.def} />
          </div>
        ))}
      </section>

      <section className="surface p-6 space-y-3">
        <h2 className="font-display text-xl text-destructive">{t.dashsettings_danger}</h2>
        <p className="text-sm text-muted-foreground">{t.dashsettings_danger_sub}</p>
        <Button variant="destructive" onClick={() => toast.error(t.dashsettings_delete_toast)}>
          {t.dashsettings_delete}
        </Button>
      </section>
    </div>
  );
};

export default Settings;
