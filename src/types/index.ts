import { z } from 'zod';

// Smart Contract Analysis Types
export const ContractAddressSchema = z.string().regex(/^0x[a-fA-F0-9]{40}$/, {
  message: 'Invalid Ethereum address format',
});

// Pattern Detection Types (defined early for reference)
export const PatternResultSchema = z.object({
  detected: z.boolean(),
  confidence: z.number().min(0).max(1),
  category: z.enum(['deceptive-events', 'hidden-redirection', 'fake-balance', 'non-functional-transfer']),
  description: z.string(),
  evidence: z.array(z.string()),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const SecurityWarningSchema = z.object({
  level: z.enum(['info', 'warning', 'error', 'critical']),
  message: z.string().min(1, 'Warning message is required'),
  contractAddress: ContractAddressSchema.optional(),
  timestamp: z.date(),
  category: z.enum(['deceptive-events', 'hidden-redirection', 'fake-balance', 'non-functional-transfer']),
});

// Basic Contract Analysis Schema (for backward compatibility)
export const ContractAnalysisSchema = z.object({
  contractAddress: ContractAddressSchema,
  contractName: z.string().min(1, 'Contract name is required'),
  analysisStatus: z.enum(['pending', 'complete', 'failed', 'in-progress']),
  vulnerabilities: z.array(z.string()),
  riskLevel: z.enum(['low', 'medium', 'high', 'critical']),
  analysisDate: z.date(),
  lastUpdated: z.date(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

// Advanced Contract Analysis Schema with full analysis capabilities
export const AdvancedContractAnalysisSchema = z.object({
  contractAddress: ContractAddressSchema,
  contractName: z.string().min(1, 'Contract name is required'),
  analysisStatus: z.enum(['pending', 'complete', 'failed', 'in-progress']),
  vulnerabilities: z.array(z.string()),
  riskLevel: z.enum(['low', 'medium', 'high', 'critical']),
  analysisDate: z.date(),
  lastUpdated: z.date(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  // Advanced analysis fields
  bytecode: z.string().optional(), // Contract bytecode
  bytecodeSize: z.number().optional(), // Size in bytes
  isContract: z.boolean().optional(), // Whether address is a contract
  isProxyContract: z.boolean().optional(), // Whether it's a proxy contract
  patternResults: z.record(z.string(), PatternResultSchema).optional(), // Pattern detection results
  riskAssessment: z.object({
    riskScore: z.number().min(0).max(1), // Numeric risk score 0-1
    confidence: z.number().min(0).max(1), // Overall confidence
    breakdown: z.object({
      patternScores: z.record(z.string(), z.object({
        weight: z.number(),
        confidence: z.number(),
        severity: z.enum(['low', 'medium', 'high', 'critical']),
        contribution: z.number(),
        detected: z.boolean(),
      })),
      baseScore: z.number(),
      bonusScore: z.number(),
      penaltyScore: z.number(),
      finalScore: z.number(),
    }),
    explanation: z.object({
      summary: z.string(),
      riskFactors: z.array(z.string()),
      mitigatingFactors: z.array(z.string()),
      recommendations: z.array(z.string()),
    }),
  }).optional(),
  securityWarnings: z.array(SecurityWarningSchema).optional(), // Generated security warnings
});

export const AirdropScamPatternSchema = z.object({
  patternId: z.string().min(1, 'Pattern ID is required'),
  patternName: z.string().min(1, 'Pattern name is required'),
  description: z.string().min(1, 'Description is required'),
  detectionMethods: z.array(z.string()).min(1, 'At least one detection method required'),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  exampleContracts: z.array(ContractAddressSchema),
  mitigationStrategies: z.array(z.string()),
});

export const AnalysisReportSchema = z.object({
  reportId: z.string().uuid(),
  title: z.string().min(1, 'Report title is required'),
  summary: z.string().min(1, 'Report summary is required'),
  contractAnalyses: z.array(ContractAnalysisSchema),
  securityWarnings: z.array(SecurityWarningSchema),
  scamPatterns: z.array(AirdropScamPatternSchema),
  generatedAt: z.date(),
  version: z.string().regex(/^\d+\.\d+\.\d+(-\w+)?$/, 'Invalid version format'),
});

// Configuration Types
export const EnvironmentConfigSchema = z.object({
  nodeEnv: z.enum(['development', 'production', 'test']),
  appName: z.string().min(1),
  appVersion: z.string().regex(/^\d+\.\d+\.\d+(-\w+)?$/),
  logLevel: z.enum(['error', 'warn', 'info', 'debug']),
  enableSecurityWarnings: z.boolean(),
  requireExplicitConsent: z.boolean(),
  analysisOutputDir: z.string().min(1),
  testTimeout: z.number().positive(),
  coverageThreshold: z.number().min(0).max(100),
});

// Export types
export type ContractAddress = z.infer<typeof ContractAddressSchema>;
export type ContractAnalysis = z.infer<typeof ContractAnalysisSchema>;
export type AdvancedContractAnalysis = z.infer<typeof AdvancedContractAnalysisSchema>;
export type SecurityWarning = z.infer<typeof SecurityWarningSchema>;
export type AirdropScamPattern = z.infer<typeof AirdropScamPatternSchema>;
export type AnalysisReport = z.infer<typeof AnalysisReportSchema>;
export type EnvironmentConfig = z.infer<typeof EnvironmentConfigSchema>;

// Analysis status types
export type AnalysisStatus = 'pending' | 'complete' | 'failed' | 'in-progress';
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
export type WarningLevel = 'info' | 'warning' | 'error' | 'critical';
export type ScamCategory = 'deceptive-events' | 'hidden-redirection' | 'fake-balance' | 'non-functional-transfer';

// Additional Pattern Detection Types

export const ABISchema = z.array(z.object({
  name: z.string().optional(),
  type: z.string(),
  inputs: z.array(z.object({
    name: z.string(),
    type: z.string(),
    indexed: z.boolean().optional(),
  })).optional(),
  outputs: z.array(z.object({
    name: z.string(),
    type: z.string(),
  })).optional(),
  stateMutability: z.string().optional(),
  anonymous: z.boolean().optional(),
}));

export const BytecodeAnalysisSchema = z.string().min(2).regex(/^0x[a-fA-F0-9]*$/);

export type PatternResult = z.infer<typeof PatternResultSchema>;
export type ABI = z.infer<typeof ABISchema>;
export type BytecodeAnalysis = z.infer<typeof BytecodeAnalysisSchema>;

// Error types
export class ValidationError extends Error {
  constructor(
    message: string,
    public readonly field: string,
    public readonly value: unknown
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class AnalysisError extends Error {
  constructor(
    message: string,
    public readonly contractAddress?: ContractAddress,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = 'AnalysisError';
  }
}

export class SecurityError extends Error {
  constructor(
    message: string,
    public readonly severity: RiskLevel = 'high',
    public readonly contractAddress?: ContractAddress
  ) {
    super(message);
    this.name = 'SecurityError';
  }
}
