---
published: true
title: "How to Migrate an Ethereum Protocol to Solana — Contracts (Part 1)"
author: ["Jimmy Zhao / Fullstack Engineer", "Bin Li / Tech Lead"]
createTime: 2025-11-07
categories: ["engineering"]
tags: ["Solana", "Ethereum", "Smart Contract", "Solidity", "Anchor"]
landingPages: ["Blockchain-Onchain infra"]
thumb: "./thumb.png"
thumb_h: "./thumb_h.png"
intro: "A deep dive into the core mindset shift and best practices when moving contracts from Ethereum to Solana."
---

## Article Overview

As the Solana ecosystem matures, more and more Ethereum ( EVM ) projects are considering migrating their protocols to Solana to gain higher performance, lower transaction costs, and a better user experience. Our company has extensive hands-on experience in this area, having led the migration and refactoring of multiple Ethereum protocols across various categories. We understand the complexity of migration across contract architecture, data models, transaction logic, and front-backend coordination, and we’ve developed a systematic methodology and set of best practices.

To help developers systematically master the methods and practices for migrating from Ethereum to Solana, we’re launching a series focused on three core layers—the smart contract layer, backend services, and frontend interactions. We’ll share lessons learned from real projects, key caveats, best practices, and typical issues encountered during migration, complemented by real-world case studies and sample code that demonstrate an end-to-end migration approach and implementation path.
Through this series, we hope to help developers not only complete the migration, but also fully tap into Solana’s high-performance potential and unique mechanisms to redesign protocols natively for Solana.

#### Article Navigation

- How to Migrate an Ethereum Protocol to Solana — Preamble: A systematic introduction to the fundamental differences between Ethereum and Solana in account models, execution mechanisms, and fee systems.
- How to Migrate an Ethereum Protocol to Solana — Contracts ( Part 1 ): A focus on the core mindset shift and best practices for contract development from Ethereum to Solana.

Enough talk—let’s get into it!

---

With Solana’s rapid rise and growing maturity, its high performance and low costs have attracted a surge of developer and user attention. Meanwhile, Ethereum ( Ethereum ) and EVM-compatible chains boast massive ecosystems but have long faced challenges like limited scalability and high transaction fees. As a result, more Web3 developers are turning to Solana for better developer and user experiences, making the migration from Ethereum to Solana a prominent trend. So how do we effectively port the smart contracts we’ve mastered on Ethereum to the Solana platform? Many developers initially think this is merely a language shift from Solidity to Rust, but soon discover the real challenge lies in fundamental differences in underlying architecture. This article aims to help experienced Ethereum developers complete a critical mental model shift so they can efficiently and securely reimplement existing contract logic the Solana way.

## The Core Mindset Shift

When migrating from Ethereum to Solana, your first task is a critical mindset shift. If you haven’t read “How to Migrate an Ethereum Protocol to Solana — Preamble,” start there; it systematically introduces the foundational differences between Ethereum and Solana in account models, execution mechanisms, and fee systems. We won’t repeat those concepts here. Instead, we’ll focus on three things you must reinterpret for contract development: the relationship between accounts and programs, Token accounts and Cross-Program Invocations ( CPI ), and explicitly declared dependencies in calls. Together, these form the core mental model for Solana smart contract development.

To make these concepts concrete, most code examples in this article reference a complete, open-source Staking migration project. We’ll dissect the project in the final section, but before that, we’ll frequently use its code snippets to support each core concept we discuss.

### The Account Model

The very first thing to upend when moving to Solana is your understanding of **accounts** on Solana.

