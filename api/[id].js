// GET /:id -> consent interstitial (if no consent) OR log anonymized event + redirect
import { kv } from '../lib/kv.js';
import { parseDevice, hashIp, privacySignals, getIp } from '../lib/util.js';
import { serialize } from 'cookie';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).send('Method not allowed');

  const { id } = req.query;
  const link = await kv.get(`links:${id}`);
  if (!link) return res.status(404).send('Not found');

  // honor GPC/DNT: skip logging entirely
  if (privacySignals(req)) {
    res.statusCode = 302;
    res.setHeader('Location', link.url);
    return res.end();
  }

  const cookies = Object.fromEntries(
    (req.headers.cookie || '')
      .split(';')
      .map(c => c.trim().split('='))
      .filter(([k]) => k)
  );
  const consent = cookies['analytics_consent'] === '1';

  if (consent) {
    // Log minimized event
    const ev = {
      ts: Date.now(),
      device: parseDevice(req.headers['user-agent'] || ''),
      referer: req.headers['referer'] || null,
      ipHash: hashIp(getIp(req))
    };
    await kv.rpush(`events:${id}`, JSON.stringify(ev));

    res.statusCode = 302;
    res.setHeader('Location', link.url);
    return res.end();
  }

  // No consent yet — show an interstitial
  const html = `
  <!doctype html>
  <html>
    <head>
      <meta charset="utf-8"/>
      <meta name="viewport" content="width=device-width,initial-scale=1"/>
      <title>Consent required</title>
      <style>
        body { font-family: Inter, system-ui, -apple-system, Arial; background:#f7f7f7; margin:0; display:flex; min-height:100vh; align-items:center; justify-content:center; }
        .card { background:#fff; width:min(520px, 90vw); padding:22px; border-radius:12px; box-shadow:0 8px 30px rgba(0,0,0,0.08); }
        h2 { margin:0 0 8px; font-size:22px; }
        p  { color:#444; line-height:1.5; }
        .row { margin-top:16px; display:flex; gap:10px; }
        button { padding:10px 16px; border-radius:8px; border:1px solid #ddd; background:#fff; cursor:pointer; }
        .primary { background:#0b74de; color:#fff; border-color:#0b74de; }
      </style>
    </head>
    <body>
      <div class="card">
        <h2>Allow anonymous analytics?</h2>
        <p>We collect device category, timestamp, and a hashed IP to count clicks. No names, emails, or precise location.</p>
        <div class="row">
          <button onclick="decline()">Decline & continue</button>
          <button class="primary" onclick="allow()">Allow & continue</button>
        </div>
        <p style="color:#666;font-size:12px;margin-top:10px;">You can revoke consent by clearing this site’s cookie.</p>
      </div>
      <script>
        async function allow() {
          await fetch('/consent/${id}', { method: 'POST', credentials: 'include' });
          location.href = ${JSON.stringify(link.url)};
        }
        function decline() {
          location.href = ${JSON.stringify(link.url)};
        }
      </script>
    </body>
  </html>
  `;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.end(html);
}
