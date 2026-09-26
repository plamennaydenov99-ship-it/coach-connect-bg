import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { z } from 'npm:zod@3';

const GATEWAY_URL = 'https://connector-gateway.lovable.dev/resend';
const SITE_URL = 'https://lokka1.lovable.app';
// Change to an address on a domain verified in Resend to deliver to applicants.
const FROM = 'Zenit <onboarding@resend.dev>';

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

const esc = (s: string) =>
  s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));

async function sendEmail(to: string, subject: string, html: string) {
  const res = await fetch(`${GATEWAY_URL}/emails`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${Deno.env.get('LOVABLE_API_KEY')}`,
      'X-Connection-Api-Key': Deno.env.get('RESEND_API_KEY')!,
    },
    body: JSON.stringify({ from: FROM, to: [to], subject, html }),
  });
  const text = await res.text();
  if (!res.ok) console.error(`Resend failed [${res.status}] to ${to}: ${text}`);
  return { ok: res.ok, status: res.status, details: text };
}

Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    for (const k of ['LOVABLE_API_KEY', 'RESEND_API_KEY', 'ADMIN_NOTIFICATION_EMAIL']) {
      if (!Deno.env.get(k)) return json({ error: `${k} is not configured` }, 500);
    }

    const parsed = z.object({ user_id: z.string().uuid() }).safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) return json({ error: parsed.error.flatten().fieldErrors }, 400);
    const { user_id } = parsed.data;

    // Verify caller is the applicant themselves
    const token = req.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) return json({ error: 'Unauthorized' }, 401);
    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const { data: authData, error: authErr } = await admin.auth.getUser(token);
    if (authErr || !authData.user || authData.user.id !== user_id) return json({ error: 'Forbidden' }, 403);

    const [{ data: profile }, { data: coach }] = await Promise.all([
      admin.from('profiles').select('full_name, city').eq('id', user_id).maybeSingle(),
      admin.from('coach_profiles').select('sport, bio, certifications, application_status').eq('id', user_id).maybeSingle(),
    ]);
    if (!coach || coach.application_status !== 'pending') return json({ error: 'No pending application' }, 400);

    const email = authData.user.email;
    const name = profile?.full_name || 'Unnamed coach';
    const sport = coach.sport || '—';
    const city = profile?.city || '—';
    const certs = (coach.certifications ?? []) as string[];
    const reviewUrl = `${SITE_URL}/admin/review`;

    const adminHtml = `
      <h2>New coach application</h2>
      <p><strong>Name:</strong> ${esc(name)}<br/>
      <strong>Email:</strong> ${esc(email ?? '—')}<br/>
      <strong>Sport:</strong> ${esc(sport)}<br/>
      <strong>City:</strong> ${esc(city)}</p>
      ${coach.bio ? `<p><strong>Bio:</strong><br/>${esc(coach.bio)}</p>` : ''}
      ${certs.length ? `<p><strong>Certifications:</strong> ${certs.map(esc).join(', ')}</p>` : ''}
      <p><a href="${reviewUrl}">Review applications →</a></p>`;

    const applicantHtml = `
      <h2>Thanks for applying, ${esc(profile?.full_name || 'coach')}!</h2>
      <p>Your application to coach on Zenit is now in review. We check every coach by hand, and you'll hear back from us soon.</p>
      <p>— The Zenit team</p>`;

    const [adminRes, applicantRes] = await Promise.all([
      sendEmail(Deno.env.get('ADMIN_NOTIFICATION_EMAIL')!, `New coach application: ${name}`, adminHtml),
      email ? sendEmail(email, 'Your Zenit coach application is in review', applicantHtml) : Promise.resolve(null),
    ]);

    return json({ admin: adminRes, applicant: applicantRes }, adminRes.ok ? 200 : 502);
  } catch (e) {
    console.error(e);
    return json({ error: e instanceof Error ? e.message : 'Unknown error' }, 500);
  }
});
