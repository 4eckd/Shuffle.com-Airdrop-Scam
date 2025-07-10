import {
  calculateWeightedScore,
  mapScoreToRiskLevel,
  calculateBonusScore,
  calculatePenaltyScore,
  generateRiskExplanation,
  generateRecommendations,
  generateDetailedAnalysis,
  assessRisk,
  validateRiskScoringConfig,
  getDefaultRiskScoringConfig,
  formatRiskScore,
  getRiskLevelColor,
  getRiskLevelIcon,
  PATTERN_WEIGHTS,
  RISK_THRESHOLDS,
  SEVERITY_MULTIPLIERS
} from '../../src/analysis/riskScoring';
import { PatternResult } from '../../src/types';

describe('Risk Scoring Engine', () => {
  // Mock pattern results for testing
  const mockPatternResults = {
    'deceptive-events': {
      detected: true,
      confidence: 0.8,
      category: 'deceptive-events' as const,
      description: 'Deceptive events detected',
      evidence: ['Event emitted without state change'],
      severity: 'high' as const,
      metadata: {}
    },
    'hidden-redirection': {
      detected: false,
      confidence: 0,
      category: 'hidden-redirection' as const,
      description: 'No hidden redirection detected',
      evidence: [],
      severity: 'low' as const,
      metadata: {}
    },
    'fake-balance': {
      detected: true,
      confidence: 0.6,
      category: 'fake-balance' as const,
      description: 'Fake balance patterns detected',
      evidence: ['Balance function returns timestamp', 'Wrong return type'],
      severity: 'high' as const,
      metadata: {}
    },
    'non-functional-transfer': {
      detected: true,
      confidence: 0.9,
      category: 'non-functional-transfer' as const,
      description: 'Non-functional transfer detected',
      evidence: ['Transfer function is view-only', 'No state changes'],
      severity: 'critical' as const,
      metadata: {}
    }
  } as Record<string, PatternResult>;

  const mockLegitimateResults = {
    'deceptive-events': {
      detected: false,
      confidence: 0,
      category: 'deceptive-events' as const,
      description: 'No deceptive events detected',
      evidence: [],
      severity: 'low' as const,
      metadata: {}
    },
    'hidden-redirection': {
      detected: false,
      confidence: 0,
      category: 'hidden-redirection' as const,
      description: 'No hidden redirection detected',
      evidence: [],
      severity: 'low' as const,
      metadata: {}
    },
    'fake-balance': {
      detected: false,
      confidence: 0,
      category: 'fake-balance' as const,
      description: 'No fake balance detected',
      evidence: [],
      severity: 'low' as const,
      metadata: {}
    },
    'non-functional-transfer': {
      detected: false,
      confidence: 0,
      category: 'non-functional-transfer' as const,
      description: 'No non-functional transfer detected',
      evidence: [],
      severity: 'low' as const,
      metadata: {}
    }
  } as Record<string, PatternResult>;

  const mockHighRiskResults = {
    'deceptive-events': {
      detected: true,
      confidence: 0.95,
      category: 'deceptive-events' as const,
      description: 'High confidence deceptive events',
      evidence: ['Multiple fake events', 'No state changes'],
      severity: 'critical' as const,
      metadata: {}
    },
    'hidden-redirection': {
      detected: true,
      confidence: 0.85,
      category: 'hidden-redirection' as const,
      description: 'Hidden redirection detected',
      evidence: ['SELFDESTRUCT to hardcoded address'],
      severity: 'critical' as const,
      metadata: {}
    },
    'fake-balance': {
      detected: true,
      confidence: 0.75,
      category: 'fake-balance' as const,
      description: 'Fake balance detected',
      evidence: ['Timestamp-based balance'],
      severity: 'high' as const,
      metadata: {}
    },
    'non-functional-transfer': {
      detected: true,
      confidence: 0.9,
      category: 'non-functional-transfer' as const,
      description: 'Non-functional transfer detected',
      evidence: ['View-only transfers'],
      severity: 'critical' as const,
      metadata: {}
    }
  } as Record<string, PatternResult>;

  describe('calculateWeightedScore', () => {
    it('should calculate weighted score correctly', () => {
      const score = calculateWeightedScore(mockPatternResults);
      
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(1);
      
      // Should be weighted by pattern importance
      const expectedScore = 
        (PATTERN_WEIGHTS['deceptive-events'] * 0.8 * SEVERITY_MULTIPLIERS.high +
         PATTERN_WEIGHTS['fake-balance'] * 0.6 * SEVERITY_MULTIPLIERS.high +
         PATTERN_WEIGHTS['non-functional-transfer'] * 0.9 * SEVERITY_MULTIPLIERS.critical) /
        (PATTERN_WEIGHTS['deceptive-events'] + PATTERN_WEIGHTS['hidden-redirection'] + 
         PATTERN_WEIGHTS['fake-balance'] + PATTERN_WEIGHTS['non-functional-transfer']);
      
      expect(score).toBeCloseTo(expectedScore, 2);
    });

    it('should return 0 for no detected patterns', () => {
      const score = calculateWeightedScore(mockLegitimateResults);
      
      expect(score).toBe(0);
    });

    it('should handle custom weights', () => {
      const customConfig = {
        patternWeights: {
          'deceptive-events': 0.5,
          'fake-balance': 0.3,
          'non-functional-transfer': 0.2
        }
      };
      
      const score = calculateWeightedScore(mockPatternResults, customConfig);
      
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(1);
    });

    it('should handle custom severity multipliers', () => {
      const customConfig = {
        severityMultipliers: {
          low: 0.5,
          medium: 0.75,
          high: 1.25,
          critical: 2.0
        }
      };
      
      const score = calculateWeightedScore(mockPatternResults, customConfig);
      
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(1);
    });

    it('should handle unknown patterns with default weight', () => {
      const resultsWithUnknown = {
        ...mockPatternResults,
        'unknown-pattern': {
          detected: true,
          confidence: 0.7,
          category: 'deceptive-events' as const,
          description: 'Unknown pattern',
          evidence: ['Unknown evidence'],
          severity: 'medium' as const,
          metadata: {}
        }
      };
      
      const score = calculateWeightedScore(resultsWithUnknown);
      
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(1);
    });

    it('should cap score at 1.0', () => {
      const extremeResults = {
        'deceptive-events': {
          detected: true,
          confidence: 1.0,
          category: 'deceptive-events' as const,
          description: 'Extreme confidence',
          evidence: ['Multiple evidences'],
          severity: 'critical' as const,
          metadata: {}
        }
      };
      
      const score = calculateWeightedScore(extremeResults);
      
      expect(score).toBeLessThanOrEqual(1);
    });
  });

  describe('mapScoreToRiskLevel', () => {
    it('should map scores to correct risk levels', () => {
      expect(mapScoreToRiskLevel(0)).toBe('low');
      expect(mapScoreToRiskLevel(0.1)).toBe('low');
      expect(mapScoreToRiskLevel(0.24)).toBe('low');
      expect(mapScoreToRiskLevel(0.25)).toBe('medium');
      expect(mapScoreToRiskLevel(0.49)).toBe('medium');
      expect(mapScoreToRiskLevel(0.5)).toBe('high');
      expect(mapScoreToRiskLevel(0.74)).toBe('high');
      expect(mapScoreToRiskLevel(0.75)).toBe('critical');
      expect(mapScoreToRiskLevel(1.0)).toBe('critical');
    });

    it('should handle edge cases', () => {
      expect(mapScoreToRiskLevel(0)).toBe('low');
      expect(mapScoreToRiskLevel(1)).toBe('critical');
      expect(mapScoreToRiskLevel(0.2499)).toBe('low');
      expect(mapScoreToRiskLevel(0.2501)).toBe('medium');
    });
  });

  describe('calculateBonusScore', () => {
    it('should calculate bonus for multiple patterns', () => {
      const bonus = calculateBonusScore(mockPatternResults);
      
      expect(bonus).toBeGreaterThan(0);
      expect(bonus).toBeLessThanOrEqual(0.3); // Capped at 30%
      
      // Should include multiple pattern bonus
      expect(bonus).toBeGreaterThan(0.1);
    });

    it('should return 0 for no detected patterns', () => {
      const bonus = calculateBonusScore(mockLegitimateResults);
      
      expect(bonus).toBe(0);
    });

    it('should give bonus for dangerous combinations', () => {
      const dangerousResults = {
        'deceptive-events': {
          detected: true,
          confidence: 0.8,
          category: 'deceptive-events' as const,
          description: 'Deceptive events',
          evidence: ['Event without state change'],
          severity: 'high' as const,
          metadata: {}
        },
        'hidden-redirection': {
          detected: true,
          confidence: 0.7,
          category: 'hidden-redirection' as const,
          description: 'Hidden redirection',
          evidence: ['SELFDESTRUCT'],
          severity: 'critical' as const,
          metadata: {}
        }
      };
      
      const bonus = calculateBonusScore(dangerousResults);
      
      expect(bonus).toBeGreaterThan(0.15); // Should include dangerous combination bonus
    });

    it('should give bonus for high confidence patterns', () => {
      const highConfidenceResults = {
        'deceptive-events': {
          detected: true,
          confidence: 0.9,
          category: 'deceptive-events' as const,
          description: 'High confidence deceptive events',
          evidence: ['Strong evidence'],
          severity: 'high' as const,
          metadata: {}
        }
      };
      
      const bonus = calculateBonusScore(highConfidenceResults);
      
      expect(bonus).toBeGreaterThan(0.05); // Should include high confidence bonus
    });

    it('should cap bonus at 30%', () => {
      const bonus = calculateBonusScore(mockHighRiskResults);
      
      expect(bonus).toBeLessThanOrEqual(0.3);
    });
  });

  describe('calculatePenaltyScore', () => {
    it('should calculate penalty for low confidence patterns', () => {
      const lowConfidenceResults = {
        'deceptive-events': {
          detected: true,
          confidence: 0.3,
          category: 'deceptive-events' as const,
          description: 'Low confidence detection',
          evidence: ['Weak evidence'],
          severity: 'medium' as const,
          metadata: {}
        }
      };
      
      const penalty = calculatePenaltyScore(lowConfidenceResults);
      
      expect(penalty).toBeGreaterThan(0);
      expect(penalty).toBeLessThanOrEqual(0.2); // Capped at 20%
    });

    it('should calculate penalty for insufficient evidence', () => {
      const insufficientEvidenceResults = {
        'deceptive-events': {
          detected: true,
          confidence: 0.7,
          category: 'deceptive-events' as const,
          description: 'Insufficient evidence',
          evidence: ['Only one piece of evidence'],
          severity: 'high' as const,
          metadata: {}
        }
      };
      
      const penalty = calculatePenaltyScore(insufficientEvidenceResults);
      
      expect(penalty).toBeGreaterThan(0);
      expect(penalty).toBeLessThanOrEqual(0.2);
    });

    it('should return 0 for no detected patterns', () => {
      const penalty = calculatePenaltyScore(mockLegitimateResults);
      
      expect(penalty).toBe(0);
    });

    it('should return 0 for high-quality detections', () => {
      const highQualityResults = {
        'deceptive-events': {
          detected: true,
          confidence: 0.9,
          category: 'deceptive-events' as const,
          description: 'High quality detection',
          evidence: ['Strong evidence 1', 'Strong evidence 2', 'Strong evidence 3'],
          severity: 'critical' as const,
          metadata: {}
        }
      };
      
      const penalty = calculatePenaltyScore(highQualityResults);
      
      expect(penalty).toBe(0);
    });

    it('should cap penalty at 20%', () => {
      const poorQualityResults = {
        'pattern1': {
          detected: true,
          confidence: 0.1,
          category: 'deceptive-events' as const,
          description: 'Poor quality 1',
          evidence: [],
          severity: 'low' as const,
          metadata: {}
        },
        'pattern2': {
          detected: true,
          confidence: 0.2,
          category: 'fake-balance' as const,
          description: 'Poor quality 2',
          evidence: [],
          severity: 'low' as const,
          metadata: {}
        }
      };
      
      const penalty = calculatePenaltyScore(poorQualityResults);
      
      expect(penalty).toBeLessThanOrEqual(0.2);
    });
  });

  describe('generateRiskExplanation', () => {
    it('should generate comprehensive explanation for detected patterns', () => {
      const mockBreakdown = {
        patternScores: {
          'deceptive-events': {
            weight: 0.25,
            confidence: 0.8,
            severity: 'high' as const,
            contribution: 0.24,
            detected: true
          }
        },
        baseScore: 0.6,
        bonusScore: 0.1,
        penaltyScore: 0.05,
        finalScore: 0.65,
        normalizedScore: 0.65
      };
      
      const explanation = generateRiskExplanation(
        mockPatternResults, 
        0.65, 
        'high', 
        mockBreakdown
      );
      
      expect(explanation).toBeDefined();
      expect(explanation.summary).toContain('malicious pattern');
      expect(explanation.summary).toContain('high risk');
      expect(explanation.riskFactors.length).toBeGreaterThan(0);
      expect(explanation.recommendations.length).toBeGreaterThan(0);
      expect(explanation.detailedAnalysis).toBeDefined();
    });

    it('should generate explanation for legitimate contracts', () => {
      const mockBreakdown = {
        patternScores: {},
        baseScore: 0,
        bonusScore: 0,
        penaltyScore: 0,
        finalScore: 0,
        normalizedScore: 0
      };
      
      const explanation = generateRiskExplanation(
        mockLegitimateResults, 
        0, 
        'low', 
        mockBreakdown
      );
      
      expect(explanation).toBeDefined();
      expect(explanation.summary).toContain('No malicious patterns detected');
      expect(explanation.summary).toContain('legitimate');
      expect(explanation.riskFactors.length).toBe(0);
      expect(explanation.mitigatingFactors.length).toBeGreaterThan(0);
    });

    it('should include appropriate risk factors', () => {
      const mockBreakdown = {
        patternScores: {
          'deceptive-events': {
            weight: 0.25,
            confidence: 0.8,
            severity: 'high' as const,
            contribution: 0.24,
            detected: true
          }
        },
        baseScore: 0.6,
        bonusScore: 0.1,
        penaltyScore: 0,
        finalScore: 0.7,
        normalizedScore: 0.7
      };
      
      const explanation = generateRiskExplanation(
        mockPatternResults, 
        0.7, 
        'high', 
        mockBreakdown
      );
      
      expect(explanation.riskFactors).toContain(
        expect.stringContaining('deceptive events pattern detected')
      );
      expect(explanation.riskFactors).toContain(
        expect.stringContaining('high-severity patterns detected')
      );
      expect(explanation.riskFactors).toContain(
        expect.stringContaining('Multiple pattern combination increases risk')
      );
    });

    it('should include mitigating factors when appropriate', () => {
      const mockBreakdown = {
        patternScores: {
          'deceptive-events': {
            weight: 0.25,
            confidence: 0.3,
            severity: 'medium' as const,
            contribution: 0.075,
            detected: true
          }
        },
        baseScore: 0.3,
        bonusScore: 0,
        penaltyScore: 0.1,
        finalScore: 0.2,
        normalizedScore: 0.2
      };
      
      const lowConfidenceResults = {
        'deceptive-events': {
          detected: true,
          confidence: 0.3,
          category: 'deceptive-events' as const,
          description: 'Low confidence detection',
          evidence: ['Weak evidence'],
          severity: 'medium' as const,
          metadata: {}
        }
      };
      
      const explanation = generateRiskExplanation(
        lowConfidenceResults, 
        0.2, 
        'low', 
        mockBreakdown
      );
      
      expect(explanation.mitigatingFactors).toContain(
        expect.stringContaining('low confidence scores')
      );
    });
  });

  describe('generateRecommendations', () => {
    it('should generate critical risk recommendations', () => {
      const recommendations = generateRecommendations('critical', [
        ['deceptive-events', mockPatternResults['deceptive-events']],
        ['hidden-redirection', mockPatternResults['hidden-redirection']]
      ]);
      
      expect(recommendations).toContain('DO NOT INTERACT with this contract under any circumstances');
      expect(recommendations).toContain('Report this contract to relevant authorities');
      expect(recommendations).toContain('Warn others about this potential scam');
    });

    it('should generate high risk recommendations', () => {
      const recommendations = generateRecommendations('high', [
        ['deceptive-events', mockPatternResults['deceptive-events']]
      ]);
      
      expect(recommendations).toContain('Exercise extreme caution - likely a scam contract');
      expect(recommendations).toContain('Do not send funds or approve token transfers');
      expect(recommendations).toContain('Seek expert analysis before any interaction');
    });

    it('should generate medium risk recommendations', () => {
      const recommendations = generateRecommendations('medium', [
        ['fake-balance', mockPatternResults['fake-balance']]
      ]);
      
      expect(recommendations).toContain('Proceed with caution - suspicious patterns detected');
      expect(recommendations).toContain('Verify contract functionality through test transactions');
      expect(recommendations).toContain('Check community feedback and audit reports');
    });

    it('should generate low risk recommendations', () => {
      const recommendations = generateRecommendations('low', []);
      
      expect(recommendations).toContain('Low risk detected - contract appears legitimate');
      expect(recommendations).toContain('Still recommended to verify contract source code');
      expect(recommendations).toContain('Monitor for any unusual behavior');
    });

    it('should include pattern-specific recommendations', () => {
      const recommendations = generateRecommendations('high', [
        ['hidden-redirection', mockPatternResults['hidden-redirection']],
        ['deceptive-events', mockPatternResults['deceptive-events']]
      ]);
      
      expect(recommendations).toContain('Contract may redirect funds to unauthorized addresses');
      expect(recommendations).toContain('Contract may emit fake success events');
    });

    it('should remove duplicate recommendations', () => {
      const recommendations = generateRecommendations('high', [
        ['deceptive-events', mockPatternResults['deceptive-events']],
        ['fake-balance', mockPatternResults['fake-balance']]
      ]);
      
      const uniqueRecommendations = Array.from(new Set(recommendations));
      expect(recommendations).toEqual(uniqueRecommendations);
    });
  });

  describe('generateDetailedAnalysis', () => {
    it('should generate comprehensive detailed analysis', () => {
      const mockBreakdown = {
        patternScores: {
          'deceptive-events': {
            weight: 0.25,
            confidence: 0.8,
            severity: 'high' as const,
            contribution: 0.24,
            detected: true
          },
          'fake-balance': {
            weight: 0.2,
            confidence: 0.6,
            severity: 'high' as const,
            contribution: 0.144,
            detected: true
          }
        },
        baseScore: 0.6,
        bonusScore: 0.1,
        penaltyScore: 0.05,
        finalScore: 0.65,
        normalizedScore: 0.65
      };
      
      const analysis = generateDetailedAnalysis(
        mockPatternResults,
        0.65,
        'high',
        mockBreakdown
      );
      
      expect(analysis).toContain('Risk Score Analysis:');
      expect(analysis).toContain('Base Score: 60%');
      expect(analysis).toContain('Bonus Score: 10%');
      expect(analysis).toContain('Penalty Score: 5%');
      expect(analysis).toContain('Final Score: 65%');
      expect(analysis).toContain('Risk Level: HIGH');
      expect(analysis).toContain('Pattern Contributions:');
      expect(analysis).toContain('Evidence Summary:');
    });

    it('should include pattern contribution details', () => {
      const mockBreakdown = {
        patternScores: {
          'deceptive-events': {
            weight: 0.25,
            confidence: 0.8,
            severity: 'high' as const,
            contribution: 0.24,
            detected: true
          }
        },
        baseScore: 0.6,
        bonusScore: 0.1,
        penaltyScore: 0.05,
        finalScore: 0.65,
        normalizedScore: 0.65
      };
      
      const analysis = generateDetailedAnalysis(
        mockPatternResults,
        0.65,
        'high',
        mockBreakdown
      );
      
      expect(analysis).toContain('deceptive-events: DETECTED');
      expect(analysis).toContain('Weight: 25%');
      expect(analysis).toContain('Confidence: 80%');
      expect(analysis).toContain('Contribution: 24%');
    });

    it('should include evidence for detected patterns', () => {
      const mockBreakdown = {
        patternScores: {
          'deceptive-events': {
            weight: 0.25,
            confidence: 0.8,
            severity: 'high' as const,
            contribution: 0.24,
            detected: true
          }
        },
        baseScore: 0.6,
        bonusScore: 0.1,
        penaltyScore: 0.05,
        finalScore: 0.65,
        normalizedScore: 0.65
      };
      
      const analysis = generateDetailedAnalysis(
        mockPatternResults,
        0.65,
        'high',
        mockBreakdown
      );
      
      expect(analysis).toContain('Evidence Summary:');
      expect(analysis).toContain('deceptive-events:');
      expect(analysis).toContain('Event emitted without state change');
    });
  });

  describe('assessRisk', () => {
    it('should perform comprehensive risk assessment', () => {
      const assessment = assessRisk(mockPatternResults);
      
      expect(assessment).toBeDefined();
      expect(typeof assessment.riskScore).toBe('number');
      expect(assessment.riskScore).toBeGreaterThanOrEqual(0);
      expect(assessment.riskScore).toBeLessThanOrEqual(1);
      expect(['low', 'medium', 'high', 'critical']).toContain(assessment.riskLevel);
      expect(typeof assessment.confidence).toBe('number');
      expect(assessment.confidence).toBeGreaterThanOrEqual(0);
      expect(assessment.confidence).toBeLessThanOrEqual(1);
      expect(assessment.breakdown).toBeDefined();
      expect(assessment.explanation).toBeDefined();
      expect(assessment.metadata).toBeDefined();
    });

    it('should handle legitimate contracts', () => {
      const assessment = assessRisk(mockLegitimateResults);
      
      expect(assessment.riskScore).toBe(0);
      expect(assessment.riskLevel).toBe('low');
      expect(assessment.confidence).toBe(0);
      expect(assessment.explanation.summary).toContain('No malicious patterns detected');
    });

    it('should handle high-risk contracts', () => {
      const assessment = assessRisk(mockHighRiskResults);
      
      expect(assessment.riskScore).toBeGreaterThan(0.5);
      expect(['high', 'critical']).toContain(assessment.riskLevel);
      expect(assessment.confidence).toBeGreaterThan(0.5);
      expect(assessment.explanation.summary).toContain('malicious pattern');
    });

    it('should respect custom configuration', () => {
      const customConfig = {
        enableBonusScoring: false,
        enablePenaltyScoring: false,
        patternWeights: {
          'deceptive-events': 0.5,
          'fake-balance': 0.3,
          'non-functional-transfer': 0.2
        }
      };
      
      const assessment = assessRisk(mockPatternResults, customConfig);
      
      expect(assessment.breakdown.bonusScore).toBe(0);
      expect(assessment.breakdown.penaltyScore).toBe(0);
    });

    it('should calculate metadata correctly', () => {
      const assessment = assessRisk(mockPatternResults);
      
      expect(assessment.metadata.totalPatterns).toBe(4);
      expect(assessment.metadata.detectedPatterns).toBe(3);
      expect(assessment.metadata.highSeverityPatterns).toBe(3);
      expect(assessment.metadata.averageConfidence).toBeGreaterThan(0);
      expect(assessment.metadata.calculatedAt).toBeInstanceOf(Date);
      expect(assessment.metadata.version).toBe('1.0.0');
    });

    it('should validate result against schema', () => {
      const assessment = assessRisk(mockPatternResults);
      
      // Basic type checks
      expect(typeof assessment.riskScore).toBe('number');
      expect(typeof assessment.riskLevel).toBe('string');
      expect(typeof assessment.confidence).toBe('number');
      expect(typeof assessment.breakdown).toBe('object');
      expect(typeof assessment.explanation).toBe('object');
      expect(typeof assessment.metadata).toBe('object');
      
      // Range checks
      expect(assessment.riskScore).toBeGreaterThanOrEqual(0);
      expect(assessment.riskScore).toBeLessThanOrEqual(1);
      expect(assessment.confidence).toBeGreaterThanOrEqual(0);
      expect(assessment.confidence).toBeLessThanOrEqual(1);
    });
  });

  describe('Configuration and Validation', () => {
    it('should validate valid risk scoring configuration', () => {
      const validConfig = {
        patternWeights: {
          'deceptive-events': 0.3,
          'fake-balance': 0.2
        },
        riskThresholds: {
          low: { min: 0, max: 0.3 },
          medium: { min: 0.3, max: 0.6 },
          high: { min: 0.6, max: 0.8 },
          critical: { min: 0.8, max: 1.0 }
        },
        severityMultipliers: {
          low: 0.8,
          medium: 1.0,
          high: 1.2,
          critical: 1.5
        },
        enableBonusScoring: true,
        enablePenaltyScoring: true
      };
      
      expect(() => validateRiskScoringConfig(validConfig)).not.toThrow();
    });

    it('should reject invalid configuration', () => {
      const invalidConfig = {
        patternWeights: {
          'deceptive-events': 1.5 // Invalid: > 1
        },
        enableBonusScoring: 'not a boolean' // Invalid type
      };
      
      expect(() => validateRiskScoringConfig(invalidConfig)).toThrow();
    });

    it('should return default configuration', () => {
      const defaultConfig = getDefaultRiskScoringConfig();
      
      expect(defaultConfig).toBeDefined();
      expect(defaultConfig.patternWeights).toEqual(PATTERN_WEIGHTS);
      expect(defaultConfig.riskThresholds).toEqual(RISK_THRESHOLDS);
      expect(defaultConfig.severityMultipliers).toEqual(SEVERITY_MULTIPLIERS);
      expect(defaultConfig.enableBonusScoring).toBe(true);
      expect(defaultConfig.enablePenaltyScoring).toBe(true);
    });
  });

  describe('Utility Functions', () => {
    it('should format risk score correctly', () => {
      expect(formatRiskScore(0)).toBe('0%');
      expect(formatRiskScore(0.5)).toBe('50%');
      expect(formatRiskScore(0.756)).toBe('76%');
      expect(formatRiskScore(1)).toBe('100%');
    });

    it('should return correct risk level colors', () => {
      expect(getRiskLevelColor('low')).toBe('#22c55e');
      expect(getRiskLevelColor('medium')).toBe('#f59e0b');
      expect(getRiskLevelColor('high')).toBe('#ef4444');
      expect(getRiskLevelColor('critical')).toBe('#dc2626');
    });

    it('should return correct risk level icons', () => {
      expect(getRiskLevelIcon('low')).toBe('✓');
      expect(getRiskLevelIcon('medium')).toBe('⚠');
      expect(getRiskLevelIcon('high')).toBe('❌');
      expect(getRiskLevelIcon('critical')).toBe('🚨');
    });
  });

  describe('Edge Cases and Performance', () => {
    it('should handle empty pattern results', () => {
      const emptyResults = {};
      const assessment = assessRisk(emptyResults);
      
      expect(assessment.riskScore).toBe(0);
      expect(assessment.riskLevel).toBe('low');
      expect(assessment.confidence).toBe(0);
    });

    it('should handle single pattern detection', () => {
      const singlePatternResults = {
        'deceptive-events': mockPatternResults['deceptive-events']
      };
      
      const assessment = assessRisk(singlePatternResults);
      
      expect(assessment.riskScore).toBeGreaterThan(0);
      expect(assessment.riskLevel).not.toBe('low');
    });

    it('should handle performance with many patterns', () => {
      const startTime = Date.now();
      
      // Create many pattern results
      const manyPatterns: Record<string, PatternResult> = {};
      for (let i = 0; i < 100; i++) {
        manyPatterns[`pattern-${i}`] = {
          detected: i % 3 === 0,
          confidence: Math.random(),
          category: 'deceptive-events' as const,
          description: `Pattern ${i}`,
          evidence: [`Evidence ${i}`],
          severity: 'medium' as const,
          metadata: {}
        };
      }
      
      const assessment = assessRisk(manyPatterns);
      const endTime = Date.now();
      
      expect(endTime - startTime).toBeLessThan(1000); // Should complete in under 1 second
      expect(assessment).toBeDefined();
    });

    it('should maintain consistency across multiple runs', () => {
      const results = Array(10).fill(null).map(() => assessRisk(mockPatternResults));
      
      const firstResult = results[0];
      results.forEach(result => {
        expect(result.riskScore).toBe(firstResult.riskScore);
        expect(result.riskLevel).toBe(firstResult.riskLevel);
        expect(result.confidence).toBe(firstResult.confidence);
      });
    });
  });
});
