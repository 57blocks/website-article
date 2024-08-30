---
title: "Getting Started with Reactive Programming"
subTitle: "Tokenpad: A Case Study in Displaying Real-Time Data"
author: ["Juan E Quintero R / Tech Lead"]
createTime: 2024-04-22
tags: ["Reactive", "Flutter", "Crypto"]
thumb: "https://s3.amazonaws.com/assets.57blocks.io/cms_uploads/illustration_tokenpad_65aea3b800.png"
thumb_h: "./thumb_h.png"
intro: "Users expect to see real-time data while using apps and don't want to refresh the screen. This is achieved by using Reactive Programming. In this article, you’ll explore why Reactive Programming exists and how it enables apps to update with new data in real time."
previousSlugs: ["reactive-programming-in-tokenpad"]
---

## Introduction

In this series of articles, I am writing about Reactive Programming. This programming paradigm helps systems react to data changes. It does this using a declarative approach, making it easier to dynamically change presented information as soon as new data arrives. Reactive Programming approaches allow developers to think about what they want to show instead of how to show it.   
  
In this article, I will first briefly examine Reactive Programming after discussing other alternatives. I'll explain their pitfalls before introducing the concept of Reactive Programming. In the following article, I'll illustrate how to leverage Reactive Programming to build your front-end application by showing a real-life implementation, leaving behind old approaches prone to showing stale data or different values for the same data on different screens.

## Why Reactive Programming is Perfect for Tokenpad

