---
title: "Get a Print Quote in Seconds - Not Weeks"
subTitle: "When Thousands of Data Points Converge to a Decision Point in Less Than Three Seconds"
author: ["Yanqi Liu / Back-End Engineer", "Teki Yang / Tech Lead"]
createTime: 2024-07-26
tags: ["B2B", "Multi-tenancy", "Parallel Computing", "Microservices Architecture"]
thumb: "./thumb.png"
thumb_h: "./thumb_h.png"
intro: "How do you approach creating a system that finds the right supplier and provides a price in less than three seconds using hundreds of data points? By approaching this system as an ERP system in the cloud, we were able to make the process fast and low cost. Here we share how we did it. "
---

Susan was a marketer organizing a large event. She started this project every year by getting last year's list of printed items, knowing that she would need the same items for this year's event. Susan then would contact last year's printer for a price quote for the list. She liked that printer and trusted they would deliver pretty good work on time. To do her job, Susan needed to understand printing and wanted to ensure everything for this event would be as nice as the previous year.

In the past, Susan tried a few different approaches to get print quotes:

+   **Working with online printers** saved money, but often meant a lower\-quality product.
+   **Working with a trusted print buyer**—one point of contact who worked with dozens of trusted printers–simplified the project but added overhead costs.
+   **Working with printers in different specialty areas** required Susan to manage many emails, phone calls, and spreadsheets to track the jobs. Just overwhelming.
+   **Sending a request for quote (RFQ)** to printers allowed her to choose the one with the best price. Even with select printers in mind, such an effort took weeks to write the RFQ, accept responses, and select a printer.

These approaches are manual, tedious, and time-consuming, requiring someone to work with known and trusted printers. Printing is complex. Depending on what's needed, complex presses, color processing, or special paper finishing may be involved. And finding the right trusted printer to produce that type of job can take time and money.

**Our startup client was solving this business problem.** Their solution was to create a marketplace connecting print buyers, like Susan, with trusted, specialized printers (suppliers). The system would provide buyers with the best price for any print specification. No one would need to understand how print 'works,' create a list of trusted printers to contact, understand specialty printer offerings, or find a print broker. The system, designed to be user-friendly, would guide the user step-by-step in ordering a print job, automatically identifying the best supplier, and providing a price.

## Our Technical Vision

When we heard about the idea, we immediately thought that this system sounded more like an ERP system within a cloud marketplace than an online store. In the long term, we could envision how the system would eventually access third-party paper systems, presses in print shops, payment systems, and other data sources through various APIs. However, during the first iterations of what we would build, supplier data would need to exist in a cloud database that would be easily accessible for pricing and timing calculations and allow the system to determine which supplier could produce the job the buyer ordered.

The first step in creating that simple step-by-step buyer experience is to develop the ERP infrastructure for a shared supplier platform. We'd also need to build a technical architecture that optimizes computing resources, using only what is needed at any given time.

## Developing the Platform

When we started building the application, we noticed that it included several systems:

+   The pricing engine (identify a supplier to produce the job and determine price and delivery date).
+   A storefront to guide a buyer when ordering a print job, adding it to a cart, and making a purchase.
+   A workspace to track job production status for the buyer, supplier, and customer support.
+   Buyer and supplier payments (including order payment, change orders, and invoice management).
+   Job and order history (including reorder functionality).
+   RFQ management.

Because the application includes a wide range of functionality that would require pages to describe, we will keep this article focused on explaining the technical architecture and decisions made when building the pricing engine, the core of the application.

## A High-level Overview of How the Pricing Engine Works

Once a buyer selects a print product, the pricing engine automatically defines the basics of the job:

+   Determines the paper to use
+   Selects the suitable presses for the paper
+   Indicates any services required for paper cutting or finishing

The pricing engine then determines the best supplier to produce the job. The best supplier has the paper specified in stock and a press that can work with it. The best supplier also charges the lowest price.

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

Additionally, once a shipping option has been selected, the pricing engine determines the production turnaround time and delivery date.

To better understand the scale of the data used to identify a supplier and then generate a price and delivery date, let's review the elements of the pricing engine in more detail:

