# Comparison of New Contract with Previously Analyzed Contracts
https://etherscan.io/advanced-filter?fadd=0xb2bd0afd6e5c19aab80b69f9a99e57f9e92fa536&tadd=0xb2bd0afd6e5c19aab80b69f9a99e57f9e92fa536&p=6
## Executive Summary

This report compares the newly provided contract with the previously analyzed `shuffle` contract and the fraudulent contracts. The new contract exhibits significant similarities with both, but introduces additional sophisticated mechanisms that make it even more concerning from a security perspective. It appears to be part of the same family of contracts, with enhanced capabilities for potential abuse.

## Contract Overview

The newly provided contract is a complex ERC-20 token implementation with several unusual features:

```solidity
const decimals = 18
const symbol = ''
const FEE = 100

def storage:
  owner is addr at storage 0
  totalSupply is uint256 at storage 2
  name is array of struct at storage 3
  stor4 is mapping of uint8 at storage 4
  stor5 is mapping of uint8 at storage 5
  unknowna12ab770Address is addr at storage 6
  unknown3767e339 is uint256 at storage 7
  stor8 is uint8 at storage 8
```

The contract implements standard ERC-20 functions but with highly unusual implementations, particularly for balance tracking and token transfers.

## Key Similarities with Previous Contracts

### 1. Storage Structure Patterns

All three contracts share similar storage patterns:

| Storage Slot | New Contract | `shuffle` Contract | Fraudulent Contracts |
|--------------|--------------|-------------------|----------------------|
| 0 | `owner` | `balanceOf` mapping | `stor0` mapping (balances) |
| 2 | `totalSupply` | `totalSupply` | `stor2` (varies) |
| 3 | `name` array | `stor3` (name) | `stor3` (name) |
| 4 | `stor4` mapping | `stor4` (symbol) | `stor4` (symbol) |

While there are differences in how storage is used, the pattern of using slots 3 and 4 for name and symbol-related data is consistent across all contracts.

### 2. CREATE2 Contract Deployment Pattern

The most striking similarity is the extensive use of CREATE2 to deploy child contracts:

```solidity
create2 contract with 0 wei
                salt: caller
                code: 0x32608060405234801561001057600080fd5b50600080546001600160a01b0319163317905560f4806100316000396000f3fe6080604052348015600f57600080fd5b506004361060325760003560e01c806361da1439146037578063e2e52ec1146063575b600080fd5b605160048036036020811015604b57600080fd5b50356085565b60408051918252519081900360200190f35b608360048036036040811015607757600080fd5b50803590602001356097565b005b60009081526001602052604090205490565b6000546001600160a01b0316331460ad57600080fd5b6000918252600160205260409091205556fea265627a7a72305820c625ddfc087af75f04c79f6b8213103319a49a2179f22a018ec9df402f19994a64736f6c634300050a00
```

This exact same bytecode is used in all three contracts, suggesting they were created by the same developer or team.

### 3. Incorrect Event Parameter Ordering

All contracts emit events with incorrect parameter ordering:

```solidity
log Approval(
      address tokenOwner=_value,
      address spender=caller,
      uint256 tokens=_spender)
```

This incorrect ordering would cause blockchain explorers and wallets to display misleading information about transfers and approvals.

### 4. Complex Balance Calculation

The new contract uses a complex mechanism for balance calculation that involves creating child contracts using CREATE2 and storing data in them:

```solidity
def balanceOf(address _owner) payable: 
  require calldata.size - 4 >=ΓÇ▓ 32
  require _owner == _owner
  if not ext_code.hash(sha3(0, this.address, addr(_owner), sha3(0x32608060405234801561001057600080fd5b50600080546001600160a01b0319163317905560f4806100316000396000f3fe6080604052348015600f57600080fd5b506004361060325760003560e01c806361da1439146037578063e2e52ec1146063575b600080fd5b605160048036036020811015604b57600080fd5b50356085565b60408051918252519081900360200190f35b608360048036036040811015607757600080fd5b50803590602001356097565b005b60009081526001602052604090205490565b6000546001600160a01b0316331460ad57600080fd5b6000918252600160205260409091205556fea265627a7a72305820c625ddfc087af75f04c79f6b8213103319a49a2179f22a018ec9df402f19994a64736f6c634300050a00))):
      return 0
  // ... more complex code ...
```

This differs from both the `shuffle` contract (which uses a straightforward mapping) and the fraudulent contracts (which calculate fake balances based on address and timestamp), but is equally concerning.

## Key Differences and Unique Features

### 1. Explicit Owner Role

Unlike the previous contracts, this contract has an explicit owner role:

