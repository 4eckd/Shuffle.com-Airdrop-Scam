# Cryptocurrency Scam Analysis

This repository contains a detailed analysis of a set of Ethereum smart contracts that appear to be part of a sophisticated cryptocurrency scam. The analysis includes decompiled contract code, detailed reports, and insights into how these contracts could be used to defraud users.

## Repository Contents

### Decompiled Contracts
- `Decompiled 0-5`: Decompiled versions of the fraudulent ERC-20 token contracts
- `shuffle`: A related contract with suspicious elements

### Analysis Reports
- `summary_report.md`: Comprehensive analysis of the fraudulent contracts
- `airdrop_summary.md`: Analysis of how these contracts could be used in airdrop scams
- `shuffle_report.md`: Analysis of the `shuffle` contract and its similarities to the fraudulent contracts

## Key Findings

The analyzed contracts implement fake ERC-20 tokens with deceptive functionality designed to mislead users. The primary mechanisms of the scam include:

1. **Fake Balance Reporting**: Displaying fake balances to users while preventing actual token transfers
2. **Non-functional Transfers**: Emitting transfer events without actually moving tokens
3. **Deceptive Implementation**: Complex code that obscures the true non-functional nature of the tokens

The `shuffle` contract represents a more sophisticated variant that implements actual token transfers but maintains deceptive elements like incorrect event parameter ordering and suspicious burn functionality.

## Contract Addresses

The analyzed fraudulent contracts are identified by the following addresses:

1. 0xacba164135904dc63c5418b57ff87efd341d7c80
2. 0xA995507632B358bA63f8A39616930f8A696bfd8d
3. 0xD66Fd225dbF7fD3c9f00220A455d05EFCCB1CBf0
4. 0x8270500F6a22c5Fc8b78Eecc24dD20dE85838149
5. 0x78EC1a6D4028A88B179247291993c9dCd14bE952
6. 0x54cb07D537d75e0Cf1B1E3870201FA20E8873D8a
7. 0x26A7a3cE145d5c9904C5DD20b47b349DB5f06420

## Purpose of This Repository

This repository is intended for educational purposes to help:

1. Researchers and security professionals understand sophisticated token scams
2. Cryptocurrency users identify and avoid similar scams
3. Exchange operators and wallet providers improve their token verification processes
4. Law enforcement and regulatory bodies recognize patterns in fraudulent contracts

## Warning

The contracts in this repository are examples of fraudulent code. Do not deploy, interact with, or send funds to these contracts or similar ones. This repository is provided solely for educational and research purposes.

## Contributing

If you have encountered similar scams or have additional insights into these contracts, please consider contributing to this repository by:

1. Opening an issue with your findings
2. Submitting a pull request with additional analysis
3. Sharing information about related scam contracts

## License

This repository is provided under the MIT License. The analysis and documentation can be freely used and shared for educational purposes.
