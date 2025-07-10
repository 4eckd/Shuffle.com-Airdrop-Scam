import { PatternResult, PatternResultSchema, ABI, ABISchema } from '../../types';

/**
 * Detects non-functional transfer patterns in smart contracts
 * 
 * This detector analyzes ABI and bytecode to identify transfer functions that
 * emit Transfer events without actually changing balances. Common in scam contracts
 * where transfer operations appear successful but don't move any tokens.
 */

// Transfer-related function names
const TRANSFER_FUNCTION_NAMES = [
  'transfer',
  'transferFrom',
  'safeTransfer',
  'safeTransferFrom',
  'send',
  'sendFrom',
  'move',
  'moveFrom',
  'withdraw',
  'deposit',
  'swap',
  'exchange',
];

// Transfer-related event names
const TRANSFER_EVENT_NAMES = [
  'Transfer',
  'TransferFrom',
  'Sent',
  'Received',
  'Deposited',
  'Withdrawn',
  'Swapped',
  'Exchanged',
];

// ERC20 standard functions that should modify balances
const ERC20_BALANCE_FUNCTIONS = [
  'transfer',
  'transferFrom',
  'approve',
  'increaseAllowance',
  'decreaseAllowance',
];

interface TransferFunctionAnalysis {
  name: string;
  isTransferFunction: boolean;
  isERC20Standard: boolean;
  hasProperParameters: boolean;
  isView: boolean;
  isPure: boolean;
  returnType: string;
  parameters: { name: string; type: string }[];
  hasCorrespondingEvent: boolean;
  suspiciousPatterns: string[];
}

interface TransferEventAnalysis {
  name: string;
  isTransferEvent: boolean;
  hasProperParameters: boolean;
  hasCorrespondingFunction: boolean;
  parameters: { name: string; type: string; indexed?: boolean }[];
  isERC20Standard: boolean;
}

interface BytecodeAnalysis {
  hasStorageWrites: boolean;
  hasBalanceUpdates: boolean;
  hasEventEmission: boolean;
  storageSlotsModified: number;
  eventEmissionCount: number;
}

/**
 * Analyzes ABI functions for transfer patterns
 */
function analyzeTransferFunctions(abi: ABI): TransferFunctionAnalysis[] {
  const functions = abi.filter(item => item.type === 'function');
  
  return functions.map(func => {
    const funcName = func.name || '';
    const isTransferFunction = TRANSFER_FUNCTION_NAMES.some(transferFunc => 
      funcName.toLowerCase().includes(transferFunc.toLowerCase())
    );
    
    const isERC20Standard = ERC20_BALANCE_FUNCTIONS.some(erc20Func => 
      funcName.toLowerCase() === erc20Func.toLowerCase()
    );
    
    const isView = func.stateMutability === 'view';
    const isPure = func.stateMutability === 'pure';
    const returnType = func.outputs?.[0]?.type || 'unknown';
    
    const parameters = func.inputs?.map(input => ({
      name: input.name,
      type: input.type,
    })) || [];
    
    const hasProperParameters = analyzeTransferParameters(funcName, parameters);
    
    // Check for suspicious patterns that might indicate non-functional transfers
    const suspiciousPatterns = detectSuspiciousPatterns(funcName, isView, isPure, returnType);
    
    return {
      name: funcName,
      isTransferFunction,
      isERC20Standard,
      hasProperParameters,
      isView,
      isPure,
      returnType,
      parameters,
      hasCorrespondingEvent: false, // Will be set later
      suspiciousPatterns,
    };
  });
}

/**
 * Analyzes transfer function parameters for correctness
 */
function analyzeTransferParameters(funcName: string, parameters: { name: string; type: string }[]): boolean {
  const lowerName = funcName.toLowerCase();
  
  // Standard transfer should have (address to, uint256 amount)
  if (lowerName === 'transfer') {
    return parameters.length === 2 &&
           parameters[0].type === 'address' &&
           parameters[1].type.includes('uint');
  }
  
  // Standard transferFrom should have (address from, address to, uint256 amount)
  if (lowerName === 'transferfrom') {
    return parameters.length === 3 &&
           parameters[0].type === 'address' &&
           parameters[1].type === 'address' &&
           parameters[2].type.includes('uint');
  }
  
  // For other transfer functions, should have at least address and amount
  if (TRANSFER_FUNCTION_NAMES.some(name => lowerName.includes(name.toLowerCase()))) {
    const hasAddress = parameters.some(p => p.type === 'address');
    const hasAmount = parameters.some(p => p.type.includes('uint'));
    return hasAddress && hasAmount;
  }
  
  return true;
}

