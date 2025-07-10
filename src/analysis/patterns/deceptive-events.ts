import { PatternResult, PatternResultSchema, ABI, ABISchema } from '../../types';

/**
 * Detects deceptive event patterns in smart contracts
 * 
 * This detector analyzes ABI to identify contracts that emit misleading events
 * which don't correspond to actual state changes. Common in scam contracts
 * to make transactions appear successful when they're not.
 */

// Event signature patterns commonly used in scams
const DECEPTIVE_EVENT_SIGNATURES = [
  // Transfer events that don't correspond to actual transfers
  'Transfer(address,address,uint256)',
  'Approval(address,address,uint256)',
  // Fake success events
  'Success(bool)',
  'Completed(bool)',
  'Confirmed(bool)',
  // Misleading claim events
  'Claimed(address,uint256)',
  'Rewarded(address,uint256)',
  'Airdropped(address,uint256)',
];

// Function patterns that typically don't have corresponding state changes
const DECEPTIVE_FUNCTION_PATTERNS = [
  'transfer',
  'approve',
  'claim',
  'reward',
  'airdrop',
  'withdraw',
  'deposit',
];

interface EventAnalysis {
  name: string;
  hasCorrespondingStateChange: boolean;
  isCommonScamPattern: boolean;
  topics: string[];
}

interface FunctionAnalysis {
  name: string;
  hasEvents: boolean;
  hasStateChanges: boolean;
  isView: boolean;
  isPure: boolean;
}

/**
 * Analyzes ABI events for deceptive patterns
 */
function analyzeEvents(abi: ABI): EventAnalysis[] {
  const events = abi.filter(item => item.type === 'event');
  
  return events.map(event => {
    const eventName = event.name || '';
    const isCommonScamPattern = DECEPTIVE_EVENT_SIGNATURES.some(sig => 
      sig.toLowerCase().includes(eventName.toLowerCase())
    );
    
    // Generate event topics for analysis
    const topics = event.inputs?.map(input => 
      `${input.name}(${input.type})`
    ) || [];
    
    return {
      name: eventName,
      hasCorrespondingStateChange: false, // Will be analyzed with functions
      isCommonScamPattern,
      topics,
    };
  });
}

/**
 * Analyzes ABI functions for state-changing behavior
 */
function analyzeFunctions(abi: ABI): FunctionAnalysis[] {
  const functions = abi.filter(item => item.type === 'function');
  
  return functions.map(func => {
    const funcName = func.name || '';
    const isView = func.stateMutability === 'view';
    const isPure = func.stateMutability === 'pure';
    const hasStateChanges = !isView && !isPure;
    
    return {
      name: funcName,
      hasEvents: false, // Will be cross-referenced
      hasStateChanges,
      isView,
      isPure,
    };
  });
}

/**
 * Cross-references events with functions to detect mismatches
 */
function crossReferenceEventsAndFunctions(
  events: EventAnalysis[],
  functions: FunctionAnalysis[]
): { events: EventAnalysis[]; functions: FunctionAnalysis[] } {
  
  // Update events with corresponding state change info
  const updatedEvents = events.map(event => {
    const correspondingFunction = functions.find(func => 
      func.name.toLowerCase().includes(event.name.toLowerCase()) ||
      event.name.toLowerCase().includes(func.name.toLowerCase())
    );
    
    return {
      ...event,
      hasCorrespondingStateChange: correspondingFunction?.hasStateChanges || false,
    };
  });
  
  // Update functions with event emission info
  const updatedFunctions = functions.map(func => {
    const hasEvents = events.some(event => 
      event.name.toLowerCase().includes(func.name.toLowerCase()) ||
      func.name.toLowerCase().includes(event.name.toLowerCase())
    );
    
    return {
      ...func,
      hasEvents,
    };
  });
  
  return {
    events: updatedEvents,
    functions: updatedFunctions,
  };
}

