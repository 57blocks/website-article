---
published: true
title: "Boost Traffic and Leads with Programmatic SEO"
author: ["Shi Chen / Product Manager"]
createTime: 2024-04-21
tags: ["SEO", "Growth", "Alternative Investment"]
thumb: "https://s3.amazonaws.com/assets.57blocks.io/cms_uploads/illustration_seo_db9bc06b49.png"
thumb_h: "./thumb_h.png"
intro: "You may have heard that programmatic SEO could boost site traffic from search engines and increase leads. However, considering the complexities of implementation can be intimidating. In this blog, we describe our design and client collaboration process, along with our findings and we outline the numerous client benefits after launch."
previousSlugs: ["maximizing-online-visibility-the-power-of-programmatic-seo-for-boosting-search-traffic-and-leads"]
---

## Background

We have been working with our alternative investment platform portfolio company to build their system and enable technical integration. The company wanted to broaden its marketing channels to draw more leads by increasing site visitors organically.  
  
One way is to increase search traffic via programmatic SEO. Simply put, programmatic SEO increases search traffic by publishing search-friendly pages on a large and repeatable scale. In our case, the pages would be about hot companies with high search interest or the potential for high search interest. 

Our assumption is that when certain companies or fund managers surge and get public attention, investors would search for more information about their stock or valuation. If our pages pop up in their search and they are willing to leave their contact information, we can aggregate such interest, and follow up for lead qualification and potential sales. 


## Stakeholder Communication to Align on Goals and Process

The first step is to understand the long-term goal, define the short-term goal, and determine how to achieve it. **Figure 1** below shows an initial flow that we had in mind. Together with our partner's marketing team, we discussed where to start, where to end, and how the flow might look. It eventually became simplified and easier to understand (see **Figure 2**). We then can use **Figure 2** to start visual design and technical investigation by my team.        
 

