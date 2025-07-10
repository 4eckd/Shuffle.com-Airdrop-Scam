/* eslint-disable @typescript-eslint/no-unused-vars */
import { z } from 'zod';
import { PatternResult, RiskLevel, ScamCategory } from '../types';

/**
 * Risk Assessment Engine
 * 
 * Implements weighted scoring based on pattern detection results:
 * score = Σ(patternWeight * detection.confidence)
 * 
 * Maps numeric scores to RiskLevel enum and provides detailed
 * explanatory breakdowns for analysis reports.
 */

// Pattern weight configuration based on severity and impact
export const PATTERN_WEIGHTS = {
  'deceptive-events': 0.25,
  'hidden-redirection': 0.35,
  'fake-balance': 0.20,
  'non-functional-transfer': 0.30,
} as const;

// Risk level thresholds for score mapping
export const RISK_THRESHOLDS = {
  low: { min: 0, max: 0.25 },
  medium: { min: 0.25, max: 0.5 },
  high: { min: 0.5, max: 0.75 },
  critical: { min: 0.75, max: 1.0 },
} as const;

// Severity multipliers for enhanced risk calculation
export const SEVERITY_MULTIPLIERS = {
  low: 0.8,
  medium: 1.0,
  high: 1.2,
  critical: 1.5,
} as const;

// Risk scoring configuration schema
export const RiskScoringConfigSchema = z.object({
  patternWeights: z.record(z.string(), z.number().min(0).max(1)),
  riskThresholds: z.record(z.string(), z.object({
    min: z.number().min(0).max(1),
    max: z.number().min(0).max(1),
  })),
  severityMultipliers: z.record(z.string(), z.number().min(0).max(2)),
  enableBonusScoring: z.boolean().default(true),
  enablePenaltyScoring: z.boolean().default(true),
});

// Risk assessment result schema
export const RiskAssessmentResultSchema = z.object({
  riskScore: z.number().min(0).max(1),
  riskLevel: z.enum(['low', 'medium', 'high', 'critical']),
  confidence: z.number().min(0).max(1),
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
    normalizedScore: z.number(),
  }),
  explanation: z.object({
    summary: z.string(),
    riskFactors: z.array(z.string()),
    mitigatingFactors: z.array(z.string()),
    recommendations: z.array(z.string()),
    detailedAnalysis: z.string(),
  }),
  metadata: z.object({
    totalPatterns: z.number(),
    detectedPatterns: z.number(),
    highSeverityPatterns: z.number(),
    averageConfidence: z.number(),
    calculatedAt: z.date(),
    version: z.string(),
  }),
});

export type RiskScoringConfig = z.infer<typeof RiskScoringConfigSchema>;
export type RiskAssessmentResult = z.infer<typeof RiskAssessmentResultSchema>;

/**
 * Calculates weighted risk score from pattern detection results
 * Formula: score = Σ(patternWeight * detection.confidence * severityMultiplier)
 */
export function calculateWeightedScore(
  patternResults: Record<string, PatternResult>,
  config: Partial<RiskScoringConfig> = {}
): number {
  const weights = config.patternWeights || PATTERN_WEIGHTS;
  const severityMultipliers = config.severityMultipliers || SEVERITY_MULTIPLIERS;
  
  let totalScore = 0;
  let totalWeight = 0;
  
  Object.entries(patternResults).forEach(([pattern, result]) => {
    const patternWeight = (weights as Record<string, number>)[pattern] || 0.1; // Default weight for unknown patterns
    const severityMultiplier = (severityMultipliers as Record<string, number>)[result.severity] || 1.0;
    
    // Calculate weighted contribution
    const contribution = patternWeight * result.confidence * severityMultiplier;
    totalScore += contribution;
    totalWeight += patternWeight;
  });
  
  // Normalize by total weight to ensure score stays within 0-1 range
  return totalWeight > 0 ? Math.min(totalScore / totalWeight, 1.0) : 0;
}

/**
 * Maps numeric risk score to RiskLevel enum
 */
export function mapScoreToRiskLevel(score: number): RiskLevel {
  if (score >= RISK_THRESHOLDS.critical.min) return 'critical';
  if (score >= RISK_THRESHOLDS.high.min) return 'high';
  if (score >= RISK_THRESHOLDS.medium.min) return 'medium';
  return 'low';
}

