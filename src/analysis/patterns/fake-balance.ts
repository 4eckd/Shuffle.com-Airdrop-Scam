import { PatternResult, PatternResultSchema, ABI, ABISchema } from '../../types';

/**
 * Detects fake balance patterns in smart contracts
 * 
 * This detector analyzes ABI to identify view functions that return timestamp-based
 * values or other non-balance data disguised as balance information. Common in scam
 * contracts where balance queries return fake values to deceive users.
 */

// Common balance-related function names
const BALANCE_FUNCTION_NAMES = [
  'balanceOf',
  'balance',
  'getBalance',
  'userBalance',
  'accountBalance',
  'tokenBalance',
  'availableBalance',
  'totalBalance',
  'checkBalance',
  'myBalance',
  'walletBalance',
  'stakedBalance',
  'rewardBalance',
  'claimableBalance',
  'pendingBalance',
];

// Suspicious return patterns that might indicate fake balances
const SUSPICIOUS_PATTERNS = [
  'timestamp',
  'block',
  'now',
  'time',
  'blockhash',
  'difficulty',
  'number',
  'coinbase',
  'gaslimit',
  'random',
  'seed',
];

// Common ERC20 functions that should have proper balance logic
const ERC20_FUNCTIONS = [
  'totalSupply',
  'balanceOf',
  'allowance',
  'transfer',
  'approve',
  'transferFrom',
];

interface FunctionAnalysis {
  name: string;
  isView: boolean;
  isPure: boolean;
  isBalanceRelated: boolean;
  isERC20: boolean;
  returnType: string;
  hasProperParameters: boolean;
  suspiciousPatterns: string[];
}

interface EventAnalysis {
  name: string;
  isTransferEvent: boolean;
  hasProperParameters: boolean;
  parameters: { name: string; type: string }[];
}

/**
 * Analyzes ABI functions for fake balance patterns
 */
function analyzeFunctions(abi: ABI): FunctionAnalysis[] {
  const functions = abi.filter(item => item.type === 'function');
  
  return functions.map(func => {
    const funcName = func.name || '';
    const isView = func.stateMutability === 'view' || func.stateMutability === 'pure';
    const isPure = func.stateMutability === 'pure';
    
    // Check if function is balance-related
    const isBalanceRelated = BALANCE_FUNCTION_NAMES.some(balanceFunc => 
      funcName.toLowerCase().includes(balanceFunc.toLowerCase())
    );
    
    // Check if function is ERC20 standard
    const isERC20 = ERC20_FUNCTIONS.some(erc20Func => 
      funcName.toLowerCase() === erc20Func.toLowerCase()
    );
    
    // Analyze return type
    const returnType = func.outputs?.[0]?.type || 'unknown';
    
    // Check for proper parameters (balanceOf should have address parameter)
    const hasProperParameters = analyzeParameters(funcName, func.inputs || []);
    
    // Check for suspicious patterns in function name
    const suspiciousPatterns = SUSPICIOUS_PATTERNS.filter(pattern => 
      funcName.toLowerCase().includes(pattern.toLowerCase())
    );
    
    return {
      name: funcName,
      isView,
      isPure,
      isBalanceRelated,
      isERC20,
      returnType,
      hasProperParameters,
      suspiciousPatterns,
    };
  });
}

/**
 * Analyzes function parameters for correctness
 */
function analyzeParameters(funcName: string, inputs: any[]): boolean {
  const lowerName = funcName.toLowerCase();
  
  // balanceOf should have address parameter
  if (lowerName === 'balanceof') {
    return inputs.length === 1 && inputs[0].type === 'address';
  }
  
  // allowance should have two address parameters
  if (lowerName === 'allowance') {
    return inputs.length === 2 && 
           inputs[0].type === 'address' && 
           inputs[1].type === 'address';
  }
  
  // transfer should have address and uint256 parameters
  if (lowerName === 'transfer') {
    return inputs.length === 2 && 
           inputs[0].type === 'address' && 
           inputs[1].type.includes('uint');
  }
  
  // For other balance functions, should typically have address parameter
  if (BALANCE_FUNCTION_NAMES.some(name => lowerName.includes(name.toLowerCase()))) {
    return inputs.some(input => input.type === 'address');
  }
  
  return true; // Default to true for non-balance functions
}