/**
 * Detects suspicious patterns in transfer functions
 */
function detectSuspiciousPatterns(funcName: string, isView: boolean, isPure: boolean, returnType: string): string[] {
  const patterns: string[] = [];
  
  // Transfer functions should not be view or pure
  if (isView) {
    patterns.push('view_function');
  }
  if (isPure) {
    patterns.push('pure_function');
  }
  
  // Transfer functions should typically return bool
  if (returnType !== 'bool' && returnType !== 'unknown') {
    patterns.push('non_bool_return');
  }
  
  // Check for suspicious naming patterns
  const suspiciousNames = ['fake', 'mock', 'dummy', 'test', 'example'];
  if (suspiciousNames.some(name => funcName.toLowerCase().includes(name))) {
    patterns.push('suspicious_naming');
  }
  
  return patterns;
}

/**
 * Analyzes ABI events for transfer patterns
 */
function analyzeTransferEvents(abi: ABI): TransferEventAnalysis[] {
  const events = abi.filter(item => item.type === 'event');
  
  return events.map(event => {
    const eventName = event.name || '';
    const isTransferEvent = TRANSFER_EVENT_NAMES.some(transferEvent => 
      eventName.toLowerCase().includes(transferEvent.toLowerCase())
    );
    
    const isERC20Standard = eventName.toLowerCase() === 'transfer';
    
    const parameters = event.inputs?.map(input => ({
      name: input.name,
      type: input.type,
      indexed: input.indexed || false,
    })) || [];
    
    const hasProperParameters = analyzeTransferEventParameters(eventName, parameters);
    
    return {
      name: eventName,
      isTransferEvent,
      hasProperParameters,
      hasCorrespondingFunction: false, // Will be set later
      parameters,
      isERC20Standard,
    };
  });
}

/**
 * Analyzes transfer event parameters for correctness
 */
function analyzeTransferEventParameters(eventName: string, parameters: { name: string; type: string; indexed?: boolean }[]): boolean {
  const lowerName = eventName.toLowerCase();
  
  // Standard Transfer event should have (address indexed from, address indexed to, uint256 value)
  if (lowerName === 'transfer') {
    return parameters.length === 3 &&
           parameters[0].type === 'address' &&
           parameters[1].type === 'address' &&
           parameters[2].type.includes('uint') &&
           parameters[0].indexed === true &&
           parameters[1].indexed === true &&
           parameters[2].indexed === false;
  }
  
  // For other transfer events, should have at least from/to addresses and amount
  if (TRANSFER_EVENT_NAMES.some(name => lowerName.includes(name.toLowerCase()))) {
    const addressParams = parameters.filter(p => p.type === 'address');
    const amountParams = parameters.filter(p => p.type.includes('uint'));
    return addressParams.length >= 2 && amountParams.length >= 1;
  }
  
  return true;
}

/**
 * Cross-references transfer functions with events
 */
function crossReferenceTransferFunctions(
  functions: TransferFunctionAnalysis[],
  events: TransferEventAnalysis[]
): { functions: TransferFunctionAnalysis[]; events: TransferEventAnalysis[] } {
  
  // Update functions with corresponding event info
  const updatedFunctions = functions.map(func => {
    const correspondingEvent = events.find(event => 
      event.name.toLowerCase().includes(func.name.toLowerCase()) ||
      (func.name.toLowerCase() === 'transfer' && event.name.toLowerCase() === 'transfer') ||
      (func.name.toLowerCase() === 'transferfrom' && event.name.toLowerCase() === 'transfer')
    );
    
    return {
      ...func,
      hasCorrespondingEvent: !!correspondingEvent,
    };
  });
  
  // Update events with corresponding function info
  const updatedEvents = events.map(event => {
    const correspondingFunction = functions.find(func => 
      func.name.toLowerCase().includes(event.name.toLowerCase()) ||
      (event.name.toLowerCase() === 'transfer' && 
       (func.name.toLowerCase() === 'transfer' || func.name.toLowerCase() === 'transferfrom'))
    );
    
    return {
      ...event,
      hasCorrespondingFunction: !!correspondingFunction,
    };
  });
  
  return {
    functions: updatedFunctions,
    events: updatedEvents,
  };
}

/**
 * Analyzes bytecode for actual storage modifications and event emissions
 */
