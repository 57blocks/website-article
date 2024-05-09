# website-article

# Introduction:

This is the code repository for our company's articles. You can submit your articles here, and they will eventually appear on the company's website.

## Features
- Supports all basic markdown formats
- The display style of articles on GitHub and official website will be different.
- Supports some CSS/HTML codes, if you have special needs, you can embed HTML/CSS to achieve more complex display styles (since GitHub does not support by default, you can only preview on the official website).


## Preview:
We have two fixed environments to display articles:
- Product Environment - Will display articles from the `main` branch
- Testing Environment - Will display articles from the `dev` branch


# Guide

## Standards
1. Articles are in markdown format, using GFM format.
2. Articles are placed under the `articles` folder and have their own independent folder, which, after slugify, will act as the article's url
3. Articles are named `README.md` in their respective folders
4. Each article needs to contain the metadata of the article at the beginning, the template of the metadata is as follows(yaml format):

```yaml
---
title: "The title of the article"
author: ["YourName / Full stack engineer", "SecondAuthorName / PositionOfTheAuthor"]
createTime: 2024-04-01
tags: ["Web3", "AnyOtherTag"]
thumb: "https://example.com/theThumbOfTheArticle.png"
intro: "Some introduction to the article"
---
```


## How to submit your article
One-liner version: Add your article according to the standards and merge it into the `dev` branch in any way you like.

Detailed version:
### Local Submission
- Clone this code repository locally
- Create a branch of your own

```bash
git checkout -b feat/AnyBranchYouWant
```

- Create your article content according to the standards. You can use any markdown editor you like
- You can add the assets needed for the article directly to the code.
- Submit your code and create a pull request to `dev` branch.


### Direct Online Editing
- Create your branch online in [page](https://github.com/57blocks/website-article/branches) (Please start the branch name with `feat/*`)
  ![image](https://github.com/57blocks/website-article/assets/6326386/b0e98017-1d09-414e-9711-9d458c5e46c1)

- Create your markdown file online
  ![image](https://github.com/57blocks/website-article/assets/6326386/26e05825-2e00-4469-bde1-b331609bddb9)

The biggest advantage of creating online is that you can drag and drop assets into the editor window for upload and real-time preview.
- Save and submit the file to your branch.
- After you finish editing the article, create a pull request to `dev` branch.


## How to preview your article on the company's website
- First, get the raw address of your article on GitHub. You can obtain the raw url of your file by following the screenshot location below. The url should be link `https://github.com/57blocks/website-article/raw/dev/articles/Image%20Quality%20Assessment/README.md`.
  ![image](https://github.com/57blocks/website-article/assets/6326386/685bfe0b-e318-45cf-8a90-388bcfb31578)

  

- Use the following URL, paste your raw address, and click preview.

```
https://57blocks.io/blog/preview
```

The default raw file is cached (5-minute cache) so you may not be able to get the latest preview effect.