+   Core databases for papers and presses
+   A SKU system (press, paper, services)
+   Shipping management
+   Markup management
+   Delivery date calculations
+   Industry average
+   Supplier networks

### Core Databases for Papers and Press

To provide the buyer with a price, a supplier would need to indicate the presses it had in its organization, manually enter the press run time and operations data, and indicate the papers and their qualities. These values would be used to determine if the printer has the press and paper available to produce a job, and calculate the job price and turnaround time.

### A SKU System

Consistent data is a requirement for any ERP system, and this print pricing system is no different. To create a standard across the industry, the client normalized print job data elements using an SKU system with overarching categories (e.g., single-page, multi-page, envelopes, etc.) defining abstracted options or attributes.

These attributes included:

+   Size (flat size, finished size)
+   Number of sheets (pages, folding)
+   Paper selection (with sub-categories like color and weight)
+   Services for the print item (like foil or a finish) or to package the final product for shipping (e.g., bundling)

These standards are consistent with what Adobe and HP have defined for their products and map cleanly to them.

The SKU system identifies the most granular aspects of print jobs, allowing pricing to be applied to various attributes and elements. Using those pricing elements with logic and a thorough pricing algorithm, the system calculates the total price for a print job. Because this consistent pricing formula is used for all suppliers with a standardized job specification, print prices from different suppliers in the system are always comparable.

### Shipping

The system supports all major shipping carriers and supplier delivery options. It also allows the buyer to enter their shipping account values and use the supplier's account or platform offering. These shipping options add to the cost and impact the delivery date.

### Markup

Every organization producing a print job will add markups for a specific product, press, paper, service, parcel, shipping, or the overall job cost. Today, printers manually add these markups or use formulas in spreadsheets. We needed to automate markup in our application to calculate a buyer and supplier price.

### Delivery Date

Buyers consider two factors when ordering print: the total job cost and when they will receive the printed item. Customers will adjust turnaround times and shipping options to find that sweet spot of an acceptable delivery date and cost. To support this, we needed to determine not only the cost and size of the printed item but also parcel sizes, the number of parcels, shipping costs, and delivery time added to the turnaround time to produce the job.

### Industry Average

To compare prices in the system, our client created an "industry average" that presented the average costs of papers, presses, services, markup, and shipping. This helped the buyer and the system determine whether a job could be produced and whether pricing was reasonable.

### Supplier Network

An organization could work with many suppliers. We needed to allow an organization to include the data of multiple suppliers in the pricing engine calculations so the system could select the best supplier to produce a print job within its network.

## How All of These Systems Provide Pricing to Buyers ASAP

Our project aimed to design a system that used supplier data from all these systems to identify the best supplier to produce a buyer's print job and generate the necessary pricing and delivery date in less than three seconds.

We discovered early in the project, that the pricing engine calculations didn't take much time or processing power for a single supplier. However, the processing time and power exponentially increased when applying the pricing formula to the data set of every supplier across a supplier network.

This table summarizes how we approached solving this problem:

<div class="min-width-table">

| What we knew about the system                                                                                                                                                                                        | Solutions to optimize resources and deliver a price in under three seconds             |
|:---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|:-----------------------------------------------------------------------------------|
| The suppliers shared data structures but not data values.                                                                                                                                                            | Leverage tenant expansion to manage the data scope of a node.                       |
| The algorithms and calculations were the same for all suppliers across the system. <p>A lot of data and algorithms were used to make calculations at any single moment.</p>Supplier data was rarely updated. | Cache data to memory rather than calling the database to get a current price.      |
| We needed to be mindful of cloud budget usage (it was a startup with a limited budget).<p>We needed to support limitless scaling (unlimited suppliers and buyers and unlimited transactions at any moment).</p>       | Run the calculations concurrently using parallelism and multithreading.            |
| We needed a contingency plan if a supplier couldn't be identified.                                                                                                                                                   | Standardize and generalize systems to find a supplier for any print specification. |

{.fixed-table}

</div>

![](./chart%201.png)

### The Importance of Tenant Expansion

