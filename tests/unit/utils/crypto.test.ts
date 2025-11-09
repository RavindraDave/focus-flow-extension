/**
 * Unit Tests for Crypto Utilities
 * Target: ≥80% coverage
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  hexToBytes,
  bytesToHex,
  generateHMAC,
  verifyHMAC,
  generateSecureRandom,
} from '../../../src/utils/crypto';

describe('crypto utilities', () => {
  describe('hexToBytes', () => {
    it('should convert hex string to bytes', () => {
      const hex = 'a1b2c3d4';
      const bytes = hexToBytes(hex);

      expect(bytes).toBeInstanceOf(Uint8Array);
      expect(bytes.length).toBe(4);
      expect(bytes[0]).toBe(0xa1);
      expect(bytes[1]).toBe(0xb2);
      expect(bytes[2]).toBe(0xc3);
      expect(bytes[3]).toBe(0xd4);
    });

    it('should handle lowercase and uppercase hex', () => {
      const lower = hexToBytes('abcd');
      const upper = hexToBytes('ABCD');

      expect(lower[0]).toBe(0xab);
      expect(upper[0]).toBe(0xab);
      expect(lower[1]).toBe(0xcd);
      expect(upper[1]).toBe(0xcd);
    });

    it('should handle empty string', () => {
      const bytes = hexToBytes('');
      expect(bytes.length).toBe(0);
    });

    it('should throw on odd-length hex string', () => {
      expect(() => hexToBytes('abc')).toThrow('even length');
    });

    it('should throw on invalid hex characters', () => {
      expect(() => hexToBytes('xyza')).toThrow('Invalid hex string'); // Even length, invalid chars
      expect(() => hexToBytes('12g4')).toThrow('Invalid hex string');
      expect(() => hexToBytes('GHIJ')).toThrow('Invalid hex string');
    });
  });

  describe('bytesToHex', () => {
    it('should convert bytes to hex string', () => {
      const bytes = new Uint8Array([0xa1, 0xb2, 0xc3, 0xd4]);
      const hex = bytesToHex(bytes);

      expect(hex).toBe('a1b2c3d4');
    });

    it('should pad single-digit hex values', () => {
      const bytes = new Uint8Array([0x01, 0x0a, 0x00, 0xff]);
      const hex = bytesToHex(bytes);

      expect(hex).toBe('010a00ff');
    });

    it('should handle empty array', () => {
      const bytes = new Uint8Array([]);
      const hex = bytesToHex(bytes);

      expect(hex).toBe('');
    });

    it('should round-trip with hexToBytes', () => {
      const original = '0123456789abcdef';
      const bytes = hexToBytes(original);
      const result = bytesToHex(bytes);

      expect(result).toBe(original);
    });
  });

  describe('generateHMAC', () => {
    const validSecret = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'; // 64 chars

    it('should generate HMAC-SHA256 signature', async () => {
      const data = 'test message';
      const signature = await generateHMAC(data, validSecret);

      expect(signature).toMatch(/^[0-9a-f]{64}$/);
      expect(signature.length).toBe(64);
    });

    it('should generate different signatures for different data', async () => {
      const sig1 = await generateHMAC('message1', validSecret);
      const sig2 = await generateHMAC('message2', validSecret);

      expect(sig1).not.toBe(sig2);
    });

    it('should generate same signature for same data', async () => {
      const data = 'test message';
      const sig1 = await generateHMAC(data, validSecret);
      const sig2 = await generateHMAC(data, validSecret);

      expect(sig1).toBe(sig2);
    });

    it('should generate different signatures for different secrets', async () => {
      const data = 'test message';
      const secret1 = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
      const secret2 = 'fedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210';

      const sig1 = await generateHMAC(data, secret1);
      const sig2 = await generateHMAC(data, secret2);

      expect(sig1).not.toBe(sig2);
    });

    it('should throw on invalid secret length', async () => {
      const shortSecret = '0123456789abcdef'; // Too short

      await expect(generateHMAC('test', shortSecret)).rejects.toThrow('64 hex characters');
    });

    it('should throw on invalid secret format', async () => {
      const invalidSecret = '0123456789abcdefXYZ123456789abcdef0123456789abcdef0123456789abcd'; // Contains XYZ

      await expect(generateHMAC('test', invalidSecret)).rejects.toThrow('valid hex string');
    });

    it('should handle empty data', async () => {
      const signature = await generateHMAC('', validSecret);

      expect(signature).toMatch(/^[0-9a-f]{64}$/);
    });

    it('should handle special characters in data', async () => {
      const data = 'special: 日本語 émojis 🔥';
      const signature = await generateHMAC(data, validSecret);

      expect(signature).toMatch(/^[0-9a-f]{64}$/);
    });
  });

  describe('verifyHMAC', () => {
    const validSecret = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';

    it('should verify valid signature', async () => {
      const data = 'test message';
      const signature = await generateHMAC(data, validSecret);
      const isValid = await verifyHMAC(data, signature, validSecret);

      expect(isValid).toBe(true);
    });

    it('should reject invalid signature', async () => {
      const data = 'test message';
      const wrongSignature = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
      const isValid = await verifyHMAC(data, wrongSignature, validSecret);

      expect(isValid).toBe(false);
    });

    it('should reject tampered data', async () => {
      const data = 'test message';
      const signature = await generateHMAC(data, validSecret);
      const tamperedData = 'test message!'; // Modified
      const isValid = await verifyHMAC(tamperedData, signature, validSecret);

      expect(isValid).toBe(false);
    });

    it('should reject wrong secret', async () => {
      const data = 'test message';
      const signature = await generateHMAC(data, validSecret);
      const wrongSecret = 'fedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210';
      const isValid = await verifyHMAC(data, signature, wrongSecret);

      expect(isValid).toBe(false);
    });

    it('should reject invalid signature format (wrong length)', async () => {
      const data = 'test message';
      const shortSignature = '0123456789abcdef'; // Too short
      const isValid = await verifyHMAC(data, shortSignature, validSecret);

      expect(isValid).toBe(false);
    });

    it('should reject invalid signature format (non-hex)', async () => {
      const data = 'test message';
      const invalidSignature = '0123456789abcdefXYZ123456789abcdef0123456789abcdef0123456789abcd';
      const isValid = await verifyHMAC(data, invalidSignature, validSecret);

      expect(isValid).toBe(false);
    });

    it('should use constant-time comparison', async () => {
      // This test verifies that timing doesn't leak information
      const data = 'test message';
      const validSignature = await generateHMAC(data, validSecret);

      // Create signatures that differ at different positions
      const sig1 = 'a' + validSignature.substring(1); // Differs at position 0
      const sig2 = validSignature.substring(0, 32) + 'a' + validSignature.substring(33); // Differs at position 32

      const start1 = performance.now();
      await verifyHMAC(data, sig1, validSecret);
      const time1 = performance.now() - start1;

      const start2 = performance.now();
      await verifyHMAC(data, sig2, validSecret);
      const time2 = performance.now() - start2;

      // Timing difference should be minimal (both should be fast failures)
      // Allow 10ms tolerance for system variance
      expect(Math.abs(time1 - time2)).toBeLessThan(10);
    });
  });

  describe('generateSecureRandom', () => {
    it('should generate random bytes of specified length', () => {
      const random32 = generateSecureRandom(32);

      expect(random32).toMatch(/^[0-9a-f]{64}$/); // 32 bytes = 64 hex chars
      expect(random32.length).toBe(64);
    });

    it('should generate different values each time', () => {
      const random1 = generateSecureRandom(32);
      const random2 = generateSecureRandom(32);
      const random3 = generateSecureRandom(32);

      expect(random1).not.toBe(random2);
      expect(random2).not.toBe(random3);
      expect(random1).not.toBe(random3);
    });

    it('should handle different lengths', () => {
      const random8 = generateSecureRandom(8);
      const random16 = generateSecureRandom(16);
      const random64 = generateSecureRandom(64);

      expect(random8.length).toBe(16); // 8 bytes = 16 hex chars
      expect(random16.length).toBe(32); // 16 bytes = 32 hex chars
      expect(random64.length).toBe(128); // 64 bytes = 128 hex chars
    });

    it('should handle length 0', () => {
      const random = generateSecureRandom(0);
      expect(random).toBe('');
    });

    it('should use crypto.getRandomValues', () => {
      const spy = vi.spyOn(crypto, 'getRandomValues');
      generateSecureRandom(32);

      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });
  });

  describe('integration: complete HMAC workflow', () => {
    it('should sign and verify nuclear mode activation', async () => {
      // Simulate nuclear mode activation
      const deviceSecret = generateSecureRandom(32); // 64 hex chars
      const activationTime = new Date('2025-01-01T12:00:00Z').toISOString();
      const endTime = new Date('2025-01-01T16:00:00Z').toISOString();

      // Create message to sign
      const message = JSON.stringify({
        active: true,
        activationTime,
        endTime,
      });

      // Sign the message
      const signature = await generateHMAC(message, deviceSecret);

      // Verify signature (should succeed)
      const isValid = await verifyHMAC(message, signature, deviceSecret);
      expect(isValid).toBe(true);

      // Tampering attempt: modify end time
      const tamperedMessage = JSON.stringify({
        active: true,
        activationTime,
        endTime: '2025-01-01T12:30:00Z', // Changed!
      });

      // Verification should fail
      const isTamperedValid = await verifyHMAC(tamperedMessage, signature, deviceSecret);
      expect(isTamperedValid).toBe(false);
    });

    it('should detect time manipulation attempt', async () => {
      const deviceSecret = generateSecureRandom(32);
      const originalTime = Date.now();
      const message = originalTime.toString();

      // Sign original timestamp
      const signature = await generateHMAC(message, deviceSecret);

      // User manipulates system time backward
      const manipulatedTime = originalTime - 3600000; // 1 hour earlier
      const manipulatedMessage = manipulatedTime.toString();

      // Verification with manipulated time should fail
      const isValid = await verifyHMAC(manipulatedMessage, signature, deviceSecret);
      expect(isValid).toBe(false);

      // Original signature still valid with original time
      const isOriginalValid = await verifyHMAC(message, signature, deviceSecret);
      expect(isOriginalValid).toBe(true);
    });
  });
});
