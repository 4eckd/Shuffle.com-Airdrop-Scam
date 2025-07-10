import { z } from 'zod';
import { PatternResult, PatternResultSchema, ABI, ScamCategory } from '../types';
import * as deceptiveEvents from './patterns/deceptive-events';
import * as hiddenRedirection from './patterns/hidden-redirection';
import * as fakeBalance from './patterns/fake-balance';
import * as nonFunctionalTransfer from './patterns/non-functional-transfer';

/**
 * Comprehensive pattern detection aggregator
 * 
 * This module provides unified access to all scam pattern detectors,
 * allowing for both individual pattern detection and comprehensive
 * analysis across all patterns.
 */

// Detector registry
const DETECTORS = {
  'deceptive-events': deceptiveEvents.detect,
  'hidden-redirection': hiddenRedirection.detect,
  'fake-balance': fakeBalance.detect,
  'non-functional-transfer': nonFunctionalTransfer.detect,
} as const;

// Comprehensive analysis result schema
export const ComprehensiveAnalysisResultSchema = z.object({
  overallDetected: z.boolean(),
  overallConfidence: z.number().min(0).max(1),
  overallSeverity: z.enum(['low', 'medium', 'high', 'critical']),
  overallRiskScore: z.number().min(0).max(100),
  summary: z.string(),
  detectedPatterns: z.array(z.enum(['deceptive-events', 'hidden-redirection', 'fake-balance', 'non-functional-transfer'])),
  patternResults: z.record(z.string(), PatternResultSchema),
  metadata: z.object({
    analysisDate: z.date(),
    totalPatternsAnalyzed: z.number(),
    totalPatternsDetected: z.number(),
    inputType: z.enum(['abi', 'bytecode', 'mixed']),
    processingTime: z.number().optional(),
  }),
});

export type ComprehensiveAnalysisResult = z.infer<typeof ComprehensiveAnalysisResultSchema>;

/**
 * Detects a specific pattern in the provided input
 */
export function detectPattern(
  category: ScamCategory,
  input: string | ABI
): PatternResult {
  const detector = DETECTORS[category];
  if (!detector) {
    throw new Error(`Unknown pattern category: ${category}`);
  }
  
  try {
    return detector(input);
  } catch (error) {
    // Return error result if detector fails
    return PatternResultSchema.parse({
      detected: false,
      confidence: 0,
      category,
      description: `Error detecting ${category} pattern: ${error instanceof Error ? error.message : 'Unknown error'}`,
      evidence: [],
      severity: 'low',
      metadata: {
        error: error instanceof Error ? error.message : 'Unknown error',
        errorType: error instanceof Error ? error.constructor.name : 'UnknownError',
      },
    });
  }
}

/**
 * Runs all pattern detectors on the provided input
 */
export function detectAllPatterns(
  input: string | ABI,
  options: {
    includePatterns?: ScamCategory[];
    excludePatterns?: ScamCategory[];
    parallel?: boolean;
  } = {}
): ComprehensiveAnalysisResult {
  const startTime = Date.now();
  
  // Determine which patterns to analyze
  const allPatterns: ScamCategory[] = ['deceptive-events', 'hidden-redirection', 'fake-balance', 'non-functional-transfer'];
  let patternsToAnalyze = allPatterns;
  
  if (options.includePatterns) {
    patternsToAnalyze = options.includePatterns;
  } else if (options.excludePatterns) {
    patternsToAnalyze = allPatterns.filter(p => !options.excludePatterns!.includes(p));
  }
  
  // Determine input type
  const inputType = determineInputType(input);
  
  // Run pattern detection
  const patternResults: Record<string, PatternResult> = {};
  
  // Note: Parallel execution would need async implementation
  // For now, we use sequential execution for all cases
  for (const pattern of patternsToAnalyze) {
    patternResults[pattern] = detectPattern(pattern, input);
  }
  
  // Aggregate results
  const detectedPatterns = Object.entries(patternResults)
    .filter(([_, result]) => result.detected)
    .map(([pattern, _]) => pattern as ScamCategory);
  
  const overallDetected = detectedPatterns.length > 0;
  const overallConfidence = calculateOverallConfidence(patternResults);
  const overallSeverity = calculateOverallSeverity(patternResults);
  const overallRiskScore = calculateRiskScore(patternResults);
  const summary = generateSummary(patternResults, detectedPatterns);
  
  const processingTime = Date.now() - startTime;
  
  return ComprehensiveAnalysisResultSchema.parse({
    overallDetected,
    overallConfidence,
    overallSeverity,
    overallRiskScore,
    summary,
    detectedPatterns,
    patternResults,
    metadata: {
      analysisDate: new Date(),
      totalPatternsAnalyzed: patternsToAnalyze.length,
      totalPatternsDetected: detectedPatterns.length,
      inputType,
      processingTime,
    },
  });
}

