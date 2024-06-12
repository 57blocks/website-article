---
title: "Image Search: Leveraging Image Models, Large Language Models, and Multimodal Models"
author: ["Alpha Xiang / Machine Learning Engineer", "Yanqi Liu / Backend Software Engineer", "Anjing Wang / AI Lead"]
createTime: 2024-05-21
tags: ["Image Search", "Image Retrieval", "LLM", "Image Encoder", "Image Embedding", "OCR", "Text Embedding", "CLIP", "Multimodal"]
thumb: "thumb.png"
thumb_h: "thumb_h.png"
intro: "Search using images rather than text. As we know, people can upload an image via their mobile device, and the search application on their phone may be tasked with returning matches from the database that are either identical or bear a high resemblance to the uploaded image. Here, we describe the technology that enables that functionality. "
top: true
---
# <center>Image Search: Leveraging Image Models, Large Language Models, and Multimodal Models</center>
## 1. Project background
This project is centered on information and image retrieval technology. Users can upload an image via their mobile device, and the application is tasked with returning matches from the database that are either identical or bear a high resemblance to the uploaded image. Additionally, the app retrieves and displays the related meta information and descriptions for the images, already present within the database. The algorithmic layer of the application includes advanced techniques like image-based searching, optical character recognition from image texts, text-based retrieval, and conversion from images to text.
## 2. Algorithm pipeline
Aligned with the project's directives and after a thorough investigation of both the business requirements and the sector's solution landscape, we have devised the following algorithm pipeline:
- Upon image upload by the user, a multimodal large language model crafts a comprehensive description of the image.
-  Subsequently, an Image Encoder model produces an image embedding, which is utilized to search for and retrieve matching or similar images from an existing Image Embedding database. The result of this operation is then presented to the user.
- The OCR (Optical Character Recognition) model detects textual characters within the image, triggering a Text Embedding model to create text embeddings.
- These embeddings are searched within an established Text Embedding database to find images with comparable semantic content.

