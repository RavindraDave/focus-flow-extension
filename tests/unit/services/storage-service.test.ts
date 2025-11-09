/**
 * StorageService Unit Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { StorageService, StorageError, StorageErrorCode } from '../../../src/services/storage-service';
import { z } from 'zod';

// Mock chrome.storage API
const mockStorage: Record<string, unknown> = {};
const mockStorageListeners: Array<(changes: Record<string, chrome.storage.StorageChange>, areaName: string) => void> = [];

global.chrome = {
  storage: {
    local: {
      get: vi.fn((keys) => {
        if (typeof keys === 'string') {
          return Promise.resolve({ [keys]: mockStorage[keys] });
        }
        if (Array.isArray(keys)) {
          const result: Record<string, unknown> = {};
          keys.forEach((key) => {
            if (key in mockStorage) {
              result[key] = mockStorage[key];
            }
          });
          return Promise.resolve(result);
        }
        return Promise.resolve(mockStorage);
      }),
      set: vi.fn((items) => {
        Object.assign(mockStorage, items);
        return Promise.resolve();
      }),
      remove: vi.fn((keys) => {
        const keysArray = Array.isArray(keys) ? keys : [keys];
        keysArray.forEach((key) => delete mockStorage[key]);
        return Promise.resolve();
      }),
      clear: vi.fn(() => {
        Object.keys(mockStorage).forEach((key) => delete mockStorage[key]);
        return Promise.resolve();
      }),
      getBytesInUse: vi.fn(() => {
        const str = JSON.stringify(mockStorage);
        return Promise.resolve(str.length);
      }),
    },
    onChanged: {
      addListener: vi.fn((callback) => {
        mockStorageListeners.push(callback);
      }),
      removeListener: vi.fn(),
    },
  },
} as any;

describe('StorageService', () => {
  let service: StorageService;

  beforeEach(() => {
    service = new StorageService();
    // Clear mock storage
    Object.keys(mockStorage).forEach((key) => delete mockStorage[key]);
    vi.clearAllMocks();
  });

  afterEach(async () => {
    await service.flush();
  });

  describe('get()', () => {
    const TestSchema = z.object({
      name: z.string(),
      age: z.number(),
    });

    it('should return null for non-existent keys', async () => {
      const result = await service.get('nonexistent', TestSchema);
      expect(result).toBeNull();
    });

    it('should return validated data for existing keys', async () => {
      mockStorage['test'] = { name: 'John', age: 30 };

      const result = await service.get('test', TestSchema);
      expect(result).toEqual({ name: 'John', age: 30 });
    });

    it('should throw StorageError for corrupted data', async () => {
      mockStorage['test'] = { name: 'John', age: 'invalid' }; // age should be number

      await expect(service.get('test', TestSchema)).rejects.toThrow(StorageError);
      await expect(service.get('test', TestSchema)).rejects.toThrow(/Corrupted data/);
    });

    it('should reject dangerous keys (prototype pollution)', async () => {
      await expect(service.get('__proto__', TestSchema)).rejects.toThrow(StorageError);
      await expect(service.get('constructor', TestSchema)).rejects.toThrow(StorageError);
      await expect(service.get('prototype', TestSchema)).rejects.toThrow(StorageError);
    });

    it('should reject invalid key lengths', async () => {
      await expect(service.get('', TestSchema)).rejects.toThrow(StorageError);

      const longKey = 'a'.repeat(101);
      await expect(service.get(longKey, TestSchema)).rejects.toThrow(StorageError);
    });

    it('should return null for null/undefined values', async () => {
      mockStorage['test1'] = null;
      mockStorage['test2'] = undefined;

      const result1 = await service.get('test1', TestSchema);
      const result2 = await service.get('test2', TestSchema);

      expect(result1).toBeNull();
      expect(result2).toBeNull();
    });
  });

  describe('set()', () => {
    const TestSchema = z.object({
      name: z.string(),
      age: z.number().min(0),
    });

    it('should save validated data', async () => {
      const data = { name: 'Alice', age: 25 };

      await service.set('test', data, TestSchema, { debounce: false });

      expect(mockStorage['test']).toEqual(data);
      expect(chrome.storage.local.set).toHaveBeenCalledWith({ test: data });
    });

    it('should reject invalid data', async () => {
      const invalidData = { name: 'Bob', age: -5 }; // age must be >= 0

      await expect(
        service.set('test', invalidData, TestSchema, { debounce: false })
      ).rejects.toThrow(StorageError);

      expect(mockStorage['test']).toBeUndefined();
    });

    it('should reject dangerous keys', async () => {
      const data = { name: 'Eve', age: 30 };

      await expect(
        service.set('__proto__', data, TestSchema)
      ).rejects.toThrow(StorageError);
    });

    it('should debounce writes by default', async () => {
      const data = { name: 'Charlie', age: 35 };

      const promise = service.set('test', data, TestSchema);

      // Should not have written yet (debounced)
      expect(chrome.storage.local.set).not.toHaveBeenCalled();

      // Wait for debounce
      await promise;

      expect(chrome.storage.local.set).toHaveBeenCalled();
    });

    it('should write immediately when debounce is disabled', async () => {
      const data = { name: 'Dave', age: 40 };

      await service.set('test', data, TestSchema, { debounce: false });

      expect(chrome.storage.local.set).toHaveBeenCalled();
    });
  });

  describe('remove()', () => {
    it('should remove key from storage', async () => {
      mockStorage['test'] = { value: 123 };

      await service.remove('test');

      expect(mockStorage['test']).toBeUndefined();
      expect(chrome.storage.local.remove).toHaveBeenCalledWith('test');
    });

    it('should reject dangerous keys', async () => {
      await expect(service.remove('__proto__')).rejects.toThrow(StorageError);
    });
  });

  describe('clear()', () => {
    it('should clear all data', async () => {
      mockStorage['test1'] = 'value1';
      mockStorage['test2'] = 'value2';

      await service.clear();

      expect(Object.keys(mockStorage)).toHaveLength(0);
      expect(chrome.storage.local.clear).toHaveBeenCalled();
    });
  });

  describe('getQuota()', () => {
    it('should return quota information', async () => {
      mockStorage['test'] = { value: 'a'.repeat(1000) };

      const quota = await service.getQuota();

      expect(quota).toHaveProperty('bytesUsed');
      expect(quota).toHaveProperty('bytesAvailable');
      expect(quota).toHaveProperty('percentageUsed');
      expect(quota.bytesUsed).toBeGreaterThan(0);
    });
  });

  describe('is QuotaNearLimit()', () => {
    it('should return false when quota is low', async () => {
      mockStorage['test'] = 'small';

      const isNear = await service.isQuotaNearLimit();
      expect(isNear).toBe(false);
    });
  });

  describe('getMultiple()', () => {
    it('should get multiple keys at once', async () => {
      mockStorage['key1'] = 'value1';
      mockStorage['key2'] = 'value2';
      mockStorage['key3'] = 'value3';

      const result = await service.getMultiple(['key1', 'key2']);

      expect(result).toEqual({
        key1: 'value1',
        key2: 'value2',
      });
    });

    it('should reject dangerous keys in array', async () => {
      await expect(
        service.getMultiple(['test', '__proto__'])
      ).rejects.toThrow(StorageError);
    });
  });

  describe('flush()', () => {
    it('should flush all pending debounced writes', async () => {
      const TestSchema = z.object({ value: z.number() });

      // Queue multiple debounced writes
      const promise1 = service.set('test1', { value: 1 }, TestSchema);
      const promise2 = service.set('test2', { value: 2 }, TestSchema);

      // Flush immediately
      await service.flush();

      // All writes should be complete
      await Promise.all([promise1, promise2]);

      expect(mockStorage['test1']).toEqual({ value: 1 });
      expect(mockStorage['test2']).toEqual({ value: 2 });
    });
  });

  describe('Error Handling', () => {
    it('should throw StorageError with appropriate code', async () => {
      const TestSchema = z.object({ name: z.string() });

      try {
        await service.set('test', { name: 123 } as any, TestSchema, { debounce: false });
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(StorageError);
        expect((error as StorageError).code).toBe(StorageErrorCode.VALIDATION_FAILED);
      }
    });

    it('should sanitize error messages', async () => {
      const TestSchema = z.object({ value: z.string() });

      vi.mocked(chrome.storage.local.get).mockRejectedValueOnce(
        new Error('Sensitive internal error with details')
      );

      try {
        await service.get('test', TestSchema);
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(StorageError);
        // Error message should include the error but be wrapped
        expect((error as StorageError).message).toContain('Failed to read from storage');
      }
    });
  });
});
