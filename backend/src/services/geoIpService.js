import geoip from 'geoip-lite';
import crypto from 'node:crypto';

export function hashIp(ip) {
  if (!ip) return 'anonymous';
  return crypto.createHash('sha256').update(ip + '-salt-url-shortener').digest('hex').slice(0, 16);
}

export function lookupGeo(ip, headers = {}) {

  if (headers['cf-ipcountry'] && headers['cf-ipcountry'] !== 'XX') {
    return {
      country: headers['cf-ipcountry'],
      city: headers['cf-ipcity'] || 'Unknown',
    };
  }

  if (headers['x-country-code']) {
    return {
      country: headers['x-country-code'],
      city: 'Unknown',
    };
  }

  if (!ip || ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
    return {
      country: 'US',
      city: 'Local Network',
    };
  }

  const geo = geoip.lookup(ip);
  if (geo) {
    return {
      country: geo.country || 'Unknown',
      city: geo.city || 'Unknown',
    };
  }

  return {
    country: 'Unknown',
    city: 'Unknown',
  };
}