/**
 * Determines the type of input provided
 */
function determineInputType(input: string | ABI): 'abi' | 'bytecode' | 'mixed' {
  if (typeof input === 'string') {
    try {
      JSON.parse(input);
      return 'abi';
    } catch {
      return 'bytecode';
    }
  } else {
    return 'abi';
  }
}

/**
 * Calculates overall confidence from individual pattern results
 */
function calculateOverallConfidence(patternResults: Record<string, PatternResult>): number {
  const results = Object.values(patternResults);
  const detectedResults = results.filter(r => r.detected);
  
  if (detectedResults.length === 0) {
    return 0;
  }
  
  // Weighted average of detected patterns
  const totalConfidence = detectedResults.reduce((sum, result) => sum + result.confidence, 0);
  const averageConfidence = totalConfidence / detectedResults.length;
  
  // Boost confidence if multiple patterns detected
  const multiplePatternBoost = detectedResults.length > 1 ? 0.1 : 0;
  
  return Math.min(averageConfidence + multiplePatternBoost, 1.0);
}

/**
 * Calculates overall severity from individual pattern results
 */
function calculateOverallSeverity(patternResults: Record<string, PatternResult>): 'low' | 'medium' | 'high' | 'critical' {
  const results = Object.values(patternResults);
  const detectedResults = results.filter(r => r.detected);
  
  if (detectedResults.length === 0) {
    return 'low';
  }
  
  // Find the highest severity
  const severityLevels = { low: 0, medium: 1, high: 2, critical: 3 };
  const maxSeverity = Math.max(...detectedResults.map(r => severityLevels[r.severity]));
  
  // If multiple patterns detected, bump up severity
  if (detectedResults.length > 1 && maxSeverity < 3) {
    return Object.keys(severityLevels)[Math.min(maxSeverity + 1, 3)] as 'low' | 'medium' | 'high' | 'critical';
  }
  
  return Object.keys(severityLevels)[maxSeverity] as 'low' | 'medium' | 'high' | 'critical';
}

/**
 * Calculates overall risk score (0-100)
 */
function calculateRiskScore(patternResults: Record<string, PatternResult>): number {
  const results = Object.values(patternResults);
  const detectedResults = results.filter(r => r.detected);
  
  if (detectedResults.length === 0) {
    return 0;
  }
  
  // Base score from confidence
  const averageConfidence = detectedResults.reduce((sum, r) => sum + r.confidence, 0) / detectedResults.length;
  let riskScore = averageConfidence * 60; // Base 60 points from confidence
  
  // Additional points based on severity
  const severityPoints = { low: 0, medium: 10, high: 20, critical: 30 };
  const maxSeverityPoints = Math.max(...detectedResults.map(r => severityPoints[r.severity]));
  riskScore += maxSeverityPoints;
  
  // Bonus for multiple patterns
  if (detectedResults.length > 1) {
    riskScore += 10;
  }
  
  // Bonus for specific dangerous combinations
  const patterns = detectedResults.map(r => r.category);
  if (patterns.includes('hidden-redirection') && patterns.includes('deceptive-events')) {
    riskScore += 15; // Very dangerous combination
  }
  
  return Math.min(Math.round(riskScore), 100);
}

