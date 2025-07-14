import { describe, it, expect } from '@jest/globals';
import {
  calculateWeightedScore,
  mapScoreToRiskLevel,
  calculateBonusScore,
  calculatePenaltyScore,
  assessRisk,
  generateRecommendations,
  generateDetailedAnalysis,
  formatRiskScore,
  getRiskLevelColor,
  getRiskLevelIcon,
  getDefaultRiskScoringConfig,
  validateRiskScoringConfig,
  PATTERN_WEIGHTS,
  RISK_THRESHOLDS,
  SEVERITY_MULTIPLIERS,
} from './riskScoring';
import { PatternResult } from '../types';

describe('Risk Scoring Engine', () => {
  // Test data fixtures
  const mockPatternResults: Record<string, PatternResult> = {
    'deceptive-events': {
      detected: true,
      confidence: 0.8,
      category: 'deceptive-events',
      description: 'Deceptive events detected',
      evidence: ['Event without state change', 'Fake success event'],
      severity: 'high',
      metadata: {},
    },
    'hidden-redirection': {
      detected: false,
      confidence: 0,
      category: 'hidden-redirection',
      description: 'No hidden redirection detected',
      evidence: [],
      severity: 'low',
      metadata: {},
    },
    'fake-balance': {
      detected: true,
      confidence: 0.6,
      category: 'fake-balance',
      description: 'Fake balance pattern detected',
      evidence: ['Timestamp-based balance'],
      severity: 'medium',
      metadata: {},
    },
    'non-functional-transfer': {
      detected: false,
      confidence: 0,
      category: 'non-functional-transfer',
      description: 'No non-functional transfer detected',
      evidence: [],
      severity: 'low',
      metadata: {},
    },
  };

  const criticalPatternResults: Record<string, PatternResult> = {
    'deceptive-events': {
      detected: true,
      confidence: 0.9,
      category: 'deceptive-events',
      description: 'Critical deceptive events',
      evidence: ['Multiple fake events', 'No state changes', 'Misleading transfers'],
      severity: 'critical',
      metadata: {},
    },
    'hidden-redirection': {
      detected: true,
      confidence: 0.95,
      category: 'hidden-redirection',
      description: 'Critical hidden redirection',
      evidence: ['Hard-coded redirect', 'Obfuscated code', 'Unauthorized address'],
      severity: 'critical',
      metadata: {},
    },
    'fake-balance': {
      detected: true,
      confidence: 0.8,
      category: 'fake-balance',
      description: 'Critical fake balance',
      evidence: ['Fake balance calculations', 'Timestamp manipulation'],
      severity: 'high',
      metadata: {},
    },
    'non-functional-transfer': {
      detected: true,
      confidence: 0.85,
      category: 'non-functional-transfer',
      description: 'Critical non-functional transfer',
      evidence: ['Transfer without balance change', 'Fake success events'],
      severity: 'critical',
      metadata: {},
    },
  };

  const lowConfidencePatternResults: Record<string, PatternResult> = {
    'deceptive-events': {
      detected: true,
      confidence: 0.3,
      category: 'deceptive-events',
      description: 'Low confidence detection',
      evidence: ['Weak evidence'],
      severity: 'low',
      metadata: {},
    },
    'hidden-redirection': {
      detected: false,
      confidence: 0,
      category: 'hidden-redirection',
      description: 'No detection',
      evidence: [],
      severity: 'low',
      metadata: {},
    },
    'fake-balance': {
      detected: false,
      confidence: 0,
      category: 'fake-balance',
      description: 'No detection',
      evidence: [],
      severity: 'low',
      metadata: {},
    },
    'non-functional-transfer': {
      detected: false,
      confidence: 0,
      category: 'non-functional-transfer',
      description: 'No detection',
      evidence: [],
      severity: 'low',
      metadata: {},
    },
  };

  describe('calculateWeightedScore', () => {
    it('should calculate weighted score correctly using the formula', () => {
      const score = calculateWeightedScore(mockPatternResults);
      
      // Expected calculation:
      // deceptive-events: 0.25 * 0.8 * 1.2 = 0.24
      // hidden-redirection: 0.35 * 0 * 0.8 = 0
      // fake-balance: 0.20 * 0.6 * 1.0 = 0.12
      // non-functional-transfer: 0.30 * 0 * 0.8 = 0
      // Total: 0.36, Total Weight: 1.1, Normalized: 0.36/1.1 ≈ 0.327
      
      expect(score).toBeCloseTo(0.327, 2);
    });

    it('should handle empty pattern results', () => {
      const score = calculateWeightedScore({});
      expect(score).toBe(0);
    });

    it('should handle unknown patterns with default weight', () => {
      const unknownPattern: Record<string, PatternResult> = {
        'unknown-pattern': {
          detected: true,
          confidence: 0.5,
          category: 'deceptive-events',
          description: 'Unknown pattern',
          evidence: [],
          severity: 'medium',
          metadata: {},
        },
      };
      
      const score = calculateWeightedScore(unknownPattern);
      // Expected: 0.1 * 0.5 * 1.0 / 0.1 = 0.5
      expect(score).toBe(0.5);
    });

    it('should respect custom configuration', () => {
      const customConfig = {
        patternWeights: {
          'deceptive-events': 0.5,
          'hidden-redirection': 0.3,
          'fake-balance': 0.2,
        },
        severityMultipliers: {
          low: 0.5,
          medium: 1.0,
          high: 1.5,
          critical: 2.0,
        },
      };
      
      const score = calculateWeightedScore(mockPatternResults, customConfig);
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(1);
    });

    it('should cap score at 1.0', () => {
      const extremeResults: Record<string, PatternResult> = {
        'deceptive-events': {
          detected: true,
          confidence: 1.0,
          category: 'deceptive-events',
          description: 'Extreme detection',
          evidence: ['evidence'],
          severity: 'critical',
          metadata: {},
        },
      };
      
      const score = calculateWeightedScore(extremeResults);
      expect(score).toBeLessThanOrEqual(1.0);
    });
  });

  describe('mapScoreToRiskLevel', () => {
    it('should map scores to correct risk levels', () => {
      expect(mapScoreToRiskLevel(0)).toBe('low');
      expect(mapScoreToRiskLevel(0.1)).toBe('low');
      expect(mapScoreToRiskLevel(0.24)).toBe('low');
      expect(mapScoreToRiskLevel(0.25)).toBe('medium');
      expect(mapScoreToRiskLevel(0.4)).toBe('medium');
      expect(mapScoreToRiskLevel(0.49)).toBe('medium');
      expect(mapScoreToRiskLevel(0.5)).toBe('high');
      expect(mapScoreToRiskLevel(0.6)).toBe('high');
      expect(mapScoreToRiskLevel(0.74)).toBe('high');
      expect(mapScoreToRiskLevel(0.75)).toBe('critical');
      expect(mapScoreToRiskLevel(0.9)).toBe('critical');
      expect(mapScoreToRiskLevel(1.0)).toBe('critical');
    });

    it('should handle edge cases', () => {
      expect(mapScoreToRiskLevel(-0.1)).toBe('low');
      expect(mapScoreToRiskLevel(1.5)).toBe('critical');
    });

    it('should handle boundary values correctly', () => {
      expect(mapScoreToRiskLevel(RISK_THRESHOLDS.low.max)).toBe('medium');
      expect(mapScoreToRiskLevel(RISK_THRESHOLDS.medium.max)).toBe('high');
      expect(mapScoreToRiskLevel(RISK_THRESHOLDS.high.max)).toBe('critical');
    });
  });

  describe('calculateBonusScore', () => {
    it('should calculate bonus for multiple patterns', () => {
      const bonus = calculateBonusScore(mockPatternResults);
      
      // 2 patterns detected, so bonus should be 0.1 * (2-1) = 0.1
      expect(bonus).toBeGreaterThan(0);
      expect(bonus).toBeLessThanOrEqual(0.3);
    });

    it('should calculate bonus for dangerous combinations', () => {
      const dangerousResults: Record<string, PatternResult> = {
        'hidden-redirection': {
          detected: true,
          confidence: 0.8,
          category: 'hidden-redirection',
          description: 'Hidden redirection',
          evidence: ['evidence'],
          severity: 'critical',
          metadata: {},
        },
        'deceptive-events': {
          detected: true,
          confidence: 0.9,
          category: 'deceptive-events',
          description: 'Deceptive events',
          evidence: ['evidence'],
          severity: 'high',
          metadata: {},
        },
      };
      
      const bonus = calculateBonusScore(dangerousResults);
      
      // Should include multiple pattern bonus + dangerous combination bonus
      expect(bonus).toBeGreaterThan(0.2); // 0.1 + 0.15 = 0.25
    });

    it('should calculate high confidence bonus', () => {
      const highConfidenceResults: Record<string, PatternResult> = {
        'deceptive-events': {
          detected: true,
          confidence: 0.9,
          category: 'deceptive-events',
          description: 'High confidence',
          evidence: ['evidence'],
          severity: 'high',
          metadata: {},
        },
      };
      
      const bonus = calculateBonusScore(highConfidenceResults);
      expect(bonus).toBeGreaterThan(0); // Should include high confidence bonus
    });

    it('should return 0 for no detected patterns', () => {
      const noDetectionResults: Record<string, PatternResult> = {
        'deceptive-events': {
          detected: false,
          confidence: 0,
          category: 'deceptive-events',
          description: 'No detection',
          evidence: [],
          severity: 'low',
          metadata: {},
        },
      };
      
      const bonus = calculateBonusScore(noDetectionResults);
      expect(bonus).toBe(0);
    });

    it('should cap bonus at 30%', () => {
      const bonus = calculateBonusScore(criticalPatternResults);
      expect(bonus).toBeLessThanOrEqual(0.3);
    });
  });

  describe('calculatePenaltyScore', () => {
    it('should calculate penalty for low confidence patterns', () => {
      const penalty = calculatePenaltyScore(lowConfidencePatternResults);
      
      // Should penalize low confidence detection
      expect(penalty).toBeGreaterThan(0);
      expect(penalty).toBeLessThanOrEqual(0.2);
    });

    it('should calculate penalty for insufficient evidence', () => {
      const insufficientEvidenceResults: Record<string, PatternResult> = {
        'deceptive-events': {
          detected: true,
          confidence: 0.6,
          category: 'deceptive-events',
          description: 'Insufficient evidence',
          evidence: ['single evidence'], // Only one evidence
          severity: 'medium',
          metadata: {},
        },
      };
      
      const penalty = calculatePenaltyScore(insufficientEvidenceResults);
      expect(penalty).toBeGreaterThan(0);
    });

    it('should return 0 for high-quality detections', () => {
      const highQualityResults: Record<string, PatternResult> = {
        'deceptive-events': {
          detected: true,
          confidence: 0.8,
          category: 'deceptive-events',
          description: 'High quality',
          evidence: ['evidence1', 'evidence2', 'evidence3'],
          severity: 'high',
          metadata: {},
        },
      };
      
      const penalty = calculatePenaltyScore(highQualityResults);
      expect(penalty).toBe(0);
    });

    it('should cap penalty at 20%', () => {
      const penalty = calculatePenaltyScore(lowConfidencePatternResults);
      expect(penalty).toBeLessThanOrEqual(0.2);
    });
  });

  describe('assessRisk', () => {
    it('should perform comprehensive risk assessment', () => {
      const assessment = assessRisk(mockPatternResults);
      
      expect(assessment.riskScore).toBeGreaterThan(0);
      expect(assessment.riskScore).toBeLessThanOrEqual(1);
      expect(assessment.riskLevel).toMatch(/^(low|medium|high|critical)$/);
      expect(assessment.confidence).toBeGreaterThan(0);
      expect(assessment.breakdown.patternScores).toBeDefined();
      expect(assessment.explanation.summary).toBeDefined();
      expect(assessment.metadata.totalPatterns).toBe(4);
      expect(assessment.metadata.detectedPatterns).toBe(2);
    });

    it('should handle critical risk scenarios', () => {
      const assessment = assessRisk(criticalPatternResults);
      
      expect(assessment.riskLevel).toBe('critical');
      expect(assessment.riskScore).toBeGreaterThan(0.7);
      expect(assessment.explanation.recommendations).toContain(
        'DO NOT INTERACT with this contract under any circumstances'
      );
    });

    it('should handle low risk scenarios', () => {
      const safeResults: Record<string, PatternResult> = {
        'deceptive-events': {
          detected: false,
          confidence: 0,
          category: 'deceptive-events',
          description: 'No detection',
          evidence: [],
          severity: 'low',
          metadata: {},
        },
      };
      
      const assessment = assessRisk(safeResults);
      
      expect(assessment.riskLevel).toBe('low');
      expect(assessment.riskScore).toBeLessThan(0.25);
      expect(assessment.explanation.summary).toContain('No malicious patterns detected');
    });

    it('should respect configuration settings', () => {
      const config = {
        enableBonusScoring: false,
        enablePenaltyScoring: false,
      };
      
      const assessment = assessRisk(mockPatternResults, config);
      
      expect(assessment.breakdown.bonusScore).toBe(0);
      expect(assessment.breakdown.penaltyScore).toBe(0);
    });

    it('should include detailed breakdown', () => {
      const assessment = assessRisk(mockPatternResults);
      
      expect(assessment.breakdown.baseScore).toBeDefined();
      expect(assessment.breakdown.bonusScore).toBeDefined();
      expect(assessment.breakdown.penaltyScore).toBeDefined();
      expect(assessment.breakdown.finalScore).toBeDefined();
      expect(assessment.breakdown.patternScores).toBeDefined();
      
      // Check pattern scores structure
      Object.entries(assessment.breakdown.patternScores).forEach(([, score]) => {
        expect(score.weight).toBeDefined();
        expect(score.confidence).toBeDefined();
        expect(score.severity).toBeDefined();
        expect(score.contribution).toBeDefined();
        expect(score.detected).toBeDefined();
      });
    });

    it('should generate comprehensive explanations', () => {
      const assessment = assessRisk(mockPatternResults);
      
      expect(assessment.explanation.summary).toBeDefined();
      expect(assessment.explanation.riskFactors).toBeInstanceOf(Array);
      expect(assessment.explanation.mitigatingFactors).toBeInstanceOf(Array);
      expect(assessment.explanation.recommendations).toBeInstanceOf(Array);
      expect(assessment.explanation.detailedAnalysis).toBeDefined();
      
      // Check for specific risk factors
      expect(assessment.explanation.riskFactors.length).toBeGreaterThan(0);
      expect(assessment.explanation.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('generateRecommendations', () => {
    it('should generate appropriate recommendations for each risk level', () => {
      const criticalRecs = generateRecommendations('critical', [['deceptive-events', mockPatternResults['deceptive-events']]]);
      const highRecs = generateRecommendations('high', [['deceptive-events', mockPatternResults['deceptive-events']]]);
      const mediumRecs = generateRecommendations('medium', [['deceptive-events', mockPatternResults['deceptive-events']]]);
      const lowRecs = generateRecommendations('low', [['deceptive-events', mockPatternResults['deceptive-events']]]);
      
      expect(criticalRecs).toContain('DO NOT INTERACT with this contract under any circumstances');
      expect(highRecs).toContain('Exercise extreme caution - likely a scam contract');
      expect(mediumRecs).toContain('Proceed with caution - suspicious patterns detected');
      expect(lowRecs).toContain('Low risk detected - contract appears legitimate');
    });

    it('should include pattern-specific recommendations', () => {
      const patterns: [string, PatternResult][] = [
        ['hidden-redirection', mockPatternResults['deceptive-events']],
        ['deceptive-events', mockPatternResults['deceptive-events']],
        ['fake-balance', mockPatternResults['fake-balance']],
        ['non-functional-transfer', mockPatternResults['deceptive-events']],
      ];
      
      const recommendations = generateRecommendations('high', patterns);
      
      expect(recommendations).toContain('Contract may redirect funds to unauthorized addresses');
      expect(recommendations).toContain('Contract may emit fake success events');
      expect(recommendations).toContain('Contract may display incorrect balance information');
      expect(recommendations).toContain('Contract transfers may not function as expected');
    });

    it('should remove duplicate recommendations', () => {
      const patterns: [string, PatternResult][] = [
        ['deceptive-events', mockPatternResults['deceptive-events']],
        ['deceptive-events', mockPatternResults['deceptive-events']],
      ];
      
      const recommendations = generateRecommendations('high', patterns);
      const uniqueRecs = [...new Set(recommendations)];
      
      expect(recommendations.length).toBe(uniqueRecs.length);
    });
  });

  describe('generateDetailedAnalysis', () => {
    it('should generate detailed technical analysis', () => {
      const assessment = assessRisk(mockPatternResults);
      const analysis = generateDetailedAnalysis(
        mockPatternResults,
        assessment.riskScore,
        assessment.riskLevel,
        assessment.breakdown
      );
      
      expect(analysis).toContain('Risk Score Analysis:');
      expect(analysis).toContain('Pattern Contributions:');
      expect(analysis).toContain('Base Score:');
      expect(analysis).toContain('Final Score:');
      expect(analysis).toContain('Risk Level:');
    });

    it('should include evidence summary for detected patterns', () => {
      const analysis = generateDetailedAnalysis(
        mockPatternResults,
        0.5,
        'high',
        {
          patternScores: {},
          baseScore: 0.4,
          bonusScore: 0.1,
          penaltyScore: 0,
          finalScore: 0.5,
          normalizedScore: 0.5,
        }
      );
      
      expect(analysis).toContain('Evidence Summary:');
      expect(analysis).toContain('deceptive-events:');
      expect(analysis).toContain('fake-balance:');
    });
  });

  describe('Utility Functions', () => {
    describe('formatRiskScore', () => {
      it('should format risk score as percentage', () => {
        expect(formatRiskScore(0.0)).toBe('0%');
        expect(formatRiskScore(0.25)).toBe('25%');
        expect(formatRiskScore(0.5)).toBe('50%');
        expect(formatRiskScore(0.75)).toBe('75%');
        expect(formatRiskScore(1.0)).toBe('100%');
      });

      it('should round to nearest integer', () => {
        expect(formatRiskScore(0.234)).toBe('23%');
        expect(formatRiskScore(0.678)).toBe('68%');
      });
    });

    describe('getRiskLevelColor', () => {
      it('should return correct colors for risk levels', () => {
        expect(getRiskLevelColor('low')).toBe('#22c55e');
        expect(getRiskLevelColor('medium')).toBe('#f59e0b');
        expect(getRiskLevelColor('high')).toBe('#ef4444');
        expect(getRiskLevelColor('critical')).toBe('#dc2626');
      });
    });

    describe('getRiskLevelIcon', () => {
      it('should return correct icons for risk levels', () => {
        expect(getRiskLevelIcon('low')).toBe('✓');
        expect(getRiskLevelIcon('medium')).toBe('⚠');
        expect(getRiskLevelIcon('high')).toBe('❌');
        expect(getRiskLevelIcon('critical')).toBe('🚨');
      });
    });
  });

  describe('Configuration Management', () => {
    describe('getDefaultRiskScoringConfig', () => {
      it('should return valid default configuration', () => {
        const config = getDefaultRiskScoringConfig();
        
        expect(config.patternWeights).toEqual(PATTERN_WEIGHTS);
        expect(config.riskThresholds).toEqual(RISK_THRESHOLDS);
        expect(config.severityMultipliers).toEqual(SEVERITY_MULTIPLIERS);
        expect(config.enableBonusScoring).toBe(true);
        expect(config.enablePenaltyScoring).toBe(true);
      });
    });

    describe('validateRiskScoringConfig', () => {
      it('should validate correct configuration', () => {
        const validConfig = {
          patternWeights: { 'test-pattern': 0.5 },
          riskThresholds: { low: { min: 0, max: 0.5 } },
          severityMultipliers: { low: 1.0 },
          enableBonusScoring: true,
          enablePenaltyScoring: false,
        };
        
        expect(() => validateRiskScoringConfig(validConfig)).not.toThrow();
      });

      it('should reject invalid configuration', () => {
        const invalidConfig = {
          patternWeights: { 'test-pattern': 1.5 }, // Invalid: > 1
          riskThresholds: { low: { min: 0, max: 0.5 } },
          severityMultipliers: { low: 1.0 },
          enableBonusScoring: true,
          enablePenaltyScoring: false,
        };
        
        expect(() => validateRiskScoringConfig(invalidConfig)).toThrow();
      });
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle empty input gracefully', () => {
      const assessment = assessRisk({});
      
      expect(assessment.riskScore).toBe(0);
      expect(assessment.riskLevel).toBe('low');
      expect(assessment.metadata.totalPatterns).toBe(0);
      expect(assessment.metadata.detectedPatterns).toBe(0);
    });

    it('should handle patterns with missing fields', () => {
      const incompletePattern: Record<string, PatternResult> = {
        'test-pattern': {
          detected: true,
          confidence: 0.5,
          category: 'deceptive-events',
          description: 'Test pattern',
          evidence: [],
          severity: 'medium',
          metadata: {},
        },
      };
      
      expect(() => assessRisk(incompletePattern)).not.toThrow();
    });

    it('should handle extreme confidence values', () => {
      const extremePattern: Record<string, PatternResult> = {
        'extreme-pattern': {
          detected: true,
          confidence: 1.0,
          category: 'deceptive-events',
          description: 'Extreme confidence',
          evidence: ['evidence'],
          severity: 'critical',
          metadata: {},
        },
      };
      
      const assessment = assessRisk(extremePattern);
      expect(assessment.riskScore).toBeLessThanOrEqual(1.0);
      expect(assessment.confidence).toBe(1.0);
    });

    it('should handle zero confidence values', () => {
      const zeroConfidencePattern: Record<string, PatternResult> = {
        'zero-pattern': {
          detected: true,
          confidence: 0,
          category: 'deceptive-events',
          description: 'Zero confidence',
          evidence: [],
          severity: 'low',
          metadata: {},
        },
      };
      
      const assessment = assessRisk(zeroConfidencePattern);
      expect(assessment.riskScore).toBeGreaterThanOrEqual(0);
    });

    it('should maintain score bounds under all conditions', () => {
      const testCases = [
        mockPatternResults,
        criticalPatternResults,
        lowConfidencePatternResults,
        {},
      ];
      
      testCases.forEach(testCase => {
        const assessment = assessRisk(testCase);
        expect(assessment.riskScore).toBeGreaterThanOrEqual(0);
        expect(assessment.riskScore).toBeLessThanOrEqual(1);
        expect(assessment.confidence).toBeGreaterThanOrEqual(0);
        expect(assessment.confidence).toBeLessThanOrEqual(1);
      });
    });
  });

  describe('Performance and Consistency', () => {
    it('should produce consistent results for same input', () => {
      const assessment1 = assessRisk(mockPatternResults);
      const assessment2 = assessRisk(mockPatternResults);
      
      expect(assessment1.riskScore).toBe(assessment2.riskScore);
      expect(assessment1.riskLevel).toBe(assessment2.riskLevel);
      expect(assessment1.confidence).toBe(assessment2.confidence);
    });

    it('should handle large numbers of patterns efficiently', () => {
      const manyPatterns: Record<string, PatternResult> = {};
      for (let i = 0; i < 100; i++) {
        manyPatterns[`pattern-${i}`] = {
          detected: i % 2 === 0,
          confidence: Math.random(),
          category: 'deceptive-events',
          description: `Pattern ${i}`,
          evidence: [`Evidence ${i}`],
          severity: 'medium',
          metadata: {},
        };
      }
      
      const startTime = Date.now();
      const assessment = assessRisk(manyPatterns);
      const endTime = Date.now();
      
      expect(assessment).toBeDefined();
      expect(endTime - startTime).toBeLessThan(1000); // Should complete in under 1 second
    });
  });

  describe('Integration Tests', () => {
    it('should integrate properly with pattern detection results', () => {
      // Simulate real pattern detection output
      const realisticResults: Record<string, PatternResult> = {
        'deceptive-events': {
          detected: true,
          confidence: 0.85,
          category: 'deceptive-events',
          description: 'Detected 3 deceptive event pattern(s) with 85% confidence',
          evidence: [
            'Event \'Transfer\' appears to be emitted without corresponding state changes',
            'Event \'Success\' appears to be emitted without corresponding state changes',
            'Function \'transfer\' modifies state but doesn\'t emit expected events'
          ],
          severity: 'high',
          metadata: {
            eventsAnalyzed: 5,
            functionsAnalyzed: 8,
            suspiciousEvents: 2,
            suspiciousFunctions: 1,
          },
        },
        'hidden-redirection': {
          detected: false,
          confidence: 0,
          category: 'hidden-redirection',
          description: 'No hidden redirection patterns detected',
          evidence: [],
          severity: 'low',
          metadata: {
            opcodesAnalyzed: 150,
            redirectionPatternsChecked: 5,
            suspiciousSequences: 0,
          },
        },
        'fake-balance': {
          detected: true,
          confidence: 0.72,
          category: 'fake-balance',
          description: 'Detected 1 fake balance pattern(s) with 72% confidence',
          evidence: [
            'Function \'balanceOf\' returns timestamp-based value',
            'Balance calculation appears to be manipulated'
          ],
          severity: 'medium',
          metadata: {
            balanceFunctionsAnalyzed: 3,
            suspiciousCalculations: 1,
          },
        },
        'non-functional-transfer': {
          detected: false,
          confidence: 0,
          category: 'non-functional-transfer',
          description: 'No non-functional transfer patterns detected',
          evidence: [],
          severity: 'low',
          metadata: {
            transferFunctionsAnalyzed: 4,
            nonFunctionalPatterns: 0,
          },
        },
      };
      
      const assessment = assessRisk(realisticResults);
      
      expect(assessment.riskLevel).toMatch(/^(medium|high)$/); // Accept both medium and high as valid
      expect(assessment.riskScore).toBeGreaterThan(0.2);
      expect(assessment.metadata.detectedPatterns).toBe(2);
      expect(assessment.explanation.riskFactors.length).toBeGreaterThan(0);
      // Check for appropriate recommendations based on risk level
      if (assessment.riskLevel === 'high') {
        expect(assessment.explanation.recommendations).toContain('Exercise extreme caution - likely a scam contract');
      } else {
        expect(assessment.explanation.recommendations).toContain('Proceed with caution - suspicious patterns detected');
      }
    });
  });
});
