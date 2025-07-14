import { ScamAnalysisTool } from '../src/index';

describe('ScamAnalysisTool Advanced Analysis', () => {
  let tool: ScamAnalysisTool;

  beforeEach(() => {
    tool = new ScamAnalysisTool();
  });

  describe('analyzeContractAdvanced', () => {
    test('should perform advanced analysis on a known malicious address', async () => {
      const maliciousAddress = '0xacba164135904dc63c5418b57ff87efd341d7c80';
      
      const result = await tool.analyzeContractAdvanced(maliciousAddress);
      
      expect(result).toBeDefined();
      expect(result.contractAddress).toBe(maliciousAddress);
      expect(result.analysisStatus).toBe('complete');
      expect(result.riskLevel).toBe('critical');
      expect(result.securityWarnings).toBeDefined();
      expect(result.securityWarnings?.length).toBeGreaterThan(0);
      
      // Should include known malicious warning
      const hasMaliciousWarning = result.securityWarnings?.some(
        warning => warning.message.includes('known to be malicious')
      );
      expect(hasMaliciousWarning).toBe(true);
    }, 10000); // 10 second timeout for network calls

    test('should handle invalid address gracefully', async () => {
      const invalidAddress = 'invalid-address';
      
      const result = await tool.analyzeContractAdvanced(invalidAddress);
      
      expect(result).toBeDefined();
      expect(result.analysisStatus).toBe('failed');
      expect(result.vulnerabilities).toContain('Invalid contract address: Invalid Ethereum address format');
      expect(result.securityWarnings).toBeDefined();
      expect(result.securityWarnings?.length).toBeGreaterThan(0);
    });

    test('should include comprehensive metadata', async () => {
      const testAddress = '0x1234567890123456789012345678901234567890';
      
      const result = await tool.analyzeContractAdvanced(testAddress);
      
      expect(result.metadata).toBeDefined();
      expect(result.metadata).toHaveProperty('analysisVersion');
      expect(result.metadata).toHaveProperty('provider', 'default');
      expect(result.analysisDate).toBeInstanceOf(Date);
      expect(result.lastUpdated).toBeInstanceOf(Date);
    });

    test('should preserve backward compatibility', async () => {
      const testAddress = '0x1234567890123456789012345678901234567890';
      
      // Basic analysis should still work
      const basicResult = tool.analyzeContract(testAddress);
      expect(basicResult).toHaveProperty('isValid');
      expect(basicResult).toHaveProperty('isMalicious');
      expect(basicResult).toHaveProperty('warnings');
      expect(basicResult).toHaveProperty('riskLevel');
      
      // Advanced analysis should include all basic fields plus new ones
      const advancedResult = await tool.analyzeContractAdvanced(testAddress);
      expect(advancedResult).toHaveProperty('contractAddress');
      expect(advancedResult).toHaveProperty('vulnerabilities');
      expect(advancedResult).toHaveProperty('riskLevel');
      expect(advancedResult).toHaveProperty('bytecode');
      expect(advancedResult).toHaveProperty('securityWarnings');
    });

    test('should include analysis fields when bytecode is available', async () => {
      const testAddress = '0x1234567890123456789012345678901234567890';
      
      const result = await tool.analyzeContractAdvanced(testAddress);
      
      // These fields should be present (might be undefined if no bytecode)
      expect(result).toHaveProperty('bytecode');
      expect(result).toHaveProperty('bytecodeSize');
      expect(result).toHaveProperty('isContract');
      expect(result).toHaveProperty('isProxyContract');
      expect(result).toHaveProperty('patternResults');
      expect(result).toHaveProperty('riskAssessment');
    });

    test('should generate security warnings when enabled', async () => {
      const testAddress = '0x1234567890123456789012345678901234567890';
      
      const result = await tool.analyzeContractAdvanced(testAddress);
      
      expect(result.securityWarnings).toBeDefined();
      
      // Should include educational warning
      const hasEducationalWarning = result.securityWarnings?.some(
        warning => warning.message.includes('educational and security research purposes only')
      );
      expect(hasEducationalWarning).toBe(true);
    });
  });

  describe('validation', () => {
    test('should validate advanced contract analysis result structure', async () => {
      const testAddress = '0x1234567890123456789012345678901234567890';
      
      const result = await tool.analyzeContractAdvanced(testAddress);
      
      // Check required fields
      expect(typeof result.contractAddress).toBe('string');
      expect(typeof result.contractName).toBe('string');
      expect(typeof result.analysisStatus).toBe('string');
      expect(Array.isArray(result.vulnerabilities)).toBe(true);
      expect(typeof result.riskLevel).toBe('string');
      expect(result.analysisDate).toBeInstanceOf(Date);
      expect(result.lastUpdated).toBeInstanceOf(Date);
      
      // Check that risk level is valid
      const validRiskLevels = ['low', 'medium', 'high', 'critical'];
      expect(validRiskLevels).toContain(result.riskLevel);
      
      // Check that analysis status is valid
      const validStatuses = ['pending', 'complete', 'failed', 'in-progress'];
      expect(validStatuses).toContain(result.analysisStatus);
    });
  });
});
