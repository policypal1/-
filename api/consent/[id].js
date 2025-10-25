// POST /consent/:id -> set consent cookie and record one anonymized event
import { kv } from '../../lib/kv.js';
import { parseDevice, hashIp, getIp } from '../../lib/util.js';
import { serialize } from 'cookie';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method not allowed');

  const { id } = req.query;
  const link = await kv.get(`links:${id}`);
  if (!link) return res.status(404).send('Not found');

  // set consent cookie for 1 year
  const cookie = serialize('analytics_consent', '1', {
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'Lax',
    httpOnly: false, // user can clear it; set true if you prefer only server access
    secure: true
  });
  res.setHeader('Set-Cookie', cookie);

  // Log one event immediately after consent
  const ev = {
    ts: Date.now(),
    device: parseDevice(req.headers['user-agent'] || ''),
    referer: req.headers['referer'] || null,
    ipHash: hashIp(getIp(req))
  };
  await kv.rpush(`events:${id}`, JSON.stringify(ev));

  res.status(204).end();
}