function analyzeBytecodeForTransfers(bytecode: string): BytecodeAnalysis {
  if (!bytecode || bytecode === '0x') {
    return {
      hasStorageWrites: false,
      hasBalanceUpdates: false,
      hasEventEmission: false,
      storageSlotsModified: 0,
      eventEmissionCount: 0,
    };
  }
  
  const cleanBytecode = bytecode.startsWith('0x') ? bytecode.slice(2) : bytecode;
  
  // Look for SSTORE opcodes (storage writes)
  const sstorePattern = /55/g; // SSTORE opcode
  const sstoreMatches = cleanBytecode.match(sstorePattern) || [];
  
  // Look for LOG opcodes (event emissions)
  const logPattern = /a[0-4]/g; // LOG0, LOG1, LOG2, LOG3, LOG4 opcodes
  const logMatches = cleanBytecode.match(logPattern) || [];
  
  // Look for balance-related storage patterns
  const balancePattern = /73[0-9a-f]{40}/g; // PUSH20 with address patterns
  const balanceMatches = cleanBytecode.match(balancePattern) || [];
  
  return {
    hasStorageWrites: sstoreMatches.length > 0,
    hasBalanceUpdates: balanceMatches.length > 0,
    hasEventEmission: logMatches.length > 0,
    storageSlotsModified: sstoreMatches.length,
    eventEmissionCount: logMatches.length,
  };
}

/**
 * Detects non-functional transfer patterns
 */
function detectNonFunctionalTransfers(
  functions: TransferFunctionAnalysis[],
  events: TransferEventAnalysis[],
  bytecodeAnalysis?: BytecodeAnalysis
): {
  nonFunctionalFunctions: TransferFunctionAnalysis[];
  orphanedEvents: TransferEventAnalysis[];
  viewTransfers: TransferFunctionAnalysis[];
} {
  
  // Functions that appear to be transfers but are view/pure
  const viewTransfers = functions.filter(func => 
    func.isTransferFunction && (func.isView || func.isPure)
  );
  
  // Transfer functions without corresponding events
  const nonFunctionalFunctions = functions.filter(func => 
    func.isTransferFunction && 
    !func.hasCorrespondingEvent &&
    !func.isView &&
    !func.isPure
  );
  
  // Events without corresponding functions
  const orphanedEvents = events.filter(event => 
    event.isTransferEvent && !event.hasCorrespondingFunction
  );
  
  // If bytecode analysis is available, check for events without storage writes
  if (bytecodeAnalysis) {
    const hasEventsWithoutStorage = bytecodeAnalysis.hasEventEmission && 
                                   !bytecodeAnalysis.hasStorageWrites;
    
    if (hasEventsWithoutStorage) {
      // Add to non-functional if events exist but no storage modifications
      nonFunctionalFunctions.push(...functions.filter(func => 
        func.isTransferFunction && !nonFunctionalFunctions.includes(func)
      ));
    }
  }
  
  return {
    nonFunctionalFunctions,
    orphanedEvents,
    viewTransfers,
  };
}

/**
 * Calculates confidence score based on detected patterns
 */
function calculateConfidence(
  nonFunctionalFunctions: TransferFunctionAnalysis[],
  orphanedEvents: TransferEventAnalysis[],
  viewTransfers: TransferFunctionAnalysis[],
  totalFunctions: number
): number {
  if (totalFunctions === 0) return 0;
  
  let score = 0;
  
  // Weight different types of suspicious patterns
  score += nonFunctionalFunctions.length * 0.4;
  score += orphanedEvents.length * 0.3;
  score += viewTransfers.length * 0.5; // View transfers are highly suspicious
  
  // Normalize by total functions
  const normalizedScore = score / Math.max(totalFunctions, 1);
  return Math.min(normalizedScore * 2, 1.0);
}

/**
 * Generates evidence array for detected patterns
 */
function generateEvidence(
  nonFunctionalFunctions: TransferFunctionAnalysis[],
  orphanedEvents: TransferEventAnalysis[],
  viewTransfers: TransferFunctionAnalysis[],
  bytecodeAnalysis?: BytecodeAnalysis
): string[] {
  const evidence: string[] = [];
  
  // Evidence for view/pure transfer functions
  viewTransfers.forEach(func => {
    evidence.push(
      `Function '${func.name}' is marked as ${func.isView ? 'view' : 'pure'} but appears to be a transfer function`
    );
  });
  
  // Evidence for non-functional transfer functions
  nonFunctionalFunctions.forEach(func => {
    evidence.push(
      `Transfer function '${func.name}' doesn't have a corresponding Transfer event`
    );
    
    if (func.suspiciousPatterns.length > 0) {
      evidence.push(
        `Function '${func.name}' has suspicious patterns: ${func.suspiciousPatterns.join(', ')}`
      );
    }
  });
  
  // Evidence for orphaned events
  orphanedEvents.forEach(event => {
    evidence.push(
      `Transfer event '${event.name}' doesn't have a corresponding transfer function`
    );
  });
  
  // Evidence from bytecode analysis
  if (bytecodeAnalysis) {
    if (bytecodeAnalysis.hasEventEmission && !bytecodeAnalysis.hasStorageWrites) {
      evidence.push(
        `Contract emits events but doesn't modify storage (${bytecodeAnalysis.eventEmissionCount} events, ${bytecodeAnalysis.storageSlotsModified} storage writes)`
      );
    }
  }
  
  return evidence;
}