/**
 * Generates a human-readable summary of the analysis
 */
function generateSummary(
  patternResults: Record<string, PatternResult>,
  detectedPatterns: ScamCategory[]
): string {
  const totalAnalyzed = Object.keys(patternResults).length;
  const totalDetected = detectedPatterns.length;
  
  if (totalDetected === 0) {
    return `Analysis complete: No scam patterns detected across ${totalAnalyzed} categories.`;
  }
  
  const patternDescriptions = {
    'deceptive-events': 'deceptive event emissions',
    'hidden-redirection': 'hidden fund redirections',
    'fake-balance': 'fake balance reporting',
    'non-functional-transfer': 'non-functional transfers',
  };
  
  const detectedDescriptions = detectedPatterns.map(p => patternDescriptions[p]);
  
  if (totalDetected === 1) {
    return `Analysis complete: Detected ${detectedDescriptions[0]} pattern. This contract may be a scam.`;
  } else if (totalDetected === 2) {
    return `Analysis complete: Detected ${detectedDescriptions.join(' and ')} patterns. This contract is likely a scam.`;
  } else {
    const lastPattern = detectedDescriptions.pop();
    return `Analysis complete: Detected ${detectedDescriptions.join(', ')}, and ${lastPattern} patterns. This contract is highly likely to be a scam.`;
  }
}

/**
 * Gets detailed analysis for a specific pattern
 */
export function getPatternAnalysis(
  category: ScamCategory,
  input: string | ABI
): PatternResult {
  return detectPattern(category, input);
}

/**
 * Validates input before analysis
 */
export function validateInput(input: string | ABI): {
  isValid: boolean;
  type: 'abi' | 'bytecode' | 'unknown';
  errors: string[];
} {
  const errors: string[] = [];
  
  if (typeof input === 'string') {
    if (input.length === 0) {
      errors.push('Input string is empty');
      return { isValid: false, type: 'unknown', errors };
    }
    
    try {
      // Try to parse as JSON (ABI)
      const parsed = JSON.parse(input);
      if (Array.isArray(parsed)) {
        return { isValid: true, type: 'abi', errors: [] };
      } else {
        errors.push('ABI must be an array');
        return { isValid: false, type: 'abi', errors };
      }
    } catch {
      // Not JSON, check if it's valid bytecode
      if (input.startsWith('0x') && /^0x[a-fA-F0-9]*$/.test(input)) {
        return { isValid: true, type: 'bytecode', errors: [] };
      } else {
        errors.push('Invalid bytecode format - must start with 0x and contain only hex characters');
        return { isValid: false, type: 'bytecode', errors };
      }
    }
  } else {
    // ABI object
    if (Array.isArray(input)) {
      return { isValid: true, type: 'abi', errors: [] };
    } else {
      errors.push('ABI must be an array');
      return { isValid: false, type: 'abi', errors };
    }
  }
}

/**
 * Gets available pattern categories
 */
export function getAvailablePatterns(): ScamCategory[] {
  return Object.keys(DETECTORS) as ScamCategory[];
}

/**
 * Gets detector information
 */
export function getDetectorInfo() {
  return {
    version: '1.0.0',
    patterns: {
      'deceptive-events': {
        name: 'Deceptive Events',
        description: 'Detects events that are emitted without corresponding state changes',
        inputType: 'abi',
        severity: 'high',
      },
      'hidden-redirection': {
        name: 'Hidden Redirection',
        description: 'Detects opcode sequences that redirect calls to hard-coded addresses',
        inputType: 'bytecode',
        severity: 'critical',
      },
      'fake-balance': {
        name: 'Fake Balance',
        description: 'Detects view functions returning timestamp-based or fake balance values',
        inputType: 'abi',
        severity: 'high',
      },
      'non-functional-transfer': {
        name: 'Non-Functional Transfer',
        description: 'Detects transfer functions that emit events without changing balances',
        inputType: 'abi',
        severity: 'critical',
      },
    },
  };
}
