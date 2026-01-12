---
published: true
title: "How to Migrate an Ethereum Protocol to Solana — Preamble"
author:
  [
    "Bonnie Chen/ Full Stack Engineer",
    "Bin Li/Tech Lead",
    "Jimmy Zhao/ Full Stack Engineer",
    "Shan Yang/Tech Lead",
    "Jia Xin Liang/Backend Engineer",
    "Wei Wang/Tech Lead",
  ]
createTime: 2026-01-09
categories: ["engineering"]
subCategories: ["Blockchain & Web3"]
tags: ["Solana", "Ethereum", "Smart Contract", "Solidity", "Anchor"]
landingPages: ["Blockchain-Onchain infra"]
heroColor: "#5E86E2"
thumb: "thumb.png"
thumb_h: "thumb-h.png"
intro: "A systematic introduction to the fundamental differences between Ethereum and Solana in account models, execution mechanisms, and fee systems."
---

## Overview

As the Solana ecosystem matures, more and more product owners are considering migrating their Ethereum (EVM) projects to Solana to gain higher performance, lower transaction costs, and a better user experience. Our company has extensive hands-on experience in this area, having led the migration and refactoring of multiple Ethereum protocols across various categories. We understand the complexity of migration across contract architecture, data models, transaction logic, and front-backend coordination, and we've developed a systematic methodology and set of best practices.

To help developers systematically master the methods and practices for migrating from Ethereum to Solana, we're launching a series of articles focused on three core layers—the smart contract layer, backend services, and frontend interactions. In this series, we'll share lessons we learned from real projects, including key caveats, best practices, and typical issues encountered during migration. Additionally, we'll share case studies that demonstrate an end-to-end migration approach and implementation path along with sample code to help you get started.

Through this series, we hope to help developers not only complete the migration, but also fully tap into Solana's high-performance potential and unique mechanisms to redesign protocols natively for Solana.

### Article Navigation

- **How to Migrate an Ethereum Protocol to Solana — Preamble**: A systematic introduction to the fundamental differences between Ethereum and Solana in account models, execution mechanisms, and fee systems.
- **How to Migrate an Ethereum Protocol to Solana — Contracts ( Part 1 )**: A focus on the core mindset shift and best practices for contract development from Ethereum to Solana.

This article approaches the topic from a **system design** perspective, summarizing the core differences between EVM and Solana across four dimensions: account model, execution model, transaction structure, and fee model. Understanding these differences provides a foundational shift in how developers reason about smart contract platforms at the architectural level.

## 1. Account Model: How Logic and Data Are Bound

### 1.1 EVM: Logic and State as a Single Unit

In EVM, there are two types of accounts:

- **EOA (Externally Owned Account)**:
  Controlled by a private key. It can send transactions and hold ETH, but does not contain any code.

- **Contract Account**:
  Contains executable logic and persistent storage. When a user is interacting with the contract, they simply specify its address.

EVM follows a "logic + state bundled together" model. Each contract not only defines function logic but also carries its own internal storage. Any changes to the contract's state must be performed through its own code. This design makes contract interaction straightforward; however, because logic and state are tightly coupled, it limits modularity and composability.

### 1.2 Solana: Decoupling Logic and Data

Solana completely separates execution logic from data storage:

- **Program Account** stores executable logic. It is immutable and does not hold business state.
- **Data Account** works as an independent data storage unit, explicitly defined and accessed by the program.
- **System Account / Sysvar Account** is used by the Solana runtime layer to store SOL balances and maintain chain state.

In this model, the program only defines how data should be operated on, while the actual data (account) must be passed explicitly during execution.

The same account may be shared across multiple programs. Different programs can jointly operate on the same piece of data.

This results in an account model that is highly composable—logic remains lightweight, data is flexible, and parallel execution becomes possible. However, it also requires developers to explicitly specify all data dependencies when constructing instructions.

For more details on account structure and access rules, refer to Solana's documentation: [Solana Docs: Accounts](https://solana.com/docs/core/accounts).

## 2. Execution Model: Serial vs Parallel

### 2.1 EVM: Single-Threaded Execution

EVM executes transactions in a serial manner. Each transaction is processed one after another, and the global state is updated before the next transaction can run.

Although contracts can call each other (via `call`, `delegatecall`, etc.), the overall execution still forms a linear execution chain.

This serial model ensures state consistency, but it naturally limits throughput.

### 2.2 Solana: Explicit Dependencies + Parallel Execution

In Solana, a transaction consists of multiple instructions. Each instruction invokes a program and explicitly declares the accounts it needs to read or write.

