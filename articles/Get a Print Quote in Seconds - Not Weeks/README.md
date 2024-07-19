---
devOnly: true
title: "Get a Print Quote in Seconds - Not Weeks"
subTitle: "When Thousands of Data Points Converge to a Decision in Less Than Three Seconds"
author: ["Yanqi Liu / Back-End Engineer", "Teki Yang / Tech Lead"]
createTime: 2024-07-03
tags: ["B2B", "Multi-tenancy", "Parallel Computing", "Micro Services Architecture"]
thumb: "./thumb.png"
thumb_h: "./thumb_h.png"
intro: "How do you approach creating a system that finds the right supplier and provides a price in less than 3 seconds using hundreds of data points? By approaching this system as an ERP system in the cloud, we were able to keep the system fast at a low cost. Here we share how we did it. "
---

Susan was a marketer organizing a large event. Every year, she started this project by getting last year's list of printed items, knowing that she would need the same items for this year's event. She then would contact last year's printer to get a price quote for the list. She liked that printer and trusted that they would deliver pretty good work on time. Further, Susan didn't really understand print and wanted everything for this event to be as nice as the previous year.

In the past, Susan tried a few different approaches to get print quotes:

+   **Working with online printers** saved money, but often meant a lower\-quality product.
+   **Working with a trusted print buyer**—one point of contact who worked with dozens of trusted printers–simplified the project but added overhead costs.
+   **Working with printers in different specialty areas** required Susan to manage many emails, phone calls, and spreadsheets to track the jobs. Just overwhelming.
+   **Sending a request for quote (RFQ)** to printers allowed her to choose the one with the best price. Even with select printers in mind, such an effort took weeks between writing the RFQ, accepting responses, and then selecting a printer.

All of these approaches are manual, tedious, and time-consuming, requiring someone to work with known and trusted printers. Printing is complex. We may assume that printing is nothing more than using a copier, but depending on what's needed, there may be complex presses, color processing, or special paper finishing involved. And finding the right trusted printer to produce that type of job can take time and money.

**Our startup client was solving this business problem.** And their solution was to create a marketplace that would connect print buyers, like Susan, with trusted, specialized printers (suppliers). The system would then provide buyers the best price for any print specification. No one would need to understand how print "works," create a list of trusted printers to contact, understand specialty printer offerings, or find a print broker. The system would guide the user step-by-step to order a print job, automatically identify the best supplier, and provide a price.

## Our Technical Vision

When we heard about the idea, we immediately thought that this system sounded more like an ERP system within a cloud marketplace than an online store. Long-term, we could envision how the system would eventually access third-party paper systems, presses in print shops, payment systems, and other data sources through various APIs. However, during the first iterations of what we would build, supplier data would need to exist in a cloud database that would be easily accessible for pricing and timing calculations and allow the system to determine which supplier could produce the job that the buyer ordered.

The first step to creating that simple step-by-step buyer experience would require us to develop the ERP infrastructure for a shared supplier platform. We'd also need to build a technical architecture that optimized computing resources, using only what was needed at any time.

## Developing the Platform

When we started building the application, we noticed that it included several systems:

+   The pricing engine (identify a supplier to produce the job and determine price and delivery date)
+   A storefront to guide a buyer when ordering a print job, add it to a cart, and purchase
+   A workspace to track job production status for the buyer, supplier, and customer support
+   Buyer and supplier payments (including order payment, change orders, and invoice management)
+   Job and order history (including reorder functionality)
+   RFQ management

Because the application includes a wide range of functionality that would require pages to describe, we will keep this article focused on explaining the technical architecture and decisions made when building the pricing engine, the core of the application.

## A High-level Overview of How the Pricing Engine Works

Once a buyer select a print product, the pricing engine automatically defines the basics of the job:

+   Determines the paper to use
+   Selects the right presses for the paper
+   Indicates any services required for paper cutting or finishing

Then the pricing engine determines the best supplier to produce the job. The best supplier has the paper specified in stock and a press that can work with that paper. The best supplier also charges the lowest price.

Then, the pricing engine calculates the following costs to create a buyer price:

+   Press
+   Paper
+   Services
+   Bundling or fastening services
+   Parcel (size and number)
+   Shipping
+   Markup
+   Tax
+   Total job price

