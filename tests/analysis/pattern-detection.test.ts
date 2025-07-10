import { jest } from '@jest/globals';
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
  DECEPTIVE_EVENTS_ABI,
  FAKE_BALANCE_ABI,
  NON_FUNCTIONAL_TRANSFER_ABI,
  HIDDEN_REDIRECTION_BYTECODE
} from '../fixtures/test-data';
import { ScamCategory } from '../../src/types';

// Mock ethers to avoid network calls
jest.mock('ethers', () => ({
  ethers: {
    JsonRpcProvider: jest.fn().mockImplementation(() => ({
      getCode: jest.fn().mockResolvedValue('0x608060405234801561001057600080fd5b50'),
      getBalance: jest.fn().mockResolvedValue('1000000000000000000'),
      getTransaction: jest.fn().mockResolvedValue({
        hash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        blockNumber: 123456,
        from: '0x1234567890abcdef1234567890abcdef12345678',
        to: '0xabcdef1234567890abcdef1234567890abcdef12'
      }),
      call: jest.fn().mockResolvedValue('0x0000000000000000000000000000000000000000000000000de0b6b3a7640000')
    })),
    Contract: jest.fn().mockImplementation(() => ({
      connect: jest.fn().mockReturnThis(),
      balanceOf: jest.fn().mockResolvedValue('1000000000000000000'),
      transfer: jest.fn().mockResolvedValue({
        wait: jest.fn().mockResolvedValue({
          status: 1,
          events: [{ event: 'Transfer', args: {} }]
        })
      })
    })),
    utils: {
      isAddress: jest.fn().mockImplementation((_address: unknown) => 
        /^0x[a-fA-F0-9]{40}$/.test(_address as string)
      ),
      getAddress: jest.fn().mockImplementation((_address: unknown) => (_address as string).toLowerCase())
    }
  }
}));