At runtime, Solana schedules execution based on account dependency rules:

- If two instructions access different accounts, then they can be executed in parallel.
- If two instructions read the same account, then they can still run in parallel.
- If two instructions access the same account and at least one writes, then they must be executed sequentially to maintain state consistency.

Thus, Solana's parallelism is not automatic but explicitly driven by account access patterns. This is the core reason Solana can achieve high throughput on a single chain.

## 3. Transaction Structure: Functional vs Compositional

### 3.1 EVM: Single-Target Invocation

In EVM, a transaction typically targets one contract and one function. The call relationship forms a tree structure where the outer transaction triggers internal contract calls, which then execute sequentially to completion.

### 3.2 Solana: Multi-Instruction Composition

A Solana transaction is more like a container of instructions.

Developers can bundle multiple Instructions in a single transaction, such as:

- Creating an account
- Initializing stored data
- Executing business logic operations

Each Instruction explicitly specifies the program it calls and the accounts it depends on.This structure provides much greater flexibility and enables composability across programs.

However, it also introduces more complexity in that developers must clearly understand account layouts and access patterns when constructing transactions.

For more details on composing transactions, see Solana's documentation: [Solana Docs: Transactions](https://solana.com/docs/core/transactions).

## 4. Fee Model: Gas vs Compute Units

### 4.1 EVM: Gas, Base Fee, and Priority Fee

In EVM, transaction fees are composed of the following components:

- **Base Fee**: Automatically adjusted by the protocol. This is the minimum required fee per unit of gas in the current block and is burned.
- **Priority Fee (Tip)**: Set by the user to incentivize validators to prioritize their transaction. This fee goes directly to the validator.
- **Max Fee**: The maximum gas price a user is willing to pay. Any unused portion is refunded.
- **Gas Limit**: The maximum amount of gas the transaction is allowed to consume.

**Fee Calculation Formula**:

```
Transaction Fee = Gas Used × (Base Fee + Priority Fee)
```

### 4.2 Solana: Compute Units, Priority Fee, and Rent

Solana's transaction cost structure consists of three main parts:

#### (1) Base Fee

- Each signature in a transaction costs 5,000 lamports (where lamports are the smallest unit of SOL, similar to wei in Ethereum).
- **Fee Allocation**:
  - 50% is burned
  - 50% is paid to the validator who processes the transaction
- Importantly, this fee is unrelated to transaction complexity.

#### (2) Prioritization Fee (Optional)

- This fee applies only when a Compute Unit Price is explicitly set.

  **Formula**:

  ```
  Prioritization Fee = Compute Units Consumed × Compute Unit Price
  ```

- **Compute Units (CU)** are Solana's core resource measurement unit, similar to gas in EVM.

  - Default limit per transaction: 200,000 CU
  - Compute Units themselves do not incur cost — fees arise only when `ComputeUnitPrice` is set.
  - **Purpose**: During network congestion, users can increase priority by paying more CU price.

- Developers can use the `ComputeBudgetProgram` to:

  - `setComputeUnitLimit`: Increase the CU (Compute Unit) limit, suitable for complex contract calls.
  - `setComputeUnitPrice`: Set the prioritization fee, similar to the Gas Price in EVM.

#### (3) Rent (Storage Cost)

On Solana, on-chain accounts occupy storage space and storage resources are limited. To prevent users from creating excessive unused accounts that waste blockchain state, Solana implements a Rent mechanism.

- If an account holds a sufficient SOL deposit, it avoids periodic rent deductions; this state is called **Rent-exempt**.

- The minimum balance for rent exemption is calculated as:

  ```
  rent_exempt_minimum = lamports_per_byte_year × data_len × exemption_threshold
  ```

  where:

  - `lamports_per_byte_year` = rent per byte per year
  - `exemption_threshold` = number of years exempt from rent (default: 2 years)

- If an account balance exceeds the rent-exempt threshold, the account will not be reclaimed.
- If the balance falls below the threshold, rent must be paid, reducing the balance. If the balance is depleted, the account is deleted.
- The required minimum balance is determined programmatically using `getMinimumBalanceForRentExemption`.
- When an account is closed, the system automatically refunds the rent deposit (the previously frozen SOL), freeing the occupied storage space.

For more details on Rent calculations, see Solana's documentation: [Solana Docs: Rent](https://docs.anza.xyz/implemented-proposals/rent).

## 5. Core Conceptual Foundations of Solana

Most of this article compares EVM-compatible chains, which share similar account models, execution models, transaction structure, and fee models. Solana, however, operates differently enough that understanding its architecture first makes the comparison more meaningful. This section introduces the key concepts that define Solana.

