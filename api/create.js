// POST /create  { url, owner?, meta? } -> { short, id }
import { kv } from '../lib/kv.js';
import crypto from 'crypto';
import { absoluteBaseUrl } from '../lib/util.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { url, owner, meta } = req.body || {};
    if (!url) return res.status(400).json({ error: 'missing url' });
    // Basic URL validation
    new URL(url);

    const id = crypto.randomBytes(4).toString('hex'); // short id
    const link = { url, owner: owner || 'unknown', meta: meta || {}, createdAt: Date.now() };

    await kv.set(`links:${id}`, link);
    await kv.sadd('link_ids', id);

    const short = `${absoluteBaseUrl(req)}/${id}`;
    res.status(200).json({ short, id });
  } catch (e) {
    res.status(400).json({ error: 'invalid url' });
  }
}