describe('Pattern Detection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('detectPattern', () => {
    it('should detect deceptive events pattern', () => {
      const result = detectPattern('deceptive-events', DECEPTIVE_EVENTS_ABI);
      
      expect(result).toBeDefined();
      expect(result.detected).toBe(true);
      expect(result.category).toBe('deceptive-events');
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.severity).toBe('high');
      expect(result.evidence).toHaveLength(1);
      expect(result.evidence[0]).toContain('fakeTransfer');
    });

    it('should detect fake balance pattern', () => {
      const result = detectPattern('fake-balance', FAKE_BALANCE_ABI);
      
      expect(result).toBeDefined();
      expect(result.detected).toBe(true);
      expect(result.category).toBe('fake-balance');
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.severity).toBe('high');
      expect(result.evidence.length).toBeGreaterThan(0);
    });

    it('should detect non-functional transfer pattern', () => {
      const result = detectPattern('non-functional-transfer', NON_FUNCTIONAL_TRANSFER_ABI);
      
      expect(result).toBeDefined();
      expect(result.detected).toBe(true);
      expect(result.category).toBe('non-functional-transfer');
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.severity).toBe('critical');
      expect(result.evidence.length).toBeGreaterThan(0);
    });

    it('should detect hidden redirection pattern', () => {
      const result = detectPattern('hidden-redirection', HIDDEN_REDIRECTION_BYTECODE);
      
      expect(result).toBeDefined();
      expect(result.detected).toBe(true);
      expect(result.category).toBe('hidden-redirection');
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.severity).toBe('critical');
      expect(result.evidence.length).toBeGreaterThan(0);
    });

    it('should not detect patterns in legitimate contracts', () => {
      const result = detectPattern('deceptive-events', LEGITIMATE_ERC20_ABI);
      
      expect(result).toBeDefined();
      expect(result.detected).toBe(false);
      expect(result.category).toBe('deceptive-events');
      expect(result.confidence).toBe(0);
      expect(result.evidence).toHaveLength(0);
    });

    it('should handle invalid pattern categories', () => {
      expect(() => {
        detectPattern('invalid-pattern' as ScamCategory, LEGITIMATE_ERC20_ABI);
      }).toThrow('Unknown pattern category: invalid-pattern');
    });

    it('should handle malformed input gracefully', () => {
      const result = detectPattern('deceptive-events', EDGE_CASES.malformedAbi);
      
      expect(result).toBeDefined();
      expect(result.detected).toBe(false);
      expect(result.confidence).toBe(0);
    });

    it('should return error result for invalid JSON input', () => {
      const result = detectPattern('deceptive-events', EDGE_CASES.invalidJson);
      
      expect(result).toBeDefined();
      expect(result.detected).toBe(false);
      expect(result.confidence).toBe(0);
      expect(result.metadata?.error).toBeDefined();
    });

    it('should validate pattern results against schema', () => {
      const result = detectPattern('deceptive-events', DECEPTIVE_EVENTS_ABI);
      
      expect(typeof result.detected).toBe('boolean');
      expect(typeof result.confidence).toBe('number');
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
      expect(['deceptive-events', 'hidden-redirection', 'fake-balance', 'non-functional-transfer'])
        .toContain(result.category);
      expect(typeof result.description).toBe('string');
      expect(Array.isArray(result.evidence)).toBe(true);
      expect(['low', 'medium', 'high', 'critical']).toContain(result.severity);
    });
  });

  describe('detectAllPatterns', () => {
    it('should detect all patterns in complex malicious contract', () => {
      const result = detectAllPatterns(TEST_CASES.complexMalicious.abi);
      
      expect(result).toBeDefined();
      expect(result.overallDetected).toBe(true);
      expect(result.overallConfidence).toBeGreaterThan(0);
      expect(result.overallSeverity).toBe('critical');
      expect(result.overallRiskScore).toBeGreaterThan(50);
      expect(result.detectedPatterns.length).toBeGreaterThan(0);
      expect(result.patternResults).toBeDefined();
      expect(Object.keys(result.patternResults)).toHaveLength(4);
    });

    it('should not detect patterns in legitimate contracts', () => {
      const result = detectAllPatterns(LEGITIMATE_ERC20_ABI);
      
      expect(result).toBeDefined();
      expect(result.overallDetected).toBe(false);
      expect(result.overallConfidence).toBe(0);
      expect(result.overallSeverity).toBe('low');
      expect(result.overallRiskScore).toBe(0);
      expect(result.detectedPatterns).toHaveLength(0);
    });

    it('should handle includePatterns option', () => {
      const result = detectAllPatterns(DECEPTIVE_EVENTS_ABI, {
        includePatterns: ['deceptive-events']
      });
      
      expect(result).toBeDefined();
      expect(Object.keys(result.patternResults)).toHaveLength(1);
      expect(result.patternResults['deceptive-events']).toBeDefined();
    });

    it('should handle excludePatterns option', () => {
      const result = detectAllPatterns(DECEPTIVE_EVENTS_ABI, {
        excludePatterns: ['hidden-redirection', 'fake-balance']
      });
      
      expect(result).toBeDefined();
      expect(Object.keys(result.patternResults)).toHaveLength(2);
      expect(result.patternResults['deceptive-events']).toBeDefined();
      expect(result.patternResults['non-functional-transfer']).toBeDefined();
    });

    it('should calculate overall risk score correctly', () => {
      const result = detectAllPatterns(TEST_CASES.complexMalicious.abi);
      
      expect(result.overallRiskScore).toBeGreaterThan(0);
      expect(result.overallRiskScore).toBeLessThanOrEqual(100);
      
      // Risk score should increase with multiple patterns
      const singlePatternResult = detectAllPatterns(DECEPTIVE_EVENTS_ABI);
      expect(result.overallRiskScore).toBeGreaterThan(singlePatternResult.overallRiskScore);
    });

    it('should generate appropriate summary text', () => {
      const legitimateResult = detectAllPatterns(LEGITIMATE_ERC20_ABI);
      expect(legitimateResult.summary).toContain('No scam patterns detected');
      
      const maliciousResult = detectAllPatterns(DECEPTIVE_EVENTS_ABI);
      expect(maliciousResult.summary).toContain('Detected');
      expect(maliciousResult.summary).toContain('pattern');
    });

    it('should include metadata with correct information', () => {
      const result = detectAllPatterns(DECEPTIVE_EVENTS_ABI);
      
      expect(result.metadata).toBeDefined();
      expect(result.metadata.analysisDate).toBeInstanceOf(Date);
      expect(result.metadata.totalPatternsAnalyzed).toBe(4);
      expect(result.metadata.totalPatternsDetected).toBeGreaterThan(0);
      expect(['abi', 'bytecode', 'mixed']).toContain(result.metadata.inputType);
      expect(typeof result.metadata.processingTime).toBe('number');
    });

    it('should handle empty input gracefully', () => {
      const result = detectAllPatterns(EDGE_CASES.emptyAbi);
      
      expect(result).toBeDefined();
      expect(result.overallDetected).toBe(false);
      expect(result.overallConfidence).toBe(0);
      expect(result.detectedPatterns).toHaveLength(0);
    });

    it('should validate comprehensive analysis result schema', () => {
      const result = detectAllPatterns(DECEPTIVE_EVENTS_ABI);
      
      expect(typeof result.overallDetected).toBe('boolean');
      expect(typeof result.overallConfidence).toBe('number');
      expect(result.overallConfidence).toBeGreaterThanOrEqual(0);
      expect(result.overallConfidence).toBeLessThanOrEqual(1);
      expect(['low', 'medium', 'high', 'critical']).toContain(result.overallSeverity);
      expect(typeof result.overallRiskScore).toBe('number');
      expect(result.overallRiskScore).toBeGreaterThanOrEqual(0);
      expect(result.overallRiskScore).toBeLessThanOrEqual(100);
      expect(typeof result.summary).toBe('string');
      expect(Array.isArray(result.detectedPatterns)).toBe(true);
      expect(typeof result.patternResults).toBe('object');
      expect(typeof result.metadata).toBe('object');
    });
  });

  describe('validateInput', () => {
    it('should validate legitimate ABI input', () => {
      const result = validateInput(LEGITIMATE_ERC20_ABI);
      
      expect(result.isValid).toBe(true);
      expect(result.type).toBe('abi');
      expect(result.errors).toHaveLength(0);
    });

    it('should validate legitimate bytecode input', () => {
      const result = validateInput(HIDDEN_REDIRECTION_BYTECODE);
      
      expect(result.isValid).toBe(true);
      expect(result.type).toBe('bytecode');
      expect(result.errors).toHaveLength(0);
    });

    it('should validate JSON string ABI input', () => {
      const abiString = JSON.stringify(LEGITIMATE_ERC20_ABI);
      const result = validateInput(abiString);
      
      expect(result.isValid).toBe(true);
      expect(result.type).toBe('abi');
      expect(result.errors).toHaveLength(0);
    });

    it('should reject empty input', () => {
      const result = validateInput('');
      
      expect(result.isValid).toBe(false);
      expect(result.type).toBe('unknown');
      expect(result.errors).toContain('Input string is empty');
    });

    it('should reject invalid bytecode format', () => {
      const result = validateInput(EDGE_CASES.invalidBytecode);
      
      expect(result.isValid).toBe(false);
      expect(result.type).toBe('bytecode');
      expect(result.errors).toContain('Invalid bytecode format - must start with 0x and contain only hex characters');
    });

    it('should reject invalid JSON input', () => {
      const result = validateInput(EDGE_CASES.invalidJson);
      
      expect(result.isValid).toBe(false);
      expect(result.type).toBe('bytecode');
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should reject non-array ABI', () => {
      const result = validateInput('{"not": "an array"}');
      
      expect(result.isValid).toBe(false);
      expect(result.type).toBe('abi');
      expect(result.errors).toContain('ABI must be an array');
    });

    it('should reject non-array object ABI', () => {
      const result = validateInput({ not: 'an array' } as any);
      
      expect(result.isValid).toBe(false);
      expect(result.type).toBe('abi');
      expect(result.errors).toContain('ABI must be an array');
    });
  });

  describe('getAvailablePatterns', () => {
    it('should return all available pattern categories', () => {
      const patterns = getAvailablePatterns();
      
      expect(patterns).toHaveLength(4);
      expect(patterns).toContain('deceptive-events');
      expect(patterns).toContain('hidden-redirection');
      expect(patterns).toContain('fake-balance');
      expect(patterns).toContain('non-functional-transfer');
    });

    it('should return array of valid ScamCategory types', () => {
      const patterns = getAvailablePatterns();
      
      patterns.forEach(pattern => {
        expect(['deceptive-events', 'hidden-redirection', 'fake-balance', 'non-functional-transfer'])
          .toContain(pattern);
      });
    });
  });

  describe('getDetectorInfo', () => {
    it('should return detector information', () => {
      const info = getDetectorInfo();
      
      expect(info).toBeDefined();
      expect(info.version).toBe('1.0.0');
      expect(info.patterns).toBeDefined();
      expect(Object.keys(info.patterns)).toHaveLength(4);
    });

    it('should include pattern details', () => {
      const info = getDetectorInfo();
      
      Object.entries(info.patterns).forEach(([_patternId, pattern]) => {
        expect(pattern.name).toBeDefined();
        expect(pattern.description).toBeDefined();
        expect(['abi', 'bytecode']).toContain(pattern.inputType);
        expect(['low', 'medium', 'high', 'critical']).toContain(pattern.severity);
      });
    });

    it('should provide correct input types for patterns', () => {
      const info = getDetectorInfo();
      
      expect(info.patterns['deceptive-events'].inputType).toBe('abi');
      expect(info.patterns['fake-balance'].inputType).toBe('abi');
      expect(info.patterns['non-functional-transfer'].inputType).toBe('abi');
      expect(info.patterns['hidden-redirection'].inputType).toBe('bytecode');
    });

    it('should provide correct severity levels', () => {
      const info = getDetectorInfo();
      
      expect(info.patterns['deceptive-events'].severity).toBe('high');
      expect(info.patterns['fake-balance'].severity).toBe('high');
      expect(info.patterns['non-functional-transfer'].severity).toBe('critical');
      expect(info.patterns['hidden-redirection'].severity).toBe('critical');
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle concurrent pattern detection', () => {
      const promises = Array(10).fill(null).map(() => 
        detectAllPatterns(DECEPTIVE_EVENTS_ABI)
      );
      
      return Promise.all(promises).then(results => {
        results.forEach(result => {
          expect(result).toBeDefined();
          expect(result.overallDetected).toBe(true);
        });
      });
    });

    it('should handle very large input gracefully', () => {
      const largeABI = Array(1000).fill(LEGITIMATE_ERC20_ABI[0]);
      const result = detectAllPatterns(largeABI);
      
      expect(result).toBeDefined();
      expect(result.metadata.processingTime).toBeDefined();
    });

    it('should maintain consistent results across multiple runs', () => {
      const results = Array(5).fill(null).map(() => 
        detectAllPatterns(DECEPTIVE_EVENTS_ABI)
      );
      
      const firstResult = results[0];
      results.forEach(result => {
        expect(result.overallDetected).toBe(firstResult.overallDetected);
        expect(result.overallConfidence).toBe(firstResult.overallConfidence);
        expect(result.overallSeverity).toBe(firstResult.overallSeverity);
        expect(result.detectedPatterns).toEqual(firstResult.detectedPatterns);
      });
    });

    it('should handle mixed ABI and bytecode analysis', () => {
      const result = detectAllPatterns(LEGITIMATE_ERC20_ABI);
      
      expect(result.metadata.inputType).toBe('abi');
      
      const bytecodeResult = detectAllPatterns(HIDDEN_REDIRECTION_BYTECODE);
      
      expect(bytecodeResult.metadata.inputType).toBe('bytecode');
    });

    it('should generate appropriate confidence scores', () => {
      const results = [
        detectAllPatterns(LEGITIMATE_ERC20_ABI),
        detectAllPatterns(DECEPTIVE_EVENTS_ABI),
        detectAllPatterns(TEST_CASES.complexMalicious.abi)
      ];
      
      // Confidence should increase with more detected patterns
      expect(results[0].overallConfidence).toBeLessThan(results[1].overallConfidence);
      expect(results[1].overallConfidence).toBeLessThanOrEqual(results[2].overallConfidence);
    });

    it('should handle performance under load', () => {
      const startTime = Date.now();
      const promises = Array(50).fill(null).map(() => 
        detectAllPatterns(DECEPTIVE_EVENTS_ABI)
      );
      
      return Promise.all(promises).then(results => {
        const endTime = Date.now();
        const totalTime = endTime - startTime;
        
        expect(totalTime).toBeLessThan(10000); // Should complete in under 10 seconds
        expect(results).toHaveLength(50);
        results.forEach(result => {
          expect(result).toBeDefined();
          expect(result.overallDetected).toBe(true);
        });
      });
    });
  });
});