[Tokenpad](https://tokenpad.io/) is an application developed using Flutter. It allows users to aggregate their crypto portfolios (we support up to 13 chains and growing) and have all of their information available at a glance. This helps users become smarter crypto investors.

Users can also add their Decentralized Finances (DeFi) positions so they have the most up-to-date information about current yields. Additionally, Tokenpad will notify users about potential liquidations, display token price changes, and check token price history, among other features. Today, Tokenpad has thousands of daily users and handles hundreds of different cryptocurrency tokens, displaying the current status for each account and each user.   
  
We are obsessed with meeting user needs and becoming a leading crypto aggregator app. We constantly validate market needs and receive and analyze user feedback and requests. We have new features in the pipeline, such as transaction history, profit and loss calculations, and investment suggestions.   
  
Tokenpad can handle hundreds of tokens from hundreds of different wallets, chains, exchanges, or DeFis and store, aggregate, and display all that data to users in a friendly and understandable way on multiple screens using different views. Thanks to Reactive Programming, users can continue to use Tokenpad to access up-to-date information in the app while more information is being fetched and processed in the background. As a crypto investor, you would always have the latest data available to make your own choices.

![](https://s3.amazonaws.com/assets.57blocks.io/cms_uploads/tokenpad_mobile_49a30f59cb.png)

## Graphic of Tokenpad

Processing and displaying all that information requires time to:

+ Fetch data from all the required data sources
+ Process the received responses
+ Store this data locally
+ Aggregate the stored data

As we know, users prefer to avoid staring at a circular loader while the system is fetching and processing, waiting for data to be displayed on their screen. According to Google, 53% of users abandon a mobile web application if it takes more than three seconds to load. Users want to use an app and see available data.    
  
Our job as developers is to allow users to see the most current information as soon as it's ready to be shown, even if it means updating the screen they're viewing. Users shouldn't have to manually refresh the screen or interact with the app in any way to see updated information reflected on the screen. With Reactive Programming, the app should react to new data arriving.

## Pre-Reactivity Era

**Fetching and showing data in apps before Reactive Programming**          
Not long ago, when creating applications that fetched and displayed data on a screen, an application would follow these steps:

1.  The user opens the desired screen.
2.  The application fetches the data to display on the screen.
3.  The application processes the data fetched in step two.
4.  The application sends processed data to be displayed on the screen.

These steps seem logical and necessary. But what happens if the data changes during steps two through four?          
  
There are two main scenarios of what could happen:


<div class="row py-2">
  <div class="col-12 col-sm-6 mb-3">
    <div
      class="d-flex flex-row flex-nowrap align-items-center h-100 p-4 rounded-4"
      style="
        background-color: rgb(131, 113, 243, 0.06);
        border-bottom-left-radius: 0 !important;
        border-top-right-radius: 0 !important;
      "
    >
      <div
        class="pe-3 fw-bolder lh-1 text-nowrap"
        style="color: var(--bs-purple); font-size: 60px"
      >
        a.
      </div>
      <div style="font-size: 16px">
        The application <strong>is aware</strong> that data has changed.
      </div>
    </div>
  </div>
  <div class="col-12 col-sm-6 mb-3">
    <div
      class="d-flex flex-row flex-nowrap align-items-center h-100 p-4 rounded-4"
      style="
        background-color: rgb(70, 155, 255, 0.06);
        border-bottom-left-radius: 0 !important;
        border-top-right-radius: 0 !important;
      "
    >
      <div
        class="pe-3 fw-bolder lh-1 text-primary text-nowrap"
        style="font-size: 60px"
      >
        b.
      </div>
      <div style="font-size: 16px">
        The application <strong>isn’t aware</strong> that data has changed.
      </div>
    </div>
  </div>
</div>

**For scenario a**:          
We can re-execute steps two through four to update the information on the screen.          
  
**For scenario b**:          
I can think of two options:          
**b1** - The application regularly retrieves data in the background and updates the screen if data changes.          
**b2** - The app displays the original data on the screen until the user manually refreshes the data. Then, the app executes steps two through four so the user can see updated information.          
  
Both situations are sub-optimal for users as they expect to see information updated immediately.          
  
**For option b1**, the interval between data retrieval updates might be too long (let's say once an hour) for the user to wait for the latest information or too short (let's say once every five seconds), wasting resources and negatively affecting user experience (by increasing page load times or battery consumption).          
  
**For option b2**, if we don’t update the information on the screen, the users won’t know that the information displayed is no longer accurate. They would need to refresh the screen whether data was updated or not. In that case, we are making the users do unnecessary work.


## Observer Pattern

[The Observer Pattern](https://refactoring.guru/design-patterns/observer), a key concept in Reactive Programming, can solve this conundrum!                         
  
**In summary, it consists of two kinds of software components:**

<div class="row py-2"><div class="col-12 col-sm-6 mb-3"><div class="d-flex flex-column flex-nowrap align-items-start rounded-4 h-100" style="background-color:rgba(131, 113, 243, 0.06);border-bottom-left-radius:0 !important;border-top-right-radius:0 !important;"><div class="px-3 py-1 rounded-4" style="background-color:var(--bs-purple);border-bottom-left-radius:0 !important;border-top-right-radius:0 !important;"><span style="color:hsl(0,0%,100%);font-size:20px;"><strong>Publisher</strong></span></div><div class="px-4 pb-4 pt-3 lh-base"><div class="mb-3"><strong>A component that emits events</strong></div><div>The Publisher is in charge of informing its Subscribers whenever a relevant event occurs (e.g., new data arrives)</div><div class="my-2 lh-0" style="border-top:1px solid rgba(131, 113, 243, 0.1);">&nbsp;</div><div><strong>Role:</strong>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<br><strong style="color:var(--bs-purple);">Active Role</strong> given that it needs to fetch the information and notify its Subscribers.</div></div></div></div><div class="col-12 col-sm-6 mb-3"><div class="d-flex flex-column flex-nowrap align-items-start rounded-4 h-100" style="background-color:rgb(70, 155, 255, 0.06);border-bottom-left-radius:0 !important;border-top-right-radius:0 !important;"><div class="px-3 py-1 rounded-4 bg-primary" style="border-bottom-left-radius:0 !important;border-top-right-radius:0 !important;"><span style="color:hsl(0,0%,100%);font-size:20px;"><strong>Subscriber</strong></span></div><div class="px-4 pb-4 pt-3 lh-base"><div class="mb-3"><strong>A component that listens to published events</strong></div><div>The Subscriber subscribes to a Publisher and is ready to react to its emitted events.</div><div class="my-2 lh-0" style="border-top:1px solid rgba(70, 155, 255, 0.1);">&nbsp;</div><div><strong>Role:</strong>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<br><strong class="text-primary">Passive Role</strong>, given that it needs to receive updates from the Publisher and update the screen with the new data.</div></div></div></div></div>


By using [the Observer Pattern](https://refactoring.guru/design-patterns/observer), we are accomplishing a few goals:

+ Splitting the responsibilities of the original data gathering and display component into two components.    
+ Decoupling the fetch and process logic from the show-data-into-screen logic by having active and passive components.
+ Moving from a pull-based paradigm (where the application either fetches data at regular intervals or waits for the user to manually refresh the data) into a push-based one (where the Subscriber passively receives new data sent by the Publisher).

In other words, the user is **NOT** in charge of requesting data; the app reacts to data changes as soon as it's notified.

The first time I used [the Observer Pattern](https://refactoring.guru/design-patterns/observer), I was surprised that I could split the responsibility between knowing when an event occurred and processing that same event. With this pattern, I can be sure that the app will only react when an event occurs rather than constantly polling to check if a reaction is necessary.                      

Using the Observer pattern, we are making our application more reactive, allowing it to correctly respond to data changes and updates everywhere.


## Is there a Better Approach than the Observer Pattern?

Even though the Observer Pattern is a substantial improvement, its implementation can still be enhanced, especially when multiple steps and branches are involved in processing the obtained data.

**Let’s consider a real-life example:**  
Tokenpad has a "Consolidated Tokens" screen, where we show aggregated information about all the tracked tokens in the user’s portfolios. 
For that screen, we needed to obtain the portfolios from the database and fulfill the following requirements:


<div class="row">
  <div class="col-12 col-md-8 col-lg-12 col-xl-8 pt-3 pe-xl-2">
    <ol class="list-unstyled lh-base" style="font-size: 16px;">
      <li class="d-flex flex-nowrap align-items-center rounded-4 px-3 py-2 mb-3" style="background-color: rgba(131, 113, 243, 0.06);">
        <div class="d-flex align-items-center justify-content-center pe-3 fs-6 fw-bolder" style="color: var(--bs-purple);">
          1.
        </div>
        <div>
          Show portfolio data grouped by similar tokens (e.g., Wrapped Ethereum (WETH) and Ethereum (ETH) are grouped together)
        </div>
      </li>
      <li class="d-flex flex-nowrap align-items-center rounded-4 px-3 py-2 mb-3" style="background-color: rgba(131, 113, 243, 0.06);">
        <div class="d-flex align-items-center justify-content-center pe-3 fs-6 fw-bolder" style="color: var(--bs-purple);">
          2.
        </div>
        <div>
          Add the amount of each token in the group
        </div>
      </li>
      <li class="d-flex flex-nowrap align-items-center rounded-4 px-3 py-2 mb-3" style="background-color: rgba(131, 113, 243, 0.06);">
        <div class="d-flex align-items-center justify-content-center pe-3 fs-6 fw-bolder" style="color: var(--bs-purple);">
          3.
        </div>
        <div>
          Identify the top four (and “Others”) token groups by percentage according to the selected filter
        </div>
      </li>
      <li class="d-flex flex-nowrap align-items-center rounded-4 px-3 py-2 mb-3" style="background-color: rgba(131, 113, 243, 0.06);">
        <div class="d-flex align-items-center justify-content-center pe-3 fs-6 fw-bolder" style="color: var(--bs-purple);">
          4.
        </div>
        <div>
          Filter by chain or show data from all chains
        </div>
      </li>
      <li class="d-flex flex-nowrap align-items-center rounded-4 px-3 py-2 mb-3" style="background-color: rgba(131, 113, 243, 0.06);">
        <div class="d-flex align-items-center justify-content-center pe-3 fs-6 fw-bolder" style="color: var(--bs-purple);">
          5.
        </div>
        <div>
          Sort the data in descending order according to the value
        </div>
      </li>
    </ol>
  </div>
  <div class="col-12 col-md-4 col-lg-12 col-xl-3" aria-hidden="true">
    <img class="d-block mx-auto mw-100" alt="" src="https://s3.amazonaws.com/assets.57blocks.io/cms_uploads/consolldated_token_view_b9e2cf46bb.png">
  </div>
</div>

## Graphic

To achieve these operations using the Observer Pattern, we could have the following code:

```dart
class Token { 
  final String url;
  final String code;
  final double usdValue;

  Token(this.url, this.code, this.usdValue);
} 

class Portfolio {
  final String chain;
  final List<Token> tokens;

  Portfolio(this.chain, this.tokens); 
} 

class TokenAndPercentage { 
  final Token token;
  final double percentage;

  TokenAndPercentage(this.token, this.percentage); 
}
```

Here we define the models that support all the calculations and will allow us to show the data on the screen:

```dart
class PortfoliosSubscriber implements Subscriber<List<Portfolio>> {
  @override
  void processEvent({required List<Portfolio> event}) {
    final filteredPortfolios = event.where(
      (element) => element.chain == currentlyFilteredChain,
    ); // 1: Filter Portfolios by selected chain

    final filteredTokens = filteredPortfolios
        .map(
          (Portfolio portfolio) =>
              portfolio.tokens, // 2: Extract Tokens from Portfolios
        )
        .expand(
          (List<Token> tokens) =>
              tokens, 
              // 3: Flatten matrix of Token into List of Token
        )
        .toList();

    final Map<String, List<Token>> groupedTokensByCode =
        groupBy(filteredTokens); 
            // 4: Group all Tokens by Token code field

    final List<Token> tokensWithAddedValue = calcTotalValueByTokenCode(
      groupedTokensByCode.values,
    ); // 5: Add up all the usdValue of the Tokens for each code

    final sortedTokensWithAddedValue = tokensWithAddedValue.sort(
      (Token a, Token b) => a.usdValue.compareTo(
        b.usdValue,
      ),
    ); // 6: Sort the Tokens by its added usdValue

    final List<TokenAndPercentage> top4Tokens =
        calculateTop4Tokens(tokensWithAddedValue); 
            // 7: Extract top 4 Token 

    // 8: Show the sortedTokensWithAddedValue in the screen
    // 9: Show the top4Tokens in the screen
  }

  List<Token> calcTotalValueByTokenCode(Iterable<List<Token>> values) {
    /// TODO: Add up all tokens values and return a 
    /// single representative of the Token with its usdValue 
    /// field having the calculated addition
  }

  Map<String, List<Token>> groupBy(List<Token> tokens) {
    // TODO: Group all tokens by its code field
  }

  List<TokenAndPercentage> calculateTop4Tokens(
      List<Token> tokensWithAddedValue) {
    /// TODO: Calculate the percentage of each token 
    /// wrt the total and return the top4 and "Other"
  }
}
```
## Code Graphic

In the code, we can see how to receive new events in the processEvent method and start to process, step by step, the received list of Portfolios to calculate the necessary information to be displayed in the Consolidated Tokens screen.   

It is important to note that although the logic is divided into steps, all of it depends on the processEvent argument (the list of Portfolios). As a result, the logic piles up inside the processEvent block. We could use the [Extract Method](https://refactoring.guru/extract-method) refactoring to move the logic out of that block. However, in the end, all the logic will still depend on the same processEvent argument. That code block will grow with every new feature that depends on it.


## Say Hello to Reactive Programming

I like to define Reactive Programming as the Observer Pattern on steroids.   
  
Reactive Programming allows us to have the benefit of the Observer Pattern's push-based approach while also having some extra benefits, such as:

+ Excellent documentation
+ Out-of-the-shelf chaining
+ Availability in a myriad of languages
+ A ton of chainable operators "for free."

## What exactly is Reactive Programming?  
  
In their book “Reactive Programming with RxJava," Tomasz Nurkiewicz and Ben Christensen define Reactive Programming as:   
  
Reactive Programming is a general programming term that is focused on reacting to changes, such as data values or events. It can and often is done imperatively. A callback is an approach to reactive programming done imperatively. A spreadsheet is a great example of reactive programming: cells dependent on other cells automatically “react” when those other cells change\[…\]   
  
Therefore, it is a programming approach - an abstraction on top of imperative systems - that allows us to program asynchronous and event-driven use cases without having to think like the computer itself and imperatively define the complex interactions of state, particularly across thread and network boundaries.   
  
**That definition mentions two key concepts: reacting to change (a piece of what we already saw in the Observer Pattern) and not having to think like the computer itself.**   
  
The main shift when using Reactive Programming is that instead of imperatively telling the computer how and when to do calculations (static data and operations), we have a "living" stream of data to which we subscribe. The code automatically reacts to its changes, updating all the calculations in a way that's closer to how we, as humans, think instead of us having to accommodate our thinking to the computers' way.   
  
Let's try to see this in the code:

```dart
int a = 10;
int b = 15;

int sum = a + b; // sum = 25

b = 25; // sum stays as 25 instead of increasing to 35
```

## Code Graphic

This is an example of static code. The variable b is initialized as 15, and then the variable sum is calculated in terms of a and b. Subsequently, b is updated from 15 to 25. In a reactive world, the value of the sum would be updated to 35, but given that this code is not reactive (it's static), its value stays at 25.    
  
To update the value to 35, we must explicitly call the sum = a + b again.   
  
If we want to transform this code into Reactive, we need to reference a couple of concepts:

+   **Stream:** According to [Dart’s official documentation](https://dart.dev/tutorials/language/streams), a stream is a sequence of asynchronous events. It is like an asynchronous iterable, where instead of having to query it to check whether there's a new event, the stream tells you that there is an event when it is ready.
+   **There are two kinds of streams:** Single subscription streams and broadcast streams.
+   **Subscription:** It’s the act of registering to receive the events emitted by a Stream.

Keeping these two concepts in mind, this is how we update the static code to update the value of the sum reactively:

```dart
int a = 10;
Stream<int> b = Stream.fromIterable([15, 25, 35, 45]); 
// 1: One way of creating a Stream

b.listen((int newBValue) { // 2: The subscription is created
  int sum = a + newBValue;
});
```
## Code Graphic

This code adds a and b, but this time uses Streams.  
  
The sum value is recalculated whenever the value of b is updated (The Stream emits). The subscription to a Stream is created by calling the Stream’s listen method, which is equivalent to calling addSubscriber in the Observer Pattern.  
  
In this example Stream b will emit the following values in order: 15, 25, 35, and 45. We can be sure that the value of sum gets updated to 25, then 35, 45 and finally 55.  
  
The sum is updated every time b emits without us having to explicitly reassign it in a separate call.

## Conclusion

Building data-heavy applications requires developers to write code to retrieve, store, process, and show data. Having tools that make these steps easy to write, understand, and modify extends benefits for all involved, from the developer to the application users.   
  
Reactive Programming is one tool for achieving these goals. It changes the way developers think about building user-facing applications, abstracting away the computer-oriented approach while including additional features that make it even more powerful.   
  
Stay tuned for the next part, where I'll explore the world of Reactive Programming, including real-life challenges in Tokenpad and how Reactive Programming helped us.
