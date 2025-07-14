# Advanced Contract Analysis API

## Overview

The `analyzeContractAdvanced` method provides comprehensive smart contract security analysis, including bytecode analysis, pattern detection, risk scoring, and detailed security warnings. This method extends the basic analysis capabilities with advanced features for thorough contract evaluation.

## Method Signature

```typescript
async analyzeContractAdvanced(
  address: string,
  provider?: JsonRpcProvider
): Promise<AdvancedContractAnalysis>
```

### Parameters

- **address** (`string`): Ethereum contract address to analyze
- **provider** (`JsonRpcProvider`, optional): Custom Ethereum RPC provider. If not provided, uses default provider

### Returns

Returns a `Promise<AdvancedContractAnalysis>` containing comprehensive analysis results.

## AdvancedContractAnalysis Schema

```typescript
type AdvancedContractAnalysis = {
  // Basic analysis fields (backward compatible)
  contractAddress: string;
  contractName: string;
  analysisStatus: 'pending' | 'complete' | 'failed' | 'in-progress';
  vulnerabilities: string[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  analysisDate: Date;
  lastUpdated: Date;
  metadata?: Record<string, unknown>;
  
  // Advanced analysis fields
  bytecode?: string;                    // Contract bytecode
  bytecodeSize?: number;                // Size in bytes
  isContract?: boolean;                 // Whether address is a contract
  isProxyContract?: boolean;            // Whether it's a proxy contract
  patternResults?: Record<string, PatternResult>; // Pattern detection results
  riskAssessment?: RiskAssessment;      // Comprehensive risk analysis
  securityWarnings?: SecurityWarning[]; // Generated security warnings
};
```

## Analysis Components

### 1. Bytecode Analysis

Retrieves and analyzes contract bytecode:

- **Bytecode Fetching**: Downloads bytecode from Ethereum network
- **Size Analysis**: Calculates bytecode size in bytes
- **Contract Detection**: Determines if address is a contract or EOA
- **Proxy Detection**: Identifies common proxy patterns (EIP-1167, etc.)

### 2. Pattern Detection

Analyzes contract for known scam patterns:

- **Deceptive Events**: Events emitted without state changes
- **Hidden Redirection**: Fund redirection to hardcoded addresses
- **Fake Balance**: Timestamp-based or fake balance reporting
- **Non-Functional Transfer**: Transfer functions that don't work

### 3. Risk Assessment

Comprehensive risk scoring based on:

- **Pattern Weights**: Different patterns have different impact scores
- **Confidence Levels**: Analysis confidence for each pattern
- **Severity Multipliers**: Critical patterns get higher weighting
- **Bonus/Penalty Scoring**: Multiple patterns or low confidence adjustments

### 4. Security Warnings

Generated warnings include:

- **Known Malicious Addresses**: Alerts for known scam contracts
- **Pattern-Based Warnings**: Specific warnings for detected patterns
- **Educational Warnings**: General security advisories

## Usage Examples

### Basic Usage

```typescript
import { ScamAnalysisTool } from 'shuffle-airdrop-scam-analysis';

const tool = new ScamAnalysisTool();

// Analyze with default provider
const result = await tool.analyzeContractAdvanced('0x1234...');

console.log('Risk Level:', result.riskLevel);
console.log('Security Warnings:', result.securityWarnings);
```

### Custom Provider

```typescript
import { JsonRpcProvider } from 'ethers';

const customProvider = new JsonRpcProvider('https://your-rpc-endpoint.com');
const result = await tool.analyzeContractAdvanced('0x1234...', customProvider);
```

### Comprehensive Analysis

```typescript
const result = await tool.analyzeContractAdvanced('0x1234...');

// Check if it's a contract
if (result.isContract) {
  console.log('Bytecode size:', result.bytecodeSize);
  console.log('Is proxy:', result.isProxyContract);
}

// Review pattern detection results
if (result.patternResults) {
  Object.entries(result.patternResults).forEach(([pattern, analysis]) => {
    if (analysis.detected) {
      console.log(`${pattern}: ${analysis.confidence * 100}% confidence`);
    }
  });
}

// Review risk assessment
if (result.riskAssessment) {
  console.log('Risk Score:', Math.round(result.riskAssessment.riskScore * 100) + '%');
  console.log('Summary:', result.riskAssessment.explanation.summary);
  console.log('Recommendations:', result.riskAssessment.explanation.recommendations);
}
```

## Error Handling

The method gracefully handles various error conditions:

```typescript
try {
  const result = await tool.analyzeContractAdvanced('invalid-address');
} catch (error) {
  // Method returns failed analysis instead of throwing
  console.log(result.analysisStatus); // 'failed'
  console.log(result.vulnerabilities); // Contains error message
}
```

### Error Scenarios

- **Invalid Address**: Returns failed analysis with validation error
- **Network Issues**: Continues with limited analysis, logs warnings
- **Provider Errors**: Falls back to basic analysis capabilities
- **Pattern Detection Errors**: Individual pattern failures don't stop analysis

