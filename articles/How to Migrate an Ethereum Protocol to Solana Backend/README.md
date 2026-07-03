---
published: true
title: "How to Migrate an Ethereum Protocol to Solana — Backend"
author: ["Jimmy Zhao / Fullstack Engineer", "Bin Li / Tech Lead"]
createTime: 2026-06-26
categories: ["engineering"]
subCategories: ["Blockchain & Web3"]
tags: ["Solana", "Ethereum", "Backend", "Indexer", "NestJS", "Anchor"]
landingPages: ["Blockchain"]
thumb: "./thumb.png"
thumb_h: "./thumb_h.png"
intro: "How to index Solana transaction logs, run cron jobs against on-chain state, and ship a NestJS backend for an EVM-to-Solana migration."
---

## Article Overview

Contracts encode the rules, but most Web3 products still need a backend: historical stats, reward math, user activity tracking, and ops alerts. On Ethereum that often means `eth_getLogs` against indexed events. On Solana you pull transactions yourself and parse `logMessages`.

This article is part of a broader series on migrating Ethereum protocols to Solana. We split the work across contracts, backend, and frontend — each post builds on the same staking example in [evm-to-solana](https://github.com/57blocks/evm-to-solana).

**You are here:** Backend — event sync, log parsing, cron automation, and deployment.

If you're new to the series, start with the [Preamble](https://57blocks.com/blog/how-to-migrate-an-ethereum-protocol-to-solana-preamble) for account models, execution, and fees, then the [Contracts](https://57blocks.com/blog/how-to-migrate-an-ethereum-protocol-to-solana-contracts-part-1) guides. The [Frontend](https://57blocks.com/blog/how-to-migrate-an-ethereum-protocol-to-solana-frontend-part-1) guides cover wallet and client patterns on the other side of the stack.

| Layer      | Article                                                                                                                                                                                                 | What it covers                                 |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| Foundation | [Preamble](https://57blocks.com/blog/how-to-migrate-an-ethereum-protocol-to-solana-preamble)                                                                                                            | Account model, execution, fees                 |
| Contracts  | [Part 1](https://57blocks.com/blog/how-to-migrate-an-ethereum-protocol-to-solana-contracts-part-1) / [Part 2](https://57blocks.com/blog/how-to-migrate-an-ethereum-protocol-to-solana-contracts-part-2) | Account model, CPI, PDAs, limits, staking port |
| Frontend   | [Part 1](https://57blocks.com/blog/how-to-migrate-an-ethereum-protocol-to-solana-frontend-part-1) / [Part 2](https://57blocks.com/blog/how-to-migrate-an-ethereum-protocol-to-solana-frontend-part-2)   | Wallets, ALTs, staking demo, events            |
| Backend    | **[Backend (this article)](https://57blocks.com/blog/how-to-migrate-an-ethereum-protocol-to-solana-backend)**                                                                                           | Event sync, log parsing, cron automation       |

Here we walk through event sync, log parsing, account selection for `getSignaturesForAddress`, cron automation, and deployment. The running example is the Anchor staking pool from the series (`PoolConfig`, `PoolState`, `UserStakeInfo`). Code lives in [solana-backend](https://github.com/57blocks/evm-to-solana/tree/main/backend/solana-backend).

## What a Solana Backend is for

Smart contracts set business rules, but chain execution and query costs push most products to off-chain services for history, scoring, analytics, and monitoring.

On EVM chains, nodes index contract events. A backend calls `eth_getLogs`, filters by topic, and stores rows. Solana has no equivalent typed event index. Anchor `#[event]` writes bytes into transaction logs, but you cannot query "all `Staked` events" from RPC. Logs are strings; filtering by event type is your job.

The shift is from waiting on push-style event subscriptions to pulling signatures for chosen accounts, fetching transactions, and parsing logs. That thread runs through the rest of this post. We use the series staking program as the example; full backend source is in [solana-backend](https://github.com/57blocks/evm-to-solana/tree/main/backend/solana-backend).

## Core Mindset Shifts

### Parsing On-chain Events

EVM backends follow a comfortable loop: contract emits, node indexes, backend filters. Solana does not offer that loop. Anchor events land in logs only. There is no RPC to list events by type. You start from an account address, list signatures with `getSignaturesForAddress`, fetch each transaction, and parse `logMessages`.

The gap is indexing. EVM nodes build topic and bloom filters so you can filter by event signature. Solana validators and archive nodes keep history and logs, but not a structured event index. Program output is unstructured text until your parser turns it into rows. Third-party indexers can help, but the default RPC path is: logs in, events out, all in your service.

### Choosing Which Account to Watch

`getSignaturesForAddress` returns transactions that touch an address. What you watch defines noise, cost, and completeness.

- **Global protocol activity:** watch `PoolConfig` PDA for admin updates, reward rate changes, and pool-level TVL moves. User stakes that do not touch config never appear here.
- **One user:** watch the wallet or that user's `UserStakeInfo` PDA for a low-noise stream of their stakes and claims.
- **Token transfers everywhere:** do not assume the mint address shows up. [SPL Token](https://solana.com/docs/tokens/basics) `transfer` lists source and destination token accounts, not the mint. [Token-2022](https://www.solana-program.com/docs/token-2022) `transfer_checked` includes the mint, so `getSignaturesForAddress(mint)` can work for that path. For plain SPL transfers, use a token transfer API from Solscan, Helius, or similar instead of mint-based signature polling.

## Solana Event Filtering Gotchas

### Pagination cursors must be real signatures

`getSignaturesForAddress` is the core interface for event capture. Its `before` and `until` parameters take transaction signatures, not slot numbers or timestamps. To sync a slot range, call `getBlock` over the range, pick a block that contains transactions, and use a signature from that block as the cursor. If the range is empty blocks only, walk forward or backward until you hit a non-empty block.

### Failed transactions can still leave logs

On EVM, a reverted transaction drops its events. On Solana, logs emitted before failure stay in `logMessages`. RPC returns them. If you parse without checking status, you can persist state changes that never committed. Check `tx.meta.err` at the pipeline entry; only proceed when it is `null`.

### Account WebSocket subscriptions are not event feeds

You can subscribe to account data changes over WebSocket, but that tells you an account mutated, not which instruction ran or what event fired. You still infer semantics from diffs and logs. Connections drop; you need reconnect and backfill logic. It's a bad fit for large-scale accounts or high-throughput use cases.

### Production alternative: Geyser / Yellowstone

This article focuses on RPC polling, which is fine for prototypes and moderate volume. For lower latency and higher throughput, [Geyser gRPC (Yellowstone)](https://github.com/rpcpool/yellowstone-grpc) streams validator data without polling RPC. Helius, Triton (Yellowstone maintainers), and QuickNode offer hosted feeds.

Pick polling vs Geyser roughly like this:

- **Volume:** hundreds to a few thousand relevant txs per day fits RPC polling with batching and sleep between calls. Tens of thousands per day usually pushes you toward Geyser to cut latency and RPC load.
- **Latency:** cron plus RPC round trips often means seconds to minutes. Geyser can reach sub-second delivery for liquidations, bots, or live dashboards.
- **Ops:** polling needs only RPC URLs. Geyser needs a gRPC endpoint or your own Yellowstone node; setup costs more upfront but avoids aggressive rate limits on heavy `getTransaction` loops.

## The Guide to Solana Backend Best Practices

Two jobs show up in almost every Web3 backend: **event indexing** (pull chain history, parse logs, write a database) and **automation** (cron that reads state and optionally sends transactions). While both are scheduled via cron, they serve different purposes and don't interfere with each other. Here is a breakdown of each.

### Event Indexing

There is no `get events by type` RPC. Your backend needs a complete event synchronization pipeline: contract event shape, signature discovery, transaction fetch, parse, cursor persistence.

#### Contract Side: Put Enough in The Event

When designing Anchor events, include fields the backend needs even if on-chain logic ignores them.

Minimal `Staked` event:

```
#[event]
pub struct Staked {
    pub user: Pubkey,
    pub amount: u64,
    pub timestamp: i64,
}
```

After parsing, the backend still needs total stake and reward debt, which means another RPC read of `UserStakeInfo`:

```
const [userStakePda] = PublicKey.findProgramAddressSync(
  [Buffer.from("stake"), statePda.toBuffer(), user.toBuffer()],
  programId
);
const accountInfo = await connection.getAccountInfo(userStakePda);
const totalStaked = coder.accounts.decode(
  "UserStakeInfo",
  accountInfo.data
).amount;
```

Extra fields on the event avoid that round trip:

```
#[event]
pub struct Staked {
    pub user: Pubkey,
    pub amount: u64,
    pub timestamp: i64,
    pub total_staked: u64,
    pub reward_debt: i128,
}
```

Log space is cheap on Solana. Trading a few extra bytes per tx for one fewer RPC call per event is usually worth it.

#### Server Side: The Sync Pipeline

Four steps: resolve start signature, list signatures, fetch and parse txs, persist progress in batches.

**Step 1: turn a slot into a signature cursor**

As above, cursors must be signatures. Example helper:

```
private async getStartTransactionSignature(
  connection: Connection,
  lastSyncedSlot: number
) {
  const blockHistories = await connection.getBlocks(
    lastSyncedSlot,
    lastSyncedSlot + this.config.slotToCheck
  );

  for (let i = 0; i < blockHistories.length; i++) {
    // getBlock is a heavy operation, taking about 5 seconds
    const startBlock = await connection.getBlock(blockHistories[i], {
      maxSupportedTransactionVersion: 0,
      rewards: false,
      transactionDetails: "accounts",
    });

    if (!startBlock) {
      throw new Error(`Failed to fetch block at slot ${blockHistories[i]}`);
    }

    const transactions = startBlock.transactions;
    if (transactions.length > 0) {
      return {
        startBlockSlot: blockHistories[i],
        startSignature: transactions[0].transaction.signatures[0],
      };
    }
  }

  throw new Error(
    `No valid transactions found between slot ${lastSyncedSlot} and ${
      lastSyncedSlot + this.config.slotToCheck
    }`
  );
}
```

If the target slot is empty, scan adjacent slots until you find one with transactions. End-signature lookup is the same idea in reverse.

**Step 2: list signatures for the monitored account**

After you have start and end signatures, call `getSignaturesForAddress` to pull the transaction signatures for the account. Results arrive newest-first; reverse to chronological order before processing.

```
let beforeSignature = endBlockInfo.endSignature;
let sigsCount = this.config.signaturesPerBatch;

while (sigsCount >= this.config.signaturesPerBatch) {
  const sigs = await connection.getSignaturesForAddress(
    new PublicKey(monitorAddress),
    {
      limit: this.config.signaturesPerBatch,
      until: startBlock.startSignature,
      before: beforeSignature,
    }
  );

  sigsCount = sigs.length;
  if (sigsCount > 0) {
    beforeSignature = sigs[sigsCount - 1].signature;
    sigList.unshift(...sigs.reverse().map((sig: any) => sig.signature));
    await sleep(this.config.sleepTime);
  }
}
```

- `before` walks backward in time.
- `reverse` then `unshift` keeps the full list oldest-first.
- `sleep` between calls to stay inside RPC rate limits.

**Step 3: fetch transactions, drop failures, parse events**

Batch `getParsedTransaction` with `Promise.all` inside each batch; sleep between batches.

```
for (let i = 0; i < sigList.length; i += batchSize) {
  const promises = [];
  for (const sig of sigList.slice(i, i + batchSize)) {
    promises.push(
      this.solanaEventsService.parseTransactionEvents(
        this.chainId,
        sig,
        eventsParser
      )
    );
  }
  const eventsList = await Promise.all(promises);
  for (const events of eventsList) {
    parsedEvents.push(...events);
  }
  await sleep(this.config.sleepTime);
}
```

Per-transaction parser: fetch, check `meta.err`, then run the event parser.

```
async parseTransactionEvents(
  chainId: number,
  sig: string,
  eventsParser: TransactionEventsParser
): Promise<BaseEvent[]> {
  const connection = this.solanaConnections.getConnection(chainId);
  const ptx = await connection.getParsedTransaction(sig, {
    maxSupportedTransactionVersion: 0,
  });

  if (!ptx) {
    console.error(`Can not get the parsed transaction from rpc, txhash: ${sig}`);
    return [];
  }

  // Check tx.meta.err first. Only guard against writing dirty data from failed txs.
  if (ptx.meta?.err) {
    return [];
  }

  return eventsParser.parseEvents({ tx: ptx, sig });
}
```

**Step 4: persist progress per batch**

Update the sync cursor after each batch, not after the full run finishes.

```
async onBatchFetched(batchResult) {
  const userActivities = [];
  for (const event of batchResult.events) {
    try {
      const activity = this.convertEventToUserActivity(event, poolConfig);
      userActivities.push(activity);
    } catch (error) {
      console.warn(`Failed to convert event ${event.transactionHash}:`, error);
    }
  }

  for (const activity of userActivities) {
    await this.userActivityRepository.save(activity);
  }

  const updatedSyncStatus = syncStatus.updateLastSyncBlock(
    batchResult.endBlockNumber
  );
  await this.syncStatusRepository.save(updatedSyncStatus);
}
```

If you only save the cursor at the end, a crash mid-run loses all progress. Batch checkpoints let restarts resume from `lastSyncBlock`.

### Automation Tasks

Besides indexing history, backends often run cron jobs: read vault balances, alert ops, or send admin transactions. Indexing replays the past; automation reacts on a schedule.

In [solana-backend](https://github.com/57blocks/evm-to-solana/tree/main/backend/solana-backend), `PoolBalanceMonitorService` checks each pool's reward vault on a cron. It opens an alert when balance drops below a threshold and clears it when balance recovers.

#### Read Current On-chain State

Derive the reward vault PDA and read SPL token balance:

```
async getRewardVaultBalance(poolConfig: string): Promise<RewardVaultBalance> {
  const programId = new PublicKey(StakingIDL.address);
  const poolConfigPda = new PublicKey(poolConfig);
  const [rewardVaultPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("reward_vault"), poolConfigPda.toBuffer()],
    programId
  );

  const connection = this.solanaConnections.getConnection(this.chainId);
  const balance = await connection.getTokenAccountBalance(rewardVaultPda);

  return {
    rewardVault: rewardVaultPda.toBase58(),
    uiAmount: balance.value.uiAmount,
    rawAmount: balance.value.amount,
  };
}
```

This is a very common pattern: derive PDA, read account, return typed result.

#### Threshold Alerts without Spam

Compare balance to threshold; create or resolve alerts.

```
private async checkPoolBalance(poolConfig: string): Promise<void> {
  const threshold = this.config.getOrThrow<number>("REWARD_BALANCE_THRESHOLD");
  const balance = await this.rewardVaultReader.getRewardVaultBalance(poolConfig);

  if (balance.uiAmount >= threshold) {
    // Balance recovered, resolve any open alerts
    const openAlert = await this.alertRepository.findOpenAlert(
      poolConfig,
      LOW_REWARD_BALANCE
    );
    if (openAlert) {
      await this.alertRepository.resolveOpenAlert(poolConfig, LOW_REWARD_BALANCE);
    }
    return;
  }

  // Balance below threshold; check for existing open alerts to avoid duplicates
  const openAlert = await this.alertRepository.findOpenAlert(
    poolConfig,
    LOW_REWARD_BALANCE
  );
  if (openAlert) {
    return;
  }

  await this.alertRepository.save({
    poolConfig,
    alertType: LOW_REWARD_BALANCE,
    message: `Reward vault balance is below threshold`,
    threshold: String(threshold),
    actualValue: String(balance.uiAmount),
    createdAt: Math.floor(Date.now() / 1000),
    resolved: false,
  });
}
```

Two details matter: skip creating a duplicate open alert, and resolve when balance recovers so on-call is not stuck with stale pages.

## Case Study: solana-backend

In the previous chapters, we covered event synchronization, limitations and workarounds, and the implementation details of the two core tasks. Now, let's tie it all together and walk through building a complete backend system.The event pipeline was described earlier; we add off-chain reward math and sync cursor bootstrap.

### Project layout

[solana-backend](https://github.com/57blocks/evm-to-solana/tree/main/backend/solana-backend) is TypeScript on NestJS.

```
solana-backend/
├── src/
│   ├── autotask/          # cron: balance checks + alerts
│   ├── event-fetch/       # signature fetch + tx parse
│   ├── indexer/           # cron scheduler for sync
│   ├── repositories/      # Prisma + on-chain reads
│   └── domain-services/   # off-chain reward math
├── prisma/                # schema + SQLite
├── Dockerfile
└── docker-compose.yml
```

- `event-fetch` talks to Solana RPC.
- `indexer` registers cron jobs for sync runs.
- `autotask` runs separate cron pipelines from indexing.
- `domain-services` mirrors on-chain reward formulas with BigInt.
- `repositories` wrap Prisma and PDA reads.

### Implementation Notes

#### Off-chain Reward Calculation

The staking program uses a [MasterChef](https://github.com/sushiswap/masterchef)-style accumulator: update `acc_reward_per_share` before each action, then derive pending rewards from user stake and `reward_debt`. The backend copies the same math in BigInt so API queries do not hit RPC every time.

```
// src/domain-services/RewardCalculationService.ts
projectedAccRewardPerShare(
  state: PoolState,
  config: PoolConfig,
  now: bigint
): bigint {
  if (now <= BigInt(state.lastRewardTime) || state.totalStaked === 0n) {
    return state.accRewardPerShare;
  }
  const reward = (now - BigInt(state.lastRewardTime)) * config.rewardPerSecond;
  const accIncrement = (reward * ACC_REWARD_PRECISION) / state.totalStaked;
  return state.accRewardPerShare + accIncrement;
}

pendingRewards(
  user: { amount: bigint; rewardDebt: bigint },
  state: PoolState,
  config: PoolConfig,
  now: bigint
): bigint {
  const acc = this.projectedAccRewardPerShare(state, config, now);
  const accumulated = (user.amount * acc) / ACC_REWARD_PRECISION;
  const pending = accumulated - user.rewardDebt;
  return pending > 0n ? pending : 0n;
}
```

BigInt end to end avoids JavaScript float bugs. API handlers call `pendingRewards`; callers do not need the on-chain formula.

#### Sync Cursor Bootstrap

The backend uses the `SyncStatus` table to track each pool's sync progress. The `db:init` script reads the `POOL_CONFIGS` env variable and populates the database with each pool's starting slot.

```
// scripts/db/init-db.ts
const entries = process.env.POOL_CONFIGS.split(",");
for (const entry of entries) {
  const [poolConfigPda, slot] = entry.split(":");
  await prisma.syncStatus.create({
    data: {
      poolConfig: poolConfigPda,
      lastSyncBlock: Number(slot),
    },
  });
}
```

Each batch updates `lastSyncBlock`. Restarts continue from the last checkpoint without double-inserting or skipping ranges.

### Tests

[Jest](https://jestjs.io/) unit tests mock RPC and the database via injected interfaces.

`EventIndexingService` tests cover cron registration and overlap protection:

```
// src/indexer/event-indexing.service.spec.ts
it("registers the event-indexing cron job on module init", () => {
  service.onModuleInit();
  expect(schedulerRegistry.addCronJob).toHaveBeenCalledWith(
    "event-indexing",
    expect.any(Object)
  );
});

it("blocks overlapping sync cycles", async () => {
  service.onModuleInit();
  let resolveRun: () => void;
  mockRunOnce.mockReturnValue(
    new Promise<void>((resolve) => {
      resolveRun = resolve;
    })
  );
  const firstRun = service.tick();
  const secondRun = service.tick();
  // First cycle still running, second is skipped
  expect(mockRunOnce).toHaveBeenCalledTimes(1);
  resolveRun!();
  await Promise.all([firstRun, secondRun]);
});
```

A sync pass can outlast the cron interval. An `isRunning` flag drops overlapping ticks so only one sync runs at a time.

`PoolBalanceMonitorService` tests the alert lifecycle:

```
// src/autotask/pool-balance-monitor.service.spec.ts
it("goes through the full alert lifecycle: create → resolve → create again", async () => {
  // Balance below threshold → create alert
  rewardVaultReader.getRewardVaultBalance.mockResolvedValue({
    rewardVault: "reward-vault",
    uiAmount: 5,
    rawAmount: "5",
  });
  await service.tick();
  expect(alertRepository.save).toHaveBeenCalledTimes(1);

  // Balance recovered → resolve alert
  rewardVaultReader.getRewardVaultBalance.mockResolvedValue({
    rewardVault: "reward-vault",
    uiAmount: 15,
    rawAmount: "15",
  });
  await service.tick();
  expect(alertRepository.resolveOpenAlert).toHaveBeenCalledTimes(1);

  // Balance below threshold again → create new alert
  rewardVaultReader.getRewardVaultBalance.mockResolvedValue({
    rewardVault: "reward-vault",
    uiAmount: 3,
    rawAmount: "3",
  });
  await service.tick();
  expect(alertRepository.save).toHaveBeenCalledTimes(2);
});
```

Mocked `rewardVaultReader` and `alertRepository` stand in for RPC and the DB.

### Deployment

Multi-stage Docker keeps the runtime image small:

```
FROM node:20-alpine AS builder
WORKDIR /app
RUN apk add --no-cache python3 make g++ && corepack enable
COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma
COPY idl ./idl
RUN pnpm install --frozen-lockfile
COPY src ./src
RUN pnpm db:generate && pnpm build

FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
RUN corepack enable
COPY --from=builder /app/package.json /app/pnpm-lock.yaml ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/idl ./idl
CMD ["node", "dist/src/main.js"]
```

`docker-compose.yml` mounts `./prisma` so SQLite survives container restarts:

```
services:
  solana-backend:
    build: .
    env_file: .env
    ports:
      - "3000:3000"
    volumes:
      - ./prisma:/app/prisma
    restart: unless-stopped
```

Typical deploy:

```
docker compose build solana-backend
docker compose run --rm solana-backend ./node_modules/.bin/prisma db push
docker compose run --rm solana-backend node dist/scripts/db/init-db.js
docker compose up -d
```

`db push` creates tables, `db:init` writes sync cursors, `up -d` starts the app. Use `docker compose logs -f solana-backend` for logs.

## Summary

Solana backends cannot rely on typed event queries like `eth_getLogs`. You pick accounts to watch, page signatures, fetch transactions, parse logs, and checkpoint progress. Filter failed txs at `tx.meta.err`. For volume or latency, consider Geyser instead of RPC polling.

[solana-backend](https://github.com/57blocks/evm-to-solana/tree/main/backend/solana-backend) shows the layout: event-fetch and indexer for history, autotask for vault monitoring, BigInt reward math off-chain, Jest with mocks, Docker deploy.

On EVM, the node often prepares the data layer for you. On Solana, the backend is that layer. Slot-to-signature cursors, reversed signature lists, and batch checkpoints are tedious, but they also mean you control exactly what gets indexed.

## References

- [Solana RPC Overview](https://solana.com/docs/rpc)
- [SPL Token](https://solana.com/docs/tokens/basics)
- [Token-2022](https://www.solana-program.com/docs/token-2022)
- [Geyser gRPC (Yellowstone)](https://github.com/rpcpool/yellowstone-grpc)
- [MasterChef](https://github.com/sushiswap/masterchef)
