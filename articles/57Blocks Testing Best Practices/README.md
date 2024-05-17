---
title: "57Blocks Testing Best Practices"
author: ["Jia Chen / QA Engineer", "Martha Luo / QA Engineer"]
createTime: 2024-05-07
tags: ["Software Testing Lifecycle", "Continuous Integration",  "Test Automation Frameworks"]
thumb: "./thumb.png"
thumb_h: "./thumb_h.png"
intro: "This article explores the practical testing best practices adopted by 57blocks QA teams to navigate the software testing complexities effectively. These strategies are born from hands-on application in real-world projects, offering actionable insights into how embracing these methods can not only mitigate difficulties but potentially convert them into leverage for elevating software quality, enhancing team performance, and improving overall project delivery."
---

## Introduction

Testing, at its core, is a practice aimed at ensuring that software behaves as intended while identifying any discrepancies or defects before they impact the end user. However, effective testing is not just about finding bugs; it is about instilling confidence, both in the development team and the stakeholders, that the software will perform consistently under diverse conditions and over time.

The goals driving the adoption of testing best practices are multifaceted. They include affirming the software's quality, enhancing the user experience, and safeguarding against future complexities. A well-defined testing strategy can streamline development cycles, optimize resources, and minimize post-release issues, ultimately leading to a more successful product and a satisfied customer base.

Yet, these practices are not without their challenges. Complex codebases, evolving technologies, tight deadlines, and resource constraints pose significant hurdles. With the myriad of tests—from unit to integration to system testing—the need to prioritize becomes paramount. Moreover, there's a pressing requirement to incorporate these practices into agile methodologies and continuous integration pipelines, ensuring they add value and not overhead.

In this article, we will delve into the testing best practices that 57blocks QA teams leverage to overcome these obstacles. These practices are not merely theoretical ideals; they are pragmatic approaches honed by real-project experiences. We'll explore how adopting these practices can not only alleviate difficulties but can transform them into opportunities for improving software quality, team efficiency, and project outcomes.

## New feature manual testing and automated regression tests

- **Identify the new features**: When new features are added to the software, it is important to identify them, know how they work (within the system and how they impact the system), and ensure that they are tested thoroughly.
- **Create & review manual test cases**: Manual test cases should be created and reviewed to test the new features, including any edge cases or scenarios that may not be covered by automated testing. Here are the important elements to consider when writing a manual test case: Test Case ID, Title, Description, Preconditions, Module/Feature, Test Steps, Test Data, Expected Result, Actual Result (to be filled during test execution), Status (to be filled during test execution), Priority, Owner, Severity, Comments/Notes.
- **Execute manual test cases**: The manual test cases should be executed to ensure that the new features are working as intended, and to identify any issues or defects. The implementation of new features may affect existing automated test cases, so in parallel, start building automated tests to ensure that the new functionality is integrated and there is no impact to the automated test cases.
- **Identify, create & update automated tests**: Consider which tests should be identified to automate. Automate repetitive, time-consuming regression tests that verify core functionality and do not change frequently. Also update existing automated tests affected by changes and new features.
- **Integrate automated testing**: Once the manual testing of new features is complete, automated testing should be integrated into the testing process.
- **Run automated tests**: The automated regression tests should be run to ensure that the new features do not negatively impact existing software functionality.
- **Analyze test results**: The results of both manual testing and automated regression testing should be analyzed to identify any issues or defects.
- **Fix issues and defects**: Any issues or defects identified during testing should be fixed, and the testing process should be repeated until all issues are resolved.


This process should be repeated for each release, with a focus on testing new features and ensuring that the existing functionality of the software is not impacted.

![test process](test_process.png)


## Prepare multiple environments

Multiple test environments ensure that the software application is thoroughly tested and validated before it is released to end-users. Each environment serves a specific purpose in the software development and testing process.

![test env](test_env.png)

- **Development environment**: The development environment is used by developers to write and test code. This environment is typically used for unit testing and integration testing, and it may include tools such as debuggers, code editors, and other development tools.
- **QA environment**: The QA environment is used for testing the software application in a more realistic environment. This environment is typically used for regression testing, user acceptance testing, and performance testing. The QA environment should closely resemble the production environment to ensure accurate testing.
- **Pre-production environment**: Perform final UAT, load testing, and accessibility testing in preprod. It is used to test the software application in a production-like environment before it is released to production. This environment is typically used for testing the deployment process, integration with other systems, and any other final testing before the release.
- **Production environment**: Perform monitoring, optimization and minimal testing in production. It is the live environment where the software application is deployed and used by end-users. This environment should be stable, secure, and reliable, and it should be closely monitored to ensure availability and performance.


## Use Jenkins for continuous testing, quality monitor and deployment

Using Jenkins to build a project, trigger tests, and generate a test report before releasing the software application helps to ensure that the software is thoroughly tested and validated before it is released to end-users. Using Jenkins can help to minimize the risk of issues and defects in the final product, and ensures that the software meets the quality standards of the development team.

![continuous test](continuous_test.png)

Before release, Jenkins can integrate development and automated testing to detect risks as early as possible.

