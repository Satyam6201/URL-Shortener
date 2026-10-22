import test from 'node:test';
import assert from 'node:assert/strict';
import { encodeBase62, decodeBase62, isValidSlug } from '../src/utils/base62.js';

test('Base62 encoding and decoding', async (t) => {
  await t.test('encodes 0 correctly', () => {
    assert.equal(encodeBase62(0), '0');
  });

  await t.test('encodes and decodes positive integers reversibly', () => {
    const testCases = [1, 61, 62, 100, 1000000, 10000000, 56800235584];
    for (const num of testCases) {
      const encoded = encodeBase62(num);
      assert.ok(typeof encoded === 'string');
      assert.ok(encoded.length > 0);
      const decoded = Number(decodeBase62(encoded));
      assert.equal(decoded, num);
    }
  });

  await t.test('produces compact codes for 10 million base', () => {
    const encoded = encodeBase62(10000000);
    assert.ok(encoded.length <= 6);
  });

  await t.test('throws on negative input', () => {
    assert.throws(() => encodeBase62(-5), /Cannot Base62 encode negative numbers/);
  });

  await t.test('throws on invalid Base62 characters', () => {
    assert.throws(() => decodeBase62('invalid@code!'), /Invalid Base62 character/);
  });
});

test('Custom slug validation', async (t) => {
  await t.test('accepts valid alphanumeric slugs with hyphens and underscores', () => {
    assert.equal(isValidSlug('my-sale'), true);
    assert.equal(isValidSlug('promo_2026'), true);
    assert.equal(isValidSlug('black-friday-deals'), true);
  });

  await t.test('rejects single character or too long slugs', () => {
    assert.equal(isValidSlug('a'), false);
    assert.equal(isValidSlug('a'.repeat(51)), false);
  });

  await t.test('rejects invalid special characters and spaces', () => {
    assert.equal(isValidSlug('my sale'), false);
    assert.equal(isValidSlug('sale/promo'), false);
    assert.equal(isValidSlug('promo?discount=1'), false);
  });
});
