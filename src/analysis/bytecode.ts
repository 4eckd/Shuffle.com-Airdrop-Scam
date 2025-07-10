import { z } from 'zod';
import { JsonRpcProvider } from 'ethers';
import { LRUCache } from 'lru-cache';
import { ContractAddressSchema, ContractAddress } from '../types';
import { safeAsync } from '../utils/validation';

// Zod schemas for validation
const BytecodeResponseSchema = z.object({
  bytecode: z.string().min(2, 'Bytecode must be at least 2 characters (0x prefix)'),
  address: ContractAddressSchema,
});

const BytecodeSchema = z.string()
  .min(2, 'Bytecode must be at least 2 characters (0x prefix)')
  .max(50000, 'Bytecode length exceeds maximum allowed size')
  .regex(/^0x[a-fA-F0-9]*$/, 'Invalid bytecode format');

// Types
export type BytecodeResponse = z.infer<typeof BytecodeResponseSchema>;
export type Bytecode = z.infer<typeof BytecodeSchema>;

// Cache configuration
const CACHE_CONFIG = {
  max: 1000,
  ttl: 1000 * 60 * 10, // 10 minutes
} as const;

// LRU cache instance
const bytecodeCache = new LRUCache<string, Bytecode>(CACHE_CONFIG);

// Error types
export class BytecodeError extends Error {
  constructor(
    message: string,
    public readonly address?: ContractAddress,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = 'BytecodeError';
  }
}

export class ProviderError extends Error {
  constructor(
    message: string,
    public readonly address?: ContractAddress,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = 'ProviderError';
  }
}

/**
 * Validates and normalizes a contract address
 */
function validateAddress(address: string): ContractAddress {
  try {
    const normalizedAddress = address.toLowerCase();
    return ContractAddressSchema.parse(normalizedAddress);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new BytecodeError(
        `Invalid contract address: ${error.errors[0]?.message || 'Unknown validation error'}`,
        address as ContractAddress
      );
    }
    throw error;
  }
}

/**
 * Validates bytecode response from provider
 */
function validateBytecode(bytecode: string, address: ContractAddress): Bytecode {
  try {
    // Handle empty bytecode (externally owned account)
    if (bytecode === '0x' || bytecode === '') {
      return '0x';
    }
    
    return BytecodeSchema.parse(bytecode);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new BytecodeError(
        `Invalid bytecode format for address ${address}: ${error.errors[0]?.message || 'Unknown validation error'}`,
        address
      );
    }
    throw error;
  }
}

/**
 * Retrieves bytecode from the provider
 */
async function getBytecodeFromProvider(
  address: ContractAddress,
  provider: JsonRpcProvider
): Promise<Bytecode> {
  try {
    const bytecode = await provider.getCode(address);
    return validateBytecode(bytecode, address);
  } catch (error) {
    if (error instanceof BytecodeError) {
      throw error;
    }
    
    // Handle provider-specific errors
    if (error instanceof Error) {
      if (error.message.includes('network')) {
        throw new ProviderError(
          `Network error while fetching bytecode for ${address}`,
          address,
          error
        );
      }
      
      if (error.message.includes('rate limit')) {
        throw new ProviderError(
          `Rate limit exceeded while fetching bytecode for ${address}`,
          address,
          error
        );
      }
      
      if (error.message.includes('timeout')) {
        throw new ProviderError(
          `Request timeout while fetching bytecode for ${address}`,
          address,
          error
        );
      }
    }
    
    throw new BytecodeError(
      `Failed to fetch bytecode for address ${address}`,
      address,
      error instanceof Error ? error : new Error(String(error))
    );
  }
}

/**
 * Generates a cache key for the given address
 */
function getCacheKey(address: ContractAddress): string {
  return `bytecode:${address}`;
}

/**
 * Retrieves bytecode from cache
 */
function getBytecodeFromCache(address: ContractAddress): Bytecode | undefined {
  const cacheKey = getCacheKey(address);
  return bytecodeCache.get(cacheKey);
}

/**
 * Stores bytecode in cache
 */
function setBytecodeInCache(address: ContractAddress, bytecode: Bytecode): void {
  const cacheKey = getCacheKey(address);
  bytecodeCache.set(cacheKey, bytecode);
}

/**
 * Fetches bytecode for a given contract address with caching and validation
 * 
 * @param address - The contract address to fetch bytecode for
 * @param provider - The ethers JsonRpcProvider instance
 * @returns Promise<string> - The bytecode string
 * 
 * @throws {BytecodeError} - When address validation fails or bytecode is invalid
 * @throws {ProviderError} - When provider operations fail
 */
export async function fetchBytecode(
  address: string,
  provider: JsonRpcProvider
): Promise<string> {
  return safeAsync(async () => {
    // Validate and normalize address
    const validatedAddress = validateAddress(address);
    
    // Check cache first
    const cachedBytecode = getBytecodeFromCache(validatedAddress);
    if (cachedBytecode !== undefined) {
      return cachedBytecode;
    }
    
    // Fetch from provider
    const bytecode = await getBytecodeFromProvider(validatedAddress, provider);
    
    // Cache the result
    setBytecodeInCache(validatedAddress, bytecode);
    
    return bytecode;
  }, 'Failed to fetch bytecode');
}

/**
 * Clears the bytecode cache
 */
export function clearBytecodeCache(): void {
  bytecodeCache.clear();
}

/**
 * Gets cache statistics
 */
export function getCacheStats(): {
  size: number;
  maxSize: number;
  maxAge: number;
} {
  return {
    size: bytecodeCache.size,
    maxSize: CACHE_CONFIG.max,
    maxAge: CACHE_CONFIG.ttl,
  };
}

/**
 * Preloads bytecode for multiple addresses
 */
export async function preloadBytecode(
  addresses: string[],
  provider: JsonRpcProvider
): Promise<{ [address: string]: string }> {
  const results: { [address: string]: string } = {};
  
  const promises = addresses.map(async (address) => {
    try {
      const bytecode = await fetchBytecode(address, provider);
      results[address] = bytecode;
    } catch (error) {
      // Log error but don't fail the entire operation
      console.warn(`Failed to preload bytecode for ${address}:`, error);
    }
  });
  
  await Promise.all(promises);
  return results;
}

/**
 * Checks if an address has bytecode (is a contract)
 */
export async function isContract(
  address: string,
  provider: JsonRpcProvider
): Promise<boolean> {
  try {
    const bytecode = await fetchBytecode(address, provider);
    return bytecode !== '0x' && bytecode !== '';
  } catch (error) {
    // If we can't fetch bytecode, assume it's not a contract
    return false;
  }
}

/**
 * Gets bytecode size in bytes
 */
export function getBytecodeSize(bytecode: string): number {
  if (bytecode === '0x' || bytecode === '') {
    return 0;
  }
  
  // Remove '0x' prefix and divide by 2 (each byte is 2 hex characters)
  return (bytecode.length - 2) / 2;
}

/**
 * Validates if bytecode appears to be a proxy contract
 */
export function isProxyContract(bytecode: string): boolean {
  if (bytecode === '0x' || bytecode === '') {
    return false;
  }
  
  // Common proxy patterns (simplified check)
  const proxyPatterns = [
    '3d602d80600a3d3981f3363d3d373d3d3d363d73', // Minimal proxy (EIP-1167)
    '6080604052348015600f57600080fd5b506004361060285760003560e01c8063', // Common proxy pattern
  ];
  
  return proxyPatterns.some(pattern => bytecode.toLowerCase().includes(pattern));
}
