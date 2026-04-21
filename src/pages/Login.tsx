import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PublicNav } from '@/components/layout/PublicNav';
import { PublicFooter } from '@/components/layout/PublicFooter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Zap } from 'lucide-react';
import { toast } from 'sonner';

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Email and password required.');
      return;
    }
    toast.success('Welcome back.');
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen flex flex-col">
      <PublicNav />
      <main className="flex-1 container max-w-md py-16">
        <div className="surface p-8">
          <div className="flex items-center gap-2 mb-6">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Zap className="h-5 w-5" strokeWidth={2.5} />
            </div>
            <span className="font-display text-xl">Welcome back</span>
          </div>

          <form onSubmit={submit} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
            </div>
            <Button type="submit" className="w-full" size="lg">Login</Button>
          </form>

          <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
            <div className="h-px flex-1 bg-border" /> OR <div className="h-px flex-1 bg-border" />
          </div>

          <Button variant="outline" className="w-full" onClick={() => toast('Google sign-in (UI only)')}>
            <svg viewBox="0 0 24 24" className="h-4 w-4 mr-2" aria-hidden>
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.75h3.57c2.08-1.92 3.28-4.74 3.28-8.07z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.75c-.99.66-2.25 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.12A6.99 6.99 0 015.5 12c0-.74.13-1.46.34-2.12V7.04H2.18A11 11 0 001 12c0 1.78.43 3.45 1.18 4.96l3.66-2.84z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.65l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.04l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"/>
            </svg>
            Continue with Google
          </Button>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            New here? <Link to="/register" className="text-primary hover:underline">Create an account</Link>
          </p>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
};

export default Login;