## Performance Considerations

### Caching

- Bytecode results are cached (LRU cache, 10-minute TTL)
- Repeated analysis of same address is faster
- Cache can be cleared with `clearBytecodeCache()`

### Network Calls

- Single RPC call to fetch bytecode
- Default provider uses public Ethereum RPC
- Analysis continues even if bytecode fetch fails

### Processing Time

- Typical analysis: 100-500ms
- Network-dependent for bytecode fetching
- Pattern detection: <50ms for most contracts

## Security Features

### Input Validation

- All inputs validated with Zod schemas
- Address format validation (40-character hex)
- Provider validation and error handling

### Safe Analysis

- Static analysis only - no contract execution
- No private key handling or transaction signing
- Sandboxed pattern matching algorithms

### Error Boundaries

- Comprehensive error handling prevents crashes
- Failed components don't stop entire analysis
- Secure defaults for all error conditions

## Backward Compatibility

The `analyzeContractAdvanced` method is fully backward compatible:

- Original `analyzeContract` method remains unchanged
- All basic analysis fields are included in advanced results
- Existing code can gradually migrate to advanced analysis

### Migration Guide

```typescript
// Old approach
const basicResult = tool.analyzeContract(address);

// New approach - includes all basic fields plus advanced features
const advancedResult = await tool.analyzeContractAdvanced(address);

// Access basic fields (same as before)
console.log(advancedResult.riskLevel);      // Same as basicResult.riskLevel
console.log(advancedResult.vulnerabilities); // Enhanced version of basicResult.warnings

// Access new advanced fields
console.log(advancedResult.bytecode);
console.log(advancedResult.riskAssessment);
console.log(advancedResult.securityWarnings);
```

## Configuration Options

### Environment Variables

```bash
# Custom RPC endpoint (optional)
ETHEREUM_RPC_URL=https://your-endpoint.com

# Enable/disable security warnings
ENABLE_SECURITY_WARNINGS=true

# Analysis timeout (milliseconds)
ANALYSIS_TIMEOUT=30000
```

### Provider Configuration

```typescript
import { JsonRpcProvider } from 'ethers';

// Configure custom provider with timeout
const provider = new JsonRpcProvider('https://rpc-endpoint.com', {
  timeout: 10000
});

const result = await tool.analyzeContractAdvanced(address, provider);
```

## Integration Examples

### Web Application

```typescript
// React component example
const [analysis, setAnalysis] = useState(null);
const [loading, setLoading] = useState(false);

const analyzeContract = async (address) => {
  setLoading(true);
  try {
    const result = await tool.analyzeContractAdvanced(address);
    setAnalysis(result);
  } catch (error) {
    console.error('Analysis failed:', error);
  } finally {
    setLoading(false);
  }
};
```

### Node.js Server

```typescript
// Express.js endpoint
app.post('/analyze', async (req, res) => {
  const { address } = req.body;
  
  try {
    const result = await tool.analyzeContractAdvanced(address);
    res.json({
      success: true,
      analysis: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});
```

### Batch Analysis

```typescript
// Analyze multiple contracts
const addresses = ['0x1234...', '0x5678...', '0x9abc...'];

const results = await Promise.all(
  addresses.map(address => 
    tool.analyzeContractAdvanced(address)
  )
);

// Process results
results.forEach((result, index) => {
  console.log(`${addresses[index]}: ${result.riskLevel} risk`);
});
```

## Best Practices

### 1. Provider Management

```typescript
// Use connection pooling for high-volume analysis
const provider = new JsonRpcProvider('https://rpc-endpoint.com', {
  timeout: 10000,
  throttleLimit: 10
});

// Reuse provider instance
const tool = new ScamAnalysisTool();
const results = await Promise.all([
  tool.analyzeContractAdvanced(address1, provider),
  tool.analyzeContractAdvanced(address2, provider),
]);
```

### 2. Error Handling

```typescript
const analyzeWithRetry = async (address, maxRetries = 3) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const result = await tool.analyzeContractAdvanced(address);
      if (result.analysisStatus === 'complete') {
        return result;
      }
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
};
```

### 3. Result Processing

```typescript
const processAnalysis = (result) => {
  // Check critical risks first
  if (result.riskLevel === 'critical') {
    return {
      action: 'BLOCK',
      message: 'Critical security risk detected'
    };
  }

  // Review specific patterns
  const hasRedirection = result.patternResults?.['hidden-redirection']?.detected;
  if (hasRedirection) {
    return {
      action: 'WARN',
      message: 'Fund redirection pattern detected'
    };
  }

  return {
    action: 'ALLOW',
    message: 'Analysis complete - low risk'
  };
};
```

## See Also

- [Basic Analysis API](./README.md#basic-analysis)
- [Pattern Detection](../patterns/README.md)
- [Risk Scoring](./risk-scoring.md)
- [Bytecode Analysis](./bytecode.md)
- [Security Considerations](../security.md)
