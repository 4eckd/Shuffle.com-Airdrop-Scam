import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, resolve } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { 
  ContractAnalysis, 
  AnalysisReport, 
  AnalysisReportSchema,
  SecurityWarning,
  AnalysisError,
  ValidationError
} from '../types';
import { config } from '../config/environment';

/**
 * Generate a comprehensive analysis report from contract analyses
 */
export function generateReport(contractAnalyses: ContractAnalysis[]): AnalysisReport {
  if (!contractAnalyses || contractAnalyses.length === 0) {
    throw new ValidationError('Contract analyses array cannot be empty', 'contractAnalyses', contractAnalyses);
  }

  // Generate report metadata
  const reportId = uuidv4();
  const generatedAt = new Date();
  const version = config.appVersion;

  // Generate summary statistics
  const totalContracts = contractAnalyses.length;
  const completedAnalyses = contractAnalyses.filter(a => a.analysisStatus === 'complete').length;
  const failedAnalyses = contractAnalyses.filter(a => a.analysisStatus === 'failed').length;

  // Risk level distribution
  const riskLevelCounts = {
    low: contractAnalyses.filter(a => a.riskLevel === 'low').length,
    medium: contractAnalyses.filter(a => a.riskLevel === 'medium').length,
    high: contractAnalyses.filter(a => a.riskLevel === 'high').length,
    critical: contractAnalyses.filter(a => a.riskLevel === 'critical').length,
  };

  // Generate comprehensive security warnings
  const securityWarnings = generateSecurityWarnings(contractAnalyses);

  // Generate scam patterns (placeholder - would be populated by pattern detection)
  const scamPatterns = generateScamPatterns(contractAnalyses);

  // Create report title and summary
  const highRiskCount = riskLevelCounts.high + riskLevelCounts.critical;
  const title = `Smart Contract Security Analysis Report - ${totalContracts} Contracts`;
  const summary = generateReportSummary(
    totalContracts,
    completedAnalyses,
    failedAnalyses,
    highRiskCount,
    securityWarnings.length
  );

  // Create the report object
  const report: AnalysisReport = {
    reportId,
    title,
    summary,
    contractAnalyses,
    securityWarnings,
    scamPatterns,
    generatedAt,
    version,
  };

  // Validate the report
  try {
    AnalysisReportSchema.parse(report);
  } catch (error) {
    throw new ValidationError(
      'Generated report failed validation',
      'report',
      report
    );
  }

  return report;
}

/**
 * Save report to analysis-output directory in both JSON and Markdown formats
 */
export function saveReportToFiles(report: AnalysisReport): { jsonPath: string; markdownPath: string } {
  const outputDir = validateAndEnsureOutputDirectory();
  
  // Generate filenames with timestamp
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const baseFilename = `analysis-report-${timestamp}`;
  
  const jsonPath = join(outputDir, `${baseFilename}.json`);
  const markdownPath = join(outputDir, `${baseFilename}.md`);

  try {
    // Save JSON version
    const jsonContent = JSON.stringify(report, null, 2);
    writeFileSync(jsonPath, jsonContent, 'utf8');

    // Save Markdown version
    const markdownContent = generateMarkdownReport(report);
    writeFileSync(markdownPath, markdownContent, 'utf8');

    return {
      jsonPath: resolve(jsonPath),
      markdownPath: resolve(markdownPath),
    };
  } catch (error) {
    throw new AnalysisError(
      `Failed to save report files: ${error instanceof Error ? error.message : 'Unknown error'}`,
      undefined,
      error instanceof Error ? error : undefined
    );
  }
}

/**
 * Generate and save a complete analysis report
 */
export function generateAndSaveReport(contractAnalyses: ContractAnalysis[]): {
  report: AnalysisReport;
  files: { jsonPath: string; markdownPath: string };
} {
  const report = generateReport(contractAnalyses);
  const files = saveReportToFiles(report);
  
  return { report, files };
}

/**
 * Validate and ensure the output directory exists
 */
