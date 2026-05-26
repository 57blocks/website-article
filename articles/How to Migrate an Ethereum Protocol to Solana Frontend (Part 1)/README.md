---
published: true
title: "How to Migrate an Ethereum Protocol to Solana — Frontend(Part 1)"
author: ["Bonnie Chen/ Full Stack Engineer", "Shan Yang/Tech Lead"]
createTime: 2026-05-26
categories: ["engineering"]
subCategories: ["Blockchain & Web3"]
tags: ["Solana", "Ethereum", "Frontend", "Wallet", "Transaction"]
landingPages: ["Blockchain-Onchain infra"]
thumb: "./thumb.png"
thumb_h: "./thumb_h.png"
intro: "Frontend architecture design and practical implementation for high-performance data access and transaction optimisation when migrating from Ethereum to Solana."
---

## Article Overview

As the Solana ecosystem matures, more Ethereum (EVM) protocol teams are exploring migration to Solana to achieve higher throughput, lower transaction costs, and improved user experience. Through leading and executing multiple real-world Ethereum-to-Solana migrations, we've accumulated hands-on experience across smart contract architecture, data models, transaction design, and full-stack coordination.

This article is part of a broader series on migrating Ethereum protocols to Solana, where we break the process down into three core layers: smart contracts, backend services, and frontend interactions. If you're new to the series, we recommend starting with "[How to Migrate an Ethereum Protocol to Solana — Preamble](https://57blocks.com/blog/how-to-migrate-an-ethereum-protocol-to-solana-preamble?tab=engineering)," which introduces the fundamental architectural differences between the two ecosystems.

#### Article Navigation

