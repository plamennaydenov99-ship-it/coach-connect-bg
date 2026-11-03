# Hosting: HTTPS and security headers

The site is a static single-page app (`npx vite build` → `dist/`). Hosting is not chosen yet.
Whichever host you pick, it must do three things:

1. **Force HTTPS.** Every host below redirects HTTP to HTTPS when you switch on its HTTPS / "always use HTTPS" setting. Turn it on once the custom domain is connected.
2. **Send the security headers** listed in `public/_headers`: HSTS (no preload), Content-Security-Policy, X-Content-Type-Options, Referrer-Policy, Permissions-Policy and `frame-ancestors 'none'` / X-Frame-Options.
3. **Serve `index.html` for unknown paths**, so deep links and the 404 page work (`public/_redirects`).

| Host | What to do |
|---|---|
| Netlify | Nothing extra: `public/_headers` and `public/_redirects` are copied into `dist/` and read automatically. Enable "Force HTTPS". |
| Cloudflare Pages | Same as Netlify: `_headers` and `_redirects` are read automatically. Enable "Always Use HTTPS" in the domain's SSL settings. |
| Vercel | Copy the headers into a `vercel.json` `headers` block and add a rewrite of `/(.*)` to `/index.html`. HTTPS is forced by default. |
| Lovable hosting | The repo cannot set headers. Ask Lovable support whether custom headers are possible, or put the site behind Cloudflare (proxy) and add the headers there with a Transform Rule. |
| nginx / own server | `add_header` each line from `_headers` in the `server` block, `return 301 https://$host$request_uri;` on port 80, and `try_files $uri /index.html;`. |

## Checks after go-live

- `curl -sI https://<domain>/` shows the headers.
- `curl -sI http://<domain>/` returns 301 to https.
- securityheaders.com and the browser console show no CSP errors when you sign in, browse and open a club page.

## When you change something

- **Adding analytics:** add the tool's script host to `script-src` and its collection host to `connect-src`.
- **HSTS preload:** only after the domain and every subdomain are HTTPS-only for good. It is hard to undo, so it is a separate owner decision.
- **Supabase project change:** update the two Supabase hosts in `connect-src`.
