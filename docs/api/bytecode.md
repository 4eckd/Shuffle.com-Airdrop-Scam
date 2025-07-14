# Bytecode Analysis API Documentation

![Version](https://img.shields.io/badge/version-1.3.0-blue.svg)
![TypeScript](https://img.shields.io/badge/typescript-5.3+-blue.svg)
![Ethers](https://img.shields.io/badge/ethers-6.15+-blue.svg)
![Security](https://img.shields.io/badge/security-first-red.svg)

---

![Security Warning](https://img.shields.io/badge/warning-critical-red.svg)

**⚠️ CRITICAL SECURITY WARNING:**

This documentation covers the bytecode analysis utilities for smart contract security research. The tools are designed exclusively for educational and security research purposes. **NEVER INTERACT WITH OR DEPLOY ANY ANALYZED CONTRACT.** Always follow security best practices and maintain educational focus when utilizing these tools.

---

## Overview

The Bytecode Analysis module provides a comprehensive, secure, and performant system for retrieving and analyzing smart contract bytecode from Ethereum networks. It implements advanced caching strategies, input validation, and error handling to ensure safe and efficient bytecode operations.

### Key Features

- **Secure Bytecode Retrieval** - Safe interaction with Ethereum JsonRpcProvider
- **LRU Caching System** - In-memory caching to minimize redundant RPC calls
- **Comprehensive Validation** - Zod schema validation for addresses and bytecode
- **Error Wrapping** - Safe error handling with `safeAsync` pattern
- **Proxy Detection** - Identification of common proxy contract patterns
- **Performance Optimization** - Efficient batch operations and preloading capabilities

### Dependencies

```json
{
  "ethers": "^6.15.0",
  "lru-cache": "^11.1.0",
  "zod": "^3.22.4"
}
```

## Core Functions

### `fetchBytecode(address: string, provider: JsonRpcProvider): Promise<string>`

Fetches bytecode for a given contract address with comprehensive caching and validation.

```typescript
import { fetchBytecode } from './src/analysis/bytecode';
import { JsonRpcProvider } from 'ethers';

const provider = new JsonRpcProvider('https://mainnet.infura.io/v3/YOUR_PROJECT_ID');
const address = '0x1234567890123456789012345678901234567890';

try {
  const bytecode = await fetchBytecode(address, provider);
  console.log('Bytecode:', bytecode);
} catch (error) {
  console.error('Failed to fetch bytecode:', error.message);
}
```

**Parameters:**
- `address`: `string` - Ethereum contract address (validated and normalized)
- `provider`: `JsonRpcProvider` - Ethers v6 JsonRpcProvider instance

**Returns:** `Promise<string>` - The contract bytecode (hex string with 0x prefix)

**Features:**
- ✅ Address format validation and normalization
- ✅ LRU cache integration (10-minute TTL, 1000 entry limit)
- ✅ Comprehensive error handling with provider-specific error detection
- ✅ Safe async operation with `safeAsync` wrapper
- ✅ Support for empty bytecode (EOA addresses)

**Throws:**
- `SecurityError` - Wrapped validation or provider errors via `safeAsync`

### Cache Management

#### `clearBytecodeCache(): void`

Clears the entire bytecode cache.

```typescript
import { clearBytecodeCache } from './src/analysis/bytecode';

clearBytecodeCache();
console.log('Cache cleared');
```

#### `getCacheStats(): { size: number; maxSize: number; maxAge: number }`

Returns current cache statistics.

```typescript
import { getCacheStats } from './src/analysis/bytecode';

const stats = getCacheStats();
console.log('Cache stats:', stats);
// { size: 42, maxSize: 1000, maxAge: 600000 }
```

**Returns:**
- `size`: Current number of cached entries
- `maxSize`: Maximum cache capacity (1000)
- `maxAge`: Cache TTL in milliseconds (600,000ms = 10 minutes)

### Batch Operations

#### `preloadBytecode(addresses: string[], provider: JsonRpcProvider): Promise<{ [address: string]: string }>`

Efficiently preloads bytecode for multiple addresses with graceful error handling.

```typescript
import { preloadBytecode } from './src/analysis/bytecode';

const addresses = [
  '0x1234567890123456789012345678901234567890',
  '0x0987654321098765432109876543210987654321',
];

const results = await preloadBytecode(addresses, provider);
console.log('Preloaded bytecode:', results);
// {
//   '0x1234...': '0x608060405234801561001057600080fd5b50...',
//   '0x0987...': '0x608060405234801561001057600080fd5b50...'
// }
```

**Parameters:**
- `addresses`: `string[]` - Array of contract addresses to preload
- `provider`: `JsonRpcProvider` - Ethers provider instance

**Returns:** `Promise<{ [address: string]: string }>` - Object mapping addresses to bytecode

**Features:**
- ✅ Parallel processing with `Promise.all`
- ✅ Graceful error handling (failed addresses logged but don't fail operation)
- ✅ Automatic cache population
- ✅ Progress logging for debugging

### Contract Analysis Utilities

#### `isContract(address: string, provider: JsonRpcProvider): Promise<boolean>`

Determines if an address contains contract bytecode (vs. EOA).

```typescript
import { isContract } from './src/analysis/bytecode';

const contractResult = await isContract('0x1234567890123456789012345678901234567890', provider);
console.log('Is contract:', contractResult); // true

const eoaResult = await isContract('0x0000000000000000000000000000000000000000', provider);
console.log('Is contract:', eoaResult); // false
```

**Parameters:**
- `address`: `string` - Address to check
- `provider`: `JsonRpcProvider` - Ethers provider instance

**Returns:** `Promise<boolean>` - `true` if address contains bytecode, `false` for EOA or on error

#### `getBytecodeSize(bytecode: string): number`

Calculates the size of bytecode in bytes.

```typescript
import { getBytecodeSize } from './src/analysis/bytecode';

const bytecode = '0x608060405234801561001057600080fd5b50';
const size = getBytecodeSize(bytecode);
console.log('Bytecode size:', size, 'bytes'); // 22 bytes
```

**Parameters:**
- `bytecode`: `string` - Hex bytecode string

**Returns:** `number` - Size in bytes (excluding 0x prefix)

#### `isProxyContract(bytecode: string): boolean`

Detects common proxy contract patterns in bytecode.

```typescript
import { isProxyContract } from './src/analysis/bytecode';

const proxyBytecode = '0x3d602d80600a3d3981f3363d3d373d3d3d363d73';
const isProxy = isProxyContract(proxyBytecode);
console.log('Is proxy contract:', isProxy); // true
```

**Detected Patterns:**
- **EIP-1167 Minimal Proxy**: `3d602d80600a3d3981f3363d3d373d3d3d363d73`
- **Common Proxy Pattern**: `6080604052348015600f57600080fd5b506004361060285760003560e01c8063`

**Parameters:**
- `bytecode`: `string` - Contract bytecode to analyze

**Returns:** `boolean` - `true` if proxy patterns detected

## Type Definitions

### `Bytecode`

```typescript
type Bytecode = string; // Zod-validated hex string
```

Validated bytecode string with constraints:
- Minimum 2 characters (0x prefix)
- Maximum 50,000 characters (security limit)
- Must match regex: `/^0x[a-fA-F0-9]*$/`

### `BytecodeResponse`

```typescript
type BytecodeResponse = {
  bytecode: string;
  address: ContractAddress;
};
```

Structured response for bytecode operations.

## Error Handling

### `BytecodeError`

```typescript
class BytecodeError extends Error {
  constructor(
    message: string,
    public readonly address?: ContractAddress,
    public readonly cause?: Error
  );
}
```

Thrown for bytecode-specific validation or processing errors.

### `ProviderError`

```typescript
class ProviderError extends Error {
  constructor(
    message: string,
    public readonly address?: ContractAddress,
    public readonly cause?: Error
  );
}
```

Thrown for provider-related errors (network, rate limiting, timeouts).

### Error Categories

The module handles various error scenarios:

- **Network Errors**: Connectivity issues, DNS resolution failures
- **Rate Limiting**: Provider rate limit exceeded
- **Timeouts**: Request timeout errors
- **Invalid Addresses**: Malformed Ethereum addresses
- **Invalid Bytecode**: Malformed or oversized bytecode responses

## Security Considerations

### Address Validation

All addresses are validated using strict Ethereum address format validation:

```typescript
const ContractAddressSchema = z.string().regex(/^0x[a-fA-F0-9]{40}$/, {
  message: 'Invalid Ethereum address format',
});
```

### Bytecode Validation

Bytecode is validated for:
- Proper hex format with 0x prefix
- Reasonable size limits (max 50KB)
- Safe character set (hex digits only)

### Cache Security

- **TTL Limits**: 10-minute maximum cache duration
- **Size Limits**: 1000 entry maximum to prevent memory exhaustion
- **Address Normalization**: All addresses normalized to lowercase

### Provider Safety

- **Error Isolation**: Provider errors wrapped and classified
- **Timeout Handling**: Graceful handling of request timeouts
- **Rate Limit Detection**: Automatic detection and reporting of rate limits

## Performance Optimization

### Caching Strategy

The module implements an LRU (Least Recently Used) cache with:
- **10-minute TTL**: Balances freshness with performance
- **1000 entry limit**: Prevents memory exhaustion
- **Automatic eviction**: LRU algorithm ensures optimal memory usage

### Batch Operations

- **Parallel Processing**: `Promise.all` for concurrent requests
- **Error Isolation**: Individual failures don't affect batch operation
- **Cache Integration**: Batch results automatically cached

### Network Efficiency

- **Cache-First Strategy**: Always check cache before network requests
- **Request Deduplication**: Multiple requests for same address use cached result
- **Graceful Degradation**: Continues operation despite individual failures

## Testing

The module includes comprehensive unit tests covering:

- ✅ **33 test cases** with 100% pass rate
- ✅ **Address validation** - Valid/invalid formats, normalization
- ✅ **Bytecode validation** - Various formats, size limits, empty bytecode
- ✅ **Cache operations** - Store, retrieve, clear, statistics
- ✅ **Error handling** - Provider errors, network issues, validation failures
- ✅ **Edge cases** - Null responses, malformed data, proxy detection
- ✅ **Batch operations** - Parallel processing, partial failures

### Running Tests

```bash
npm test -- src/analysis/bytecode.test.ts
```

## Usage Examples

### Basic Bytecode Retrieval

```typescript
import { fetchBytecode } from './src/analysis/bytecode';
import { JsonRpcProvider } from 'ethers';

const provider = new JsonRpcProvider('https://mainnet.infura.io/v3/YOUR_PROJECT_ID');

async function analyzeBytecode() {
  try {
    // Fetch contract bytecode
    const bytecode = await fetchBytecode(
      '0x1234567890123456789012345678901234567890',
      provider
    );
    
    console.log('Bytecode length:', getBytecodeSize(bytecode));
    console.log('Is proxy:', isProxyContract(bytecode));
    
  } catch (error) {
    console.error('Analysis failed:', error.message);
  }
}
```

### Batch Contract Analysis

```typescript
import { preloadBytecode, isContract, getBytecodeSize } from './src/analysis/bytecode';

async function batchAnalysis() {
  const addresses = [
    '0x1234567890123456789012345678901234567890',
    '0x0987654321098765432109876543210987654321',
    '0xabcdef1234567890abcdef1234567890abcdef12',
  ];
  
  // Preload all bytecode
  const bytecodes = await preloadBytecode(addresses, provider);
  
  // Analyze each contract
  for (const [address, bytecode] of Object.entries(bytecodes)) {
    console.log(`\nContract: ${address}`);
    console.log(`Size: ${getBytecodeSize(bytecode)} bytes`);
    console.log(`Is Proxy: ${isProxyContract(bytecode)}`);
  }
}
```

### Error Handling and Validation

```typescript
import { fetchBytecode, BytecodeError, ProviderError } from './src/analysis/bytecode';
import { SecurityError } from '../types';

async function safeAnalysis(address: string) {
  try {
    const bytecode = await fetchBytecode(address, provider);
    return { success: true, bytecode };
    
  } catch (error) {
    if (error instanceof SecurityError) {
      console.error('Security error:', error.message);
      return { success: false, error: 'security' };
    } else {
      console.error('Unknown error:', error);
      return { success: false, error: 'unknown' };
    }
  }
}
```

### Cache Management

```typescript
import { getCacheStats, clearBytecodeCache } from './src/analysis/bytecode';

function manageCacheSize() {
  const stats = getCacheStats();
  
  console.log(`Cache usage: ${stats.size}/${stats.maxSize} entries`);
  
  if (stats.size > 800) {
    console.log('Cache approaching limit, clearing...');
    clearBytecodeCache();
  }
}
```

## Best Practices

### 1. Provider Configuration

```typescript
// Use reliable provider with proper configuration
const provider = new JsonRpcProvider('https://mainnet.infura.io/v3/YOUR_PROJECT_ID', {
  name: 'mainnet',
  chainId: 1,
});
```

### 2. Error Handling

```typescript
// Always wrap bytecode operations in try-catch
try {
  const bytecode = await fetchBytecode(address, provider);
  // Process bytecode
} catch (error) {
  // Handle specific error types
  console.error('Bytecode operation failed:', error.message);
}
```

### 3. Batch Operations

```typescript
// Use batch operations for multiple addresses
const results = await preloadBytecode(addresses, provider);
// Process results with cached data
```

### 4. Cache Monitoring

```typescript
// Periodically check cache health
setInterval(() => {
  const stats = getCacheStats();
  console.log(`Cache: ${stats.size} entries`);
}, 60000);
```

### 5. Security Validation

```typescript
// Always validate addresses before use
import { validateContractAddress } from '../utils/validation';

try {
  const validAddress = validateContractAddress(userInput);
  const bytecode = await fetchBytecode(validAddress, provider);
} catch (error) {
  console.error('Invalid address:', error.message);
}
```

---

## Security Best Practices

1. **Never interact with analyzed contracts** - This module is for analysis only
2. **Validate all inputs** - Always use provided validation utilities
3. **Handle errors properly** - Implement comprehensive error handling
4. **Monitor cache usage** - Prevent memory exhaustion
5. **Use reliable providers** - Configure proper RPC endpoints
6. **Regular updates** - Keep dependencies updated for security patches

---

*Bytecode Analysis API Documentation Version: 1.3.0*  
*Last Updated: 2025-07-10*  
*For more information, see the [main API documentation](README.md)*