Additionally, the pricing engine determines the production turnaround time and a delivery date once a shipping option has been selected.

To better understand the scale of the data used to identify a supplier and then generate a price and delivery date, let's review the elements of the pricing engine in more detail:

+   Core databases for papers and presses
+   A SKU system (press, paper, services)
+   Shipping management
+   Markup management
+   Delivery date calculations
+   Industry average
+   Supplier networks

### Core Databases for Papers and Press

To provide a price to a buyer, a supplier would need to indicate the presses it had in its organization, manually enter the press run time and operations data, and indicate the papers and its qualities. These values would be used to determine if the printer has the press and paper available to produce a job, as well as calculate the job price and turnaround time.

### A SKU System

Consistent data is a requirement for any ERP system, and this print pricing system is no different. With the intention of creating a standard across the industry, the client normalized print job data elements by using a SKU system with overarching categories (e.g., single-page, multi-page, envelopes, etc.) defining abstracted options, or attributes.

These attributes included:

+   Size (flat size, finished size)
+   Number of sheets (pages, folding)
+   Paper selection (with sub-categories like color and weight)
+   Services for the print item (like foil or a finish) or to package the final product for shipping (e.g., bundling)

These standards are consistent with what Adobe and HP have defined for their products and map cleanly to them.

With the SKU system identifying the most granular aspects of print jobs, pricing could be applied to various attributes and elements. Using those pricing elements with logic and a thorough pricing algorithm, the system could calculate the total price for a print job. Because this consistent pricing formula is used for all suppliers with a standardized job specification, print prices from different suppliers in the system are always comparable.

### Shipping

The system supports all major shipping carriers and supplier delivery options. It also allows the buyer to enter their shipping account values, use the supplier's shipping offering, or the platform offering. All of these shipping options add to the cost and impact the delivery date.

### Markup

Every organization involved in producing a print job will add its own markups for a specific product, press, paper, service, parcel, shipping, or the overall job cost. Today, printers add these markups manually or use formulas in a series of spreadsheets. We needed to automate markup in our application to calculate a buyer and supplier price.

### Delivery Date

Buyers consider two factors when ordering print: the total job cost and when they will receive the printed item. Customers will adjust turnaround times and shipping options to find that sweet spot of an acceptable delivery date and cost. To support this, we needed to determine not only the cost and size of the printed item, but parcel sizes, number of parcels, shipping costs, and delivery time added to the turnaround time to produce the job.

### Industry Average

To compare prices in the system, our client created the idea of an "industry average" that presented the average costs of papers, presses, services, markup, and shipping. This helped a buyer and the system determine if a job could be produced and if pricing was reasonable.

### Supplier Network

An organization could work with many suppliers. We needed to allow an organization to include the data of multiple suppliers in the pricing engine calculations so the system could select the best supplier to produce a print job within their own network.

## How All of These Systems Provide Pricing to Buyers ASAP

Our goal for this project was to design a system that used supplier data from all these systems to identify the best supplier to produce a buyer's print job and generate the necessary pricing and delivery date in less than 3 seconds.

Early in the project, we discovered that the pricing engine calculations didn't take much time or processing power for a single supplier. However, the processing time and power exponentially increased when applying the pricing formula to the data set of every supplier across a supplier network.

This table summarizes how we approached solving this problem:

<div class="min-width-table">

| What we knew about the system                                                                                                                                                                                        | Solutions to optimize resources and deliver a price in under 3 seconds             |
|:---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|:-----------------------------------------------------------------------------------|
| The suppliers shared data structures but not data values.                                                                                                                                                            | Leverage tenant expansion for managing data scope of a node.                       |
| The algorithms and calculations were the same for all suppliers across the system.<br><br>A lot of data and algorithms were used to make calculations at any single moment.<br><br>Supplier data was rarely updated. | Cache data to memory rather than calling the database to get a current price.      |
| We needed to be mindful of cloud budget usage (it was a startup with limited budget).<br><br>We needed to support limitless scaling (unlimited suppliers and buyers and unlimited transactions at any moment).       | Run the calculations concurrently using parallelism and multithreading.            |
| We needed a contingency plan if a supplier couldn't be identified.                                                                                                                                                   | Standardize and generalize systems to find a supplier for any print specification. |

</div>

