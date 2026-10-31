// Removed on 2026-10-31: this function used to sign anyone in as any role (including admin)
// without a password. It is now permanently disabled. Use normal sign-in.
Deno.serve(() => new Response(JSON.stringify({ error: 'Demo login has been removed' }), {
  status: 410,
  headers: { 'Content-Type': 'application/json' },
}));
