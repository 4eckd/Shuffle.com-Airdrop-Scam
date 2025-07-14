import { jest } from '@jest/globals';
import {
  detectAllPatterns,
} from '../../src/analysis/patternDetection';
import {
  assessRisk,
} from '../../src/analysis/riskScoring';
import {
  generateReport,
  generateAndSaveReport,
} from '../../src/analysis/report';
import {
  TEST_CASES,
  LEGITIMATE_ERC20_ABI,
  DECEPTIVE_EVENTS_ABI,
  FAKE_BALANCE_ABI,
  NON_FUNCTIONAL_TRANSFER_ABI,
  HIDDEN_REDIRECTION_BYTECODE,
} from '../fixtures/test-data';
import {
  ContractAnalysis,
} from '../../src/types';

// Mock ethers to simulate network interactions
jest.mock('ethers', () => ({
  JsonRpcProvider: jest.fn().mockImplementation(() => ({
    getCode: jest.fn().mockResolvedValue('0x608060405234801561001057600080fd5b50' as any),
    getBalance: jest.fn().mockResolvedValue('1000000000000000000' as any),
    getTransaction: jest.fn().mockResolvedValue({
      hash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      blockNumber: 123456,
      from: '0x1234567890abcdef1234567890abcdef12345678',
      to: '0xabcdef1234567890abcdef1234567890abcdef12',
      value: '1000000000000000000',
      gasPrice: '20000000000',
      gasLimit: '21000',
      data: '0x',
      nonce: 42,
    } as any),
    call: jest.fn().mockResolvedValue('0x0000000000000000000000000000000000000000000000000de0b6b3a7640000' as any),
    getLogs: jest.fn().mockResolvedValue([
      {
        address: '0x1234567890abcdef1234567890abcdef12345678',
        topics: ['0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'],
        data: '0xabcdef',
        blockNumber: 123456,
        transactionHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      }
    ] as any),
    getBlock: jest.fn().mockResolvedValue({
      number: 123456,
      timestamp: 1640995200,
      hash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    } as any),
  })),
  Contract: jest.fn().mockImplementation(() => ({
    connect: jest.fn().mockReturnThis(),
    balanceOf: jest.fn().mockResolvedValue('1000000000000000000' as any),
    transfer: jest.fn().mockResolvedValue({
      hash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      wait: jest.fn().mockResolvedValue({
        status: 1,
        events: [{ event: 'Transfer', args: {} }],
        gasUsed: '21000',
      } as any),
    } as any),
    approve: jest.fn().mockResolvedValue({
      hash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      wait: jest.fn().mockResolvedValue({ status: 1 } as any),
    } as any),
  })),
  isAddress: jest.fn().mockImplementation((_address: unknown) => 
    /^0x[a-fA-F0-9]{40}$/.test(_address as string)
  ),
  getAddress: jest.fn().mockImplementation((_address: unknown) => (_address as string).toLowerCase()),
  formatEther: jest.fn().mockImplementation((_wei: unknown) => '1.0'),
  parseEther: jest.fn().mockImplementation((_ether: unknown) => '1000000000000000000'),
  id: jest.fn().mockImplementation((_text: unknown) => 
    '0x' + (_text as string).split('').map(c => c.charCodeAt(0).toString(16)).join('').padEnd(64, '0')
  ),
}));

// Mock file system operations for report generation
jest.mock('fs', () => ({
  writeFileSync: jest.fn(),
  mkdirSync: jest.fn(),
  existsSync: jest.fn().mockReturnValue(true),
}));

jest.mock('uuid', () => ({
  v4: jest.fn().mockReturnValue('integration-test-uuid'),
}));

