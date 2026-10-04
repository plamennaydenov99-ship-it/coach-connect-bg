import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

const ACCOUNTS = {
  coach: { email: 'demo-coach@lokka.test', role: 'coach', full_name: 'Demo Coach', admin: false },
  club: { email: 'demo-club@lokka.test', role: 'club', full_name: 'Demo Club', admin: false },
  athlete: { email: 'demo-athlete@lokka.test', role: 'athlete', full_name: 'Demo Athlete', admin: false },
  admin: { email: 'demo-admin@lokka.test', role: 'athlete', full_name: 'Demo Admin', admin: true },
} as const;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

function randomPassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(bytes, (b) => chars[b % chars.length]).join('');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (Deno.env.get('DEMO_MODE') !== 'on') return json({ error: 'Demo mode is off' }, 403);
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  let role: unknown;
  try { role = (await req.json())?.role; } catch { return json({ error: 'Invalid body' }, 400); }
  if (typeof role !== 'string' || !(role in ACCOUNTS)) return json({ error: 'Invalid role' }, 400);
  const acc = ACCOUNTS[role as keyof typeof ACCOUNTS];

  const url = Deno.env.get('SUPABASE_URL')!;
  const admin = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });

  try {
    // Find existing user
    let userId: string | null = null;
    for (let page = 1; page <= 20 && !userId; page++) {
      const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
      if (error) throw error;
      userId = data.users.find((u) => u.email?.toLowerCase() === acc.email)?.id ?? null;
      if (data.users.length < 200) break;
    }

    const password = randomPassword();
    if (!userId) {
      const { data, error } = await admin.auth.admin.createUser({
        email: acc.email, password, email_confirm: true,
        user_metadata: { role: acc.role, full_name: acc.full_name },
      });
      if (error) throw error;
      userId = data.user.id;
    } else {
      const { error } = await admin.auth.admin.updateUserById(userId, { password });
      if (error) throw error;
    }

    // Profile row (normally created by trigger) with the right role / admin flag
    const { error: pErr } = await admin.from('profiles').upsert(
      { id: userId, role: acc.role, full_name: acc.full_name, is_admin: acc.admin },
      { onConflict: 'id' },
    );
    if (pErr) throw pErr;

    // Role extension row so existing guards let the account in
    if (acc.role === 'athlete') {
      await admin.from('athlete_profiles').upsert({ id: userId }, { onConflict: 'id', ignoreDuplicates: true });
    } else {
      const table = acc.role === 'coach' ? 'coach_profiles' : 'club_profiles';
      const { data: ext } = await admin.from(table).select('id').eq('id', userId).maybeSingle();
      if (!ext) await admin.from(table).insert({ id: userId, application_status: 'approved' });
    }

    const anon = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, { auth: { persistSession: false } });
    const { data: s, error: sErr } = await anon.auth.signInWithPassword({ email: acc.email, password });
    if (sErr || !s.session) throw sErr ?? new Error('No session');

    return json({ access_token: s.session.access_token, refresh_token: s.session.refresh_token, user_id: userId });
  } catch (e) {
    console.error('demo-login failed', e instanceof Error ? e.message : 'unknown');
    return json({ error: 'Demo login failed' }, 500);
  }
});
