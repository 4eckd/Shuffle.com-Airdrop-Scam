/**
 * Risk Scoring Integration Example
 * 
 * This example demonstrates how to use the new risk assessment engine
 * with the existing pattern detection system to provide comprehensive
 * risk analysis with detailed explanations.
 */

import { detectAllPatterns } from './patternDetection';
import { assessRisk, formatRiskScore, getRiskLevelIcon } from './riskScoring';
import { ABI } from '../types';

/**
 * Example: Complete risk assessment workflow
 */
export async function performCompleteRiskAssessment(input: string | ABI) {
  console.log('🔍 Starting comprehensive risk assessment...\n');

  // Step 1: Detect all patterns using existing system
  console.log('📋 Step 1: Pattern Detection');
  const patternAnalysis = detectAllPatterns(input);
  
  console.log(`   • Analyzed ${patternAnalysis.metadata.totalPatternsAnalyzed} patterns`);
  console.log(`   • Detected ${patternAnalysis.metadata.totalPatternsDetected} malicious patterns`);
  console.log(`   • Overall confidence: ${Math.round(patternAnalysis.overallConfidence * 100)}%`);
  console.log(`   • Legacy risk score: ${patternAnalysis.overallRiskScore}/100\n`);

  // Step 2: Enhanced risk assessment using new engine
  console.log('⚖️  Step 2: Enhanced Risk Assessment');
  const riskAssessment = assessRisk(patternAnalysis.patternResults);
  
  console.log(`   • Risk Score: ${formatRiskScore(riskAssessment.riskScore)}`);
  console.log(`   • Risk Level: ${getRiskLevelIcon(riskAssessment.riskLevel)} ${riskAssessment.riskLevel.toUpperCase()}`);
  console.log(`   • Confidence: ${formatRiskScore(riskAssessment.confidence)}`);
  console.log(`   • Version: ${riskAssessment.metadata.version}\n`);

  // Step 3: Display detailed breakdown
  console.log('📊 Step 3: Risk Breakdown');
  console.log(`   Base Score:    ${formatRiskScore(riskAssessment.breakdown.baseScore)}`);
  console.log(`   Bonus Score:   +${formatRiskScore(riskAssessment.breakdown.bonusScore)}`);
  console.log(`   Penalty Score: -${formatRiskScore(riskAssessment.breakdown.penaltyScore)}`);
  console.log(`   Final Score:   ${formatRiskScore(riskAssessment.breakdown.finalScore)}\n`);

  // Step 4: Pattern contributions
  console.log('🎯 Step 4: Pattern Contributions');
  Object.entries(riskAssessment.breakdown.patternScores).forEach(([pattern, score]) => {
    const status = score.detected ? '✓' : '✗';
    const contribution = formatRiskScore(score.contribution);
    console.log(`   ${status} ${pattern}: ${contribution} (Weight: ${Math.round(score.weight * 100)}%, Confidence: ${Math.round(score.confidence * 100)}%)`);
  });
  console.log('');

  // Step 5: Summary and recommendations
  console.log('📝 Step 5: Summary & Recommendations');
  console.log(`   ${riskAssessment.explanation.summary}\n`);
  
  if (riskAssessment.explanation.riskFactors.length > 0) {
    console.log('   ⚠️  Risk Factors:');
    riskAssessment.explanation.riskFactors.forEach(factor => {
      console.log(`     • ${factor}`);
    });
    console.log('');
  }

  if (riskAssessment.explanation.mitigatingFactors.length > 0) {
    console.log('   ✅ Mitigating Factors:');
    riskAssessment.explanation.mitigatingFactors.forEach(factor => {
      console.log(`     • ${factor}`);
    });
    console.log('');
  }

  console.log('   💡 Recommendations:');
  riskAssessment.explanation.recommendations.forEach(rec => {
    console.log(`     • ${rec}`);
  });
  console.log('');

  // Step 6: Technical details (optional)
  if (process.env.NODE_ENV === 'development') {
    console.log('🔧 Step 6: Technical Analysis');
    console.log(riskAssessment.explanation.detailedAnalysis);
  }

  return {
    patternAnalysis,
    riskAssessment,
    summary: {
      riskLevel: riskAssessment.riskLevel,
      riskScore: riskAssessment.riskScore,
      patternsDetected: riskAssessment.metadata.detectedPatterns,
      recommendations: riskAssessment.explanation.recommendations,
    },
  };
}