- [How to Migrate an Ethereum Protocol to Solana — Preamble](https://57blocks.com/blog/how-to-migrate-an-ethereum-protocol-to-solana-preamble?tab=engineering): A systematic introduction to the fundamental differences between Ethereum and Solana in account models, execution mechanisms, and fee systems.
- [How to Migrate an Ethereum Protocol to Solana — Contracts (Part 1)](https://57blocks.com/blog/how-to-migrate-an-ethereum-protocol-to-solana-contracts-part-1?tab=engineering): A focus on the core mindset shift and best practices for contract development from Ethereum to Solana.
- How to Migrate an Ethereum Protocol to Solana — Frontend(Part 1): Frontend Architecture Design and Practical Implementation for High-Performance Data Access and Transaction Optimisation.

---

This article will focus on the frontend mindset shift from EVM to Solana, dissecting the key differences in the account model, transaction construction, and wallet adaptation to help you build a truly "Solana-native" frontend infrastructure. We will start with the most common pitfalls — wallet connection and login, secure signing process, efficient data reading, transaction size and account constraint limits, fee and priority fee mechanisms, multi-level error handling, and Jito bundles — and combine them with practical code examples to provide readily reusable engineering practices, laying the foundation for the subsequent Staking Demo. The goal of this article is to help developers achieve a paradigm shift from EVM to Solana frontend development and build a truly "Solana-native" frontend infrastructure. We will delve into Solana's account model, transaction construction, and how to adapt wallets, among other core differences.

The practical section will focus on a series of common pain points and optimisation directions, including:

- **Wallet Interaction and Security:** Efficient wallet connection and login flows, and secure signing practices.
- **Data Access Optimisation:** How to achieve efficient data reading.
- **Transaction Constraints and Fees:** Solving transaction size and account constraint limits, and understanding and applying fee and priority fee mechanisms.
- **Error Handling:** Establishing a multi-level error handling mechanism.
- **Jito bundle:** Provide atomic execution and sequential determinism for multi-transaction dependent processes

By combining practical code examples, we provide readily reusable engineering practices, laying a solid foundation for the subsequent Staking Demo.

## 1. Connecting Wallets

In a Solana frontend application, connecting a wallet itself is not complicated; the real complexity lies in **maintaining a consistent user experience across different operating environments**:

- In Desktop browsers, the wallet is usually injected as an extension object.
- In Mobile browsers, it relies on **Deeplink / Universal Link** to wake up a separate wallet App.
- In wallet App (e.g., Phantom Browser), the wallet automatically injects the global object and pre-connects.

The capabilities and interaction methods of the same wallet are not entirely consistent across Desktop/Mobile/Wallet Browsers. If one were to adapt each wallet and platform separately, the engineering complexity would quickly become unmanageable. To solve this problem, the Anza team provides `@solana/wallet-adapter`, which decouples the wallet connection logic from specific wallet implementations using the Adapter pattern, allowing DApps to program against a unified interface.

This section will briefly review the standard access method recommended in the official documentation (APP.md), and then focus on a critical issue often overlooked in practice, especially in mobile scenarios:

When integrating a wallet with a Solana DApp, developers face several challenges:

- **Adapter Availability:** Not every wallet offers an official wallet adapter.
- **Mobile Connectivity Gaps:** While desktop users can often connect through an injected object even without an adapter, mobile users whose wallets lack an official adapter or deeplink support will be unable to successfully redirect to and launch the wallet application.
- **Proposed Solution:** A key challenge is developing a reliable, scalable fallback for mobile users by implementing a custom wallet adapter paired with Deeplink functionality.

### 1.1 Standard Connection Flow: `ConnectionProvider` + `WalletProvider`

In a typical React application, the minimum recommended access method for `@solana/wallet-adapter` is:

- Use `ConnectionProvider` to provide an RPC connection.
- Use `WalletProvider` to register a set of supported wallets (official adapters are already implemented for common wallets).
- Use UI components (e.g., `WalletModalProvider` + `WalletMultiButton`) for interaction.

In a desktop environment, as long as the wallet injects an object conforming to expectations via `window.xxx`, the connection or signing can often be completed through "non-standard methods" even without explicit adapter registration.

However, this method does not naturally migrate to mobile scenarios.

### 1.2 The Reality: The Adapter Gap in Mobile Scenarios

In real projects, you will quickly encounter the following issues:

1. Some wallets have not yet provided an official wallet adapter.
2. Some multi-chain wallets support Solana, but their injected objects, connection flow, or signing interface are not fully consistent with the standard adapter's expectations.
3. In mobile browsers, wallets typically do not inject a global object, and the only viable entry point for the DApp is the deeplink.

This leads to a crucial difference:

- On desktop, "no adapter" is usually just an experience issue.
- On mobile, "no adapter" often means the user cannot connect the wallet at all.

The official documentation mainly describes the problem from the perspective of "how a wallet should implement an adapter", but in reality, the progress of wallet-side adaptation is not entirely controllable. As a DApp developer who has adopted the `@solana/wallet-adapter` system, you naturally face this problem: if a certain wallet does not have an official adapter yet, but you still want to provide a clear, usable connection entry point for mobile users, what should you do?

### 1.3 Solution: Custom Wallet Adapter as a Mobile Fallback

The core abstraction of `@solana/wallet-adapter` is the `WalletAdapter` interface (defined in `@solana/wallet-adapter-base`). This means that as long as this interface is implemented, the application layer does not care whether it is an official adapter or a custom adapter.

Therefore, we can implement a custom wallet adapter based on Deeplink, which has the following capabilities:

- Basic identification information: `name / url / icon / deepLink`.
- Connection status: `publicKey / connecting / readyState`.
- Core methods:
  - `connect() / disconnect() / isConnected()`
  - `sendTransaction(tx, connection, options)` and others.

From the application layer perspective:

- The custom adapter is completely equivalent to official adapters like Phantom and Solflare.
- They can be registered together in `WalletProvider`.
- The UI layer (e.g., `WalletMultiButton`) does not need to perform any special checks.

This makes a custom adapter very suitable as a fallback solution for scenarios where "the official adapter has not yet covered this wallet, but mobile users must have an entry point."

As long as the same interface is implemented, you can register your `CustomWalletAdapter` just like registering Phantom, and it will be included in the `WalletProvider`'s wallet list.

```typescript
export class CustomWalletAdapter extends BaseWalletAdapter {
  readonly name: WalletName;
  readonly icon: string;
  readonly url: string;
  readonly deepLink: string;
  readonly supportedTransactionVersions = new Set<"legacy" | 0>(["legacy", 0]);

  private _connecting: boolean = false;
  private _publicKey: PublicKey | null = null;
  private _readyState: WalletReadyState;

  constructor(config: CustomWalletConfig) {
    super();
    this.name = config.name;
    this.icon = config.icon;
    this.url = config.url;
    this.deepLink = config.deepLink;
    // Loadable: The wallet can be loaded (via deep link) but isn't installed as browser extension
    this._readyState = WalletReadyState.Loadable;
  }

  get publicKey(): PublicKey | null {
    return this._publicKey;
  }

  get connecting(): boolean {
    return this._connecting;
  }

  get connected(): boolean {
    return !!this._publicKey;
  }

  get readyState(): WalletReadyState {
    return this._readyState;
  }

  async autoConnect(): Promise<void> {
    // Deep link adapters should never auto-connect
    // Auto-redirect without user interaction is bad UX
    // Do nothing - require explicit user action to connect
  }

  async connect(): Promise<void> {
    try {
      // For deep link adapters, we only redirect to the wallet app
      // The actual connection happens in the wallet's in-app browser
      // We don't emit "connect" here because the connection isn't established yet
      window.location.href = this.deepLink;
    } catch (error) {
      this.emit("error", new WalletConnectionError((error as Error).message));
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    this._publicKey = null;
    this.emit("disconnect");
  }

  async sendTransaction<T extends Transaction | VersionedTransaction>(
    _transaction: T,
    _connection: Connection,
    _options?: SendOptions,
  ): Promise<TransactionSignature> {
    // Deep link adapters handle transactions within the wallet app
    // The actual signing happens after the deep link redirect
    throw new Error(
      "sendTransaction is handled by the wallet app after deep link redirect",
    );
  }

  async signTransaction<T extends Transaction | VersionedTransaction>(
    _transaction: T,
  ): Promise<T> {
    throw new Error(
      "signTransaction is handled by the wallet app after deep link redirect",
    );
  }

  async signAllTransactions<T extends Transaction | VersionedTransaction>(
    _transactions: T[],
  ): Promise<T[]> {
    throw new Error(
      "signAllTransactions is handled by the wallet app after deep link redirect",
    );
  }

  async signMessage(_message: Uint8Array): Promise<Uint8Array> {
    throw new Error(
      "signMessage is handled by the wallet app after deep link redirect",
    );
  }
}
```

Based on this basic adapter, we can further wrap a utility method to create different wallet adapters based on configuration, such as Backpack.

```typescript
/**
 * Build the Backpack deep link URL for mobile.
 * Uses Universal Link format for iOS/Android.
 */
const buildBackpackDeepLink = (): string => {
  const currentUrl = getCurrentUrl();
  const origin = getCurrentOrigin();

  // Backpack Universal Link format
  return `https://backpack.app/ul/v1/browse/${encodeURIComponent(
    currentUrl,
  )}?ref=${encodeURIComponent(origin)}`;
};

/**
 * Create a Backpack wallet adapter.
 *
 * On mobile: Uses deep link to open Backpack app
 * On desktop: Redirects to Chrome extension installation page
 */
export function createBackpackWalletAdapter(): CustomWalletAdapter {
  return createCustomWalletAdapter({
    name: "Backpack" as WalletName<"Backpack">,
    icon: BACKPACK_ICON,
    url: BACKPACK_URL,
    deepLinkBuilder: () =>
      isMobile() ? buildBackpackDeepLink() : BACKPACK_CHROME_EXTENSION_URL,
  });
}

/**
 * Create Backpack adapter only for mobile devices.
 * Returns null on desktop (where the official adapter should be used).
 */
export function createBackpackMobileAdapter(): CustomWalletAdapter | null {
  if (!isMobile()) {
    return null;
  }
  return createBackpackWalletAdapter();
}
```

