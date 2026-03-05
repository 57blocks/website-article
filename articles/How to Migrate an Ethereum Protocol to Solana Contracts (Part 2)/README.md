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
intro: "This article zooms in on the constraints and trade-offs you’ll run into when moving contract development from Ethereum to Solana. Using a concrete staking contract as an example, we’ll also walk through how an Ethereum contract can be migrated to Solana."
---

## Article Overview

As the Solana ecosystem continues to mature, more and more Ethereum (EVM) projects are considering migrating their protocols to Solana for higher performance, lower transaction costs, and a smoother user experience. Our team has extensive hands-on experience in this space—we’ve led multiple migrations and refactors of Ethereum protocols across a range of categories. We understand how complex a migration can be across contract architecture, data modeling, transaction logic, and front–back-end coordination, and we’ve built up a systematic methodology and a set of best practices along the way.

To help developers master the methods and practicalities of migrating from Ethereum to Solana, we’re publishing a series of deep dives across three core layers: smart contracts, backend services, and front-end interactions. We’ll share real-world lessons learned, key gotchas, best practices, and common pitfalls encountered in production—along with real cases and sample code that show the complete migration approach end to end.

Through this series, our goal is not just to “port” protocols, but to help developers fully tap into Solana’s high-performance characteristics and unique mechanisms—rethinking protocol design to build truly Solana-native innovation.

#### Article Navigation

