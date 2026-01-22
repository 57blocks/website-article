---
published: true
title: "How to Migrate an Ethereum Protocol to Solana — Contracts (Part 1)"
author: ["Jimmy Zhao / Fullstack Engineer", "Bin Li / Tech Lead"]
createTime: 2026-01-10
categories: ["engineering"]
tags: ["Solana", "Ethereum", "Smart Contract", "Solidity", "Anchor"]
landingPages: ["Blockchain-Onchain infra"]
thumb: "./thumb.png"
thumb_h: "./thumb_h.png"
intro: "A deep dive into the core mindset shift and best practices when moving contracts from Ethereum to Solana."
---

## Article Overview

As the Solana ecosystem matures, more Ethereum (EVM) protocol teams are exploring migration to Solana to achieve higher throughput, lower transaction costs, and improved user experience. Through leading and executing multiple real-world Ethereum-to-Solana migrations, we've accumulated hands-on experience across smart contract architecture, data models, transaction design, and full-stack coordination.

This article is part of a broader series on migrating Ethereum protocols to Solana, where we break the process down into three core layers: smart contracts, backend services, and frontend interactions. If you're new to the series, we recommend starting with "How to Migrate an Ethereum Protocol to Solana — Preamble," which introduces the fundamental architectural differences between the two ecosystems.

In this article, we focus specifically on the smart contract layer. Rather than treating migration as a simple language switch from Solidity to Rust, we examine the deeper mindset shifts required when moving from Ethereum's contract-centric model to Solana's account-centric design. Using concrete examples and real production patterns, we'll walk through the most important conceptual changes, common pitfalls, and best practices that Ethereum developers need to understand to build secure and efficient Solana programs.

#### Article Navigation

- How to Migrate an Ethereum Protocol to Solana — Preamble: A systematic introduction to the fundamental differences between Ethereum and Solana in account models, execution mechanisms, and fee systems.
- How to Migrate an Ethereum Protocol to Solana — Contracts (Part 1): A focus on the core mindset shift and best practices for contract development from Ethereum to Solana.

---

Solana rose in popularity and matured quickly because its high performance and low costs attracted a surge of developer and user attention. Meanwhile, Ethereum (EVM) and EVM-compatible chains had massive ecosystems but faced challenges like limited scalability and high transaction fees. As a result, more Web3 developers have been turning to Solana for its improved developer and user experiences, making the migration from Ethereum to Solana a prominent trend. So, how do we effectively port the smart contracts we've mastered on Ethereum to the Solana platform? Many developers initially thought that they would only need to reprogram apps using Rust rather than Solidity, but they soon discovered that the real migration challenge rested in the fundamental differences of Solana's underlying architecture. This article aims to help experienced Ethereum developers complete a critical mental model shift so they can efficiently and securely reimplement existing contract logic the Solana way.

## The Core Mindset Shift

When migrating from Ethereum to Solana, your first task is to shift your mindset from a contract-centric model to an account-centric one. You may want to read "How to Migrate an Ethereum Protocol to Solana — Preamble," for additional background.

In this article, we will address the core mental model for Solana smart contract development. Three key conceptual shifts to help you move an app from EVM to Solana contract development include gaining a new understanding of the relationship between accounts and programs, moving from Token accounts and Cross-Program Invocations (CPI), and using explicitly declared dependencies in calls.

To make these concepts concrete, we included code examples that reference a complete, open-source Staking migration project. We'll dissect the project in the final section, but before that, we'll frequently use its code snippets to support each concept we discuss.

### The Account Model

On Ethereum and EVM-compatible chains, smart contracts follow a monolithic design where a contract is both the carrier of code and the container of state, tightly coupling execution logic and storage. For example, a standard ERC20 token contract not only contains functions like `transfer` and `approve`, but also a `mapping` to store balances for all users. This design is similar to object-oriented programming's class instances (Object), where methods and data are encapsulated in a single entity, forming a complete, self-contained functional unit. Here's a concrete Solidity example:

```solidity
// evm-staking/src/Staking.sol
contract Staking {
    // Staking and reward tokens are state variables
    IERC20 public stakingToken;
    IERC20 public rewardToken;

    // User stake information is stored in a mapping
    mapping(address => StakeInfo) public stakes;
    uint256 public totalStaked;

    struct StakeInfo {
        uint256 amount;
        int256 rewardDebt;
        uint256 claimed;
    }

    // ... business logic like stake() and unstake()
}
```

In this example, the `stakingToken` and `rewardToken` addresses, and all users' Staking data `stakes`, are stored directly in the internal state of the `Staking` contract.

