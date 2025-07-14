/**
 * Test fixtures for pattern detection tests
 * 
 * This file contains sample ABIs and bytecodes for testing
 * each pattern detector with both positive and negative cases.
 */

// Sample legitimate ERC20 ABI
export const LEGITIMATE_ERC20_ABI = [
  {
    "type": "function",
    "name": "transfer",
    "inputs": [
      { "name": "to", "type": "address" },
      { "name": "amount", "type": "uint256" }
    ],
    "outputs": [{ "name": "", "type": "bool" }],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "balanceOf",
    "inputs": [{ "name": "account", "type": "address" }],
    "outputs": [{ "name": "", "type": "uint256" }],
    "stateMutability": "view"
  },
  {
    "type": "event",
    "name": "Transfer",
    "inputs": [
      { "name": "from", "type": "address", "indexed": true },
      { "name": "to", "type": "address", "indexed": true },
      { "name": "value", "type": "uint256", "indexed": false }
    ]
  }
];

// Deceptive events test cases
export const DECEPTIVE_EVENTS_ABI = [
  {
    "type": "function",
    "name": "fakeTransfer",
    "inputs": [
      { "name": "to", "type": "address" },
      { "name": "amount", "type": "uint256" }
    ],
    "outputs": [{ "name": "", "type": "bool" }],
    "stateMutability": "view" // Suspicious: view function shouldn't transfer
  },
  {
    "type": "event",
    "name": "Transfer",
    "inputs": [
      { "name": "from", "type": "address", "indexed": true },
      { "name": "to", "type": "address", "indexed": true },
      { "name": "value", "type": "uint256", "indexed": false }
    ]
  },
  {
    "type": "event",
    "name": "Success",
    "inputs": [{ "name": "result", "type": "bool" }]
  }
];

