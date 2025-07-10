import { config, areSecurityWarningsEnabled } from './config/environment';
import { validateContractAddress, isKnownMaliciousAddress, generateMaliciousContractWarning } from './utils/validation';
import { SecurityError, AdvancedContractAnalysis, ContractAddress, PatternResult, SecurityWarning } from './types';
import { fetchBytecode, isContract, getBytecodeSize, isProxyContract } from './analysis/bytecode';
import { detectAllPatterns } from './analysis/patternDetection';
import { assessRisk } from './analysis/riskScoring';
import { JsonRpcProvider } from 'ethers';

/**
 * Shuffle.com Airdrop Scam Analysis Tool
 * 
 * This application provides utilities for analyzing smart contracts
 * for potential security vulnerabilities and scam patterns.
 * 
 * ⚠️ CRITICAL WARNING: This tool is for educational and security research purposes only.
 * Never deploy, interact with, or send funds to any analyzed contracts.
 */

export class ScamAnalysisTool {
  private readonly version: string;
  private readonly securityWarningsEnabled: boolean;

  constructor() {
    this.version = config.appVersion;
    this.securityWarningsEnabled = areSecurityWarningsEnabled();
    
    if (this.securityWarningsEnabled) {
      this.displaySecurityWarning();
    }
  }

  /**
   * Display critical security warning
   */
  private displaySecurityWarning(): void {
    console.warn('⚠️ CRITICAL SECURITY WARNING ⚠️');
    console.warn('This tool analyzes malicious smart contracts.');
    console.warn('NEVER interact with or send funds to analyzed contracts.');
    console.warn('Use for educational and security research purposes only.');
    console.warn('');
  }

  /**
   * Analyze a contract address for known security issues (Basic Analysis)
   * @deprecated Use analyzeContractAdvanced for comprehensive analysis
   */
  public analyzeContract(address: string): {
    isValid: boolean;
    isMalicious: boolean;
    warnings: string[];
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
  } {
    try {
      // Validate the contract address format
      const validAddress = validateContractAddress(address);
      
      // Check if it's a known malicious address
      const isMalicious = isKnownMaliciousAddress(validAddress);
      
      const warnings: string[] = [];
      let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';

      if (isMalicious) {
        const warning = generateMaliciousContractWarning(validAddress);
        warnings.push(warning.message);
        riskLevel = 'critical';
      }

      return {
        isValid: true,
        isMalicious,
        warnings,
        riskLevel,
      };
    } catch (error) {
      if (error instanceof SecurityError) {
        return {
          isValid: false,
          isMalicious: false,
          warnings: [error.message],
          riskLevel: error.severity,
        };
      }

      return {
        isValid: false,
        isMalicious: false,
        warnings: [error instanceof Error ? error.message : 'Unknown error'],
        riskLevel: 'medium',
      };
    }
  }

