# Cryptocurrency Scam Analysis Report

## Executive Summary

This report presents a detailed analysis of a set of Ethereum smart contracts that appear to be part of a sophisticated cryptocurrency scam. The contracts implement a fake ERC-20 token with deceptive functionality designed to mislead users. The primary mechanism of the scam involves displaying fake balances to users while preventing actual token transfers, creating an illusion of value where none exists.

## Contract Addresses

The analyzed contracts are identified by the following addresses:

1. 0xacba164135904dc63c5418b57ff87efd341d7c80
2. 0xA995507632B358bA63f8A39616930f8A696bfd8d
3. 0xD66Fd225dbF7fD3c9f00220A455d05EFCCB1CBf0
4. 0x8270500F6a22c5Fc8b78Eecc24dD20dE85838149
5. 0x78EC1a6D4028A88B179247291993c9dCd14bE952
6. 0x54cb07D537d75e0Cf1B1E3870201FA20E8873D8a
7. 0x26A7a3cE145d5c9904C5DD20b47b349DB5f06420

These appear to be a series of related contracts, potentially deployed by the same entity or group as part of a coordinated scam operation.

## Technical Analysis

### Contract Structure

The contracts are decompiled ERC-20 token implementations with the following key components:

1. **Storage Variables**:
   ```solidity
   stor0 is mapping of uint256 at storage 0
   allowance is mapping of uint256 at storage 1
   stor2 is uint256 at storage 2
   stor3 is array of struct at storage 3
   stor4 is array of struct at storage 4
   totalSupply is uint256 at storage 5
   decimals is uint8 at storage 8 offset 160
   x is uint256 at storage 9
   ```

2. **Standard ERC-20 Functions**:
   - `totalSupply()`
   - `decimals()`
   - `balanceOf(address)`
   - `transfer(address, uint256)`
   - `transferFrom(address, address, uint256)`
   - `approve(address, uint256)`
   - `allowance(address, address)`
   - `name()`
   - `symbol()`

### Deceptive Mechanisms

#### 1. Fake Balance Reporting

The `balanceOf` function does not return actual token balances but instead calculates a pseudo-random value based on the user's address and the current block timestamp:

```solidity
def balanceOf(address _owner) payable: 
  require calldata.size - 4 >=ΓÇ▓ 32
  require _owner == _owner
  if 1 > (sha3(_owner, block.timestamp) % 45) + 1:
      revert with 0, 17
  if not decimals:
      if (sha3(_owner, block.timestamp) % 45) + 1 / (sha3(_owner, block.timestamp) % 45) + 1 != 1 and (sha3(_owner, block.timestamp) % 45) + 1:
          revert with 0, 17
      return ((sha3(_owner, block.timestamp) % 45) + 1 / 10)
  // ... more complex calculations ...
```

This implementation means:
- Users querying their balance will see a value that's not their actual balance
- The balance appears to change over time (as block.timestamp changes)
- Different users will see different balances based on their address

#### 2. Non-Functional Transfer

The `transfer` function does not actually transfer any tokens but only emits Transfer events:

```solidity
def transfer(address _to, uint256 _value) payable: 
  require calldata.size - 4 >=ΓÇ▓ 64
  require _to == _to
  if calldata.size < 68:
      revert with 0, 'Invalid calldata size'
  if calldata.size - 68 > calldata.size:
      revert with 0, 17
  idx = 0
  while idx < calldata.size - 68 / 96:
      mem[96] = cd[((96 * idx) + 132)]
      log Transfer(
            address from=cd[((96 * idx) + 132)],
            address to=addr(cd[((96 * idx) + 68)]),
            uint256 tokens=addr(cd[((96 * idx) + 100)]))
      idx = idx + 1
      continue 
  return 1
```

This creates the illusion of successful transfers while no actual token movement occurs.

#### 3. Misleading TransferFrom Implementation

The `transferFrom` function appears to implement actual token transfers, but:
- It's inconsistent with the `transfer` function behavior
- It manipulates storage values that aren't actually used elsewhere
- The parameters in the Transfer event are incorrectly ordered

