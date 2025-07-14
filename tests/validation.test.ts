import { validateContractAddress, isKnownMaliciousAddress, generateMaliciousContractWarning } from '../src/utils/validation';

// Test data
const TEST_CONTRACT_ADDRESSES = {
  VALID_MALICIOUS: '0xacba164135904dc63c5418b57ff87efd341d7c80',
  VALID_UNKNOWN: '0x1234567890abcdef1234567890abcdef12345678',
  INVALID_SHORT: '0x123',
  INVALID_LONG: '0x1234567890abcdef1234567890abcdef123456789',
  INVALID_NO_PREFIX: '1234567890abcdef1234567890abcdef12345678',
  INVALID_BAD_CHARS: '0x1234567890abcdef1234567890abcdef1234567g',
};

describe('Security Utilities', () => {
  describe('Contract Address Validation', () => {
    it('validates a correct contract address', () => {
      const address = TEST_CONTRACT_ADDRESSES.VALID_MALICIOUS;
      expect(() => validateContractAddress(address)).not.toThrow();
      const result = validateContractAddress(address);
      expect(result).toBe(address);
    });

    it('throws an error on invalid contract address format', () => {
      const invalidAddresses = [
        TEST_CONTRACT_ADDRESSES.INVALID_SHORT,
        TEST_CONTRACT_ADDRESSES.INVALID_LONG,
        TEST_CONTRACT_ADDRESSES.INVALID_NO_PREFIX,
        TEST_CONTRACT_ADDRESSES.INVALID_BAD_CHARS,
      ];
      
      invalidAddresses.forEach(address => {
        expect(() => validateContractAddress(address)).toThrow();
      });
    });
  });

  describe('Known Malicious Address Check', () => {
    it('detects known malicious address', () => {
      const address = TEST_CONTRACT_ADDRESSES.VALID_MALICIOUS;
      expect(isKnownMaliciousAddress(address)).toBe(true);
    });

    it('does not falsely flag unknown address as malicious', () => {
      const address = TEST_CONTRACT_ADDRESSES.VALID_UNKNOWN;
      expect(isKnownMaliciousAddress(address)).toBe(false);
    });
  });

  describe('Generate Malicious Contract Warning', () => {
    it('generates a critical warning for known malicious contract', () => {
      const address = TEST_CONTRACT_ADDRESSES.VALID_MALICIOUS;
      const warning = generateMaliciousContractWarning(address);

      expect(warning.level).toBe('critical');
      expect(warning.message).toContain('CRITICAL WARNING');
      expect(warning.contractAddress).toBe(address);
    });

    it('throws an error when attempting warning generation for unknown contract', () => {
      const address = TEST_CONTRACT_ADDRESSES.VALID_UNKNOWN;

      expect(() => generateMaliciousContractWarning(address)).toThrow();
    });
  });
});
