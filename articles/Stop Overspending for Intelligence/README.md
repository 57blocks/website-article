---
published: false
title: "Stop Overspending for Intelligence"
author: ["Kevin Wang"]
createTime: 2026-07-29
categories: []
subCategories: ["Investment"]
tags: []
landingPages: ["Blockchain"]
heroColor: "#2CA9CA"
thumb: "https://d2bbd18t6iidcl.cloudfront.net/website/uploads/illustration_robot_hand_pinch_coin_b8b821b88b.png"
thumb_h: ""
intro: "The fog of war refers to the uncertainty and lack of situational awareness experienced by commanders and soldiers in military operations, caused by incomplete intelligence, communication failures, and the unpredictable nature of combat."
previousSlugs: []
---

Companies big and small today are experiencing the **fog of tokens** - complaining about overzealous token spend, uncertain about its ROI, all while operating under a complete lack of awareness around the capabilities of alternatives in the field. As a result, to no one’s surprise, a recent [KPMG report](https://assets.kpmg.com/content/dam/kpmgsites/xx/pdf/2026/06/global-ai-pulse-q2.pdf) found that only 3% of corporate AI initiatives had achieved positive ROI. 

Whether you’re a startup trying to maximize your margins or an enterprise trying to be part of that 3%, use this as a field guide for navigating through the fog of token economics, model and provider selection, and keeping on top of the everchanging landscape of intelligence.

## Open models are good enough

The best open-source models released by Z.ai (GLM 5.2), Alibaba (Qwen 3.7), Minimax, Deepseek, and Kimi are at least as good as the best closed-source models were six months ago. The best open-weight reasoning model, GLM 5.2, is equivalent in performance to GPT-5.4. The gap in frontier intelligence is being closed every three to six months right now.

![artificial-analysis-intelligence-index-by-model-type.png](https://d2bbd18t6iidcl.cloudfront.net/website/uploads/artificial_analysis_intelligence_index_by_model_type_27ccb0c2c7.png){.d-block .mx-auto my-3}
 
This means that any task you reliably used Opus 4.6 or GPT-5.4 to accomplish, you should be able to get similar results from many open-source models today.

## The 90/10 ratio

The future of token spend is a multi-model approach, with an internal router deciding the model-and-provider combination that should serve each call. The efficient frontier for most companies is a 90% open-weight / 10% frontier-model split. Of course there will be exceptions - drug discovery, rocket science, and work of similar ilk. But for most operating businesses, 90/10 will do. You should expect your bill to run 10/90 in the other direction: open-weight models cost almost nothing to serve, while frontier models consume 90% of your budget.
The catch is that you can’t just run a generic model bakeoff. You need to constantly evaluate two things: 

- 1.	Which models can hit the accuracy outcomes required
- 2.	Can you get enough of it – a deceptively tricky question that isn’t just about GPU allocation

## A token is not a unit of intelligence

In an ideal world, a token would be a uniform unit of intelligence. It isn’t. The cost of a task is pretty much disassociated from the price per 1M tokens; so many variables can drastically alter the tokens demanded: how much context is being dragged into a request, how much it hits cache, how many layers of reasoning tokens get consumed, and how long the output runs.

So tokenmaxxing and the short-lived token leaderboards at places like Amazon and Meta didn’t work not just because they incentivized gratuitous token consumption, but because tokens were the wrong unit to measure in the first place.

### Measuring cost per task

Instead, the heterogeneous “cost per task” is a much better benchmark. Sophisticated teams have stopped asking “which model is best?” They’re asking instead, “what’s the capability target required for each of my tasks”.

To figure that out, you’ll need to run internal evals to understand the quality, performance, and cost through a platform like [Braintrust](https://www.braintrust.dev/), [Arize](https://arize.com/), or [Langfuse](https://langfuse.com/). Every task’s eval will look a bit different, but ideally you have a couple hundred cases of varying difficulty, and at least a portion calibrated with ground truth labeling, before applying deterministic or LLM-as-a-judge scoring. Then you’re running this across every model, provider, and quantization you’re willing to consider and evaluating the results.

### Seeing through the fog in prod

So you’ve run your eval and you’ve figured out the ideal model you’d like to run to hit your task KPIs. Here is where vendor selection matters. When you buy inference from a provider, you’re not just buying a model. You’re buying the provider’s entire inference optimization stack, from compute infrastructure and distributed serving to scheduling, caching, and networking. That means the same model can cost multiples more and run 10x slower depending on who serves it.

For example, if you’re planning to use DeepSeek V4 Pro, you will find at least sixteen inference providers tracked by OpenRouter. The output price runs from $0.87 per million tokens at DeepSeek’s own endpoint to $3.48 for Fireworks, Together AI, and Baseten - a fourfold difference. Throughput ranges from 9 tps to 89, nearly a 10x difference. Same model, different provider, wildly different product.

![same-open-model-16-providers-deepseed-v4-pro.png](https://d2bbd18t6iidcl.cloudfront.net/website/uploads/same_open_model_16_providers_deepseed_v4_pro_a1162725c3.png){.d-block .mx-auto .my-3}

So if you need 80+ tps, you’re either paying Baseten, or you’re choosing a different model with different cost-performance tradeoffs. 

Don’t need that level of throughput and want the best pricing? Great, go direct to Deepseek…unless you don’t want training or retaining of your prompts, outputs and metadata. In that case, use DeepInfra.

But don’t want FP4 quantization because it performs worse? then pick Novita. 

The point is that there is an entire matrix of figures to consider, so you’re seeing deals being won not just on price, but across uptime, latency, throughput, error and retry rates, otherwise known as goodput. **This is what makes provider selection inseparable from model selection.**

![many-provider-metrics-to-consider.png](https://d2bbd18t6iidcl.cloudfront.net/website/uploads/many_provider_metrics_to_consider_b2eb6acb72.png){.d-block .mx-auto}
<small>*Many provider metrics to consider*</small>
{.text-center .text-secondary}

## Own your harness, own your outcomes

It’s easy to implement AI once. Benchmark a couple of models on a clean test set. Talk to a couple of inference providers and pick one. Launch in prod and move on to the next initiative.

Meanwhile new models ship monthly. Providers change prices and quantization quietly. The optimal route for a task changes almost weekly. The model/provider mix you picked in Q1 is, by Q3, almost certainly outdated, deprecated, or degraded.

While there are diminishing returns to model improvements for most use cases, because of Jevons paradox, you’ll want to continually optimize your cost-performance. The inference harness will become a de facto standard, enabling operators to **abstract the model and provider through routing**. Routing should handle situations like price caps, goodput targets, and fallback options when your preferred provider is down.

3 options for how to implement routing

- **Independent gateways** - [OpenRouter](https://openrouter.ai/) now routes 25 trillion tokens a week across roughly 400 models and 60-plus providers. You rent neutrality: one API, transparent provider competition, instant access to every new model. The cost is one extra network hop and a small markup. For most companies, especially startups, this is the correct default. Other alternatives include [LLM Gateway](https://llmgateway.io/providers), [Infron](https://infron.ai/), and [Maxim Bifrost](https://www.getmaxim.ai/bifrost).
- **Provider-native routing** – More limiting than independent gateways, provider-native routing promises the ability to evaluate and route to different models within their ecosystem. Easier to have one invoice and SLA but limiting in terms of performance and potentially model selection. Together AI, Baseten, and Modal all offer some form of routing.
- **Build it in-house** – we have portfolio companies that have built their own in-house harnesses for testing and eval. Works well enough if you’re optimizing on a quarterly cadence.

A good harness lets you adopt a new open model the week it’s available, A/B it against your incumbent choice live, and take advantage of provider price changes automatically – as long as you’re measuring the right thing. At the end of the day, companies should care most about the cost per successful outcome. That all-in number should incorporate cost per inference, error rates, human intervention frequency and costs.
___________________________________________________________

The fog was always about not seeing what a token gets you. Harnesses allow you to see the entire field. Your competitive advantage will come from building the system that treats every model and every provider as a contestable, swappable input, priced by outcome rather than by token.

If you’re building software that makes it easier for enterprises to implement AI with confidence or enterprises rolling out AI transformation into production, I’d love to hear from you.