---
title: "Guide to Web3 and dApp Infrastructure"
author: ["Wei Wang / Tech Lead"]
createTime: 2024-04-18
tags: ["Smart Contract", "Web3", "Architecture", "Dapp"]
thumb: "./thumb.png"
thumb_h: "./thumb_h.png"
intro: "We created this guide to help people new to Web3 and the dApp infrastructures use this technology in their organizations. The design of Web3 apps is much more decentralized than that of Web2. New services are constantly appearing to make building and running these projects easier and safer. Engineers must know how each part works to create effective Web3 apps. We describe this here."
previousSlugs: ["the-building-blocks-of-web3-a-deep-dive-into-dapp-infrastructure"]
---

## Overview of the Web3 dApp Landscape

The Web3 decentralized application (dApp) landscape is extensive and complex, featuring a variety of applications that use blockchain technology. These decentralized, interoperable applications often incentivize participation through cryptographic tokens. The key categories within this landscape include:  

1. **Doors**  
Tools and platforms that enable users to access and interact with Web3. These interfaces and applications bridge the gap between traditional web users and the decentralized protocols of Web3.           

2. **Applications**  
These act as a bridge between end-users and the underlying blockchain protocols and primitives, providing a user interface and experience.       

3. **Primitives**  
Fundamental components within the decentralized ecosystem. They are interoperable building blocks that developers use to create complex dApps.        
   
4. **Protocols**   
Frameworks and systems providing infrastructure for decentralized networks. They define data storage, transmission, and processing across a blockchain network.

---