On Ethereum and EVM-compatible chains, smart contracts follow a monolithic design: a contract is both the carrier of code and the container of state, tightly coupling execution logic and storage. Take a standard ERC20 token contract as an example: it not only contains functions like `transfer` and `approve`, but also a `mapping` to store balances for all users. This design is similar to object-oriented programming’s class instances ( Object ), where methods and data are encapsulated in a single entity, forming a complete, self-contained functional unit. Here’s a concrete Solidity example:

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
        uint256 timestamp;
    }

    // ... business logic like stake() and unstake()
}
```

In this example, the `stakingToken` and `rewardToken` addresses, and all users’ staking data `stakes`, are stored directly in the internal state of the `Staking` contract.

Solana takes a completely different approach: its core philosophy is to **fully separate code and data**. On Solana, **Programs** contain logic only—they are stateless and do not store business data themselves—while **Accounts** are dedicated to storing data. When executing a transaction, you must explicitly tell the program which accounts to operate on. Think of a program as an executable and accounts as the data files it reads and writes, stored and managed separately.

Here’s the corresponding Solana ( Anchor ) implementation:

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

Here, the `staking` program is stateless and holds no data. All data—both global `GlobalState` and per-user `UserStakeInfo`—are defined in separate `#[account]` structs. The program receives these accounts through the `Context` object ( typed by the `Stake` struct ), and then operates on them.