```solidity
owner is addr at storage 0

def owner() payable: 
  return owner

def setOwner(address _new) payable: 
  require calldata.size - 4 >= 32
  if owner != caller:
      revert with 0, 'only owner'
  log TransferOwnership(
        address previousOwner=owner,
        address newOwner=_new)
  owner = _new
```

This provides more centralized control than the previous contracts.

### 2. External Contract Interaction

The new contract interacts with another contract whose address is stored in `unknowna12ab770Address`:

```solidity
def unknownfa7e8dc7() payable: 
  require ext_code.size(unknowna12ab770Address)
  static call unknowna12ab770Address.size() with:
          gas gas_remaining wei
  if not ext_call.success:
      revert with ext_call.return_data[0 len return_data.size]
  require return_data.size >= 32
  return ext_call.return_data[0]
```

This suggests a more complex system where this contract is part of a larger ecosystem of contracts.

### 3. Initialization Function

The contract has an `init` function that sets up the initial state:

```solidity
def init(address _owner, uint256 _color) payable: 
  require calldata.size - 4 >= 64
  require not stor8
  stor8 = 1
  require not totalSupply
  require not unknowna12ab770Address
  create contract with 0 wei
                  code: 0xfe608060405234801561001057600080fd5b50600080546001600160a01b03191633908117825560408051928352602083019190915280517f5c486528ec3e3f0ea91181cff8116f02bfa350e03b8b6f12e00765adbb5af85c9281900390910190a1610074600161007960201b610b621760201c565b6100fc565b8054156100e757604080517f08c379a000000000000000000000000000000000000000000000000000000000815260206004820152601360248201527f616c726561647920696e697469616c697a656400000000000000000000000000604482015290519081900360640190fd5b80546001810182556000918252602082200155565b610bf68061010b6000396000f3fe608060405234801561001057600080fd5b506004361061009e5760003560e01c8063949d225d11610066578063949d225d1461012e578063a2d83b5e14610136578063e2095c0714610162578063fd6aad25146101a2578063fe6dcdba146101c85761009e565b80630af2b3e5146100a357806313af4035146100dc57806331fb7127146101045780637c32cdd11461011e5780638da5cb5b14610126575b600080fd5b6100c0600480360360208110156100b957600080fd5b50356101d0565b604080516001600160a01b039092168252519081900360200190f35b610102600480360360208110156100f257600080fd5b50356001600160a01b03166101ea565b005b61010c6102a0565b60408051918252519081900360200190f35b61010c6102a6565b6100c06102ad565b61010c6102bc565b6101026004803603604081101561014c57600080fd5b506001600160a01b0381351690602001356102cd565b61017f6004803603602081101561017857600080fd5b50356104fb565b604080516001600160a01b03909316835260208301919091528051918290030190f35b61010c600480360360208110156101b857600080fd5b50356001600160a01b0316610519565b61017f610534565b60006101e360018363ffffffff61054916565b5092915050565b6000546001600160a01b03163314610236576040805162461bcd60e51b815260206004820152600a60248201526937b7363c9037bbb732b960b11b604482015290519081900360640190fd5b600054604080516001600160a01b039283168152918316602083015280517f5c486528ec3e3f0ea91181cff8116f02bfa350e03b8b6f12e00765adbb5af85c9281900390910190a1600080546001600160a01b0319166001600160a01b0392909216919091179055565b61020081565b6102005b90565b6000546001600160a01b031681565b60006102c8600161057c565b905090565b6000546001600160a01b03163314610319576040805162461bcd60e51b815260206004820152600a60248201526937b7363c9037bbb732b960b11b604482015290519081900360640190fd5b6000610325600161057c565b90508061038757604080518381526000602082015281516001600160a01b038616927fb7c8eb45e695579273671351c1ee88509af6ec27e061176b10f5f9fb145eff93928290030190a26103816001848463ffffffff61058416565b506104f7565b6000610393600161064f565b91506103a8905060018563ffffffff61067c16565b1561041a576103bf6001858563ffffffff61069d16565b82610415576103ce60016107c5565b505060408051600081526020810184905281516001600160a01b038716927f61072af1539e7159a567565ab0a7863c5ad61aa8daa91cf3843c3bb8bccb00e7928290030190a25b6104f4565b8215801590610433575061020082108061043357508281105b156104f457610200821061049e5760008061044e60016107c5565b91509150816001600160a01b03167f61072af1539e7159a567565ab0a7863c5ad61aa8daa91cf3843c3bb8bccb00e78286604051808381526020018281526020019250505060405180910390a250505b6104b06001858563ffffffff61058416565b604080518481526020810184905281516001600160a01b038716927fb7c8eb45e695579273671351c1ee88509af6ec27e061176b10f5f9fb145eff93928290030190a25b50505b5050565b60008061050f60018463ffffffff61054916565b915091505b915091565b6001600160a01b031660009081526002602052604090205490565b600080610541600161064f565b915091509091565b60008061057184600001846001018154811061056157fe5b9060005260206000200154610905565b915091509250929050565b546000190190565b6001600160a01b0382166000908152600184016020526040902054156105f1576040805162461bcd60e51b815260206004820152601860248201527f54686520656e74727920616c7265616479206578697374730000000000000000604482015290519081900360640190fd5b60006105fd838361091a565b84546001810186556000868152602090200181905584549091506000190161062c85828463ffffffff61092e16565b6001600160a01b0390941660009081526001909501602052505060409092205550565b805460009081906002111561066957506000905080610514565b61050f8360000160018154811061056157fe5b6001600160a01b031660009081526001919091016020526040902054151590565b6001600160a01b03821660009081526001840160205260409020548061070a576040805162461bcd60e51b815260206004820152601960248201527f54686520656e74727920646f6573206e6f742065786973747300000000000000604482015290519081900360640190fd5b6000610716848461091a565b9050600085600001838154811061072957fe5b906000526020600020015490506000818310156107585761075187858563ffffffff610a0516565b905061077a565b818311156107715761075187858563ffffffff61092e16565b505050506107c0565b8287600001828154811061078a57fe5b6000918252602090912001558084146107bb576001600160a01b038616600090815260018801602052604090208190555b505050505b505050565b8054600090819060018111610821576040805162461bcd60e51b815260206004820152601860248201527f546865206865617020646f6573206e6f74206578697374730000000000000000604482015290519081900360640190fd5b6108348460000160018154811061056157fe5b6001600160a01b03821660009081526001870160205260408120559093509150600281141561086f5760016108698582610b25565b506108ff565b600084600001600183038154811061088357fe5b9060005260206000200154905080856000016001815481106108a157fe5b60009182526020909120015560001982016108bc8682610b25565b5060016108d086828463ffffffff610a0516565b9050808660010160006108e285610b18565b6001600160a01b0316815260208101919091526040016000205550505b50915091565b196001600160a01b0381169160a09190911c90565b60a01b6001600160a01b0391909116171990565b81600181146109fe57600084600283048154811061094857fe5b906000526020600020015490505b828110156109fc57828186600285048154811061096f57fe5b90600052602060002001600088600001868154811061098a57fe5b60009182526020822001939093555091909155829060018701906109ad84610b18565b6001600160a01b0316815260208101919091526040016000205560028204915081600114156109db576109fc565b8460028304815481106109ea57fe5b90600052602060002001549050610956565b505b9392505050565b8254829060001981015b81836002021015610b0f5785546002840290600090889083908110610a3057fe5b90600052602060002001549050600082841115610a88576000896000018460010181548110610a5b57fe5b9060005260206000200154905080831015610a7e57809150836001019350610a82565b8291505b50610a8b565b50805b80871115610a9b57505050610b0f565b80878a6000018881548110610aac57fe5b9060005260206000200160008c6000018781548110610ac757fe5b60009182526020822001939093555091909155869060018b0190610aea84610b18565b6001600160a01b0316815260208101919091526040016000205550909350610a0f9050565b50509392505050565b196001600160a01b031690565b8154818355818111156107c0576000838152602090206107c09181019083016102aa91905b80821115610b5e5760008155600101610b4a565b5090565b805415610bac576040805162461bcd60e51b8152602060048201526013602482015272185b1c9958591e481a5b9a5d1a585b1a5e9959606a1b604482015290519081900360640190fd5b8054600181018255600091825260208220015556fea265627a7a723058202bf26f45bb12b8ec6258f5039e299408732938409649721fca33bd765b3c5af864736f6c634300050a00
  // ... more code ...
```

