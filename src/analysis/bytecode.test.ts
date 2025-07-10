import { JsonRpcProvider } from 'ethers';
import {
  fetchBytecode,
  clearBytecodeCache,
  getCacheStats,
  preloadBytecode,
  isContract,
  getBytecodeSize,
  isProxyContract,
} from './bytecode';
import { SecurityError } from '../types';

// Mock ethers provider
jest.mock('ethers');

describe('Bytecode Module', () => {
  let mockProvider: jest.Mocked<JsonRpcProvider>;

  beforeEach(() => {
    // Clear cache before each test
    clearBytecodeCache();
    
    // Create mock provider
    mockProvider = {
      getCode: jest.fn(),
    } as unknown as jest.Mocked<JsonRpcProvider>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchBytecode', () => {
    const validAddress = '0x1234567890123456789012345678901234567890';
    const validBytecode = '0x608060405234801561001057600080fd5b5060405180910390f35b8080fd5b';

    it('should fetch bytecode for a valid address', async () => {
      mockProvider.getCode.mockResolvedValue(validBytecode);

      const result = await fetchBytecode(validAddress, mockProvider);

      expect(result).toBe(validBytecode);
      expect(mockProvider.getCode).toHaveBeenCalledWith(validAddress);
    });

    it('should handle empty bytecode (EOA)', async () => {
      mockProvider.getCode.mockResolvedValue('0x');

      const result = await fetchBytecode(validAddress, mockProvider);

      expect(result).toBe('0x');
      expect(mockProvider.getCode).toHaveBeenCalledWith(validAddress);
    });

    it('should cache bytecode after first fetch', async () => {
      mockProvider.getCode.mockResolvedValue(validBytecode);

      // First call
      const result1 = await fetchBytecode(validAddress, mockProvider);
      expect(result1).toBe(validBytecode);
      expect(mockProvider.getCode).toHaveBeenCalledTimes(1);

      // Second call should use cache
      const result2 = await fetchBytecode(validAddress, mockProvider);
      expect(result2).toBe(validBytecode);
      expect(mockProvider.getCode).toHaveBeenCalledTimes(1); // No additional call
    });

    it('should validate address format', async () => {
      const invalidAddress = 'invalid-address';

      await expect(fetchBytecode(invalidAddress, mockProvider)).rejects.toThrow(
        /Invalid contract address/
      );
    });

    it('should normalize address to lowercase', async () => {
      const uppercaseAddress = '0x1234567890123456789012345678901234567890'.toUpperCase();
      mockProvider.getCode.mockResolvedValue(validBytecode);

      await fetchBytecode(uppercaseAddress, mockProvider);

      expect(mockProvider.getCode).toHaveBeenCalledWith(uppercaseAddress.toLowerCase());
    });

    it('should handle network errors', async () => {
      mockProvider.getCode.mockRejectedValue(new Error('network error'));

      await expect(fetchBytecode(validAddress, mockProvider)).rejects.toThrow(
        /Network error while fetching bytecode/
      );
    });

    it('should handle rate limit errors', async () => {
      mockProvider.getCode.mockRejectedValue(new Error('rate limit exceeded'));

      await expect(fetchBytecode(validAddress, mockProvider)).rejects.toThrow(
        /Rate limit exceeded while fetching bytecode/
      );
    });

    it('should handle timeout errors', async () => {
      mockProvider.getCode.mockRejectedValue(new Error('timeout error'));

      await expect(fetchBytecode(validAddress, mockProvider)).rejects.toThrow(
        /Request timeout while fetching bytecode/
      );
    });

    it('should handle invalid bytecode format', async () => {
      const invalidBytecode = 'invalid-bytecode';
      mockProvider.getCode.mockResolvedValue(invalidBytecode);

      await expect(fetchBytecode(validAddress, mockProvider)).rejects.toThrow(
        /Invalid bytecode format/
      );
    });

    it('should handle extremely long bytecode', async () => {
      const longBytecode = '0x' + 'a'.repeat(100000); // Exceeds max length
      mockProvider.getCode.mockResolvedValue(longBytecode);

      await expect(fetchBytecode(validAddress, mockProvider)).rejects.toThrow(
        /Bytecode length exceeds maximum allowed size/
      );
    });

    it('should handle generic provider errors', async () => {
      mockProvider.getCode.mockRejectedValue(new Error('Generic provider error'));

      await expect(fetchBytecode(validAddress, mockProvider)).rejects.toThrow(
        /Failed to fetch bytecode for address/
      );
    });
  });

  describe('Cache Management', () => {
    const validAddress = '0x1234567890123456789012345678901234567890';
    const validBytecode = '0x608060405234801561001057600080fd5b5060405180910390f35b8080fd5b';

    it('should clear cache', async () => {
      mockProvider.getCode.mockResolvedValue(validBytecode);

      // Populate cache
      await fetchBytecode(validAddress, mockProvider);
      expect(getCacheStats().size).toBe(1);

      // Clear cache
      clearBytecodeCache();
      expect(getCacheStats().size).toBe(0);
    });

    it('should provide cache statistics', async () => {
      mockProvider.getCode.mockResolvedValue(validBytecode);

      const initialStats = getCacheStats();
      expect(initialStats.size).toBe(0);
      expect(initialStats.maxSize).toBe(1000);
      expect(initialStats.maxAge).toBe(600000); // 10 minutes

      await fetchBytecode(validAddress, mockProvider);
      
      const afterStats = getCacheStats();
      expect(afterStats.size).toBe(1);
    });
  });

  describe('preloadBytecode', () => {
    it('should preload multiple addresses', async () => {
      const addresses = [
        '0x1234567890123456789012345678901234567890',
        '0x0987654321098765432109876543210987654321',
      ];
      const bytecodes = [
        '0x608060405234801561001057600080fd5b506040518091',
        '0x608060405234801561001057600080fd5b506040518092',
      ];

      mockProvider.getCode
        .mockResolvedValueOnce(bytecodes[0])
        .mockResolvedValueOnce(bytecodes[1]);

      const results = await preloadBytecode(addresses, mockProvider);

      expect(results).toEqual({
        [addresses[0]]: bytecodes[0],
        [addresses[1]]: bytecodes[1],
      });
      expect(mockProvider.getCode).toHaveBeenCalledTimes(2);
    });

    it('should handle partial failures gracefully', async () => {
      const addresses = [
        '0x1234567890123456789012345678901234567890',
        'invalid-address',
        '0x0987654321098765432109876543210987654321',
      ];
      const validBytecode = '0x608060405234801561001057600080fd5b506040518091';

      mockProvider.getCode
        .mockResolvedValueOnce(validBytecode)
        .mockResolvedValueOnce(validBytecode);

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      const results = await preloadBytecode(addresses, mockProvider);

      expect(results).toEqual({
        [addresses[0]]: validBytecode,
        [addresses[2]]: validBytecode,
      });
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to preload bytecode for invalid-address'),
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('isContract', () => {
    const validAddress = '0x1234567890123456789012345678901234567890';

    it('should return true for contract addresses', async () => {
      const validBytecode = '0x608060405234801561001057600080fd5b506040518091';
      mockProvider.getCode.mockResolvedValue(validBytecode);

      const result = await isContract(validAddress, mockProvider);

      expect(result).toBe(true);
    });

    it('should return false for EOA addresses', async () => {
      mockProvider.getCode.mockResolvedValue('0x');

      const result = await isContract(validAddress, mockProvider);

      expect(result).toBe(false);
    });

    it('should return false for empty bytecode', async () => {
      mockProvider.getCode.mockResolvedValue('');

      const result = await isContract(validAddress, mockProvider);

      expect(result).toBe(false);
    });

    it('should return false on fetch error', async () => {
      mockProvider.getCode.mockRejectedValue(new Error('Provider error'));

      const result = await isContract(validAddress, mockProvider);

      expect(result).toBe(false);
    });
  });

  describe('getBytecodeSize', () => {
    it('should calculate correct size for valid bytecode', () => {
      const bytecode = '0x608060405234801561001057600080fd5b506040518091';
      const expectedSize = (bytecode.length - 2) / 2; // Remove '0x' and divide by 2
      
      const result = getBytecodeSize(bytecode);
      
      expect(result).toBe(expectedSize);
    });

    it('should return 0 for empty bytecode', () => {
      expect(getBytecodeSize('0x')).toBe(0);
      expect(getBytecodeSize('')).toBe(0);
    });

    it('should handle single byte bytecode', () => {
      const bytecode = '0xff';
      const result = getBytecodeSize(bytecode);
      expect(result).toBe(1);
    });
  });

  describe('isProxyContract', () => {
    it('should detect minimal proxy (EIP-1167)', () => {
      const proxyBytecode = '0x3d602d80600a3d3981f3363d3d373d3d3d363d73';
      
      const result = isProxyContract(proxyBytecode);
      
      expect(result).toBe(true);
    });

    it('should detect common proxy patterns', () => {
      const proxyBytecode = '0x6080604052348015600f57600080fd5b506004361060285760003560e01c8063';
      
      const result = isProxyContract(proxyBytecode);
      
      expect(result).toBe(true);
    });

    it('should return false for non-proxy contracts', () => {
      const regularBytecode = '0x608060405234801561001057600080fd5b506040518091';
      
      const result = isProxyContract(regularBytecode);
      
      expect(result).toBe(false);
    });

    it('should return false for empty bytecode', () => {
      expect(isProxyContract('0x')).toBe(false);
      expect(isProxyContract('')).toBe(false);
    });

    it('should handle case insensitive matching', () => {
      const proxyBytecode = '0x3D602D80600A3D3981F3363D3D373D3D3D363D73'; // Uppercase
      
      const result = isProxyContract(proxyBytecode);
      
      expect(result).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should throw SecurityError for invalid addresses (wrapped by safeAsync)', async () => {
      await expect(fetchBytecode('invalid', mockProvider)).rejects.toThrow(SecurityError);
    });

    it('should throw SecurityError for invalid bytecode (wrapped by safeAsync)', async () => {
      const validAddress = '0x1234567890123456789012345678901234567890';
      mockProvider.getCode.mockResolvedValue('invalid-bytecode');

      await expect(fetchBytecode(validAddress, mockProvider)).rejects.toThrow(SecurityError);
    });

    it('should preserve error cause in BytecodeError', async () => {
      const validAddress = '0x1234567890123456789012345678901234567890';
      const originalError = new Error('Original error');
      mockProvider.getCode.mockRejectedValue(originalError);

      try {
        await fetchBytecode(validAddress, mockProvider);
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toContain('Failed to fetch bytecode');
      }
    });
  });

  describe('Edge Cases', () => {
    it('should handle null/undefined responses', async () => {
      const validAddress = '0x1234567890123456789012345678901234567890';
      mockProvider.getCode.mockResolvedValue(null as any);

      await expect(fetchBytecode(validAddress, mockProvider)).rejects.toThrow();
    });

    it('should handle very short addresses', async () => {
      const shortAddress = '0x123';

      await expect(fetchBytecode(shortAddress, mockProvider)).rejects.toThrow(
        /Invalid contract address/
      );
    });

    it('should handle addresses with invalid characters', async () => {
      const invalidAddress = '0x123456789012345678901234567890123456789g'; // 'g' is invalid

      await expect(fetchBytecode(invalidAddress, mockProvider)).rejects.toThrow(
        /Invalid contract address/
      );
    });
  });
});