/**
 * Determines severity based on confidence and evidence types
 */
function determineSeverity(
  confidence: number,
  viewTransfers: TransferFunctionAnalysis[],
  nonFunctionalFunctions: TransferFunctionAnalysis[]
): 'low' | 'medium' | 'high' | 'critical' {
  const hasERC20ViewTransfers = viewTransfers.some(f => f.isERC20Standard);
  const hasMultipleNonFunctional = nonFunctionalFunctions.length > 1;
  
  if (hasERC20ViewTransfers && confidence >= 0.7) return 'critical';
  if (hasMultipleNonFunctional && confidence >= 0.6) return 'high';
  if (confidence >= 0.4) return 'medium';
  return 'low';
}

/**
 * Main detection function for non-functional transfer pattern
 */
export function detect(input: string | ABI): PatternResult {
  let abi: ABI;
  let bytecodeAnalysis: BytecodeAnalysis | undefined;
  
  // Parse input - could be ABI JSON string, ABI object, or bytecode
  if (typeof input === 'string') {
    try {
      // Try to parse as JSON first
      const parsed = JSON.parse(input);
      abi = ABISchema.parse(parsed);
    } catch {
      // If JSON parsing fails, might be bytecode
      // For this detector, we primarily need ABI but can use bytecode for supplementary analysis
      bytecodeAnalysis = analyzeBytecodeForTransfers(input);
      
      // Return limited analysis for bytecode-only input
      return PatternResultSchema.parse({
        detected: false,
        confidence: 0,
        category: 'non-functional-transfer',
        description: 'Non-functional transfer pattern analysis requires ABI for comprehensive detection',
        evidence: bytecodeAnalysis?.hasEventEmission && !bytecodeAnalysis?.hasStorageWrites ? 
          ['Contract emits events but doesn\'t modify storage'] : [],
        severity: 'low',
        metadata: { 
          reason: 'abi_required',
          bytecodeAnalysis: bytecodeAnalysis || null,
        },
      });
    }
  } else {
    abi = ABISchema.parse(input);
  }
  
  // Analyze functions and events
  const functions = analyzeTransferFunctions(abi);
  const events = analyzeTransferEvents(abi);
  
  // Cross-reference functions and events
  const { functions: updatedFunctions, events: updatedEvents } = 
    crossReferenceTransferFunctions(functions, events);
  
  // Detect non-functional transfer patterns
  const { nonFunctionalFunctions, orphanedEvents, viewTransfers } = 
    detectNonFunctionalTransfers(updatedFunctions, updatedEvents, bytecodeAnalysis);
  
  // Calculate metrics
  const confidence = calculateConfidence(
    nonFunctionalFunctions,
    orphanedEvents,
    viewTransfers,
    functions.length
  );
  
  const evidence = generateEvidence(
    nonFunctionalFunctions,
    orphanedEvents,
    viewTransfers,
    bytecodeAnalysis
  );
  
  const severity = determineSeverity(confidence, viewTransfers, nonFunctionalFunctions);
  
  // Determine if pattern is detected
  const detected = confidence > 0.3 && evidence.length > 0;
  
  return PatternResultSchema.parse({
    detected,
    confidence,
    category: 'non-functional-transfer',
    description: detected 
      ? `Detected ${evidence.length} non-functional transfer pattern(s) with ${Math.round(confidence * 100)}% confidence`
      : 'No non-functional transfer patterns detected',
    evidence,
    severity,
    metadata: {
      functionsAnalyzed: functions.length,
      eventsAnalyzed: events.length,
      transferFunctions: functions.filter(f => f.isTransferFunction).length,
      transferEvents: events.filter(e => e.isTransferEvent).length,
      nonFunctionalFunctions: nonFunctionalFunctions.length,
      orphanedEvents: orphanedEvents.length,
      viewTransfers: viewTransfers.length,
      erc20Functions: functions.filter(f => f.isERC20Standard).length,
      bytecodeAnalysis: bytecodeAnalysis || null,
    },
  });
}
