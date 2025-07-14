# Risk Assessment Engine

## Overview

The risk assessment engine (`riskScoring.ts`) implements a comprehensive weighted scoring system for evaluating smart contract security risks based on pattern detection results.

## Implementation

### Core Formula

The engine implements the weighted scoring formula:
```
score = Σ(patternWeight * detection.confidence * severityMultiplier)
```

### Key Features

1. **Weighted Pattern Scoring**
   - Hidden redirection: 35% weight (highest priority)
   - Non-functional transfer: 30% weight
   - Deceptive events: 25% weight
   - Fake balance: 20% weight

2. **Severity Multipliers**
   - Critical: 1.5x multiplier
   - High: 1.2x multiplier
   - Medium: 1.0x multiplier
   - Low: 0.8x multiplier

3. **Risk Level Mapping**
   - Low: 0-25%
   - Medium: 25-50%
   - High: 50-75%
   - Critical: 75-100%

4. **Bonus & Penalty System**
   - Multiple pattern detection bonus
   - Dangerous combination bonuses
   - High confidence bonuses
   - Low confidence penalties
   - Insufficient evidence penalties

### Functions

#### Core Functions
- `calculateWeightedScore()` - Implements the weighted scoring formula
- `mapScoreToRiskLevel()` - Maps numeric scores to risk levels
- `assessRisk()` - Comprehensive risk assessment with detailed breakdown

#### Explanation Generation
- `generateRiskExplanation()` - Creates human-readable explanations
- `generateRecommendations()` - Provides risk-level specific recommendations
- `generateDetailedAnalysis()` - Technical analysis breakdown

#### Utility Functions
- `formatRiskScore()` - Formats scores as percentages
- `getRiskLevelColor()` - UI color codes for risk levels
- `getRiskLevelIcon()` - Visual icons for risk levels

### Configuration

The engine supports configurable:
- Pattern weights
- Risk thresholds
- Severity multipliers
- Bonus/penalty scoring toggles

### Testing

Comprehensive test suite covering:
- ✅ Weighted scoring formula accuracy
- ✅ Risk level mapping logic
- ✅ Bonus and penalty calculations
- ✅ Edge cases and error handling
- ✅ Performance and consistency
- ✅ Integration with pattern detection
- ✅ Configuration validation

### Usage Examples

```typescript
import { detectAllPatterns } from './patternDetection';
import { assessRisk, formatRiskScore } from './riskScoring';

// Basic usage
const patterns = detectAllPatterns(contractABI);
const assessment = assessRisk(patterns.patternResults);

console.log(`Risk: ${assessment.riskLevel}`);
console.log(`Score: ${formatRiskScore(assessment.riskScore)}`);
console.log(`Summary: ${assessment.explanation.summary}`);

// Custom configuration
const customConfig = {
  patternWeights: {
    'hidden-redirection': 0.5,  // Increase weight
    'deceptive-events': 0.3,
  },
  enableBonusScoring: false,
};

const customAssessment = assessRisk(patterns.patternResults, customConfig);
```

### Integration

The risk scoring engine integrates seamlessly with the existing pattern detection system:

1. Pattern detection provides `PatternResult` objects
2. Risk engine processes these results with weighted scoring
3. Detailed explanations and recommendations are generated
4. Results include both technical metrics and user-friendly summaries

See `riskScoring.example.ts` for comprehensive usage examples.

## Quality Assurance

- **100% TypeScript typed** - Full type safety with Zod validation
- **Pure functions** - No side effects, deterministic results
- **Comprehensive testing** - 43 test cases covering all scenarios
- **Performance optimized** - Handles large datasets efficiently
- **Security focused** - Input validation and error handling
- **Documentation complete** - Detailed comments and examples

## Verification Checklist

- [x] Component properly typed and tested
- [x] Error handling implemented
- [x] Loading states provided (N/A for pure functions)
- [x] Security considerations addressed
- [x] Performance optimized
- [x] Documentation updated