### 5.1 Program

A Program in Solana plays a role similar to a smart contract in the EVM, but it is significantly more lightweight:

- It contains only execution logic, without its own persistent storage.
- All state must be explicitly passed in through external Data Accounts during instruction execution.
- The most commonly used development framework is Anchor, which automates serialization, account validation, and other boilerplate tasks.

### 5.2 Account

In Solana, all persistent states are stored in Accounts. Any data that needs to be retained across transactions must be stored in an Account.

Every Account contains the following fields:

| Field        | Type / Unit                    | Description                                                                                                                               |
| ------------ | ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `lamports`   | Integer (1 SOL = 10⁹ lamports) | Balance held by the account, used to pay transaction fees or maintain rent-exempt status.                                                 |
| `owner`      | Public Key (Program ID)        | The program that "owns" the account. Only this program can modify the account's data or withdraw lamports.                                |
| `executable` | Boolean                        | Indicates whether the account is a Program (true) or a Data Account (false).                                                              |
| `data`       | Byte Array                     | The raw stored data. Its layout and interpretation are defined by the owning program.                                                     |
| `rent_epoch` | Integer                        | The next epoch at which rent is due. Accounts with insufficient balance may be reclaimed. If closed, the stored rent deposit is refunded. |

In simple terms:

**Account in Solana ≈ Storage in an EVM contract**

### 5.3 PDA (Program Derived Address)

A PDA (Program Derived Address) is one of the core concepts in Solana understood as a deterministic, program-controlled address. Unlike regular wallet addresses, a PDA is not derived from a private key and therefore has no signing capability on its own. Instead, it can act as a signer through a specific Program's logic, enabling secure ownership and management of data accounts.

A PDA Account serves a role similar to a storage slot in EVM, used to persist contract state.

#### Address Derivation

The generation of a PDA is deterministic and depends on three factors:

1. **Seeds (optional)**

   - Developer-defined inputs (e.g., strings, numbers, wallet addresses, or other account addresses).
   - Different seed combinations produce different PDAs.

2. **Bump Seed**

   - A one-byte value appended to the seeds.
   - Ensures the generated address lies off the Ed25519 curve (i.e., cannot correspond to a private key).
   - The runtime searches bump from 255 downward until a valid PDA is found.

3. **Program ID**
   - The address of the program that owns the PDA.
   - The Program ID implicitly acts as the signing authority for the PDA.

Given the same seeds + bump + Program ID, the resulting PDA is always identical, meaning both on-chain programs and front-end clients can compute it without needing to store it anywhere.

#### Key Properties of PDA (Program Derived Address):

Program Derived Addresses (PDAs) are a cornerstone of Solana's account model. Unlike Ethereum's smart contracts, which are inherently associated with an externally owned account, Solana separates program logic from account ownership. PDAs allow programs to securely manage accounts, enforce deterministic access control, and authorize actions without relying on user private keys. Understanding their properties is essential for building secure, composable, and predictable on-chain programs.

- **Non-public-key nature**

  Although SDKs like `web3.js` represent PDAs using the `PublicKey` type, a PDA is not a traditional public key and has no corresponding private key.

  - PDAs exist off the Ed25519 curve, so they cannot be directly controlled by any private key.

- **Uniqueness**

  - A PDA is bound to a specific Program, ensuring no address conflicts.

  - PDAs generated by different Programs do not interfere with each other.

- **Can act as a signer**

  - In certain cases, a Program can use runtime APIs to allow a PDA to act as a "virtual signer" for a transaction. This enables secure authorization of data modifications without exposing any private key.

PDAs are central to Solana's implementation of deterministic storage, keyless signing, and secure data access. They enable developers to organize on-chain data structures in a predictable, composable, and pre-deployment-free manner, distinguishing Solana from EVM.

Furthermore, PDAs represent Solana's native account abstraction (AA): the essence of AA is that "accounts are controlled by code", which Solana implements via predictable PDA addresses and programmatic signing.

For the complete rules on PDA generation, refer to Solana's documentation: [Solana Docs: PDA](https://solana.com/docs/core/pda).

### 5.4 SPL (Solana Program Library)

The Solana Program Library (SPL) is a collection of standard, audited on-chain programs maintained by the Solana Foundation. Commonly used modules include:

- **Token Program**, which manages the creation, minting, transfer, and burning of fungible tokens and NFTs.
- **Associated Token Program**, which generates and manages Associated Token Accounts (ATA), ensuring deterministic and standard token account ownership.
- **Memo Program**, which allows adding human-readable text notes in transactions for logging or on-chain metadata.

