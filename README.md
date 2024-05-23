# website-article

# Introduction:

This is the code repository for our company's articles. You can submit your articles here, and they will eventually appear on the company's website.

If you have any permission issues when pushing the article, please contact Marvin or the developers of the WCP project. 

If you have any special styles or effects that cannot be achieved with the default Markdown when writing documents, please contact Marvin or the developers of the WCP project.


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
thumb_b: "https://example.com/theHorizontalThumbOfTheArticle.png"
intro: "Some introduction to the article"
---
```

> [!important]
> The `thumb` and `thumb_b` is coming from the designer. Please contact the designer.



## Features
- Supports all basic markdown formats(reference: [link](https://docs.github.com/en/get-started/writing-on-github/getting-started-with-writing-and-formatting-on-github/basic-writing-and-formatting-syntax)).
- The display style of articles on GitHub and official website will be different.
- Supports some CSS/HTML codes, if you have special needs, you can embed HTML/CSS to achieve more complex display styles (since GitHub does not support by default, you can only [preview on the official website](#how-to-preview-your-article-on-the-companys-website)).

## Extended markdown syntax
To provide a richer presentation of the article content, we have extended some common Markdown syntax using Markdown plugins.

### plugin-alert
[referrence](https://mdit-plugins.github.io/alert.html) 

you can create block alerts with blockquote starting with `[!ALERT_NAME]` like:
```
> [!warning]
> This is warning text
```
The `ALERT_NAME` isn't case sensitive and can be the following string:
```
note
tip
important
caution
warning
```
<img width="681" alt="image" src="https://github.com/57blocks/website-article/assets/6326386/43bf17a3-3a15-4de8-941c-0d7783c29ee1">

### align
[referrence](https://mdit-plugins.github.io/align.html) 

```
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

### img-size
[referrence](https://mdit-plugins.github.io/img-size.html) 

You can use `=widthxheight` to specify the image size at the end of image link.

Both width and height should be number which means size in pixels, and both of them are optional. The whole marker should be separated with spaces from the image link.

```
![Alt](/example.png =200x300)
![Alt](/example.jpg "Image title" =200x)
![Alt](/example.bmp =x300)
```
will be parsed as:
```
<img src="/example.png" width="200" height="300" />
<img src="/example.jpg" title="Image title" width="200" />
<img src="/example.bmp" height="300" />
```

### footnote 
[referrence](https://mdit-plugins.github.io/footnote.html) 
```
Footnote 1 link[^first].

[^first]: Footnote can reference [^second].
[^second]: Other footnote.
```

## Preview:
We have two fixed environments to display articles:
- Product Environment - Will display articles from the `main` branch
- Testing Environment - Will display articles from the `dev` branch


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

### Preview by url
- First, get the raw address of your article on GitHub. You can obtain the raw url of your file by following the screenshot location below. Any of the following url formats are acceptable:
  ```
  // The article folder url
  https://github.com/57blocks/website-article/tree/dev/articles/Image%20Quality%20Assessment

  // The article README blob url
  https://github.com/57blocks/website-article/blob/dev/articles/Image%20Quality%20Assessment/README.md

  // The article README raw url
  https://github.com/57blocks/website-article/raw/dev/articles/Image%20Quality%20Assessment/README.md

  // The article README raw url
  https://raw.githubusercontent.com/57blocks/website-article/dev/articles/Image%20Quality%20Assessment/README.md
  ```
  ![image](https://github.com/57blocks/website-article/assets/6326386/685bfe0b-e318-45cf-8a90-388bcfb31578)
  

- Open the url https://dev-ui.57blocks.io/blog/preview, And just paste your raw address, and click preview.
  <img width="1620" alt="image" src="https://github.com/57blocks/website-article/assets/6326386/6fa29a85-0352-4ad4-a04b-8e9bf0845b9e">


The default raw file is cached (5-minute cache) so you may not be able to get the latest preview effect.

### Realtime preview by raw markdown
- open the realtime editor: https://dev-ui.57blocks.io/blog/preview-editor
- Just paste your markdown content into the input box and you can preview it, This is particularly useful when you need to continuously debug styles that are not supported by GitHub.
  <img width="1608" alt="image" src="https://github.com/57blocks/website-article/assets/6326386/5ee30e56-df5f-4497-bde4-b98479909d21">
- The input logic for the baseurl field has the same implementation logic as the "Get Markdown URL" functionality in the "preview by url" block.

