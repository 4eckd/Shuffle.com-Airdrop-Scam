import { config, areSecurityWarningsEnabled } from './config/environment';
import { validateContractAddress, isKnownMaliciousAddress, generateMaliciousContractWarning } from './utils/validation';
import { SecurityError } from './types';

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
   * Analyze a contract address for known security issues
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

// Default export for convenience
export default ScamAnalysisTool;
