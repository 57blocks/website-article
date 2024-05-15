---
title: "Maximizing Online Visibility: The Power of Programmatic SEO for Boosting Search Traffic and Leads"
author: ["Shi Chen / Product Manager"]
createTime: 2024-04-21
tags: ["SEO", "Growth", "Alternative Investment"]
thumb: "https://s3.amazonaws.com/assets.57blocks.io/cms_uploads/illustration_seo_db9bc06b49.png"
intro: "The article shows how automated SEO can attract more visitors by producing lots of optimized pages. The key steps include goal planning, data handling, and using tools like a CMS for implementation. This method successfully improved online exposure and lead generation."
---

## Background

We have been working with our portfolio company, an alternative investment platform to build their system and enable technical integration. The company wanted to broaden their marketing channels to draw more leads, potentially via increasing site visitors organically.  
  
One way is to increase search traffic via programmatic SEO. Simply put, programmatic SEO is a way of increasing search traffic by publishing search-friendly pages on a large and repeatable scale. In our case, the pages would be about hot companies with high search interest or the potential for high search interest. The thought is, when certain companies or fund managers surge and get public attention, investors would search for them and try to get more information about their stock or valuation. If our pages pop up in their search and they are willing to leave their contact information, we can then aggregate such interest, and follow up for lead qualification and potential sales. 


## Stakeholder Communication to Align on Goals and Process

The first step is always to understand the long-term goal, define the short term goal and how to achieve it. **Figure 1** below shows an initial flow that I had in mind. Together with our partner’s marketing team, we discussed where to start, where to end, and how the flow might look like. It eventually got simplified and easier to understand (see **Figure 2**). I can then take **Figure 2** to start visual design and technical investigation inside my team.        
 

