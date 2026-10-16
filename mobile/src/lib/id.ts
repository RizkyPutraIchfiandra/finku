import * as Crypto from 'expo-crypto';

/**
 * Generate a cryptographically-random UUID. Hermes has no global `crypto`,
 * so this uses expo-crypto (real OS entropy on device, Web Crypto on web).
 */
export function newId(): string {
  return Crypto.randomUUID();
}
