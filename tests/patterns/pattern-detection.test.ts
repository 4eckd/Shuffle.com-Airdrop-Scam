import { describe, test, expect } from '@jest/globals';
import { 
  detectPattern, 
  detectAllPatterns,
  validateInput,
  getAvailablePatterns,
  getDetectorInfo 
} from '../../src/analysis/patternDetection';
import { 
  TEST_CASES,
  EDGE_CASES,
  LEGITIMATE_ERC20_ABI,
  LEGITIMATE_BYTECODE 
} from '../fixtures/test-data';

describe('Pattern Detection Aggregator', () => {
  describe('Individual pattern detection', () => {
    test('should detect deceptive events pattern', () => {
      const result = detectPattern('deceptive-events', TEST_CASES.deceptiveEvents.abi);
      
      expect(result.category).toBe('deceptive-events');
      expect(result.detected).toBe(true);
      expect(result.confidence).toBeGreaterThan(0);
    });

    test('should detect hidden redirection pattern', () => {
      const result = detectPattern('hidden-redirection', TEST_CASES.hiddenRedirection.bytecode);
      
      expect(result.category).toBe('hidden-redirection');
      expect(result.detected).toBe(true);
      expect(result.confidence).toBeGreaterThan(0);
    });

    test('should detect fake balance pattern', () => {
      const result = detectPattern('fake-balance', TEST_CASES.fakeBalance.abi);
      
      expect(result.category).toBe('fake-balance');
      expect(result.detected).toBe(true);
      expect(result.confidence).toBeGreaterThan(0);
    });

    test('should detect non-functional transfer pattern', () => {
      const result = detectPattern('non-functional-transfer', TEST_CASES.nonFunctionalTransfer.abi);
      
      expect(result.category).toBe('non-functional-transfer');
      expect(result.detected).toBe(true);
      expect(result.confidence).toBeGreaterThan(0);
    });

    test('should handle unknown pattern category', () => {
      expect(() => {
        detectPattern('unknown-pattern' as any, LEGITIMATE_ERC20_ABI);
      }).toThrow('Unknown pattern category');
    });

    test('should handle detector errors gracefully', () => {
      // Test with malformed input that might cause detector to throw
      const result = detectPattern('deceptive-events', 'malformed input');
      
      expect(result.detected).toBe(false);
      expect(result.confidence).toBe(0);
      expect(result.category).toBe('deceptive-events');
      expect(result.description).toContain('analysis requires ABI');
    });
  });

  describe('Comprehensive analysis', () => {
    test('should analyze legitimate contract with no detections', () => {
      const result = detectAllPatterns(LEGITIMATE_ERC20_ABI);
      
      expect(result.overallDetected).toBe(false);
      expect(result.overallConfidence).toBe(0);
      expect(result.overallSeverity).toBe('low');
      expect(result.overallRiskScore).toBe(0);
      expect(result.detectedPatterns).toHaveLength(0);
      expect(result.summary).toContain('No scam patterns detected');
    });

    test('should analyze malicious contract with multiple detections', () => {
      const result = detectAllPatterns(TEST_CASES.complexMalicious.abi);
      
      expect(result.overallDetected).toBe(true);
      expect(result.overallConfidence).toBeGreaterThan(0);
      expect(result.overallSeverity).not.toBe('low');
      expect(result.overallRiskScore).toBeGreaterThan(0);
      expect(result.detectedPatterns.length).toBeGreaterThan(0);
      expect(result.summary).toContain('scam');
    });

    test('should handle selective pattern analysis', () => {
      const result = detectAllPatterns(TEST_CASES.deceptiveEvents.abi, {
        includePatterns: ['deceptive-events', 'fake-balance']
      });
      
      expect(Object.keys(result.patternResults)).toHaveLength(2);
      expect(result.patternResults).toHaveProperty('deceptive-events');
      expect(result.patternResults).toHaveProperty('fake-balance');
      expect(result.metadata.totalPatternsAnalyzed).toBe(2);
    });

    test('should handle pattern exclusion', () => {
      const result = detectAllPatterns(LEGITIMATE_ERC20_ABI, {
        excludePatterns: ['hidden-redirection']
      });
      
      expect(Object.keys(result.patternResults)).toHaveLength(3);
      expect(result.patternResults).not.toHaveProperty('hidden-redirection');
      expect(result.metadata.totalPatternsAnalyzed).toBe(3);
    });

    test('should calculate correct risk scores', () => {
      const legitimateResult = detectAllPatterns(LEGITIMATE_ERC20_ABI);
      const maliciousResult = detectAllPatterns(TEST_CASES.complexMalicious.abi);
      
      expect(legitimateResult.overallRiskScore).toBe(0);
      expect(maliciousResult.overallRiskScore).toBeGreaterThan(legitimateResult.overallRiskScore);
      expect(maliciousResult.overallRiskScore).toBeLessThanOrEqual(100);
    });

    test('should boost confidence for multiple patterns', () => {
      const multiplePatternResult = detectAllPatterns(TEST_CASES.complexMalicious.abi);
      
      // Multiple patterns should generally increase confidence
      expect(multiplePatternResult.overallConfidence).toBeGreaterThanOrEqual(0.5);
      
      // Should have multiple patterns detected
      expect(multiplePatternResult.detectedPatterns.length).toBeGreaterThan(1);
    });
  });

  describe('Input validation', () => {
    test('should validate legitimate ABI', () => {
      const validation = validateInput(LEGITIMATE_ERC20_ABI);
      
      expect(validation.isValid).toBe(true);
      expect(validation.type).toBe('abi');
      expect(validation.errors).toHaveLength(0);
    });

    test('should validate legitimate bytecode', () => {
      const validation = validateInput(LEGITIMATE_BYTECODE);
      
      expect(validation.isValid).toBe(true);
      expect(validation.type).toBe('bytecode');
      expect(validation.errors).toHaveLength(0);
    });

    test('should validate ABI as JSON string', () => {
      const abiString = JSON.stringify(LEGITIMATE_ERC20_ABI);
      const validation = validateInput(abiString);
      
      expect(validation.isValid).toBe(true);
      expect(validation.type).toBe('abi');
      expect(validation.errors).toHaveLength(0);
    });

    test('should reject empty input', () => {
      const validation = validateInput('');
      
      expect(validation.isValid).toBe(false);
      expect(validation.type).toBe('unknown');
      expect(validation.errors).toContain('Input string is empty');
    });

    test('should reject invalid bytecode', () => {
      const validation = validateInput('invalid bytecode');
      
      expect(validation.isValid).toBe(false);
      expect(validation.type).toBe('bytecode');
      expect(validation.errors.some(error => error.includes('Invalid bytecode format'))).toBe(true);
    });

    test('should reject non-array ABI', () => {
      const validation = validateInput('{"not": "an array"}');
      
      expect(validation.isValid).toBe(false);
      expect(validation.type).toBe('abi');
      expect(validation.errors).toContain('ABI must be an array');
    });

    test('should reject non-array ABI object', () => {
      const validation = validateInput({ not: 'an array' } as any);
      
      expect(validation.isValid).toBe(false);
      expect(validation.type).toBe('abi');
      expect(validation.errors).toContain('ABI must be an array');
    });
  });

  describe('Utility functions', () => {
    test('should return available patterns', () => {
      const patterns = getAvailablePatterns();
      
      expect(patterns).toContain('deceptive-events');
      expect(patterns).toContain('hidden-redirection');
      expect(patterns).toContain('fake-balance');
      expect(patterns).toContain('non-functional-transfer');
      expect(patterns).toHaveLength(4);
    });

    test('should return detector information', () => {
      const info = getDetectorInfo();
      
      expect(info).toHaveProperty('version');
      expect(info).toHaveProperty('patterns');
      expect(info.patterns).toHaveProperty('deceptive-events');
      expect(info.patterns).toHaveProperty('hidden-redirection');
      expect(info.patterns).toHaveProperty('fake-balance');
      expect(info.patterns).toHaveProperty('non-functional-transfer');
      
      // Check pattern info structure
      const deceptiveEventsInfo = info.patterns['deceptive-events'];
      expect(deceptiveEventsInfo).toHaveProperty('name');
      expect(deceptiveEventsInfo).toHaveProperty('description');
      expect(deceptiveEventsInfo).toHaveProperty('inputType');
      expect(deceptiveEventsInfo).toHaveProperty('severity');
    });
  });

  describe('Metadata validation', () => {
    test('should include comprehensive metadata in results', () => {
      const result = detectAllPatterns(LEGITIMATE_ERC20_ABI);
      
      expect(result.metadata).toBeDefined();
      expect(result.metadata).toHaveProperty('analysisDate');
      expect(result.metadata).toHaveProperty('totalPatternsAnalyzed');
      expect(result.metadata).toHaveProperty('totalPatternsDetected');
      expect(result.metadata).toHaveProperty('inputType');
      expect(result.metadata).toHaveProperty('processingTime');
      
      expect(result.metadata.analysisDate).toBeInstanceOf(Date);
      expect(typeof result.metadata.totalPatternsAnalyzed).toBe('number');
      expect(typeof result.metadata.totalPatternsDetected).toBe('number');
      expect(['abi', 'bytecode', 'mixed']).toContain(result.metadata.inputType);
    });

    test('should track processing time', () => {
      const result = detectAllPatterns(LEGITIMATE_ERC20_ABI);
      
      expect(result.metadata.processingTime).toBeDefined();
      expect(typeof result.metadata.processingTime).toBe('number');
      expect(result.metadata.processingTime).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Summary generation', () => {
    test('should generate appropriate summary for no detections', () => {
      const result = detectAllPatterns(LEGITIMATE_ERC20_ABI);
      
      expect(result.summary).toContain('No scam patterns detected');
      expect(result.summary).toContain('4 categories');
    });

    test('should generate appropriate summary for single detection', () => {
      const result = detectAllPatterns(TEST_CASES.deceptiveEvents.abi, {
        includePatterns: ['deceptive-events']
      });
      
      if (result.overallDetected) {
        expect(result.summary).toContain('deceptive event emissions');
        expect(result.summary).toContain('may be a scam');
      }
    });

    test('should generate appropriate summary for multiple detections', () => {
      const result = detectAllPatterns(TEST_CASES.complexMalicious.abi);
      
      if (result.detectedPatterns.length > 1) {
        expect(result.summary).toContain('likely to be a scam');
      }
      
      if (result.detectedPatterns.length > 2) {
        expect(result.summary).toContain('highly likely to be a scam');
      }
    });
  });

  describe('Edge cases and error handling', () => {
    test('should handle empty ABI gracefully', () => {
      const result = detectAllPatterns(EDGE_CASES.emptyAbi);
      
      expect(result.overallDetected).toBe(false);
      expect(result.overallConfidence).toBe(0);
      expect(result.patternResults).toBeDefined();
    });

    test('should handle empty bytecode gracefully', () => {
      const result = detectAllPatterns(EDGE_CASES.emptyBytecode);
      
      expect(result.overallDetected).toBe(false);
      expect(result.overallConfidence).toBe(0);
      expect(result.patternResults).toBeDefined();
    });

    test('should handle malformed input gracefully', () => {
      const result = detectAllPatterns(EDGE_CASES.invalidJson);
      
      expect(result.overallDetected).toBe(false);
      expect(result.patternResults).toBeDefined();
      // Should not throw errors
    });
  });
});
