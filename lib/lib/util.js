import crypto from 'crypto';
import useragent from 'useragent';

export function hashIp(ip) {
  if (!ip) return null;
  return crypto.createHash('sha256').update(ip).digest('hex').slice(0, 16);
}

export function parseDevice(uaRaw) {
  const ua = useragent.parse(uaRaw || '');
  return ua.device?.family || ua.os?.family || ua.family || 'unknown';
}

// Infer scheme/host for short link responses
export function absoluteBaseUrl(req) {
  const proto = req.headers['x-forwarded-proto'] || 'https';
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  return `${proto}://${host}`;
}

// Respect global privacy signals
export function privacySignals(req) {
  return (req.headers['sec-gpc'] === '1') || (req.headers['dnt'] === '1');
}

// Helper to read the raw IP as best-effort
export function getIp(req) {
  return (req.headers['x-forwarded-for'] || '').split(',')[0] || req.socket?.remoteAddress || '';
}