In this way, we can register `BackpackWalletAdapter()` as a "custom wallet" in `WalletProvider` to provide a fallback for scenarios not yet covered by the official adapter.

### 1.4 Deeplink: The Last Mile to Connect Mobile Wallets

In a mobile environment, most Solana wallets exist as standalone Apps, and communication between the DApp and the wallet is typically through Deeplink / Universal Link. The typical flow is:

1. The DApp constructs a URL defined by the wallet, for example: `mywallet://connect?dapp_url=...&session=...`
2. The browser redirects to this URL, and the system wakes up the wallet App.
3. After the wallet completes authorization or signing, it returns the result to the DApp via a callback URL.

In the custom adapter design above:

- The custom adapter encapsulates all the details of the deeplink protocol internally, while still exposing unified methods like `connect()`, `sendTransaction()`, etc.
- To the application, both browser extension wallets and mobile wallets launched via deeplink are, at the code level, merely different implementations of `WalletAdapter`.
- Therefore, when an official adapter temporarily does not cover a certain wallet, you can still use the "deeplink + custom adapter" route to provide a discoverable and usable connection entry point for the user, without breaking the existing `@solana/wallet-adapter` integration pattern.

Thus, when an official adapter is temporarily unavailable for a wallet:

You can still use the "Custom Adapter + Deeplink" approach to provide a clear, discoverable, and maintainable connection entry point for mobile users, without disrupting the existing `@solana/wallet-adapter` architecture.