![an-early-draft-of-conceptualizing-the-flow.png](https://s3.amazonaws.com/assets.57blocks.io/cms_uploads/an_early_draft_of_conceptualizing_the_flow_c01d46e50f.png)

<figcaption>Figure 1 - An early draft of conceptualizing the flow</figcaption>

![final-folw-for-phase1.png](https://s3.amazonaws.com/assets.57blocks.io/cms_uploads/final_folw_for_phase1_4a94cd23bb.png)

<figcaption>Figure 2 - Final folw for Phase1</figcaption>

## Preparation of Mass Valuable Data

We want our page to be better than competitors and provide as much useful and unique information as possible to address a large universe of search queiries. Therefore, the “dream” page in our mind needs to be a one-stop shop for things an investor would want to know about this company, and it also has to have some unique insights that an investor can’t get else where.

### Seeking comprehensive and valuable information

Our partner picked companies to create page for. Then for each company, the heavy work lies in getting a somewhat full and unique view. We were able to get basic company data from Pitchbook, such as valuation history, industry, investors, etc. We also manually prepared company summary, website, SEC CIK number, search terms, and etc. Also we manually processed all company logos, to make sure it has consistent background and size so.             
  
One argument we had is whether to use our own algorithm to calculate the company’s current evaluation. Our own algorithm, as best as we can try, would not be the \*standard\* answer. However, if we recall why we want to do this in the first place, the goal is to draw search traffic. Having each company’s current valuation adds the unique insights of the page. So in the end we decided to have it. We put together a disclaimer on the page that kind of excused us for not being perfectly accurate.

### The unexpected devil: cleaning up data

During the data preparation process, what took us longer than expected was data validation. We wrote various scripts to validate excel sheets from pitchbook and our content generator. Sometimes when we run a script, there could be exceptions. For example, for the data from Pitchbook, a company’s valuation history is missing. Then we need to take a closer look – is it because of a wrong company name that get no match, or it is really missing? Then we need to either fix the company name, or build a mechanism to handle cases when the valuation history is missing.            
  
There are also issues for data accuracy. For the raw data, sometimes the company names have variations, and the company websites have different URLs. We need to make sure it is the same company. Another example - we use company names to get the Google Trend data, but sometimes the company name is too generic, and we need to narrow down the search by defining more specific search terms (i.e. a company called “check” should be searched via “check payroll”).             
  
Throughout the process, holding a high standard and having the real user in mind is important. If anyone lands on these pages, we don’t want them to see inaccurate information. 


## Technical implementation

### To get it done: the use of Ghost and other considerations

Programmatic SEO is essentially mass-producing content web pages. Therefore, picking a CMS is important. We use Ghost as our site CMS. Part of the reason is because of our partner’s preference. Nevertheless, Ghost has its strengths for programmatic SEO, for example:

+   Mobile Optimization: Ghost themes are designed to be responsive and mobile-friendly, which is beneficial for SEO as Google uses mobile-first indexing.
+   Automatic Meta Tags: Ghost automatically creates SEO-friendly meta titles and descriptions for the posts, which helps search engines understand the content on the pages.
+   Structured Data: Ghost supports Schema.org markup, which means it can generate structured data for the posts automatically. This helps search engines to understand the content and context of the site, which can improve site visibility in search results.

The weaknesses that made the team feel somewhat inconvenient include:

+   Limited Extensibility: the lack of plugins limit the ability to add custom functionalities.
+   Learning Curve for Developers: Ghost is built on Node.js, which is not as widely used or familiar as PHP (which WordPress, for example, is built on). 

If we had a chance to consider a programmatic SEO project from scratch, we can consider more options than Ghost, since we have walked through all the challenges, and there are always new technical inventions. For example, developers mentioned Astro.build (SEO friendly, great performance optimization, and html streaming loading), and using next.js to render multiple pages for our react projects.           
  
A number of regularly scheduled jobs are set in place to retrieve and refresh data periodically. We also have back-up logics in case any of the scheduled jobs go wrong.

### To do it well: Search Engine Optimization (SEO) and evaluation tools

Above all, making sure the whole site is SEO-friendly is important. Otherwise, no matter how good our content is, Google won’t be able to pick them up. For this, we refer to Google’s developer guide (i.e. [Search Engine Optimization Starter Guide](https://developers.google.com/search/docs/fundamentals/seo-starter-guide)) frequently, and we also use a number of 3-rd party tools (i.e. [Semrush](https://www.semrush.com/), [PageSpeed Insights](https://pagespeed.web.dev/)) to run tests against the site and fix issues as they are found. Even after the project has been released, it was worth paying attention to their alert emails or checking these sites periodically for any new issues.          
  
We use Hubspot to gather lead info, trigger internal notifications/workflows to follow up, and generate reports. We also use Heap and Microsoft Clarity to track actual user interaction on the page and calculate the conversion rate. 

## How Did We Do and Next Steps

The first batch of companies were released in November 2022. Up until now, there are almost [400 companies](https://www.upmarket.co/private-markets/).        
  
You can see a steady increase of leads brought in by this project (Figure 3). 

### SEO Leads Added All Time

![leads-brought-in-by-seo-over-time.png](https://s3.amazonaws.com/assets.57blocks.io/cms_uploads/leads_brought_in_by_seo_over_time_4028d81514.png)

<figcaption>Figure 3 - leads brought in by SEO over time</figcaption>

The number of impressions and clicks have also been increasing since the initial release (see Figure 4).

![performance-on-search-results.png](https://s3.amazonaws.com/assets.57blocks.io/cms_uploads/performance_on_search_results_082aca6866.png)

<figcaption>Figure 4 - Performance on search results</figcaption>

  

Over 3 million impressions and over 60,000 clicks were generated primarily related to this SEO project in 2023 alone. And it is not just numbers - the company (based in the U.S.) was able to connect to people from all over the world. Investors from Poland and UK reached out to us, stayed connected, and even became our customer.        
  
This program has been very stable since the initial release. Very few bugs were reported. Our partner has been extremely satisfied with the results.          
  
There are things we can do to further improve this project. Now that the project framework is pretty solid, we can add more companies. We are also trying to add more interactive or insightful sections on the company page to increase readability and user interaction.


## Who should consider programmatic SEO

Although we’ve done our first programmatic SEO project with an alternative investment platform, [UpMarket](https://www.upmarket.co/), programmatic SEO is certainly not limited to any specific industry.    
  
To start considering this, I think the most important pre-requisite is - you believe in the value of the service/products you provide. Throughout search engines like Google, it is natural to find people who happen to be in search of what we can provide. Beyond just SEO, programmatic SEO mass produces site content to increase the possibility of being found.   
  
It is not the most traditional way in marketing, but it can be cost saving (with a mature technical team) and has a long term effect (the number of impressions and clicks just keeps growing). In the long term, it also increases the site credibility, which will be beneficial in many other ways.    
  
The way of mass production is using the same template for scalable content. In our case, it is pre-ipo companies. It can be anything, relating to your business. For example, for a clothing retailer, it can be different brands, different styles, different store locations… If we can think of all these variations, and just have a way to combine these variations, then we increase the chances of being found.   
  
From the implementation point of view, it would be helpful if there are data sources you can rely on to mass generate data. Not all the data have to be original. Paid 3-rd party data source (like Pitchbook) is a good choice. Now we might be even able to alleviate part of the data prepping job by using AI. On the other hand, originality is also important, not just for Google not to flag us as spam, but also for the user to find value in our site. It is worthwhile to create original content manually (like summary).
