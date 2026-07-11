import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PublicNav } from '@/components/layout/PublicNav';
import { PublicFooter } from '@/components/layout/PublicFooter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Zap } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { CITIES } from '@/lib/mockData';

type Role = 'athlete' | 'coach' | 'club';

const Register = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', city: '' });
  const [role, setRole] = useState<Role>('athlete');
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) {
      toast.error('Please complete all required fields.');
      return;
    }
    if (form.password.length < 8) {
      toast.error('Password must be at least 8 characters.');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: {
          role,
          full_name: form.name,
          city: form.city || null,
          language: 'en',
        },
      },
    });
    setLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success('Account created. Check your email to confirm before logging in.');
    navigate('/login');
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
              <div className="grid grid-cols-3 gap-2">
                {(['athlete', 'coach', 'club'] as const).map(r => (
                  <Button
                    key={r}
                    type="button"
                    variant={role === r ? 'default' : 'outline'}
                    onClick={() => setRole(r)}
                    className="capitalize"
                  >
                    {r}
                  </Button>
                ))}
              </div>
              {(role === 'coach' || role === 'club') && (
                <p className="text-xs text-muted-foreground">
                  Coach and club profiles require manual verification before appearing in search.
                </p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="name">{role === 'club' ? 'Club name' : 'Full name'}</Label>
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
              <Label htmlFor="city">City</Label>
              <select
                id="city"
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                value={form.city}
                onChange={e => setForm({ ...form, city: e.target.value })}
              >
                <option value="">Select a city</option>
                {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? 'Creating…' : 'Create account'}
            </Button>
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
