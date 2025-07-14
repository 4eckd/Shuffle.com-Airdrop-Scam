import { PatternResult, PatternResultSchema, ABI } from '../../types';

/**
 * Detects hidden redirection patterns in smart contracts
 * 
 * This detector analyzes bytecode to identify opcode sequences that redirect
 * calls or funds to hard-coded addresses, which is a common pattern in scam contracts
 * where the attacker redirects legitimate operations to their own address.
 */

// Common opcodes used in redirection patterns
const REDIRECTION_OPCODES = {
  CALL: '0xf1',
  DELEGATECALL: '0xf4',
  STATICCALL: '0xfa',
  CALLCODE: '0xf2',
  PUSH20: '0x73', // Used to push 20-byte addresses
  PUSH32: '0x7f', // Used to push 32-byte values
  JUMP: '0x56',
  JUMPI: '0x57',
  RETURNDATACOPY: '0x3e',
  RETURN: '0xf3',
  REVERT: '0xfd',
  SELFDESTRUCT: '0xff',
};

// Known malicious address patterns (shortened for detection)
const SUSPICIOUS_ADDRESS_PATTERNS = [
  // Common burn addresses
  '0x000000000000000000000000000000000000dead',
  '0x0000000000000000000000000000000000000000',
  // Patterns that might indicate hard-coded addresses
  '0xdeadbeef',
  '0xcafebabe',
  '0x1337',
];

interface RedirectionPattern {
  type: 'call' | 'jump' | 'selfdestruct' | 'hardcoded-address';
  address?: string;
  opcodes: string[];
  position: number;
  context: string;
}

/**
 * Converts bytecode to opcode array for analysis
 */
function bytecodeToOpcodes(bytecode: string): string[] {
  if (!bytecode || bytecode === '0x') return [];
  
  const cleanBytecode = bytecode.startsWith('0x') ? bytecode.slice(2) : bytecode;
  const opcodes: string[] = [];
  
  for (let i = 0; i < cleanBytecode.length; i += 2) {
    const opcode = cleanBytecode.slice(i, i + 2);
    opcodes.push('0x' + opcode);
  }
  
  return opcodes;
}

/**
 * Extracts addresses from bytecode using PUSH20 patterns
 */
function extractAddresses(opcodes: string[]): { address: string; position: number }[] {
  const addresses: { address: string; position: number }[] = [];
  
  for (let i = 0; i < opcodes.length - 20; i++) {
    if (opcodes[i] === REDIRECTION_OPCODES.PUSH20) {
      // Extract the 20-byte address that follows PUSH20
      const addressBytes = opcodes.slice(i + 1, i + 21);
      if (addressBytes.length === 20) {
        const address = '0x' + addressBytes.map(b => b.replace('0x', '')).join('');
        addresses.push({ address, position: i });
      }
    }
  }
  
  return addresses;
}

/**
 * Detects call redirection patterns
 */
function detectCallRedirection(opcodes: string[]): RedirectionPattern[] {
  const patterns: RedirectionPattern[] = [];
  
  for (let i = 0; i < opcodes.length - 5; i++) {
    const current = opcodes[i];
    
    // Look for call patterns with hard-coded addresses
    if ([REDIRECTION_OPCODES.CALL, REDIRECTION_OPCODES.DELEGATECALL, 
         REDIRECTION_OPCODES.STATICCALL, REDIRECTION_OPCODES.CALLCODE].includes(current)) {
      
      // Check for PUSH20 (address) followed by CALL
      for (let j = Math.max(0, i - 25); j < i; j++) {
        if (opcodes[j] === REDIRECTION_OPCODES.PUSH20) {
          const addressBytes = opcodes.slice(j + 1, j + 21);
          if (addressBytes.length === 20) {
            const address = '0x' + addressBytes.map(b => b.replace('0x', '')).join('');
            patterns.push({
              type: 'call',
              address,
              opcodes: opcodes.slice(j, i + 1),
              position: j,
              context: `${current} instruction with hard-coded address`,
            });
          }
          break;
        }
      }
    }
  }
  
  return patterns;
}