```solidity
def transferFrom(address _from, address _to, uint256 _value) payable: 
  // ... validation code ...
  if _from:
      if stor0[addr(_from)] < _value:
          revert with 0, addr(_from), stor0[addr(_from)], _value
      stor0[addr(_from)] -= _value
  else:
      if stor2 > _value + stor2:
          revert with 0, 17
      stor2 += _value
  if _to:
      stor0[addr(_to)] += _value
  else:
      stor2 -= _value
  log Transfer(
        address from=_value,
        address to=_from,
        uint256 tokens=_to)
  return 1
```

Note the incorrect parameter ordering in the Transfer event, which would confuse blockchain explorers and wallets.

#### 4. No Withdrawal Functions

There are no functions that allow the withdrawal of ETH or other tokens from the contract, suggesting that any ETH sent to the contract would be permanently locked (unless the contract includes a selfdestruct function not visible in the decompiled code).

## Perpetrators Profile

Based on the technical analysis, we can infer the following about the perpetrators:

1. **Technical Sophistication**: The scammers demonstrate significant technical knowledge of Ethereum smart contracts and the ERC-20 standard. The implementation is complex enough to fool casual inspection.

2. **Deliberate Deception**: The code shows clear intent to deceive, with carefully crafted functions that mimic legitimate token behavior while preventing actual token utility.

3. **Multiple Contract Deployment**: The presence of multiple contract addresses suggests a pattern of repeated deployments, potentially to:
   - Target different victim groups
   - Evade detection or blacklisting
   - Create the appearance of multiple legitimate projects

4. **Identity Concealment**: No clear ownership functions or admin controls are present in the code, making it difficult to identify the contract deployer beyond their Ethereum address.

## Potential Victims

The victims of this scam are likely to be:

1. **Inexperienced Cryptocurrency Users**: People new to cryptocurrency who lack the technical knowledge to verify contract functionality.

2. **Investors Seeking New Opportunities**: Individuals looking for early investment opportunities in new tokens, particularly those promised high returns.

3. **Users of Decentralized Exchanges (DEXs)**: People who might trade ETH or other valuable tokens for these worthless tokens on DEXs.

4. **Airdrop Participants**: Users who might have received these tokens as part of an airdrop and believe they have value.

## Scam Methodology

The scam likely operates through the following steps:

1. **Contract Deployment**: The scammers deploy the fake token contract.

2. **Marketing and Promotion**: They promote the token through social media, messaging apps, or other channels, making false claims about its utility or value.

3. **Initial Liquidity**: They might create initial liquidity on a DEX by pairing the worthless token with ETH or another valuable token.

4. **Victim Participation**: Victims purchase the token, sending real value (ETH) to the scammers.

5. **Inability to Sell**: When victims try to sell their tokens, they discover that transfers don't work as expected.

6. **Exit Scam**: The scammers remove any liquidity they provided and disappear with the proceeds.

## Recommendations for Victims

If you believe you've been affected by this scam:

1. **Stop Interacting**: Cease all interactions with the identified contract addresses.

2. **Document Evidence**: Save all transaction hashes, communications, and promotional materials related to the token.

3. **Report to Authorities**: Report the scam to relevant cryptocurrency crime units and financial authorities.

4. **Alert the Community**: Share information about the scam to prevent others from becoming victims.

5. **Consult Legal Advice**: Consider seeking legal counsel regarding potential recovery options.

## Preventive Measures

To avoid similar scams in the future:

1. **Verify Contract Code**: Always review the contract code or seek audits before investing.

2. **Test Functionality**: Make small test transactions to verify that tokens can be transferred and traded as expected.

3. **Research Projects Thoroughly**: Investigate team backgrounds, project history, and community feedback.

4. **Be Skeptical of High Returns**: Be wary of projects promising unusually high or guaranteed returns.

5. **Use Established Platforms**: Prefer tokens listed on reputable exchanges with proper vetting processes.

## Conclusion

The analyzed contracts represent a sophisticated cryptocurrency scam designed to deceive users into believing they own valuable tokens when in reality they do not. The technical implementation reveals deliberate efforts to create an illusion of functionality while preventing actual token utility. This type of scam highlights the importance of due diligence and technical verification when interacting with cryptocurrency tokens and smart contracts.