/**
 * Analyzes ABI events for transfer patterns
 */
function analyzeEvents(abi: ABI): EventAnalysis[] {
  const events = abi.filter(item => item.type === 'event');
  
  return events.map(event => {
    const eventName = event.name || '';
    const isTransferEvent = eventName.toLowerCase() === 'transfer';
    
    const parameters = event.inputs?.map(input => ({
      name: input.name,
      type: input.type,
    })) || [];
    
    // Check if transfer event has proper parameters
    const hasProperParameters = isTransferEvent ? 
      parameters.length === 3 &&
      parameters[0].type === 'address' &&
      parameters[1].type === 'address' &&
      parameters[2].type.includes('uint') : true;
    
    return {
      name: eventName,
      isTransferEvent,
      hasProperParameters,
      parameters,
    };
  });
}

/**
 * Detects timestamp-based fake balance patterns
 */
function detectTimestampBasedBalances(functions: FunctionAnalysis[]): FunctionAnalysis[] {
  return functions.filter(func => {
    // Look for balance functions that might return timestamp-based values
    return func.isBalanceRelated && 
           func.isView && 
           func.suspiciousPatterns.length > 0;
  });
}

/**
 * Detects improper ERC20 implementations
 */
function detectImproperERC20(functions: FunctionAnalysis[]): FunctionAnalysis[] {
  return functions.filter(func => {
    // Look for ERC20 functions with wrong parameters or return types
    return func.isERC20 && (
      !func.hasProperParameters ||
      (func.name.toLowerCase() === 'balanceof' && func.returnType !== 'uint256') ||
      (func.name.toLowerCase() === 'totalsupply' && func.returnType !== 'uint256')
    );
  });
}

/**
 * Detects view functions returning non-deterministic values
 */
function detectNonDeterministicViews(functions: FunctionAnalysis[]): FunctionAnalysis[] {
  return functions.filter(func => {
    // View functions should return deterministic values
    // Functions with timestamp/block-related names are suspicious
    return func.isView && 
           func.suspiciousPatterns.length > 0 &&
           func.isBalanceRelated;
  });
}

/**
 * Calculates confidence score based on detected patterns
 */
function calculateConfidence(
  timestampBased: FunctionAnalysis[],
  improperERC20: FunctionAnalysis[],
  nonDeterministic: FunctionAnalysis[],
  totalFunctions: number
): number {
  if (totalFunctions === 0) return 0;
  
  let score = 0;
  
  // Weight different types of suspicious patterns
  score += timestampBased.length * 0.4;
  score += improperERC20.length * 0.3;
  score += nonDeterministic.length * 0.2;
  
  // Normalize by total functions but cap at 1.0
  const normalizedScore = score / Math.max(totalFunctions, 1);
  return Math.min(normalizedScore * 2, 1.0);
}

/**
 * Generates evidence array for detected patterns
 */