/**
 * Detects jump redirection patterns
 */
function detectJumpRedirection(opcodes: string[]): RedirectionPattern[] {
  const patterns: RedirectionPattern[] = [];
  
  for (let i = 0; i < opcodes.length - 2; i++) {
    const current = opcodes[i];
    
    // Look for conditional jumps that might bypass normal execution
    if (current === REDIRECTION_OPCODES.JUMPI) {
      // Check if the jump target is hard-coded
      for (let j = Math.max(0, i - 10); j < i; j++) {
        if (opcodes[j].startsWith('0x6') || opcodes[j].startsWith('0x7')) { // PUSH opcodes
          patterns.push({
            type: 'jump',
            opcodes: opcodes.slice(j, i + 1),
            position: j,
            context: 'Conditional jump with hard-coded destination',
          });
          break;
        }
      }
    }
  }
  
  return patterns;
}

/**
 * Detects selfdestruct redirection patterns
 */
function detectSelfdestructRedirection(opcodes: string[]): RedirectionPattern[] {
  const patterns: RedirectionPattern[] = [];
  
  for (let i = 0; i < opcodes.length; i++) {
    if (opcodes[i] === REDIRECTION_OPCODES.SELFDESTRUCT) {
      // Check for hard-coded beneficiary address
      for (let j = Math.max(0, i - 25); j < i; j++) {
        if (opcodes[j] === REDIRECTION_OPCODES.PUSH20) {
          const addressBytes = opcodes.slice(j + 1, j + 21);
          if (addressBytes.length === 20) {
            const address = '0x' + addressBytes.map(b => b.replace('0x', '')).join('');
            patterns.push({
              type: 'selfdestruct',
              address,
              opcodes: opcodes.slice(j, i + 1),
              position: j,
              context: 'SELFDESTRUCT with hard-coded beneficiary',
            });
          }
          break;
        }
      }
    }
  }
  
  return patterns;
}

/**
 * Detects hard-coded suspicious addresses
 */
function detectHardcodedAddresses(opcodes: string[]): RedirectionPattern[] {
  const patterns: RedirectionPattern[] = [];
  const addresses = extractAddresses(opcodes);
  
  addresses.forEach(({ address, position }) => {
    // Check against known suspicious patterns
    const isSuspicious = SUSPICIOUS_ADDRESS_PATTERNS.some(pattern => 
      address.toLowerCase().includes(pattern.toLowerCase())
    );
    
    if (isSuspicious) {
      patterns.push({
        type: 'hardcoded-address',
        address,
        opcodes: opcodes.slice(position, position + 21),
        position,
        context: 'Hard-coded suspicious address detected',
      });
    }
  });
  
  return patterns;
}

/**
 * Calculates confidence score based on detected patterns
 */
function calculateConfidence(patterns: RedirectionPattern[]): number {
  if (patterns.length === 0) return 0;
  
  let score = 0;
  
  patterns.forEach(pattern => {
    switch (pattern.type) {
      case 'call':
        score += 0.3;
        break;
      case 'jump':
        score += 0.2;
        break;
      case 'selfdestruct':
        score += 0.4;
        break;
      case 'hardcoded-address':
        score += 0.1;
        break;
    }
  });
  
  // Boost confidence if multiple different pattern types detected
  const uniqueTypes = new Set(patterns.map(p => p.type));
  if (uniqueTypes.size > 1) {
    score *= 1.5;
  }
  
  return Math.min(score, 1.0);
}

/**
 * Generates evidence array for detected patterns
 */
function generateEvidence(patterns: RedirectionPattern[]): string[] {
  const evidence: string[] = [];
  
  patterns.forEach(pattern => {
    let evidenceText = `${pattern.context} at position ${pattern.position}`;
    if (pattern.address) {
      evidenceText += ` (address: ${pattern.address})`;
    }
    evidence.push(evidenceText);
  });
  
  return evidence;
}

/**
 * Determines severity based on confidence and pattern types
 */