![figure 1 image search framework.png](figure%201%20image%20search%20framework.png#center)

::: center
Fig 1. Algorithm pipline
:::

## 3. Algorithm details
### 3.1 Image Retrieval
Today's myriad of image databases, stemming from educational, industrial, medical, and social sectors, among others, have generated an immense need for robust image retrieval systems. To meet this demand, two principal search methodologies have been developed.
**The first is text-based image retrieval,** which relies on keywords to tag and search images[^first]. However, this approach faces significant drawbacks: manually tagging extensive databases is impractical, user-generated tags can introduce subjective biases, and these tags are generally language-specific. To address these challenges,
 **the second method, known as "content-based image retrieval" (CBIR),** is advocated[^second]. CBIR circumvents the limitations of text-based retrieval by analyzing the visual content of the images themselves, offering a more automated and objective search process that is not bound by language constraints.  

Having recognized the pitfalls of text-based image retrieval, the shift towards CBIR has paved the way for innovative techniques that eschew reliance on linguistic metadata. Instead, CBIR focuses on the intrinsic visual properties of the images. This pivotal transition from text to content aligns with the evolution of feature extraction methods that enable images to be represented in a manner conducive to effective retrieval. It is within this context that SIFT- and CNN-based models have emerged, reflecting a paradigm shift towards more sophisticated, content-driven search mechanisms. These technologies are at the forefront of CBIR advancement, harnessing the power of visual feature extraction to transform vast image data into succinct, searchable formats.   

In the realm of image retrieval, both SIFT- and CNN-based (or transformer-based) models follow a general pipeline that converts images into compact feature representations. For SIFT-based approaches, features are extracted using hand-crafted keypoint detectors. Conversely, CNN-based methods leverage densely applied convolutions or patch analysis to discern features.  

Regardless of the methodology, when dealing with smaller codebooks, an encoding and pooling strategy is implemented to distill these features into condensed vector forms. However, as the codebook size increases to medium or large, SIFT-based models typically rely on an inverted index to maintain efficiency.  

In the case of CNNs, features may also be derived through an end-to-end process by employing fine-tuned CNN architectures, enhancing the model's adaptability to specific tasks[^third].

![figure 2 General framework of the CBIR system.png](figure%202%20General%20framework%20of%20the%20CBIR%20system.png#center)

::: center
Fig 2. General framework of the CBIR system[^first]
:::
![figure 3 A general pipeline of SIFT- and CNN-based retrieval models.png](figure%203%20A%20general%20pipeline%20of%20SIFT-%20and%20CNN-based%20retrieval%20models.png#center)
::: center
Fig 3. A general pipline of SIFT- and CNN-based retrieval models[^third]
:::

#### 3.1.1 Image Feature Extraction Model
In the scope of our project, the ResNet model[^five], grounded in CNN architecture, and the CLIP model[^six], which is built upon transformer technology, were selected as the fundamental frameworks for feature extraction. We have meticulously performed a series of validation and optimization experiments to enhance and confirm the efficacy of these two robust models.  

ResNet is an emblematic model architecture that epitomizes CNN-based deep learning methodologies. In our project's pre-processing phase, preceding the application of ResNet for feature extraction (Relu is a common activation function), we implemented a methodology reminiscent of face recognition. Through extensive data augmentation processes, we generated pairs of identical or closely related samples and utilized Focal loss[^eleven] to train a sophisticated multi-class classifier. For the actual feature extraction process, we stripped away the classifier layer of the model and repurposed the remaining structure to capture the feature vectors. Common practice dictates setting the feature dimensionality to 512 or a higher value to ensure comprehensive feature representation.

![figure 4 Residual learning: a building block.png](figure%204%20Residual%20learning%3A%20a%20building%20block.png#center)
::: center
Fig 4. Residual learning: a building block
:::

In 2021, OpenAI heralded a new era in AI with the open-source release of CLIP, a multimodal vision-language model that underwent training with an extensive collection of around 400 million image-text pairs. This training regimen significantly enhanced the generalization performance of the Image Encoder. As a result, CLIP's Image Encoder emerged as a powerful tool for generating domain-specific image embeddings. Keen on maximizing the feature extraction efficiency in specific areas of interest, our team employed the CLIP model framework to curate custom image-text pairs, allowing us to refine and optimize the image encoder to suit our precise requirements.

![figure 5 clip framework.png](figure%205%20clip%20framework.png#center)
::: center
Fig 5. CLIP framework
:::

#### 3.1.2 Dataset
In the academic and industrial fields, there are several open-source image retrieval datasets designed for different scenarios. Some of these include:
1. [The MNIST Handwritten Digit Image Database](http://yann.lecun.com/exdb/mnist/): This dataset contains 70,000 images, each 28x28 in size, encompassing 10 classes of handwritten digits from 0 to 9. In image retrieval, it is common to use the grayscale pixel values directly as features, resulting in a feature dimension of 784.
2. The [CIFAR-10](http://www.cs.toronto.edu/~kriz/cifar.html) and [CIFAR-100](http://www.cs.toronto.edu/~kriz/cifar.html) Datasets: These datasets consist of 60,000 images each, divided into 10 and 100 classes respectively, with a resolution of 32x32 for each image. If CIFAR-100 seems too small, there is a larger option: the Tiny Images Dataset, from which CIFAR-10 and CIFAR-100 are derived. The Tiny Images Dataset comprises 80 million images.
3. Caltech101 and Caltech256: These datasets contain images across various classes, and as the names suggest, they feature 101 and 256 classes respectively. While they are commonly used for image classification, they are also well-suited for Content-Based Image Retrieval (CBIR). Caltech256, with nearly 30k images, is widely recognized as sufficient for academic publication. However, for industrial applications involving millions of images, alternative larger datasets would be needed.
4. The INRIA Holidays Dataset: This dataset, frequently used in CBIR research, features 1,491 holiday-themed images taken by researchers from the Herve Jegou Institute, including 500 query images (one image per group) and 991 corresponding relevant images. The dataset comes with 4,455,091 extracted 128-dimensional SIFT descriptors and visual dictionaries derived from Flickr60K.
5. [The Oxford Buildings Dataset](http://www.robots.ox.ac.uk/~vgg/data/oxbuildings/) (5k Dataset images): This collection contains 5,062 images and is released by the VGG group at Oxford University. It is often cited in research papers involving vocabulary tree-based retrieval systems.
6. [The Paris Dataset (Oxford Paris)](http://www.robots.ox.ac.uk/~vgg/data/parisbuildings/): The VGG group from Oxford collected 6,412 images of Parisian landmarks from Flickr, including sights like the Eiffel Tower.
7. The CTurin180 and 201Books DataSets: Made available by Telecom Italia for Compact Descriptors for Visual Search, this dataset includes images of 201 book covers captured from multiple angles with a Nokia E7 (6 images for each book, totaling 1.3GB), and video images of 180 buildings in Turin captured with various cameras including the Galaxy S, iPhone 3, Canon A410, and Canon S5 IS (collectively 2.7GB).
8. [The Stanford Mobile Visual Search Dataset](https://purl.stanford.edu/rb470rw0983): Released in February 2011 by Stanford, this dataset contains images from 8 different categories such as CD covers and paintings. Each category's images are captured with various cameras, including mobile phones, with a total of 500 images across all categories.
#### 3.1.3 Metric
Image retrieval systems, including Content-Based Image Retrieval (CBIR) systems, are traditionally evaluated using several metrics. Each of these metrics quantifies different aspects of the system's performance, mostly focusing on the relevance of the retrieved images with respect to a given query image. The most common evaluation metrics include:   

**Precision:** Precision measures the proportion of retrieved images that are relevant to the query. It is defined as the number of relevant images retrieved divided by the total number of images retrieved. A higher precision indicates that the retrieval system returned more relevant results.  

![precision.png](precision.png#center)

**Recall:** Recall quantifies the proportion of relevant images in the database that have been retrieved for the query. It is calculated as the number of relevant images retrieved divided by the total number of relevant images in the database. High recall means the system retrieved most of the images relevant to the query.

![recall.png](recall.png#center)

**F-Score:** This metric combines precision and recall into a single number using the harmonic mean, striving for a balance between precision and recall. The F1 Score reaches its best value at 1 (perfect precision and recall) and worst at 0.

![f1-score.png](f1-score.png#center)

**Mean Average Precision (mAP):**  is a comprehensive metric that calculates the average precision at each point where recall changes, then takes the mean of these average precisions over all queries in a set. It is especially useful for evaluating systems where the order of retrieved images is significant.

![ap.png](ap.png)
![map.png](map.png)

Where:  

- **GTP:** denotes the total number of ground truth positives, that is, the number of truth labels/positive samples;  
- **n:** denotes the number of images involved in the retrieval;  
- **rel@k:** is a schematic function that is set to 1 when the first retrieval candidate is a similar sample and 0 otherwise.  


### 3.2 OCR
As OCR stands for optical character recognition, OCR technology deals with the problem of recognizing all kinds of different characters. Both handwritten and printed characters can be recognized and converted into a machine-readable, digital data format.  

Think of any kind of serial number or code consisting of numbers and letters that you need digitized. By using OCR you can transform these codes into a digital output. The technology makes use of many different techniques. Put simply, the image taken is processed, the characters extracted, and are then recognized.  

What OCR does not do is consider the actual nature of the object that you want to scan. It simply "takes a look" at the characters that you aim to transform into a digital format. For example, if you scan a word it will learn and recognize the letters, but not the meaning of the word.  

OCR (Optical Character Recognition) typically consists of two crucial steps: Text Detection and Text Recognition.

![figure 6 OCR process.png](figure%206%20OCR%20process.png#center)
::: center
Fig 6. OCR process
:::

#### 3.2.1 Text Detection
Text detection is the process of identifying and locating the textual regions within an input image or document. This step involves applying specialized models, such as DBNet, CTPN, and EAST, to efficiently and accurately detect the spatial positions of the text. The output of the text detection step is a set of bounding boxes or text region proposals that encapsulate the textual content.

**DBNet**

DBNet[^seven]employs a differentiable binarization method, which can train the entire network in an end-to-end manner, avoiding the additional post-processing steps required by the traditional proposal-based methods.  

The model adopts a lightweight encoder-decoder structure, combining convolutional blocks and LSTM modules, which can achieve real-time performance while maintaining high detection accuracy. DBNet also utilizes multi-scale feature maps for text region prediction, which can better capture the scale variations of the text.  

Ultimately, the output of DBNet is a binarized text region prediction map, which can be further processed by simple post-processing methods like non-maximum suppression to obtain the final text detection results. This flexible post-processing approach makes DBNet a practical scene text detection solution.

![figure 7 DBNet framework.png](figure%207%20DBNet%20framework.png#center)
::: center
Fig 7. DBNet framework
:::

**CTPN**

Rather than using the traditional horizontal anchors, CTPN[^eight]employs a set of vertically-arranged anchors to better capture the characteristics of text, which often have a long and narrow aspect ratio.
Additionally, CTPN introduces a sequential prediction module that combines a RNN with convolutional features. This sequential module can effectively model the inherent sequential property of text, allowing the model to make more accurate text proposals.
The output of CTPN is a set of text proposals, which can then be fed into a subsequent text recognition model to obtain the final text transcription results. The flexible architecture of CTPN makes it a powerful and versatile text detection solution, complementing the capabilities of other models like DBNet.

![figure 8 CTPN framework.png](figure%208%20CTPN%20framework.png#center)
::: center
Fig 8. CTPN framework
:::

**EAST**

The key innovation of EAST[^nine]is its unified detection framework, which combines text region prediction and orientation regression into a single network. This allows the model to simultaneously predict the quadrilateral bounding boxes of text regions and their orientations, eliminating the need for separate post-processing steps.  

EAST utilizes a fully-convolutional network architecture, which enables efficient and dense predictions across the entire input image. The model employs a feature fusion module to combine multi-scale features, allowing it to handle text of varying scales and orientations.  

Another important aspect of EAST is its pixel-level prediction, which means the model directly outputs pixel-wise scores for text regions, rather than relying on text proposal generation. This approach simplifies the detection pipeline and improves overall efficiency.  

The output of EAST is a set of quadrilateral bounding boxes representing the detected text regions, along with their associated orientation information. This rich output can be directly used for subsequent text recognition tasks, making EAST a powerful and versatile text detection solution.

![figure 9 EAST framework.png](figure%209%20EAST%20framework.png#center)
::: center
Fig 9. EAST framework
:::

#### 3.2.2 Text Recognition
The CRNN[^ten]model was the first to propose a three-stage architecture for text recognition, which has since become a commonly used approach. The three-stage architecture of CRNN consists of the following components:
1. Feature Extraction:  
a. The first stage is a CNN that extracts visual features from the input text image.  
b. The CNN learns to capture the spatial and local patterns within the text, effectively encoding the visual representations.   

2. Sequence Modeling:  
a. The second stage is a RNN , typically a Bidirectional LSTM (Bi-LSTM) network.  
b. The RNN takes the CNN-extracted features as input and models the inherent sequential nature of text, capturing the contextual relationships between characters.
3. Transcription:  
a. The final stage is a Transcription module, often a Connectionist Temporal Classification (CTC) layer or an attention-based decoder.    
b. This module interprets the sequence-level representations from the RNN and generates the final text output, typically in the form of a character sequence or word-level transcription.  

The three-stage architecture of CRNN has become a standard approach in many modern text recognition models, as it effectively combines the strengths of CNN for feature extraction, RNN for sequence modeling, and the final transcription module for generating the recognized text.  

This modular design allows for greater flexibility and ease of optimization, as the individual components can be fine-tuned or replaced independently to improve the overall text recognition performance.  

The pioneering work of CRNN has paved the way for many subsequent advancements in the field of text recognition, solidifying the three-layer architecture as a foundational concept in modern OCR systems.

![figure 10 RCNN framework.png](figure%2010%20RCNN%20framework.png#center)
::: center
Fig 10. RCNN framework
:::

#### 3.2.3 OCR Solution
We have explored various open-source OCR software options, such as EasyOCR, PaddleOCR, and Tesseract OCR. We also considered the OCR solutions offered by major cloud platforms, including AWS, GCP, and Azure. However, we found that even after fine-tuning the models, the open-source OCR solutions were unable to meet our desired performance requirements.  

In our design, it is imperative to employ OCR methods for extracting crucial textual information. However, in practical application scenarios, the key text often appears blurry, posing challenges for accurate extraction. In light of this situation, we conducted an analysis of the two critical processes in OCR.  

Regarding text detection, detecting blurry text proves arduous for text detection algorithms. Our evaluation of Paddle OCR and AWS OCR revealed suboptimal results in text detection. Specifically, AWS OCR's text detection encountered three issues: tag omission, incomplete coverage of bounding boxes, and semantic fragmentation of bounding boxes. Faced with these challenges, we sought a more suitable approach that deviated from traditional text detection methods and instead adopted YOLO. YOLO, although not specifically designed for text detection, functions more like a boundary finder for textual images. While conventional text detection methods can identify text boundaries in various scenarios, YOLO demonstrates even more remarkable performance when dealing with blurry text in a single scene.  

For text recognition, we opted for AWS OCR due to its absolute advantage of achieving an impressive accuracy rate of up to 98% after effectively handling text orientation challenges.  

In light of the above, we ultimately chose the concatenated approach of YOLO (text detection) and AWS OCR (text recognition) as the solution for this practical implementation.
### 3.3 Text Retrieval
Text matching is a quintessential task in Natural Language Processing (NLP). Drawing from experimental studies in scholarly papers, this domain can be broadly sorted into ad-hoc text retrieval, paraphrase identification, natural language inference (NLI), and question-answering (QA) matching. Furthermore, additional tasks such as entity disambiguation can leverage the principles of text matching. Despite divergent goals across various text matching tasks, the underlying models tend to be strikingly similar, offering a level of interchangeability with potential variations in efficacy.  

These text matching endeavors aim to identify the most suitable document or to aggregate a list of documents in a descending order of relevance to a given query. To articulate the context, we denote the pair of texts subjected to the matching process as text_left and text_right. Here, text_left corresponds to the text of the query, and text_right represents a candidate document.

Conventionally, text matching tasks have employed a feature-centric strategy, harnessing both texts' tf-idf, BM25, or lexical-level attributes, then applying standard machine learning algorithms like Logistic Regression or Support Vector Machines for training. The appeal of this methodology lies in its interpretability; however, the dependence on manual feature discovery and iterative experimentation has shown limitations in generalizability. Moreover, the model's performance is relatively unremarkable due to inherent restrictions in the number of features, which in turn limits the model's parameter space.

The advent of deep learning since 2012, coupled with the proliferation of powerful GPUs, has made it feasible to cultivate large deep neural networks. This technological renaissance has sent ripples through numerous disciplines, not least among them computer vision and natural language processing. Within the realm of NLP, text matching has certainly not been spared, evidenced by Microsoft's groundbreaking introduction of the Deep Structured Semantic Model (DSSM) in 2013. This move signified a paradigm shift, propelling text matching into the deep learning epoch.

In contrast to the traditional feature-centric approach, methods of text matching in the deep learning era can be distilled into two main categories: representation-based matching and interaction-based matching. In the realm of representation-based matching, each text is handled independently during the initial phase. Texts are encoded via deep neural net layers to form their respective representations. Subsequently, these representations serve as a basis for calculating the texts' similarity through specialized similarity computation functions. Conversely, the interaction-based matching approach critiques the late-stage similarity calculation of the prior method for its heavy dependence on representation quality and potential loss of fundamental text characteristics, such as lexical and syntactic features[^twelve]. Advocating for a more preemptive engagement of textual features, this method prioritizes capturing core characteristics early on. These foundational matching features are then aggregated and used to derive a matching score at a more advanced processing level.

In our project, we deploy natural language processing models, including text-embedding-3-small, text-embedding-ada-002, and GTE Base, to generate embeddings for character text data recognized in images. We then calculate the cosine similarity of these text embeddings against those of query texts, which allows us to gauge the semantic relatedness of the texts. This approach forms the cornerstone of our text retrieval system, effectively harnessing semantic similarity to identify and retrieve relevant text information.
### 3.4 Image-to-Text (Image Caption)
Image Captioning is the task of describing the content of an image in words. This task lies at the intersection of computer vision and natural language processing. Most image captioning systems use an encoder-decoder framework, where an input image is encoded into an intermediate representation of the information in the image, and then decoded into a descriptive text sequence.

In the last year, considerable progress has been seen in the realm of multimodal large language models (MM-LLMs). By adopting economical and efficient training methodologies, these cutting-edge models have fortified existing large language models to accommodate inputs or outputs across multiple modalities. The resultant models preserve the inherent reasoning and decision-making prowess that LLMs are known for, while also extending their capabilities to an assortment of multimodal tasks. Notably, functionalities such as generating descriptive captions for images and answering questions based on visual content are among their crucial advancements.

![figure 11 mm-llms.png](figure%2011%20mm-llms.png#center)
::: center
Fig 11. MM-LLMs[^fourteen]
:::


MM-LLMs focusing on multimodal understanding typically encompass just the first three components: modality encoders, the core LLM backbone, and modality generators. Throughout the training phase, these elements are generally maintained in a frozen state. Optimization efforts are concentrated on the input and output projectors, which are relatively lightweight. As a result, a small fraction of the overall parameters—commonly about 2%—are actually trainable within MM-LLMs. This percentage is determined by the size of the principal LLM integrated into the MM-LLM framework. Due to this configuration, MM-LLMs can undergo cost-effective training, making the enhancement of performance in assorted multimodal tasks more attainable.

![figure 12 The general model architecture of MM-LLMs and the implementation choices for each component.png](figure%2012%20The%20general%20model%20architecture%20of%20MM-LLMs%20and%20the%20implementation%20choices%20for%20each%20component.png#center)
::: center
Fig 12. The general model architecture of MM-LLMs and the implementation choices for each component[^fourteen]
:::

In this undertaking, we carried out validations and tests for image caption generation using GPT4 vision, LLaVa[^fifteen][^sixteen], and Qwen-vl[^thirteen]models. We meticulously analyzed the precision of the image descriptions provided by these models. Given that GPT4 vision has not been made available for open source use, we based our further enhancements on the Qwen-vl model[^seventeen], selecting it as our foundational model for fine-tuning after our comparative assessments were concluded.
## 4. Conclusion
During our image retrieval endeavor, we have diligently addressed the distinctive traits of images pertinent to the business sector, taking into account crucial image features, textual information, and details from both sides of the image. By analyzing and valorizing this information, we have implemented strategies such as reverse image search, textual retrieval, and image search via text. Our deployment of advanced deep learning algorithms encompasses an array of models—ranging from those specialized in computer vision and natural language processing to multimodal algorithms, large language models, and comprehensive multimodal language-vision models. Through systematic enhancement of the performance across each model phase, we have successfully realized a retrieval process that is both effective and precise for images and accompanying text.
## Reference
[^first]: Hameed, I. M., Abdulhussain, S. H., Mahmmod, B. M., & Pham, D. T. (2021). Content-based image retrieval: A review of recent trends. Cogent Engineering, 8(1). https://doi.org/10.1080/23311916.2021.1927469
[^second]: Raghunathan, B., & Acton, S. T., “A content based retrieval engine for circuit board inspection,” in Proceedings 1999 International Conference on Image Processing (Cat. 99CH36348), vol. 1, pp. 104–108 1999. Kobe, Japan.
[^third]: L. Zheng, Y. Yang and Q. Tian, "SIFT Meets CNN: A Decade Survey of Instance Retrieval," in IEEE Transactions on Pattern Analysis and Machine Intelligence, vol. 40, no. 5, pp. 1224-1244, 1 May 2018, doi: 10.1109/TPAMI.2017.2709749.
[^five]: He K , Zhang X , Ren S ,et al.Deep Residual Learning for Image Recognition[J].IEEE, 2016.DOI:10.1109/CVPR.2016.90.
[^six]: Radford, Alec et al. “Learning Transferable Visual Models From Natural Language Supervision.” International Conference on Machine Learning (2021).
[^seven]: Minghui Liao, Zhaoyi Wan, Cong Yao, Kai Chen, and Xiang Bai. 2020. Real-time scene text detection with differentiable binarization. In Proceedings of the AAAI Conference on Artificial Intelligence, Vol. 34. 11474--11481.
[^eight]: Tian, Z. Huang, W., He, T., He, P., & Qiao, Y. (2016). Detecting text in natural image with connectionist text proposal network. In Proceedings of European conference on computer vision (ECCV) (pp. 56–72). Springer.
[^nine]: Zhou, X.; Yao, C.; Wen, H.; Wang, Y.; Zhou, S.; He, W.; Liang, J. East: An efficient and accurate scene text detector.In Proceedings of the IEEE Conference on Computer Vision and Pattern Recognition (CVPR), Honolulu, HI, USA, 21–26 July 2017; pp. 2642–2651.
[^ten]: Shi, B., Bai, X., Yao, C.: An end-to-end trainable neural network for image-based sequence recognition and its application to scene text recognition. TPAMI 39(11), 2298–2304 (2016).
[^eleven]: Tsung-Yi Lin, Priya Goyal, Ross Girshick, Kaiming He, Piotr Dollar; Proceedings of the IEEE International Conference on Computer Vision (ICCV), 2017, pp. 2980-2988.
[^twelve]: "Google Landmarks Dataset v2 - A Large-Scale Benchmark for Instance-Level Recognition and Retrieval"T. Weyand*, A. Araujo*, B. Cao, J. Sim. Proc. CVPR'20.
[^thirteen]: Huang P S, He X, Gao J, et al. Learning deep structured semantic models for web search using clickthrough data[C]//Proceedings of the 22nd ACM international conference on Information & Knowledge Management. 2013: 2333-2338.
[^fourteen]:  Zhang D, Yu Y, Li C, et al. Mm-llms: Recent advances in multimodal large language models[J]. arXiv preprint arXiv:2401.13601, 2024.
[^fifteen]: Liu H, Li C, Li Y, et al. Improved baselines with visual instruction tuning[J]. arXiv preprint arXiv:2310.03744, 2023.
[^sixteen]: Liu H, Li C, Wu Q, et al. Visual instruction tuning[J]. Advances in neural information processing systems, 2024, 36.
[^seventeen]:  Bai J, Bai S, Yang S, et al. Qwen-vl: A frontier large vision-language model with versatile abilities[J]. arXiv preprint arXiv:2308.12966, 2023.

*[RNN]: Recurrent Neural Network 
*[CNN]: Convolutional Neural Network