import { randomInt } from 'node:crypto';

/**
 * Creates a 15-digit numeric document candidate for tests.
 *
 * It combines the current time with cryptographically generated digits to
 * make collisions between local, CI, parallel, and repeated runs negligible.
 */
export function generateGovernmentId(): string {
  const leadingDigit = randomInt(1, 10).toString();
  const timestampDigits = Date.now().toString().slice(-9).padStart(9, '0');
  const randomDigits = randomInt(0, 100_000).toString().padStart(5, '0');

  return `${leadingDigit}${timestampDigits}${randomDigits}`;
}