This design’s fundamental purpose is to enable large-scale [parallel processing](https://medium.com/solana-labs/sealevel-parallel-processing-thousands-of-smart-contracts-d814b378192). Because code and data are separated, Solana transactions declare all accounts they will access ahead of execution and specify whether each account is read-only or writable. This allows the runtime to build a dependency graph and schedule transactions efficiently. If two transactions touch completely unrelated accounts—or both only read the same account—they can safely run in parallel. Only when one transaction needs to write to an account will other transactions that access that account ( read or write ) be temporarily blocked and executed sequentially. With this fine-grained scheduling, Solana maximizes multi-core utilization to process many non-interfering transactions concurrently—key to its high throughput and low latency.

### Token Standards

Differences in the account model show up most directly in token standards. Using our staking contract example, let’s see how it differs across the two platforms. In the ERC20 standard on Ethereum, token state is managed by a centralized token contract, and application contracts indirectly manipulate user balances by calling that token contract’s functions.

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

On Solana’s SPL Token standard, things are entirely different. There is a shared, official `Token Program` for all tokens. Users’ tokens are not stored in a centralized contract but in user-owned, independent **Token Accounts**. To operate on tokens, our staking program must receive these token accounts as inputs.

```rust
// solana-staking/programs/solana-staking/src/instructions/stake.rs
// The context for the stake instruction requires specific token accounts.
#[derive(Accounts)]
pub struct Stake<'info> {
    #[account(mut)]
    pub user_staking_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub vault_token_account: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
    // ...
}

// The instruction itself commands the Token Program to perform the transfer.
pub fn stake(ctx: Context<Stake>, amount: u64) -> Result<()> {
    token::transfer(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.user_staking_token_account.to_account_info(),
                to: ctx.accounts.vault_token_account.to_account_info(),
                authority: ctx.accounts.user.to_account_info(),
            }
        ),
        amount
    )?;
    // ...
    Ok(())
}
```

Here, staking uses a Cross-Program Invocation ( CPI ) to call the official `Token Program`’s `transfer` instruction to move funds between the user’s token account and the program’s vault token account—clearly illustrating the separation between data ( token accounts ) and logic ( Token Program ).

This fundamental difference also explains a common confusion for new Solana users: why does the wallet prompt me to create an account before receiving a new token? The reason is that, on Solana, before receiving USDC, your wallet must first create a token account to hold USDC—like setting up a dedicated mini-vault for that token. On Ethereum, your wallet address can “receive” any ERC20 token because “receiving” simply means another entry is recorded inside the token contract’s internal ledger; no preparation is needed on your end.

### Contract Calls

Differences in account models directly lead to huge differences in how you interact with contracts ( programs ). In Solidity, when calling a function, the EVM prepares contextual information behind the scenes—most notably `msg.sender`. Developers don’t need to specify the caller in parameters; the EVM handles it implicitly, making function calls look clean.

**Ethereum Call Example ( Foundry Test )**

```solidity
// evm-staking/test/Staking.t.sol
function testStake() public {
    uint256 stakeAmount = 1000 * 10 ** 18;

    // The user's address is implicitly passed as msg.sender
    vm.startPrank(user1);
    myToken.approve(address(staking), stakeAmount);
    staking.stake(stakeAmount);
    vm.stopPrank();

    (uint256 stakedAmount, , , ) = staking.getStakeInfo(user1);
    assertEq(stakedAmount, stakeAmount);
}
```

In the Foundry test above, `vm.startPrank(user1)` sets `msg.sender` for subsequent calls to `user1`. When calling `staking.stake(stakeAmount)`, we only pass the business parameter `amount`.

On Solana, the program knows nothing about the outside world. It needs every piece of information—including who the caller is and which accounts it must read or write—explicitly provided in the transaction instruction. These accounts are packed into a `Context` object and passed as parameters. This design aligns with parallel processing: the runtime can only determine safe parallel execution if each transaction lists all accounts it will touch.

**Solana Call Example ( TypeScript Test )**

```typescript
// solana-staking/tests/solana-staking.test.ts
// Helper function to simplify the call
async function stakeTokens(
  user: Keypair,
  userSigner: any,
  stakingToken: PublicKey,
  amount: bigint
) {
  const userStakePda = getUserStakePda(user.publicKey);

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

In this TypeScript test, calling the `stake` instruction requires a large accounts object: `user` ( signer ), `state` ( global state account ), `userStakeInfo` ( user staking data account ), `userTokenAccount` ( the user’s token account ), `stakingVault` ( the program’s vault ), etc. While this makes the client call more verbose, it brings transparency and safety. Before the transaction is sent, the client code explicitly defines all accounts the transaction will interact with—no hidden contextual dependencies.

Additionally, on Ethereum, upgrading a contract often requires changing client code to point to a new contract address. On Solana, you simply deploy new program code to the same program ID, achieving seamless upgrades. All business data remains untouched in their accounts because data and logic are decoupled. Since the program address doesn’t change, client code remains compatible.

If you want deeper architectural context for the code patterns in this article, revisit “EVM vs Solana: From Account Models to Execution Logic,” which provides a more systematic conceptual background.

## Tooling Comparison

Understanding the mindset shift isn’t enough. To put these ideas into practice, you need to get comfortable with a different, ecosystem-specific toolchain. From language to standard libraries, Solana’s ecosystem differs significantly from Ethereum’s. The table below summarizes key differences to help you build a new mental map quickly.

| **Domain**                | **Ethereum Ecosystem**                | **Solana Ecosystem**                  | **Key Notes**                                                                                                                                                                                                                                                                                                                                                                                         |
| :------------------------ | :------------------------------------ | :------------------------------------ | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Frameworks**            | Hardhat / Foundry ( Solidity )        | Anchor ( Rust )                       | In the Ethereum ecosystem, Hardhat and Foundry are widely used smart contract development tools. Anchor is the de facto standard for Solana development; it uses powerful macros to greatly simplify the complexity of Solana program development.                                                                                                                                                    |
| **Interface Standard**    | ABI ( Application Binary Interface )  | IDL ( Interface Definition Language ) | Anchor automatically generates an IDL from your program code, similar to the ABI concept on Ethereum—ABI is Ethereum’s contract interaction standard, and the Solidity compiler automatically generates ABI files describing function/parameter/return binary encodings. Clients can use these IDL or ABI files to interact with your program without caring about the underlying implementation.     |
| **Standard Library**      | OpenZeppelin                          | SPL ( Solana Program Library )        | OpenZeppelin is an import-and-inherit code library, whereas SPL is a set of reusable standard programs already deployed on-chain. You interact with them via Cross-Program Invocation ( CPI ) instead of copying code into your project.                                                                                                                                                              |
| **Contract Verification** | Upload and verify source on Etherscan | Submit source for Verified Build      | Solana supports “Verified Builds,” conceptually similar to Ethereum. Developers submit source code, which is compiled in a deterministic environment; the build artifact’s hash is compared against on-chain bytecode. This ensures the source matches the on-chain program—not just validating the IDL interface.                                                                                    |
| **Network RPC**           | Infura, Alchemy, QuickNode            | Helius, Alchemy, QuickNode            | Both ecosystems have top-tier RPC providers; only a few ( like QuickNode ) are multi-chain. Solana’s high throughput has also led to specialized providers like Helius that offer enhanced Solana-first APIs.                                                                                                                                                                                         |
| **Explorers**             | Etherscan, Blockscout                 | Solscan, Solana Explorer, X-Ray       | The Ethereum ecosystem has powerful tools like Tenderly for deep transaction simulation and debugging. In the Solana ecosystem, tools like Helius ( product X-Ray ) provide similar functionality. Due to Solana’s parallel transaction model, these tools focus more on visualizing value flows between accounts and CPI call chains to help developers understand complex instruction interactions. |

From this comparison, a clear pattern emerges: Ethereum development feels like inheritance and extension ( e.g., inheriting OpenZeppelin contracts ), while Solana development is more about composition and interaction ( via CPI with on-chain SPL programs ).

For newcomers to Solana, the most important takeaway is: use the Anchor framework whenever possible. Unlike Ethereum’s Hardhat/Foundry, which focus on the external development flow ( tests, deployment, scripting ), Anchor reaches into the program itself. Through macros and constraints, it dramatically simplifies writing Solana programs, handling a lot of tedious and error-prone low-level safety checks and data serialization for you. Master Anchor, and you’ll master efficient, safe business logic on Solana.

## Solana Development Best Practices

Once you understand Solana’s tooling differences, you still need to apply them correctly in line with Solana’s design philosophy. Simply swapping Solidity for Rust isn’t enough—true efficiency and safety come from following best practices distilled by the ecosystem. Let’s look at some concrete practices.

### Embrace the Anchor Framework

There are two main approaches to Solana program development: native ( Native ) and Anchor-based.

Native development requires direct interaction with Solana’s low-level libraries, meaning you must manually serialize/deserialize account data and write a lot of code to verify account ownership, signer permissions, mutability, etc. While this offers maximum flexibility, it’s complex, verbose, and prone to security pitfalls.

Hence, Solana’s official recommendation—especially for developers migrating from Ethereum—is to prefer Anchor. Anchor’s core goal is to simplify development and enhance safety by leveraging Rust macros to automate the complex parts of native development.

Here’s a simple `initialize` instruction for creating a new global state account.

**With Anchor:**

In Anchor, you declare accounts and constraints declaratively, and the framework handles validation and initialization for you.

```rust
// solana-staking/programs/solana-staking/src/instructions/initialize.rs
#[program]
pub mod staking {
    pub fn initialize(ctx: Context<Initialize>, reward_rate: u64) -> Result<()> {
        // Business logic is clean and focused.
        let state = &mut ctx.accounts.state;
        state.reward_rate = reward_rate;
        state.authority = ctx.accounts.authority.key();
        // ...
        Ok(())
    }
}

// Define accounts and constraints declaratively.
#[derive(Accounts)]
pub struct Initialize<'info> {
    // Anchor handles the creation and rent payment for this account.
    #[account(init, payer = authority, space = 8 + State::INIT_SPACE)]
    pub state: Account<'info, State>,
    // Anchor verifies this is a signer.
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[account]
pub struct State {
    pub authority: Pubkey,
    pub reward_rate: u64,
    // ...
}
```

**Natively:**

A functionally equivalent implementation requires you to handle all the details manually:

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

The contrast is clear: Anchor abstracts away a lot of native boilerplate ( account checks, CPI calls, data serialization ) into concise, safer macros. This lets developers focus on business logic, significantly improving productivity and readability.

Of course, convenience isn’t free. Anchor’s abstraction layer, including its auto-inserted safety checks, tends to consume more Compute Units ( CU ) than highly optimized native code, and Anchor-generated bytecode is usually larger than equivalent native programs. While Solana program accounts can be up to 10 MB, this still matters for complex protocols. To truly excel on Solana, you should still understand the native APIs behind Anchor’s macros—overreliance on abstractions without grasping the underlying mechanics can hinder you when solving complex issues or doing deep optimizations.

For most projects, Anchor’s gains in development speed and safety far outweigh its performance overhead. But to master Solana, you’ll want deeper knowledge of its lower-level mechanisms.

### Account Lifecycle and Rent

On Ethereum, you pay for contract storage once at deployment, and it persists forever. Solana, however, uses a Rent mechanism to manage on-chain storage.

What is rent? On Solana, all accounts ( data or program accounts ) must pay rent to occupy storage on-chain—a continuous cost designed to prevent unbounded state growth and compensate validators for storing data. In practice, to avoid accounts being reclaimed when their balance is exhausted, the standard approach is to deposit enough SOL ( in lamports ) upon creation to cover about two years of rent—making the account **rent-exempt** and effectively permanently allocated. When an account is closed, this pre-deposited lamports balance is fully refunded.

This introduces an **account lifecycle** concept, where developers proactively manage creation, use, and destruction. Many major Solana projects follow this pattern; we’ll use [Mango Markets v4](https://github.com/blockworks-foundation/mango-v4) as an example—a Solana-based decentralized trading, lending, and leverage platform—whose program design exemplifies account lifecycle management.

**Creation & Initialization**

In Mango v4, when a user first opens an account, the program creates a new `MangoAccount`. This process is defined in the `AccountCreate` context, where the `#[account(init, ...)]` constraint is key to creation and rent payment.

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
- `payer = payer`: specifies the payer ( often the owner ) to fund rent-exemption on creation.
- `space = ...`: defines the allocated storage size, computed dynamically by a function.

For more details, see [Mango Markets v4 source](https://github.com/blockworks-foundation/mango-v4/blob/dev/programs/mango-v4/src/accounts_ix/account_create.rs).

**Closing & Destruction**

When an account is no longer needed ( e.g., a user clears and closes their Mango trading account ), it can be closed to recover the pre-deposited rent. In Mango v4, the `AccountClose` context uses the `close` constraint:

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

- `close = sol_destination`: crucial—tells Anchor to automatically close `account` after successful execution and refund all its lamports ( rent deposit ) to `sol_destination`. This explicit create–destroy model is central to resource management in Solana programs.

For more details, see [Mango Markets v4 source](https://github.com/blockworks-foundation/mango-v4/blob/dev/programs/mango-v4/src/accounts_ix/account_close.rs).

Our `solana-staking` example also follows this lifecycle model. The `initialize` instruction creates global state and vault accounts; the `stake` instruction uses `init` to create a user info account on first stake; and in `unstake`, if the user’s balance returns to zero, the program uses `close` to destroy their user info account and refund rent. See the repository here: [solana-staking](https://github.com/57blocks/evm-to-solana/tree/main/contract/solana-staking).

### Program Derived Addresses ( PDA )

When managing account lifecycles, Program Derived Addresses ( Program Derived Address, PDA ) are essential—central to Solana’s security model. A PDA is deterministically derived from a program ID and a set of seeds, has no private key, and only the deriving program can “sign” for it. PDAs let programs own/control other accounts, making them ideal as secure data stores, token vaults ( Vault ), or authority hubs. In an instruction, Anchor recomputes and verifies a PDA’s address using the provided seeds and a `bump` ( a nonce ensuring the address lies off the elliptic curve ), preventing clients from passing forged accounts—critical for safety. By setting a PDA as another account’s `authority`, you can build complex, program-controlled permission systems—a common pattern in Solana program design.

Here’s how a PDA is defined and used. In our staking program, the `UserStakeInfo` account is a PDA that stores each user’s personal staking info.

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
        bump = user_stake_info.bump
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
    pub stake_timestamp: i64,
    pub last_claim_time: i64,
    pub reward_debt: u64,
    pub bump: u8,
}
```

- `seeds = [STAKE_SEED, state.key().as_ref(), user.key().as_ref()]`: the core PDA definition. It derives `user_stake_info` from a constant `STAKE_SEED`, the global state account `state.key()`, and the user public key `user.key()`. This ensures a unique, predictable `UserStakeInfo` address per user per staking pool.
- `bump`: Anchor finds a `bump` and stores it in the PDA’s data. Future instructions use the stored `bump` to re-derive and verify the address, ensuring `user_stake_info` is legitimate, not forged.
- `init_if_needed`: a convenience constraint that auto-creates this PDA on a user’s first stake. It’s feature-gated in Anchor because it can introduce reinitialization risks, so avoid it when possible.

This gives each user a unique, program-controlled data account—showcasing the power of PDAs.

### Program Architecture: Prefer a Single Program

In Ethereum, developers often build composable mini-contracts, each handling a distinct function. On Solana, a different architectural pattern is generally recommended: consolidate tightly related business logic into a relatively complete single program.

There are several reasons. First, CPI ( Cross-Program Invocation ) is more involved; second, Ethereum historically enforces a contract bytecode size limit ( about 24,576 bytes / 24 KB ), pushing developers to split logic. On Ethereum, calling another contract is straightforward, with context ( like `msg.sender` ) implicitly passed. On Solana, each CPI requires the caller to manually construct and pass a complete account list required by the callee’s instruction. This is verbose, error-prone ( e.g., missing or misordered accounts ), and increases transaction size and complexity. Here’s a real CPI example—our staking program calling the official `Token Program` to transfer tokens:

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

To complete this transfer, we construct a `Transfer` struct with `from` ( user token account ), `to` ( program vault ), and `authority` ( signer ) accounts, then bundle it with the `token_program` into a `CpiContext` before calling `token::transfer`.

Now imagine splitting staking logic across multiple programs—one for user stake data and another to update `total_staked`. A simple `stake` could require multiple CPIs, each with its own verbose account context, greatly increasing complexity, CU usage, and the chance of mistakes.

So, to improve developer efficiency and maintainability, best practice is to implement an app or protocol’s core features ( e.g., a DeFi protocol’s staking, lending, reward calculation ) inside a single program. Use CPI only to interact with standardized external programs like the SPL Token Program. This monolithic pattern reduces CPI count, simplifies clients, and keeps logic cohesive—easier to audit and manage.

### Fee Model

Solana’s fee model shares some conceptual similarities with Ethereum but differs in implementation. Ethereum uses Gas, with transactions declaring a Gas Limit and paying based on Gas Used × price. Since EIP-1559, fees comprise Base Fee ( auto-adjusts with congestion ) and Priority Fee, so total cost is `Gas Used × ( Base Fee + Priority Fee )`.

On Solana, execution cost is measured in Compute Units ( Compute Unit, CU ). Each transaction has a CU budget; exceeding it fails the transaction—somewhat like Ethereum’s Gas Limit. But Solana’s base transaction fee doesn’t depend on CU consumption; it’s tied to transaction byte size and signature count. The larger the transaction, the higher the base fee—loosely decoupled from computational complexity. Competition for compute is expressed via Priority Fees: developers can use `ComputeBudgetProgram` to set how many microLamports to pay per million CU, incentivizing validators to prioritize their transactions—akin to Ethereum’s Gas Price / Priority Fee.

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

In early Ethereum, upgrading smart contracts was complex and risky. Because code and data are tightly coupled at one address, upgrading often meant deploying a new contract and migrating data—complex and error-prone. The community developed mature Proxy patterns: data resides in a stable proxy contract, while upgradeable logic contracts are referenced via pointers. Upgrades switch the logic implementation without changing the proxy address—now the de facto standard.

Solana’s design is simpler and more elegant: program code and state storage are naturally separated. You redeploy new BPF bytecode to the same program ID to upgrade the program, while state accounts ( outside the program ) remain intact—no data migration, significantly reducing complexity and risk. However, there’s a new challenge: once an account’s structure and size are set, you can’t expand it in-place. If you later add new fields to a state account that was allocated with a smaller size, you’ll get data misalignment or read errors. The recommended approach is to pre-allocate unused space ( `padding` ) in v1 so you can safely add fields later without changing account size:

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

Also, when deploying a Solana program, you must set an upgrade authority ( `upgrade authority` )—often the deployer wallet or a multisig. This authority is the only entity that can update program bytecode. If it’s compromised or removed improperly, the program could be maliciously upgraded or become immutable—so handle it with care.

### Authorization Models: `transferFrom` vs `transfer`

In Ethereum’s ERC20 standard, transferring on behalf of a user usually takes two steps: the user calls `approve` to grant an allowance, and the authorized party ( often a contract ) then calls `transferFrom`. This exists because the account model distinguishes between the token holder and the executor, and the executor must submit a transaction separately.

In Solana’s SPL Token model, this is greatly simplified. Each token account records its _authority_ explicitly. As long as the transaction includes that authority’s signature, the program can directly call `token::transfer` to move tokens—no separate `transferFrom` needed. In other words, Solana’s runtime natively supports a **who-signs-who-authorizes** model, instead of relying on contracts to check a second-layer approval.

Furthermore, Solana’s execution environment supports signature propagation across CPI:

- If the outer transaction includes a user signature, callee programs can recognize it.
- If the caller is a PDA, `invoke_signed` lets the runtime synthesize and verify a derived signature for authorization.

Because the runtime understands and propagates authorization at the system level, once a program has a valid signature ( or PDA-derived signature ), it can safely transfer on the user’s behalf—no proxy-style instruction required.

Our staking flow uses direct user signatures—no proxy or PDA authority. When the user calls `stake`, they directly authorize the program to operate their token account; the program then uses CPI `token::transfer` to move tokens into the vault—no `approve + transferFrom` needed, e.g.:

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

Solana doesn’t need `transferFrom` because its runtime fuses _authorization_ and _execution_: if a valid signature is present in the transaction, the user has authorized the transfer—no extra steps.

### Numerical Computation

Numerical handling on Solana also requires a shift. First, regarding precision: SPL Token decimals are often 6 or 9, not the 18 decimals common in ERC20. Thus, token amounts usually fit in `u64`, simplifying math and saving 8 bytes per account compared to `u128`—reducing rent costs at scale.

When mixing multiplication and division, beware of precision loss in intermediate results. In many languages, writing `r = a / b * c` as a single expression may benefit from extended precision registers; on x86, the FPU uses 80-bit extended precision internally, only truncating to 64-bit at the end; compilers may also reorder or combine operations. But if you split into steps—`t = a / b; r = t * c;`—the intermediate result is written to memory ( 64-bit ), then read back, causing extra precision loss.

For integer token amounts, prefer `u64/u128` to avoid floating-point issues. But for ratios, rates, and prices, floats may be necessary—then be careful with intermediate precision. For example, on x86, a single expression like `r = a / b * c` might compute in 80-bit precision, only truncating at the end; splitting into steps forces 64-bit truncation in between, introducing additional error.

## Conclusion

This article provides experienced Ethereum developers with a detailed migration guide to Solana, helping bridge the gap between the two ecosystems. We first emphasized the core mindset shift required, then examined fundamental differences in account models, token standards, and call mechanisms. Next, we compared key tooling across the ecosystems and proposed a set of Solana best practices. By understanding and adopting these concepts and practices, developers can build high-performance decentralized applications on Solana more efficiently and safely.

In the next article, “From Ethereum to Solana — Contracts ( Part 2 ),” we’ll continue exploring some limitations and shortcomings in Solana development. Finally, we’ll walk through a complete staking contract example, step by step, showing how to migrate an entire Ethereum contract to Solana. Stay tuned.

## References

- [Moving from Ethereum Development to Solana](https://solana.com/news/evm-to-svm)
- [EVM vs. SVM: Smart Contracts](https://solana.com/developers/evm-to-svm/smart-contracts)
- [How to Migrate From Ethereum to Solana: A Guide for Devs](https://www.helius.dev/blog/how-to-migrate-from-ethereum-to-solana)
- [Basic Knowledge Needed for Migrating from EVM to Solana](https://medium.com/@easypass.inc/basic-knowledge-needed-for-migrating-from-evm-to-solana-7814b29c8bd5)
- [A Complete Guide to Solana Development for Ethereum Developers](https://solana.com/developers/evm-to-svm/complete-guide)
- [Solana Development for EVM Developers](https://www.quicknode.com/guides/solana-development/getting-started/solana-development-for-evm-developers#key-architectural-differences-between-ethereum-and-solana)
- [Verifying Programs](https://solana.com/docs/programs/verified-builds)
