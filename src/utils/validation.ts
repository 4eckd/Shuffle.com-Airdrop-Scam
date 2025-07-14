import { z } from 'zod';
import {
  ContractAddressSchema,
  ContractAnalysisSchema,
  AdvancedContractAnalysisSchema,
  SecurityWarningSchema,
  ContractAddress,
  ContractAnalysis,
  AdvancedContractAnalysis,
  SecurityWarning,
  ValidationError,
  SecurityError,
} from '../types';

/**
 * Validate an Ethereum contract address
 */
export function validateContractAddress(address: string): ContractAddress {
  try {
    return ContractAddressSchema.parse(address);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError(
        `Invalid contract address: ${error.errors[0]?.message || 'Unknown validation error'}`,
        'contractAddress',
        address
      );
    }
    throw error;
  }
}

/**
 * Validate a contract analysis object
 */
export function validateContractAnalysis(analysis: unknown): ContractAnalysis {
  try {
    return ContractAnalysisSchema.parse(analysis);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const validationErrors = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
      throw new ValidationError(
        `Contract analysis validation failed: ${validationErrors.join(', ')}`,
        'contractAnalysis',
        analysis
      );
    }
    throw error;
  }
}

/**
 * Validate an advanced contract analysis object
 */
export function validateAdvancedContractAnalysis(analysis: unknown): AdvancedContractAnalysis {
  try {
    return AdvancedContractAnalysisSchema.parse(analysis);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const validationErrors = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
      throw new ValidationError(
        `Advanced contract analysis validation failed: ${validationErrors.join(', ')}`,
        'advancedContractAnalysis',
        analysis
      );
    }
    throw error;
  }
}

/**
 * Validate a security warning object
 */
export function validateSecurityWarning(warning: unknown): SecurityWarning {
  try {
    return SecurityWarningSchema.parse(warning);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const validationErrors = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
      throw new ValidationError(
        `Security warning validation failed: ${validationErrors.join(', ')}`,
        'securityWarning',
        warning
      );
    }
    throw error;
  }
}

/**
 * Check if a contract address is in the known malicious addresses list
 */
export function isKnownMaliciousAddress(address: ContractAddress): boolean {
  const KNOWN_MALICIOUS_ADDRESSES = [
    '0xacba164135904dc63c5418b57ff87efd341d7c80',
    '0xA995507632B358bA63f8A39616930f8A696bfd8d',
    '0xD66Fd225dbF7fD3c9f00220A455d05EFCCB1CBf0',
    '0x8270500F6a22c5Fc8b78Eecc24dD20dE85838149',
    '0x78EC1a6D4028A88B179247291993c9dCd14bE952',
    '0x54cb07D537d75e0Cf1B1E3870201FA20E8873D8a',
    '0x26A7a3cE145d5c9904C5DD20b47b349DB5f06420',
  ];

  return KNOWN_MALICIOUS_ADDRESSES.includes(address.toLowerCase());
}

/**
 * Generate a security warning for known malicious contracts
 */
export function generateMaliciousContractWarning(address: ContractAddress): SecurityWarning {
  if (!isKnownMaliciousAddress(address)) {
    throw new SecurityError(
      'Cannot generate malicious contract warning for unknown address',
      'high',
      address
    );
  }

  return {
    level: 'critical',
    message: `CRITICAL WARNING: This contract address (${address}) is known to be malicious. Never interact with or send funds to this contract.`,
    contractAddress: address,
    timestamp: new Date(),
    category: 'deceptive-events',
  };
}

/**
 * Sanitize input strings to prevent injection attacks
 */
export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') {
    throw new ValidationError('Input must be a string', 'input', input);
  }

  // Remove potentially dangerous characters and patterns
  return input
    .replace(/[<>'"&]/g, '') // Remove HTML/XML special characters
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .replace(/\x00/g, '') // Remove null bytes
    .trim();
}

/**
 * Validate and sanitize contract name
 */
export function validateContractName(name: string): string {
  const sanitized = sanitizeInput(name);
  
  if (sanitized.length === 0) {
    throw new ValidationError('Contract name cannot be empty after sanitization', 'contractName', name);
  }

  if (sanitized.length > 100) {
    throw new ValidationError('Contract name is too long (max 100 characters)', 'contractName', name);
  }

  return sanitized;
}

/**
 * Check if a URL is safe for documentation purposes
 */
export function isSafeUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url);
    
    // Only allow HTTPS for external URLs
    if (parsedUrl.protocol !== 'https:' && parsedUrl.hostname !== 'localhost') {
      return false;
    }
    
    // Block potentially dangerous protocols
    const blockedProtocols = ['javascript:', 'data:', 'vbscript:', 'file:'];
    if (blockedProtocols.some(protocol => url.toLowerCase().startsWith(protocol))) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Ensure proper error handling for async operations
 */
export async function safeAsync<T>(
  operation: () => Promise<T>,
  errorMessage: string
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (error instanceof ValidationError || error instanceof SecurityError) {
      throw error;
    }
    
    throw new SecurityError(
      `${errorMessage}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'medium'
    );
  }
}
