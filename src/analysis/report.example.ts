/**
 * Example usage of the report generator
 * This file demonstrates how to use the analysis report generator
 */

import { generateReport, generateAndSaveReport, getReportStatistics } from './report';
import { ContractAnalysis } from '../types';

// Example contract analyses data
const exampleContractAnalyses: ContractAnalysis[] = [
  {
    contractAddress: '0xacba164135904dc63c5418b57ff87efd341d7c80',
    contractName: 'MaliciousAirdropContract',
    analysisStatus: 'complete',
    vulnerabilities: [
      'non-functional-transfer',
      'deceptive-events',
      'fake-balance-display'
    ],
    riskLevel: 'critical',
    analysisDate: new Date('2023-12-01'),
    lastUpdated: new Date('2023-12-01'),
    metadata: {
      compiler: 'solc',
      version: '0.8.19',
      optimization: true,
      detectedPatterns: ['fake-token', 'honeypot'],
      gasLimit: 300000,
      deploymentDate: '2023-11-15'
    }
  },
  {
    contractAddress: '0xA995507632B358bA63f8A39616930f8A696bfd8d',
    contractName: 'SuspiciousRewardContract',
    analysisStatus: 'complete',
    vulnerabilities: [
      'hidden-redirection',
      'unreachable-code'
    ],
    riskLevel: 'high',
    analysisDate: new Date('2023-12-01'),
    lastUpdated: new Date('2023-12-01'),
    metadata: {
      compiler: 'solc',
      version: '0.8.17',
      optimization: false,
      detectedPatterns: ['redirect-funds'],
      gasLimit: 250000
    }
  },
  {
    contractAddress: '0x1234567890abcdef1234567890abcdef12345678',
    contractName: 'LegitimateERC20Token',
    analysisStatus: 'complete',
    vulnerabilities: [],
    riskLevel: 'low',
    analysisDate: new Date('2023-12-01'),
    lastUpdated: new Date('2023-12-01'),
    metadata: {
      compiler: 'solc',
      version: '0.8.20',
      optimization: true,
      standard: 'ERC20',
      totalSupply: '1000000000000000000000000'
    }
  },
  {
    contractAddress: '0xfedcba9876543210fedcba9876543210fedcba98',
    contractName: 'UnanalyzedContract',
    analysisStatus: 'failed',
    vulnerabilities: [],
    riskLevel: 'medium',
    analysisDate: new Date('2023-12-01'),
    lastUpdated: new Date('2023-12-01'),
    metadata: {
      error: 'Bytecode could not be retrieved',
      retryCount: 3
    }
  },
  {
    contractAddress: '0x9999999999999999999999999999999999999999',
    contractName: 'PendingAnalysisContract',
    analysisStatus: 'pending',
    vulnerabilities: [],
    riskLevel: 'low',
    analysisDate: new Date('2023-12-01'),
    lastUpdated: new Date('2023-12-01'),
    metadata: {
      queuePosition: 5,
      estimatedCompletionTime: '2023-12-01T15:30:00Z'
    }
  }
];

/**
 * Example 1: Generate a report without saving to files
 */
export function exampleGenerateReport() {
  console.log('=== Example 1: Generate Report ===');
  
  try {
    const report = generateReport(exampleContractAnalyses);
    
    console.log(`Report ID: ${report.reportId}`);
    console.log(`Title: ${report.title}`);
    console.log(`Summary: ${report.summary}`);
    console.log(`Generated At: ${report.generatedAt.toISOString()}`);
    console.log(`Version: ${report.version}`);
    console.log(`Contracts Analyzed: ${report.contractAnalyses.length}`);
    console.log(`Security Warnings: ${report.securityWarnings.length}`);
    console.log(`Scam Patterns: ${report.scamPatterns.length}`);
    
    return report;
  } catch (error) {
    console.error('Error generating report:', error);
    throw error;
  }
}

/**
 * Example 2: Generate and save report to files
 */
export function exampleGenerateAndSaveReport() {
  console.log('\n=== Example 2: Generate and Save Report ===');
  
  try {
    const { report, files } = generateAndSaveReport(exampleContractAnalyses);
    
    console.log(`Report generated successfully:`);
    console.log(`- Report ID: ${report.reportId}`);
    console.log(`- JSON file: ${files.jsonPath}`);
    console.log(`- Markdown file: ${files.markdownPath}`);
    
    console.log('\nFile contents preview:');
    console.log(`JSON file size: ${require('fs').statSync(files.jsonPath).size} bytes`);
    console.log(`Markdown file size: ${require('fs').statSync(files.markdownPath).size} bytes`);
    
    return { report, files };
  } catch (error) {
    console.error('Error generating and saving report:', error);
    throw error;
  }
}

/**
 * Example 3: Get detailed statistics from a report
 */
