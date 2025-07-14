# API Documentation for ScamAnalysisTool

![Version](https://img.shields.io/badge/version-1.3.0-blue.svg)
![TypeScript](https://img.shields.io/badge/typescript-5.3+-blue.svg)
![Security](https://img.shields.io/badge/security-first-red.svg)

---

![Security Warning](https://img.shields.io/badge/warning-critical-red.svg)

**⚠️ CRITICAL SECURITY WARNING:**

This documentation covers the usage of `ScamAnalysisTool`, a tool designed exclusively for security research and educational purposes. The tool analyzes potentially malicious smart contracts that are designed to defraud users. **NEVER INTERACT WITH OR DEPLOY ANY ANALYZED CONTRACT.** Always follow security best practices and maintain educational focus when utilizing this tool.

---

## Overview

The ScamAnalysisTool suite provides comprehensive TypeScript utilities for identifying and analyzing smart contracts with potential security vulnerabilities and scam patterns. It implements a security-first design approach with built-in validation, warning systems, and protection against known malicious contract addresses.

### Core Modules

- **[ScamAnalysisTool](#scamanalysistool)** - Main analysis class for contract security research
- **[Bytecode Analysis](bytecode.md)** - Advanced bytecode retrieval and caching system

### Key Features

- **Address Validation**: Comprehensive Ethereum address format validation
- **Known Threat Detection**: Built-in database of malicious contract addresses
- **Security Warning System**: Automatic generation of security warnings
- **Input Sanitization**: Protection against injection attacks
- **Error Handling**: Comprehensive error types and safe exception handling
- **Type Safety**: Full TypeScript support with Zod schema validation

### Constructor

```typescript
import { ScamAnalysisTool } from './src/index';

const tool = new ScamAnalysisTool();
```

**Initialization Process:**
1. Loads configuration from environment variables
2. Initializes security warning system
3. Displays critical security warning (if enabled)
4. Sets up validation and threat detection systems

**Constructor Warnings:**
- Displays security warnings by default
- Can be disabled via `ENABLE_SECURITY_WARNINGS=false` environment variable
- Always maintains security-first approach regardless of warning settings

### Public Methods

#### `analyzeContract(address: string)` (Basic Analysis)

Performs basic analysis of a contract address for known security issues and malicious patterns.

**⚠️ Deprecated**: Use `analyzeContractAdvanced()` for comprehensive analysis with bytecode analysis, pattern detection, and advanced risk scoring.

```typescript
const result = tool.analyzeContract('0xacba164135904dc63c5418b57ff87efd341d7c80');
console.log(result);
// {
//   isValid: true,
//   isMalicious: true,
//   warnings: ['CRITICAL WARNING: This contract address is known to be malicious...'],
//   riskLevel: 'critical'
// }
```

**Parameters:**
- `address`: `string` - Ethereum contract address to analyze

**Returns:**
```typescript
{
  isValid: boolean;        // Whether the address format is valid
  isMalicious: boolean;    // Whether the address is known to be malicious
  warnings: string[];      // Array of warning messages
  riskLevel: 'low' | 'medium' | 'high' | 'critical';  // Risk assessment
}
```

**Throws:**
- `SecurityError` - For security-related validation failures
- `ValidationError` - For address format validation failures

#### `analyzeContractAdvanced(address: string, provider?: JsonRpcProvider)` (Advanced Analysis)

Performs comprehensive security analysis including bytecode analysis, pattern detection, risk scoring, and detailed security warnings.

```typescript
import { JsonRpcProvider } from 'ethers';

// Using default provider
const result = await tool.analyzeContractAdvanced('0xacba164135904dc63c5418b57ff87efd341d7c80');

// Using custom provider
const customProvider = new JsonRpcProvider('https://your-rpc-endpoint.com');
const result = await tool.analyzeContractAdvanced('0x1234...', customProvider);

console.log(result);
// {
//   contractAddress: '0xacba164135904dc63c5418b57ff87efd341d7c80',
//   contractName: 'Contract_0xacba16',
//   analysisStatus: 'complete',
//   vulnerabilities: ['CRITICAL WARNING: This contract address is known to be malicious...'],
//   riskLevel: 'critical',
//   analysisDate: Date,
//   lastUpdated: Date,
//   bytecode: '0x608060405234801561001057600080fd5b50...',
//   bytecodeSize: 2048,
//   isContract: true,
//   isProxyContract: false,
//   patternResults: {
//     'deceptive-events': { detected: true, confidence: 0.85, ... },
//     'hidden-redirection': { detected: false, confidence: 0, ... }
//   },
//   riskAssessment: {
//     riskScore: 0.92,
//     confidence: 0.88,
//     explanation: { summary: '...', recommendations: [...] }
//   },
//   securityWarnings: [{
//     level: 'critical',
//     message: 'CRITICAL WARNING: This contract address is known to be malicious...',
//     category: 'deceptive-events'
//   }]
// }
```

**Parameters:**
- `address`: `string` - Ethereum contract address to analyze
- `provider`: `JsonRpcProvider` (optional) - Custom Ethereum RPC provider

**Returns:** `Promise<AdvancedContractAnalysis>` - Comprehensive analysis results including:
- All basic analysis fields (backward compatible)
- `bytecode?: string` - Contract bytecode
- `bytecodeSize?: number` - Bytecode size in bytes  
- `isContract?: boolean` - Whether address is a contract
- `isProxyContract?: boolean` - Whether it's a proxy contract
- `patternResults?: Record<string, PatternResult>` - Pattern detection results
- `riskAssessment?: RiskAssessment` - Detailed risk analysis
- `securityWarnings?: SecurityWarning[]` - Generated security warnings

**Features:**
- ✅ **Bytecode Analysis**: Fetches and analyzes contract bytecode
- ✅ **Pattern Detection**: Detects 4 categories of scam patterns
- ✅ **Risk Scoring**: Advanced weighted risk calculation
- ✅ **Security Warnings**: Comprehensive warning generation
- ✅ **Proxy Detection**: Identifies common proxy patterns
- ✅ **Backward Compatibility**: Includes all basic analysis fields
- ✅ **Error Handling**: Graceful handling of network/provider errors

**Analysis Components:**
1. **Known Malicious Detection**: Checks against known scam addresses
2. **Bytecode Retrieval**: Downloads bytecode via Ethereum RPC
3. **Pattern Analysis**: Analyzes for deceptive events, hidden redirection, fake balance, non-functional transfers
4. **Risk Assessment**: Calculates weighted risk scores with confidence levels
5. **Warning Generation**: Creates detailed security warnings and recommendations

**📖 [Advanced Analysis Documentation](./advanced-analysis.md)** - Complete guide with examples and best practices

**Throws:**
- Returns failed analysis object instead of throwing (graceful error handling)
- Network errors are handled internally with fallback to basic analysis

#### `getVersion()`

Returns the current tool version information.

```typescript
const version = tool.getVersion();
console.log(version); // "1.1.0-alpha"
```

**Returns:** `string` - Current application version

#### `getSecurityStatus()`

Returns comprehensive security configuration and status information.

```typescript
const status = tool.getSecurityStatus();
console.log(status);
// {
//   warningsEnabled: true,
//   version: '1.1.0-alpha',
//   environment: 'development'
// }
```

**Returns:**
```typescript
{
  warningsEnabled: boolean;  // Whether security warnings are enabled
  version: string;          // Application version
  environment: string;      // Current environment (development/production/test)
}
```

### Validation Utilities

The tool provides comprehensive validation utilities for secure contract analysis:

#### `validateContractAddress(address: string)`

Validates Ethereum contract address format using strict regex validation.

```typescript
import { validateContractAddress } from './src/utils/validation';

try {
  const validAddress = validateContractAddress('0x1234567890abcdef1234567890abcdef12345678');
  console.log('Valid address:', validAddress);
} catch (error) {
  console.error('Address Validation Failed:', error.message);
}
```

**Parameters:**
- `address`: `string` - Address to validate

**Returns:** `ContractAddress` - Validated address string

**Throws:** `ValidationError` - For invalid address format

#### `sanitizeInput(input: string)`

Sanitizes input strings to prevent injection attacks and remove potentially dangerous characters.

```typescript
import { sanitizeInput } from './src/utils/validation';

const unsafeInput = '<script>alert(1)</script>';
const safeInput = sanitizeInput(unsafeInput);
console.log(safeInput); // "alert(1)"
```

**Security Features:**
- Removes HTML/XML special characters (`<`, `>`, `'`, `"`, `&`)
- Strips `javascript:` protocol references
- Removes event handlers (e.g., `onclick=`)
- Eliminates null bytes
- Trims whitespace

#### `isKnownMaliciousAddress(address: ContractAddress)`

Checks if a contract address is in the known malicious addresses database.

```typescript
import { isKnownMaliciousAddress } from './src/utils/validation';

const maliciousAddress = '0xacba164135904dc63c5418b57ff87efd341d7c80';
const isMalicious = isKnownMaliciousAddress(maliciousAddress);
console.log(isMalicious); // true
```

**Known Malicious Addresses:**
- `0xacba164135904dc63c5418b57ff87efd341d7c80`
- `0xA995507632B358bA63f8A39616930f8A696bfd8d`
- `0xD66Fd225dbF7fD3c9f00220A455d05EFCCB1CBf0`
- `0x8270500F6a22c5Fc8b78Eecc24dD20dE85838149`
- `0x78EC1a6D4028A88B179247291993c9dCd14bE952`
- `0x54cb07D537d75e0Cf1B1E3870201FA20E8873D8a`
- `0x26A7a3cE145d5c9904C5DD20b47b349DB5f06420`

#### `generateMaliciousContractWarning(address: ContractAddress)`

Generates a structured security warning for known malicious contracts.

```typescript
import { generateMaliciousContractWarning } from './src/utils/validation';

const warning = generateMaliciousContractWarning('0xacba164135904dc63c5418b57ff87efd341d7c80');
console.log(warning);
// {
//   level: 'critical',
//   message: 'CRITICAL WARNING: This contract address is known to be malicious...',
//   contractAddress: '0xacba164135904dc63c5418b57ff87efd341d7c80',
//   timestamp: Date,
//   category: 'deceptive-events'
// }
```

## Type Definitions

Comprehensive TypeScript type definitions for secure contract analysis:

### Core Analysis Types

#### `ContractAnalysis`

Represents comprehensive analysis results for a smart contract.

```typescript
type ContractAnalysis = {
  contractAddress: string;              // Ethereum contract address
  contractName: string;                 // Human-readable contract name
  analysisStatus: AnalysisStatus;       // Current analysis status
  vulnerabilities: string[];            // Array of identified vulnerabilities
  riskLevel: RiskLevel;                // Overall risk assessment
  analysisDate: Date;                  // When analysis was performed
  lastUpdated: Date;                   // Last update timestamp
  metadata?: Record<string, unknown>;  // Additional analysis metadata
};
```

#### `SecurityWarning`

Structured security warning with comprehensive threat information.

```typescript
type SecurityWarning = {
  level: WarningLevel;                  // Warning severity level
  message: string;                      // Human-readable warning message
  contractAddress?: ContractAddress;    // Optional associated contract address
  timestamp: Date;                      // When warning was generated
  category: ScamCategory;              // Type of scam/threat detected
};
```

#### `AirdropScamPattern`

Defines patterns for identifying airdrop scam contracts.

```typescript
type AirdropScamPattern = {
  patternId: string;                   // Unique pattern identifier
  patternName: string;                 // Human-readable pattern name
  description: string;                 // Pattern description
  detectionMethods: string[];          // Methods for detecting this pattern
  severity: RiskLevel;                 // Pattern severity level
  exampleContracts: ContractAddress[]; // Example contracts showing pattern
  mitigationStrategies: string[];      // Strategies to mitigate this pattern
};
```

### Enumeration Types

#### `RiskLevel`

Risk assessment levels for contracts and patterns.

```typescript
type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
```

#### `AnalysisStatus`

Possible states for contract analysis.

```typescript
type AnalysisStatus = 'pending' | 'complete' | 'failed' | 'in-progress';
```

#### `WarningLevel`

Severity levels for security warnings.

```typescript
type WarningLevel = 'info' | 'warning' | 'error' | 'critical';
```

#### `ScamCategory`

Types of scam patterns detected by the tool.

```typescript
type ScamCategory = 'deceptive-events' | 'hidden-redirection' | 'fake-balance' | 'non-functional-transfer';
```

### Error Types

#### `ValidationError`

Thrown when input validation fails.

```typescript
class ValidationError extends Error {
  constructor(
    message: string,
    public readonly field: string,
    public readonly value: unknown
  );
}
```

#### `SecurityError`

Thrown when security-related operations fail.

```typescript
class SecurityError extends Error {
  constructor(
    message: string,
    public readonly severity: RiskLevel = 'high',
    public readonly contractAddress?: ContractAddress
  );
}
```

#### `AnalysisError`

Thrown when contract analysis operations fail.

```typescript
class AnalysisError extends Error {
  constructor(
    message: string,
    public readonly contractAddress?: ContractAddress,
    public readonly cause?: Error
  );
}
```

## Usage Examples

### Basic Contract Analysis

```typescript
import { ScamAnalysisTool } from './src/index';

const tool = new ScamAnalysisTool();

// Analyze a safe contract
const safeResult = tool.analyzeContract('0x1234567890abcdef1234567890abcdef12345678');
console.log('Safe contract:', safeResult);

// Analyze a malicious contract
const maliciousResult = tool.analyzeContract('0xacba164135904dc63c5418b57ff87efd341d7c80');
console.log('Malicious contract:', maliciousResult);
```

### Validation and Security

```typescript
import { validateContractAddress, sanitizeInput, isKnownMaliciousAddress } from './src/utils/validation';

// Validate address format
try {
  const address = validateContractAddress('0x1234567890abcdef1234567890abcdef12345678');
  console.log('Valid address:', address);
} catch (error) {
  console.error('Invalid address:', error.message);
}

// Sanitize user input
const userInput = '<script>alert("xss")</script>';
const safeInput = sanitizeInput(userInput);
console.log('Sanitized:', safeInput);

// Check for known threats
const isThreat = isKnownMaliciousAddress('0xacba164135904dc63c5418b57ff87efd341d7c80');
console.log('Is known threat:', isThreat);
```

### Error Handling

```typescript
import { ScamAnalysisTool, ValidationError, SecurityError } from './src/index';

const tool = new ScamAnalysisTool();

try {
  const result = tool.analyzeContract('invalid-address');
} catch (error) {
  if (error instanceof ValidationError) {
    console.error('Validation failed:', error.message, 'Field:', error.field);
  } else if (error instanceof SecurityError) {
    console.error('Security error:', error.message, 'Severity:', error.severity);
  } else {
    console.error('Unknown error:', error);
  }
}
```

---

## Security Best Practices

1. **Never interact with analyzed contracts** - This tool is for analysis only
2. **Validate all inputs** - Always use provided validation utilities
3. **Handle errors properly** - Implement comprehensive error handling
4. **Keep warnings enabled** - Security warnings provide critical information
5. **Use in controlled environments** - Only use for educational/research purposes
6. **Regular updates** - Keep the tool updated with latest threat intelligence

---

## Bytecode Analysis Module

For advanced bytecode analysis capabilities, see the **[Bytecode Analysis API Documentation](bytecode.md)**.

### Quick Bytecode Example

```typescript
import { fetchBytecode, isProxyContract, getBytecodeSize } from './src/analysis/bytecode';
import { JsonRpcProvider } from 'ethers';

const provider = new JsonRpcProvider('https://mainnet.infura.io/v3/YOUR_PROJECT_ID');

async function analyzeBytecode() {
  try {
    const bytecode = await fetchBytecode(
      '0x1234567890123456789012345678901234567890',
      provider
    );
    
    console.log('Bytecode size:', getBytecodeSize(bytecode), 'bytes');
    console.log('Is proxy contract:', isProxyContract(bytecode));
  } catch (error) {
    console.error('Bytecode analysis failed:', error.message);
  }
}
```

### Bytecode Features

- ✅ **Secure Retrieval** - Safe ethers v6 JsonRpcProvider integration
- ✅ **LRU Caching** - Efficient in-memory caching (10-min TTL, 1000 entries)
- ✅ **Batch Operations** - Parallel processing for multiple addresses
- ✅ **Proxy Detection** - Identification of EIP-1167 and common proxy patterns
- ✅ **Comprehensive Validation** - Zod schema validation for all inputs
- ✅ **Error Handling** - Provider-specific error classification and handling

---

## Advanced Analysis Engine

The Advanced Analysis Engine provides comprehensive smart contract security analysis through multiple specialized modules:

### 🔍 Pattern Detection Module

The pattern detection system identifies sophisticated scam techniques across four primary categories:

```typescript
import { detectPattern, detectAllPatterns } from './src/analysis/patternDetection';

// Single pattern detection
const deceptiveEventsResult = detectPattern('deceptive-events', contractABI);
console.log('Detected:', deceptiveEventsResult.detected);
console.log('Confidence:', deceptiveEventsResult.confidence);

// Comprehensive analysis
const comprehensiveResults = detectAllPatterns(contractBytecode, {
  includePatterns: ['deceptive-events', 'hidden-redirection'],
  parallel: false
});

console.log('Overall detected:', comprehensiveResults.overallDetected);
console.log('Risk score:', comprehensiveResults.overallRiskScore);
console.log('Summary:', comprehensiveResults.summary);
```

#### Supported Pattern Categories

| Pattern | Description | Input Type | Severity |
|---------|-------------|------------|---------|
| **deceptive-events** | Misleading event emissions without state changes | ABI | Medium-High |
| **hidden-redirection** | Covert fund redirection to hardcoded addresses | Bytecode | Critical |
| **fake-balance** | Time-dependent or manipulated balance calculations | ABI/Bytecode | Medium |
| **non-functional-transfer** | Transfer functions that emit events but don't work | ABI | High |

#### Pattern Detection Results

```typescript
type PatternResult = {
  detected: boolean;
  confidence: number;        // 0-1 confidence score
  category: ScamCategory;
  description: string;
  evidence: string[];        // Array of evidence descriptions
  severity: 'low' | 'medium' | 'high' | 'critical';
  metadata: {
    // Pattern-specific metadata
    suspiciousAddresses?: string[];
    anomalousEvents?: string[];
    redirectionTargets?: string[];
    functionSignatures?: string[];
  };
};
```

### ⚖️ Risk Scoring Module

Advanced weighted scoring system with configurable parameters:

```typescript
import { 
  calculateWeightedScore, 
  assessRisk, 
  mapScoreToRiskLevel 
} from './src/analysis/riskScoring';

// Calculate risk score from pattern results
const patternResults = {
  'deceptive-events': { detected: true, confidence: 0.8, severity: 'high' },
  'hidden-redirection': { detected: true, confidence: 0.9, severity: 'critical' }
};

const riskScore = calculateWeightedScore(patternResults);
const riskLevel = mapScoreToRiskLevel(riskScore);

// Comprehensive risk assessment
const riskAssessment = assessRisk(patternResults, {
  enableBonusScoring: true,
  enablePenaltyScoring: true
});

console.log('Risk Score:', riskAssessment.riskScore);
console.log('Risk Level:', riskAssessment.riskLevel);
console.log('Confidence:', riskAssessment.confidence);
console.log('Summary:', riskAssessment.explanation.summary);
```

#### Risk Scoring Features

- **Weighted Patterns**: Different patterns have different impact weights
- **Severity Multipliers**: Critical patterns receive higher scoring
- **Bonus Scoring**: Multiple pattern combinations increase risk
- **Penalty Scoring**: Low confidence patterns reduce final score
- **Detailed Breakdown**: Complete scoring explanation and recommendations

#### Default Pattern Weights

```typescript
const PATTERN_WEIGHTS = {
  'deceptive-events': 0.25,        // 25% weight
  'hidden-redirection': 0.35,      // 35% weight (most dangerous)
  'fake-balance': 0.20,            // 20% weight
  'non-functional-transfer': 0.30,  // 30% weight
};
```

### 📊 Report Generation Module

Comprehensive reporting system with multiple output formats:

```typescript
import { generateReport, saveReportToFiles } from './src/analysis/report';

// Generate analysis report
const contractAnalyses = [
  {
    contractAddress: '0x1234...',
    contractName: 'SuspiciousToken',
    analysisStatus: 'complete',
    vulnerabilities: ['Hidden redirection detected'],
    riskLevel: 'critical',
    analysisDate: new Date(),
    lastUpdated: new Date()
  }
];

const report = generateReport(contractAnalyses);

// Save report in multiple formats
const savedFiles = saveReportToFiles(report);
console.log('JSON report:', savedFiles.jsonPath);
console.log('Markdown report:', savedFiles.markdownPath);
```

#### Report Structure

```typescript
type AnalysisReport = {
  reportId: string;
  title: string;
  summary: string;
  contractAnalyses: ContractAnalysis[];
  securityWarnings: SecurityWarning[];
  scamPatterns: string[];            // Detected pattern categories
  generatedAt: Date;
  version: string;
};
```

### 🔧 Integration Examples

#### Complete Analysis Workflow

```typescript
import { ScamAnalysisTool } from './src/index';
import { detectAllPatterns } from './src/analysis/patternDetection';
import { assessRisk } from './src/analysis/riskScoring';
import { generateAndSaveReport } from './src/analysis/report';

async function comprehensiveAnalysis(contractAddress: string) {
  const tool = new ScamAnalysisTool();
  
  // 1. Advanced contract analysis
  const analysis = await tool.analyzeContractAdvanced(contractAddress);
  
  // 2. Pattern detection (if bytecode available)
  if (analysis.bytecode) {
    const patternResults = detectAllPatterns(analysis.bytecode);
    
    // 3. Risk assessment
    const riskAssessment = assessRisk(patternResults.patternResults);
    
    // 4. Enhanced analysis with pattern data
    const enhancedAnalysis = {
      ...analysis,
      patternResults: patternResults.patternResults,
      riskAssessment,
      overallRiskScore: patternResults.overallRiskScore
    };
    
    // 5. Generate comprehensive report
    const { report, files } = generateAndSaveReport([enhancedAnalysis]);
    
    console.log('Analysis complete!');
    console.log('Risk Level:', riskAssessment.riskLevel);
    console.log('Report saved to:', files.jsonPath);
    
    return { analysis: enhancedAnalysis, report, files };
  }
  
  return { analysis };
}

// Usage
comprehensiveAnalysis('0xacba164135904dc63c5418b57ff87efd341d7c80')
  .then(result => {
    console.log('Analysis completed:', result.analysis.riskLevel);
  })
  .catch(error => {
    console.error('Analysis failed:', error.message);
  });
```

#### Batch Analysis with Reporting

```typescript
async function batchAnalysis(addresses: string[]) {
  const tool = new ScamAnalysisTool();
  const analyses = [];
  
  for (const address of addresses) {
    try {
      const analysis = await tool.analyzeContractAdvanced(address);
      analyses.push(analysis);
      
      console.log(`✓ Analyzed ${address}: ${analysis.riskLevel} risk`);
    } catch (error) {
      console.error(`✗ Failed to analyze ${address}:`, error);
    }
  }
  
  // Generate batch report
  const { report, files } = generateAndSaveReport(analyses);
  
  console.log(`\nBatch analysis complete:`);
  console.log(`- Total contracts: ${analyses.length}`);
  console.log(`- High/Critical risk: ${analyses.filter(a => ['high', 'critical'].includes(a.riskLevel)).length}`);
  console.log(`- Report saved to: ${files.markdownPath}`);
  
  return { analyses, report, files };
}
```

### 🛡️ Security Features

#### Input Validation and Sanitization

```typescript
import { ContractAddressSchema, ABISchema } from './src/types';

// All modules use Zod validation
const validatedAddress = ContractAddressSchema.parse(userInput);
const validatedABI = ABISchema.parse(contractABI);

// Built-in error handling prevents malformed input attacks
try {
  const result = detectPattern('deceptive-events', validatedABI);
} catch (error) {
  // Graceful error handling with secure defaults
  console.error('Pattern detection failed safely:', error.message);
}
```

#### Safe Async Operations

```typescript
// All async operations are wrapped with timeout protection
const analysis = await tool.analyzeContractAdvanced(address, provider);
// Automatically handles network timeouts, rate limits, and provider errors
```

---

*API Documentation Version: 1.3.0*  
*Last Updated: 2025-01-15*  
*For more information, see the [main documentation](../index.md)*

