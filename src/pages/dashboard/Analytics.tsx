import { useEffect, useState } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Eye, MessageSquare, TrendingUp } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

const Analytics = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [totalViews, setTotalViews] = useState(0);
  const [totalBookings, setTotalBookings] = useState(0);
  const [totalMessages, setTotalMessages] = useState(0);
  const [viewsData, setViewsData] = useState<{ day: string; views: number }[]>([]);
  const [statusData, setStatusData] = useState<{ status: string; count: number }[]>([]);

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      const since = new Date();
      since.setDate(since.getDate() - 29);
      since.setHours(0, 0, 0, 0);

      const [views, bookings, convos] = await Promise.all([
        supabase.from('profile_views').select('created_at').eq('coach_id', user.id),
        supabase.from('bookings').select('status').eq('coach_id', user.id),
        supabase.from('conversations').select('id').eq('coach_id', user.id),
      ]);

      const viewRows = views.data ?? [];
      setTotalViews(viewRows.length);

      // Views per day for the last 30 days
      const buckets = new Map<string, number>();
      for (let i = 0; i < 30; i++) {
        const d = new Date(since);
        d.setDate(since.getDate() + i);
        buckets.set(d.toISOString().slice(0, 10), 0);
      }
      viewRows.forEach(v => {
        const key = new Date(v.created_at).toISOString().slice(0, 10);
        if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + 1);
      });
      setViewsData(Array.from(buckets.entries()).map(([key, views]) => ({
        day: new Date(key).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        views,
      })));

      const bookingRows = bookings.data ?? [];
      setTotalBookings(bookingRows.length);
      const statusMap = new Map<string, number>();
      bookingRows.forEach(b => statusMap.set(b.status, (statusMap.get(b.status) ?? 0) + 1));
      const labels: Record<string, string> = {
        pending: t.analytics_status_pending,
        confirmed: t.analytics_status_confirmed,
        declined: t.analytics_status_declined,
        cancelled: t.analytics_status_cancelled,
      };
      setStatusData(['pending', 'confirmed', 'declined', 'cancelled'].map(s => ({
        status: labels[s] ?? s,
        count: statusMap.get(s) ?? 0,
      })));

      const convoIds = (convos.data ?? []).map(c => c.id);
      if (convoIds.length) {
        const { count } = await supabase
          .from('messages')
          .select('id', { count: 'exact', head: true })
          .in('conversation_id', convoIds)
          .neq('sender_id', user.id);
        setTotalMessages(count ?? 0);
      } else {
        setTotalMessages(0);
      }

      setLoading(false);
    };
    load();
  }, [user, t]);

  const conversion = totalViews > 0 ? `${((totalBookings / totalViews) * 100).toFixed(1)}%` : '—';

  const stats = [
    { label: t.analytics_total_views, value: String(totalViews), icon: Eye },
    { label: t.analytics_total_bookings, value: String(totalBookings), icon: TrendingUp },
    { label: t.analytics_conversion, value: conversion, icon: TrendingUp },
    { label: t.analytics_messages_received, value: String(totalMessages), icon: MessageSquare },
  ];

  return (
    <div className="max-w-6xl space-y-6">
      <div>
        <h1 className="font-display text-3xl">{t.analytics_title}</h1>
        <p className="text-muted-foreground mt-1">{t.analytics_sub}</p>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">{t.clients_loading}</p>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map(s => (
              <div key={s.label} className="surface p-5">
                <s.icon className="h-5 w-5 text-gold mb-3" />
                <p className="font-display text-2xl">{s.value}</p>
                <p className="text-xs text-muted-foreground mt-1 uppercase tracking-wide">{s.label}</p>
              </div>
            ))}
          </div>

          <div className="surface p-6">
            <h2 className="font-display text-xl mb-4">{t.analytics_views_chart}</h2>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={viewsData}>
                  <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={11} interval={4} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} allowDecimals={false} />
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
            <h2 className="font-display text-xl mb-4">{t.analytics_bookings_chart}</h2>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statusData}>
                  <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="status" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} allowDecimals={false} />
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
        </>
      )}
    </div>
  );
};

export default Analytics;