![](./chart%201.png)

### The Importance of Tenant Expansion

Each supplier maintains its own data stored on the platform. With tenant-level data isolation, the individual tenant nodes only need the data of the supplier network. This greatly reduces the data scope of each individual node, allowing for horizontal scalability and greatly improved performance and resource utilization.

![](./chart%202.png)

### Cache Data to Memory Rather Than Calling the Database to Get a Current Price

We knew these two facts about the system to be true:

+   Although all supplier data values are unique, their database fields are the same.
+   It would be resource intensive to call the database every time the buyer wanted an updated price or changed the print job specifications. We needed a cheaper way to store SKU and other pricing data from the networked suppliers in the system.

The best solution was to cache data to memory rather than use database calls for each pricing update. Since the amount of data required by a node was greatly reduced by using tenant-level data isolation, the memory capacity in the cache could easily accommodate the data needs of a supplier network.

How we designed it to work:

+   The data needed by the pricing engine was loaded into the memory and mapped to the data structure needed by the pricing engine to make its calculations.
+   The data was read-only, which ensured security and allowed it to be used repeatedly.

By storing the data in cache memory and making it reusable, the system avoided continually allocating new memory space for supplier data accessed from the database. This resulted in improved efficiency and performance, providing buyers a price and delivery date from thousands of supplier data points in less than 3 seconds.

If a supplier did update its data, we added "double insurance" to ensure that the system would always provide a buyer with an accurate price from cache memory data. Since the cache memory and databases are separate systems, we knew that we needed a way to keep the cache current to provide that accurate price. We decided to use the sub-pub model and schedule task synchronization to keep the cached data current and pricing accurate.

![](./chart%203.png)
::: center
Cache data directly to memory
:::

### Parallelism or Multithreading

Since we used the same algorithms across the system to generate a price, we realized that we could clone the algorithms, print specifications, and quote strategy elements and use them simultaneously to compute prices for all suppliers in a network using cache data with multithreading. To reduce latency, we automated CPU resource allocation to increase or decrease depending on the number of suppliers or transactions occurring concurrently. Further, supplier data could be used repeatedly without reallocating memory.

![](./chart%204.png)
::: center
Parallelism between suppliers
:::


### The System Could Always Identify a Supplier

Occasionally, there would be no supplier identified to produce a buyer's job specifications. However, we found a way for the system to abstract the job specification by leveraging the standardized attributes defined and find a supplier as needed.

As you've read earlier, a standardized set of attributes using the SKU system was established to calculate and compare print job prices in real-time. A buyer could choose what was needed for the print job, in the same way a supplier could determine what is offered in SKU management. However, after a buyer determines what they want, the system generates a print specification describing what the finished product will be and uses that to get a price from all suppliers in the system.

If a specific paper or press wasn't an exact match for any supplier in the system, the pricing engine would use standardized paper or press attributes (abstracted job specification elements) so at least one supplier could produce the job at the desired quality. There would always be a way to find a supplier, even in the most complex cases.

![](./chart%205.png)

As shown, with the three-tier structure, tenants could complete the standardization of Bookmark and Brochure, while buyers could complete the customization needs of Bookmark and Brochure.

## Conclusion

Let's revisit the scenario at the beginning where this time, Susan uses this system.

Susan needed to print materials for a tradeshow, but this year, she knew that this print pricing system existed. Rather than calling her printer to receive pricing quotes up to a week later, she went to the application and entered the job specifications as requested in the step-by-step form. On each page of the form, she saw an updated price.

She didn't know that the pricing engine identified the right press, paper, and supplier to produce the job, and then calculated the press, paper, services, markup, shipping and parcel costs along with delivery timelines. All she knew was that the system provided her with a total price and a delivery date based on her selections within less than 3 seconds.

Susan ordered all the jobs within minutes, paid for them, and tracked their status online at the site. She trusted that the supplier selected would do a great job. And she knew she could simply reorder the same items next year, changing the artwork.

She saved hours and hundreds of dollars, knowing she got the best price for high-quality printed items delivered on time. Further suppliers who were a better fit to produce what she needed were able to provide her an instant quote and meet her printing needs. To Susan, this was as easy as a few clicks. She had no idea that the secret to this success was thousands of data points, complex algorithms and logic, and advanced system resource management.