![an-early-draft-of-conceptualizing-the-flow.png](https://s3.amazonaws.com/assets.57blocks.io/cms_uploads/an_early_draft_of_conceptualizing_the_flow_c01d46e50f.png)

<figcaption>Figure 1 - An early draft of conceptualizing the flow</figcaption>

![final-folw-for-phase1.png](https://s3.amazonaws.com/assets.57blocks.io/cms_uploads/final_folw_for_phase1_4a94cd23bb.png)

<figcaption>Figure 2 - Final flow for Phase1</figcaption>

## Preparation of Mass Valuable Data

Our team's dedication to providing better and more valuable information than our competitors is a point of pride. We strive to create a 'dream' page that serves as a comprehensive resource for investors, offering unique insights that can't be found elsewhere.

### Seeking comprehensive and valuable information

Our partner chose companies for which we created pages. Then, for each company, the focus lies in getting a full and unique view. We extracted basic company data from Pitchbook, such as valuation history, industry, investors, etc. Then, manually prepared the company summary, website, SEC CIK number, search terms and also processed all company logos to ensure they have a consistent background and size.             
  
We discussed whether to use our algorithm to calculate the company's current evaluation. Despite our efforts, our algorithm would not be the \*standard\* answer. However, the goal was to draw search traffic. Having each company's current valuation adds unique insights to the page. So, we decided to add a disclaimer to explain any inaccuracies.

### The Unexpected Devil: Cleaning Up Data

During the data preparation process, what took us longer than expected was data validation. We wrote various scripts to validate Excel sheets from Pitchbook and our content generator. Sometimes when we ran a script, there were exceptions. For example, a company's valuation history needs to be added to the data from Pitchbook. Then we need to take a closer look – is it because of a wrong company name that gets no match, or is it missing? Then, we need to fix the company name or build a way to handle cases when the valuation history is missing.            
  
There were also issues with data accuracy. For the raw data, sometimes company names vary, and the company websites have different URLs. We need to make sure it is the same company. Another example, we use company names to get the Google Trend data, but sometimes the company name is too generic, and we need to narrow down the search by defining more specific search terms (i.e., a company called "check" should be searched via "check payroll").             
  
Throughout the process, we maintain a high standard and always keep the actual user in mind. We are committed to ensuring that anyone who lands on our pages is presented with accurate and reliable information. 


## Technical Implementation

### To get it done: the use of Ghost and other considerations

Programmatic SEO is mass-producing content web pages. Therefore, picking a CMS is important. We use Ghost as our site CMS. Part of the reason is it’s our partner's preference. Nevertheless, Ghost has its strengths for programmatic SEO, for example:

+   Mobile Optimization: Ghost themes are designed to be responsive and mobile-friendly, which is beneficial for SEO as Google uses mobile-first indexing.
+   Automatic Meta Tags: Ghost automatically creates SEO-friendly meta titles and descriptions for the posts, which helps search engines understand the content on the pages.
+   Structured Data: Ghost supports Schema.org markup, which automatically generates structured data for the posts. This helps search engines understand the site's content and context, which can improve its visibility in search results.

The weaknesses that made the team feel somewhat uncomfortable included:

+   Limited Extensibility: the lack of plugins limits the ability to add custom functionalities.
+   Learning Curve for Developers: Ghost is built on Node.js, which is not as widely used or familiar as PHP (which WordPress, for example, is built on). 

If we had a chance to consider a programmatic SEO project from scratch, we could contemplate more options than Ghost since we have walked through all the challenges, and there are always new technical inventions. For example, developers mentioned Astro.build (SEO friendly, great performance optimization, and HTML streaming loading), and use next.js to render multiple pages for our React projects. The discussion of potential improvements keep our developers engaged and inspired to explore new technologies and solutions for our programmatic SEO strategy.           
  
We set up several regularly scheduled jobs to retrieve and refresh data periodically. We also have backup logic in case any of the scheduled jobs go wrong.

### The Need for: Search Engine Optimization (SEO) and Evaluation Tools

Above all, making sure the entire site is SEO-friendly is essential. Otherwise, no matter how good our content is, Google won't be able to pick it up. We frequently refer to Google's developer guide (i.e., [Search Engine Optimization Starter Guide](https://developers.google.com/search/docs/fundamentals/seo-starter-guide)) and also use several 3rd party tools (i.e., [Semrush](https://www.semrush.com/), [PageSpeed Insights](https://pagespeed.web.dev/)) to run tests and fix issues as they are found. Even after the project is released, it is worth paying attention to alert emails or checking these sites periodically for any new issues.          
  
We use Hubspot to gather lead info, trigger internal notifications/workflows to follow up and generate reports. We also use Heap and Microsoft Clarity to track user interaction on the page and calculate the conversion rate. 

## How Did We Do and Next Steps

The first batch of companies was released in November 2022. There are now almost [400 companies](https://www.upmarket.co/private-markets/).        
  
You can see a steady increase in leads brought in by this project (Figure 3). 

### SEO Leads Added All Time

![leads-brought-in-by-seo-over-time.png](https://s3.amazonaws.com/assets.57blocks.io/cms_uploads/leads_brought_in_by_seo_over_time_4028d81514.png)

<figcaption>Figure 3 - leads brought in by SEO over time</figcaption>

The number of impressions and clicks has also increased since the initial release (see Figure 4).

![performance-on-search-results.png](https://s3.amazonaws.com/assets.57blocks.io/cms_uploads/performance_on_search_results_082aca6866.png)

<figcaption>Figure 4 - Performance on search results</figcaption>

  

In 2023, over 3 million impressions and over 60,000 clicks were generated primarily related to this SEO project. And it is not just numbers — the company (based in the U.S.) is connected to people from all over the world. Investors from Poland and the U.K. reached out to us, stayed connected, and even became our customers.        
  
This program has been very stable since its initial release. Very few bugs were reported, and our partner has been extremely satisfied with the results.          
  
There are things we can do to improve this project. Now that the project framework is solid, we can add more companies. We are adding more interactive or insightful sections to the company page to increase readability and user interaction.


## Who Should Consider Programmatic SEO?

Although we built our first programmatic SEO project with an alternative investment platform, [UpMarket](https://www.upmarket.co/), programmatic SEO is certainly not limited to any specific industry.    
  
The most important prerequisite is believing in the value of the service/products you provide. Through search engines like Google, we find people who find people who are searching for what we provide. Beyond just SEO, programmatic SEO mass-produces site content to increase the possibility of being found.   
  
It is not the most traditional marketing enduring effect (the number of impressions and clicks just keeps growing). In the long term, it also increases the site's credibility, which will be beneficial in many other ways.    
  
The mass production method uses the same template for scalable content. In our case, it is pre-IPO companies. It can be anything related to your business. For example, a clothing retailer can have different brands, styles, and store locations. If we can think of all these variations and just have a way to combine them, then we increase the chances of being found.   
  
From the implementation point of view, it would be helpful if there were data sources you could rely on to mass-generate data. Not all the data have to be original. A paid 3rd party data source (like Pitchbook) is a good choice. Now, we can alleviate part of the data-prepping job by using AI. On the other hand, originality is also important, not just to avoid Google flagging us as spam, but also for the user to find value in our site. It is worthwhile to create original content manually.
