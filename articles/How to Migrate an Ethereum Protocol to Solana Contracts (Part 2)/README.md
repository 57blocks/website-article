---
published: true
title: "How to Migrate an Ethereum Protocol to Solana — Contracts (Part 2)"
author: ["Jimmy Zhao / Fullstack Engineer", "Bin Li / Tech Lead"]
createTime: 2026-03-05
categories: ["engineering"]
subCategories: ["Blockchain & Web3"]
tags: ["Solana", "Ethereum", "Smart Contract", "Solidity", "Anchor"]
landingPages: ["Blockchain-Onchain infra"]
thumb: "./thumb.png"
thumb_h: "./thumb_h.png"
intro: "Solana contract constraints that bite during an EVM migration, plus a full staking port from Solidity to Anchor."
---

## Article Overview

If you’ve already read [Contracts (Part 1)](https://57blocks.com/blog/how-to-migrate-an-ethereum-protocol-to-solana-contracts-part-1), you can split state across accounts and wire up Anchor instructions. Day-to-day migrations still run into problems that standard Solidity practices can't fix: mainnet-fork testing is manual and easy to get wrong; transactions have a hard compute-unit cap; CPI is one-way (no re-entrancy, no synchronous callbacks); token hooks and off-chain events are not `ERC-20` plus `emit`. Plan for these early or you refactor late.

The sections below walk through each constraint first, then port staking end to end (`stake`, `unstake`, `claimRewards`) with code in [evm-to-solana](https://github.com/57blocks/evm-to-solana): implementation, tests, and deployment.

It’s part of our series on migrating Ethereum protocols to Solana (contracts, backend, frontend). If you’re new to the topic, start with the [Preamble](https://57blocks.com/blog/how-to-migrate-an-ethereum-protocol-to-solana-preamble) for account models, execution, and fees.

#### Article Navigation

- [How to Migrate an Ethereum Protocol to Solana — Preamble](https://57blocks.com/blog/how-to-migrate-an-ethereum-protocol-to-solana-preamble): account models, execution, and fees on both chains.
- [How to Migrate an Ethereum Protocol to Solana — Contracts (Part 1)](https://57blocks.com/blog/how-to-migrate-an-ethereum-protocol-to-solana-contracts-part-1): account model, CPI, PDAs, and Anchor patterns for EVM developers.
- [How to Migrate an Ethereum Protocol to Solana — Contracts (Part 2)](https://57blocks.com/blog/how-to-migrate-an-ethereum-protocol-to-solana-contracts-part-2): Solana limits (CU, forks, hooks, events) and a staking migration walkthrough.
- [How to Migrate an Ethereum Protocol to Solana — Frontend(Part 1)](https://57blocks.com/blog/how-to-migrate-an-ethereum-protocol-to-solana-frontend-part-1): wallets, RPC, and client patterns when moving a DApp frontend to Solana.
- [How to Migrate an Ethereum Protocol to Solana — Frontend(Part 2)](https://57blocks.com/blog/how-to-migrate-an-ethereum-protocol-to-solana-frontend-part-2): transaction building, account fetching, and event/log handling on the client.
- [How to Migrate an Ethereum Protocol to Solana — Backend](https://57blocks.com/blog/how-to-migrate-an-ethereum-protocol-to-solana-backend): event sync, log parsing, and state management for a production backend.

## Solana Limitations and Trade-offs You Should Know

Part 1 covers how to structure programs and accounts. Below are the constraints we hit most often when porting real protocols: mainnet testing, compute budgets, CPI semantics, token hooks, and how off-chain services read state changes.

### Testing: The Challenge of Mainnet Forking

On Ethereum, Mainnet Forking (Hardhat, Foundry) gives you a lazily loaded local mainnet snapshot. You can call Uniswap or other live protocols without listing every account ahead of time.

On Solana, `solana-test-validator --clone` only copies addresses you name at startup. There is no lazy full-state fork like Ethereum. To test against Jupiter you track down pools, config accounts, authorities, and anything else the instruction touches. Miss one account and the test fails in a way that is hard to debug.

Tools like [surfpool](https://github.com/txtx/surfpool) narrow the gap: a local environment in the same spirit as Foundry’s [Anvil](https://www.alchemy.com/dapps/foundry-anvil), fetching mainnet account data on demand instead of requiring every address in a `--clone` list up front. That makes it easier to integration-test against live protocols (e.g. Jupiter) without maintaining a long clone manifest by hand.

### Compute Unit (CU) Limits

On Ethereum, gas limits scale with what you pay. Solana caps each transaction at **1.4 million compute units (CUs)** no matter the fee. Every instruction spends CUs, including CPIs. Exceed the budget and the whole transaction fails.

Large loops and big in-memory passes that are routine on Ethereum often blow the CU budget on Solana. Split work across transactions or tighten the algorithm. We go deeper on limits in [Deep Dive into Resource Limitations in Solana Development — CU Edition](https://57blocks.io/blog/deep-dive-into-resource-limitations-in-solana-development-cu-edition).

### No Callbacks / No Re-entrancy

Re-entrancy is a familiar Solidity bug: Contract B can call back into Contract A before A finishes writing state. External calls are synchronous. A common mistake is updating balances after the call:

```solidity
// Vulnerable Solidity Code
function withdraw() public {
    uint256 userBalance = balances[msg.sender];
    require(userBalance > 0, "No balance to withdraw");

    // The vulnerability is here: state is updated AFTER the external call.
    (bool success, ) = msg.sender.call{value: userBalance}("");
    require(success, "Transfer failed");

    // If the recipient is a malicious contract, it can re-enter this function
    // before the balance is set to 0, allowing multiple withdrawals.
    balances[msg.sender] = 0;
}
```

Solana CPI is one-way: Program A can invoke Program B, but B cannot call back into A in the same transaction. The call graph is acyclic. Even updating state after a CPI (not recommended style) avoids classic re-entrancy:

```rust
// Solana (Anchor) equivalent logic - still safe from re-entrancy
pub fn withdraw(ctx: Context<Withdraw>, amount: u64) -> Result<()> {
    // 1. Perform checks.
    let user_balance = ctx.accounts.user_vault.amount;
    require!(user_balance >= amount, "Insufficient balance");

    // 2. Interaction is performed BEFORE state change (not a best practice, but still safe).
    // The Token Program is a trusted, separate program. It cannot and will not
    // call back into our `withdraw` function. The execution flow is one-way.
    token::transfer(cpi_context, amount)?;

    // 3. State is updated last.
    ctx.accounts.user_vault.amount -= amount;

    Ok(())
}
```

While `token::transfer` runs, your program waits. The Token Program will not re-enter `withdraw`, and Solana has no `fallback`/`receive` hooks for strangers to call mid-instruction.

The trade-off: flash loans and other synchronous callback chains do not map cleanly. You usually split steps across transactions or check state in a follow-up instruction.

### Why Hooks Are Harder

Transfer hooks show up on both chains; the wiring differs.

On Ethereum you usually own the token contract: override `transfer` or `_beforeTokenTransfer` for allow lists, fees, and similar rules.

On Solana the SPL Token Program is shared and fixed. Token-2022 adds a `Transfer Hook` extension: you deploy a hook program, bind it at mint creation, and every transfer CPIs into it (read-only accounts). The hook approves or aborts the transfer.

Setup on Solana is heavier than editing an `ERC-20`. Typical flow:

1. Deploy a `Transfer Hook` program (allow/deny lists, fees, KYC, etc.).
2. At mint initialization, enable the Token-2022 extension and set the mint’s hook program id.
3. On each transfer, Token-2022 CPI-calls that program with the accounts you declared, often via `execute` and an `extra-account-metas` PDA so the hook sees every account it needs. A failing hook rolls back the transfer.

Callers must use `transferChecked`; plain `transfer` will fail. Many wallets and DEXs still lack hook support, so check compatibility before shipping.

In our staking example, blacklist checks live inside `stake`, `unstake`, and `claimRewards`. That blocks protocol paths only, not arbitrary wallet-to-wallet transfers. For a global blacklist, use Transfer Hook.

### Logs and Events

On Ethereum, `emit` writes structured logs. Indexers subscribe by topic and indexed fields to drive UIs, analytics, and jobs.

```solidity
// evm-staking/src/Staking.sol
// Define a structured event
event Staked(address indexed user, uint256 amount);

function stake(uint256 amount) external {
    // ...
    // Emit the event with structured data
    emit Staked(msg.sender, amount);
}
```

Solana’s built-in logging functions (`sol_log`, Anchor’s `msg!`) output printf-style text into transaction logs. While this works fine for debugging, it is terrible for indexing queries. Parsers typically have to scrape the entire log rather than filtering by type.

Anchor’s `#[event]` wraps a struct and serializes it into logs (often Base64) so clients can parse something closer to an EVM event.

First, define an event struct and tag it with `#[event]`:

```rust
// solana-staking/programs/solana-staking/src/events.rs
#[event]
pub struct Staked {
    pub pool: Pubkey,
    pub user: Pubkey,
    pub amount: u64,
    pub timestamp: i64,
}
```

Then, use the `emit!` macro to emit this event:

```rust
// solana-staking/programs/solana-staking/src/instructions/stake.rs
pub fn stake_handler(ctx: Context<Stake>, amount: u64) -> Result<()> {
    // ... (staking logic)
    let pool_config = &ctx.accounts.pool_config;
    let clock = Clock::get()?;

    // Emit the structured event
    emit!(Staked {
        pool: pool_config.pool_id,
        user: ctx.accounts.user.key(),
        amount,
        timestamp: clock.unix_timestamp,
    });

    Ok(())
}
```

`emit!` writes those bytes into the transaction log. Indexing is still weaker than Ethereum topics, but workable. Use Anchor’s `EventParser` on the client, or Helius-style webhooks and enhanced transaction APIs if you do not want to own the parser.

For anything production-facing off-chain, use `#[event]` instead of raw `msg!`.

## Hands-on: From Coding to Deployment

### Case Overview

Next: port a staking contract from Ethereum to Solana using the [evm-to-solana](https://github.com/57blocks/evm-to-solana) repo (same example as Part 1), including Foundry and Anchor code, tests, and deployment.

**Business logic**

- Users stake project tokens (`MyToken`) and earn `RewardToken` proportional to stake size and duration.

**Core features**

- `stake`: deposit `MyToken`
- `unstake`: withdraw staked `MyToken`
- `claimRewards`: claim accrued `RewardToken`

### Ethereum Implementation (Foundry)

On Ethereum the staking logic lives in one `Staking.sol` contract: state and functions together.

**Contract structure and state variables**

```solidity
// evm-staking/src/Staking.sol
contract Staking is ReentrancyGuard, Ownable {
    // Token contracts to interact with
    IERC20 public stakingToken;
    IERC20 public rewardToken;

    // Global state
    uint256 public rewardRate = 100; // 1% per day
    uint256 public totalStaked;

    // Per-user state, mapping an address to their stake info
    struct StakeInfo {
        uint256 amount;
        int256 rewardDebt;
        uint256 claimed;
    }
    mapping(address => StakeInfo) public stakes;

    // ... events and constructor
}
```

All staking data (token refs, pool totals, per-user `StakeInfo`) sits in this contract’s storage. 

**Core function implementations**

`stake`, `unstake`, and `claimRewards` read and write those storage fields directly.

```solidity
// evm-staking/src/Staking.sol
function stake(uint256 amount) external nonReentrant {
    // ... (checks)

    // Pulls tokens from the user into this contract
    stakingToken.transferFrom(msg.sender, address(this), amount);

    // Update user's stake info directly in the mapping
    stakes[msg.sender].amount += amount;
    // Update global state
    totalStaked += amount;

    // ... (update timestamps and emit event)
}

function unstake(uint256 amount) external nonReentrant {
    // ... (checks and claims pending rewards)

    // Update user's stake info
    stakes[msg.sender].amount -= amount;
    // Update global state
    totalStaked -= amount;

    // Push tokens from this contract back to the user
    stakingToken.transfer(msg.sender, amount);

    // ... (emit event)
}

function _claimRewards() private {
    uint256 reward = calculateReward(msg.sender);
    if (reward > 0) {
        // ... (update reward debt)
        // Transfer reward tokens to the user
        rewardToken.transfer(msg.sender, reward);
        // ... (emit event)
    }
}
```

As you can see, the process is quite straightforward: the contract acts like an all-in-one central processor. It holds the tokens (the vault), maintains the ledger for every user, and directly executes all computations and state updates—this is a typical Ethereum contract design pattern.

The full contract code is available [here](https://github.com/57blocks/evm-to-solana/tree/main/contract/evm-staking).

### Solana Implementation (Anchor)

The Solana version keeps the same behavior but splits code and data.

**Program structure and account definitions**

In Anchor, we define a stateless program containing instructions like `stake` and `unstake`, and then define all account structs used for state.

```rust
// solana-staking/programs/solana-staking/src/lib.rs & state.rs
// The program itself is stateless.
#[program]
pub mod solana_staking {
    pub fn create_pool(
        ctx: Context<CreatePool>,
        pool_id: Pubkey,
        reward_per_second: u64,
    ) -> Result<()> { /* ... */ }
    pub fn stake(ctx: Context<Stake>, amount: u64) -> Result<()> { /* ... */ }
    pub fn unstake(ctx: Context<Unstake>, amount: u64) -> Result<()> { /* ... */ }
    pub fn claim_rewards(ctx: Context<ClaimRewards>) -> Result<()> { /* ... */ }
    // ... other instructions
}

// Pool-level config is stored in a dedicated account (one per pool).
#[account]
pub struct PoolConfig {
    pub admin: Pubkey,
    pub pool_id: Pubkey,
    pub staking_mint: Pubkey,
    pub reward_mint: Pubkey,
    pub reward_per_second: u64,
    pub bump: u8,
}

// Mutable pool runtime state is split into a separate account.
#[account]
pub struct PoolState {
    pub pool_config: Pubkey,
    pub acc_reward_per_share: u128,
    pub last_reward_time: i64,
    pub total_staked: u64,
    pub total_reward_debt: i128,
    pub bump: u8,
}

// Per-user state is also in its own account, typically a PDA.
#[account]
pub struct UserStakeInfo {
    pub amount: u64,
    pub reward_debt: i128,
    pub bump: u8,
}
```

`PoolConfig` and `PoolState` split fixed config from mutable pool totals; each staker gets a `UserStakeInfo` PDA (`init_if_needed` in `stake`) instead of one on-chain `mapping`.

**Instructions and context**

Each instruction must explicitly declare all accounts it will touch. The `stake` Context:

```rust
// solana-staking/programs/solana-staking/src/instructions/stake.rs
#[derive(Accounts)]
pub struct Stake<'info> {
    // The user performing the action (signer)
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        seeds = [POOL_CONFIG_SEED, pool_config.pool_id.as_ref()],
        bump = pool_config.bump
    )]
    pub pool_config: Box<Account<'info, PoolConfig>>,

    #[account(
        mut,
        seeds = [POOL_STATE_SEED, pool_config.key().as_ref()],
        bump = pool_state.bump,
        has_one = pool_config
    )]
    pub pool_state: Box<Account<'info, PoolState>>,

    // The user's personal stake info PDA
    #[account(
        init_if_needed,
        payer = user,
        space = 8 + UserStakeInfo::INIT_SPACE,
        seeds = [STAKE_SEED, pool_config.key().as_ref(), user.key().as_ref()],
        bump
    )]
    pub user_stake_info: Box<Account<'info, UserStakeInfo>>,

    // The user's token account holding the staking tokens
    #[account(
        mut,
        token::mint = pool_config.staking_mint,
        token::authority = user
    )]
    pub user_token_account: Account<'info, TokenAccount>,

    // The program's vault to store the staked tokens
    #[account(
        mut,
        seeds = [STAKING_TOKEN_SEED, pool_config.key().as_ref()],
        bump
    )]
    pub staking_token: Account<'info, TokenAccount>,

    /// CHECK: This account may or may not exist - used for blacklist validation
    #[account(
        seeds = [BLACKLIST_SEED, pool_config.key().as_ref(), user.key().as_ref()],
        bump,
    )]
    pub blacklist_entry: UncheckedAccount<'info>,

    // Required external programs
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}
```

`blacklist_entry` is optional: if that PDA exists with data, `stake` rejects the user. Anchor checks seeds and `has_one` links before your handler runs.

**Core function implementation**

`stake` CPIs the Token Program to move tokens, then writes `pool_state` and `user_stake_info` supplied in the Context.

```rust
// solana-staking/programs/solana-staking/src/instructions/stake.rs
pub fn stake_handler(ctx: Context<Stake>, amount: u64) -> Result<()> {
    require!(amount > 0, StakingError::InvalidStakeAmount);

    let blacklist_info = &ctx.accounts.blacklist_entry.to_account_info();
    require!(
        blacklist_info.data_is_empty() || blacklist_info.lamports() == 0,
        StakingError::AddressBlacklisted
    );

    let pool_config = &ctx.accounts.pool_config;
    let pool_state = &mut ctx.accounts.pool_state;
    let user_stake = &mut ctx.accounts.user_stake_info;
    let clock = Clock::get()?;

    update_pool(pool_config, pool_state, &clock)?;

    // 1. Command the Token Program to transfer tokens via CPI
    let cpi_accounts = Transfer {
        from: ctx.accounts.user_token_account.to_account_info(),
        to: ctx.accounts.staking_token.to_account_info(),
        authority: ctx.accounts.user.to_account_info(),
    };
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
    token::transfer(cpi_ctx, amount)?;

    // 2. Update the data on the user_stake_info account
    user_stake.amount += amount;
    let debt_delta = calculate_share_value(amount, pool_state.acc_reward_per_share)?;
    user_stake.reward_debt += debt_delta;
    user_stake.bump = ctx.bumps.user_stake_info;

    // 3. Update the data on the pool state account
    pool_state.total_staked += amount;
    pool_state.total_reward_debt += debt_delta;

    emit!(Staked {
        pool: pool_config.pool_id,
        user: ctx.accounts.user.key(),
        amount,
        timestamp: clock.unix_timestamp,
    });

    Ok(())
}
```

This pattern clearly illustrates Solana's core philosophy: a stateless program (logic) operating on external, explicitly passed-in accounts (data).

The full Solana implementation is available [here](https://github.com/57blocks/evm-to-solana/tree/main/contract/solana-staking).

### Contract Testing

Foundry and Anchor take different approaches to tests.

**Framework comparison**

- **Ethereum / Foundry:** tests in Solidity against the contract, with `vm.prank` and other cheatcodes.
- **Solana / Anchor:** tests in TypeScript against a local validator, closer to how a client calls your program, with more setup boilerplate.

**Foundry test example**

From `evm-staking`, a direct `stake` test:

```solidity
// evm-staking/test/Staking.t.sol
function testStake() public {
    uint256 stakeAmount = 1000 * 10 ** 18;

    // Simulate the call coming from user1
    vm.startPrank(user1);
    // User must first approve the staking contract
    myToken.approve(address(staking), stakeAmount);
    // Call the stake function
    staking.stake(stakeAmount);
    vm.stopPrank();

    // Assertions are made directly against the contract's state
    (uint256 stakedAmount, ,) = staking.getStakeInfo(user1);
    assertEq(stakedAmount, stakeAmount);
    assertEq(staking.totalStaked(), stakeAmount);
}
```

**Anchor test example**

On Solana, the test script does more setup work: creating mock users, token accounts, then building and sending a full transaction to call the `stake` instruction.

```typescript
// solana-staking/tests/solana-staking.test.ts
describe("Stake", () => {
  it("should allow user to stake tokens", async () => {
    // 1. Setup: Create a test user and their token accounts
    const { user, userSigner } = await createTestUser(svm);
    const { stakingToken, rewardToken } = await setupUserWithTokens(
      provider,
      admin,
      user,
      stakingMint,
      rewardMint
    );
    const stakeAmount = toToken(100);

    // 2. Action: Build and send the transaction to call the 'stake' instruction
    await stakeTokens(user, userSigner, stakingToken, rewardToken, stakeAmount);

    // 3. Assertion: verify staking token account balance and account state
    const stakingTokenAccount = getAccount(provider, stakingTokenPda);
    expect(Number(stakingTokenAccount.amount)).to.equal(Number(stakeAmount));

    const userStakePda = getUserStakePda(statePda, user.publicKey);
    const userStakeInfo = getUserStakeInfo(provider, userStakePda);
    expect(userStakeInfo).to.not.be.null;
    expect(userStakeInfo!.amount.toString()).to.equal(stakeAmount.toString());
    expect(userStakeInfo!.rewardDebt.toString()).to.equal("0");

    const globalState = getGlobalState(provider, statePda);
    expect(globalState!.totalStaked.toString()).to.equal(
      stakeAmount.toString()
    );
  });
});
```

Foundry tests usually exercise contract internals directly; Anchor tests call the program through the client, which is closer to end-to-end integration testing.

### Contract Deployment

Deployment differs at the protocol level and in the tooling.

**Ethereum / Foundry deployment**

On Ethereum, deploying a contract is essentially sending a special transaction: the `to` field is empty, and the `data` field contains the compiled bytecode. Once miners include it in a block, the EVM executes the constructor logic, creates a new contract account, and stores the code at that address.

We deploy with a Foundry script in this repo.

```bash
# Run the deployment script using forge
forge script script/Deploy.s.sol --rpc-url <your_rpc_url> --broadcast --verify
```

This command runs `Deploy.s.sol`, deploys the `Staking` contract to the specified network, and uses `--verify` to automatically upload source code to Etherscan for verification. The full deployment script is available [here](https://github.com/57blocks/evm-to-solana/blob/main/contract/evm-staking/script/Deploy.s.sol).

**Solana / Anchor deployment**

Deploying a Solana program uploads the compiled binary (BPF, usually a `.so` in `target/deploy/`) to a program account. Business state stays in separate accounts. Anchor wraps the CLI steps:

```bash
# First, build the program to get the BPF bytecode
anchor build

# Then, run the deploy command for the initial deployment
anchor deploy --provider.cluster <cluster_name>
```

Set the cluster with `--provider.cluster` (`localnet`, `devnet`, or `mainnet-beta`). 

To ship new logic without migrating state, rebuild and upgrade the same program id:

```bash
# After making changes, build the new version
anchor build

# Then, use the upgrade command
anchor upgrade target/deploy/your_program_name.so --provider.cluster <cluster_name>
```

For more detailed steps and caveats, see our project’s [deployment doc](https://github.com/57blocks/evm-to-solana/blob/main/contract/solana-staking/DEPLOYMENT.md).

Each `forge script` deploy on Ethereum usually gets a new contract address and empty storage. `anchor deploy` / `anchor upgrade` keeps the program id; only the executable changes while pool and user accounts stay put.

## Summary

[Part 1](https://57blocks.com/blog/how-to-migrate-an-ethereum-protocol-to-solana-contracts-part-1) covered stateless programs, explicit accounts, CPI, and PDAs. Here we added practical limits: mainnet fork testing, CU caps, one-way CPI, Transfer Hook, and Anchor events for indexing.

The staking example uses the same three instructions on both chains with different layout: one Solidity contract vs. split pool/user accounts and Token Program CPIs.

Before you port, decide what is global state vs. per-user PDAs, which steps call SPL programs, and whether any instruction needs splitting for CU. Treat it as a redesign, not a line-by-line port.

Up next in the series: frontend and backend changes after the contracts move.

## References

- [Moving from Ethereum Development to Solana](https://solana.com/news/evm-to-svm)
- [EVM vs. SVM: Smart Contracts](https://solana.com/developers/evm-to-svm/smart-contracts)
- [How to Migrate From Ethereum to Solana: A Guide for Devs](https://www.helius.dev/blog/how-to-migrate-from-ethereum-to-solana)
- [Basic Knowledge Needed for Migrating from EVM to Solana](https://medium.com/@easypass.inc/basic-knowledge-needed-for-migrating-from-evm-to-solana-7814b29c8bd5)
- [A Complete Guide to Solana Development for Ethereum Developers](https://solana.com/developers/evm-to-svm/complete-guide)
- [Solana Development for EVM Developers](https://www.quicknode.com/guides/solana-development/getting-started/solana-development-for-evm-developers#key-architectural-differences-between-ethereum-and-solana)
- [Verifying Programs](https://solana.com/docs/programs/verified-builds)
