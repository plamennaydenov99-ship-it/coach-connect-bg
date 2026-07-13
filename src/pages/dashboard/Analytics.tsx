import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Eye, MessageSquare, Clock, TrendingUp } from 'lucide-react';

const viewsData = Array.from({ length: 30 }, (_, i) => ({
  day: `${i + 1}`,
  views: Math.round(20 + Math.sin(i / 3) * 15 + Math.random() * 25 + i * 1.2),
}));

const enquiriesData = [
  { week: 'W1', count: 4 }, { week: 'W2', count: 7 }, { week: 'W3', count: 5 },
  { week: 'W4', count: 9 }, { week: 'W5', count: 12 }, { week: 'W6', count: 8 },
  { week: 'W7', count: 14 }, { week: 'W8', count: 11 },
];

const Analytics = () => {
  return (
    <div className="max-w-6xl space-y-6">
      <div>
        <h1 className="font-display text-3xl">Analytics</h1>
        <p className="text-muted-foreground mt-1">Track how your profile is performing.</p>
      </div>

      <div className="surface p-5 flex items-center gap-3">
        <TrendingUp className="h-5 w-5 text-gold" />
<p className="text-sm">
          Your profile appeared in <span className="font-semibold text-gold">348 searches</span> this week — up 22% from last week.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: 'Total profile views', value: '1,284', icon: Eye },
          { label: 'Conversion rate', value: '6.4%', icon: TrendingUp },
          { label: 'Avg response time', value: '2h 14m', icon: Clock },
        ].map(s => (
          <div key={s.label} className="surface p-5">
            <s.icon className="h-5 w-5 text-gold mb-3" />
            <p className="font-display text-2xl">{s.value}</p>
            <p className="text-xs text-muted-foreground mt-1 uppercase tracking-wide">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="surface p-6">
        <h2 className="font-display text-xl mb-4">Profile views — last 30 days</h2>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={viewsData}>
              <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <Tooltip
                contentStyle={{
                  background: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 8,
                  fontSize: 12,
                }}
                labelStyle={{ color: 'hsl(var(--foreground))' }}
              />
              <Line type="monotone" dataKey="views" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="surface p-6">
        <h2 className="font-display text-xl mb-4">Enquiries per week</h2>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={enquiriesData}>
              <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="week" stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <Tooltip
                contentStyle={{
                  background: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Bar dataKey="count" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
