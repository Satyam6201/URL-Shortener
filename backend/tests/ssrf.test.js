import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isPrivateIPv4,
  isPrivateIPv6,
  validateUrlSecurity,
  RESERVED_SLUGS,
} from '../src/utils/ssrfValidator.js';

test('SSRF IPv4 and IPv6 classification', async (t) => {
  await t.test('detects loopback addresses', () => {
    assert.equal(isPrivateIPv4('127.0.0.1'), true);
    assert.equal(isPrivateIPv4('127.0.0.254'), true);
    assert.equal(isPrivateIPv6('::1'), true);
  });

  await t.test('detects RFC 1918 private subnets', () => {
    assert.equal(isPrivateIPv4('10.0.0.1'), true);
    assert.equal(isPrivateIPv4('172.16.0.1'), true);
    assert.equal(isPrivateIPv4('172.31.255.255'), true);
    assert.equal(isPrivateIPv4('192.168.1.1'), true);
  });

  await t.test('detects AWS / cloud metadata endpoints', () => {
    assert.equal(isPrivateIPv4('169.254.169.254'), true);
    assert.equal(isPrivateIPv4('169.254.1.1'), true);
  });

  await t.test('allows public Internet IP addresses', () => {
    assert.equal(isPrivateIPv4('8.8.8.8'), false);
    assert.equal(isPrivateIPv4('1.1.1.1'), false);
    assert.equal(isPrivateIPv4('142.250.190.46'), false);
  });
});

test('URL Security and SSRF validation', async (t) => {
  await t.test('rejects non-HTTP protocols', async () => {
    const resFtp = await validateUrlSecurity('ftp://example.com/file.zip');
    assert.equal(resFtp.isValid, false);

    const resFile = await validateUrlSecurity('file:///etc/passwd');
    assert.equal(resFile.isValid, false);

    const resJs = await validateUrlSecurity('javascript:alert(1)');
    assert.equal(resJs.isValid, false);
  });

  await t.test('rejects internal and localhost hostnames', async () => {
    const resLocalhost = await validateUrlSecurity('http://localhost:5000/api');
    assert.equal(resLocalhost.isValid, false);

    const resLocal = await validateUrlSecurity('http://service.internal/status');
    assert.equal(resLocal.isValid, false);

    const resPrivateIp = await validateUrlSecurity('http://192.168.1.50/admin');
    assert.equal(resPrivateIp.isValid, false);

    const resAwsMeta = await validateUrlSecurity('http://169.254.169.254/latest/meta-data/');
    assert.equal(resAwsMeta.isValid, false);
  });

  await t.test('accepts valid public HTTP/HTTPS URLs', async () => {
    const resValid = await validateUrlSecurity('https://example.com/products/shoes?color=red');
    assert.equal(resValid.isValid, true);
  });

  await t.test('prevents reserved slug hijacking', () => {
    assert.equal(RESERVED_SLUGS.has('api'), true);
    assert.equal(RESERVED_SLUGS.has('health'), true);
    assert.equal(RESERVED_SLUGS.has('login'), true);
    assert.equal(RESERVED_SLUGS.has('dashboard'), true);
  });
});