SPL is a standardized collection of smart contracts officially provided by Solana, analogous to the ERC standards (ERC-20, ERC-721) and the OpenZeppelin library in the EVM ecosystem.

Source code and documentation are available on the [official SPL repository](https://github.com/solana-labs/solana-program-library).

### 5.5 ATA (Associated Token Account)

In Solana, a single wallet could have multiple token accounts for the same token, which can lead to difficulties in tracking, leading to fragmented funds, and potential misuse. The Associated Token Account (ATA) solves this by deterministically deriving a unique, predictable default token account from the combination of the owner's address + Mint via the Associated Token Program. Essentially, this is a token account managed by the SPL Token Program with a PDA address, which anyone can compute locally. On the front-end, before transferring or minting, the ATA is derived and created idempotently using `getAssociatedTokenAddressSync`. If the ATA doesn't exist, it is created (with a small SOL rent); if the ATA exists, it is used directly. This eliminates the need to search or select accounts, ensures funds consolidate into a single address, and makes interactions simpler, safer, and compliant with ecosystem standards.

In Solana, ATA functions similarly to how ERC-20 or ERC-721 contracts track balances internally in EVM. In the EVM model, each token contract maintains a centralized ledger using a `mapping(address => uint256)` to record all addresses and balances. Solana, however, uses a distributed account-based model: each user has an independent on-chain account that stores the token balance and related information.

### 5.6 IDL (Interface Description Language)

The Interface Description Language (IDL) serves as the "interface specification" for a Solana program, functioning similarly to the ABI in EVM. It describes:

- Program instructions
- Parameter types
- Return values / errors
- Events
- The structure and constraints of relevant accounts

Using Anchor, developers can generate an IDL file that reflects the program's structure, simplifying client-side interaction with Solana programs. By combining the IDL with Anchor's TypeScript library [@coral-xyz/anchor](https://github.com/solana-foundation/anchor/tree/0e5285aecdf410fa0779b7cd09a47f235882c156/ts/packages/anchor), constructing instructions and transactions becomes much easier.

Ideally, you also use TypeScript types generated from the IDL, which makes program interaction more convenient. After building a program, these types can be found in the `/target/types` folder. The demo we provide below uses this approach.

#### How to obtain an IDL:

- **Solana Explorer**: If you know the programId (e.g., `time2Z2SCnn3qYg3ULKVtdkh8YmZ5jFdKicnA1W2YnJ`), you can directly access the Explorer [here](https://explorer.solana.com/address/time2Z2SCnn3qYg3ULKVtdkh8YmZ5jFdKicnA1W2YnJ/idl) to find and copy the corresponding IDL.
- **Anchor Local Build**: If you have the program source code, run `anchor build`. This will generate a JSON-format IDL file in `/target/idl` and corresponding TypeScript types in `/target/types`.

These mechanisms together form Solana's account-centric architecture, where logic and data are predictable, composable, and parallelizable—a fundamental difference from EVM's contract-centric architecture.

More about IDL: [Program IDL File](https://www.anchor-lang.com/docs/basics/idl)

## 6. Summary: Comparing the Two Paradigms

| Comparison Dimension  | EVM                                        | Solana                           |
| --------------------- | ------------------------------------------ | -------------------------------- |
| Logic & Data Relation | Contract cohesion (logic + storage)        | Program and accounts separated   |
| Execution Model       | Serial                                     | Explicit dependencies + parallel |
| State Management      | Implicit (via internal contract variables) | Explicit (passed-in accounts)    |
| Call Structure        | Single-target, functional                  | Multi-instruction, composable    |
| Fee Model             | Gas-based                                  | Compute Units + Rent             |
| Architectural Style   | Integrated, encapsulated                   | Composable, modular              |

EVM resembles a state machine running around each contract. Solana, in contrast, is more like a distributed operating system, executing logic in parallel based on account dependencies. The former emphasizes encapsulation, the latter emphasizes composition. Understanding these differences is key to grasping the underlying operation of Web3 platforms.

This article is the first in a series. Subsequent articles will delve deeper into migrating from Ethereum to Solana. If you are interested in cross-chain development or migrating from the EVM ecosystem to Solana, stay tuned for the updates!

## References

- [Solana Account](https://solana.com/docs/core/accounts)
- [Solana Transaction](https://solana.com/docs/core/transactions)
- [Solana PDA](https://solana.com/docs/core/pda)
- [Moving from Ethereum Development to Solana](https://solana.com/developers/evm-to-svm)
- [Anchor](https://www.anchor-lang.com/)