Solana takes a completely different approach to its account model, by fully separating code and data. On Solana, **programs** contain only logic, are stateless, and do not store business data, while **accounts** only store data. When executing a transaction, you must explicitly tell the **program** which **accounts** to operate. As a simpler explanation, think of a **program** as an executable and **accounts** as the data files it reads and writes, stores and manages separately.

Here’s the corresponding Solana (Anchor) implementation:

```rust
use anchor_lang::prelude::*;

// The program itself is stateless.
#[program]
pub mod staking {
    pub fn stake(ctx: Context<Stake>, amount: u64) -> Result<()> {
        // Business logic operates on accounts passed via the context.
        // The context `ctx` contains all necessary accounts,
        // such as `GlobalState` and `UserStakeInfo`, defined in the `Stake` struct below.
        let state = &mut ctx.accounts.state;
        let user_info = &mut ctx.accounts.user_stake_info;
        state.total_staked += amount;
        user_info.amount += amount;
        // ...
        Ok(())
    }
    // ... other instructions like unstake()
}

// The `Stake` context struct, defining all accounts for the `stake` instruction.
#[derive(Accounts)]
pub struct Stake<'info> {
    #[account(mut)]
    pub state: Account<'info, GlobalState>,
    #[account(mut)]
    pub user_stake_info: Account<'info, UserStakeInfo>,
    // ... other necessary accounts
}

// State is defined in separate account structs.
#[account]
pub struct GlobalState {
    pub total_staked: u64,
    // ... other global state
}

#[account]
pub struct UserStakeInfo {
    pub amount: u64,
    // ... other user state
}
```

Here, the `staking` program is stateless and holds no data. All data—both global `GlobalState` and per-user `UserStakeInfo`—are defined in separate `#[account]` structs. The program receives these accounts through the `Context` object (typed by the `Stake` struct), and then operates on them.

This design's fundamental purpose is to enable large-scale [parallel processing](https://medium.com/solana-labs/sealevel-parallel-processing-thousands-of-smart-contracts-d814b378192). Because code and data are separated, Solana transactions will declare all accounts they will access ahead of execution and specify whether each account is read-only or writable. This allows the runtime to build a dependency graph and schedule transactions efficiently. If two transactions touch completely unrelated accounts—or both only read the same account—they can safely run in parallel. Only when one transaction needs to write to an account, other transactions that access that account (read or write) will be temporarily blocked and executed sequentially. With this fine-grained scheduling, Solana maximizes multi-core utilization to process many non-interfering transactions concurrently. This is a key element to its high throughput and low latency.

### Token Standards

Differences in the account model appear most directly in token standards. Using our Staking contract example, let's compare it across the two platforms. In the ERC20 standard on Ethereum, token state is managed by a centralized token contract, and application contracts indirectly manipulate user balances by calling that token contract's functions.

```solidity
// evm-staking/src/Staking.sol
contract Staking {
    IERC20 public stakingToken;
    // ...

    function stake(uint256 amount) external {
        // The Staking contract calls the token contract's transferFrom
        // to move funds from the user to itself.
        stakingToken.transferFrom(msg.sender, address(this), amount);
        // ...
    }
}
```

In this model, a user’s token balance is just an entry in a `mapping` inside the `stakingToken` contract, and `transfer` means mutating two values in that mapping.

Solana's SPL Token standard works differently. There is a shared, official `Token Program` for all tokens. Users’ tokens are not stored in a centralized contract but in user-owned, independent token accounts. To operate on tokens, our staking program must receive these token accounts as inputs.

```rust
// solana-staking/programs/solana-staking/src/instructions/stake.rs
// The context for the stake instruction requires specific token accounts.
#[derive(Accounts)]
pub struct Stake<'info> {
    #[account(mut)]
    pub user_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub staking_vault: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
    // ...
}

// The instruction itself commands the Token Program to perform the transfer.
pub fn stake(ctx: Context<Stake>, amount: u64) -> Result<()> {
    token::transfer(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.user_token_account.to_account_info(),
                to: ctx.accounts.staking_vault.to_account_info(),
                authority: ctx.accounts.user.to_account_info(),
            }
        ),
        amount
    )?;
    // ...
    Ok(())
}
```

Here, Staking uses a Cross-Program Invocation (CPI) to call the official token program's transfer instruction to move funds between the user's token account and the program's vault token account—clearly illustrating the separation between data (token accounts) and logic (Token Program).