function validateAndEnsureOutputDirectory(): string {
  const outputDir = resolve(config.analysisOutputDir);
  
  if (!existsSync(outputDir)) {
    try {
      mkdirSync(outputDir, { recursive: true });
    } catch (error) {
      throw new AnalysisError(
        `Failed to create output directory: ${outputDir}`,
        undefined,
        error instanceof Error ? error : undefined
      );
    }
  }

  return outputDir;
}

/**
 * Generate security warnings from contract analyses
 */
function generateSecurityWarnings(contractAnalyses: ContractAnalysis[]): SecurityWarning[] {
  const warnings: SecurityWarning[] = [];

  for (const analysis of contractAnalyses) {
    // Generate warnings for high/critical risk contracts
    if (analysis.riskLevel === 'high' || analysis.riskLevel === 'critical') {
      warnings.push({
        level: analysis.riskLevel === 'critical' ? 'critical' : 'error',
        message: `Contract ${analysis.contractName} (${analysis.contractAddress}) has been classified as ${analysis.riskLevel} risk`,
        contractAddress: analysis.contractAddress,
        timestamp: new Date(),
        category: 'deceptive-events', // Default category
      });
    }

    // Generate warnings for failed analyses
    if (analysis.analysisStatus === 'failed') {
      warnings.push({
        level: 'warning',
        message: `Analysis failed for contract ${analysis.contractName} (${analysis.contractAddress})`,
        contractAddress: analysis.contractAddress,
        timestamp: new Date(),
        category: 'deceptive-events',
      });
    }

    // Generate warnings for contracts with vulnerabilities
    if (analysis.vulnerabilities.length > 0) {
      warnings.push({
        level: 'error',
        message: `Contract ${analysis.contractName} has ${analysis.vulnerabilities.length} known vulnerabilities: ${analysis.vulnerabilities.join(', ')}`,
        contractAddress: analysis.contractAddress,
        timestamp: new Date(),
        category: 'deceptive-events',
      });
    }
  }

  return warnings;
}

/**
 * Generate scam patterns from contract analyses
 */
function generateScamPatterns(_contractAnalyses: ContractAnalysis[]) {
  // This would typically be populated by pattern detection analysis
  // For now, return empty array as patterns are detected separately
  return [];
}

/**
 * Generate report summary text
 */
function generateReportSummary(
  totalContracts: number,
  completedAnalyses: number,
  failedAnalyses: number,
  highRiskCount: number,
  warningCount: number
): string {
  const completionRate = Math.round((completedAnalyses / totalContracts) * 100);
  
  return `Analysis completed for ${totalContracts} smart contracts with ${completionRate}% success rate. ` +
    `${highRiskCount} contracts flagged as high or critical risk. ` +
    `${warningCount} security warnings generated. ` +
    `${failedAnalyses} analyses failed and require manual review.`;
}

/**
 * Generate Markdown formatted report
 */