This function deploys another contract and sets up the initial state, suggesting a more complex initialization process than the previous contracts.

### 4. Whitelist/Blacklist Functionality

The contract appears to have whitelist/blacklist functionality through the `stor4` and `stor5` mappings:

```solidity
def unknowna486309d(addr _param1, bool _param2) payable: 
  require calldata.size - 4 >= 64
  if owner != caller:
      revert with 0, 'only owner'
  log 0x88cf9b94: addr(_param1), _param2
  stor5[addr(_param1)] = uint8(_param2)

def unknownff12bbf4(addr _param1, bool _param2) payable: 
  require calldata.size - 4 >= 64
  if owner != caller:
      revert with 0, 'only owner'
  log 0xc3d26c13: addr(_param1), _param2
  stor4[addr(_param1)] = uint8(_param2)
```

This allows the owner to control which addresses can interact with the contract.

## Suspicious Elements and Potential Abuse Vectors

### 1. Child Contract Deployment for Balance Storage

The contract uses CREATE2 to deploy child contracts for each user, which is highly unusual for an ERC-20 token. This pattern could be used to:

- Hide the true state of token balances from blockchain explorers
- Create unpredictable contract addresses that are difficult to track
- Potentially allow the contract owner to manipulate balances through the child contracts

### 2. Complex Transfer Logic with Conditional Execution