export function exampleGetReportStatistics() {
  console.log('\n=== Example 3: Get Report Statistics ===');
  
  try {
    const report = generateReport(exampleContractAnalyses);
    const stats = getReportStatistics(report);
    
    console.log('Contract Analysis Statistics:');
    console.log(`- Total Contracts: ${stats.totalContracts}`);
    console.log(`- Completed Analyses: ${stats.completedAnalyses}`);
    console.log(`- Failed Analyses: ${stats.failedAnalyses}`);
    console.log(`- Pending Analyses: ${stats.pendingAnalyses}`);
    console.log(`- In Progress Analyses: ${stats.inProgressAnalyses}`);
    
    console.log('\nRisk Level Distribution:');
    console.log(`- Low Risk: ${stats.riskLevelDistribution.low}`);
    console.log(`- Medium Risk: ${stats.riskLevelDistribution.medium}`);
    console.log(`- High Risk: ${stats.riskLevelDistribution.high}`);
    console.log(`- Critical Risk: ${stats.riskLevelDistribution.critical}`);
    
    console.log('\nSecurity Warnings by Level:');
    console.log(`- Info: ${stats.securityWarningsByLevel.info}`);
    console.log(`- Warning: ${stats.securityWarningsByLevel.warning}`);
    console.log(`- Error: ${stats.securityWarningsByLevel.error}`);
    console.log(`- Critical: ${stats.securityWarningsByLevel.critical}`);
    console.log(`- Total Warnings: ${stats.totalWarnings}`);
    
    return stats;
  } catch (error) {
    console.error('Error getting report statistics:', error);
    throw error;
  }
}

/**
 * Example 4: Handle different contract analysis scenarios
 */
export function exampleHandleEdgeCases() {
  console.log('\n=== Example 4: Handle Edge Cases ===');
  
  // Test with minimal data
  const minimalAnalysis: ContractAnalysis[] = [
    {
      contractAddress: '0x1111111111111111111111111111111111111111',
      contractName: 'MinimalContract',
      analysisStatus: 'complete',
      vulnerabilities: [],
      riskLevel: 'low',
      analysisDate: new Date(),
      lastUpdated: new Date(),
    }
  ];
  
  try {
    console.log('Testing with minimal contract data...');
    const minimalReport = generateReport(minimalAnalysis);
    console.log(`✓ Minimal report generated: ${minimalReport.contractAnalyses.length} contract(s)`);
    
    // Test with extensive metadata
    const extensiveAnalysis: ContractAnalysis[] = [
      {
        contractAddress: '0x2222222222222222222222222222222222222222',
        contractName: 'ExtensiveContract',
        analysisStatus: 'complete',
        vulnerabilities: ['vulnerability1', 'vulnerability2', 'vulnerability3'],
        riskLevel: 'high',
        analysisDate: new Date(),
        lastUpdated: new Date(),
        metadata: {
          version: '2.0.0',
          compiler: 'solc',
          optimization: true,
          runs: 200,
          libraries: ['OpenZeppelin', 'Chainlink'],
          customData: {
            nested: {
              value: 'test',
              number: 42,
              boolean: true,
              array: [1, 2, 3],
              object: {
                key: 'value'
              }
            }
          },
          analysis: {
            patterns: ['pattern1', 'pattern2'],
            confidence: 0.95,
            executionTime: 45.67
          }
        }
      }
    ];
    
    console.log('Testing with extensive metadata...');
    const extensiveReport = generateReport(extensiveAnalysis);
    console.log(`✓ Extensive report generated: ${extensiveReport.contractAnalyses.length} contract(s)`);
    console.log(`✓ Metadata preserved: ${JSON.stringify(extensiveReport.contractAnalyses[0].metadata).length} characters`);
    
    return { minimalReport, extensiveReport };
  } catch (error) {
    console.error('Error handling edge cases:', error);
    throw error;
  }
}

/**
 * Example 5: Error handling demonstration
 */
export function exampleErrorHandling() {
  console.log('\n=== Example 5: Error Handling ===');
  
  try {
    // Test with empty array
    console.log('Testing with empty contract analyses array...');
    try {
      generateReport([]);
    } catch (error) {
      console.log(`✓ Expected error caught: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    
    // Test with null input
    console.log('Testing with null input...');
    try {
      generateReport(null as any);
    } catch (error) {
      console.log(`✓ Expected error caught: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    
    // Test with undefined input
    console.log('Testing with undefined input...');
    try {
      generateReport(undefined as any);
    } catch (error) {
      console.log(`✓ Expected error caught: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    
    console.log('Error handling tests completed successfully');
  } catch (error) {
    console.error('Unexpected error in error handling tests:', error);
    throw error;
  }
}

/**
 * Run all examples
 */
export function runAllExamples() {
  console.log('🚀 Running Analysis Report Generator Examples\n');
  
  try {
    // Run all example functions
    const report = exampleGenerateReport();
    const { files } = exampleGenerateAndSaveReport();
    const stats = exampleGetReportStatistics();
    const edgeCases = exampleHandleEdgeCases();
    exampleErrorHandling();
    
    console.log('\n✅ All examples completed successfully!');
    console.log(`\nGenerated files:`);
    console.log(`- JSON: ${files.jsonPath}`);
    console.log(`- Markdown: ${files.markdownPath}`);
    
    return {
      report,
      files,
      stats,
      edgeCases
    };
  } catch (error) {
    console.error('❌ Error running examples:', error);
    throw error;
  }
}

// Run examples if this file is executed directly
if (require.main === module) {
  runAllExamples();
}