## 2. Wallet Login with Signature: Sign Message vs. Sign Transaction

In a Solana DApp, simply getting the user's `publicKey` through "connecting the wallet" does not prove that the address is indeed controlled by the current user. The safer and more standard approach is to introduce a **Challenge-Response** protocol, requiring the user to sign a message generated by the backend to complete the login verification.

### 2.1 Challenge-Response Basic Flow

The typical wallet login flow is as follows:

1. **User Connects Wallet**
   The user clicks "Connect Wallet" on the frontend, and the DApp establishes a connection with the wallet via the wallet adapter and obtains the user's `publicKey`.
   This step only indicates that the user agrees to expose the address and does not constitute identity verification.

2. **Frontend Requests Challenge from Backend**
   The frontend sends the obtained `publicKey` to the backend, requesting the generation of a login Challenge.

3. **Backend Generates Challenge (Challenge Information)**
   The Challenge typically includes:
   - Wallet address (`publicKey`)
   - Random number (`nonce`)
   - Expiration time (`timestamp / TTL`)
   - DApp identifier (e.g., domain name, application name, etc.)

4. **Frontend Requests Wallet Signature**
   The frontend passes the Challenge to the wallet, requesting the user to sign it.

5. **Frontend Submits Signature Result**
   The frontend sends the original Challenge and the signature generated by the user to the backend.

6. **Backend Verifies Signature and State**
   The backend performs the following checks:
   - Verifies the signature's validity using `publicKey`.
   - Checks if the wallet address in the Challenge matches the `publicKey` in the request.
   - Checks if the `nonce` has not been used (to prevent replay attacks).
   - Checks if the Challenge is within its validity period.

7. **Login Success**
   After successful verification, the backend issues a session credential (e.g., JWT or Session) for that wallet address, used for subsequent identity identification.

### 2.2 Signature Method Compatibility Issues

- **`signMessage`**: Most software wallets support signing arbitrary messages, making it the simplest and most direct way to implement login.
- **`signTransaction`**: Some hardware wallets (e.g., Ledger, Trezor, etc.) typically do not support signing arbitrary messages; they only allow signing standard Solana Transactions.

To accommodate these wallets, we construct a "special transaction" that contains only a Memo or other side-effect-free instruction, and ask the user to complete the login signature via `signTransaction`. It is important to emphasize that this transaction is only used for local signing and backend verification, it is _not_ sent on-chain, and is thus an _off-chain_ signing process that does not create an on-chain record or consume any gas/fees.

Below we introduce both paths, aiming to reuse a single set of verification logic on the frontend and backend as much as possible.

**Constructing and Signing a Message**

A readable message format, similar to "Sign-In with Solana," can be used, for example:

```typescript
const generateSignInMessage = useCallback((walletAddress: PublicKey) => {

  const timestamp = new Date().toISOString();
  const nonce = Math.random().toString(36).substring(7);

  return `${appName} wants you to sign in with your Solana account:
  ${walletAddress.toBase58()}

  Please sign in to verify your ownership of this wallet

  URI: https://${domain}
  Version: 1
  Network: Solana
  Nonce: ${nonce}
  Issued A

  // ... (rest of the message) ...
}, [appName, domain]);
```

Then, use the wallet's `signMessage` for signing. When using `@solana/wallet-adapter`, `signMessage` is an optional method, so its existence must be checked first:

```typescript
const signMessageForAuth = useCallback(
  async (message: string): Promise<SignMessageResult> => {
    if (!publicKey || !signMessage) {
      throw new Error(
        "Wallet not connected or does not support message signing",
      );
    }
    const encodedMessage = new TextEncoder().encode(message);
    const signature = await signMessage(encodedMessage);
    const signatureBase58 = bs58.encode(signature);
    return {
      signature: signatureBase58,
      publicKey: publicKey.toBase58(),
      success: true,
    };
  },
  [publicKey, signMessage],
);
```

Here, we choose to base58 encode the `messageBytes` (`serializedMessage`). This allows the backend to uniformly handle the "signature + original signed bytes" (two pieces of data) to be compatible with both the `signMessage` and the `signTransaction` solution discussed later.

### 2.3 Backend: Verifying `signMessage` Signature

The backend logic is essentially standard Ed25519 signature verification. In Node.js, for example:

```typescript
const publicKeyObj = new PublicKey(publicKeyStr);

// Decode the base58 encoded inputs
const signatureBytes = bs58.decode(signature);
const messageBytes = bs58.decode(serializedMessageBase58);