The transfer functions contain extremely complex conditional logic with multiple nested if-else statements and checks for code existence:

```solidity
def transfer(address _to, uint256 _value) payable: 
  require calldata.size - 4 >= 64
  if block.gasprice:
  if not _value:
      log 0x32ddf252: 0, caller, _to
      return 1
  if not ext_code.hash(sha3(0, this.address, caller, sha3(0x32608060405234801561001057600080fd5b50600080546001600160a01b0319163317905560f4806100316000396000f3fe6080604052348015600f57600080fd5b506004361060325760003560e01c806361da1439146037578063e2e52ec1146063575b600080fd5b605160048036036020811015604b57600080fd5b50356085565b60408051918252519081900360200190f35b608360048036036040811015607757600080fd5b50803590602001356097565b005b60009081526001602052604090205490565b6000546001600160a01b0316331460ad57600080fd5b6000918252600160205260409091205556fea265627a7a72305820c625ddfc087af75f04c79f6b8213103319a49a2179f22a018ec9df402f19994a64736f6c634300050a00))):
      // ... many nested conditions ...
```

This complexity makes it difficult to understand the true behavior of the contract and could hide malicious functionality.

### 3. External Contract Dependency

The contract depends on an external contract (`unknowna12ab770Address`) that is deployed during initialization:

```solidity
def unknownfa7e8dc7() payable: 
  require ext_code.size(unknowna12ab770Address)
  static call unknowna12ab770Address.size() with:
          gas gas_remaining wei
  // ...
```

Without seeing the code of this external contract, it's impossible to fully understand the behavior of the system.

### 4. Hardcoded Bytecode

The contract contains hardcoded bytecode for the child contracts it deploys:

```solidity
code: 0x32608060405234801561001057600080fd5b50600080546001600160a01b0319163317905560f4806100316000396000f3fe6080604052348015600f57600080fd5b506004361060325760003560e01c806361da1439146037578063e2e52ec1146063575b600080fd5b605160048036036020811015604b57600080fd5b50356085565b60408051918252519081900360200190f35b608360048036036040811015607757600080fd5b50803590602001356097565b005b60009081526001602052604090205490565b6000546001600160a01b0316331460ad57600080fd5b6000918252600160205260409091205556fea265627a7a72305820c625ddfc087af75f04c79f6b8213103319a49a2179f22a018ec9df402f19994a64736f6c634300050a00
```

This bytecode is identical to that used in the other contracts, suggesting a common origin.

## Potential Abuse Scenarios

### 1. Shadow Accounting System

The contract appears to implement a shadow accounting system where balances are stored in child contracts rather than in the main contract. This could allow:

- The contract owner to manipulate balances without leaving clear traces on the blockchain
- Users to be shown different balances than what they actually have
- Transactions to appear successful while not actually transferring any value

### 2. Selective Transaction Processing

The complex conditional logic in the transfer functions could allow the contract to selectively process transactions based on hidden criteria:

- Transactions from certain addresses might be silently ignored
- Transfers might appear successful but not actually move tokens
- The contract might behave differently depending on gas price or other transaction parameters

### 3. Centralized Control

The explicit owner role and whitelist/blacklist functionality give the contract owner significant control:

- The owner can blacklist addresses, preventing them from using the token
- The owner can potentially manipulate the external contract to affect token behavior
- The initialization process gives the owner control over the entire token ecosystem

## Conclusion

The newly provided contract shares significant similarities with both the `shuffle` contract and the previously analyzed fraudulent contracts, suggesting they are part of the same family of deceptive contracts. However, this contract introduces additional complexity and centralized control mechanisms that make it potentially more dangerous.

The use of CREATE2 to deploy child contracts for balance storage, the complex conditional logic in transfer functions, and the dependency on an external contract all contribute to a highly opaque system that would be difficult for users to understand or trust.

This contract appears designed to give its creator significant control while hiding its true behavior from users and blockchain explorers. It represents a sophisticated evolution of the deceptive patterns seen in the previous contracts, with enhanced capabilities for potential abuse.
