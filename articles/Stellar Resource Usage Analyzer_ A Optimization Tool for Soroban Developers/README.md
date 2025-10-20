---
title: "Stellar Resource Usage Analyzer: An Optimization Tool for Soroban Developers"
author: ["Sunny Bai / Full Stack Engineer"]
createTime: 2024-12-19
tags: ["Web3", "Stellar", "Soroban", "Developer Tools"]
thumb: "./thumb.png"
thumb_h: "./thumb.png"
intro: "An introduction article explaining the background and usage of @57block/stellar-resource-usage"
published: true
---

# Stellar Resource Usage Analyzer — ship Soroban contracts with confidence

## TL;DR — why this exists

Soroban makes Stellar powerful. It also makes performance harder to predict. If you’ve built on other chains, you know the drill: a function that looks fine on a local run can fail in production because of subtle resource limits.

We built @57block/stellar-resource-usage so teams can catch those issues earlier. It’s a lightweight tool that plugs into your tests, surfaces the multi-dimensional resource footprint of contract calls, and turns noisy numbers into clear, actionable suggestions.

Use it to avoid surprise failures, reduce iteration time, and make trade-offs with confidence — not guesswork.

![Hardhat Gas Reporter](./hardhat-gas-reporter.png)

## The problem, in plain language

Soroban doesn’t bill everything as a single "gas" number. Instead there are multiple resource dimensions — CPU, memory, ledger I/O, transaction size — and each one can cause a transaction to fail or become expensive.

What that means for teams:

- You can no longer optimize blindly. A change that saves CPU might increase writes and break limits.
- Debugging performance after deployment is slow and costly.

We wanted a tool that gives immediate clarity during development so teams can iterate faster and ship safer.

### How transaction fees are composed

At a high level, every Soroban transaction fee can be understood as a simple sum:

Transaction Fee = Resource Fee + Inclusion Fee

- Resource Fee: deterministic and tied to what the transaction consumed (compute, storage, I/O). It includes non-refundable work and refundable state rent components.
- Inclusion Fee: a market-driven component — essentially the bid you pay to get included in the ledger; it varies with congestion and transaction complexity.

Keeping both parts in mind helps you interpret the resource report: the tool focuses on the Resource Fee side (the deterministic, debuggable piece), while Inclusion Fee explains why fees can still vary in different network conditions.

## What the tool gives you (product highlights)

- Lightweight integration: one or two lines in tests, no large refactor.
- Clear terminal reports: concise tables that show which functions are expensive and why.
- Multi-dimensional metrics: cpu_insns, mem_bytes, read/write counts and bytes, tx size, and more.
- Developer-first UX: readable output, minimal noise, and suggestions you can act on today.

### Quick install

Pick your package manager:

```shell
npm i @57block/stellar-resource-usage
pnpm add @57block/stellar-resource-usage
bun add @57block/stellar-resource-usage
```

### Start a local node for realistic tests

If you have Docker, this helper gets you a local Soroban node quickly:

```shell
npx dockerDev [--port=your_port]
```

Wait until the node is fully synced before running tests.

## Important resource limits (what to watch)

These are the practical per-transaction limits we focus on when diagnosing issues:

| Resource Component    | Per-Transaction Limit | Why it matters                                        |
| :-------------------- | :-------------------- | :---------------------------------------------------- |
| CPU Instructions      | 100 Million           | Heavy algorithms explode this quickly                 |
| Memory Allocation     | 40 MB                 | Large allocations or unbounded buffers cause failures |
| Ledger Reads          | 40 entries            | Many small reads add up; consider indexing or caching |
| Ledger Writes         | 25 entries            | Writes are costly — batch or minimize when possible   |
| Ledger Read Bytes     | 200 KB                | Reading large blobs is expensive                      |
| Ledger Write Bytes    | 129 KiB               | Big writes drive storage rent and fees                |
| Transaction Size      | 129 KiB               | Affects inclusion fee and network costs               |
| Events / Return Value | 8 KB                  | Large returns or events increase tx size              |

Source: https://developers.stellar.org/docs/networks/resource-limits-fees#resource-limits

## How to use — three quick patterns

### 1) Swap the RPC server (minimal change)

Old:

```javascript
import { rpc } from "@stellar/stellar-sdk";
const rpcServer = new rpc.Server("http://localhost:8000/rpc", {
  allowHttp: true,
});
await rpcServer.sendTransaction(assembledTx);
```

New:

```javascript
import { StellarRpcServer } from "@57block/stellar-resource-usage";
const rpcServer = new StellarRpcServer("http://localhost:8000/rpc", {
  allowHttp: true,
});
await rpcServer.sendTransaction(assembledTx);
rpcServer.printTable();
```

### 2) Wrap generated TypeScript clients

```javascript
import { ResourceUsageClient } from "@57block/stellar-resource-usage";
import { Client } from "yourPath/to/module";

const WrappedClient = await ResourceUsageClient(Client, {
  /* options */
});
const res = await WrappedClient.run({
  /* ... */
});
await res.signAndSend();
WrappedClient.printTable();
```

### 3) Run tests

```shell
bun run your-script.ts
```

After your test run, a concise resource usage table will print to the console.

## From numbers to decisions — practical suggestions

The report is only useful when it leads to a clear action. Here are the most common patterns we recommend:

- High write_entries/write_bytes → combine state into structs, write deltas instead of full blobs, batch writes.
- High read_entries → add indices, cache read-heavy keys, or denormalize where appropriate.
- High cpu_insns → simplify algorithms, avoid nested loops, or trade space for time with indexed maps.
- High tx_size_bytes → trim redundant inputs/outputs, paginate, or move bulk data off-chain.

### Case study: reward calculation in a DAO

Problem: `calculate_rewards` repeatedly failed in tests.

Report snapshot:

| Function          | Resource  | Avg        | Max             | Limit       |
| :---------------- | :-------- | :--------- | :-------------- | :---------- |
| calculate_rewards | cpu_insns | 98,540,000 | **115,230,000** | 100,000,000 |

Diagnosis: a nested loop caused O(N×M) CPU growth.

Fix: change the data model — maintain an indexed map that accumulates points per (user, period) as contributions arrive. The final calculation becomes a single lookup per user.

Outcome after refactor:

| Function          | Resource  | Avg       | Max       | Limit       |
| :---------------- | :-------- | :-------- | :-------- | :---------- |
| calculate_rewards | cpu_insns | 8,200,000 | 9,150,000 | 100,000,000 |

Result: CPU dropped by an order of magnitude; tests passed. That’s the sort of decisive improvement this tool helps surface.

## Roadmap — what’s next

We designed this tool for local development, but we want it to be part of a complete workflow:

- machine-readable outputs for CI and dashboards
- threshold-based alerts (fail PRs when limits regress)
- historical baselines and diffs to detect regressions early
- optional visualizations for product/ops teams

If you try it, please tell us where it helped — or where it didn't. Real-world feedback drives what we build next.

---

Thank you for reading. We hope you found this tool useful.