/**
 * Calculates bonus score based on pattern combinations and frequency
 */
export function calculateBonusScore(
  patternResults: Record<string, PatternResult>
): number {
  const detectedPatterns = Object.entries(patternResults)
    .filter(([_pattern, result]) => result.detected)
    .map(([pattern, _result]) => pattern as ScamCategory);
  
  let bonusScore = 0;
  
  // Multiple pattern detection bonus
  if (detectedPatterns.length > 1) {
    bonusScore += 0.1 * (detectedPatterns.length - 1);
  }
  
  // Dangerous combination bonuses
  const dangerousCombinations = [
    ['hidden-redirection', 'deceptive-events'], // Extremely dangerous
    ['fake-balance', 'non-functional-transfer'], // Classic scam pattern
    ['deceptive-events', 'non-functional-transfer'], // Event spoofing
  ];
  
  dangerousCombinations.forEach(combination => {
    if (combination.every(pattern => detectedPatterns.includes(pattern as ScamCategory))) {
      bonusScore += 0.15;
    }
  });
  
  // High confidence bonus
  const averageConfidence = Object.values(patternResults)
    .filter(result => result.detected)
    .reduce((sum, result) => sum + result.confidence, 0) / Math.max(detectedPatterns.length, 1);
  
  if (averageConfidence > 0.8) {
    bonusScore += 0.05;
  }
  
  return Math.min(bonusScore, 0.3); // Cap bonus at 30%
}

/**
 * Calculates penalty score for conflicting or uncertain patterns
 */
export function calculatePenaltyScore(
  patternResults: Record<string, PatternResult>
): number {
  let penaltyScore = 0;
  
  // Low confidence penalty
  const lowConfidencePatterns = Object.values(patternResults)
    .filter(result => result.detected && result.confidence < 0.4);
  
  if (lowConfidencePatterns.length > 0) {
    penaltyScore += 0.05 * lowConfidencePatterns.length;
  }
  
  // Insufficient evidence penalty
  const insufficientEvidencePatterns = Object.values(patternResults)
    .filter(result => result.detected && result.evidence.length < 2);
  
  if (insufficientEvidencePatterns.length > 0) {
    penaltyScore += 0.03 * insufficientEvidencePatterns.length;
  }
  
  return Math.min(penaltyScore, 0.2); // Cap penalty at 20%
}

/**
 * Generates detailed risk explanation
 */
export function generateRiskExplanation(
  patternResults: Record<string, PatternResult>,
  riskScore: number,
  riskLevel: RiskLevel,
  breakdown: RiskAssessmentResult['breakdown']
): RiskAssessmentResult['explanation'] {
  const detectedPatterns = Object.entries(patternResults)
    .filter(([_pattern, result]) => result.detected);
  
  const highSeverityPatterns = detectedPatterns
    .filter(([_pattern, result]) => result.severity === 'high' || result.severity === 'critical');
  
  // Generate summary
  const summary = detectedPatterns.length === 0
    ? 'No malicious patterns detected. The contract appears to be legitimate.'
    : `${detectedPatterns.length} malicious pattern(s) detected with ${riskLevel} risk level. ` +
      `Risk score: ${Math.round(riskScore * 100)}%.`;
  
  // Risk factors
  const riskFactors: string[] = [];
  detectedPatterns.forEach(([pattern, result]) => {
    riskFactors.push(
      `${pattern.replace('-', ' ')} pattern detected with ${Math.round(result.confidence * 100)}% confidence`
    );
  });
  
  if (highSeverityPatterns.length > 0) {
    riskFactors.push(`${highSeverityPatterns.length} high-severity patterns detected`);
  }
  
  if (breakdown.bonusScore > 0) {
    riskFactors.push('Multiple pattern combination increases risk');
  }
  
  // Mitigating factors
  const mitigatingFactors: string[] = [];
  if (breakdown.penaltyScore > 0) {
    mitigatingFactors.push('Some patterns have low confidence scores');
  }
  
  const nonDetectedPatterns = Object.entries(patternResults)
    .filter(([_pattern, result]) => !result.detected);
  
  if (nonDetectedPatterns.length > 0) {
    mitigatingFactors.push(`${nonDetectedPatterns.length} pattern(s) not detected`);
  }
  
  // Recommendations
  const recommendations = generateRecommendations(riskLevel, detectedPatterns);
  
  // Detailed analysis
  const detailedAnalysis = generateDetailedAnalysis(
    patternResults,
    riskScore,
    riskLevel,
    breakdown
  );
  
  return {
    summary,
    riskFactors,
    mitigatingFactors,
    recommendations,
    detailedAnalysis,
  };
}

