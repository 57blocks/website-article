---
title: "Image Quality Assessment Using Machine Learning"
author: ["Damon Wang / Android Engineer", "Roy Xie / Tech Lead"]
createTime: 2024-04-20
tags: ["Image Quality", "CNN", "OpenCV"]
thumb: "https://s3.amazonaws.com/assets.57blocks.io/cms_uploads/illustration_blue_squares_c1bbaab97b.png"
thumb_h: "./thumb_h.png"
intro: "Image Quality Assessment (IQA), specifically Objective Blind or no-reference IQA, is a crucial function in determining image fidelity or the quality of image accuracy. Further, IQA helps maintain the integrity of visual data, ensuring its accurate representation. In this article, we share an analysis of the best machine learning models that support IQA, including BRISQUE, DIQA, NIMA and OpenCV. We will delve deeper into their operations, the challenges and advantages, and their significance in the ever-evolving field of image quality assessment."
previousSlugs: ["image-quality-assessment"]
---

## Introduction

In this article, we explore the intricate process of Image Quality Assessment (IQA) - a crucial function explicitly designed to ascertain and determine the level of accuracy or fidelity of images. This measure of precision is vitally important in maintaining the integrity of visual data and ensuring its accurate representation.    
  
Fundamentally, IQA algorithms are sophisticated tools that use an image of any random classification as a model for its analysis. The primary result of this quantification process is the generation of a unique quality score that corresponds directly to the image initially inputted into the system.    
  
The IQA has three distinct forms or methodologies, each varying greatly based on the type of data and the degree of reference you have at your disposal when measuring an image's quality:    
  
  **• Full-Reference IQA:**      

This methodology uses a 'clean' or undistorted reference image as a benchmark standard against which the distorted test image's quality deviation is measured and quantified. 

  **• Reduced-Reference IQA:**    

This approach does not require an intact reference image. Instead, it employs an image with only selected information elements about the standard reference, such as a watermarked version. This reduced information is then used as the comparative standard to decipher the distorted image's quality.    

  **• Objective Blind IQA, also known as no-reference IQA:**      

This algorithm operates under the most stringent conditions. It has only one item of input data - the image under analysis. Consequently, its assessment of image quality is performed without the advantage of any comparative or reference data, meaning it relies solely on the inherent attributes of the image itself.    
  
However, this article's primary focus is Objective Blind IQA, also generally recognized as no-reference IQA. This methodology is unique in its approach as it operates with incredibly minimal resources. The sole input is the image being analyzed. Lacking comparison data from any reference image, the algorithm assesses the image quality based on the image's inherent attributes.   

While each approach to IQA has its distinct prowess, the premise of Objective Blind IQA is particularly intriguing as it presents an unbiased, independent assessment of image quality. In the following sections, we aim to look deeper into its operations, the challenges and advantages it offers, and its significance in the ever-changing field of image quality assessment. No-reference IQA forms the crux of our discussion in this article, providing you with a comprehensive understanding of its sophisticated mechanics.



## No-Reference IQA

Several significant research studies and projects have probed the realm of No-Reference Image Quality Assessment (IQA) Metrics, contributing a multitude of evaluation methods:    
  

