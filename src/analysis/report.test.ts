import { existsSync, readFileSync, rmSync } from 'fs';
import { join } from 'path';
import { 
  generateReport, 
  saveReportToFiles, 
  generateAndSaveReport, 
  getReportStatistics 
} from './report';
import { 
  ContractAnalysis, 
  AnalysisReport, 
  AnalysisReportSchema,
  ValidationError,
  AnalysisError
} from '../types';
import { config } from '../config/environment';

describe('Report Generator', () => {
  // Sample test data
  const sampleContractAnalyses: ContractAnalysis[] = [
    {
      contractAddress: '0x1234567890abcdef1234567890abcdef12345678',
      contractName: 'TestContract1',
      analysisStatus: 'complete',
      vulnerabilities: ['reentrancy', 'integer-overflow'],
      riskLevel: 'high',
      analysisDate: new Date('2023-01-01'),
      lastUpdated: new Date('2023-01-01'),
      metadata: { version: '1.0.0' },
    },
    {
      contractAddress: '0xabcdef1234567890abcdef1234567890abcdef12',
      contractName: 'TestContract2',
      analysisStatus: 'complete',
      vulnerabilities: [],
      riskLevel: 'low',
      analysisDate: new Date('2023-01-02'),
      lastUpdated: new Date('2023-01-02'),
    },
    {
      contractAddress: '0x9876543210fedcba9876543210fedcba98765432',
      contractName: 'TestContract3',
      analysisStatus: 'failed',
      vulnerabilities: [],
      riskLevel: 'medium',
      analysisDate: new Date('2023-01-03'),
      lastUpdated: new Date('2023-01-03'),
    },
    {
      contractAddress: '0xfedcba9876543210fedcba9876543210fedcba98',
      contractName: 'TestContract4',
      analysisStatus: 'complete',
      vulnerabilities: ['critical-vulnerability'],
      riskLevel: 'critical',
      analysisDate: new Date('2023-01-04'),
      lastUpdated: new Date('2023-01-04'),
    },
  ];

  const singleContractAnalysis: ContractAnalysis[] = [
    {
      contractAddress: '0x1111111111111111111111111111111111111111',
      contractName: 'SingleContract',
      analysisStatus: 'complete',
      vulnerabilities: [],
      riskLevel: 'low',
      analysisDate: new Date('2023-01-01'),
      lastUpdated: new Date('2023-01-01'),
    },
  ];

  describe('generateReport', () => {
    it('should generate a valid report with sample data', () => {
      const report = generateReport(sampleContractAnalyses);
      
      expect(report).toBeDefined();
      expect(report.reportId).toBeDefined();
      expect(report.title).toContain('4 Contracts');
      expect(report.summary).toContain('Analysis completed for 4 smart contracts');
      expect(report.contractAnalyses).toHaveLength(4);
      expect(report.securityWarnings).toBeDefined();
      expect(report.scamPatterns).toBeDefined();
      expect(report.generatedAt).toBeInstanceOf(Date);
      expect(report.version).toBe(config.appVersion);
    });

    it('should validate the generated report with schema', () => {
      const report = generateReport(sampleContractAnalyses);
      
      expect(() => {
        AnalysisReportSchema.parse(report);
      }).not.toThrow();
    });

    it('should generate appropriate security warnings', () => {
      const report = generateReport(sampleContractAnalyses);
      
      // Should have warnings for high/critical risk contracts, failed analyses, and vulnerabilities
      expect(report.securityWarnings.length).toBeGreaterThan(0);
      
      // Check for critical risk warning
      const criticalWarning = report.securityWarnings.find(w => 
        w.level === 'critical' && w.message.includes('TestContract4')
      );
      expect(criticalWarning).toBeDefined();
      
      // Check for failed analysis warning
      const failedWarning = report.securityWarnings.find(w => 
        w.level === 'warning' && w.message.includes('failed')
      );
      expect(failedWarning).toBeDefined();
      
      // Check for vulnerability warning
      const vulnWarning = report.securityWarnings.find(w => 
        w.level === 'error' && w.message.includes('vulnerabilities')
      );
      expect(vulnWarning).toBeDefined();
    });

    it('should generate correct summary statistics', () => {
      const report = generateReport(sampleContractAnalyses);
      
      expect(report.summary).toContain('Analysis completed for 4 smart contracts');
      expect(report.summary).toContain('75% success rate'); // 3 out of 4 completed
      expect(report.summary).toContain('2 contracts flagged as high or critical risk');
      expect(report.summary).toContain('1 analyses failed');
    });

    it('should handle single contract analysis', () => {
      const report = generateReport(singleContractAnalysis);
      
      expect(report.contractAnalyses).toHaveLength(1);
      expect(report.title).toContain('1 Contracts');
      expect(report.summary).toContain('Analysis completed for 1 smart contracts');
      expect(report.summary).toContain('100% success rate');
    });

    it('should throw ValidationError for empty contract analyses', () => {
      expect(() => {
        generateReport([]);
      }).toThrow(ValidationError);
      
      expect(() => {
        generateReport([]);
      }).toThrow('Contract analyses array cannot be empty');
    });

    it('should throw ValidationError for null/undefined input', () => {
      expect(() => {
        generateReport(null as any);
      }).toThrow(ValidationError);
      
      expect(() => {
        generateReport(undefined as any);
      }).toThrow(ValidationError);
    });
  });

  describe('saveReportToFiles', () => {
    let tempReport: AnalysisReport;

    beforeEach(() => {
      tempReport = generateReport(sampleContractAnalyses);
    });

    afterEach(() => {
      // Clean up test files
      try {
        const outputDir = config.analysisOutputDir;
        if (existsSync(outputDir)) {
          const files = require('fs').readdirSync(outputDir);
          files.forEach((file: string) => {
            if (file.startsWith('analysis-report-')) {
              rmSync(join(outputDir, file), { force: true });
            }
          });
        }
      } catch (error) {
        // Ignore cleanup errors
      }
    });

    it('should save report to JSON and Markdown files', () => {
      const { jsonPath, markdownPath } = saveReportToFiles(tempReport);
      
      expect(existsSync(jsonPath)).toBe(true);
      expect(existsSync(markdownPath)).toBe(true);
      expect(jsonPath).toContain('.json');
      expect(markdownPath).toContain('.md');
    });

    it('should create valid JSON file', () => {
      const { jsonPath } = saveReportToFiles(tempReport);
      
      const jsonContent = readFileSync(jsonPath, 'utf8');
      const parsedReport = JSON.parse(jsonContent);
      
      expect(parsedReport.reportId).toBe(tempReport.reportId);
      expect(parsedReport.title).toBe(tempReport.title);
      expect(parsedReport.contractAnalyses).toHaveLength(4);
    });

    it('should create valid Markdown file', () => {
      const { markdownPath } = saveReportToFiles(tempReport);
      
      const markdownContent = readFileSync(markdownPath, 'utf8');
      
      expect(markdownContent).toContain('# Smart Contract Security Analysis Report');
      expect(markdownContent).toContain('## Executive Summary');
      expect(markdownContent).toContain('## Analysis Statistics');
      expect(markdownContent).toContain('## Risk Level Distribution');
      expect(markdownContent).toContain('## Security Warnings');
      expect(markdownContent).toContain('## Contract Analysis Details');
      expect(markdownContent).toContain('TestContract1');
      expect(markdownContent).toContain('TestContract2');
      expect(markdownContent).toContain('TestContract3');
      expect(markdownContent).toContain('TestContract4');
    });

    it('should create unique filenames for multiple reports', () => {
      const { jsonPath: jsonPath1, markdownPath: markdownPath1 } = saveReportToFiles(tempReport);
      
      // Wait a bit to ensure different timestamps
      const newReport = generateReport(singleContractAnalysis);
      const { jsonPath: jsonPath2, markdownPath: markdownPath2 } = saveReportToFiles(newReport);
      
      expect(jsonPath1).not.toBe(jsonPath2);
      expect(markdownPath1).not.toBe(markdownPath2);
    });

    it('should handle file system errors gracefully', () => {
      // Create a report with invalid characters that would cause file system errors
      const invalidReport = { ...tempReport };
      
      // Mock writeFileSync to throw an error
      const originalWriteFileSync = require('fs').writeFileSync;
      require('fs').writeFileSync = jest.fn().mockImplementation(() => {
        throw new Error('Disk full');
      });
      
      expect(() => {
        saveReportToFiles(invalidReport);
      }).toThrow(AnalysisError);
      
      // Restore original function
      require('fs').writeFileSync = originalWriteFileSync;
    });
  });

  describe('generateAndSaveReport', () => {
    afterEach(() => {
      // Clean up test files
      try {
        const outputDir = config.analysisOutputDir;
        if (existsSync(outputDir)) {
          const files = require('fs').readdirSync(outputDir);
          files.forEach((file: string) => {
            if (file.startsWith('analysis-report-')) {
              rmSync(join(outputDir, file), { force: true });
            }
          });
        }
      } catch (error) {
        // Ignore cleanup errors
      }
    });

    it('should generate and save report in one operation', () => {
      const { report, files } = generateAndSaveReport(sampleContractAnalyses);
      
      expect(report).toBeDefined();
      expect(report.contractAnalyses).toHaveLength(4);
      expect(files.jsonPath).toBeDefined();
      expect(files.markdownPath).toBeDefined();
      expect(existsSync(files.jsonPath)).toBe(true);
      expect(existsSync(files.markdownPath)).toBe(true);
    });

    it('should maintain consistency between generated report and saved files', () => {
      const { report, files } = generateAndSaveReport(sampleContractAnalyses);
      
      const jsonContent = readFileSync(files.jsonPath, 'utf8');
      const savedReport = JSON.parse(jsonContent);
      
      expect(savedReport.reportId).toBe(report.reportId);
      expect(savedReport.title).toBe(report.title);
      expect(savedReport.contractAnalyses).toHaveLength(report.contractAnalyses.length);
    });
  });

  describe('getReportStatistics', () => {
    it('should return correct statistics', () => {
      const report = generateReport(sampleContractAnalyses);
      const stats = getReportStatistics(report);
      
      expect(stats.totalContracts).toBe(4);
      expect(stats.completedAnalyses).toBe(3);
      expect(stats.failedAnalyses).toBe(1);
      expect(stats.pendingAnalyses).toBe(0);
      expect(stats.inProgressAnalyses).toBe(0);
      
      expect(stats.riskLevelDistribution.low).toBe(1);
      expect(stats.riskLevelDistribution.medium).toBe(1);
      expect(stats.riskLevelDistribution.high).toBe(1);
      expect(stats.riskLevelDistribution.critical).toBe(1);
      
      expect(stats.totalWarnings).toBeGreaterThan(0);
      expect(stats.securityWarningsByLevel.critical).toBeGreaterThan(0);
      expect(stats.securityWarningsByLevel.error).toBeGreaterThan(0);
      expect(stats.securityWarningsByLevel.warning).toBeGreaterThan(0);
    });

    it('should handle empty warnings correctly', () => {
      const report = generateReport(singleContractAnalysis);
      const stats = getReportStatistics(report);
      
      expect(stats.totalContracts).toBe(1);
      expect(stats.completedAnalyses).toBe(1);
      expect(stats.riskLevelDistribution.low).toBe(1);
      expect(stats.totalWarnings).toBe(0);
      expect(stats.securityWarningsByLevel.critical).toBe(0);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle contract analyses with minimal data', () => {
      const minimalAnalysis: ContractAnalysis[] = [
        {
          contractAddress: '0x1111111111111111111111111111111111111111',
          contractName: 'MinimalContract',
          analysisStatus: 'complete',
          vulnerabilities: [],
          riskLevel: 'low',
          analysisDate: new Date(),
          lastUpdated: new Date(),
        },
      ];
      
      const report = generateReport(minimalAnalysis);
      expect(report).toBeDefined();
      expect(report.contractAnalyses).toHaveLength(1);
    });

    it('should handle contract analyses with extensive metadata', () => {
      const analysisWithMetadata: ContractAnalysis[] = [
        {
          contractAddress: '0x1111111111111111111111111111111111111111',
          contractName: 'MetadataContract',
          analysisStatus: 'complete',
          vulnerabilities: ['test-vulnerability'],
          riskLevel: 'medium',
          analysisDate: new Date(),
          lastUpdated: new Date(),
          metadata: {
            version: '2.0.0',
            compiler: 'solc',
            optimization: true,
            runs: 200,
            libraries: ['OpenZeppelin'],
            customData: {
              nested: {
                value: 'test',
                number: 42,
                boolean: true,
              },
            },
          },
        },
      ];
      
      const report = generateReport(analysisWithMetadata);
      expect(report).toBeDefined();
      expect(report.contractAnalyses[0].metadata).toBeDefined();
      
      const { markdownPath } = saveReportToFiles(report);
      const markdownContent = readFileSync(markdownPath, 'utf8');
      expect(markdownContent).toContain('Metadata');
    });

    it('should handle very large contract analysis arrays', () => {
      const largeAnalysisArray: ContractAnalysis[] = [];
      
      for (let i = 0; i < 100; i++) {
        largeAnalysisArray.push({
          contractAddress: `0x${i.toString(16).padStart(40, '0')}`,
          contractName: `Contract${i}`,
          analysisStatus: 'complete',
          vulnerabilities: i % 3 === 0 ? ['test-vulnerability'] : [],
          riskLevel: ['low', 'medium', 'high', 'critical'][i % 4] as any,
          analysisDate: new Date(),
          lastUpdated: new Date(),
        });
      }
      
      const report = generateReport(largeAnalysisArray);
      expect(report).toBeDefined();
      expect(report.contractAnalyses).toHaveLength(100);
      expect(report.title).toContain('100 Contracts');
    });
  });

  describe('Schema Validation', () => {
    it('should validate generated report against AnalysisReportSchema', () => {
      const report = generateReport(sampleContractAnalyses);
      
      expect(() => {
        AnalysisReportSchema.parse(report);
      }).not.toThrow();
    });

    it('should include all required fields in generated report', () => {
      const report = generateReport(sampleContractAnalyses);
      
      expect(report.reportId).toBeDefined();
      expect(report.title).toBeDefined();
      expect(report.summary).toBeDefined();
      expect(report.contractAnalyses).toBeDefined();
      expect(report.securityWarnings).toBeDefined();
      expect(report.scamPatterns).toBeDefined();
      expect(report.generatedAt).toBeDefined();
      expect(report.version).toBeDefined();
      
      // Validate UUID format
      expect(report.reportId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
      
      // Validate version format
      expect(report.version).toMatch(/^\d+\.\d+\.\d+(-\w+)?$/);
    });
  });
});