- **Development environment**: The first step is to create a new project and configure the project in Jenkins. This involves defining the steps necessary to build the software application, such as compiling the code, packaging the application, and deploying it to a test environment.
- **Configure test automation**: Once the build job is configured, the next step is to configure automated tests to run as part of the build process. This can include unit tests, integration tests, and other automated tests.
- **Configure a trigger**: Jenkins can be configured to automatically trigger a build when code changes are committed to the version control system. This ensures that builds are automatically QA-checked whenever changes are made to the codebase. We can extend this functionality to create different types of triggers, such as a trigger for code changes, a trigger to happen at a  specified time, or a manual trigger.
- **Run automated tests**: Once the build job is triggered, Jenkins will automatically run the configured automated tests. The tests will be run in the test environment, and the results of the tests will be recorded by Jenkins.
- **Generate a test report**: Once the tests are completed, Jenkins will generate a test report that summarizes the test results. The test report will include information such as the number of tests that passed, the number of tests that failed, and any errors or issues that were encountered during the testing process.
- **Review and analyze the test report**: The test report should be reviewed and analyzed to ensure that the software application is ready for release. Any issues or errors that were identified during the testing process should be addressed before the software application is released.
- **Release the software application**: Once the testing process is complete, and all issues or errors have been addressed, the software application can be released to production.


After the software application has been released, Jenkins can be used to monitor the production environment for any issues or errors.



- **Set up monitoring tools and automated test jobs**: To monitor the production environment, you will need to run automated test jobs and set up monitoring tools such as log aggregation tools, performance monitoring tools, and error tracking tools. These tools will help to identify any issues or errors that occur in the production environment.
- **Analyze logs**: Jenkins can be used to analyze metrics and logs from the production environment to identify any issues or errors. This can include analyzing performance metrics, error logs, and other relevant data.
- **Automate remediation**: If any issues or errors are detected in the production environment, Jenkins can be configured to automatically remediate the issues or alert the relevant team members to address them.
- **Continuously improve**: Using Jenkins to monitor the production environment is an ongoing process. By analyzing the data and identifying areas for improvement, the development team can continuously improve the software application and ensure that it meets the needs of end-users.



## Choose a suitable script/language/framework for the project and team

Different kinds of tests require different frameworks. Most test frameworks can support multiple languages. 57Blocks has projects using both Python and Javascript. The choice between Python and JavaScript will depend on the project requirements and the skills of the team. If the project is web-based and requires front-end testing, then JavaScript may be the better choice. However, if you are looking for a language that is easy to learn and has a rich set of test libraries, then Python may be the better choice.


### Benefits of the Python test framework:

- **Easy to learn**: Python is known for its simple syntax, which makes it easy for beginners to learn and use.
- **Large community**: Python has a large and active community, which means that there is a wealth of resources and support available.
- **Rich test libraries**: Python has a rich set of test libraries, such as PyTest and unittest, which offer a range of features for automation testing.
- **Multi-purpose language**: Python is a multi-purpose language, which means that it can be used for a range of tasks beyond automation testing.


### Benefits of the JavaScript test framework


- **Popular choice for web applications**: JavaScript is a popular choice for web applications, which means that it is well-suited for automation testing of web-based applications.
- **Front-end testing**: JavaScript is commonly used for front-end testing, which means that it can be integrated with popular front-end frameworks such as React and Angular.
- **Large community**: JavaScript has a large and active community, which means that there is a wealth of resources and support available.
- **Cross-functional testing**: JavaScript can be used for both front-end and back-end testing, which means that it can be used for cross-functional testing. When both front-end and back-end tests are written in JavaScript, they can be managed and run using the same set of tools. Developers and testers can run them as part of a Continuous Integration/Continuous Deployment (CI/CD) pipeline, ensuring that tests for both the client and server sides are automatically running on every commit.


## Set up an automation framework

Setting up an automation framework for a project can help you streamline your testing efforts and improve the overall quality of your application.

- **Identify reusable UI components**: This includes page objects reused across tests and across the site like text boxes, buttons, links, etc.
- **Use locators wisely**: Locators like ID, name, XPath, CSS, etc. are used to find UI elements. Elements may sometimes change due to new features and bug fixes. Using locators wisely  in automated tests is important and helps reduce changes in automated tests. Make the locators as specific as possible. We prefer using ID and name then XPath.
- **Modularize the tests**: Break down large end-to-end tests into smaller, focused tests based on functionality. This makes the tests easier to maintain and debug. It is better to integrate the automated testing framework with BDD (Behavior-driven development) or BDD thinking to make the test easier to understand and reduce code changes caused by business changes.
- **Use data driven testing**: Pass test data from external files (Excel, CSV) and iterate your tests over the data. This allows you to expand test coverage without writing too many repetitive tests.
- **Add assertions**: Validate that the actual results of UI interactions match the expected results. Check and verify elements like page title, URL, button text, form field values, etc.
- **Add screenshots and videos**: This helps in debugging failed tests and understanding what went wrong at runtime.
- **Run tests in a CI/CD pipeline**: Run automated UI tests in a continuous integration server like Jenkins, Travis CI, etc. This ensures the tests are run for every code change and the quality of the build is maintained.
- **Maintain the test suites**: Keep the test code clean and up to date with the changes in the application.
    - Refactor tests when the UI changes
    - Delete redundant tests and
    - Add new tests as needed to support new functionality. 

- **Report intelligently**: In many cases, the combination of both framework-provided reports for immediate feedback and extensive Jenkins reports for continuous tracking and visualization offers the best solution.
    - Use the test framework's reporting features to view reports, statistics and graphics based on test runs. This gives good visibility into the quality and coverage of automated tests. The framework-provided reports typically include test results of pass/fail status for each test, often with error messages and stack traces for failures. Also, we can get timing information regarding how long each test took to run, which can help identify slow tests or potential performance issues. These reports are valuable for immediate feedback on the latest changes. We can run tests locally or on a development server to get an instant view of whether the recent code changes have caused any regressions.
    - Jenkins-generated reports allow the team to monitor the average test run duration, providing a clear visual if there has been a gradual increase in testing times due to recent commits. Additionally, when Jenkins detects a failing test, it automatically sends an alert to the team's chat application, prompting immediate attention. Over time, Jenkins starts to show the flakiness score for each test, helping the team prioritize which tests need attention for stability improvements.



