This fundamental difference also explains the common confusion new Solana users often see: the wallet prompting a user or programmer to create an account before receiving a new token. Before receiving USDC, your Solana wallet must first create a token account to hold USDC, almost like setting up a dedicated mini-vault. Whereas on Ethereum, your wallet address can "receive" any ERC20 token because "receiving" simply means another entry is recorded inside the token contract's internal ledger; no preparation is needed on your end.

### Contract Calls

Differences in account models lead to huge differences in how you interact with contracts (programs). In Solidity, when calling a function, the EVM prepares contextual information behind the scenes—most notably `msg.sender`. Developers don't need to specify the caller in parameters; the EVM handles it implicitly, making function calls look clean.

Here is an Ethereum Call Example (Foundry Test) that illustrates how this works.

```solidity
// evm-staking/test/Staking.t.sol
function testStake() public {
    uint256 stakeAmount = 1000 * 10 ** 18;

    // The user's address is implicitly passed as msg.sender
    vm.startPrank(user1);
    myToken.approve(address(staking), stakeAmount);
    staking.stake(stakeAmount);
    vm.stopPrank();

    (uint256 stakedAmount, ,) = staking.getStakeInfo(user1);
    assertEq(stakedAmount, stakeAmount);
    assertEq(staking.totalStaked(), stakeAmount);
}
```

In Foundry Test above, `vm.startPrank(user1)` sets `msg.sender` for subsequent calls to `user1`. When calling `staking.stake(stakeAmount)`, we only pass the business parameter `amount`.

On Solana, the program has no implicit context about the caller or surrounding state. The program needs every piece of information—including identifying who the caller is and which accounts it must read or write to—explicitly provided in the transaction instruction. These accounts are packed into a `Context` object and passed as parameters. This design aligns with parallel processing: the runtime can only determine safe parallel execution if each transaction lists all accounts it will access.

Below is the Solana Call Example (TypeScript Test) for reference:

```typescript
// solana-staking/tests/solana-staking.test.ts
// Helper function to simplify the call
async function stakeTokens(
  user: Keypair,
  userSigner: any,
  stakingToken: PublicKey,
  rewardToken: PublicKey,
  amount: bigint
) {
  const userStakePda = getUserStakePda(statePda, user.publicKey);

  // All required accounts must be explicitly passed.
  const stakeInstruction = programClient.getStakeInstruction({
    user: userSigner,
    state: address(statePda.toBase58()),
    userStakeInfo: address(userStakePda.toBase58()),
    userTokenAccount: address(stakingToken.toBase58()),
    stakingVault: address(stakingVaultPda.toBase58()),
    // ... and other accounts
    amount: amount,
  });

  return await sendTransaction(provider, stakeInstruction, user);
}
```

In this TypeScript Test, calling the `stake` instruction requires a large account object: `user` (signer), `state` (global state account), `userStakeInfo` (user staking data account), `userTokenAccount` (the user's token account), `stakingVault` (the program's vault), etc. While this makes the client call more verbose, it brings transparency and safety. Before the transaction is sent, the client code explicitly defines all accounts included in the transaction. There are no hidden contextual dependencies in a Solana transaction.

Additionally, on Ethereum, upgrading a contract often requires changing client code to point to a new contract address. On Solana, you simply deploy new program code to the same program ID, achieving seamless upgrades. All business data remains untouched in their accounts because data and logic are decoupled. Since the program address doesn’t change, client code remains compatible.

If you want deeper architectural context for the code patterns in this article, revisit "How to Migrate an Ethereum Protocol to Solana — Preamble," which provides a more systematic conceptual background.

## Tooling Comparison

To put these ideas into practice, you may want to get comfortable with a different, ecosystem-specific toolchain. From language to standard libraries, Solana's ecosystem differs significantly from Ethereum's ecosystem. The table below summarizes key differences to help you build a new understanding of the differences quickly.