// Fake balance test cases
export const FAKE_BALANCE_ABI = [
  {
    "type": "function",
    "name": "balanceOfTimestamp",
    "inputs": [{ "name": "account", "type": "address" }],
    "outputs": [{ "name": "", "type": "uint256" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "balanceOf",
    "inputs": [{ "name": "account", "type": "address" }],
    "outputs": [{ "name": "", "type": "string" }], // Wrong return type
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getBalanceNow",
    "inputs": [{ "name": "user", "type": "address" }],
    "outputs": [{ "name": "", "type": "uint256" }],
    "stateMutability": "view"
  }
];

// Non-functional transfer test cases
export const NON_FUNCTIONAL_TRANSFER_ABI = [
  {
    "type": "function",
    "name": "transfer",
    "inputs": [
      { "name": "to", "type": "address" },
      { "name": "amount", "type": "uint256" }
    ],
    "outputs": [{ "name": "", "type": "bool" }],
    "stateMutability": "view" // Suspicious: view transfer
  },
  {
    "type": "function",
    "name": "withdraw",
    "inputs": [{ "name": "amount", "type": "uint256" }],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "event",
    "name": "Transfer",
    "inputs": [
      { "name": "from", "type": "address", "indexed": true },
      { "name": "to", "type": "address", "indexed": true },
      { "name": "value", "type": "uint256", "indexed": false }
    ]
  }
  // Note: withdraw function has no corresponding event
];

// Sample bytecodes for testing
export const LEGITIMATE_BYTECODE = "0x608060405234801561001057600080fd5b5060405161020e38038061020e83398101604081905261002f916100b9565b600080546001600160a01b0319166001600160a01b0392909216919091179055600155005b60405161020e38038061020e83398101604081905261002f916100b9565b600080546001600160a01b0319166001600160a01b0392909216919091179055600155005b";

// Hidden redirection test bytecode (contains SELFDESTRUCT with hard-coded address)
export const HIDDEN_REDIRECTION_BYTECODE = "0x73deadbeefdeadbeefdeadbeefdeadbeefdeadbeefff"; // Contains PUSH20 + SELFDESTRUCT

// Bytecode with event emission but no storage writes
export const NON_FUNCTIONAL_TRANSFER_BYTECODE = "0x608060405234801561001057600080fd5b50a1a1a1"; // Contains LOG1 opcodes but no SSTORE

// Empty bytecode (EOA)
export const EMPTY_BYTECODE = "0x";

// Complex malicious bytecode with multiple patterns
export const COMPLEX_MALICIOUS_BYTECODE = "0x608060405234801561001057600080fd5b5073deadbeefdeadbeefdeadbeefdeadbeefdeadbeeff173cafebabecafebabecafebabecafebabecafebabefdfa1a255";

// Test data for comprehensive analysis
export const TEST_CASES = {
  legitimate: {
    abi: LEGITIMATE_ERC20_ABI,
    bytecode: LEGITIMATE_BYTECODE,
    description: "Legitimate ERC20 contract"
  },
  deceptiveEvents: {
    abi: DECEPTIVE_EVENTS_ABI,
    bytecode: LEGITIMATE_BYTECODE,
    description: "Contract with deceptive event patterns"
  },
  fakeBalance: {
    abi: FAKE_BALANCE_ABI,
    bytecode: LEGITIMATE_BYTECODE,
    description: "Contract with fake balance patterns"
  },
  nonFunctionalTransfer: {
    abi: NON_FUNCTIONAL_TRANSFER_ABI,
    bytecode: NON_FUNCTIONAL_TRANSFER_BYTECODE,
    description: "Contract with non-functional transfer patterns"
  },
  hiddenRedirection: {
    abi: LEGITIMATE_ERC20_ABI,
    bytecode: HIDDEN_REDIRECTION_BYTECODE,
    description: "Contract with hidden redirection patterns"
  },
  complexMalicious: {
    abi: [
      ...DECEPTIVE_EVENTS_ABI,
      ...FAKE_BALANCE_ABI,
      ...NON_FUNCTIONAL_TRANSFER_ABI
    ],
    bytecode: COMPLEX_MALICIOUS_BYTECODE,
    description: "Complex malicious contract with multiple patterns"
  }
};

// Edge cases for testing
export const EDGE_CASES = {
  emptyAbi: [],
  emptyBytecode: "0x",
  invalidJson: "invalid json",
  invalidBytecode: "not a valid bytecode",
  malformedAbi: [
    {
      "type": "function",
      // Missing name and other required fields
    }
  ]
};

// Expected results for each test case
export const EXPECTED_RESULTS = {
  legitimate: {
    deceptiveEvents: { detected: false, confidence: 0 },
    hiddenRedirection: { detected: false, confidence: 0 },
    fakeBalance: { detected: false, confidence: 0 },
    nonFunctionalTransfer: { detected: false, confidence: 0 }
  },
  deceptiveEvents: {
    deceptiveEvents: { detected: true, confidence: 0.3 },
    hiddenRedirection: { detected: false, confidence: 0 },
    fakeBalance: { detected: false, confidence: 0 },
    nonFunctionalTransfer: { detected: false, confidence: 0 }
  },
  fakeBalance: {
    deceptiveEvents: { detected: false, confidence: 0 },
    hiddenRedirection: { detected: false, confidence: 0 },
    fakeBalance: { detected: true, confidence: 0.3 },
    nonFunctionalTransfer: { detected: false, confidence: 0 }
  },
  nonFunctionalTransfer: {
    deceptiveEvents: { detected: false, confidence: 0 },
    hiddenRedirection: { detected: false, confidence: 0 },
    fakeBalance: { detected: false, confidence: 0 },
    nonFunctionalTransfer: { detected: true, confidence: 0.3 }
  },
  hiddenRedirection: {
    deceptiveEvents: { detected: false, confidence: 0 },
    hiddenRedirection: { detected: true, confidence: 0.2 },
    fakeBalance: { detected: false, confidence: 0 },
    nonFunctionalTransfer: { detected: false, confidence: 0 }
  }
};
