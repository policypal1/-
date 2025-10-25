// GET /stats/:id -> { clicks, byDevice, createdAt, url }
import { kv } from '../../lib/kv.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { id } = req.query;
  const link = await kv.get(`links:${id}`);
  if (!link) return res.status(404).json({ error: 'not found' });

  const eventsRaw = await kv.lrange(`events:${id}`, 0, -1);
  const events = eventsRaw.map(JSON.parse);
  const byDevice = events.reduce((acc, e) => {
    acc[e.device] = (acc[e.device] || 0) + 1;
    return acc;
  }, {});
  res.status(200).json({ clicks: events.length, byDevice, createdAt: link.createdAt, url: link.url });
}