/**
 * Generates risk-level specific recommendations
 */
export function generateRecommendations(
  riskLevel: RiskLevel,
  detectedPatterns: [string, PatternResult][]
): string[] {
  const recommendations: string[] = [];
  
  switch (riskLevel) {
    case 'critical':
      recommendations.push('DO NOT INTERACT with this contract under any circumstances');
      recommendations.push('Report this contract to relevant authorities');
      recommendations.push('Warn others about this potential scam');
      break;
    
    case 'high':
      recommendations.push('Exercise extreme caution - likely a scam contract');
      recommendations.push('Do not send funds or approve token transfers');
      recommendations.push('Seek expert analysis before any interaction');
      break;
    
    case 'medium':
      recommendations.push('Proceed with caution - suspicious patterns detected');
      recommendations.push('Verify contract functionality through test transactions');
      recommendations.push('Check community feedback and audit reports');
      break;
    
    case 'low':
      recommendations.push('Low risk detected - contract appears legitimate');
      recommendations.push('Still recommended to verify contract source code');
      recommendations.push('Monitor for any unusual behavior');
      break;
  }
  
  // Pattern-specific recommendations
  detectedPatterns.forEach(([pattern, _result]) => {
    switch (pattern) {
      case 'hidden-redirection':
        recommendations.push('Contract may redirect funds to unauthorized addresses');
        break;
      case 'deceptive-events':
        recommendations.push('Contract may emit fake success events');
        break;
      case 'fake-balance':
        recommendations.push('Contract may display incorrect balance information');
        break;
      case 'non-functional-transfer':
        recommendations.push('Contract transfers may not function as expected');
        break;
    }
  });
  
  return Array.from(new Set(recommendations)); // Remove duplicates
}

/**
 * Generates detailed technical analysis
 */
export function generateDetailedAnalysis(
  patternResults: Record<string, PatternResult>,
  _riskScore: number,
  riskLevel: RiskLevel,
  breakdown: RiskAssessmentResult['breakdown']
): string {
  const sections: string[] = [];
  
  // Score breakdown
  sections.push(`Risk Score Analysis:`);
  sections.push(`- Base Score: ${Math.round(breakdown.baseScore * 100)}%`);
  sections.push(`- Bonus Score: ${Math.round(breakdown.bonusScore * 100)}%`);
  sections.push(`- Penalty Score: ${Math.round(breakdown.penaltyScore * 100)}%`);
  sections.push(`- Final Score: ${Math.round(breakdown.finalScore * 100)}%`);
  sections.push(`- Risk Level: ${riskLevel.toUpperCase()}`);
  sections.push('');
  
  // Pattern contributions
  sections.push(`Pattern Contributions:`);
  Object.entries(breakdown.patternScores).forEach(([pattern, score]) => {
    const status = score.detected ? 'DETECTED' : 'NOT DETECTED';
    sections.push(
      `- ${pattern}: ${status} (Weight: ${Math.round(score.weight * 100)}%, ` +
      `Confidence: ${Math.round(score.confidence * 100)}%, ` +
      `Contribution: ${Math.round(score.contribution * 100)}%)`
    );
  });
  sections.push('');
  
  // Evidence summary
  const detectedPatterns = Object.entries(patternResults)
    .filter(([_pattern, result]) => result.detected);
  
  if (detectedPatterns.length > 0) {
    sections.push(`Evidence Summary:`);
    detectedPatterns.forEach(([pattern, result]) => {
      sections.push(`- ${pattern}:`);
      result.evidence.forEach(evidence => {
        sections.push(`  • ${evidence}`);
      });
    });
  }
  
  return sections.join('\n');
}