+   [Blind/Referenceless Image Spatial Quality Evaluator (BRISQUE)](https://learnopencv.com/image-quality-assessment-brisque/): This approach uses spatial features to predict the perceptual quality of the image.
+   [Deep CNN-Based Blind Image Quality Predictor (DIQA)](https://towardsdatascience.com/deep-image-quality-assessment-with-tensorflow-2-0-69ed8c32f195): This technique, which is based on a deep convolutional neural network (CNN), operates by predicting the IQA directly from the image data.
+   [Google's Neural Image Assessment (NIMA)](https://blog.research.google/2017/12/introducing-nima-neural-image-assessment.html): NIMA is another tool for assessing image quality. It uses a convolutional neural network to predict images' aesthetic appeal.
+   [OpenCV](https://www.cns.nyu.edu/pub/eero/laparra16a-preprint.pdf): This open-source computer vision and machine learning software library includes several algorithms for performing various tasks, including image quality assessment.


Before immersing ourselves more deeply in the theory of these methodologies, it's crucial to familiarize ourselves with two fundamental terms.

### Image Distortions

These are commonly manifested as White Noise (WN), Gaussian Blur (GB), JPEG compression, and JP2K compression. White noise distortion, for instance, often occurs during low-light conditions such as taking photographs at night with a mobile device. Additionally, the inadvertent application of Gaussian blur can occur if images are not correctly focused before capturing them.

<div class="row">
  <div class="col-12 col-sm-6 col-lg-6 mb-3">
    <img width="999" src="https://s3.amazonaws.com/assets.57blocks.io/cms_uploads/image_quality_flg_1_a_48683cbd28.png" />
  </div>
  <div class="col-12 col-sm-6 col-lg-6 mb-3">
    <img width="999" src="https://s3.amazonaws.com/assets.57blocks.io/cms_uploads/image_quality_flg_1_b_81be97f44d.png" />
  </div>
</div>
<figcaption>Fig. 1. (a) reference image, (b) JPEG compression</figcaption>


<div class="row">
  <div class="col-12 col-sm-6 col-lg-6 mb-3">
    <img width="999" src="https://s3.amazonaws.com/assets.57blocks.io/cms_uploads/image_quality_flg_2_a_8a1f39a83a.png" />
  </div>
  <div class="col-12 col-sm-6 col-lg-6 mb-3">
    <img width="999" src="https://s3.amazonaws.com/assets.57blocks.io/cms_uploads/image_quality_flg_2_b_1c09829d55.png" />
  </div>
</div>
<figcaption>Fig. 2. (a) gaussian blur, (b) white noise</figcaption>

### Natural Image

This term refers to an image directly captured by a camera without subsequent post-processing. These images retain their original, undiluted form, preserving the essence of the shot as seen through the camera's lens.

<div class="row">
  <div class="col-12 col-sm-6 col-lg-6 mb-3">
    <img width="999" src="https://s3.amazonaws.com/assets.57blocks.io/cms_uploads/image_quality_flg_3_a_c5929d6d19.png" />
  </div>
  <div class="col-12 col-sm-6 col-lg-6 mb-3">
    <img width="999" src="https://s3.amazonaws.com/assets.57blocks.io/cms_uploads/image_quality_flg_3_b_b9d393d54c.png" />
  </div>
</div>
<figcaption>Fig. 3 Natural Image (left) and Noisy Image (distorted, right)</figcaption>



## Possible Solutions


### Blind/Referenceless Image Spatial Quality Evaluator (BRISQUE)

At its core, [the Blind/Referenceless Image Spatial Quality Evaluator (BRISQUE)](https://towardsdatascience.com/automatic-image-quality-assessment-in-python-391a6be52c11) operates by leveraging the unique characteristics that differentiate distorted images from natural ones. Specifically, it capitalizes on the variations in pixel intensity distributions between natural and anomalous or distorted images.    
  
In a natural image, the pixel intensities often have a distinct pattern. After undergoing a normalization process, wherein pixel intensities are uniformly rescaled, a characteristic distribution emerges within these pixel intensities. This distribution typically adheres to a Gaussian Distribution, also known as a bell curve. This pattern is ubiquitous across natural images.    
  
In contrast, images subjected to distortion or unnatural alterations exhibit a different pattern. Post-normalization, the pixel intensity distribution of these images does not fall into the predictable pattern of the Gaussian Distribution. Instead, they depict a noticeable deviation from this ideal bell curve.    
  
BRISQUE takes advantage of this marked contrast pattern. It considers the degree to which the pixel intensity distribution strays from the Gaussian Distribution. This measure effectively predicts the level of distortion in the image. The larger the deviation from the ideal bell curve, the more significant the distortion detected in the image. This analytical approach provides a simple yet highly effective tool for evaluating and predicting image quality without any reference image.


<div class="row">
  <div class="col-12 col-sm-6 col-lg-6 mb-3">
    <img width="999" src="https://s3.amazonaws.com/assets.57blocks.io/cms_uploads/image_quality_fig_solution_a_7a687b68f4.png" />
    <figcaption>(a)</figcaption>
  </div>
  <div class="col-12 col-sm-6 col-lg-6 mb-3">
    <img width="999" src="https://s3.amazonaws.com/assets.57blocks.io/cms_uploads/image_quality_fig_solution_b_5b8649f3bf.png" />
    <figcaption>(b)</figcaption>
  </div>
</div>


<div class="row">
  <div class="col-12 col-sm-6 col-lg-6 mb-3">
    <img width="999" src="https://s3.amazonaws.com/assets.57blocks.io/cms_uploads/image_quality_fig_solution_normalized_luminance_8a829fdcdc.png" />
  </div>
  <div class="col-12 col-sm-6 col-lg-6 mb-3">
    <img width="999" src="https://s3.amazonaws.com/assets.57blocks.io/cms_uploads/image_quality_fig_solution_mscn_11e2413f8b.png" />
  </div>
</div>
<figcaption>Fig. 4 On the left, a natural image with no artificial effects added fits the Gaussian distribution. On the right, an artificial image doesn't fit the same distribution well.</figcaption>


### Deep CNN-Based Blind Image Quality Predictor (DIQA)

Navigating the complexities of Image Quality Assessment bears its unique challenges, one of the most notable is the taxing task of tagging images. However, the developers of the [Deep CNN-Based Blind Image Quality Predictor (DIQA)](https://towardsdatascience.com/deep-image-quality-assessment-with-tensorflow-2-0-69ed8c32f195) ingeniously bypassed this obstacle by implementing a two-step training process that benefits from large data volumes.                
  

![Overall_flowchart_of_DIQA_778d98ab55.png](https://s3.amazonaws.com/assets.57blocks.io/cms_uploads/Overall_flowchart_of_DIQA_778d98ab55.png)

<figcaption>
Fig. 5. Overall flowchart of DIQA. Source:<a href="https://www.semanticscholar.org/paper/Deep-CNN-Based-Blind-Image-Quality-Predictor-Kim-Nguyen/4b1f961ae1fac044c23c51274d92d0b26722f877"> http://bit.ly2Ldw4pz</a>
</figcaption>
  

This can be seen in Figure 5, which maps out the overall flowchart of DIQA. The details of the process are as follows:

1.  Involves the initial training of a Convolutional Neural Network (CNN). The CNN is tutored to learn and identify an objective error map. This process does not necessitate the use of any subjective human opinion scores. Instead, the CNN is trained to pinpoint the variations between a natural image and its distorted counterpart, effectively learning to map the noticeable discrepancies or errors.
2.  This stage delves into subjective human perception, where two fully connected layers are incorporated after the convolution. The CNN is then fine-tuned using human opinion scores —— subjective evaluations that reflect human perceptions of the image quality.  

![the-architecture-for-the-objective-error-map-prediction.png](https://s3.amazonaws.com/assets.57blocks.io/cms_uploads/the_architecture_for_the_objective_error_map_prediction_b3d9b98f70.png)

<figcaption>Fig. 6. The architecture for the objective error map prediction</figcaption>

Figure 6 shows the structure for this objective error map prediction. The diagram showcases the dual-stage flow of processing, with the red and blue arrows indicating the first stage and second stage, respectively. This two-step training process has effectively augmented DIQA system's the predictability and reliability.


### Google's Neural Image Assessment (NIMA)

Google's innovative approach to image quality assessment is the [Neural Image Assessment (NIMA)](https://arxiv.org/pdf/1709.05424.pdf). NIMA operates by predicting the distribution of human opinion scores. These scores play a crucial role in illustrating subjective human perspectives of image quality. To accurately reflect this spectrum of human opinions, NIMA employs the capabilities of a convolutional neural network (CNN).    
  
The CNN is trained to forecast the range of human opinion scores on images, offering potential scores that human viewers could assign. By doing so, NIMA successfully captures a broad spectrum of human aesthetic preferences and perceptions, ultimately offering predictions that can score images closely correlating to human reception.    
  
This methodology is unique as it seeks to integrate the subjectivity of human perception within its objective framework by predicting how a variety of humans would perceive, interpret, and grade the quality of an image. As such, NIMA offers scores that resonate well with human evaluation methods, making it a unique and effective tool in Image Quality Assessment.


### The OpenCV Library

Apart from using machine learning methodologies, the [OpenCV](https://pyimagesearch.com/2015/09/07/blur-detection-with-opencv/#download-the-code) library presents another viable option for image quality assessment. An integral function used within this library is the Laplacian operation, which is used to compute the second derivative of an image. This mathematical operation is significant as it offers insights into the image's edge information.    
  
For an identical subject matter, images of higher definition typically yield a greater variance when filtered by the Laplacian. This method has been subjected to multiple tests using various images from the live dataset and consistently delivered excellent results, barring a few issues with images containing white noise.    
  
Furthermore, the OverCV library enables assessments of overexposure or underexposure within an image. This is achieved by analyzing the mean and variance of the grayscale elements of the image. These calculations help determine the aesthetic quality of an image, specifically concerning its exposure levels. However, it must be noted that while effective, this method can also lead to some inaccuracies when applied to images with white noise.


## Suggestions for Machine Learning and OpenCV Solutions

When employed for Image Quality Assessment, machine learning models produce outputs represented by floating fractions. Nevertheless, these results do not definitively identify the type of distortion within an image of low quality. They can only afford approximations or educated guesses that the image might seem blurry or have other display issues. As such, the communication with the user may be limited to hinting that the image appears blurry without explicitly identifying the type of distortion present.                  
  
On the other hand, solutions utilizing the OpenCV library possess an expanded range of capabilities. These methods can alert users about potential blurriness within the image and provide information about the image's exposure. The system can indicate whether the exposure level is under ideal conditions or if it may be too strong, consequently guiding users to adjust their approach to achieve the desired image quality.                  
  
The versatility of both machine learning and OpenCV solutions allows them to be applied in various scenarios. This can include real-time analysis during photo previews, providing instant feedback about the image's quality. It could also involve analyzing individual images post-capture, offering a detailed assessment of various image quality parameters. Ultimately, combining these solutions can offer a comprehensive Image Quality Assessment, enhance user experience and photographic outcomes.

<div class="table-responsive">
  <table class="table table-borderless" style="font-size:16px;">
    <thead>
      <tr>
        <th></th>
        <th class="p-3">
          Advantages
        </th>
        <th class="p-3">
          Disadvantages
        </th>
        <th class="p-3">
          Dependencies
        </th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td class="p-3 bg-light align-middle">
          BRISQUE
        </td>
        <td class="p-3 bg-light align-middle">
          Simplistic implementation
        </td>
        <td class="p-3 bg-light align-middle">
          Moderate accuracy (around 0.8)
        </td>
        <td class="p-3 bg-light align-middle">
          Python, OpenCVlibsvm
        </td>
      </tr>
      <tr>
        <td class="pt-3 pb-0 lh-0"></td>
      </tr>
      <tr>
        <td class="p-3 bg-light align-middle">
          DIQA
        </td>
        <td class="p-3 bg-light align-middle">
          High accuracy (over 0.9), can be incorporated within MediaPipe
        </td>
        <td class="p-3 bg-light align-middle">
          Requires the presence of a subjective dataset
        </td>
        <td class="p-3 bg-light align-middle">
          Deep Convolutional Neural Networks
        </td>
      </tr>
      <tr>
        <td class="pt-3 pb-0 lh-0"></td>
      </tr>
      <tr>
        <td class="p-3 align-middle bg-primary-subtle text-primary border-primary" style="border-left: solid 3px">
          NIMA
        </td>
        <td class="p-3 align-middle bg-primary-subtle">
          High accuracy, compatible with MediaPipe
        </td>
        <td class="p-3 align-middle bg-primary-subtle">
          Absence of notable disadvantages
        </td>
        <td class="p-3 align-middle bg-primary-subtle position-relative">
          Deep Convolutional Neural Networks
          <div class="position-absolute top-0 end-0 px-3">
            <img src="https://s3.amazonaws.com/assets.57blocks.io/cms_uploads/medal_primary_f19c56cbe9.svg" alt="medal-primary.svg">
          </div>
        </td>
      </tr>
      <tr>
        <td class="pt-3 pb-0 lh-0"></td>
      </tr>
      <tr>
        <td class="p-3 bg-light align-middle">
          OpenCV
        </td>
        <td class="p-3 bg-light align-middle">
          Simplistic implementation
        </td>
        <td class="p-3 bg-light align-middle">
          Moderate accuracy, similar to BRISQUE
        </td>
        <td class="p-3 bg-light align-middle">
          Python, OpenCV
        </td>
      </tr>
    </tbody>
  </table>
</div>

## Conclusion

Using machine learning solutions for Image Quality Assessment presents unique challenges.

Firstly, the task involves identifying an efficient machine learning model that can effectively assess image quality. Once the model is determined, it must be trained with data. This data collection and organization that goes into training can be complex and laborious, requiring adept handling, sorting, and labeling of massive amounts of image data.

Secondly, proficiency in machine learning itself is essential. The user must have sufficient understanding and experience in machine learning principles, algorithms, and applications to implement and refine the chosen model effectively. This learning process may be time-consuming and uses considerable resources, which could be a barrier for those new to the field.

Implementing solutions with OpenCV presents a separate challenge. Its efficacy in detecting images with white noise remains to be validated. White noise refers to random pixels spread throughout an image, potentially distorting the image quality. Essentially, the robustness and accuracy of OpenCV in discerning white noise within images needs to be assessed and confirmed.

Ultimately, despite the potential these techniques hold, these challenges must be considered for the effective and efficient application in image quality assessment.


## References

\[1\] Image Quality Assessment: BRISQUE,   

<[https://learnopencv.com/image-quality-assessment-brisque/](https://learnopencv.com/image-quality-assessment-brisque/)\>

\[2\] Image Quality Assessment: A Survey,  

<[https://ocampor.medium.com/advanced-methods-for-iqa-37581ec3c31f](https://ocampor.medium.com/advanced-methods-for-iqa-37581ec3c31f)\>

\[3\] Automatic Image Quality Assessment in Python,    

<[https://towardsdatascience.com/automatic-image-quality-assessment-in-python-391a6be52c11](https://towardsdatascience.com/automatic-image-quality-assessment-in-python-391a6be52c11)\>

\[4\] Deep CNN-Based Blind Image Quality Predictor in Python, 

<[https://towardsdatascience.com/deep-image-quality-assessment-with-tensorflow-2-0-69ed8c32f195](https://towardsdatascience.com/deep-image-quality-assessment-with-tensorflow-2-0-69ed8c32f195)\>

\[5\] Research Guide: Image Quality Assessment for Deep Learning,  

<[https://heartbeat.fritz.ai/research-guide-image-quality-assessment-c4fdf247bf89](https://heartbeat.fritz.ai/research-guide-image-quality-assessment-c4fdf247bf89)\>

\[6\] Perceptual image quality assessment using a normalized Laplacian pyramid,  

<[https://www.cns.nyu.edu/pub/eero/laparra16a-preprint.pdf](https://www.cns.nyu.edu/pub/eero/laparra16a-preprint.pdf)\>

\[7\] NIMA,  

<[https://github.com/idealo/image-quality-assessment](https://github.com/idealo/image-quality-assessment)\>
