import { describe, test, expect } from '@jest/globals';
import { detect } from '../../src/analysis/patterns/deceptive-events';
import { 
  LEGITIMATE_ERC20_ABI, 
  DECEPTIVE_EVENTS_ABI,
  EDGE_CASES 
} from '../fixtures/test-data';

describe('Deceptive Events Detector', () => {
  describe('Legitimate contracts', () => {
    test('should not detect patterns in legitimate ERC20', () => {
      const result = detect(LEGITIMATE_ERC20_ABI);
      
      expect(result.detected).toBe(false);
      expect(result.confidence).toBe(0);
      expect(result.category).toBe('deceptive-events');
      expect(result.evidence).toHaveLength(0);
      expect(result.severity).toBe('low');
    });

    test('should handle empty ABI', () => {
      const result = detect(EDGE_CASES.emptyAbi);
      
      expect(result.detected).toBe(false);
      expect(result.confidence).toBe(0);
      expect(result.category).toBe('deceptive-events');
    });
  });

  describe('Malicious contracts', () => {
    test('should detect deceptive events in suspicious ABI', () => {
      const result = detect(DECEPTIVE_EVENTS_ABI);
      
      expect(result.detected).toBe(true);
      expect(result.confidence).toBeGreaterThan(0.3);
      expect(result.category).toBe('deceptive-events');
      expect(result.evidence.length).toBeGreaterThan(0);
      expect(result.severity).not.toBe('low');
    });

    test('should detect view function pretending to be transfer', () => {
      const suspiciousAbi = [
        {
          "type": "function",
          "name": "transfer",
          "inputs": [
            { "name": "to", "type": "address" },
            { "name": "amount", "type": "uint256" }
          ],
          "outputs": [{ "name": "", "type": "bool" }],
          "stateMutability": "view" // Suspicious!
        },
        {
          "type": "event",
          "name": "Transfer",
          "inputs": [
            { "name": "from", "type": "address", "indexed": true },
            { "name": "to", "type": "address", "indexed": true },
            { "name": "value", "type": "uint256", "indexed": false }
          ]
        }
      ];

      const result = detect(suspiciousAbi);
      
      expect(result.detected).toBe(true);
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.evidence).toContain(
        expect.stringContaining("Function 'transfer' modifies state but doesn't emit expected events")
      );
    });

    test('should detect events without corresponding functions', () => {
      const suspiciousAbi = [
        {
          "type": "event",
          "name": "Transfer",
          "inputs": [
            { "name": "from", "type": "address", "indexed": true },
            { "name": "to", "type": "address", "indexed": true },
            { "name": "value", "type": "uint256", "indexed": false }
          ]
        },
        {
          "type": "event",
          "name": "Success",
          "inputs": [{ "name": "result", "type": "bool" }]
        }
        // No corresponding transfer functions
      ];

      const result = detect(suspiciousAbi);
      
      expect(result.detected).toBe(false); // Events without functions are less suspicious
      expect(result.confidence).toBe(0);
    });
  });

  describe('Input validation', () => {
    test('should handle bytecode input gracefully', () => {
      const result = detect('0x608060405234801561001057600080fd5b50');
      
      expect(result.detected).toBe(false);
      expect(result.confidence).toBe(0);
      expect(result.description).toContain('requires ABI, not bytecode');
      expect(result.metadata?.reason).toBe('bytecode_not_supported');
    });

    test('should handle invalid JSON', () => {
      const result = detect('invalid json');
      
      expect(result.detected).toBe(false);
      expect(result.confidence).toBe(0);
      expect(result.description).toContain('requires ABI, not bytecode');
    });

    test('should handle ABI as JSON string', () => {
      const abiString = JSON.stringify(LEGITIMATE_ERC20_ABI);
      const result = detect(abiString);
      
      expect(result.detected).toBe(false);
      expect(result.confidence).toBe(0);
      expect(result.category).toBe('deceptive-events');
    });
  });

  describe('Confidence scoring', () => {
    test('should increase confidence with multiple suspicious patterns', () => {
      const multipleIssuesAbi = [
        {
          "type": "function",
          "name": "transfer",
          "inputs": [
            { "name": "to", "type": "address" },
            { "name": "amount", "type": "uint256" }
          ],
          "outputs": [{ "name": "", "type": "bool" }],
          "stateMutability": "view"
        },
        {
          "type": "function",
          "name": "approve",
          "inputs": [
            { "name": "spender", "type": "address" },
            { "name": "amount", "type": "uint256" }
          ],
          "outputs": [{ "name": "", "type": "bool" }],
          "stateMutability": "view"
        },
        {
          "type": "event",
          "name": "Transfer",
          "inputs": [
            { "name": "from", "type": "address", "indexed": true },
            { "name": "to", "type": "address", "indexed": true },
            { "name": "value", "type": "uint256", "indexed": false }
          ]
        }
      ];

      const result = detect(multipleIssuesAbi);
      
      expect(result.confidence).toBeGreaterThan(0.5);
      expect(result.severity).not.toBe('low');
    });
  });

  describe('Metadata validation', () => {
    test('should include comprehensive metadata', () => {
      const result = detect(DECEPTIVE_EVENTS_ABI);
      
      expect(result.metadata).toBeDefined();
      expect(result.metadata).toHaveProperty('eventsAnalyzed');
      expect(result.metadata).toHaveProperty('functionsAnalyzed');
      expect(result.metadata).toHaveProperty('suspiciousEvents');
      expect(result.metadata).toHaveProperty('suspiciousFunctions');
      
      expect(typeof result.metadata?.eventsAnalyzed).toBe('number');
      expect(typeof result.metadata?.functionsAnalyzed).toBe('number');
    });
  });

  describe('Edge cases', () => {
    test('should handle malformed ABI entries', () => {
      const malformedAbi = [
        {
          "type": "function",
          // Missing name and other fields
        },
        {
          "type": "event",
          "name": "Transfer"
          // Missing inputs
        }
      ];

      expect(() => {
        const result = detect(malformedAbi);
        // Should not throw, but may have limited analysis
        expect(result.category).toBe('deceptive-events');
      }).not.toThrow();
    });

    test('should handle mixed case function names', () => {
      const mixedCaseAbi = [
        {
          "type": "function",
          "name": "TRANSFER",
          "inputs": [
            { "name": "to", "type": "address" },
            { "name": "amount", "type": "uint256" }
          ],
          "outputs": [{ "name": "", "type": "bool" }],
          "stateMutability": "view"
        },
        {
          "type": "event",
          "name": "transfer",
          "inputs": [
            { "name": "from", "type": "address", "indexed": true },
            { "name": "to", "type": "address", "indexed": true },
            { "name": "value", "type": "uint256", "indexed": false }
          ]
        }
      ];

      const result = detect(mixedCaseAbi);
      
      expect(result.category).toBe('deceptive-events');
      // Should handle case-insensitive matching
    });
  });
});
