import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Eye, MessageSquare, BadgeCheck, CheckCircle2, Crown, ChevronRight } from 'lucide-react';

const ENQUIRIES = [
  { name: 'Sofia M.', preview: 'Hi! Would you have any availability next Tuesday evening for a 1-hour session?', date: '2h ago' },
  { name: 'Diogo R.', preview: 'Looking to start training my serve. I\'m an intermediate player.', date: '1d ago' },
  { name: 'Mariana C.', preview: 'Are you taking new clients in October? Goal is to prep for an amateur league.', date: '2d ago' },
];

const CHECKLIST = [
  { label: 'Add a profile photo', done: true },
  { label: 'Write your bio', done: true },
  { label: 'List your specialisms', done: true },
  { label: 'Upload at least 4 gallery photos', done: true },
  { label: 'Set your pricing', done: true },
  { label: 'Add weekly availability', done: false },
  { label: 'Verify your ID', done: false },
];

const DashboardHome = () => {
  const completion = Math.round((CHECKLIST.filter(c => c.done).length / CHECKLIST.length) * 100);

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="font-display text-3xl">Welcome back, Rui</h1>
        <p className="text-muted-foreground mt-1">Here's what's happening with your profile this week.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Profile views', value: '1,284', delta: '+12%', icon: Eye },
          { label: 'Enquiries received', value: '23', delta: '+5', icon: MessageSquare },
          { label: 'Subscription', value: 'Pro Coach', delta: 'Renews 12 May', icon: Crown },
          { label: 'Completion', value: `${completion}%`, delta: 'Almost there', icon: BadgeCheck },
        ].map(s => (
          <div key={s.label} className="surface p-5">
            <div className="flex items-center justify-between">
              <s.icon className="h-5 w-5 text-primary" />
              <span className="text-xs text-muted-foreground">{s.delta}</span>
            </div>
            <p className="font-display text-2xl mt-3">{s.value}</p>
            <p className="text-xs text-muted-foreground mt-1 uppercase tracking-wide">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="surface p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl">Profile completion</h2>
            <span className="text-sm font-semibold text-primary">{completion}%</span>
          </div>
          <Progress value={completion} className="h-2" />
          <ul className="mt-5 space-y-2">
            {CHECKLIST.map(item => (
              <li key={item.label} className="flex items-center gap-3 text-sm">
                <CheckCircle2 className={`h-4 w-4 ${item.done ? 'text-primary' : 'text-muted-foreground/40'}`} />
                <span className={item.done ? 'text-muted-foreground line-through' : ''}>{item.label}</span>
              </li>
            ))}
          </ul>
          <Link to="/dashboard/profile">
            <Button className="mt-5">Complete profile</Button>
          </Link>
        </div>

        <div className="surface p-6">
          <h2 className="font-display text-xl mb-4">Quick actions</h2>
          <div className="space-y-2">
            {[
              { label: 'Edit profile', to: '/dashboard/profile' },
              { label: 'View public profile', to: '/coach/rui-marques' },
              { label: 'Upgrade plan', to: '/dashboard/billing' },
              { label: 'Open analytics', to: '/dashboard/analytics' },
            ].map(a => (
              <Link key={a.to} to={a.to}>
                <Button variant="outline" className="w-full justify-between">
                  {a.label} <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="surface p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl">Recent enquiries</h2>
          <Link to="/dashboard/messages">
            <Button variant="ghost" size="sm">View all <ChevronRight className="h-4 w-4 ml-1" /></Button>
          </Link>
        </div>
        <div className="divide-y divide-border">
          {ENQUIRIES.map(e => (
            <div key={e.name} className="py-3 flex items-start gap-3">
              <div className="h-9 w-9 rounded-full bg-primary/15 text-primary flex items-center justify-center text-sm font-semibold">
                {e.name[0]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium">{e.name}</p>
                  <span className="text-xs text-muted-foreground">{e.date}</span>
                </div>
                <p className="text-sm text-muted-foreground truncate">{e.preview}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DashboardHome;
