import { jest } from '@jest/globals';
import {
  generateReport,
  saveReportToFiles,
  generateAndSaveReport,
  getReportStatistics,
} from '../../src/analysis/report';
import {
  ContractAnalysis,
  ValidationError,
  AnalysisError,
} from '../../src/types';

// Mock file system operations
jest.mock('fs', () => ({
  writeFileSync: jest.fn(),
  mkdirSync: jest.fn(),
  existsSync: jest.fn().mockReturnValue(true),
  promises: {
    access: jest.fn().mockResolvedValue(void 0),
    mkdir: jest.fn().mockResolvedValue(void 0),
    writeFile: jest.fn().mockResolvedValue(void 0),
    readFile: jest.fn().mockResolvedValue('mock file content'),
  },
}));

// Mock uuid
jest.mock('uuid', () => ({
  v4: jest.fn().mockReturnValue('mock-uuid-12345'),
}));

// Mock environment config
jest.mock('../../src/config/environment', () => ({
  config: {
    appVersion: '1.3.0',
    analysisOutputDir: './test-output',
    nodeEnv: 'test',
    logLevel: 'error',
  },
}));

describe('Report Generation', () => {
  // Mock contract analyses for testing
  const mockContractAnalyses: ContractAnalysis[] = [
    {
      contractAddress: '0x1234567890abcdef1234567890abcdef12345678',
      contractName: 'TestContract1',
      analysisStatus: 'complete',
      vulnerabilities: ['reentrancy', 'integer overflow'],
      riskLevel: 'high',
      analysisDate: new Date('2023-01-01'),
      lastUpdated: new Date('2023-01-02'),
      metadata: { gasUsed: 50000 },
    },
    {
      contractAddress: '0xabcdef1234567890abcdef1234567890abcdef12',
      contractName: 'TestContract2',
      analysisStatus: 'complete',
      vulnerabilities: [],
      riskLevel: 'low',
      analysisDate: new Date('2023-01-01'),
      lastUpdated: new Date('2023-01-02'),
      metadata: { gasUsed: 25000 },
    },
    {
      contractAddress: '0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef',
      contractName: 'TestContract3',
      analysisStatus: 'failed',
      vulnerabilities: [],
      riskLevel: 'medium',
      analysisDate: new Date('2023-01-01'),
      lastUpdated: new Date('2023-01-02'),
      metadata: { error: 'Analysis timeout' },
    },
  ];

  const mockLegitimateAnalyses: ContractAnalysis[] = [
    {
      contractAddress: '0x1111111111111111111111111111111111111111',
      contractName: 'LegitimateContract1',
      analysisStatus: 'complete',
      vulnerabilities: [],
      riskLevel: 'low',
      analysisDate: new Date('2023-01-01'),
      lastUpdated: new Date('2023-01-02'),
      metadata: {},
    },
    {
      contractAddress: '0x2222222222222222222222222222222222222222',
      contractName: 'LegitimateContract2',
      analysisStatus: 'complete',
      vulnerabilities: [],
      riskLevel: 'low',
      analysisDate: new Date('2023-01-01'),
      lastUpdated: new Date('2023-01-02'),
      metadata: {},
    },
  ];

  const mockHighRiskAnalyses: ContractAnalysis[] = [
    {
      contractAddress: '0x3333333333333333333333333333333333333333',
      contractName: 'MaliciousContract1',
      analysisStatus: 'complete',
      vulnerabilities: ['deceptive events', 'hidden redirection', 'fake balance'],
      riskLevel: 'critical',
      analysisDate: new Date('2023-01-01'),
      lastUpdated: new Date('2023-01-02'),
      metadata: { scamType: 'airdrop scam' },
    },
    {
      contractAddress: '0x4444444444444444444444444444444444444444',
      contractName: 'MaliciousContract2',
      analysisStatus: 'complete',
      vulnerabilities: ['non-functional transfer'],
      riskLevel: 'high',
      analysisDate: new Date('2023-01-01'),
      lastUpdated: new Date('2023-01-02'),
      metadata: { scamType: 'fake token' },
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset file system mocks
    (require('fs').writeFileSync as jest.Mock).mockImplementation(() => {});
    (require('fs').mkdirSync as jest.Mock).mockImplementation(() => {});
    (require('fs').existsSync as jest.Mock).mockReturnValue(true);
  });

  describe('generateReport', () => {
    it('should generate comprehensive report for mixed risk analyses', () => {
      const report = generateReport(mockContractAnalyses);

      expect(report).toBeDefined();
      expect(report.reportId).toBe('mock-uuid-12345');
      expect(report.title).toContain('Smart Contract Security Analysis Report');
      expect(report.title).toContain('3 Contracts');
      expect(report.summary).toContain('Analysis completed for 3 smart contracts');
      expect(report.contractAnalyses).toEqual(mockContractAnalyses);
      expect(report.securityWarnings.length).toBeGreaterThan(0);
      expect(report.scamPatterns).toEqual([]);
      expect(report.generatedAt).toBeInstanceOf(Date);
      expect(report.version).toBe('1.3.0');
    });

    it('should generate report for legitimate contracts', () => {
      const report = generateReport(mockLegitimateAnalyses);

      expect(report).toBeDefined();
      expect(report.title).toContain('2 Contracts');
      expect(report.summary).toContain('Analysis completed for 2 smart contracts');
      expect(report.summary).toContain('100% success rate');
      expect(report.summary).toContain('0 contracts flagged as high or critical risk');
      expect(report.securityWarnings).toHaveLength(0);
    });

    it('should generate report for high-risk contracts', () => {
      const report = generateReport(mockHighRiskAnalyses);

      expect(report).toBeDefined();
      expect(report.title).toContain('2 Contracts');
      expect(report.summary).toContain('2 contracts flagged as high or critical risk');
      expect(report.securityWarnings.length).toBeGreaterThan(0);
      
      // Should have warnings for high/critical risk contracts
      const criticalWarnings = report.securityWarnings.filter(w => w.level === 'critical');
      const errorWarnings = report.securityWarnings.filter(w => w.level === 'error');
      expect(criticalWarnings.length + errorWarnings.length).toBeGreaterThan(0);
    });

    it('should throw ValidationError for empty analyses array', () => {
      expect(() => generateReport([])).toThrow(ValidationError);
      expect(() => generateReport([])).toThrow('Contract analyses array cannot be empty');
    });

    it('should throw ValidationError for null/undefined input', () => {
      expect(() => generateReport(null as any)).toThrow(ValidationError);
      expect(() => generateReport(undefined as any)).toThrow(ValidationError);
    });

    it('should generate security warnings for failed analyses', () => {
      const report = generateReport(mockContractAnalyses);

      const failedAnalysisWarnings = report.securityWarnings.filter(w =>
        w.message.includes('Analysis failed')
      );
      expect(failedAnalysisWarnings).toHaveLength(1);
      expect(failedAnalysisWarnings[0].level).toBe('warning');
      expect(failedAnalysisWarnings[0].contractAddress).toBe('0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef');
    });

    it('should generate security warnings for vulnerabilities', () => {
      const report = generateReport(mockContractAnalyses);

      const vulnerabilityWarnings = report.securityWarnings.filter(w =>
        w.message.includes('vulnerabilities')
      );
      expect(vulnerabilityWarnings).toHaveLength(1);
      expect(vulnerabilityWarnings[0].level).toBe('error');
      expect(vulnerabilityWarnings[0].message).toContain('reentrancy, integer overflow');
    });

    it('should calculate completion rate correctly', () => {
      const report = generateReport(mockContractAnalyses);

      expect(report.summary).toContain('67% success rate'); // 2 complete out of 3 total
    });

    it('should validate generated report against schema', () => {
      const report = generateReport(mockContractAnalyses);

      // Basic type checks
      expect(typeof report.reportId).toBe('string');
      expect(typeof report.title).toBe('string');
      expect(typeof report.summary).toBe('string');
      expect(Array.isArray(report.contractAnalyses)).toBe(true);
      expect(Array.isArray(report.securityWarnings)).toBe(true);
      expect(Array.isArray(report.scamPatterns)).toBe(true);
      expect(report.generatedAt).toBeInstanceOf(Date);
      expect(typeof report.version).toBe('string');
      
      // UUID format check
      expect(report.reportId).toMatch(/^[0-9a-f-]+$/);
      
      // Version format check
      expect(report.version).toMatch(/^\d+\.\d+\.\d+/);
    });

    it('should include metadata timestamps in security warnings', () => {
      const report = generateReport(mockContractAnalyses);

      report.securityWarnings.forEach(warning => {
        expect(warning.timestamp).toBeInstanceOf(Date);
        expect(warning.timestamp.getTime()).toBeLessThanOrEqual(Date.now());
      });
    });
  });

  describe('saveReportToFiles', () => {
    it('should save report to JSON and Markdown files', () => {
      const report = generateReport(mockContractAnalyses);
      const result = saveReportToFiles(report);

      expect(result).toBeDefined();
      expect(result.jsonPath).toContain('.json');
      expect(result.markdownPath).toContain('.md');
      expect(result.jsonPath).toContain('analysis-report-');
      expect(result.markdownPath).toContain('analysis-report-');
      
      // Verify file system calls
      expect(require('fs').writeFileSync).toHaveBeenCalledTimes(2);
      
      const calls = (require('fs').writeFileSync as jest.Mock).mock.calls;
      expect(calls[0][0]).toContain('.json');
      expect(calls[1][0]).toContain('.md');
      
      // Verify JSON content
      expect(calls[0][1]).toContain('"reportId"');
      expect(calls[0][1]).toContain(report.reportId);
      
      // Verify Markdown content
      expect(calls[1][1]).toContain('# Smart Contract Security Analysis Report');
      expect(calls[1][1]).toContain('## Executive Summary');
    });

    it('should create output directory if it does not exist', () => {
      (require('fs').existsSync as jest.Mock).mockReturnValue(false);
      
      const report = generateReport(mockContractAnalyses);
      saveReportToFiles(report);

      expect(require('fs').mkdirSync).toHaveBeenCalledWith(
        expect.stringContaining('test-output'),
        { recursive: true }
      );
    });

    it('should handle file system errors gracefully', () => {
      (require('fs').writeFileSync as jest.Mock).mockImplementation(() => {
        throw new Error('File system error');
      });

      const report = generateReport(mockContractAnalyses);
      
      expect(() => saveReportToFiles(report)).toThrow(AnalysisError);
      expect(() => saveReportToFiles(report)).toThrow('Failed to save report files');
    });

    it('should handle directory creation errors', () => {
      (require('fs').existsSync as jest.Mock).mockReturnValue(false);
      (require('fs').mkdirSync as jest.Mock).mockImplementation(() => {
        throw new Error('Permission denied');
      });

      const report = generateReport(mockContractAnalyses);
      
      expect(() => saveReportToFiles(report)).toThrow(AnalysisError);
      expect(() => saveReportToFiles(report)).toThrow('Failed to create output directory');
    });

    it('should include timestamp in filename', () => {
      const report = generateReport(mockContractAnalyses);
      const result = saveReportToFiles(report);

      // Extract timestamp from filename
      const timestampRegex = /analysis-report-(\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2})/;
      expect(result.jsonPath).toMatch(timestampRegex);
      expect(result.markdownPath).toMatch(timestampRegex);
    });

    it('should generate valid JSON content', () => {
      const report = generateReport(mockContractAnalyses);
      saveReportToFiles(report);

      const jsonCall = (require('fs').writeFileSync as jest.Mock).mock.calls.find(
        (call: any[]) => call[0].endsWith('.json')
      );
      
      expect(jsonCall).toBeDefined();
      expect(() => JSON.parse(jsonCall![1] as string)).not.toThrow();
      
      const parsedJson = JSON.parse(jsonCall![1] as string);
      expect(parsedJson.reportId).toBe(report.reportId);
      expect(parsedJson.contractAnalyses).toHaveLength(mockContractAnalyses.length);
    });

    it('should generate properly formatted Markdown content', () => {
      const report = generateReport(mockContractAnalyses);
      saveReportToFiles(report);

      const markdownCall = (require('fs').writeFileSync as jest.Mock).mock.calls.find(
        (call: any[]) => call[0].endsWith('.md')
      );
      
      expect(markdownCall).toBeDefined();
      const markdownContent = markdownCall![1] as string;
      
      // Check Markdown structure
      expect(markdownContent).toContain('# Smart Contract Security Analysis Report');
      expect(markdownContent).toContain('## Executive Summary');
      expect(markdownContent).toContain('## Analysis Statistics');
      expect(markdownContent).toContain('## Risk Level Distribution');
      expect(markdownContent).toContain('## Contract Analysis Details');
      expect(markdownContent).toContain('| Risk Level | Count | Percentage |');
      
      // Check content includes contract details
      expect(markdownContent).toContain('TestContract1');
      expect(markdownContent).toContain('0x1234567890abcdef1234567890abcdef12345678');
    });
  });

  describe('generateAndSaveReport', () => {
    it('should generate and save report in one operation', () => {
      const result = generateAndSaveReport(mockContractAnalyses);

      expect(result).toBeDefined();
      expect(result.report).toBeDefined();
      expect(result.files).toBeDefined();
      expect(result.files.jsonPath).toContain('.json');
      expect(result.files.markdownPath).toContain('.md');
      
      // Verify report was generated correctly
      expect(result.report.contractAnalyses).toEqual(mockContractAnalyses);
      expect(result.report.reportId).toBe('mock-uuid-12345');
      
      // Verify files were saved
      expect(require('fs').writeFileSync).toHaveBeenCalledTimes(2);
    });

    it('should handle errors in generation phase', () => {
      expect(() => generateAndSaveReport([])).toThrow(ValidationError);
    });

    it('should handle errors in saving phase', () => {
      (require('fs').writeFileSync as jest.Mock).mockImplementation(() => {
        throw new Error('Disk full');
      });

      expect(() => generateAndSaveReport(mockContractAnalyses)).toThrow(AnalysisError);
    });

    it('should maintain consistency between report and saved files', () => {
      const result = generateAndSaveReport(mockContractAnalyses);

      const jsonCall = (require('fs').writeFileSync as jest.Mock).mock.calls.find(
        (call: any[]) => call[0].endsWith('.json')
      );
      
      const savedReport = JSON.parse(jsonCall![1] as string);
      expect(savedReport.reportId).toBe(result.report.reportId);
      expect(savedReport.contractAnalyses).toHaveLength(result.report.contractAnalyses.length);
    });
  });

  describe('getReportStatistics', () => {
    it('should calculate comprehensive statistics for mixed report', () => {
      const report = generateReport(mockContractAnalyses);
      const stats = getReportStatistics(report);

      expect(stats).toBeDefined();
      expect(stats.totalContracts).toBe(3);
      expect(stats.completedAnalyses).toBe(2);
      expect(stats.failedAnalyses).toBe(1);
      expect(stats.pendingAnalyses).toBe(0);
      expect(stats.inProgressAnalyses).toBe(0);
      
      expect(stats.riskLevelDistribution.low).toBe(1);
      expect(stats.riskLevelDistribution.medium).toBe(1);
      expect(stats.riskLevelDistribution.high).toBe(1);
      expect(stats.riskLevelDistribution.critical).toBe(0);
      
      expect(stats.totalWarnings).toBeGreaterThan(0);
      expect(typeof stats.securityWarningsByLevel.warning).toBe('number');
      expect(typeof stats.securityWarningsByLevel.error).toBe('number');
    });

    it('should calculate statistics for legitimate contracts only', () => {
      const report = generateReport(mockLegitimateAnalyses);
      const stats = getReportStatistics(report);

      expect(stats.totalContracts).toBe(2);
      expect(stats.completedAnalyses).toBe(2);
      expect(stats.failedAnalyses).toBe(0);
      expect(stats.riskLevelDistribution.low).toBe(2);
      expect(stats.riskLevelDistribution.high).toBe(0);
      expect(stats.riskLevelDistribution.critical).toBe(0);
      expect(stats.totalWarnings).toBe(0);
    });

    it('should calculate statistics for high-risk contracts', () => {
      const report = generateReport(mockHighRiskAnalyses);
      const stats = getReportStatistics(report);

      expect(stats.totalContracts).toBe(2);
      expect(stats.completedAnalyses).toBe(2);
      expect(stats.riskLevelDistribution.high).toBe(1);
      expect(stats.riskLevelDistribution.critical).toBe(1);
      expect(stats.totalWarnings).toBeGreaterThan(0);
      
      // Should have critical and error warnings for high-risk contracts
      expect(stats.securityWarningsByLevel.critical + stats.securityWarningsByLevel.error)
        .toBeGreaterThan(0);
    });

    it('should handle empty report gracefully', () => {
      const emptyAnalyses: ContractAnalysis[] = [{
        contractAddress: '0x1111111111111111111111111111111111111111',
        contractName: 'EmptyTest',
        analysisStatus: 'complete',
        vulnerabilities: [],
        riskLevel: 'low',
        analysisDate: new Date(),
        lastUpdated: new Date(),
        metadata: {},
      }];
      
      const report = generateReport(emptyAnalyses);
      const stats = getReportStatistics(report);

      expect(stats.totalContracts).toBe(1);
      expect(stats.totalWarnings).toBe(0);
      expect(Object.values(stats.riskLevelDistribution).reduce((a, b) => a + b, 0))
        .toBe(stats.totalContracts);
    });

    it('should maintain sum consistency in distributions', () => {
      const report = generateReport(mockContractAnalyses);
      const stats = getReportStatistics(report);

      // Risk level distribution should sum to total contracts
      const riskLevelSum = Object.values(stats.riskLevelDistribution).reduce((a, b) => a + b, 0);
      expect(riskLevelSum).toBe(stats.totalContracts);

      // Analysis status distribution should sum to total contracts
      const statusSum = stats.completedAnalyses + stats.failedAnalyses + 
                       stats.pendingAnalyses + stats.inProgressAnalyses;
      expect(statusSum).toBe(stats.totalContracts);

      // Warning level distribution should sum to total warnings
      const warningLevelSum = Object.values(stats.securityWarningsByLevel).reduce((a, b) => a + b, 0);
      expect(warningLevelSum).toBe(stats.totalWarnings);
    });
  });

  describe('Markdown Generation', () => {
    it('should generate proper markdown tables', () => {
      const report = generateReport(mockContractAnalyses);
      saveReportToFiles(report);

      const markdownCall = (require('fs').writeFileSync as jest.Mock).mock.calls.find(
        (call: any[]) => call[0].endsWith('.md')
      );
      
      const markdownContent = markdownCall![1] as string;
      
      // Check table headers
      expect(markdownContent).toContain('| Risk Level | Count | Percentage |');
      expect(markdownContent).toContain('|------------|-------|------------|');
      
      // Check table rows
      expect(markdownContent).toContain('| Low | 1 | 33% |');
      expect(markdownContent).toContain('| Medium | 1 | 33% |');
      expect(markdownContent).toContain('| High | 1 | 33% |');
      expect(markdownContent).toContain('| Critical | 0 | 0% |');
    });

    it('should include security warnings section when warnings exist', () => {
      const report = generateReport(mockContractAnalyses);
      saveReportToFiles(report);

      const markdownCall = (require('fs').writeFileSync as jest.Mock).mock.calls.find(
        (call: any[]) => call[0].endsWith('.md')
      );
      
      const markdownContent = markdownCall![1] as string;
      
      expect(markdownContent).toContain('## Security Warnings');
      expect(markdownContent).toContain('WARNING:');
      expect(markdownContent).toContain('ERROR:');
    });

    it('should include contract details with proper formatting', () => {
      const report = generateReport(mockContractAnalyses);
      saveReportToFiles(report);

      const markdownCall = (require('fs').writeFileSync as jest.Mock).mock.calls.find(
        (call: any[]) => call[0].endsWith('.md')
      );
      
      const markdownContent = markdownCall![1] as string;
      
      expect(markdownContent).toContain('### TestContract1');
      expect(markdownContent).toContain('`0x1234567890abcdef1234567890abcdef12345678`');
      expect(markdownContent).toContain('**Status:** complete');
      expect(markdownContent).toContain('**Risk Level:** high');
      expect(markdownContent).toContain('- reentrancy');
      expect(markdownContent).toContain('- integer overflow');
    });

    it('should include metadata when present', () => {
      const report = generateReport(mockContractAnalyses);
      saveReportToFiles(report);

      const markdownCall = (require('fs').writeFileSync as jest.Mock).mock.calls.find(
        (call: any[]) => call[0].endsWith('.md')
      );
      
      const markdownContent = markdownCall![1] as string;
      
      expect(markdownContent).toContain('**Metadata:**');
      expect(markdownContent).toContain('gasUsed');
    });

    it('should include footer with tool information', () => {
      const report = generateReport(mockContractAnalyses);
      saveReportToFiles(report);

      const markdownCall = (require('fs').writeFileSync as jest.Mock).mock.calls.find(
        (call: any[]) => call[0].endsWith('.md')
      );
      
      const markdownContent = markdownCall![1] as string;
      
      expect(markdownContent).toContain('---');
      expect(markdownContent).toContain('Shuffle Airdrop Scam Analysis Tool v1.3.0');
      expect(markdownContent).toContain('project documentation');
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle contracts with no vulnerabilities', () => {
      const report = generateReport(mockLegitimateAnalyses);
      
      expect(report.securityWarnings).toHaveLength(0);
      expect(report.summary).toContain('0 security warnings generated');
    });

    it('should handle contracts with many vulnerabilities', () => {
      const complexContract: ContractAnalysis = {
        contractAddress: '0x5555555555555555555555555555555555555555',
        contractName: 'ComplexMaliciousContract',
        analysisStatus: 'complete',
        vulnerabilities: [
          'reentrancy', 'integer overflow', 'deceptive events', 
          'hidden redirection', 'fake balance', 'non-functional transfer',
          'timestamp dependence', 'front-running', 'denial of service'
        ],
        riskLevel: 'critical',
        analysisDate: new Date('2023-01-01'),
        lastUpdated: new Date('2023-01-02'),
        metadata: { complexityScore: 95 },
      };

      const report = generateReport([complexContract]);
      
      expect(report.securityWarnings.length).toBeGreaterThan(0);
      const vulnerabilityWarning = report.securityWarnings.find(w => 
        w.message.includes('9 known vulnerabilities')
      );
      expect(vulnerabilityWarning).toBeDefined();
    });

    it('should handle very long contract names and addresses', () => {
      const longNameContract: ContractAnalysis = {
        contractAddress: '0x1234567890abcdef1234567890abcdef12345678',
        contractName: 'VeryLongContractNameThatExceedsNormalExpectationsAndMightCauseFormattingIssues',
        analysisStatus: 'complete',
        vulnerabilities: [],
        riskLevel: 'low',
        analysisDate: new Date('2023-01-01'),
        lastUpdated: new Date('2023-01-02'),
        metadata: {},
      };

      expect(() => generateReport([longNameContract])).not.toThrow();
      const report = generateReport([longNameContract]);
      expect(report.contractAnalyses[0].contractName).toBe(longNameContract.contractName);
    });

    it('should handle performance with large number of contracts', () => {
      const startTime = Date.now();
      
      const manyContracts: ContractAnalysis[] = Array(1000).fill(null).map((_, index) => ({
        contractAddress: `0x${index.toString(16).padStart(40, '0')}`,
        contractName: `TestContract${index}`,
        analysisStatus: 'complete' as const,
        vulnerabilities: index % 5 === 0 ? ['test vulnerability'] : [],
        riskLevel: (index % 4 === 0 ? 'high' : 'low') as 'high' | 'low',
        analysisDate: new Date('2023-01-01'),
        lastUpdated: new Date('2023-01-02'),
        metadata: { index },
      }));

      const report = generateReport(manyContracts);
      const endTime = Date.now();
      
      expect(endTime - startTime).toBeLessThan(5000); // Should complete in under 5 seconds
      expect(report.contractAnalyses).toHaveLength(1000);
      expect(report.securityWarnings.length).toBeGreaterThan(0);
    });

    it('should maintain consistency across multiple generations', () => {
      const reports = Array(5).fill(null).map(() => generateReport(mockContractAnalyses));
      
      const firstReport = reports[0];
      reports.forEach(report => {
        expect(report.contractAnalyses).toEqual(firstReport.contractAnalyses);
        expect(report.summary).toBe(firstReport.summary);
        expect(report.securityWarnings.length).toBe(firstReport.securityWarnings.length);
      });
    });

    it('should handle special characters in contract data', () => {
      const specialContract: ContractAnalysis = {
        contractAddress: '0x1234567890abcdef1234567890abcdef12345678',
        contractName: 'Contract with "quotes" & <tags> % symbols',
        analysisStatus: 'complete',
        vulnerabilities: ['vulnerability with "quotes"', 'vulnerability & symbols'],
        riskLevel: 'medium',
        analysisDate: new Date('2023-01-01'),
        lastUpdated: new Date('2023-01-02'),
        metadata: { description: 'Contains "special" characters & symbols' },
      };

      expect(() => generateReport([specialContract])).not.toThrow();
      const report = generateReport([specialContract]);
      saveReportToFiles(report);
      
      // Verify JSON is still valid
      const jsonCall = (require('fs').writeFileSync as jest.Mock).mock.calls.find(
        (call: any[]) => call[0].endsWith('.json')
      );
      expect(() => JSON.parse(jsonCall![1] as string)).not.toThrow();
    });
  });
});
