const ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
const BASE = BigInt(ALPHABET.length);

export function encodeBase62(num) {
  let n = BigInt(num);
  if (n === 0n) return ALPHABET[0];
  if (n < 0n) throw new Error('Cannot Base62 encode negative numbers');

  let result = '';
  while (n > 0n) {
    const remainder = n % BASE;
    result = ALPHABET[Number(remainder)] + result;
    n = n / BASE;
  }
  return result;
}

export function decodeBase62(str) {
  if (!str || typeof str !== 'string') {
    throw new Error('Input must be a non-empty string');
  }

  let result = 0n;
  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    const index = ALPHABET.indexOf(char);
    if (index === -1) {
      throw new Error(`Invalid Base62 character: ${char}`);
    }
    result = result * BASE + BigInt(index);
  }
  return result;
}

export function isValidSlug(str) {

  return /^[a-zA-Z0-9_-]{2,50}$/.test(str);
}