- [How to Migrate an Ethereum Protocol to Solana — Preamble](https://57blocks.com/blog/how-to-migrate-an-ethereum-protocol-to-solana-preamble): a systematic overview of the fundamental differences between Ethereum and Solana in account models, execution, and fee systems.
- [How to Migrate an Ethereum Protocol to Solana — Contracts (Part 1)](https://57blocks.com/blog/how-to-migrate-an-ethereum-protocol-to-solana-contracts-part-1): focuses on the core mindset shifts and best practices for contract development when moving from Ethereum to Solana.
- [How to Migrate an Ethereum Protocol to Solana — Contracts (Part 2)](https://57blocks.com/blog/how-to-migrate-an-ethereum-protocol-to-solana-contracts-part-2): focuses on limitations and shortcomings in Solana contract development, and demonstrates how to migrate an Ethereum contract to Solana through a concrete staking example.

In the previous article, we focused on the key mindset shifts and best practices for Solana contract development. Once you’ve internalized those concepts, you already have the foundation to build efficient, secure programs. But like any technical platform, Solana also has its own characteristics and limitations. Understanding these constraints helps you make smarter architecture decisions early—so you don’t end up boxed into hard-to-fix problems later.

## Solana Limitations and Trade-offs You Should Know

Once you’ve grasped Solana’s core design philosophy and best practices, you already have the foundation to build efficient, secure programs. But like any technical platform, Solana has its own characteristics and limitations. Knowing where those limitations are will help you make better architecture decisions during development—and avoid painful dead ends late in the project.

### Testing: The Challenge of Mainnet Forking

In Ethereum development, one powerful and widely used testing strategy is Mainnet Forking. With tools like Hardhat or Foundry, developers can easily spin up a near-complete, lazily loaded snapshot of mainnet state in a local environment. That makes it straightforward to test interactions between new contracts and existing protocols (like Uniswap), because real accounts and state can be accessed instantly.

In the Solana ecosystem, this “seamless” testing workflow used to be more challenging. While Solana’s standard local testing tool `solana-test-validator` supports a `--clone` flag that lets you clone specific mainnet accounts at startup, it’s fundamentally different from Ethereum’s Full State Forking. On Solana, cloning is an explicit operation—you must specify addresses up front—instead of lazily loading state on demand. This directly affects development workflows. If you want to test interactions with a complex mainnet protocol (like Jupiter), you need to manually identify and list every relevant account to clone (liquidity pools, config accounts, authority accounts, and so on). That process can be tedious—and it’s easy to miss something.

The good news: the Solana ecosystem is moving fast to close this gap. Tools have emerged specifically to address mainnet forking. A representative example is [surfpool](https://github.com/txtx/surfpool), which aims to provide a local testing environment similar to [Anvil](https://www.alchemy.com/dapps/foundry-anvil) on Ethereum. It can dynamically fetch account state from mainnet on demand, enabling a lightweight, high-performance local fork. That lets developers debug and run integration tests in a realistic mainnet-like environment without sacrificing performance—dramatically improving the developer experience.

### Compute Unit (CU) Limits

On Ethereum, transaction complexity is mainly controlled by the gas limit. As long as you’re willing to pay enough gas, you can (in theory) execute very complex operations. Solana is different: each transaction has a strict hard cap on compute resources, known as the **Compute Unit (Compute Unit, CU)** limit. The maximum CU budget per transaction is **1.4 million**. Every instruction consumes CU—from simple arithmetic to complex cross-program invocations (CPI)—and once cumulative usage exceeds the budget, the entire transaction fails. You can’t bypass the limit by paying more fees.

This hard ceiling forces developers to stay constantly aware of compute complexity. Operations that are common on Ethereum—like iterating over a large array or running heavy loops—can easily exceed CU limits on Solana. You’ll often need to redesign by splitting heavy logic into multiple transactions, or by using more efficient algorithms to reduce per-transaction workload. This “compute efficiency first” requirement is the developer-facing reflection of Solana’s high-performance architecture.

For more details on CU constraints, see our related article: [Deep Dive into Resource Limitations in Solana Development — CU Edition](https://57blocks.io/blog/deep-dive-into-resource-limitations-in-solana-development-cu-edition)

### No Callbacks / No Re-entrancy

Ethereum developers are usually very familiar with re-entrancy attacks—one of the most notorious smart contract vulnerabilities in Solidity. The attack works because inter-contract calls on Ethereum are synchronous, and the callee (Contract B) can call back into the caller (Contract A) before the caller finishes updating state. Here’s a typical vulnerable pattern, where state updates happen after an external call:

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

Solana eliminates this class of issue at the architectural level because it enforces a strict one-way invocation model. On Solana, Program A can call Program B via CPI, but Program B cannot call back into Program A from within its execution context. The call graph must be one-directional and acyclic. Consider the following Solana example: even if we update state _after_ a CPI call, there’s still no re-entrancy risk:

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

When our program calls the `Token Program` via CPI, execution pauses until `token::transfer` completes. The `Token Program` is a separate program, and it contains no logic that could call back into our `withdraw` function. In addition, Solana’s program model doesn’t have implicitly triggered `fallback` or `receive` functions that external calls can invoke—so the re-entrancy path is cut off at the design level.

That said, this architectural safety comes with design constraints. Some complex patterns commonly seen on Ethereum that rely on synchronous callbacks (for example, certain flash-loan flows or deeply composable DeFi operations) can’t be implemented directly on Solana. Developers often need to shift toward multi-transaction flows or asynchronous state checks to achieve similar outcomes.

### Why Hooks Are Harder

Adding pre- or post-transfer hooks around token transfers is a common requirement—but Ethereum and Solana take very different paths.

On Ethereum, each `ERC-20` token is typically a customizable contract. Developers can insert logic directly into `transfer` or `transferFrom`, or override internal hook functions like `_beforeTokenTransfer` to implement allow/deny lists, transaction taxes, free lists, and so on. The result is cohesive, simple, and easy to adjust.

On Solana, token logic is standardized and provided by the officially deployed on-chain `Token Program`, which you can’t modify. To enable hook-like behavior, `Token-2022` introduced the `Transfer Hook` extension. When you create a token, you can specify a separate Hook program. On every transfer, the `Token Program` will automatically CPI-call the Hook program, passing all relevant accounts (read-only), and the Hook program decides whether the transfer should proceed. If the Hook program returns an error, the entire transfer is rolled back.

This mechanism is more complex than Ethereum’s approach: the token creator must deploy and configure an additional hook program. But it reflects Solana’s modular philosophy: standard shared logic (`Token Program`) is separated from custom business logic (`Hook Program`). Composition happens through CPI, preserving consistency while enabling extensibility.

There are practical caveats. To use `Transfer Hook`, you must call `transferChecked`; a normal `transfer` will fail. Also, many wallets and DEXs don’t explicitly support the hook extension yet, which can hurt ecosystem compatibility—so you should evaluate carefully before adopting it.

A `Transfer Hook` isn’t just a few lines of code—it’s a separately deployed program (the `Hook Program`). Its flow looks like this:

1. You write and deploy a dedicated `Transfer Hook` program whose only responsibility is to validate whether a token transfer is allowed (for example, checking allow/deny lists, KYC status, fees, etc.).
2. When creating the token (mint initialization), you enable the `Token-2022` `Transfer Hook` extension and bind the mint to your hook program.
3. From then on, every transfer of this token causes the `SPL Token-2022` program to CPI-call the hook program, passing all relevant accounts (read-only). Your logic runs, and if it fails, the transfer is rolled back.
4. Implementations typically rely on the SPL-2022 `execute` instruction and the `extra-account-metas` list (using PDAs to store extra account metadata) to ensure the invocation context is complete.

In our example, to keep things simple, we do blacklist checks inside each instruction. But that only affects specific operations—it can’t cover every possible transfer path. If you want a blacklist that intercepts _all_ transfers, you must use the `Transfer Hook` approach. It’s more complex to develop and deploy, but it also captures Solana’s philosophy: decouple core `Token` logic from extensible business logic, keep standard functionality in the official `Token Program`, and place customizable validation in an independent `Hook Program`, composed via CPI.

### Logs and Events

On Ethereum, events are a core mechanism for smart contracts to communicate with the outside world. With the `emit` keyword, a contract can produce structured, indexable logs. Off-chain services can efficiently subscribe to these events to update UIs, run analytics, or trigger downstream logic.

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

Solana’s native runtime is more primitive here. It provides basic logging via `sol_log` (typically used through Anchor’s `msg!` macro), but that’s essentially just printing a string into transaction logs. It’s great for debugging, but without strong structure or indexing. You can’t efficiently filter by event types or parameters the way you can on Ethereum. Off-chain services often have to scan logs wholesale, which makes reliable parsing harder.

To address this, Anchor provides a lightweight `#[event]` macro that adds basic event parsing on top of native logs.

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

然后，在你的指令逻辑中，使用 `emit!` 宏来发出这个事件：

```rust
// solana-staking/programs/solana-staking/src/instructions/stake.rs
pub fn stake_handler(ctx: Context<Stake>, amount: u64) -> Result<()> {
    // ... (staking logic)
    let pool_config = &ctx.accounts.pool_config;
    let clock = &ctx.accounts.clock;

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

Anchor’s `#[event]` macro serializes the event data (commonly Base64-encoded) and writes it into the transaction logs via `emit!`. It’s not as strongly structured as EVM-style events, but it’s recognizable by off-chain systems. On the client side, you can parse events with Anchor’s `EventParser`, or use services like Helius Webhooks / enhanced transaction APIs to fetch logs and extract events using your own parsing logic.

So for any application that needs reliable off-chain communication, use Anchor’s `#[event]` rather than relying on raw `msg!` logs—this ensures your program broadcasts state changes in a standardized, machine-parseable way.

## Hands-on: From Coding to Deployment

### Case Overview

Theory matters—but nothing cements understanding like a complete, runnable example. Next we’ll migrate an Ethereum staking contract to Solana step by step. This case is designed to bring together all the key concepts discussed earlier.

**Business logic**

The staking contract’s business logic is classic:

- Users stake tokens issued by the project (`MyToken`).
- In return, users earn reward tokens (`RewardToken`) proportionally based on stake amount and duration.

**Core features**

To support this logic, the contract must provide three core functions:

- `stake`: deposit `MyToken` and start staking.
- `unstake`: withdraw staked `MyToken`.
- `claimRewards`: claim earned `RewardToken` rewards.

This practical case ties together all previously scattered concepts into a coherent, end-to-end picture of Solana development.

### Ethereum Implementation (Foundry)

Let’s see how this staking logic is implemented on Ethereum. The code follows a common Solidity pattern: all logic and state are packaged into a single contract named `Staking.sol`.

**Contract structure and state variables**

At the heart of the contract are its state variables, which record all data.

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

- `stakingToken` and `rewardToken`: store the contract addresses of the two tokens to interact with.
- `rewardRate` and `totalStaked`: store global configuration like reward rate and total staked amount.
- `stakes`: a key `mapping` that maps each user address to a `StakeInfo` struct, which records per-user staking data (amount, timestamps, etc.). All user state is centralized inside this mapping.

**Core function implementations**

The three core functions `stake`, `unstake`, and `claimRewards` all revolve around directly modifying these state variables.

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

You can see the flow is straightforward: the contract acts like an all-in-one central processor. It holds tokens (the vault), maintains the ledger for every user, and directly performs all computation and state updates—this is the typical Ethereum contract design pattern.

The full contract code is available [here](https://github.com/jimmyzhao-57blocks/evm-to-solana/tree/main/contract/evm-staking).

### Solana Implementation (Anchor)

Now let’s implement the same staking logic the Solana way. As we’ve emphasized, the core is separating code from data.

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

- The `staking` program: contains only business logic and stores no data.
- The `GlobalState` account: a singleton account that stores protocol-wide configuration like `total_staked` and `reward_rate`.
- The `UserStakeInfo` account: typically a PDA created dynamically per user to store their staking state.

**Instructions and context**

On Solana, each instruction must explicitly declare all accounts it will touch. Take `stake` as an example: its Context clearly lists all participants.

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
        seeds = [STAKING_VAULT_SEED, pool_config.key().as_ref()],
        bump
    )]
    pub staking_vault: Account<'info, TokenAccount>,

    #[account(
        mut,
        seeds = [REWARD_VAULT_SEED, pool_config.key().as_ref()],
        bump
    )]
    pub reward_vault: Account<'info, TokenAccount>,

    #[account(
        mut,
        token::mint = pool_config.reward_mint,
        token::authority = user
    )]
    pub user_reward_account: Account<'info, TokenAccount>,

    /// CHECK: This account may or may not exist - used for blacklist validation
    #[account(
        seeds = [BLACKLIST_SEED, pool_config.key().as_ref(), user.key().as_ref()],
        bump,
    )]
    pub blacklist_entry: UncheckedAccount<'info>,

    // Required external programs
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub clock: Sysvar<'info, Clock>,
}
```

This struct is the account checklist for the `stake` instruction. Before execution, Anchor strictly validates all provided accounts against these definitions and constraints.

**Core function implementation**

The `stake` instruction no longer “modifies internal state.” Instead, it performs a CPI call to the `Token Program` to transfer tokens, then updates the data stored in the passed-in `state` and `user_stake_info` accounts.

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
    let clock = &ctx.accounts.clock;

    update_pool(pool_config, pool_state, clock)?;

    // 1. Command the Token Program to transfer tokens via CPI
    let cpi_accounts = Transfer {
        from: ctx.accounts.user_token_account.to_account_info(),
        to: ctx.accounts.staking_vault.to_account_info(),
        authority: ctx.accounts.user.to_account_info(),
    };
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
    token::transfer(cpi_ctx, amount)?;

    // 2. Update the data on the user_stake_info account
    user_stake.amount += amount;
    let debt_delta = reward_debt_delta(amount, pool_state.acc_reward_per_share)?;
    user_stake.reward_debt += debt_delta;
    user_stake.bump = ctx.bumps.user_stake_info;

    // 3. Update the data on the pool state account
    pool_state.total_staked += amount;

    emit!(Staked {
        pool: pool_config.pool_id,
        user: ctx.accounts.user.key(),
        amount,
        timestamp: clock.unix_timestamp,
    });

    Ok(())
}
```