// Verify the signature using the ed25519 algorithm
const isValid = ed25519.verify(
  signatureBytes,
  messageBytes,
  publicKeyObj.toBytes(),
);

// Note: The commented-out code below shows an alternative
// verification method using nacl.
// const isValid = nacl.sign.detached.verify(
//   messageBytes,
//   signatureBytes,
//   publicKeyObj.toBytes()
// );

return isValid;
```

Before calling the signature verification function, the backend must also:

- Read the Challenge from storage.
- Verify:
  - The `nonce` has not been used.
  - The current time is within the validity period.
  - The address declared in the Challenge matches `publicKeyStr`.
- After successful verification, immediately invalidate the Challenge and issue its own login session.

This entire sequence constitutes "Signature Login" based on `signMessage`, suitable for the vast majority of software wallets.

### 2.4 Hardware Wallet: `signTransaction` + Memo Disguised as Sign Message

In the security model of many hardware wallets, only signing a Transaction is allowed, but not signing an arbitrary sequence of bytes. Therefore, at the adaptation layer, you might encounter:

- `wallet.signMessage` does not exist or throws a "not supported" error directly.
- Users with Ledger / Trezor cannot follow the `signMessage` login flow.

To ensure compatibility with these wallets, the Challenge can be embedded into a transaction that is "only for signing, not necessarily for going on-chain," allowing the wallet to complete the signature with the same meaning via `signTransaction`.

#### 2.4.1 Wallet Signs via `signTransaction` + Memo

Example implementation (Frontend):

```typescript
const signTransactionForAuth = useCallback(
  async (message: string): Promise<SignMessageResult> => {
    if (!publicKey || !signTransaction) {
      throw new Error(
        "Wallet not connected or does not support transaction signing",
      );
    }
    const blockhashResponse = await connection.getLatestBlockhash();
    const lastValidBlockHeight = blockhashResponse.lastValidBlockHeight - 150;

    const memoInstruction = new TransactionInstruction({
      keys: [],
      programId: MEMO_PROGRAM_ID,
      data: Buffer.from(message, "utf-8"),
    });

    const tx = new Transaction({
      feePayer: publicKey,
      blockhash: blockhashResponse.blockhash,
      lastValidBlockHeight: lastValidBlockHeight,
    }).add(memoInstruction);

    // Sign the transaction
    const signedTx = await signTransaction(tx);

    // Get the signature from the signed transaction
    const txSignature = signedTx.signatures[0];
    const signatureBase58 = bs58.encode(txSignature.signature!);

    // Get the serialized message that was actually signed
    // This is what the wallet signed - the serialized transaction data
    const serializedMessage = signedTx.serializeMessage();
    const serializedMessageBase58 = bs58.encode(serializedMessage);

    return {
      signature: signatureBase58,
      publicKey: publicKey.toBase58(),
      success: true,
      serializedMessage: serializedMessageBase58,
    };
  },
  [publicKey, signTransaction, connection],
);
```

In the hardware wallet path, you also obtain two core pieces of data:

- `signatureBase58`: The Ed25519 signature of the transaction message.
- `serializedMessageBase58`: The raw message bytes obtained by calling `tx.serializeMessage()`.

The format is consistent with the `signMessage` path, allowing the backend to use the same set of verification logic.

#### 2.4.2 Backend: How to Verify `signTransaction` Signature

When the backend receives this type of request (which can be treated as `type: 'transaction'`), it first needs to verify that the signature was generated by the private key corresponding to the address:

```typescript
const publicKeyObj = new PublicKey(publicKeyStr);
const signatureBytes = bs58.decode(signature);
const messageBytes = bs58.decode(serializedMessageBase58);
```

The Ed25519 verification logic is the same as the `signMessage` path. After verifying the signature, the backend should also deserialize the transaction message to extract the Memo content and confirm it matches the original Challenge.

## References

- [Moving from Ethereum Development to Solana](https://solana.com/news/evm-to-svm)
- [EVM vs. SVM: Smart Contracts](https://solana.com/developers/evm-to-svm/smart-contracts)
- [How to Migrate From Ethereum to Solana: A Guide for Devs](https://www.helius.dev/blog/how-to-migrate-from-ethereum-to-solana)
- [A Complete Guide to Solana Development for Ethereum Developers](https://solana.com/developers/evm-to-svm/complete-guide)
- [Solana Wallet Adapter](https://github.com/solana-labs/wallet-adapter)