/**
 * Example: Quick risk check
 */
export function quickRiskCheck(input: string | ABI): string {
  const patternAnalysis = detectAllPatterns(input);
  const riskAssessment = assessRisk(patternAnalysis.patternResults);
  
  const icon = getRiskLevelIcon(riskAssessment.riskLevel);
  const score = formatRiskScore(riskAssessment.riskScore);
  const level = riskAssessment.riskLevel.toUpperCase();
  
  return `${icon} ${level} RISK (${score}) - ${riskAssessment.explanation.summary}`;
}

/**
 * Example: Batch analysis with risk comparison
 */
export function batchRiskAnalysis(contracts: Array<{ name: string; input: string | ABI }>) {
  console.log('📦 Batch Risk Analysis\n');
  
  const results = contracts.map(contract => {
    const patternAnalysis = detectAllPatterns(contract.input);
    const riskAssessment = assessRisk(patternAnalysis.patternResults);
    
    return {
      name: contract.name,
      riskLevel: riskAssessment.riskLevel,
      riskScore: riskAssessment.riskScore,
      patternsDetected: riskAssessment.metadata.detectedPatterns,
      summary: riskAssessment.explanation.summary,
    };
  });

  // Sort by risk score (highest first)
  results.sort((a, b) => b.riskScore - a.riskScore);

  console.log('Results (sorted by risk):');
  results.forEach((result, index) => {
    const icon = getRiskLevelIcon(result.riskLevel);
    const score = formatRiskScore(result.riskScore);
    console.log(`${index + 1}. ${result.name}: ${icon} ${score} (${result.patternsDetected} patterns)`);
  });

  return results;
}

/**
 * Example: Custom risk configuration
 */
export function customRiskAssessment(input: string | ABI) {
  const patternAnalysis = detectAllPatterns(input);
  
  // Custom configuration with different weights
  const customConfig = {
    patternWeights: {
      'hidden-redirection': 0.4,    // Increased weight for redirection
      'deceptive-events': 0.3,      // Increased weight for deceptive events
      'non-functional-transfer': 0.2, // Standard weight
      'fake-balance': 0.1,          // Reduced weight for fake balance
    },
    severityMultipliers: {
      low: 0.5,
      medium: 1.0,
      high: 1.5,
      critical: 2.0,                // Increased critical multiplier
    },
    enableBonusScoring: true,
    enablePenaltyScoring: false,    // Disable penalties for this assessment
  };

  const standardAssessment = assessRisk(patternAnalysis.patternResults);
  const customAssessment = assessRisk(patternAnalysis.patternResults, customConfig);

  console.log('📈 Risk Assessment Comparison\n');
  console.log('Standard Assessment:');
  console.log(`   Risk Level: ${standardAssessment.riskLevel}`);
  console.log(`   Risk Score: ${formatRiskScore(standardAssessment.riskScore)}`);
  console.log('');
  console.log('Custom Assessment (prioritizing redirection & events):');
  console.log(`   Risk Level: ${customAssessment.riskLevel}`);
  console.log(`   Risk Score: ${formatRiskScore(customAssessment.riskScore)}`);
  console.log('');

  return { standardAssessment, customAssessment };
}

// Example usage (commented out for production)
/*
// Example ABI for testing
const exampleABI = [
  {
    "name": "transfer",
    "type": "function",
    "inputs": [
      {"name": "to", "type": "address"},
      {"name": "amount", "type": "uint256"}
    ],
    "outputs": [{"name": "", "type": "bool"}],
    "stateMutability": "nonpayable"
  },
  {
    "name": "Transfer",
    "type": "event",
    "inputs": [
      {"name": "from", "type": "address", "indexed": true},
      {"name": "to", "type": "address", "indexed": true},
      {"name": "value", "type": "uint256", "indexed": false}
    ],
    "anonymous": false
  }
];

// Run examples
performCompleteRiskAssessment(exampleABI);
console.log(quickRiskCheck(exampleABI));
batchRiskAnalysis([
  { name: "Contract A", input: exampleABI },
  { name: "Contract B", input: "0x608060405234801561001057600080fd5b50..." }
]);
customRiskAssessment(exampleABI);
*/