Each supplier maintains its data stored on the platform. With tenant-level data isolation, the individual tenant nodes only need the data of the supplier network. This dramatically reduces the data scope of each node, allowing for horizontal scalability and significantly improved performance and resource utilization.

![](./chart%202.png)

### Cache Data to Memory Rather Than Calling the Database to Get a Current Price

We knew these two facts about the system to be true:

+   Although all supplier data values are unique, their database fields are identical.
+   Calling the database whenever the buyer wanted an updated price or changed the print job specifications would be resource-intensive. We needed a cheaper way to store SKU and other pricing data from the networked suppliers in the system.

The best solution was to cache data to memory rather than use database calls for each pricing update. Since tenant-level data isolation greatly reduced the amount of data required by a node, the memory capacity in the cache could easily accommodate the data needs of a supplier network.

How we designed it to work:

+   The data needed by the pricing engine was loaded into the memory and mapped to the data structure needed by the pricing engine to make its calculations.
+   The data was read-only, which ensured security and allowed it to be used repeatedly.

By storing the data in cache memory and making it reusable, the system avoided continually allocating new memory space for supplier data accessed from the database. This improved efficiency and performance, giving buyers a price and delivery date from thousands of supplier data points in less than three seconds.

If a supplier did update its data, we added "double insurance" to ensure that the system would always provide a buyer with an accurate price from cache memory data. Since the cache memory and databases are separate systems, we knew that we needed a way to keep the cache current to provide that accurate price. We decided to use the sub-pub model and schedule task synchronization to keep the cached data current and pricing accurate.

![](./chart%203.png)

### Parallelism or Multithreading

Since we used the same algorithms across the system to generate a price, we realized we could clone the algorithms, print specifications, and quote strategy elements and simultaneously compute prices for all suppliers in a network using cache data with multithreading. To reduce latency, we automated CPU resource allocation to increase or decrease depending on the number of suppliers or transactions occurring concurrently. Further, supplier data could be used repeatedly without reallocating memory.

![](./chart%204.png)


### The System Could Always Identify a Supplier

Occasionally, no supplier was identified to produce a buyer's job specifications. However, we found a way for the system to abstract the job specification by leveraging the standardized attributes defined and finding a supplier as needed.

As you've read earlier, a standardized set of attributes using the SKU system was established to calculate and compare print job prices in real-time. A buyer could choose what was needed for the print job, and a supplier could determine what is offered in SKU management. However, after a buyer determines what they want, the system generates a print specification describing the finished product and uses that to get a price from all suppliers in the system.

If a specific paper or press weren't an exact match for any supplier in the system, the pricing engine would use standardized paper or press attributes (abstracted job specification elements) so at least one supplier could produce the job at the desired quality. There will always be a way to find a supplier, even in the most complex cases.

![](./chart%205.png)

As shown, the three-tier structure allowed tenants to standardize Bookmarks and Brochures. Buyers could also complete the customization needs of Bookmarks and Brochures.

## Conclusion

Let's revisit the beginning scenario where Susan uses this system.

Susan needed to print materials for a tradeshow, but this year, she knew that this print pricing system existed. Rather than calling her printer to receive pricing quotes up to a week later, she went to the application. She entered the job specifications as requested in the step-by-step form. On each page of the form, she saw an updated price.

Susan didn't know that the pricing engine identified the right press, paper, and supplier to produce the job, and then calculated the press, paper, services, markup, shipping and parcel costs along with delivery timelines. All she knew was that the system provided her with a total price and a delivery date based on her selections within less than three seconds.

Susan ordered all the jobs within minutes, paid for them, and tracked their status online. She trusted that the supplier selected would do a great job. And she knew she could reorder the same items next year, changing the artwork.

She saved hours and hundreds of dollars, knowing she got the best price for high-quality printed items delivered on time. Further, suppliers who were a better fit to produce what she needed were able to provide her with an instant quote and meet her printing needs. To Susan, this was as easy as a few clicks. She had yet to learn that the secret to this success included thousands of data points, complex algorithms and logic, and advanced system resource management.