- **Doors:** Enable users to access and interact with web3

  ![the-building-blocks-of-web3-doors.png](https://s3.amazonaws.com/assets.57blocks.io/cms_uploads/the_building_blocks_of_web3_doors_836a803b8b.png)

- **Applications:** Connect users with protocols and Primitives via a user interface and experience

  ![the-building-blocks-of-web3-applications.png](https://s3.amazonaws.com/assets.57blocks.io/cms_uploads/the_building_blocks_of_web3_applications_21f6200efe.png)

- **Primitives:** Are the task-specific, interoperable building blocks for decentralized Applications

  ![the-building-blocks-of-web3-primitives.png](https://s3.amazonaws.com/assets.57blocks.io/cms_uploads/the_building_blocks_of_web3_primitives_b2fcf86bf2.png)

- **Protocols:** Construct the foundational blockchain architecture of web3

  ![the-building-blocks-of-web3-protocols.png](https://s3.amazonaws.com/assets.57blocks.io/cms_uploads/the_building_blocks_of_web3_protocols_f61611bf40.png)

---

<p><span style="white-space:pre-wrap;">Source: &nbsp;&nbsp;</span><img class="image_resized align-middle" style="height:18px;width:auto;" src="https://s3.amazonaws.com/assets.57blocks.io/cms_uploads/brand_the_block_eeffcd253a.png" alt="brand-the-block.png"></p>

## Web3 dApp Architecture

Web3 applications, commonly known as decentralized applications (dApps), have a unique architecture that sets them apart from traditional web applications. This difference primarily stems from their use of decentralized networks, usually powered by blockchain technology. Here's a simplified breakdown of the key components in Web3 architecture:  
  
Web3 key components

![web3-key-components.png](https://s3.amazonaws.com/assets.57blocks.io/cms_uploads/web3_key_components_f0904f3f16.png)

   
- **Blockchain Foundation**  
At its core, a Web3 application is built on a blockchain, which serves as a decentralized and immutable ledger. This ledger ensures the integrity and transparency of the data within the application.  
- **Smart Contracts**  
These are programs stored on the blockchain, which are crucial for the functionality of the Web3 application. Smart contracts autonomously execute actions based on certain conditions and govern the business logic and rules of the decentralized ecosystem.  
- **Frontend Interface**  
The frontend of a Web3 application is often developed using traditional web development tools and frameworks. It offers an intuitive user interface for interacting with smart contracts on the blockchain. Libraries like web3.js or ethers.js are integrated to facilitate the connection between the user interface and the blockchain.  
- **Middleware Layer**  
In Web3 architecture, the middleware layer acts as a relieving intermediary between the raw data on the blockchain and the frontend. It simplifies essential tasks such as querying blockchain events, translating them into a user-friendly format, and managing complex computations and interactions that occur off the blockchain, reducing the complexity and making the process more manageable.  
- **Cross-Chain Interoperability**  
A significant aspect of Web3 applications is their ability to bridge different blockchains, enhancing interoperability. This cross-chain functionality enables the application to utilize the strengths of various networks, allowing for the smooth transfer and exchange of assets and information across diverse blockchain systems, which would otherwise be isolated and fragmented.  
  
In summary, Web3 architecture is distinguished by its decentralized foundation, with blockchain technology at its heart, supported by smart contracts, and enhanced by user-friendly frontends, efficient middleware, and cross-chain interoperability for a seamless experience.  
  
Web3 dApp Architecture

![web3-dapp-architecture.svg](https://s3.amazonaws.com/assets.57blocks.io/cms_uploads/web3_dapp_architecture_amimation.svg)

Let's take a closer look at the essential components of Web3 applications and explore the various tools that can be developed for each segment.

### Smart Contract

Smart contracts are fundamental to the functionality of Web3 Decentralized Applications (dApps). They are automated contracts whose terms are coded and stored on a blockchain. These contracts independently handle the logic and state of the dApp, enabling transactions and interactions that do not rely on a central authority. Once deployed to the blockchain, smart contracts become immutable, becoming the primary means of updating data.  
  
The development process of smart contracts generally involves several key steps:  
  
1. **Analysis of Business Logic**  
Initially, the underlying business logic is analyzed to ensure that the smart contract will function as intended. 
2. **Coding the Contract**  
The contract is then coded, typically using Solidity, the primary language for Ethereum smart contracts.  
3. **Testing**  
Rigorous testing is essential to identify errors and confirm the contract's functionality.  
4. **Audit**  
Before deployment, the smart contract undergoes a critical audit phase. This step is crucial for identifying vulnerabilities and ensuring the contract operates correctly in all scenarios. The audit helps prevent exploits, which protects user funds and maintains trust in the application.  
  
For the development of smart contracts, popular environments include Hardhat and Foundry.  
  
**•** **Hardhat:** This environment is preferred for its deployment capabilities, which simplify the process of transferring contracts to the blockchain.  

**•** **Foundry:** Known for its robust testing tools, Foundry plays a significant role in the smart contract development lifecycle, particularly in the testing and validation stages.


### dApp Frontend

The frontend of a decentralized application (dApp) is essential as it forms the primary interface for users. Through the frontend, users can access their account information, check their asset balance, and interact with various dApp features facilitated by smart contracts. To ensure the decentralized network's security and integrity, these interactions and transactions require authentication via the user's wallet.  
  
A cryptocurrency wallet is more than a digital asset manager; it acts as a crucial link between the user and the dApps. These wallets have a built-in provider, a layer enabling direct communication with the blockchain. This provider allows the wallet to perform actions like querying blockchain data, signing transactions, and securely interacting with smart contracts, which protect the user's private keys.

+   **MetaMask** is a user-friendly and secure browser extension and mobile app that enables users to manage, transfer, and interact with cryptocurrencies and decentralized applications on the Ethereum blockchain and other EVM-compatible networks.
+   **WalletConnect** is an open protocol that allows mobile wallets to securely interact with decentralized applications (dApps) through QR code scanning or deep linking without exposing private keys.

Moreover, the Web3 frontend is open to more than just using the wallet's built-in provider. It has the flexibility to integrate third-party providers, which can offer additional services like access to nodes managed by other organizations.

+   **Alchemy** is a powerful blockchain developer platform that provides enhanced API services, developer tools, and infrastructure to help scale and build decentralized applications on Ethereum and other blockchains with ease and reliability.
+   **Infura** is a scalable and reliable blockchain infrastructure service that provides developers with easy-to-use APIs and tools to connect applications to Ethereum and IPFS without running their nodes.

Another significant aspect of the frontend is its interaction with middleware. Middleware efficiently retrieves historical and aggregated data. It often indexes and processes blockchain data off-chain, making it more accessible.   

Off-chain processing enables more efficient and flexible data retrieval than directly querying the blockchain. Such capabilities are invaluable for reviewing transaction histories, generating analytical insights, and improving the overall user experience by offering a comprehensive view of on-chain activities.

### Middleware

Middleware in Web3 applications acts as a crucial intermediary layer, offering centralized auxiliary functions to address the technical challenges inherent in Web3 technologies. Its role is to ensure efficient and secure operations within the decentralized framework. Key functions of middleware and some popular tools include:

1. **Data Indexing**  
Middleware gathers and processes data from smart contracts, creating an accessible layer for efficient data querying and retrieval. This is essential because direct on-chain data retrieval can be cumbersome due to the decentralized nature of blockchain data storage.

    1. Subgraph is a tool for extracting and processing blockchain data, storing it in a format easily queried via GraphQL.
    2. Dune offers analytics for the blockchain ecosystem, allowing users to access and share data from various blockchain networks, such as Ethereum, xDai, Polygon, and others.

2. **Monitoring**  
This involves constant surveillance of smart contracts, detecting and responding to state and transaction events changes. This is critical for maintaining the integrity and functionality of smart contracts.  
  
3. **Autotask**  
This function automates the execution of specific smart contract actions in response to certain events or conditions, ensuring smooth and timely operations without manual intervention.  
  
4.  **Alerting**  
Middleware can be configured to send alerts based on predetermined criteria. These alerts can be communicated through various channels, such as email, user notifications, on-call services, or messages, facilitating quick responses to important events or conditions within the blockchain environment.  

These common tools often integrate multiple functions, including above monitoring, automation, and alerting:  

    1. **Sentio** is a user-friendly tool for gaining insights, securing assets, and troubleshooting transactions for decentralized applications.
    2. **Gelato** is known as Web3’s decentralized backend, enabling the creation of augmented smart contracts that are automated and off-chain aware.
    3. **Defender** focuses on enforcing security best practices in smart contract deployment and maintenance across blockchains.
    4. **Tenderly** provides a platform for Web3 developers to create, test, monitor, and operate smart contracts, combining debugging tools with observability and infrastructure components.

### SDK

The Software Development Kit (SDK) in Web3 applications is crucial in simplifying interactions with smart contracts. It effectively encapsulates the logic needed for reading from and writing to these contracts, focusing primarily on essential business operations.   

This encapsulation significantly streamlines the process for users or client applications, allowing them to conduct complex blockchain transactions more easily through high-level function calls.  
  
The SDK is also designed to integrate seamlessly with popular libraries such as web3.js, ethers.js, and viem. These libraries are widely recognized for their efficiency in facilitating interactions with Ethereum Virtual Machine (EVM) blockchains.

+   **Web3.js** is a versatile Ethereum JavaScript API that facilitates interaction between web applications and the Ethereum blockchain. It enables developers to create, send, and manage smart contract calls and transactions.
+   **Ethers.js** is a lightweight and modular JavaScript library that aims to provide a complete and compact toolset for interacting with the Ethereum blockchain and its ecosystem.
+   **Viem.js** library provides higher levels of abstraction, which likely simplifies complex blockchain interactions into more accessible and user-friendly methods.

By using these integrations, the SDK enhances the overall usability and accessibility of blockchain technologies, enabling developers and end-users to engage more effectively with the decentralized ecosystem.

### Cross-Chain

Blockchain cross-chain technology encompasses the methods and systems facilitating interactions and value exchange between blockchain networks. This technology is essential for enabling seamless interoperability among various blockchain systems. Key components and protocols in this domain include:  
  
1. **Token Bridge**  
A token bridge enables the transfer of tokens between two different blockchain networks. It enhances blockchain interoperability, allowing users to utilize the unique features of multiple chains without being confined to a single blockchain's ecosystem.

    +   **Stargate Protocol:** This comprehensive liquidity transport protocol is designed to support cross-chain transfers and communication. Built on the LayerZero infrastructure, Stargate Protocol enables efficient and fluid cross-chain interactions.
    +   **Cross-Chain Transfer Protocol (CCTP):** CCTP is an on-chain utility that allows for the secure transfer of USDC (a stablecoin) between blockchain networks. It employs mechanisms like native burning and minting to facilitate these transfers.

2. **Message Bridge**  
This mechanism facilitates the transfer of information and messages between different blockchains, contributing to their interoperability. It uses a standardized communication protocol to ensure reliable message transmission. This process typically involves a mix of smart contracts and off-chain components like relay nodes or oracles.

    - **LayerZero:** LayerZero provides a foundational infrastructure that simplifies connectivity across supported blockchains. It enables various functions, such as swaps, transfers, and lending, across different blockchain networks.

3. **Cross-Chain Aggregator**  
These platforms or protocols combine liquidity and functionalities from multiple blockchain networks into a single interface. They integrate cross-chain bridges, liquidity pools, and decentralized finance (DeFi) protocols. By accessing a broad spectrum of liquidity sources, users benefit from optimized rates, reduced slippage, and enhanced liquidity. Cross-chain aggregators also aim to optimize transaction paths for efficiency and cost-effectiveness when moving assets across chains.

    +   **LI.FI:** This aggregation protocol offers decentralized exchange (DEX) connectivity and cross-chain data messaging capabilities. LI.FI integrates these functions at the API/Contract level and as widgets for developers to incorporate directly into their products.
