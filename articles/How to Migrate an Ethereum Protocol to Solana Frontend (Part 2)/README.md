# How to Migrate Ethereum Protocols to Solana — Frontend (Part 2)

## Staking Demo Implementation

# Article Overview

Solana is maturing, and more EVM teams are looking at migration. Higher throughput, cheaper transactions, better UX — the pitch is real. We've led a handful of these migrations end to end, and the patterns that matter most aren't obvious from reading the docs. This series distills what we learned across contracts, backends, and frontends.

If you're new to the series, start with the [preamble](https://57blocks.com/blog/how-to-migrate-an-ethereum-protocol-to-solana-preamble?tab=engineering) — it covers the architectural differences between Ethereum and Solana that everything else depends on.

This article is about the frontend. Not the theory — the actual code. Using a complete staking demo, we'll compare EVM and Solana side by side across wallet connection, reading state, writing transactions, and handling events. Each section shows both approaches so you can see where the patterns split and why.

## Article Navigation

- [Preamble](https://57blocks.com/blog/how-to-migrate-an-ethereum-protocol-to-solana-preamble?tab=engineering): Account models, execution, fee systems — the differences that matter.
- [Contracts (Part 1)](https://57blocks.com/blog/how-to-migrate-an-ethereum-protocol-to-solana-contracts-part-1?tab=engineering): The mindset shift and contract development patterns.
- **Frontend (Part 1):** Architecture design for data access and transaction optimization.
- **Frontend (Part 2):** Staking Demo Implementation (this article).

Using a complete staking demo, we'll connect the core frontend interaction scenarios side by side — EVM on one side, Solana on the other — so you can apply the concepts from earlier articles to real code.

The demo is a simplified staking protocol: users stake tokens, earn rewards, unstake or claim anytime with no lockup. Through it, we'll work through:

1. **Architectural division:** Where business logic stops and frontend code begins.
2. **Wallet connection:** MetaMask + Wagmi (EVM) vs Wallet Adapter (Solana).
3. **Reading state:** ABI + contract addresses vs PDA + Anchor.
4. **Writing data:** `approve` + `stake` (two transactions) vs direct `stake` (one).
5. **Event handling:** Persistent EVM logs vs ephemeral Solana program logs.
6. **Putting it together:** How these connect in a real demo.

[View the code on GitHub](https://github.com/57blocks/evm-to-solana).

## 1. Business Logic and Frontend Responsibilities

What the protocol does:

- **Stake:** Users stake `MyToken` tokens they hold.
- **Claim rewards:** The protocol issues `RewardToken` based on stake amount and duration.
- **State and security:** Track each user's staking position and enforce access controls.

What the frontend handles:

- `stake`: Initiate a staking transaction for `MyToken`.
- `unstake`: Initiate a withdrawal transaction.
- `getStakeInfo`: Query and display the user's current position.

This demo is about *how* the frontend talks to EVM and Solana protocols. Reward formula design is out of scope — that's a backend concern.

## 2. Connecting the Wallet

### 2.1 EVM: MetaMask + Wagmi + RainbowKit

In EVM land, MetaMask is effectively the standard. Frontends usually reach for RainbowKit + Wagmi + Viem.

The steps:

1. Configure the chain and RPC (we're on Sepolia testnet).
2. Create a wagmi config with SSR enabled.
3. Wrap the app with `RainbowKitProvider`.
4. Use `ConnectButton` to render the connection UI.

```ts
export const config = getDefaultConfig({
  appName: "Stake App",
  projectId: "EVM-DAPP",
  chains: [sepolia],
  transports: {
    [sepolia.id]: http(process.env.NEXT_PUBLIC_RPC_URL || ""),
  },
  ssr: true,
});

const client = new QueryClient();
<WagmiProvider config={config}>
  <QueryClientProvider client={client}>
    <RainbowKitProvider>
      <Component {...pageProps} />
    </RainbowKitProvider>
  </QueryClientProvider>
</WagmiProvider>
```

On the page:

```html
<ConnectButton
  label="Connect Wallet"
  showBalance={false}
  accountStatus="address"
/>
```

The wallet ecosystem is centralized enough that if you integrate MetaMask, you've covered the vast majority of users. One main wallet, maybe a couple others.

### 2.2 Solana: Multi-Wallet Ecosystem + Wallet Adapter

Solana doesn't have a MetaMask. The wallet landscape is fragmented — Phantom, Solflare, Backpack, and others. Anza's [Wallet Adapter](https://github.com/anza-xyz/wallet-adapter) exists to paper over this.

Step 1: Create the `WalletProvider`:

```ts
interface WalletProviderProps {
  children: ReactNode;
}

export const WalletProvider: FC<WalletProviderProps> = ({ children }) => {
  const { network, endpoint } = SOLANA_CONFIG;
  const wallets = useMemo(
    () => [new PhantomWalletAdapter(), new SolflareWalletAdapter()],
    [network]
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <SolanaWalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </SolanaWalletProvider>
    </ConnectionProvider>
  );
};
```

Step 2: [Use the official UI button](https://github.com/anza-xyz/wallet-adapter/blob/master/APP.md)

```ts
<WalletModalProvider>
  <WalletMultiButton className={styles.connectButton}>
    Connect Wallet
  </WalletMultiButton>
</WalletModalProvider>
```

On EVM, "wallet" basically means MetaMask. On Solana, you think about multiple wallets from day one. Wallet Adapter isn't a nice-to-have — it's the abstraction that keeps things from turning into a mess.

## 3. Reading State Data (Read-Only Operations)

Reading state is every DApp's bread and butter. No gas, no signatures, anyone can do it.

### 3.1 EVM: useReadContract + ABI

Wagmi's `useReadContract` makes this straightforward:

```ts
const {
  data: stakeInfoData,
  isLoading: isReading,
  error: readError,
  refetch,
} = useReadContract({
  address: STAKING_CONTRACT_ADDRESS,
  abi: stakingAbi,
  functionName: "getStakeInfo",
  args: [address as Address],
  query: {
    enabled: !!address && isConnected,
  },
});
```

The three pieces you need: contract address, the ABI, and the function name + args. Under the hood it's wrapping `eth_call`.

### 3.2 Solana: Account Model + PDA + Anchor

On Solana, state lives in accounts. A user's staking info is stored in a [PDA (Program Derived Address)](https://57blocks.com/blog/how-to-migrate-an-ethereum-protocol-to-solana-preamble?tab=engineering#pda-program-derived-address) — an account whose address is derived from the program ID and some seeds.

Two approaches to reading Solana state:

1. **Read raw accounts and parse manually:** Use [`@solana/web3.js`](https://github.com/solana-foundation/solana-web3.js) to fetch account data, then deserialize the buffer yourself. Works, but tedious.
2. **Use Anchor and IDL (recommended):** Combine [`@coral-xyz/anchor`](https://github.com/coral-xyz/anchor-book) with an [IDL](https://57blocks.com/blog/how-to-migrate-an-ethereum-protocol-to-solana-preamble?tab=engineering#idl-interface-description-language) and let Anchor handle the parsing.

Creating the `useProgram` hook:

```ts
const [program, setProgram] = useState<Program<SolanaStaking>>();

const { connection } = useConnection();
const wallet = useAnchorWallet();

useEffect(() => {
  if (wallet) {
    const provider = new AnchorProvider(connection, wallet, {});
    setProvider(provider);
    const program = new Program<SolanaStaking>(idl, provider);
    setProgram(program);
  }
}, [connection, wallet]);

return { program, setProgram };
```

Reading user staking info:

```ts
const userStakeInfo = await program.account.userStakeInfo.fetch(userStakeInfoPda);
```

EVM: ABI + contract address → call function, get return value. Solana: IDL + PDA → read account struct directly. Anchor wraps Solana's account model into something that feels closer to ABI-based development, which helps if you're coming from EVM.

## 4. Writing Data (Transaction Operations)

Writing data changes on-chain state. That means user signatures and transaction fees. We'll use staking as the running example.

### 4.1 EVM: approve → stake (Two Steps)

The typical flow:

1. Check the allowance — how much the token contract lets the staking contract spend:

```ts
const {
  data: currentAllowance,
  isLoading: isAllowanceLoading,
  refetch: refetchAllowance,
} = useReadContract({
  address: STAKING_TOKEN_ADDRESS,
  abi: stakingTokenAbi,
  functionName: "allowance",
  args: [address, STAKING_CONTRACT_ADDRESS],
  query: {
    enabled: !!address && isConnected,
  },
});
```

2. If the allowance is too low, approve first:

```ts
const {
  writeContract,
  data: writeData,
  error: writeError,
} = useWriteContract();

writeContract({
  address: STAKING_TOKEN_ADDRESS,
  abi: stakingTokenAbi,
  functionName: "approve",
  args: [STAKING_CONTRACT_ADDRESS, stakeAmountWei],
});
```

3. Then stake:

```ts
await writeContract({
  address: STAKING_CONTRACT_ADDRESS,
  abi: stakingAbi,
  functionName: "stake",
  args: [stakeAmountWei],
});
```

Two transactions, and the user has to sign both. It's the ERC20 design — the token contract needs explicit permission before another contract can move tokens from your wallet.

### 4.2 Solana: Signature Is Authorization

Solana doesn't do the approve dance. Here's why:

1. Each SPL token balance lives in a Token Account. Every token account has an owner, and only the owner can transfer from it.
2. [ATA (Associated Token Account)](https://57blocks.com/blog/how-to-migrate-an-ethereum-protocol-to-solana-preamble?tab=engineering#ata-associated-token-account) is unique and derivable — `getAssociatedTokenAddressSync(mint, owner)` gives you the same address every time.
3. Tokens in a token account come from a Mint (which defines total supply and decimals). When you stake, the staking program doesn't ask the Mint for permission. It transfers tokens from your ATA to the `stakingVault`, signed by you.

The user's signature *is* the authorization. One transaction instead of two.

#### 4.2.1 Staking Program `stake` IDL (Excerpt)

```json
{
  "args": [
    {
      "name": "amount",
      "type": "u64"
    }
  ],
  "accounts": [
    {
      "name": "user",
      "writable": true,
      "signer": true
    },
    {
      "name": "state",
      "writable": true,
      "pda": {
        "seeds": ["state", "staking_mint"]
      }
    },
    {
      "name": "user_stake_info",
      "writable": true,
      "pda": {
        "seeds": ["stake", "state", "user"]
      }
    },
    {
      "name": "user_token_account",
      "writable": true
    },
    {
      "name": "staking_vault",
      "writable": true,
      "pda": {
        "seeds": ["staking_vault", "state"]
      }
    },
    {
      "name": "reward_vault",
      "writable": true,
      "pda": {
        "seeds": ["reward_vault", "state"]
      }
    },
    {
      "name": "user_reward_account",
      "writable": true
    },
    {
      "name": "blacklist_entry",
      "pda": {
        "seeds": ["blacklist", "state", "user"]
      }
    },
    {
      "name": "token_program",
      "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
    },
    {
      "name": "system_program",
      "address": "11111111111111111111111111111111"
    },
    {
      "name": "clock",
      "address": "SysvarC1ock11111111111111111111111111111111"
    }
  ]
}
```

`amount: u64` — how many MyToken tokens the user wants to stake.

The accounts:

| Account                                | Type   | What it is                   | PDA Seeds                                                    |
| -------------------------------------- | ------ | ---------------------------- | ------------------------------------------------------------ |
| user                                   | Signer | User's signing account       | —                                                            |
| state                                  | PDA    | Global staking state         | `["state", staking_mint]`                                    |
| user_stake_info                        | PDA    | User's staking info          | `["stake", statePda, user_publicKey]`                        |
| user_token_account                     | ATA    | User's staking token account | `getAssociatedTokenAddressSync(stakingMint, user_publicKey)` |
| staking_vault                          | PDA    | Escrow for staked tokens     | `["staking_vault", statePda]`                                |
| reward_vault                           | PDA    | Escrow for reward tokens     | `["reward_vault", statePda]`                                 |
| user_reward_account                    | ATA    | User's reward token account  | `getAssociatedTokenAddressSync(rewardMint, user_publicKey)`  |
| blacklist_entry                        | PDA    | Blacklist account            | `["blacklist", statePda, user_publicKey]`                    |
| token_program / system_program / clock | System | Required by Anchor           | —                                                            |

PDAs that depend on the user's public key (`user_stake_info`, `blacklist_entry`) include `user_publicKey` in their seeds. This makes them per-user by construction. PDAs that aren't user-specific (`staking_vault`, `reward_vault`) use constant seeds + `statePda` — globally unique, one per deployment. ATA addresses come from `getAssociatedTokenAddressSync`, which is a different mechanism from PDA but also unique and derivable.

#### 4.2.2 PDA Generation

User-specific PDAs:

```ts
import { PublicKey } from "@solana/web3.js";

// Global state PDA
const [statePda] = PublicKey.findProgramAddressSync(
  [Buffer.from("state"), stakingMint.toBuffer()],
  program.programId
);

// User staking info PDA
const [userStakeInfoPda] = PublicKey.findProgramAddressSync(
  [Buffer.from("stake"), statePda.toBuffer(), user.publicKey.toBuffer()],
  program.programId
);

// Blacklist PDA
const [blacklistEntryPda] = PublicKey.findProgramAddressSync(
  [Buffer.from("blacklist"), statePda.toBuffer(), user.publicKey.toBuffer()],
  program.programId
);
```

Non-user-specific PDAs (`staking_vault`, `reward_vault`) are tied to `statePda` and derived with fixed seeds:

```ts
const [stakingVault] = PublicKey.findProgramAddressSync(
  [Buffer.from("staking_vault"), statePda.toBuffer()],
  program.programId
);

const [rewardVault] = PublicKey.findProgramAddressSync(
  [Buffer.from("reward_vault"), statePda.toBuffer()],
  program.programId
);
```

#### 4.2.3 Token Account (ATA)

Get the ATA with `getAssociatedTokenAddressSync`:

```ts
import { getAssociatedTokenAddressSync } from "@solana/spl-token";

const userTokenAccount = getAssociatedTokenAddressSync(stakingMint, user.publicKey);
const userRewardAccount = getAssociatedTokenAddressSync(rewardMint, user.publicKey);
```

`stakingMint` is the mint address for `MyToken`; `rewardMint` is for `RewardToken`. Once the ATA exists, the user's tokens live there and Anchor can reference it directly in transactions. On Solana, each SPL token gets its own account for the balance — it's not bundled into the user's main wallet account the way ERC20 balances are stored in a mapping on the token contract.

#### 4.2.4 Executing Stake / Unstake

Stake:

```ts
const transaction = await program.methods
  .stake(new BN(convertToLamports(stakeAmount)))
  .accounts({
    user: publicKey,
    state: statePda,
    userStakeInfo: userStakeInfoPda,
    userTokenAccount: userTokenAccount,
    stakingVault: state.stakingVault,
    rewardVault: state.rewardVault,
    userRewardAccount: userRewardAccount,
    tokenProgram: TOKEN_PROGRAM_ID,
    blacklistEntry: blacklistPda,
    systemProgram: anchor.web3.SystemProgram.programId,
    clock: anchor.web3.SYSVAR_CLOCK_PUBKEY,
  })
  .rpc();
```

Unstake:

```ts
const {
  statePda,
  userStakeInfoPda,
  blacklistPda,
  userTokenAccount,
  userRewardAccount,
} = await createStakingAccount(publicKey);

const state = await program.account.globalState.fetch(statePda);

const transaction = await program.methods
  .unstake(new BN(convertToLamports(unstakeAmount)))
  .accounts({
    user: publicKey,
    state: statePda,
    userStakeInfo: userStakeInfoPda,
    userTokenAccount: userTokenAccount,
    stakingVault: state.stakingVault,
    rewardVault: state.rewardVault,
    userRewardAccount: userRewardAccount,
    tokenProgram: TOKEN_PROGRAM_ID,
    blacklistEntry: blacklistPda,
    clock: anchor.web3.SYSVAR_CLOCK_PUBKEY,
  })
  .rpc();
```

EVM makes you do the approve → stake two-step, tracking allowances along the way. Solana bundles everything into a single transaction: you specify every account at signing time, the signature carries the authorization, and it's done.

## 5. Parsing Events

Listening to contract events is how the frontend reacts to on-chain changes — updating the UI when a stake lands, showing a confirmation, that kind of thing.

### 5.1 EVM

In EVM, events are `event` definitions in Solidity. When a transaction fires, it emits logs. Frontends can subscribe to live events or query historical ones from the same data source.

Real-time listening with wagmi's `useWatchContractEvent`:

```ts
useWatchContractEvent({
  address: STAKING_CONTRACT_ADDRESS,
  abi: stakingAbi,
  eventName: "Staked",
  // Only events for the current user
  args: userAddress ? { user: userAddress } : undefined,
  onLogs(logs) {},
});
```

Historical events with viem's [`getLogs`](https://viem.sh/docs/actions/public/getLogs#getlogs) (example only — not used in this demo):

```ts
const logs = await client.getLogs({
  address: STAKING_CONTRACT_ADDRESS,
  event: {
    type: "event",
    name: "Staked",
    inputs: [
      { name: "user", type: "address", indexed: true },
      { name: "amount", type: "uint256", indexed: false },
    ],
  },
  fromBlock: actualFromBlock,
  toBlock: actualToBlock,
});
```

EVM events are persistent (on chain forever), indexed parameters make filtering fast, and the same mechanism works for both live subscriptions and historical queries. It's a clean design.

### 5.2 Solana

Solana programs don't store events on chain. Events are output as program logs during execution, then they're gone. You can listen in real time, but there's no built-in way to query what happened yesterday.

Real-time listening with Anchor:

```ts
program.addEventListener("staked", (event, slot, signature) => {
  console.log("Staked event received:", { event, slot, signature });
});
```

This works fine for live UI updates. But if you need historical events — "show me all stakes from last month" — you'll need a third-party indexer. Helius, Triton, and others provide this. It's an extra dependency but the tradeoff is that on-chain storage stays lean.

## 6. Conclusion

This staking demo turns the theory from the first two articles into working frontend code. After building both sides, here's what actually differs:

Wallet integration is the most visible split. EVM: one wallet (MetaMask) plus standard components, done. Solana: multiple wallets, and skipping Wallet Adapter means writing per-wallet code paths that spiral fast.

Reading state is ABI + contract address on EVM, IDL + PDA on Solana. Anchor gives you something close to the ABI experience, which helps bridge the gap.

Writing transactions exposes a real design philosophy difference. EVM's approve-then-stake means two transactions and ongoing allowance tracking. Solana folds authorization into the signature itself — specify every account, sign once, done.

Events diverge hard. EVM gives you persistent logs that work for live and historical queries from the same data source. Solana's program logs are real-time only. Want history? You need a third-party indexer like Helius or Triton. It's extra infrastructure but the tradeoff is a leaner chain.

Between the preamble, the contracts article, frontend Part 1, and this demo, you've got the full path: concepts → contract migration → frontend adaptation → working code. Layer in fee optimization, retry logic, priority fees, and error handling, and you have a production-ready Solana frontend stack. Not a toy — the real thing.
