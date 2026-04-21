import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PublicNav } from '@/components/layout/PublicNav';
import { PublicFooter } from '@/components/layout/PublicFooter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SPORTS } from '@/lib/mockData';
import { Zap } from 'lucide-react';
import { toast } from 'sonner';

const Register = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [interests, setInterests] = useState<string[]>([]);
  const [role, setRole] = useState<'client' | 'coach'>('client');

  const toggle = (slug: string) =>
    setInterests(prev => prev.includes(slug) ? prev.filter(s => s !== slug) : [...prev, slug]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) {
      toast.error('Please complete all fields.');
      return;
    }
    if (form.password.length < 8) {
      toast.error('Password must be at least 8 characters.');
      return;
    }
    toast.success('Account created.');
    navigate(role === 'coach' ? '/dashboard' : '/search');
  };

  return (
    <div className="min-h-screen flex flex-col">
      <PublicNav />
      <main className="flex-1 container max-w-lg py-16">
        <div className="surface p-8">
          <div className="flex items-center gap-2 mb-6">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Zap className="h-5 w-5" strokeWidth={2.5} />
            </div>
            <span className="font-display text-xl">Create your account</span>
          </div>

          <form onSubmit={submit} className="space-y-5">
            <div className="grid gap-2">
              <Label>I am</Label>
              <div className="grid grid-cols-2 gap-2">
                {(['client', 'coach'] as const).map(r => (
                  <Button
                    key={r}
                    type="button"
                    variant={role === r ? 'default' : 'outline'}
                    onClick={() => setRole(r)}
                  >
                    {r === 'client' ? 'Looking for a coach' : 'I am a coach'}
                  </Button>
                ))}
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="name">Full name</Label>
              <Input id="name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
              <p className="text-xs text-muted-foreground">Minimum 8 characters.</p>
            </div>

            <div className="grid gap-2">
              <Label>Sport interests</Label>
              <div className="flex flex-wrap gap-2">
                {SPORTS.map(s => (
                  <button
                    key={s.slug}
                    type="button"
                    onClick={() => toggle(s.slug)}
                    className={`px-3 py-1.5 rounded-md text-sm border transition-colors ${
                      interests.includes(s.slug)
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'border-border bg-secondary hover:border-primary/40'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <Button type="submit" className="w-full" size="lg">Create account</Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account? <Link to="/login" className="text-primary hover:underline">Login</Link>
          </p>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
};

export default Register;