| **Domain**                | **Ethereum Ecosystem**                | **Solana Ecosystem**                | **Key Notes**                                                                                                                                                                                                                                                                                                                                                                                       |
| :------------------------ | :------------------------------------ | :---------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Frameworks**            | Hardhat / Foundry (Solidity)          | Anchor (Rust)                       | In the Ethereum ecosystem, Hardhat and Foundry are widely used smart contract development tools. Anchor is the de facto standard for Solana development; it uses powerful macros to greatly simplify the complexity of Solana program development.                                                                                                                                                  |
| **Interface Standard**    | ABI (Application Binary Interface)    | IDL (Interface Definition Language) | Anchor automatically generates an IDL from your program code, similar to the ABI concept on Ethereum—ABI is Ethereum’s contract interaction standard, and the Solidity compiler automatically generates ABI files describing function/parameter/return binary encodings. Clients can use these IDL or ABI files to interact with your program without needing to understand the underlying implementation.   |
| **Standard Library**      | OpenZeppelin                          | SPL (Solana Program Library)        | OpenZeppelin is an import-and-inherit code library, whereas SPL is a set of reusable standard programs already deployed on-chain. You interact with them via Cross-Program Invocation (CPI) instead of copying code into your project.                                                                                                                                                              |
| **Contract Verification** | Upload and verify source on Etherscan | Submit source for Verified Build    | Solana supports “Verified Builds,” conceptually similar to Ethereum. Developers submit source code, which is compiled in a deterministic environment; the build artifact’s hash is compared against on-chain bytecode. This ensures the source matches the on-chain program—not just validating the IDL interface.                                                                                  |
| **Network RPC**           | Infura, Alchemy, QuickNode            | Helius, Alchemy, QuickNode          | Both ecosystems have top-tier RPC providers; only a few (like QuickNode) are multi-chain. Solana's high throughput has also led to specialized providers like Helius to offer enhanced Solana-first APIs.                                                                                                                                                                                         |
| **Explorers**             | Etherscan, Blockscout                 | Solscan, Solana Explorer, X-Ray     | The Ethereum ecosystem has powerful tools like Tenderly for deep transaction simulation and debugging. In the Solana ecosystem, tools like Helius (product X-Ray) provide similar functionality. Due to Solana’s parallel transaction model, these tools focus more on visualizing value flows between accounts and CPI call chains to help developers understand complex instruction interactions. |

From this comparison, a clear pattern emerges: Ethereum development supports ideas like inheritance and extension (e.g., inheriting OpenZeppelin contracts), while Solana development supports composition and interaction (via CPI with on-chain SPL programs).

We recommend that newcomers to Solana use the Anchor framework whenever possible. Unlike Ethereum's Hardhat/Foundry, which focuses on the external development flow (tests, deployment, scripting), Anchor affects how program code is written and runs. Its Macros and constraints dramatically simplify the process of writing Solana programs by handling a lot of tedious and error-prone low-level safety checks and data serialization. If you master Anchor, you'll master efficient, safe business logic on Solana.

## Solana Development Best Practices

Once you understand Solana's tooling differences, you still need to apply them with Solana's design philosophy in mind. Simply swapping Solidity for Rust isn't enough—true efficiency and account security come from following best practices distilled by the ecosystem as outlined in the following sections.

### Embrace the Anchor Framework

There are two main approaches to Solana program development: Native and Anchor-based.

Native development requires direct interaction with Solana's low-level libraries, meaning you must manually serialize and deserialize account data and write a lot of code to verify account ownership, signer permissions, mutability, and similar functions. While this offers maximum flexibility, it's complex, verbose, and prone to security pitfalls.

Solana's official recommendation, meant specifically for developers migrating from Ethereum, is to choose Anchor. Anchor leverages Rust macros to simplify development, enhance safety, and ultimately automate the complex parts of native development.

Here's a simple `initialize` instruction for creating a new global state account using Anchor. Once you declare accounts and constraints, the framework handles validation and initialization for you.

```rust
// solana-staking/programs/solana-staking/src/instructions/initialize.rs
#[program]
pub mod staking {
    pub fn initialize_handler(ctx: Context<Initialize>, reward_per_second: u64) -> Result<()> {
        // Business logic is clean and focused.
        let state = &mut ctx.accounts.state;
        state.reward_per_second = reward_per_second;
        state.admin = ctx.accounts.admin.key();
        // ...
        Ok(())
    }
}

// Define accounts and constraints declaratively.
#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,
    // Anchor handles the creation and rent payment for this account.
    #[account(init, payer = admin, space = 8 + GlobalState::INIT_SPACE)]
    pub state: Account<'info, GlobalState>,
    pub system_program: Program<'info, System>,
}

#[account]
pub struct GlobalState {
    pub admin: Pubkey,
    pub reward_per_second: u64,
    // ...
}
```

To better understand what Anchor abstracts, let's examine a functionally equivalent implementation using the Native approach.

A functionally equivalent implementation using the Native approach requires you to handle all the details manually:

```rust
// A functionally equivalent implementation in native Rust.
use solana_program::{
    account_info::{next_account_info, AccountInfo},
    entrypoint,
    entrypoint::ProgramResult,
    pubkey::Pubkey,
};
use borsh::{BorshDeserialize, BorshSerialize};

// The single entrypoint for the program.
entrypoint!(process_instruction);

pub fn process_instruction(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    instruction_data: &[u8],
) -> ProgramResult {
    // 1. Manually parse and validate accounts from the raw slice.
    let accounts_iter = &mut accounts.iter();
    let state_account = next_account_info(accounts_iter)?;
    let authority = next_account_info(accounts_iter)?;
    // ... must manually check that authority is a signer, state is writable, etc.

    // 2. Manually create the state account via a Cross-Program Invocation (CPI).
    //    This requires calculating space, rent, and building the instruction.
    //    (This is a complex, multi-line operation in real code).

    // 3. Manually deserialize instruction data to get the `reward_rate`.
    let reward_rate = u64::try_from_slice(&instruction_data)?;

    // 4. Manually serialize the new state and write to the account's data buffer.
    let state = State { authority: *authority.key, reward_rate };
    state.serialize(&mut &mut state_account.data.borrow_mut()[..])?;

    Ok(())
}
```

Anchor abstracts a lot of native boilerplate code (account checks, CPI calls, data serialization) into concise, safer macros. This allows developers to focus on determining and defining business logic, significantly improving productivity and readability. In the examples above, Anchor removes the need for manual account parsing, signer and mutability checks, explicit account creation via CPI, and byte-level (de)serialization, allowing the instruction handler to focus almost entirely on business logic.

Of course, convenience isn't free. Anchor's abstraction layer, including its auto-inserted safety checks, tends to consume more Compute Units (CU) than highly optimized native code, and Anchor-generated bytecode is usually larger than equivalent native programs. Although Solana program accounts can be up to 10 MB in size, which appears fairly small, the complexity of the protocols and program will impact performance. To truly excel on Solana and solve complex issues or do deep optimizations, you should still understand the native APIs behind Anchor's macros and how the abstractions and underlying mechanisms work.

For most projects, Anchor's gains in development speed and safety far outweigh its performance overhead. But to master Solana, you'll want deeper knowledge of its lower-level mechanisms.

### Account Lifecycle and Rent

On Ethereum, you pay for contract storage once at deployment, and it persists forever. Solana, however, uses a Rent mechanism to manage on-chain storage.

On Solana, all accounts (data or program accounts) must pay rent to occupy on-chain storage. This rent mechanism prevents unbounded state growth and compensates validators for storing data. In practice, to avoid accounts being reclaimed when their balance is exhausted, the standard approach is to deposit enough SOL (in lamports) upon creation to cover about two years of rent. This action makes the account **rent-exempt** and, effectively, permanently allocated. When an account is closed, this pre-deposited lamports balance is fully refunded.

This introduces an **account lifecycle** concept, where developers proactively manage creation, use, and destruction. Many major Solana projects follow this pattern. To explain this in greater depth, we'll use [Mango Markets v4](https://github.com/blockworks-foundation/mango-v4) as an example. Mango Markets is a Solana-based decentralized trading, lending, and leverage platform, whose program design exemplifies account lifecycle management.

**Creation & Initialization**

When a user first opens an account in Mango v4, the program creates a new `MangoAccount`. This process is defined in the `AccountCreate` context, where the `#[account(init, ...)]` constraint is key to creation and rent payment.

```rust
#[derive(Accounts)]
pub struct AccountCreate<'info> {
    // ... other accounts
    #[account(
        init,
        seeds = [b"MangoAccount".as_ref(), group.key().as_ref(), owner.key().as_ref(), &account_num.to_le_bytes()],
        bump,
        payer = payer,
        space = MangoAccount::space(token_count, serum3_count, perp_count, perp_oo_count, 0),
    )]
    pub account: AccountLoader<'info, MangoAccountFixed>,
    pub owner: Signer<'info>,

    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
}
```

- `init`: tells Anchor to create the `account`.
- `seeds = [...]` and `bump`: indicate `MangoAccount` is a PDA, derived from the protocol’s `group`, `owner`, and `account_num`.
- `payer = payer`: specifies the payer (often the owner) to fund rent-exemption on creation.
- `space = ...`: defines the allocated storage size, computed dynamically by a function.

