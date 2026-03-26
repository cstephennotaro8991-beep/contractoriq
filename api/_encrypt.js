// api/_encrypt.js
// Shared AES-256-CBC encryption/decryption utility for QB OAuth tokens.
// Used by qb-callback.js, qb-sync.js, and qb-disconnect.js.
//
// The encryption key is stored as QB_ENCRYPTION_KEY in Vercel environment variables.
// It must be exactly 32 characters (256 bits) for AES-256.

import crypto from 'crypto';

const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16; // AES block size

function getKey() {
  const key = process.env.QB_ENCRYPTION_KEY;
  if (!key || key.length < 32) {
    throw new Error('QB_ENCRYPTION_KEY must be set and at least 32 characters');
  }
  return Buffer.from(key.slice(0, 32), 'utf8');
}

export function encrypt(plaintext) {
  if (!plaintext) return null;
  const iv  = crypto.randomBytes(IV_LENGTH);
  const key = getKey();
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  return `${iv.toString('hex')}:${encrypted.toString('hex')}`;
}

export function decrypt(ciphertext) {
  if (!ciphertext) return null;
  if (!ciphertext.includes(':')) {
    console.warn('Decrypting legacy unencrypted value — consider re-encrypting');
    return ciphertext;
  }
  const [ivHex, encryptedHex] = ciphertext.split(':');
  const iv        = Buffer.from(ivHex, 'hex');
  const encrypted = Buffer.from(encryptedHex, 'hex');
  const key       = getKey();
  const decipher  = crypto.createDecipheriv(ALGORITHM, key, iv);
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return decrypted.toString('utf8');
}