function generateMarkdownReport(report: AnalysisReport): string {
  const { title, summary, contractAnalyses, securityWarnings, generatedAt, version } = report;
  
  let markdown = `# ${title}\n\n`;
  markdown += `**Generated:** ${generatedAt.toISOString()}\n`;
  markdown += `**Tool Version:** ${version}\n`;
  markdown += `**Report ID:** ${report.reportId}\n\n`;
  
  // Summary section
  markdown += `## Executive Summary\n\n${summary}\n\n`;
  
  // Statistics section
  markdown += `## Analysis Statistics\n\n`;
  markdown += `- **Total Contracts Analyzed:** ${contractAnalyses.length}\n`;
  markdown += `- **Completed Analyses:** ${contractAnalyses.filter(a => a.analysisStatus === 'complete').length}\n`;
  markdown += `- **Failed Analyses:** ${contractAnalyses.filter(a => a.analysisStatus === 'failed').length}\n`;
  markdown += `- **High/Critical Risk Contracts:** ${contractAnalyses.filter(a => a.riskLevel === 'high' || a.riskLevel === 'critical').length}\n`;
  markdown += `- **Security Warnings:** ${securityWarnings.length}\n\n`;
  
  // Risk distribution
  const riskCounts = {
    low: contractAnalyses.filter(a => a.riskLevel === 'low').length,
    medium: contractAnalyses.filter(a => a.riskLevel === 'medium').length,
    high: contractAnalyses.filter(a => a.riskLevel === 'high').length,
    critical: contractAnalyses.filter(a => a.riskLevel === 'critical').length,
  };
  
  markdown += `## Risk Level Distribution\n\n`;
  markdown += `| Risk Level | Count | Percentage |\n`;
  markdown += `|------------|-------|------------|\n`;
  markdown += `| Low | ${riskCounts.low} | ${Math.round((riskCounts.low / contractAnalyses.length) * 100)}% |\n`;
  markdown += `| Medium | ${riskCounts.medium} | ${Math.round((riskCounts.medium / contractAnalyses.length) * 100)}% |\n`;
  markdown += `| High | ${riskCounts.high} | ${Math.round((riskCounts.high / contractAnalyses.length) * 100)}% |\n`;
  markdown += `| Critical | ${riskCounts.critical} | ${Math.round((riskCounts.critical / contractAnalyses.length) * 100)}% |\n\n`;
  
  // Security warnings section
  if (securityWarnings.length > 0) {
    markdown += `## Security Warnings\n\n`;
    for (const warning of securityWarnings) {
      const level = warning.level.toUpperCase();
      markdown += `### ${level}: ${warning.message}\n`;
      if (warning.contractAddress) {
        markdown += `**Contract:** ${warning.contractAddress}\n`;
      }
      markdown += `**Category:** ${warning.category}\n`;
      markdown += `**Timestamp:** ${warning.timestamp.toISOString()}\n\n`;
    }
  }
  
  // Contract analyses section
  markdown += `## Contract Analysis Details\n\n`;
  for (const analysis of contractAnalyses) {
    markdown += `### ${analysis.contractName}\n\n`;
    markdown += `- **Address:** \`${analysis.contractAddress}\`\n`;
    markdown += `- **Status:** ${analysis.analysisStatus}\n`;
    markdown += `- **Risk Level:** ${analysis.riskLevel}\n`;
    markdown += `- **Analysis Date:** ${analysis.analysisDate.toISOString()}\n`;
    markdown += `- **Last Updated:** ${analysis.lastUpdated.toISOString()}\n`;
    
    if (analysis.vulnerabilities.length > 0) {
      markdown += `- **Vulnerabilities:**\n`;
      for (const vuln of analysis.vulnerabilities) {
        markdown += `  - ${vuln}\n`;
      }
    }
    
    if (analysis.metadata) {
      markdown += `- **Metadata:** ${JSON.stringify(analysis.metadata, null, 2)}\n`;
    }
    
    markdown += `\n`;
  }
  
  // Footer
  markdown += `---\n\n`;
  markdown += `*This report was generated automatically by the Shuffle Airdrop Scam Analysis Tool v${version}*\n`;
  markdown += `*For questions or concerns, please refer to the project documentation.*\n`;
  
  return markdown;
}

/**
 * Get summary statistics from a report
 */
export function getReportStatistics(report: AnalysisReport) {
  const { contractAnalyses, securityWarnings } = report;
  
  return {
    totalContracts: contractAnalyses.length,
    completedAnalyses: contractAnalyses.filter(a => a.analysisStatus === 'complete').length,
    failedAnalyses: contractAnalyses.filter(a => a.analysisStatus === 'failed').length,
    pendingAnalyses: contractAnalyses.filter(a => a.analysisStatus === 'pending').length,
    inProgressAnalyses: contractAnalyses.filter(a => a.analysisStatus === 'in-progress').length,
    riskLevelDistribution: {
      low: contractAnalyses.filter(a => a.riskLevel === 'low').length,
      medium: contractAnalyses.filter(a => a.riskLevel === 'medium').length,
      high: contractAnalyses.filter(a => a.riskLevel === 'high').length,
      critical: contractAnalyses.filter(a => a.riskLevel === 'critical').length,
    },
    securityWarningsByLevel: {
      info: securityWarnings.filter(w => w.level === 'info').length,
      warning: securityWarnings.filter(w => w.level === 'warning').length,
      error: securityWarnings.filter(w => w.level === 'error').length,
      critical: securityWarnings.filter(w => w.level === 'critical').length,
    },
    totalWarnings: securityWarnings.length,
  };
}