This pattern cleanly illustrates Solana’s core idea: a stateless program (logic) operates on external, explicitly passed-in accounts (data).

The full Solana implementation is available [here](https://github.com/jimmyzhao-57blocks/evm-to-solana/tree/main/contract/solana-staking).

### Contract Testing

Validating correctness is a critical part of the development workflow. Here, mainstream testing frameworks on Ethereum and Solana differ both in philosophy and implementation.

**Framework comparison**

- Ethereum / Foundry: tests are often written directly in Solidity. The upside is that tests and contracts share the same language, context, and types. Test contracts can call internal/external functions directly and use `forge-std` utilities (like `vm.prank`) to simulate different callers and environments. It’s powerful and intuitive.
- Solana / Anchor: tests are written in TypeScript or JavaScript. Test scripts interact with a local validator (`solana-test-validator`) via client libraries. In other words, tests simulate a real front-end or back-end calling your program deployed to a local test network. This is closer to real user behavior, but requires more client-side setup.

**Foundry test example**

Below is a typical test case from `evm-staking` that validates the `stake` function directly in Solidity.

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

    // 3. Assertion: verify staking vault balance and account state
    const stakingVaultAccount = getAccount(provider, stakingVaultPda);
    expect(Number(stakingVaultAccount.amount)).to.equal(Number(stakeAmount));

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

As you can see, Foundry tests tend to focus on unit-testing internal contract logic, while Anchor tests are closer to end-to-end or integration testing.

### Contract Deployment

Deploying code to a blockchain is the final step. Ethereum and Solana differ deeply here as well—both at the protocol level and in tooling.

**Ethereum / Foundry deployment**

On Ethereum, deploying a contract is essentially sending a special transaction: the `to` field is empty, and the `data` field contains the compiled bytecode. Once miners include it in a block, the EVM executes the constructor logic, creates a new contract account, and stores the code at that address.

In our example project, we use Foundry scripts to handle deployment, which provides flexibility for more complex deployment logic.

```bash
# Run the deployment script using forge
forge script script/Deploy.s.sol --rpc-url <your_rpc_url> --broadcast --verify
```

This command runs `Deploy.s.sol`, deploys the `Staking` contract to the specified network, and uses `--verify` to automatically upload source code to Etherscan for verification. The full deployment script is available [here](https://github.com/jimmyzhao-57blocks/evm-to-solana/blob/main/contract/evm-staking/script/Deploy.s.sol).

**Solana / Anchor deployment**

Solana’s deployment mechanism is completely different. Since code and data are separated, deploying a program doesn’t create a single account containing both code and state. Instead, it uploads compiled BPF (Berkeley Packet Filter) bytecode to a dedicated program account. That program account is executable, but it does not store business state. With Anchor, the deployment flow is significantly simplified:

```bash
# First, build the program to get the BPF bytecode
anchor build

# Then, run the deploy command for the initial deployment
anchor deploy --provider.cluster <cluster_name>
```

- `anchor build`: compiles your Rust code into BPF bytecode and places it under `target/deploy/`.
- `anchor deploy`: handles the low-level details, including creating a new program account and uploading the bytecode. The `--provider.cluster` parameter lets you pick the target network: `localnet`, `devnet`, or `mainnet-beta`.

When you need to update logic, you just modify code and run `anchor upgrade` to upload new bytecode to the same program ID—keeping all associated state accounts unchanged.

```bash
# After making changes, build the new version
anchor build

# Then, use the upgrade command
anchor upgrade target/deploy/your_program_name.so --provider.cluster <cluster_name>
```

For more detailed steps and caveats, see our project’s [deployment doc](https://github.com/jimmyzhao-57blocks/evm-to-solana/blob/main/contract/solana-staking/DEPLOYMENT.md).

Put side by side, Foundry deployment feels like spinning up a brand-new server instance, while Anchor deployment feels like uploading or updating a piece of executable logic.

## Summary

Across these two contract-focused articles, we’ve systematically mapped out the full mindset shift required when migrating from Ethereum to Solana at the smart contract layer. This is not a simple language swap or tooling migration—it’s a deep refactor centered on the execution model, state organization, and protocol architecture.

In the previous article, we tackled a key question: why does writing Solana contracts “the Ethereum way” often feel increasingly awkward? The answer is that the underlying models are fundamentally different. Solana’s design—stateless programs plus explicit account passing—treats parallel execution as a first principle. That forces a shift from “the contract is the world” to a new paradigm: the program is a dispatcher of logic, while accounts are the true holders of state. The account model, Token Accounts, CPI, PDAs, explicit Context—these aren’t scattered details, but different faces of the same parallel-execution philosophy.

In this article, we went one step further into the realities of migrating a complex protocol: where exactly does Solana force you to change your approach? The hard CU cap, the differences in mainnet fork testing, the no-callback/no-reentrancy execution model, and modular-but-more-complex extensions like Transfer Hook—none of these are accidents. They’re systematic trade-offs Solana makes in pursuit of performance and determinism. Understanding these limits early helps you avoid getting trapped in EVM habits.

Taken together, the conclusion is clear: Ethereum is closer to an application-level programming model. It tends to provide highly abstracted contract structures, where state, permissions, and business logic naturally cohere inside a single contract. Solana is closer to a systems-level programming model. With explicit accounts and resource constraints, it pushes developers to build systems compositionally. On Ethereum, we’re used to packaging state, permissions, and business logic into one contract and relying on the runtime’s implicit context. On Solana, we proactively split state, draw clear account boundaries, use PDAs to build permission systems, and compose with standard programs via CPI. This complexity isn’t pointless overhead—it’s the engineering price paid for high throughput, parallel execution, and strong determinism.

The full staking migration example reinforces a key point: a successful migration is never a line-by-line translation. It’s a redesign grounded in Solana’s native model. Which state belongs in a global account vs. a per-user PDA? Which logic should live in a single program vs. be composed via CPI calls to standard external programs? Which operations must be split into multiple transactions, and which can fit into a single instruction? You can only answer these correctly after you truly understand the design philosophies of both chains.

Ultimately, our hope is that these contract articles help you build not only the ability to write Solana contracts, but also the judgment to evaluate designs. When facing an existing EVM protocol, you should be able to tell which parts can be preserved and which must be rebuilt. When designing new protocols on Solana, you should be able to align with its execution model from day one—instead of constantly patching compromises later.

In the next articles, we’ll expand from the contract layer to front-end interaction and back-end services. Once contracts move from EVM to Solana, the rest of the system architecture must adapt too—the key is ensuring backend, frontend, and contracts evolve together with a consistent design.

## References

- [Moving from Ethereum Development to Solana](https://solana.com/news/evm-to-svm)
- [EVM vs. SVM: Smart Contracts](https://solana.com/developers/evm-to-svm/smart-contracts)
- [How to Migrate From Ethereum to Solana: A Guide for Devs](https://www.helius.dev/blog/how-to-migrate-from-ethereum-to-solana)
- [Basic Knowledge Needed for Migrating from EVM to Solana](https://medium.com/@easypass.inc/basic-knowledge-needed-for-migrating-from-evm-to-solana-7814b29c8bd5)
- [A Complete Guide to Solana Development for Ethereum Developers](https://solana.com/developers/evm-to-svm/complete-guide)
- [Solana Development for EVM Developers](https://www.quicknode.com/guides/solana-development/getting-started/solana-development-for-evm-developers#key-architectural-differences-between-ethereum-and-solana)
- [Verifying Programs](https://solana.com/docs/programs/verified-builds)
