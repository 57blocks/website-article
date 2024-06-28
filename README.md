# Guide to Publishing Articles

---

## Table of Contents

1. [Introduction](#introduction)
2. [Standards and Structure](#standards-and-structure)
    - [Metadata](#metadata)
    - [Folder and File Naming](#folder-and-file-naming)
3. [Writing and Styling](#writing-and-styling)
    - [Markdown Syntax](#markdown-syntax)
    - [Extended Markdown Syntax](#extended-markdown-syntax)
4. [Submitting Your Article](#submitting-your-article)
    - [Local Submission](#local-submission)
    - [Online Editing](#direct-online-editing)
5. [Previewing Your Article](#previewing-your-article)
    - [Preview by URL](#preview-by-url)
    - [Realtime Preview](#realtime-preview)
6. [Review and Approval Process](#review-and-approval-process)
    - [Pull Request Creation](#pull-request-creation)
    - [Content Review](#content-review)
    - [Image Optimization](#image-optimization)
7. [Merging and Deployment](#merging-and-deployment)
    - [Final Testing](#final-testing)
    - [Deployment to Main Branch](#deployment-to-main-branch)

---

## Introduction

Welcome to the article publishing repository for our company's website. This guide will walk you through the steps of writing, submitting, and optimizing your articles using GitHub. If you encounter any issues with permissions or require assistance with specific Markdown features, please contact Marvin or the WCP development team.

---

## Standards and Structure

### Metadata

Each article must begin with metadata in YAML format. This metadata provides essential information that helps in organizing and displaying the article correctly on the company's website.

*Metadata Template*

```yaml
---
title: "The title of the article"
author: ["YourName / Full stack engineer", "SecondAuthorName / PositionOfTheAuthor"]
createTime: 2024-04-01
tags: ["Web3", "AnyOtherTag"]
thumb: "https://example.com/theThumbOfTheArticle.png"
thumb_h: "https://example.com/theHorizontalThumbOfTheArticle.png"
intro: "Some introduction to the article"
---
```
</details>

> [!note]
> The `thumb` and `thumb_h` images are placeholders and should be redesigned later. Contact the designer for the final images.

### Folder and File Naming

1. Articles should be in Markdown format, using GFM (GitHub Flavored Markdown).
2. Each article should be placed in its own independent folder within the `articles` directory.
3. Folder names should be slugified and will serve as the article's URL.
4. Each article must be named `README.md`.

---

## Writing and Styling

### Markdown Syntax

Our repository supports all basic Markdown formats. For a detailed guide, refer to [GitHub's Markdown Guide](https://docs.github.com/en/get-started/writing-on-github/getting-started-with-writing-and-formatting-on-github/basic-writing-and-formatting-syntax).

### Extended Markdown Syntax

To enhance the presentation of your articles, we support several Markdown plugins:

- **plugin-abbr** [referrence](https://mdit-plugins.github.io/zh/abbr.html)
  <details>
  <summary>Usage Example</summary>

  ```
  *[HTML]: Hyper Text Markup Language
  *[W3C]:  World Wide Web Consortium
  The HTML specification is maintained by the W3C.
  ```
  </details>

- **plugin-alert** [referrence](https://mdit-plugins.github.io/alert.html)
  <details>
  <summary>Usage Example</summary>

  ```markdown
  > [!warning]
  > This is warning text
  ```
  </details>

  Supported alert types: `note`, `tip`, `important`, `caution`, `warning`.

- **align** [referrence](https://mdit-plugins.github.io/align.html)
  <details>
  <summary>Usage Example</summary>

  ```markdown
  ::: left
  Contents to align left
  :::

  ::: center
  Contents to align center
  :::

  ::: right
  Contents to align right
  :::

  ::: justify
  Contents to align justify
  :::
  ```
  </details>

- **img-size** [referrence](https://mdit-plugins.github.io/img-size.html)
  <details>
  <summary>Usage Example</summary>

  ```markdown
  ![Alt](/example.png =200x300)
  ![Alt](/example.jpg "Image title" =200x)
  ![Alt](/example.bmp =x300)
  ```
  </details>

- **footnote** [referrence](https://mdit-plugins.github.io/footnote.html)
  <details>
  <summary>Usage Example</summary>

  ```markdown
  Footnote 1 link[^first].

  [^first]: Footnote can reference [^second].
  [^second]: Other footnote.
  ```
  </details>

If you require additional markdown syntax support, please contact the WCP project team.

---

## Submitting Your Article

### Local Submission

1. Clone the repository locally.
2. Create a new branch.

   **Note**: The branch name should start with `feat/`, `author/`, or `article/`.

   ```bash
   git checkout -b feat/YourBranchName
   ```

3. Write your article adhering to the standards and guidelines.
4. Add necessary assets directly to the code.
5. Commit your changes and push to your branch.
6. Create a pull request (PR) to the `dev` branch for review.

### Direct Online Editing

1. Create a branch on [GitHub](https://github.com/57blocks/website-article/branches).

   **Note**: The branch name should start with `feat/`, `author/`, or `article/`.

2. Create your markdown file using GitHub's online editor.
3. Save and submit the file to your branch.
4. Create a pull request (PR) to the `dev` branch once editing is complete.

> [!tip]
> Online editing allows real-time preview and asset drag-and-drop functionality, providing a more seamless editing experience.

---

## Previewing Your Article

### Preview by URL

1. Obtain the raw URL of your article from GitHub, considering there is a 5-minute cache delay.

   Accepted formats:

    - `https://github.com/57blocks/website-article/tree/dev/articles/YourArticle`
    - `https://github.com/57blocks/website-article/blob/dev/articles/YourArticle/README.md`
    - `https://github.com/57blocks/website-article/raw/dev/articles/YourArticle/README.md`
    - `https://raw.githubusercontent.com/57blocks/website-article/dev/articles/YourArticle/README.md`

2. Use the [Preview Tool](https://dev-ui.57blocks.io/blog/preview) and paste your raw URL to preview how it will appear on the company's website.

### Realtime Preview

For continuous style debugging, use the [Realtime Editor](https://dev-ui.57blocks.io/blog/preview-editor). Paste your markdown content into the input field and preview it in real time.

**Note**: The `baseurl` field ensures that images with relative paths display correctly. If using absolute paths, this can be ignored.

---

## Review and Approval Process

### Pull Request Creation

Create a pull request (PR) from your feature branch to the `dev` branch. Include a clear description of your changes.

Each time you make a modification to the PR, a bot will automatically generate a preview URL, allowing reviewers and designers to provide feedback conveniently.

### Content Review

A designated reviewer will evaluate the content of your article. Ensure all feedback and required revisions are addressed.

### Image Optimization

Upon generating the PR, you will receive a preview URL. Use this link to get design feedback and optimize images in your article. Large PNG images from sources like Figma may need compression using tools like [TinyPNG](https://tinify.com/).

---

## Merging and Deployment

### Final Testing
When the author feels they have completed all the preparation work for the article and are ready to publish it, the author should contact the WCP team or the testing team. The testing team will perform the final testing and verification of the article.

If the tester or designer has any feedback, **please add the corresponding feedback or comments in the PR**. The author will only be able to merge the code once they have addressed all the feedback and made the necessary adjustments to the article.

Once the testing team has validated the article on the dev environment and all feedback has been addressed, the author can then merge the code into the `dev` branch.

If you need any technical support during the process, please contact the wcp project team.

### Deployment to Main Branch

Once the testing is complete and the article is validated, the website publisher will merge the `dev` branch to the `main` branch, finalizing the deployment to the production environment.

---

By following these guidelines, you ensure a consistent, smooth, and high-quality publishing process for your articles. Happy writing!