function determineSeverity(confidence: number, patterns: RedirectionPattern[]): 'low' | 'medium' | 'high' | 'critical' {
  const hasSelfDestruct = patterns.some(p => p.type === 'selfdestruct');
  const hasMultipleCalls = patterns.filter(p => p.type === 'call').length > 2;
  
  if (hasSelfDestruct && confidence >= 0.6) return 'critical';
  if (hasMultipleCalls && confidence >= 0.5) return 'high';
  if (confidence >= 0.4) return 'medium';
  return 'low';
}

/**
 * Main detection function for hidden redirection pattern
 */
export function detect(input: string | ABI): PatternResult {
  let bytecode: string;
  
  // Parse input - should be bytecode for this detector
  if (typeof input === 'string') {
    try {
      // Try to parse as JSON first (might be ABI)
      JSON.parse(input);
      // If it's ABI, we can't analyze for bytecode patterns
      return PatternResultSchema.parse({
        detected: false,
        confidence: 0,
        category: 'hidden-redirection',
        description: 'Hidden redirection pattern analysis requires bytecode, not ABI',
        evidence: [],
        severity: 'low',
        metadata: { reason: 'abi_not_supported' },
      });
    } catch {
      // If JSON parsing fails, treat as bytecode
      bytecode = input;
    }
  } else {
    // ABI object provided, but we need bytecode
    return PatternResultSchema.parse({
      detected: false,
      confidence: 0,
      category: 'hidden-redirection',
      description: 'Hidden redirection pattern analysis requires bytecode, not ABI',
      evidence: [],
      severity: 'low',
      metadata: { reason: 'abi_not_supported' },
    });
  }
  
  // Validate bytecode format
  if (!bytecode || bytecode === '0x') {
    return PatternResultSchema.parse({
      detected: false,
      confidence: 0,
      category: 'hidden-redirection',
      description: 'No bytecode provided for analysis',
      evidence: [],
      severity: 'low',
      metadata: { reason: 'empty_bytecode' },
    });
  }
  
  try {
    // Convert bytecode to opcodes
    const opcodes = bytecodeToOpcodes(bytecode);
    
    // Detect different types of redirection patterns
    const callPatterns = detectCallRedirection(opcodes);
    const jumpPatterns = detectJumpRedirection(opcodes);
    const selfdestructPatterns = detectSelfdestructRedirection(opcodes);
    const hardcodedPatterns = detectHardcodedAddresses(opcodes);
    
    // Combine all patterns
    const allPatterns = [
      ...callPatterns,
      ...jumpPatterns,
      ...selfdestructPatterns,
      ...hardcodedPatterns,
    ];
    
    // Calculate metrics
    const confidence = calculateConfidence(allPatterns);
    const evidence = generateEvidence(allPatterns);
    const severity = determineSeverity(confidence, allPatterns);
    
    // Determine if pattern is detected
    const detected = confidence > 0.2 && allPatterns.length > 0;
    
    return PatternResultSchema.parse({
      detected,
      confidence,
      category: 'hidden-redirection',
      description: detected 
        ? `Detected ${allPatterns.length} hidden redirection pattern(s) with ${Math.round(confidence * 100)}% confidence`
        : 'No hidden redirection patterns detected',
      evidence,
      severity,
      metadata: {
        totalPatterns: allPatterns.length,
        callPatterns: callPatterns.length,
        jumpPatterns: jumpPatterns.length,
        selfdestructPatterns: selfdestructPatterns.length,
        hardcodedPatterns: hardcodedPatterns.length,
        bytecodeLength: bytecode.length,
        opcodeCount: opcodes.length,
      },
    });
  } catch (error) {
    return PatternResultSchema.parse({
      detected: false,
      confidence: 0,
      category: 'hidden-redirection',
      description: 'Error analyzing bytecode for hidden redirection patterns',
      evidence: [],
      severity: 'low',
      metadata: { 
        error: error instanceof Error ? error.message : 'Unknown error',
        reason: 'analysis_error' 
      },
    });
  }
}
