---
published: true
title: "Web3 Intents Based Systems and How LI.FI is Pushing Cross-Chain Swaps Evolution"
author: ["Kamil Krupa"]
createTime: 2025-07-17
categories: ["business"]
subCategories: []
tags: ["Cross-chain transactions", "Intent based swaps", "Chain interoperability"]
landingPages: []
heroColor: 
thumb: "./thumb.png"
thumb_h: "./thumb_h.png"
intro: "How intent-based swaps revolutionize cross-chain transactions making crypto UX simple and secure."
previousSlugs: ["ai-driven-workflows"]
---

We've been thinking a lot lately about what it really means to build technology that people want to use.

Take crypto today - many users want to chase better yields, buy an NFT on a different chain, or participate in a DAO that doesn't live where their assets are. These are real motivations that drive cross-chain activity, but the process still feels unnecessarily complex.

You know that feeling when something should be simple - like transferring money or booking a flight - but the steps are so frustrating you question whether it's worth it? That's how many feel about crypto users' experience today.

Instead of forcing users to figure out how to move their assets including bridges, gas tokens, and token standards, it's more effective to let them focus on what they want to achieve - not on how to get there.

Our collaboration with [LI.FI](https://li.fi/) is about more than bridging a technical gap. It shows the industry that seamless, secure cross-chain transactions are achievable today. Empowering LI.FI to aggregate liquidity across multiple DEXs and blockchains pushes the boundaries of what end-users and developers can accomplish in the DeFi space:

- **Transforming the user experience today.** Every upgrade to [LI.FI](https://li.fi/)'s aggregation engine means crypto users can swap assets cross-chain more easily and cost-effectively. There's no need to understand the complexities beneath the surface; the best price and path are just a click away. This simplicity is powering a new standard for user-centric DeFi.
- **Leading the conversation on what's next.** Our work intersects with the evolution of intent-based systems, an innovation that goes far beyond swaps. We see emerging opportunities for intent-driven lending, staking, and borrowing solutions that could make complex operations as easy as submitting a single request. Imagine rebalancing your portfolio, participating in a staking opportunity, or borrowing against assets across multiple chains with one action, all orchestrated behind the scenes for the user.
- **Seamless blockchain interoperability and mainstream adoption.** As this technology matures, interoperability between blockchains will become seamless to the end user; they'll simply express what they want, and the most efficient path will be executed instantaneously, regardless of chain or liquidity source. This paves the way for the broader adoption of DeFi, making crypto as seamless and accessible as any mainstream financial app.

## The Challenge: Making Cross-Chain Transactions User-Friendly

Let's start with a reality check. Picture this. You're a user who wants to swap some tokens from one blockchain to another. Sounds simple, right? But here's what you must do to fulfill your cross-chain transactions request:

1. Find a bridge that supports your asset and destination chain
2. Pay gas fees on the source blockchain
3. Wait for the bridge to complete your transaction to receive assets on destination chain
4. If you don't have it yet, send yourself relevant assets to pay for the gas on the destination chain (ETH, Sol. APT, BNB or other)
5. Manually swap your bridged assets on a DEX on a destination chain 
6. Pay more gas fees for the swap on the destination blockchain
7. Hope you, or your bridge, didn't make a mistake along the way

It's like trying to exchange currency by visiting two different banks, filling out forms at each one, and paying fees every step of the way. No wonder mainstream adoption has been slow, and cross-chain transactions remain intimidating for most users. Complex processes frustrate users. They're also an opportunity to build something better.

## A Partnership for Secure, User-Centric Web3

That's why we're thrilled to be working closely with [LI.FI](https://li.fi/), a company that's tackling this exact challenge head-on. From our first conversations with their team, it was clear we shared the same fundamental belief that technology should empower users, not overwhelm them.

![[LI.FI](https://li.fi/)](./logo-lifi.png){.d-block .mx-auto .mw-100 .my-3}

[LI.FI](https://li.fi/) is launching intent-based cross-chain swaps, and it's about to change how people think about moving money across different blockchains. Think of it like this. Instead of telling the system how to do something step by step, you just tell it what you want to achieve. It's like calling an Uber instead of planning your own route with multiple bus transfers.


![Without intents VS With intents](./compare-intents.png){.d-block .mx-auto .mw-100}

## Revolutionizing Cross-Chain Transactions with Intent-Based Solutions

[LI.FI](https://li.fi/)'s intents based cross-chain transactions solution works like a marketplace where you express what you want, and specialized service providers (called solvers) compete to give you the best deal.

Here's what that looks like on the user's end:

1. You make a request: "I want to swap 100 USDC on Ethereum for MATIC on Polygon"
2. The intents-based application's logic finds the best way: Multiple solvers compete to offer you the best rate
3. It happens instantaneously: The winning solver facilitates finalization of transactions through smart contracts, aggregators, oracles, and protocol infrastructure behind the scenes
4. You get your tokens: Fast, cheap, and without the headache

EXAMPLE / REFERENCE GRAPH FOR DESIGNERS:

![Reference for designers](./reference-for-designers.png){.d-block .mx-auto .mw-100}

It's like having a personal assistant who knows all the best routes and handles all the paperwork while you focus on what matters to you. This approach transforms cross-chain transactions from a technical nightmare into a seamless experience.

## Real Security, Real Innovation

[LI.FI](https://li.fi/)'s <i>“Open Intent Framework”</i> (ERC‑7683) standardizes the way to express cross-chain intents, enabling any frontend, wallet, or protocol to describe what a user wants without prescribing how it should be fulfilled. For execution, [Resource Locks](https://li.fi/knowledge-hub/li-fi-intents-are-taking-over-resource-locks-make-them-scale/) - used in implementations like [Uniswap's Compact](https://github.com/Uniswap/the-compact) - ensure secure escrow during the transaction. This design prevents users from withdrawing funds prematurely and guarantees that solvers can only settle intents with a matching orderHash proven on the destination chain. Together, these frameworks ensure that funds remain safe and solvers are only compensated after successful fulfillment.

![Without standard for intent expression VS With standarized intend expression ERC-7683](./compare-intent-expression.png){.d-block .mx-auto .mw-100}

### Cross-Chain from the Start

While many solutions focus on just a few popular blockchains, building for the multi-chain is the future. Including Bitcoin support, which is more complex than filling EVM orders, is surprisingly rare in this space. This forward-thinking approach aligns perfectly with building for tomorrow, not just today, and ensures cross-chain transaction platforms can handle whatever the future brings.

## Unlocking Cross-Chain Liquidity: Why [LI.FI](https://li.fi/)'s Evolution Matters

As [LI.FI](https://li.fi/) continues to evolve, its role in the multi-chain DeFi landscape becomes even more significant. We're helping LI.FI accelerate its mission by advancing its DEX aggregation service, expanding its reach across blockchains, and seamlessly unlocking new liquidity sources. These enhancements have a broad impact throughout the ecosystem.

Several major DeFi projects have embraced intent-based systems, each putting their spin on simplifying how users trade or move assets:

<div class="row">
  <div class="col-12 col-md-6 mb-3">
    <div style="box-shadow: 6px 4px 0px 0px rgba(var(--bs-info-rgb), var(--bs-border-opacity)); font-size: 14px;" class="h-100 p-3 rounded-1 border border-info">
      <img alt="Logo" src="./logo-cow-swap.png" height="32" style="height: 32px;" />
      <p class="mb-0"><strong>CoW Swap</strong> (abbr. for Coincidence of Wants) launched in <strong>April 2021</strong>, enabling intent-based trading on a single chain via CoW-based atomic swaps that match compatible user orders directly. It uses a Dutch Auction mechanism to incentivize solver competition, reducing MEV risk and allowing for positive slippage. CoW Swap's design has influenced cross-chain development by showing that a healthy solver marketplace doesn't require a dominant player.</p>
    </div>
  </div>
  <div class="col-12 col-md-6 mb-3">
    <div style="box-shadow: 6px 4px 0px 0px rgba(var(--bs-info-rgb), var(--bs-border-opacity)); font-size: 14px;" class="h-100 p-3 rounded-1 border border-info">
      <img alt="Logo" src="./logo-across-protocol.png" height="32" style="height: 32px;" />
      <p class="mb-0"><strong>Across Protocol</strong> began as a bridge and has been natively intents‑based since its launch in <strong>late 2021</strong>. It retained its own relayer (solver) as the primary fulfiller of orders through much of 2024, even as external solver participation grew. It supports a more diverse solver network today and contributed to the development of standards like ERC‑7683 to enable broader interoperability.</p>
    </div>
  </div>
  <div class="col-12 col-md-6 mb-3">
    <div style="box-shadow: 6px 4px 0px 0px rgba(var(--bs-info-rgb), var(--bs-border-opacity)); font-size: 14px;" class="h-100 p-3 rounded-1 border border-info">
      <img alt="Logo" src="./logo-1inch-fusion.png" height="32" style="height: 32px;" />
      <p class="mb-0"><strong>In 2022, 1inch Fusion</strong> and <strong>Fusion+</strong> enabled gasless swaps on a single blockchain, using professional "solvers" to prevent front-running. In 2024, Fusion+ added cross-chain swaps without external bridges, all powered by a secure Dutch auction system. 1inch's proven technology and large user base helped build trust in intent-based swapping.</p>
    </div>
  </div>
  <div class="col-12 col-md-6 mb-3">
    <div style="box-shadow: 6px 4px 0px 0px rgba(var(--bs-info-rgb), var(--bs-border-opacity)); font-size: 14px;" class="h-100 p-3 rounded-1 border border-info">
      <img alt="Logo" src="./logo-uniswapx.png" height="32" style="height: 32px;" />
      <p class="mb-0"><strong>UniswapX</strong> introduced an intent-based system to Uniswap <strong>in 2023</strong>, enabling gas-free swaps filled by off-chain solvers through auctions. The protocol also helped shape the ERC-7683 standard for compatibility among intent-based protocols. Initially, solver participation was restricted, with plans to open it up over time.</p>
    </div>
  </div>
</div>

[LI.FI](https://li.fi/) distinguishes itself by offering a flexible, modular system that supports many blockchains from the start and features a permissionless solver network. Its secure smart contracts guarantee safe trades. Unlike 1inch and Uniswap, which use intent models within existing platforms and push new standards, LI.FI aims for an adaptable infrastructure that unifies cross-chain trading under one process and standard, making it easy for developers and wallet builders to adopt and support industry-wide interoperability.

[LI.FI](https://li.fi/)'s solution is built in accordance with [Open Intents Framework](https://www.openintents.xyz/), an open open-source framework aiming to bring permissionless intents to everyone, supported by, outside of LI.FI, also teams from Arbitrum, Optimism, Scroll, Polygon, Gnosis, Gelato, Starknet, zkSync and others.

![Open Intents Framework](./logo-open-intents-framework.png){.d-block .mx-auto .mw-100}

A common challenge across intent-based protocols is incentivizing healthy solver competition. Running a solver and being profitable is hard - it requires capital, infrastructure, and smart routing. But when multiple solvers compete, it leads to better-priced quotes, faster execution, and more reliable fulfillment, since solvers race to win orders by being first in. At the same time, protocols must still navigate the complexity of working across diverse blockchain stacks. The move to intent-based designs is rapidly picking up momentum, driven by a need for smoother user experiences and safer transactions, but these dynamics will shape the next phase of adoption.

![Intents Solvers](./intents-solvers.png){.d-block .mx-auto .mw-100}

### For Users: Effortless Swapping Across Chains

With a vastly expanded network of integrated DEXs and liquidity pools, users can enjoy best-price execution for cross-chain swaps with no hassle and no fragmented interfaces. Swapping assets across different blockchains becomes a smooth, intuitive experience, with more opportunities and less friction.

### For Developers and Projects: Building on a Stronger Foundation

Teams building next-generation DeFi apps benefit from [LI.FI](https://li.fi/)'s robust DEX aggregator and cross-chain infrastructure. Instead of spending resources on piecing together multi-chain connectivity and liquidity themselves, they can focus on innovating their core products while relying on LI.FI's ever-growing reach and execution capabilities. With intent-based architecture, user acquisition becomes easier - users can onboard by simply signing a transaction that expresses their intent to move assets to a specific chain, app, or protocol. This seamless flow lowers onboarding friction and lets projects lock in capital more efficiently.

### For the Industry: Pushing Multi-Chain Interoperability Forward

Rapidly connecting with new chains and liquidity sources sets benchmarks for interoperability and accessibility. This collaborative and forward-thinking approach, including contributions to standards like ERC-7683, strengthens the entire cross-chain ecosystem and inspires greater industry cohesion.

## What 57Blocks Brings to the Table

At 57Blocks, we're not just along for the ride. We're actively contributing to cross-chain wide DeFi adoption and [LI.FI](https://li.fi/)'s expansion helping shape the future of cross-chain technology. Our partnership involves building and testing the DEX aggregation solution while also unlocking new liquidity across the Web3 ecosystem.

This partnership represents something bigger than just a technical collaboration. It's about making complex cross-chain transactions accessible to real people.

### Lessons for Product Development

The most successful products prioritize outcomes over processes, recognizing that users care fundamentally about what they achieve rather than involving them in the behind-the-scenes mechanics of how it happens. This user-centric approach should be paired with building for collaboration, as the best cross-chain transactions solutions work seamlessly with others rather than operating in isolation.

Finally, security doesn't have to mean complexity. Robust systems can maintain simplicity in their user experience while delivering enterprise-grade protection and reliability.

The future of technology isn't just about building more features. It's about making powerful capabilities accessible to everyone. That's exactly what we're doing with [LI.FI](https://li.fi/) in the cross-chain transactions space, and it's what we can do for your project too.

The best part? You don't have to choose between innovation and usability. With the right partnership and approach, you can have both.

## Ready to Build Something Amazing Together?

This perfectly illustrates how we approach challenging projects at 57Blocks. We identify complex problems, partner with innovative companies, and build solutions that benefit real people. More importantly, we prove that technical complexity doesn't have to mean user complexity, especially in the [cross-chain transactions](https://57blocks.io/blockchain) space.

Are you working on a project that could benefit from this kind of approach? Whether you're dealing with blockchain complexity, user experience challenges, or technical integration hurdles, [ we'd love to help](https://766bor9p6aq.typeform.com/to/zvzi5QYE?typeform-source=57blocks.io) turn your vision into reality.