import { z } from 'zod';

// Smart Contract Analysis Types
export const ContractAddressSchema = z.string().regex(/^0x[a-fA-F0-9]{40}$/, {
  message: 'Invalid Ethereum address format',
});

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

export const SecurityWarningSchema = z.object({
  level: z.enum(['info', 'warning', 'error', 'critical']),
  message: z.string().min(1, 'Warning message is required'),
  contractAddress: ContractAddressSchema.optional(),
  timestamp: z.date(),
  category: z.enum(['deceptive-events', 'hidden-redirection', 'fake-balance', 'non-functional-transfer']),
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
export type SecurityWarning = z.infer<typeof SecurityWarningSchema>;
export type AirdropScamPattern = z.infer<typeof AirdropScamPatternSchema>;
export type AnalysisReport = z.infer<typeof AnalysisReportSchema>;
export type EnvironmentConfig = z.infer<typeof EnvironmentConfigSchema>;

// Analysis status types
export type AnalysisStatus = 'pending' | 'complete' | 'failed' | 'in-progress';
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
export type WarningLevel = 'info' | 'warning' | 'error' | 'critical';
export type ScamCategory = 'deceptive-events' | 'hidden-redirection' | 'fake-balance' | 'non-functional-transfer';

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
