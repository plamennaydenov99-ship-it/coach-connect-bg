import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

const Settings = () => {
  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="font-display text-3xl">Settings</h1>
        <p className="text-muted-foreground mt-1">Account preferences and notifications.</p>
      </div>

      <section className="surface p-6 space-y-4">
        <h2 className="font-display text-xl">Account</h2>
        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" defaultValue="rui@atleta.app" />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" type="tel" defaultValue="+351 912 345 678" />
        </div>
        <Button onClick={() => toast.success('Account updated.')}>Save</Button>
      </section>

      <section className="surface p-6 space-y-4">
        <h2 className="font-display text-xl">Notifications</h2>
        {[
          { id: 'n1', label: 'New enquiries — email', def: true },
          { id: 'n2', label: 'Weekly performance summary', def: true },
          { id: 'n3', label: 'Marketing & product updates', def: false },
        ].map(n => (
          <div key={n.id} className="flex items-center justify-between">
            <Label htmlFor={n.id} className="text-sm cursor-pointer">{n.label}</Label>
            <Switch id={n.id} defaultChecked={n.def} />
          </div>
        ))}
      </section>

      <section className="surface p-6 space-y-3">
        <h2 className="font-display text-xl text-destructive">Danger zone</h2>
        <p className="text-sm text-muted-foreground">Permanently delete your account and all associated data.</p>
        <Button variant="destructive" onClick={() => toast.error('Account deletion requires confirmation.')}>
          Delete account
        </Button>
      </section>
    </div>
  );
};

export default Settings;