  /**
   * Analyze a contract address with advanced analysis capabilities
   * Includes bytecode analysis, pattern detection, risk scoring, and security warnings
   */
  public async analyzeContractAdvanced(
    address: string,
    provider?: JsonRpcProvider
  ): Promise<AdvancedContractAnalysis> {
    try {
      // Validate the contract address format
      const validAddress = validateContractAddress(address);
      const analysisDate = new Date();
      
      // Initialize basic analysis results
      const basicResult = this.analyzeContract(address);
      
      // Use default provider if not provided
      const rpcProvider = provider || new JsonRpcProvider('https://eth.llamarpc.com');
      
      // Fetch bytecode and basic contract info
      let bytecode: string | undefined;
      let bytecodeSize: number | undefined;
      let isContractAddress: boolean | undefined;
      let isProxy: boolean | undefined;
      
      try {
        bytecode = await fetchBytecode(validAddress, rpcProvider);
        bytecodeSize = getBytecodeSize(bytecode);
        isContractAddress = await isContract(validAddress, rpcProvider);
        isProxy = isProxyContract(bytecode);
      } catch (error) {
        console.warn(`Failed to fetch bytecode for ${validAddress}:`, error);
        // Continue with limited analysis
      }
      
      // Pattern detection (using bytecode if available)
      let patternResults: Record<string, PatternResult> | undefined;
      let riskAssessment: AdvancedContractAnalysis['riskAssessment'] | undefined;
      
      if (bytecode && bytecode !== '0x') {
        try {
          const comprehensiveAnalysis = detectAllPatterns(bytecode);
          patternResults = comprehensiveAnalysis.patternResults;
          
          // Risk assessment
          const riskResult = assessRisk(patternResults);
          riskAssessment = {
            riskScore: riskResult.riskScore,
            confidence: riskResult.confidence,
            breakdown: riskResult.breakdown,
            explanation: riskResult.explanation,
          };
        } catch (error) {
          console.warn(`Pattern detection failed for ${validAddress}:`, error);
        }
      }
      
      // Generate security warnings
      const securityWarnings: SecurityWarning[] = [];
      
      // Add known malicious address warning
      if (basicResult.isMalicious) {
        const maliciousWarning = generateMaliciousContractWarning(validAddress);
        securityWarnings.push(maliciousWarning);
      }
      
      // Add pattern-based warnings
      if (patternResults) {
        Object.entries(patternResults).forEach(([pattern, result]) => {
          if (result.detected) {
            const warningLevel = result.severity === 'critical' ? 'critical' : 
                               result.severity === 'high' ? 'error' : 'warning';
            
            securityWarnings.push({
              level: warningLevel,
              message: `${pattern.replace('-', ' ')} pattern detected: ${result.description}`,
              contractAddress: validAddress,
              timestamp: analysisDate,
              category: result.category,
            });
          }
        });
      }
      
      // Add security warnings if enabled
      if (this.securityWarningsEnabled) {
        securityWarnings.push({
          level: 'warning',
          message: 'This tool is for educational and security research purposes only. Never interact with analyzed contracts.',
          contractAddress: validAddress,
          timestamp: analysisDate,
          category: 'deceptive-events',
        });
      }
      
      // Build comprehensive vulnerabilities list
      const vulnerabilities = [...basicResult.warnings];
      if (patternResults) {
        Object.entries(patternResults).forEach(([pattern, result]) => {
          if (result.detected) {
            vulnerabilities.push(
              `${pattern.replace('-', ' ')} (confidence: ${Math.round(result.confidence * 100)}%)`
            );
          }
        });
      }
      
      // Determine overall risk level
      let overallRiskLevel: 'low' | 'medium' | 'high' | 'critical' = basicResult.riskLevel;
      
      // Use risk assessment if available
      if (riskAssessment) {
        if (riskAssessment.explanation.summary.includes('critical')) {
          overallRiskLevel = 'critical';
        } else if (riskAssessment.explanation.summary.includes('high')) {
          overallRiskLevel = 'high';
        } else if (riskAssessment.explanation.summary.includes('medium')) {
          overallRiskLevel = 'medium';
        } else {
          overallRiskLevel = 'low';
        }
      }
      
      // Override with critical if known malicious
      if (basicResult.isMalicious) {
        overallRiskLevel = 'critical';
      }
      
      // Construct advanced analysis result
      const advancedAnalysis: AdvancedContractAnalysis = {
        contractAddress: validAddress,
        contractName: `Contract_${validAddress.slice(0, 8)}`,
        analysisStatus: 'complete',
        vulnerabilities,
        riskLevel: overallRiskLevel,
        analysisDate,
        lastUpdated: analysisDate,
        metadata: {
          analysisVersion: this.version,
          provider: provider ? 'custom' : 'default',
          processingTime: Date.now() - analysisDate.getTime(),
        },
        // Advanced fields
        bytecode,
        bytecodeSize,
        isContract: isContractAddress,
        isProxyContract: isProxy,
        patternResults,
        riskAssessment,
        securityWarnings,
      };
      
      return advancedAnalysis;
    } catch (error) {
      if (error instanceof SecurityError) {
        // Return failed analysis with error information
        return {
          contractAddress: address as ContractAddress,
          contractName: `Contract_${address.slice(0, 8)}`,
          analysisStatus: 'failed',
          vulnerabilities: [error.message],
          riskLevel: error.severity,
          analysisDate: new Date(),
          lastUpdated: new Date(),
          metadata: {
            error: error.message,
            errorType: error.constructor.name,
          },
          securityWarnings: [{
            level: 'error',
            message: `Analysis failed: ${error.message}`,
            contractAddress: address as ContractAddress,
            timestamp: new Date(),
            category: 'deceptive-events',
          }],
        };
      }
      
      // Generic error handling
      return {
        contractAddress: address as ContractAddress,
        contractName: `Contract_${address.slice(0, 8)}`,
        analysisStatus: 'failed',
        vulnerabilities: [error instanceof Error ? error.message : 'Unknown error'],
        riskLevel: 'medium',
        analysisDate: new Date(),
        lastUpdated: new Date(),
        metadata: {
          error: error instanceof Error ? error.message : 'Unknown error',
          errorType: error instanceof Error ? error.constructor.name : 'UnknownError',
        },
        securityWarnings: [{
          level: 'error',
          message: `Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          contractAddress: address as ContractAddress,
          timestamp: new Date(),
          category: 'deceptive-events',
        }],
      };
    }
  }

  /**
   * Get tool version information
   */
  public getVersion(): string {
    return this.version;
  }

  /**
   * Get security configuration status
   */
  public getSecurityStatus(): {
    warningsEnabled: boolean;
    version: string;
    environment: string;
  } {
    return {
      warningsEnabled: this.securityWarningsEnabled,
      version: this.version,
      environment: config.nodeEnv,
    };
  }
}

// Export main functionality
export * from './types';
export * from './config/environment';
export * from './utils/validation';
export * from './analysis/bytecode';
export * from './analysis/patternDetection';
export * from './analysis/riskScoring';

// Default export for convenience
export default ScamAnalysisTool;