function generateEvidence(
  timestampBased: FunctionAnalysis[],
  improperERC20: FunctionAnalysis[],
  nonDeterministic: FunctionAnalysis[],
  events: EventAnalysis[]
): string[] {
  const evidence: string[] = [];
  
  // Evidence for timestamp-based balances
  timestampBased.forEach(func => {
    evidence.push(
      `Function '${func.name}' appears to return timestamp-based values instead of actual balance (patterns: ${func.suspiciousPatterns.join(', ')})`
    );
  });
  
  // Evidence for improper ERC20 implementations
  improperERC20.forEach(func => {
    if (!func.hasProperParameters) {
      evidence.push(
        `ERC20 function '${func.name}' has incorrect parameters`
      );
    }
    if (func.name.toLowerCase() === 'balanceof' && func.returnType !== 'uint256') {
      evidence.push(
        `balanceOf function returns '${func.returnType}' instead of 'uint256'`
      );
    }
  });
  
  // Evidence for non-deterministic view functions
  nonDeterministic.forEach(func => {
    evidence.push(
      `View function '${func.name}' may return non-deterministic values (patterns: ${func.suspiciousPatterns.join(', ')})`
    );
  });
  
  // Evidence for improper transfer events
  events.forEach(event => {
    if (event.isTransferEvent && !event.hasProperParameters) {
      evidence.push(
        `Transfer event has incorrect parameters: ${event.parameters.map(p => `${p.name}:${p.type}`).join(', ')}`
      );
    }
  });
  
  return evidence;
}

/**
 * Determines severity based on confidence and evidence types
 */
function determineSeverity(
  confidence: number,
  timestampBased: FunctionAnalysis[],
  improperERC20: FunctionAnalysis[]
): 'low' | 'medium' | 'high' | 'critical' {
  const hasBalanceOfIssues = improperERC20.some(f => f.name.toLowerCase() === 'balanceof');
  const hasMultipleTimestampBased = timestampBased.length > 1;
  
  if (hasBalanceOfIssues && confidence >= 0.6) return 'critical';
  if (hasMultipleTimestampBased && confidence >= 0.5) return 'high';
  if (confidence >= 0.4) return 'medium';
  return 'low';
}

/**
 * Main detection function for fake balance pattern
 */
export function detect(input: string | ABI): PatternResult {
  let abi: ABI;
  
  // Parse input - could be ABI JSON string or ABI object
  if (typeof input === 'string') {
    try {
      // Try to parse as JSON first
      const parsed = JSON.parse(input);
      abi = ABISchema.parse(parsed);
    } catch {
      // If JSON parsing fails, return no detection for bytecode
      return PatternResultSchema.parse({
        detected: false,
        confidence: 0,
        category: 'fake-balance',
        description: 'Fake balance pattern analysis requires ABI, not bytecode',
        evidence: [],
        severity: 'low',
        metadata: { reason: 'bytecode_not_supported' },
      });
    }
  } else {
    abi = ABISchema.parse(input);
  }
  
  // Analyze functions and events
  const functions = analyzeFunctions(abi);
  const events = analyzeEvents(abi);
  
  // Detect different types of fake balance patterns
  const timestampBased = detectTimestampBasedBalances(functions);
  const improperERC20 = detectImproperERC20(functions);
  const nonDeterministic = detectNonDeterministicViews(functions);
  
  // Calculate metrics
  const confidence = calculateConfidence(
    timestampBased,
    improperERC20,
    nonDeterministic,
    functions.length
  );
  
  const evidence = generateEvidence(
    timestampBased,
    improperERC20,
    nonDeterministic,
    events
  );
  
  const severity = determineSeverity(confidence, timestampBased, improperERC20);
  
  // Determine if pattern is detected
  const detected = confidence > 0.3 && evidence.length > 0;
  
  return PatternResultSchema.parse({
    detected,
    confidence,
    category: 'fake-balance',
    description: detected 
      ? `Detected ${evidence.length} fake balance pattern(s) with ${Math.round(confidence * 100)}% confidence`
      : 'No fake balance patterns detected',
    evidence,
    severity,
    metadata: {
      functionsAnalyzed: functions.length,
      eventsAnalyzed: events.length,
      timestampBasedFunctions: timestampBased.length,
      improperERC20Functions: improperERC20.length,
      nonDeterministicViews: nonDeterministic.length,
      balanceRelatedFunctions: functions.filter(f => f.isBalanceRelated).length,
      erc20Functions: functions.filter(f => f.isERC20).length,
    },
  });
}
