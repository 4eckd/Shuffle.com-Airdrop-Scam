// Jest test setup file

// Mock environment variables for testing
process.env.NODE_ENV = 'test';
process.env.APP_NAME = 'shuffle-airdrop-scam-analysis-test';
process.env.APP_VERSION = '1.1.0-alpha';
process.env.LOG_LEVEL = 'error'; // Reduce log noise in tests
process.env.ENABLE_SECURITY_WARNINGS = 'true';
process.env.REQUIRE_EXPLICIT_CONSENT = 'false'; // Easier testing
process.env.ANALYSIS_OUTPUT_DIR = './test-output';
process.env.TEST_TIMEOUT = '10000';
process.env.COVERAGE_THRESHOLD = '80';

// Global test utilities
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeValidContractAddress(): R;
      toBeSecurityError(): R;
      toBeValidationError(): R;
    }
  }
}

// Custom Jest matchers
expect.extend({
  toBeValidContractAddress(received: string) {
    const addressRegex = /^0x[a-fA-F0-9]{40}$/;
    const pass = addressRegex.test(received);
    
    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid contract address`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid contract address (0x followed by 40 hex characters)`,
        pass: false,
      };
    }
  },

  toBeSecurityError(received: Error) {
    const pass = received.name === 'SecurityError';
    
    if (pass) {
      return {
        message: () => `expected ${received.name} not to be a SecurityError`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received.name} to be a SecurityError`,
        pass: false,
      };
    }
  },

  toBeValidationError(received: Error) {
    const pass = received.name === 'ValidationError';
    
    if (pass) {
      return {
        message: () => `expected ${received.name} not to be a ValidationError`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received.name} to be a ValidationError`,
        pass: false,
      };
    }
  },
});

// Suppress console output during tests unless explicitly needed
const originalConsole = console;
global.console = {
  ...originalConsole,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
};

// Test data fixtures
export const TEST_CONTRACT_ADDRESSES = {
  VALID_MALICIOUS: '0xacba164135904dc63c5418b57ff87efd341d7c80',
  VALID_UNKNOWN: '0x1234567890abcdef1234567890abcdef12345678',
  INVALID_SHORT: '0x123',
  INVALID_LONG: '0x1234567890abcdef1234567890abcdef123456789',
  INVALID_NO_PREFIX: '1234567890abcdef1234567890abcdef12345678',
  INVALID_BAD_CHARS: '0x1234567890abcdef1234567890abcdef1234567g',
};

export const TEST_DATES = {
  PAST: new Date('2023-01-01'),
  NOW: new Date(),
  FUTURE: new Date('2025-12-31'),
};
