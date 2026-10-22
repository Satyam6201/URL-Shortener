import dns from 'node:dns/promises';
import { URL } from 'node:url';

export const RESERVED_SLUGS = new Set([
  'api',
  'admin',
  'auth',
  'dashboard',
  'health',
  'metrics',
  'login',
  'register',
  'logout',
  'analytics',
  'docs',
  'settings',
  'profile',
  'urls',
  'about',
  'terms',
  'privacy',
  '404',
  '500',
  'expired',
  'favicon.ico',
  'robots.txt',
  'sitemap.xml',
]);

export function isPrivateIPv4(ip) {
  const parts = ip.split('.').map(Number);
  if (parts.length !== 4 || parts.some(isNaN)) return true;

  const [a, b, c, d] = parts;

  if (a === 0) return true;

  if (a === 10) return true;

  if (a === 127) return true;

  if (a === 169 && b === 254) return true;

  if (a === 172 && b >= 16 && b <= 31) return true;

  if (a === 192 && b === 168) return true;

  if (a === 100 && b >= 64 && b <= 127) return true;

  if (a === 198 && (b === 18 || b === 19)) return true;

  if (a >= 224) return true;

  return false;
}

export function isPrivateIPv6(ip) {
  const normalized = ip.toLowerCase();
  if (normalized === '::1' || normalized === '::') return true;
  if (normalized.startsWith('fc') || normalized.startsWith('fd')) return true;
  if (normalized.startsWith('fe80:')) return true;
  if (normalized.startsWith('::ffff:')) {
    const ipv4Part = normalized.substring(7);
    return isPrivateIPv4(ipv4Part);
  }
  return false;
}

export async function validateUrlSecurity(urlString) {
  if (!urlString || typeof urlString !== 'string') {
    return { isValid: false, reason: 'URL must be a non-empty string' };
  }

  if (urlString.length > 2048) {
    return { isValid: false, reason: 'URL exceeds maximum length of 2048 characters' };
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(urlString);
  } catch (err) {
    return { isValid: false, reason: 'Malformed URL format' };
  }

  if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
    return { isValid: false, reason: 'Only HTTP and HTTPS protocols are allowed' };
  }

  const hostname = parsedUrl.hostname.toLowerCase();

  if (
    hostname === 'localhost' ||
    hostname.endsWith('.localhost') ||
    hostname.endsWith('.local') ||
    hostname.endsWith('.internal') ||
    hostname.endsWith('.onion') ||
    hostname === 'metadata.google.internal'
  ) {
    return { isValid: false, reason: 'Internal or reserved hostnames are forbidden' };
  }

  if (/^(\d{1,3}\.){3}\d{1,3}$/.test(hostname)) {
    if (isPrivateIPv4(hostname)) {
      return { isValid: false, reason: 'Private or local IP addresses are forbidden (SSRF protection)' };
    }
  }

  try {
    const records = await dns.lookup(hostname, { all: true });
    for (const record of records) {
      if (record.family === 4 && isPrivateIPv4(record.address)) {
        return { isValid: false, reason: `Resolved IP (${record.address}) is private/internal` };
      }
      if (record.family === 6 && isPrivateIPv6(record.address)) {
        return { isValid: false, reason: `Resolved IPv6 (${record.address}) is private/internal` };
      }
    }
  } catch (dnsErr) {

    if (process.env.NODE_ENV !== 'test') {
      return { isValid: false, reason: `Unable to resolve hostname: ${hostname}` };
    }
  }

  return { isValid: true, parsedUrl };
}