/**
 * Calculates confidence score based on detected patterns
 */
function calculateConfidence(
  events: EventAnalysis[],
  functions: FunctionAnalysis[]
): number {
  if (events.length === 0) return 0;
  
  let suspiciousCount = 0;
  let totalCount = events.length;
  
  // Check for events without corresponding state changes
  suspiciousCount += events.filter(event => 
    !event.hasCorrespondingStateChange && event.isCommonScamPattern
  ).length;
  
  // Check for functions that should emit events but don't
  suspiciousCount += functions.filter(func => 
    func.hasStateChanges && 
    !func.hasEvents && 
    DECEPTIVE_FUNCTION_PATTERNS.some(pattern => 
      func.name.toLowerCase().includes(pattern)
    )
  ).length;
  
  // Boost confidence if multiple patterns detected
  const ratio = suspiciousCount / Math.max(totalCount, 1);
  return Math.min(ratio * 1.5, 1.0);
}

/**
 * Generates evidence array for detected patterns
 */
function generateEvidence(
  events: EventAnalysis[],
  functions: FunctionAnalysis[]
): string[] {
  const evidence: string[] = [];
  
  // Evidence for deceptive events
  events.forEach(event => {
    if (!event.hasCorrespondingStateChange && event.isCommonScamPattern) {
      evidence.push(
        `Event '${event.name}' appears to be emitted without corresponding state changes`
      );
    }
  });
  
  // Evidence for missing events
  functions.forEach(func => {
    if (func.hasStateChanges && !func.hasEvents && 
        DECEPTIVE_FUNCTION_PATTERNS.some(pattern => 
          func.name.toLowerCase().includes(pattern)
        )) {
      evidence.push(
        `Function '${func.name}' modifies state but doesn't emit expected events`
      );
    }
  });
  
  return evidence;
}

/**
 * Determines severity based on confidence and evidence
 */
function determineSeverity(confidence: number, evidenceCount: number): 'low' | 'medium' | 'high' | 'critical' {
  if (confidence >= 0.8 && evidenceCount >= 3) return 'critical';
  if (confidence >= 0.6 && evidenceCount >= 2) return 'high';
  if (confidence >= 0.4 && evidenceCount >= 1) return 'medium';
  return 'low';
}

/**
 * Main detection function for deceptive events pattern
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
        category: 'deceptive-events',
        description: 'Deceptive events pattern analysis requires ABI, not bytecode',
        evidence: [],
        severity: 'low',
        metadata: { reason: 'bytecode_not_supported' },
      });
    }
  } else {
    abi = ABISchema.parse(input);
  }
  
  // Analyze events and functions
  const events = analyzeEvents(abi);
  const functions = analyzeFunctions(abi);
  
  // Cross-reference to find mismatches
  const { events: updatedEvents, functions: updatedFunctions } = 
    crossReferenceEventsAndFunctions(events, functions);
  
  // Calculate metrics
  const confidence = calculateConfidence(updatedEvents, updatedFunctions);
  const evidence = generateEvidence(updatedEvents, updatedFunctions);
  const severity = determineSeverity(confidence, evidence.length);
  
  // Determine if pattern is detected
  const detected = confidence > 0.3 && evidence.length > 0;
  
  return PatternResultSchema.parse({
    detected,
    confidence,
    category: 'deceptive-events',
    description: detected 
      ? `Detected ${evidence.length} deceptive event pattern(s) with ${Math.round(confidence * 100)}% confidence`
      : 'No deceptive event patterns detected',
    evidence,
    severity,
    metadata: {
      eventsAnalyzed: events.length,
      functionsAnalyzed: functions.length,
      suspiciousEvents: updatedEvents.filter(e => !e.hasCorrespondingStateChange && e.isCommonScamPattern).length,
      suspiciousFunctions: updatedFunctions.filter(f => f.hasStateChanges && !f.hasEvents).length,
    },
  });
}