For more details, see [Mango Markets v4 source](https://github.com/blockworks-foundation/mango-v4/blob/dev/programs/mango-v4/src/accounts_ix/account_create.rs).

**Closing & Destruction**

When an account is no longer needed (e.g., a user clears and closes their Mango trading account), it can be closed to recover the pre-deposited rent. In Mango v4, the `AccountClose` context uses the `close` constraint:

```rust
#[derive(Accounts)]
pub struct AccountClose<'info> {
    // ... other accounts
    #[account(
        mut,
        has_one = group,
        has_one = owner,
        constraint = account.load()?.is_operational() @ MangoError::AccountIsFrozen,
        close = sol_destination
    )]
    pub account: AccountLoader<'info, MangoAccountFixed>,
    pub owner: Signer<'info>,

    #[account(mut)]
    pub sol_destination: UncheckedAccount<'info>,
}
```

- `close = sol_destination`: this is crucial to tell Anchor to automatically close `account` after successful execution and refund all its lamports (rent deposit) to `sol_destination`. This explicit create–destroy model is central to resource management in Solana programs.

For more details, see [Mango Markets v4 source](https://github.com/blockworks-foundation/mango-v4/blob/dev/programs/mango-v4/src/accounts_ix/account_close.rs).

Our `solana-staking` example also follows this lifecycle model. The `initialize` instruction creates global state and vault accounts; the `stake` instruction uses `init` to create a user info account on first stake; and in `unstake`, if the user’s balance returns to zero, the program uses `close` to destroy their user info account and refund rent. See the repository here: [solana-staking](https://github.com/57blocks/evm-to-solana/tree/main/contract/solana-staking).

### Program Derived Addresses (PDA)

When managing account lifecycles, Program Derived Addresses (PDA) are central to Solana's security model. A PDA is deterministically derived from a program ID and a set of seeds, has no private key, and only the deriving program can "sign" for it. PDAs let programs own/control other accounts, making them ideal as secure data stores, token vaults (Vault), or authority hubs. In an instruction, Anchor recomputes and verifies a PDA's address using the provided seeds and a `bump` (a nonce ensuring the address lies off the elliptic curve), preventing clients from passing forged accounts, which is critical for security. By setting a PDA as another account's `authority`, you can build complex, program-controlled permission systems, which is a common pattern in Solana program design.

Here's how a PDA is defined and used. In our staking program, the `UserStakeInfo` account is a PDA that stores each user's personal staking information.

```rust
// solana-staking/programs/solana-staking/src/instructions/stake.rs
// The Stake context defines how the user_stake_info PDA is derived.
#[derive(Accounts)]
pub struct Stake<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    // The 'seeds' and 'bump' constraints define this as a PDA.
    #[account(
        init_if_needed,
        payer = user,
        space = 8 + UserStakeInfo::INIT_SPACE,
        seeds = [STAKE_SEED, state.key().as_ref(), user.key().as_ref()],
        bump
    )]
    pub user_stake_info: Box<Account<'info, UserStakeInfo>>,
    // ... other accounts
}

// The data structure for the PDA account.
#[account]
#[derive(InitSpace)]
pub struct UserStakeInfo {
    pub owner: Pubkey,
    pub amount: u64,
    pub reward_debt: i128,
    pub claimed: u64,
    pub bump: u8,
}
```

- `seeds = [STAKE_SEED, state.key().as_ref(), user.key().as_ref()]`: the core PDA definition. It derives `user_stake_info` from a constant `STAKE_SEED`, the global state account `state.key()`, and the user public key `user.key()`. This ensures a unique, predictable `UserStakeInfo` address per user per staking pool.
- `bump`: Anchor finds a `bump` and stores it in the PDA’s data. Future instructions use the stored `bump` to re-derive and verify the address, ensuring `user_stake_info` is legitimate, not forged.
- `init_if_needed`: a convenience constraint that auto-creates this PDA on a user’s first stake. It’s feature-gated in Anchor because it can introduce reinitialization risks, so avoid it when possible.

This gives each user a unique, program-controlled data account, showcasing the power of PDAs.

### Program Architecture: Prefer a Single Program

In Ethereum, developers often build composable mini-contracts, each handling a distinct function. On Solana, a different architectural pattern is generally recommended to use where you consolidate tightly related business logic into a relatively complete single program.

There are two reasons to do this. First, the complexity of CPI (Cross-Program Invocation) makes fine-grained contract decomposition less practical. Second, Ethereum historically enforces a contract bytecode size limit (about 24,576 bytes / 24 KB), pushing developers to split logic. On Ethereum, calling another contract is straightforward, with context like `msg.sender` implicitly passed. On Solana, each CPI requires the caller to manually construct and pass a complete account list required by the callee's instruction. This is verbose, error-prone (e.g., missing or misordered accounts), and increases transaction size and complexity. Here's a real CPI example in our staking program calling the official Token Program to transfer tokens.

```rust
// solana-staking/programs/solana-staking/src/instructions/stake.rs
// Transfer staking tokens from user to vault
let cpi_accounts = Transfer {
    from: ctx.accounts.user_token_account.to_account_info(),
    to: ctx.accounts.staking_vault.to_account_info(),
    authority: ctx.accounts.user.to_account_info(),
};
let cpi_program = ctx.accounts.token_program.to_account_info();
let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
token::transfer(cpi_ctx, amount)?;
```

To complete this transfer, we construct a `Transfer` struct with `from` (user token account), `to` (program vault), and `authority` (signer) accounts, then bundle it with the `token_program` into a `CpiContext` before calling `token::transfer`.

Now imagine splitting staking logic across multiple programs—one for user stake data and another to update `total_staked`. A simple `stake` could require multiple CPIs, each with its own verbose account context, greatly increasing complexity, CU usage, and the chance of mistakes.

So, to improve developer efficiency and maintainability, best practice is to implement an app or protocol's core features (e.g., a DeFi protocol's staking, lending, reward calculation) inside a single program. Use CPI only to interact with standardized external programs like the SPL Token Program. This monolithic pattern reduces CPI count, simplifies clients, and keeps logic cohesive, which is easier to audit and manage.

### Fee Model

Solana's fee model shares some conceptual similarities with Ethereum but differs in implementation. Ethereum uses Gas, with transactions declaring a Gas Limit and paying based on Gas Used × price. Since EIP-1559, fees comprise Base Fee (auto-adjusts with congestion) and Priority Fee, so total cost is `Gas Used × (Base Fee + Priority Fee)`.

On Solana, execution cost is measured in Compute Units (Compute Unit, CU). Each transaction has a CU budget; exceeding it fails the transaction, somewhat similar to Ethereum's Gas Limit. But Solana's base transaction fee doesn't depend on CU consumption; it's tied to transaction byte size and signature count. The larger the transaction, the higher the base fee, which is loosely decoupled from computational complexity. Competition for compute is expressed via Priority Fees: developers can use `ComputeBudgetProgram` to set how many microLamports to pay per million CU, incentivizing validators to prioritize their transactions, which is similar to Ethereum's Gas Price/Priority Fee.

In other words, Solana transaction costs consist of three parts: a base fee tied to transaction size, storage costs expressed through rent, and compute pricing expressed through priority fees. The base fee is your **entry ticket**, while compute competition appears mostly in priority fees.

```js
import { ComputeBudgetProgram, Transaction } from "@solana/web3.js";

const transaction = new Transaction();

// Request a specific compute unit limit
transaction.add(
  ComputeBudgetProgram.setComputeUnitLimit({
    units: 400_000,
  })
);

// Set a priority fee
transaction.add(
  ComputeBudgetProgram.setComputeUnitPrice({
    microLamports: 100_000,
  })
);

// ... add your main instruction here
// transaction.add(myInstruction);
```

### Contract Upgrades

Upgrades are crucial to a project’s evolution, and Ethereum and Solana offer very different yet effective solutions.

In early Ethereum, upgrading smart contracts was complex and risky. Because code and data are tightly coupled at one address, upgrading often meant deploying a new contract and migrating data, which can be complex and error-prone. The community developed mature Proxy patterns where data resides in a stable proxy contract and upgradeable logic contracts are referenced via pointers. Upgrades switch the logic implementation without changing the proxy address—now the de facto standard.

Solana's design is simpler and more elegant: program code and state storage are naturally separated. You can redeploy new BPF bytecode to the same program ID to upgrade the program, while state accounts (outside the program) remain intact. There is no data migration needed, significantly reducing complexity and risk. However, there's a new challenge–once an account's structure and size are set, you can’t expand it in-place. If you later add new fields to a state account that was allocated with a smaller size, you’ll get data misalignment or read errors. The recommended approach is to pre-allocate unused space (`padding`) in v1 so you can safely add fields later without changing account size:

```rust
#[account(zero_copy)]
#[repr(C)]
pub struct MyState {
    pub data_field_a: u64,
    pub data_field_b: bool,
    // Reserve 128 bytes for future upgrade
    pub _reserved: [u8; 128],
}
```

This way, when you need new fields, you can repurpose part of `_reserved` without changing the account size, keeping old accounts compatible with the new program.

Also, when deploying a Solana program, you must set an upgrade authority (`upgrade authority`), which is often the deployer wallet or a multisig. This authority is the only entity that can update program bytecode. If it's compromised or removed improperly, the program could be maliciously upgraded or become immutable—so handle it with care.

### Authorization Models: `transferFrom` vs `transfer`

In Ethereum's ERC20 standard, transferring on behalf of a user usually takes two steps: the user calls `approve` to grant an allowance, and the authorized party (often a contract) then calls `transferFrom`. This exists because the account model distinguishes between the token holder and the executor, and the executor must submit a transaction separately.

In Solana’s SPL Token model, this is greatly simplified. Each token account records its _authority_ explicitly. As long as the transaction includes that authority’s signature, the program can directly call `token::transfer` to move tokens—no separate `transferFrom` needed. In other words, Solana’s runtime natively supports a **who-signs-who-authorizes** model, instead of relying on contracts to check a second-layer approval.

Furthermore, Solana’s execution environment supports signature propagation across CPI:

- If the outer transaction includes a user signature, callee programs can recognize it.
- If the caller is a PDA, `invoke_signed` lets the runtime synthesize and verify a derived signature for authorization.

Because the runtime understands and propagates authorization at the system level, once a program has a valid signature (or PDA-derived signature), it can safely transfer on the user’s behalf—no proxy-style instruction required.

Our staking flow uses direct user signatures without proxy or PDA authority. When the user calls `stake`, they directly authorize the program to operate their token account; the program then uses CPI `token::transfer` to move tokens into the vault—no `approve + transferFrom` needed. The example below illustrates how this works.

```rust
pub fn stake_handler(ctx: Context<Stake>, amount: u64) -> Result<()> {
    let cpi_accounts = Transfer {
        from: ctx.accounts.user_token_account.to_account_info(),
        to: ctx.accounts.staking_vault.to_account_info(),
        authority: ctx.accounts.user.to_account_info(),
    };
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
    token::transfer(cpi_ctx, amount)?;

    Ok(())
}
```

Solana doesn’t need `transferFrom` because its runtime fuses _authorization_ and _execution_: if a valid signature is present in the transaction, the user has authorized the transfer without extra steps.

### Numerical Computation

Numeric handling on Solana also requires a shift of thinking. First, regarding precision: SPL Tokens are often 6 or 9 decimal places long, not the 18 decimal places common in ERC20. Thus, token amounts usually fit in `u64`, simplifying math and saving 8 bytes per account compared to `u128`, reducing rent costs at scale.

When mixing multiplication and division, beware of precision loss in intermediate results. In many languages, writing `r = a / b * c` as a single expression may benefit from extended precision registers; on x86, the FPU uses 80-bit extended precision internally, only truncating to 64-bit at the end. Note that compilers may also reorder or combine operations. But if you split into steps like `t = a / b; r = t * c;`, the intermediate result is written to memory (64-bit), then read back, causing extra precision loss.

For integer token amounts, choose `u64/u128` to avoid floating-point issues. However, for ratios, rates, and prices, floats may be necessary, and if that is the case, be careful with intermediate precision. For example, on x86, a single expression like `r = a / b * c` might compute in 80-bit precision, only truncating at the end. Note that splitting the computation into steps as described earlier (first computing t = a / b, then computing r = t \* c) forces 64-bit truncation in between, introducing additional errors.

## Conclusion

This article provides experienced Ethereum developers with a detailed migration guide to Solana, helping bridge the gap between the two ecosystems. We first emphasized the core mindset shift required, then examined fundamental differences in account models, token standards, and call mechanisms. Next, we compared key tooling across the ecosystems and proposed a set of Solana best practices. By understanding and adopting these concepts and practices, developers can build high-performance decentralized applications on Solana more efficiently and safely.

In the next article, “From Ethereum to Solana — Contracts (Part 2),” we’ll continue exploring some limitations and shortcomings in Solana development. Finally, we’ll walk through a complete staking contract example, step by step, showing how to migrate an entire Ethereum contract to Solana. Stay tuned.

## References

- [Moving from Ethereum Development to Solana](https://solana.com/news/evm-to-svm)
- [EVM vs. SVM: Smart Contracts](https://solana.com/developers/evm-to-svm/smart-contracts)
- [How to Migrate From Ethereum to Solana: A Guide for Devs](https://www.helius.dev/blog/how-to-migrate-from-ethereum-to-solana)
- [Basic Knowledge Needed for Migrating from EVM to Solana](https://medium.com/@easypass.inc/basic-knowledge-needed-for-migrating-from-evm-to-solana-7814b29c8bd5)
- [A Complete Guide to Solana Development for Ethereum Developers](https://solana.com/developers/evm-to-svm/complete-guide)
- [Solana Development for EVM Developers](https://www.quicknode.com/guides/solana-development/getting-started/solana-development-for-evm-developers#key-architectural-differences-between-ethereum-and-solana)
- [Verifying Programs](https://solana.com/docs/programs/verified-builds)