/**
 * Comprehensive risk assessment function
 */
export function assessRisk(
  patternResults: Record<string, PatternResult>,
  config: Partial<RiskScoringConfig> = {}
): RiskAssessmentResult {
  const enableBonusScoring = config.enableBonusScoring ?? true;
  const enablePenaltyScoring = config.enablePenaltyScoring ?? true;
  
  // Calculate base weighted score
  const baseScore = calculateWeightedScore(patternResults, config);
  
  // Calculate bonus and penalty scores
  const bonusScore = enableBonusScoring ? calculateBonusScore(patternResults) : 0;
  const penaltyScore = enablePenaltyScoring ? calculatePenaltyScore(patternResults) : 0;
  
  // Calculate final score
  const finalScore = Math.max(0, Math.min(1, baseScore + bonusScore - penaltyScore));
  
  // Map to risk level
  const riskLevel = mapScoreToRiskLevel(finalScore);
  
  // Calculate overall confidence
  const detectedResults = Object.values(patternResults).filter(r => r.detected);
  const averageConfidence = detectedResults.length > 0
    ? detectedResults.reduce((sum, r) => sum + r.confidence, 0) / detectedResults.length
    : 0;
  
  // Generate pattern score breakdown
  const weights = config.patternWeights || PATTERN_WEIGHTS;
  const severityMultipliers = config.severityMultipliers || SEVERITY_MULTIPLIERS;
  
  const patternScores: Record<string, any> = {};
  Object.entries(patternResults).forEach(([pattern, result]) => {
    const weight = (weights as Record<string, number>)[pattern] || 0.1;
    const severityMultiplier = (severityMultipliers as Record<string, number>)[result.severity] || 1.0;
    const contribution = weight * result.confidence * severityMultiplier;
    
    patternScores[pattern] = {
      weight,
      confidence: result.confidence,
      severity: result.severity,
      contribution,
      detected: result.detected,
    };
  });
  
  const breakdown = {
    patternScores,
    baseScore,
    bonusScore,
    penaltyScore,
    finalScore,
    normalizedScore: finalScore,
  };
  
  // Generate explanation
  const explanation = generateRiskExplanation(patternResults, finalScore, riskLevel, breakdown);
  
  // Generate metadata
  const metadata = {
    totalPatterns: Object.keys(patternResults).length,
    detectedPatterns: detectedResults.length,
    highSeverityPatterns: detectedResults.filter(r => 
      r.severity === 'high' || r.severity === 'critical'
    ).length,
    averageConfidence,
    calculatedAt: new Date(),
    version: '1.0.0',
  };
  
  return RiskAssessmentResultSchema.parse({
    riskScore: finalScore,
    riskLevel,
    confidence: averageConfidence,
    breakdown,
    explanation,
    metadata,
  });
}

/**
 * Validates risk scoring configuration
 */
export function validateRiskScoringConfig(config: unknown): RiskScoringConfig {
  return RiskScoringConfigSchema.parse(config);
}

/**
 * Gets default risk scoring configuration
 */
export function getDefaultRiskScoringConfig(): RiskScoringConfig {
  return {
    patternWeights: PATTERN_WEIGHTS,
    riskThresholds: RISK_THRESHOLDS,
    severityMultipliers: SEVERITY_MULTIPLIERS,
    enableBonusScoring: true,
    enablePenaltyScoring: true,
  };
}

/**
 * Utility function to format risk score as percentage
 */
export function formatRiskScore(score: number): string {
  return `${Math.round(score * 100)}%`;
}

/**
 * Utility function to get risk level color for UI
 */
export function getRiskLevelColor(riskLevel: RiskLevel): string {
  const colors = {
    low: '#22c55e',      // Green
    medium: '#f59e0b',   // Yellow
    high: '#ef4444',     // Red
    critical: '#dc2626', // Dark Red
  };
  return colors[riskLevel];
}

/**
 * Utility function to get risk level icon
 */
export function getRiskLevelIcon(riskLevel: RiskLevel): string {
  const icons = {
    low: '✓',
    medium: '⚠',
    high: '❌',
    critical: '🚨',
  };
  return icons[riskLevel];
}
