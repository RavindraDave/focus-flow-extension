/**
 * Cryptographic Utilities
 * Focus Flow Extension
 *
 * Implements HMAC-SHA256 signing and verification for nuclear mode integrity.
 * OWASP ASVS V6.2.1, V6.2.2
 */

/**
 * Convert hex string to Uint8Array
 * @param hex - Hexadecimal string (e.g., "a1b2c3d4")
 * @returns Byte array
 */
export function hexToBytes(hex: string): Uint8Array {
  if (hex.length % 2 !== 0) {
    throw new Error('Hex string must have even length');
  }

  if (!/^[0-9a-f]*$/i.test(hex)) {
    throw new Error('Invalid hex string');
  }

  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }

  return bytes;
}

/**
 * Convert Uint8Array to hex string
 * @param bytes - Byte array
 * @returns Hexadecimal string
 */
export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Generate HMAC-SHA256 signature
 *
 * @param data - Data to sign (typically a timestamp or message)
 * @param secret - Secret key (hex string, 64 chars = 32 bytes)
 * @returns HMAC-SHA256 signature (hex string, 64 chars)
 *
 * @throws Error if secret is invalid format
 *
 * @example
 * ```typescript
 * const secret = '0123456789abcdef...'; // 64 hex chars
 * const timestamp = new Date().toISOString();
 * const signature = await generateHMAC(timestamp, secret);
 * ```
 *
 * OWASP ASVS V6.2.1 - Cryptographic modules fail securely
 */
export async function generateHMAC(data: string, secret: string): Promise<string> {
  // Validate secret format (must be 64 hex characters = 32 bytes)
  if (secret.length !== 64) {
    throw new Error('Secret must be 64 hex characters (32 bytes)');
  }

  if (!/^[0-9a-f]{64}$/i.test(secret)) {
    throw new Error('Secret must be a valid hex string');
  }

  try {
    const encoder = new TextEncoder();
    const secretBytes = hexToBytes(secret);
    const dataBytes = encoder.encode(data);

    // Import secret as CryptoKey
    const key = await crypto.subtle.importKey(
      'raw',
      secretBytes,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    // Sign data
    const signature = await crypto.subtle.sign('HMAC', key, dataBytes);

    // Return as hex string
    return bytesToHex(new Uint8Array(signature));
  } catch (error) {
    // Fail securely - don't expose internal error details
    throw new Error('Failed to generate HMAC signature');
  }
}

/**
 * Verify HMAC-SHA256 signature
 *
 * @param data - Original data that was signed
 * @param signature - Signature to verify (hex string, 64 chars)
 * @param secret - Secret key (hex string, 64 chars = 32 bytes)
 * @returns true if signature is valid, false otherwise
 *
 * Uses constant-time comparison to prevent timing attacks.
 *
 * @example
 * ```typescript
 * const isValid = await verifyHMAC(timestamp, signature, secret);
 * if (!isValid) {
 *   console.error('Signature verification failed - possible tampering');
 * }
 * ```
 *
 * OWASP ASVS V6.2.1 - Cryptographic verification
 */
export async function verifyHMAC(
  data: string,
  signature: string,
  secret: string
): Promise<boolean> {
  try {
    // Validate signature format
    if (signature.length !== 64) {
      return false;
    }

    if (!/^[0-9a-f]{64}$/i.test(signature)) {
      return false;
    }

    // Generate expected signature
    const expected = await generateHMAC(data, secret);

    // Constant-time comparison (prevent timing attacks)
    return constantTimeCompare(expected, signature);
  } catch (error) {
    // If signature generation fails, signature is invalid
    return false;
  }
}

/**
 * Constant-time string comparison
 *
 * Prevents timing attacks by ensuring comparison takes the same time
 * regardless of where strings differ.
 *
 * @param a - First string
 * @param b - Second string
 * @returns true if strings are equal, false otherwise
 *
 * Security: V6.2.1 - Prevent timing side-channel attacks
 */
function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return result === 0;
}

/**
 * Generate cryptographically secure random bytes
 *
 * @param length - Number of bytes to generate
 * @returns Hex string of random bytes
 *
 * @example
 * ```typescript
 * // Generate 32-byte device secret
 * const secret = generateSecureRandom(32);
 * console.log(secret); // 64 hex characters
 * ```
 *
 * OWASP ASVS V6.2.2 - Random values with proper entropy
 */
export function generateSecureRandom(length: number): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return bytesToHex(bytes);
}