describe('Analysis Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Full Analysis Workflow', () => {
    it('should perform complete analysis on legitimate contract', async () => {
      // Step 1: Pattern Detection
      const patternResults = detectAllPatterns(LEGITIMATE_ERC20_ABI);
      
      expect(patternResults).toBeDefined();
      expect(patternResults.overallDetected).toBe(false);
      expect(patternResults.overallConfidence).toBe(0);
      expect(patternResults.overallSeverity).toBe('low');
      expect(patternResults.overallRiskScore).toBe(0);
      expect(patternResults.detectedPatterns).toHaveLength(0);
      
      // Step 2: Risk Assessment
      const riskAssessment = assessRisk(patternResults.patternResults);
      
      expect(riskAssessment).toBeDefined();
      expect(riskAssessment.riskScore).toBe(0);
      expect(riskAssessment.riskLevel).toBe('low');
      expect(riskAssessment.confidence).toBe(0);
      expect(riskAssessment.explanation.summary).toContain('No malicious patterns detected');
      expect(riskAssessment.explanation.recommendations).toContain(
        expect.stringContaining('Low risk detected')
      );
      
      // Step 3: Contract Analysis Creation
      const contractAnalysis: ContractAnalysis = {
        contractAddress: '0x1234567890abcdef1234567890abcdef12345678',
        contractName: 'LegitimateERC20',
        analysisStatus: 'complete',
        vulnerabilities: [],
        riskLevel: riskAssessment.riskLevel,
        analysisDate: new Date(),
        lastUpdated: new Date(),
        metadata: {
          patternResults: patternResults.patternResults,
          riskAssessment,
          totalPatternsAnalyzed: patternResults.metadata.totalPatternsAnalyzed,
          processingTime: patternResults.metadata.processingTime,
        },
      };
      
      // Step 4: Report Generation
      const report = generateReport([contractAnalysis]);
      
      expect(report).toBeDefined();
      expect(report.contractAnalyses).toHaveLength(1);
      expect(report.securityWarnings).toHaveLength(0);
      expect(report.summary).toContain('1 smart contracts');
      expect(report.summary).toContain('100% success rate');
      expect(report.summary).toContain('0 contracts flagged as high or critical risk');
    });

    it('should perform complete analysis on malicious contract', async () => {
      // Step 1: Pattern Detection on complex malicious contract
      const patternResults = detectAllPatterns(TEST_CASES.complexMalicious.abi);
      
      expect(patternResults).toBeDefined();
      expect(patternResults.overallDetected).toBe(true);
      expect(patternResults.overallConfidence).toBeGreaterThan(0);
      expect(['medium', 'high', 'critical']).toContain(patternResults.overallSeverity);
      expect(patternResults.overallRiskScore).toBeGreaterThan(50);
      expect(patternResults.detectedPatterns.length).toBeGreaterThan(0);
      
      // Step 2: Risk Assessment
      const riskAssessment = assessRisk(patternResults.patternResults);
      
      expect(riskAssessment).toBeDefined();
      expect(riskAssessment.riskScore).toBeGreaterThan(0.5);
      expect(['high', 'critical']).toContain(riskAssessment.riskLevel);
      expect(riskAssessment.confidence).toBeGreaterThan(0.5);
      expect(riskAssessment.explanation.summary).toContain('malicious pattern');
      expect(riskAssessment.explanation.recommendations).toContain(
        expect.stringContaining('DO NOT INTERACT')
      );
      
      // Step 3: Contract Analysis Creation
      const contractAnalysis: ContractAnalysis = {
        contractAddress: '0xabcdef1234567890abcdef1234567890abcdef12',
        contractName: 'MaliciousScamContract',
        analysisStatus: 'complete',
        vulnerabilities: patternResults.detectedPatterns,
        riskLevel: riskAssessment.riskLevel,
        analysisDate: new Date(),
        lastUpdated: new Date(),
        metadata: {
          patternResults: patternResults.patternResults,
          riskAssessment,
          totalPatternsAnalyzed: patternResults.metadata.totalPatternsAnalyzed,
          processingTime: patternResults.metadata.processingTime,
          scamType: 'complex airdrop scam',
        },
      };
      
      // Step 4: Report Generation
      const report = generateReport([contractAnalysis]);
      
      expect(report).toBeDefined();
      expect(report.contractAnalyses).toHaveLength(1);
      expect(report.securityWarnings.length).toBeGreaterThan(0);
      expect(report.summary).toContain('1 smart contracts');
      expect(report.summary).toContain('1 contracts flagged as high or critical risk');
      
      // Verify security warnings were generated
      const riskWarnings = report.securityWarnings.filter(w => 
        w.level === 'error' || w.level === 'critical'
      );
      expect(riskWarnings.length).toBeGreaterThan(0);
    });

    it('should handle mixed contract analysis batch', async () => {
      // Analyze multiple contracts with different risk levels
      const contracts = [
        { abi: LEGITIMATE_ERC20_ABI, name: 'LegitimateContract', address: '0x1111111111111111111111111111111111111111' },
        { abi: DECEPTIVE_EVENTS_ABI, name: 'DeceptiveEventsContract', address: '0x2222222222222222222222222222222222222222' },
        { abi: FAKE_BALANCE_ABI, name: 'FakeBalanceContract', address: '0x3333333333333333333333333333333333333333' },
        { abi: NON_FUNCTIONAL_TRANSFER_ABI, name: 'NonFunctionalTransferContract', address: '0x4444444444444444444444444444444444444444' },
      ];
      
      const contractAnalyses: ContractAnalysis[] = [];
      
      for (const contract of contracts) {
        const patternResults = detectAllPatterns(contract.abi);
        const riskAssessment = assessRisk(patternResults.patternResults);
        
        contractAnalyses.push({
          contractAddress: contract.address,
          contractName: contract.name,
          analysisStatus: 'complete',
          vulnerabilities: patternResults.detectedPatterns,
          riskLevel: riskAssessment.riskLevel,
          analysisDate: new Date(),
          lastUpdated: new Date(),
          metadata: {
            patternResults: patternResults.patternResults,
            riskAssessment,
            totalPatternsAnalyzed: patternResults.metadata.totalPatternsAnalyzed,
            processingTime: patternResults.metadata.processingTime,
          },
        });
      }
      
      // Generate comprehensive report
      const report = generateReport(contractAnalyses);
      
      expect(report).toBeDefined();
      expect(report.contractAnalyses).toHaveLength(4);
      expect(report.summary).toContain('4 smart contracts');
      expect(report.summary).toContain('100% success rate');
      
      // Verify risk distribution
      const riskCounts = {
        low: contractAnalyses.filter(c => c.riskLevel === 'low').length,
        medium: contractAnalyses.filter(c => c.riskLevel === 'medium').length,
        high: contractAnalyses.filter(c => c.riskLevel === 'high').length,
        critical: contractAnalyses.filter(c => c.riskLevel === 'critical').length,
      };
      
      expect(riskCounts.low).toBe(1); // Legitimate contract
      expect(riskCounts.high + riskCounts.critical).toBeGreaterThan(0); // Malicious contracts
      
      // Verify security warnings
      const highRiskContracts = contractAnalyses.filter(c => 
        c.riskLevel === 'high' || c.riskLevel === 'critical'
      );
      expect(report.securityWarnings.length).toBeGreaterThanOrEqual(highRiskContracts.length);
    });

    it('should handle end-to-end workflow with file generation', () => {
      // Create test contract analyses
      const contractAnalyses: ContractAnalysis[] = [
        {
          contractAddress: '0x1234567890abcdef1234567890abcdef12345678',
          contractName: 'TestContract1',
          analysisStatus: 'complete',
          vulnerabilities: ['deceptive-events'],
          riskLevel: 'high',
          analysisDate: new Date(),
          lastUpdated: new Date(),
          metadata: { riskScore: 0.8 },
        },
        {
          contractAddress: '0xabcdef1234567890abcdef1234567890abcdef12',
          contractName: 'TestContract2',
          analysisStatus: 'complete',
          vulnerabilities: [],
          riskLevel: 'low',
          analysisDate: new Date(),
          lastUpdated: new Date(),
          metadata: { riskScore: 0.1 },
        },
      ];
      
      // Generate and save report
      const result = generateAndSaveReport(contractAnalyses);
      
      expect(result).toBeDefined();
      expect(result.report).toBeDefined();
      expect(result.files).toBeDefined();
      expect(result.files.jsonPath).toContain('.json');
      expect(result.files.markdownPath).toContain('.md');
      
      // Verify report content
      expect(result.report.reportId).toBe('integration-test-uuid');
      expect(result.report.contractAnalyses).toHaveLength(2);
      expect(result.report.securityWarnings.length).toBeGreaterThan(0);
      
      // Verify file system operations
      expect(require('fs').writeFileSync).toHaveBeenCalledTimes(2);
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle large-scale analysis efficiently', async () => {
      const startTime = Date.now();
      
      // Create analysis for 100 contracts
      const contractAnalyses: ContractAnalysis[] = [];
      
      for (let i = 0; i < 100; i++) {
        const abi = i % 4 === 0 ? DECEPTIVE_EVENTS_ABI : LEGITIMATE_ERC20_ABI;
        const patternResults = detectAllPatterns(abi);
        const riskAssessment = assessRisk(patternResults.patternResults);
        
        contractAnalyses.push({
          contractAddress: `0x${i.toString(16).padStart(40, '0')}`,
          contractName: `Contract${i}`,
          analysisStatus: 'complete',
          vulnerabilities: patternResults.detectedPatterns,
          riskLevel: riskAssessment.riskLevel,
          analysisDate: new Date(),
          lastUpdated: new Date(),
          metadata: {
            patternResults: patternResults.patternResults,
            riskAssessment,
            index: i,
          },
        });
      }
      
      const report = generateReport(contractAnalyses);
      const endTime = Date.now();
      
      expect(endTime - startTime).toBeLessThan(10000); // Should complete in under 10 seconds
      expect(report.contractAnalyses).toHaveLength(100);
      expect(report.securityWarnings.length).toBeGreaterThan(0);
      
      // Verify statistics
      const highRiskCount = contractAnalyses.filter(c => 
        c.riskLevel === 'high' || c.riskLevel === 'critical'
      ).length;
      expect(report.summary).toContain(`${highRiskCount} contracts flagged as high or critical risk`);
    });

    it('should handle concurrent analysis operations', async () => {
      const promises = Array(20).fill(null).map(async (_, index) => {
        const abi = index % 2 === 0 ? DECEPTIVE_EVENTS_ABI : LEGITIMATE_ERC20_ABI;
        const patternResults = detectAllPatterns(abi);
        const riskAssessment = assessRisk(patternResults.patternResults);
        
        return {
          contractAddress: `0x${index.toString(16).padStart(40, '0')}`,
          contractName: `ConcurrentContract${index}`,
          analysisStatus: 'complete' as const,
          vulnerabilities: patternResults.detectedPatterns,
          riskLevel: riskAssessment.riskLevel,
          analysisDate: new Date(),
          lastUpdated: new Date(),
          metadata: {
            patternResults: patternResults.patternResults,
            riskAssessment,
            concurrentIndex: index,
          },
        };
      });
      
      const contractAnalyses = await Promise.all(promises);
      const report = generateReport(contractAnalyses);
      
      expect(report.contractAnalyses).toHaveLength(20);
      expect(report.summary).toContain('20 smart contracts');
      
      // Verify all analyses completed successfully
      contractAnalyses.forEach(analysis => {
        expect(analysis.analysisStatus).toBe('complete');
        expect(analysis.metadata.patternResults).toBeDefined();
        expect(analysis.metadata.riskAssessment).toBeDefined();
      });
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle analysis failures gracefully', () => {
      const contractAnalyses: ContractAnalysis[] = [
        {
          contractAddress: '0x1234567890abcdef1234567890abcdef12345678',
          contractName: 'SuccessfulContract',
          analysisStatus: 'complete',
          vulnerabilities: [],
          riskLevel: 'low',
          analysisDate: new Date(),
          lastUpdated: new Date(),
          metadata: {},
        },
        {
          contractAddress: '0xabcdef1234567890abcdef1234567890abcdef12',
          contractName: 'FailedContract',
          analysisStatus: 'failed',
          vulnerabilities: [],
          riskLevel: 'medium',
          analysisDate: new Date(),
          lastUpdated: new Date(),
          metadata: { error: 'Network timeout' },
        },
      ];
      
      const report = generateReport(contractAnalyses);
      
      expect(report).toBeDefined();
      expect(report.contractAnalyses).toHaveLength(2);
      expect(report.summary).toContain('50% success rate');
      expect(report.summary).toContain('1 analyses failed');
      
      // Verify failure warning was generated
      const failureWarnings = report.securityWarnings.filter(w => 
        w.message.includes('Analysis failed')
      );
      expect(failureWarnings).toHaveLength(1);
      expect(failureWarnings[0].level).toBe('warning');
    });

    it('should handle malformed input data', () => {
      // Test with various edge cases
      const edgeCases = [
        { abi: [], name: 'EmptyABI' },
        { abi: [{ type: 'constructor' }], name: 'ConstructorOnly' },
        { abi: [{ type: 'fallback' }], name: 'FallbackOnly' },
      ];
      
      edgeCases.forEach(testCase => {
        expect(() => {
          const patternResults = detectAllPatterns(testCase.abi);
          const riskAssessment = assessRisk(patternResults.patternResults);
          
          expect(patternResults).toBeDefined();
          expect(riskAssessment).toBeDefined();
        }).not.toThrow();
      });
    });

    it('should maintain data consistency across analysis steps', () => {
      const patternResults = detectAllPatterns(DECEPTIVE_EVENTS_ABI);
      const riskAssessment = assessRisk(patternResults.patternResults);
      
      // Verify pattern results consistency
      expect(Object.keys(patternResults.patternResults)).toHaveLength(4);
      expect(Object.keys(riskAssessment.breakdown.patternScores)).toHaveLength(4);
      
      // Verify detected patterns match
      const detectedFromPatterns = Object.entries(patternResults.patternResults)
        .filter(([_, result]) => result.detected)
        .map(([pattern, _]) => pattern);
      
      const detectedFromRisk = Object.entries(riskAssessment.breakdown.patternScores)
        .filter(([_, score]) => score.detected)
        .map(([pattern, _]) => pattern);
      
      expect(detectedFromPatterns.sort()).toEqual(detectedFromRisk.sort());
      
      // Verify confidence values match
      Object.entries(patternResults.patternResults).forEach(([pattern, result]) => {
        const riskScore = riskAssessment.breakdown.patternScores[pattern];
        expect(riskScore.confidence).toBe(result.confidence);
        expect(riskScore.detected).toBe(result.detected);
      });
    });

    it('should handle network simulation edge cases', () => {
      // Test with different mock responses
      const ethersProvider = require('ethers').ethers.JsonRpcProvider();
      
      // Simulate network errors
      ethersProvider.getCode.mockRejectedValueOnce(new Error('Network error'));
      ethersProvider.getBalance.mockRejectedValueOnce(new Error('RPC error'));
      
      // Pattern detection should still work with local analysis
      expect(() => {
        const patternResults = detectAllPatterns(DECEPTIVE_EVENTS_ABI);
        expect(patternResults).toBeDefined();
      }).not.toThrow();
      
      // Reset mocks
      ethersProvider.getCode.mockResolvedValue('0x608060405234801561001057600080fd5b50');
      ethersProvider.getBalance.mockResolvedValue('1000000000000000000');
    });
  });

  describe('Bytecode Analysis Integration', () => {
    it('should integrate bytecode analysis with ABI analysis', () => {
      // Test hidden redirection pattern with bytecode
      const bytecodeResult = detectAllPatterns(HIDDEN_REDIRECTION_BYTECODE);
      expect(bytecodeResult.overallDetected).toBe(true);
      expect(bytecodeResult.detectedPatterns).toContain('hidden-redirection');
      
      // Test deceptive events pattern with ABI
      const abiResult = detectAllPatterns(DECEPTIVE_EVENTS_ABI);
      expect(abiResult.overallDetected).toBe(true);
      expect(abiResult.detectedPatterns).toContain('deceptive-events');
      
      // Combine results for comprehensive analysis
      const combinedPatterns = {
        ...bytecodeResult.patternResults,
        ...abiResult.patternResults,
      };
      
      const combinedRisk = assessRisk(combinedPatterns);
      expect(combinedRisk.riskScore).toBeGreaterThan(bytecodeResult.overallRiskScore / 100);
      expect(combinedRisk.riskScore).toBeGreaterThan(abiResult.overallRiskScore / 100);
    });
  });

  describe('Real-world Scenario Simulation', () => {
    it('should simulate complete scam detection workflow', () => {
      // Simulate analyzing a suspected scam contract
      const suspiciousContract = {
        address: '0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef',
        name: 'SuspiciousAirdropContract',
        abi: TEST_CASES.complexMalicious.abi,
        bytecode: TEST_CASES.complexMalicious.bytecode,
      };
      
      // Step 1: Initial pattern detection
      const abiPatterns = detectAllPatterns(suspiciousContract.abi);
      const bytecodePatterns = detectAllPatterns(suspiciousContract.bytecode);
      
      // Step 2: Combine pattern results
      const combinedPatterns = {
        ...abiPatterns.patternResults,
        ...bytecodePatterns.patternResults,
      };
      
      // Step 3: Risk assessment
      const riskAssessment = assessRisk(combinedPatterns);
      
      // Step 4: Create contract analysis
      const analysis: ContractAnalysis = {
        contractAddress: suspiciousContract.address,
        contractName: suspiciousContract.name,
        analysisStatus: 'complete',
        vulnerabilities: [
          ...abiPatterns.detectedPatterns,
          ...bytecodePatterns.detectedPatterns,
        ],
        riskLevel: riskAssessment.riskLevel,
        analysisDate: new Date(),
        lastUpdated: new Date(),
        metadata: {
          abiPatterns: abiPatterns.patternResults,
          bytecodePatterns: bytecodePatterns.patternResults,
          combinedRiskAssessment: riskAssessment,
          analysisType: 'comprehensive',
          sourceType: 'suspected scam',
        },
      };
      
      // Step 5: Generate alert report
      const report = generateReport([analysis]);
      
      // Verify scam detection
      expect(riskAssessment.riskLevel).toBeOneOf(['high', 'critical']);
      expect(analysis.vulnerabilities.length).toBeGreaterThan(0);
      expect(report.securityWarnings.length).toBeGreaterThan(0);
      
      // Verify appropriate warnings
      const criticalWarnings = report.securityWarnings.filter(w => 
        w.level === 'critical' || w.level === 'error'
      );
      expect(criticalWarnings.length).toBeGreaterThan(0);
      
      // Verify recommendations include strong warnings
      expect(riskAssessment.explanation.recommendations).toContain(
        expect.stringContaining('DO NOT INTERACT')
      );
    });
  });
});

// Custom Jest matcher for one-of assertion
expect.extend({
  toBeOneOf(received: any, validOptions: any[]) {
    const pass = validOptions.includes(received);
    if (pass) {
      return {
        message: () => `expected ${received} not to be one of ${validOptions.join(', ')}`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be one of ${validOptions.join(', ')}`,
        pass: false,
      };
    }
  },
});

declare global {
  namespace jest {
    interface Matchers<R> {
      toBeOneOf(validOptions: any[]): R;
    }
  }
}
