import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { RESERVED_SLUGS, escapeRegex, validateUrlSecurity } from '../src/utils/ssrfValidator.js';

test('Security Hardening: Reserved Slugs', async (t) => {
  await t.test('prevents creating links with frontend status routes to avoid infinite loop', () => {
    assert.ok(RESERVED_SLUGS.has('not-found'));
    assert.ok(RESERVED_SLUGS.has('expired'));
    assert.ok(RESERVED_SLUGS.has('disabled'));
    assert.ok(RESERVED_SLUGS.has('scheduled'));
    assert.ok(RESERVED_SLUGS.has('limit-reached'));
    assert.ok(RESERVED_SLUGS.has('protected'));
    assert.ok(RESERVED_SLUGS.has('preview'));
  });
});

test('Security Hardening: Regex Escaping ReDoS Defense', async (t) => {
  await t.test('escapes special regex characters in search strings', () => {
    const maliciousQuery = '.*+?^${}()|[]\\';
    const escaped = escapeRegex(maliciousQuery);
    assert.equal(escaped, '\\.\\*\\+\\?\\^\\$\\{\\}\\(\\)\\|\\[\\]\\\\');
    const regex = new RegExp(escaped, 'i');
    assert.ok(regex.test(maliciousQuery));
    assert.ok(!regex.test('regular string'));
  });
});

test('Security Hardening: Webhook SSRF validation', async (t) => {
  await t.test('rejects localhost and private IPs for webhooks', async () => {
    const localhostCheck = await validateUrlSecurity('http://localhost:5000/api/admin/users');
    assert.equal(localhostCheck.isValid, false);

    const privateIpCheck = await validateUrlSecurity('http://192.168.1.1/webhook');
    assert.equal(privateIpCheck.isValid, false);

    const awsMetaCheck = await validateUrlSecurity('http://169.254.169.254/latest/meta-data');
    assert.equal(awsMetaCheck.isValid, false);
  });
});

test('Security Hardening: API Key Cryptographic Hashing', async (t) => {
  await t.test('produces deterministic SHA-256 keyHash', () => {
    const rawKey = 'snip_live_0123456789abcdef0123456789abcdef';
    const hash1 = crypto.createHash('sha256').update(rawKey).digest('hex');
    const hash2 = crypto.createHash('sha256').update(rawKey).digest('hex');
    assert.equal(hash1, hash2);
    assert.equal(hash1.length, 64);
    assert.notEqual(hash1, rawKey);
  });
});
