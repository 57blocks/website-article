---
title: "Drive iOS App Downloads with Clip"
author: ["Eric Qi / iOS engineer"]
createTime: 2024-12-25
tags: ["iOS", "App", "App Clip"]
thumb: "ArticleImage.png"
thumb_h: "ArticleImage.png"
intro: "This article state why customers need App Clips based on actual company cases, and then introduces key advantages of App Clip, why it is beneficial to app downloads, and explains some technical development considerations and testing perspectives based on company project."
---

Our client, Hobnob, created an app for event planning that allowed users to manage everything from invitations to guest lists to ticket sales to sharing content before, during, and after the event. This App has been on AppStore for more than five years and has over 90,000 reviews. Hobnob spent thousands on advertising each month to drive engagement and conversion. Although that all may sound like it was a popular app, in the highly competitive AppStore, it wasn’t standing out and being downloaded often.

A challenge for any app in the AppStore to get more downloads is to show consumers its value and encourage them to use it. Some people are generally reluctant to install new Apps. A few reasons we have observed:

- Increasingly complex App functionality requires a higher learning curve for users to perform simple tasks. Rather than spend time learning how to use a new app, most won’t download it or will continue to use familiar apps they already have in new ways.
- The large file size of an app makes downloading time-consuming and takes up mobile phone storage space.
- A new app may not be trusted and potentially expose some personal privacy issues.

## Key Advantages of App Clip

  Our client wanted to increase downloads and get their app more attention and after multiple marketing campaigns, they were out of ideas. They needed a new approach.
  
  We introduced them to App Clip. App Clip is a relatively new form of an App launched in iOS14. It was originally created to allow users to complete quick tasks from the main app without installing the entire App.

  During our research about Clip apps, we learned:

1. **They can increase app conversion rates**

   The average cost per acquisition (CPA) was <a href="https://splitmetrics.com/blog/apple-search-ads-cost/" title="ref">$2.58 in 2023</a>. Research shows that integrating App Clips into iOS applications can  <a href="https://www.appsflyer.com/blog/tips-strategy/increase-app-downloads/" title="ref">increase the conversion rate to download and use an app by over 20%</a>.

   This happens often because once users try the Clip app and are satisfied with their experience, they most likely will install the complete App to access all its features.
2. **They provide a better user experience**

   Clip apps enable customers to use an App's key features without downloading the entire app. This is ideal for one-time use scenarios such as restaurant ordering, renting bicycles, and other one-off activities.

   It provides an enhanced user participation experience because it offers a defined, quick task that is easy to learn with no need to learn anything new. By easily trying the app and experiencing its usefulness, users are encouraged to download the full app and subsequently increase the conversion rate.
3. **Numerous engagement options**
   It is straightforward to integrate technologies like QR Codes, NFC Tags, App Clip Codes, Safari, Links in Messages, cards in Maps in a Clip. It’s quite versatile and flexible.
<img src=./ClipImage1.jpg height="230"/>
4. **Reduced development costs**

    They require less development time (and cost less) to create because only part of the App’s functionality is reused or modified.
5. **Fast download time**

    Since the app file size is smaller, it can be downloaded and used more quickly.

6. **Made with security and privacy in mind**

    iOS will automatically delete the App Clip after a period of inactivity, and it can be anonymous to use since no account is required to access any functionality.

7. **Clip has great prospects**

    TikTok used Clip to encourage users to try and eventually install the TikTok app.
    <img src=./ClipImage4.png height="230"/>

    <a href="https://x.com/illscience/status/1879273352013267154?s=46&t=jqD_eUNYNaL8-a-0NmDklA" title="Explode">Explode</a>, as an App still under development, has received widespread attention for its Clip.

    Many people have also used Clip to pay for parking when leaving the parking lot.
    

However, we did find a few disadvantages for using Clip. Pictures cannot be stored locally in Clip, APN notifications are only valid for 8 hours, and some iOS frameworks cannot be used.

Since the benefits far outweighed the disadvantages, our client thought the App Clip was a great idea and commissioned 57Blocks to develop a Clip version of their original app. We built an App Clip specifically for parties. A host can send or print a QR Code for guests to install the Clip and share photos taken during a party. The feedback has been positive, and guests continue downloading and using the App clip.

One developer developed and launched the Clip version of their app within 2 months from scratch.  Within months, the App clip attracted new users, providing the client a new growth channel without incurring marketing and advertising costs.

<img src=./ClipImage2.jpg height="230"/>

## Technical development

Although a Clip may reuse an app’s code directly and be efficient to create, there are some differences between Clips and Apps.

- The entire development, configuration, and testing process for Clips is different from traditional Apps, as we will see later in the article.
- Since a Clip is just part of the App, it cannot exist independently. There is Xcode development work required based on the existing App. Its primary purpose is to entice users to download and continue to use the App.
- Clips only provide the core functional modules of the App. Due to Apple restrictions, the maximum size of Clip in its uncompressed state does not exceed 15MB (iOS16 and above, iOS15 and below does not exceed 10MB). The small size has more stringent requirements about the features provided by Clip to ensure that users can flash download and open it for use.
  
One potential impediment: Since the codes in the App usually reference each other, Clip may have to reference module B in order to reference module A, and then reference module C, etc. This increases the code complexity and size rapidly.

That is why we recommend that the Clip code be as independent as possible from the App. You can consider rewriting the Clip code. According to our implementation, the actual workload is not large.

In addition to completing the development of basic Clip functions, it further improves Clip's value from aspects such as user data continuity and additional live activity/dynamic island.

<img src=./ClipImage3.jpg height="230"/>

## 57Blocks App Clip Developer Notes

### A Code Reference Workaround

*In some scenarios where code reference is required, macro definitions can be used. For example, in App `Build Setting` -> `Other Swift Flags` add `-DFULL_APP`, and determine whether it is an App in the code:*

```swift
#if FULL_APP
      //do something in App
#else
      //do something in Clip
```

 *Clip's local data can be passed to the full App through the app group. First, you need to enable `"App Groups"` at Capability, then in Clip:*

```swift
    let sharedUserDefaults = UserDefaults(suiteName: "group.ClipToApp")

    sharedUserDefaults.set(encodedData, forKey: "someKeywords")
```

*In Full App:*

```swift
    let data = sharedUserDefaults.data(forKey: "someKeywords")
```

 *Clip passes the user login information to the Full App, and the user can automatically log in after downloading the App.
Clip logs in through AppleID and uses app group to pass login information:*

```swift
    let credential = authorization.credential as? ASAuthorizationAppleIDCredential

    sharedUserDefaults.set(credential.user, forKey: "SavedAppleUserID")
```

*Full App gets AppleID:*

```swift
    let userId = sharedUserDefaults.data(forKey: "SavedAppleUserID")
    ASAuthorizationAppleIDProvider().getCredentialState(forUserID: userId) {state, error in …}
```

*Clip logs in through credential, uses keychain to pass login information, and uses kSecAttrLabel to distinguish keychain entry:*

```swift
    let query = [
        kSecAttrService: service,
        kSecAttrAccount: account,
        kSecClass: kSecClassGenericPassword,
        kSecAttrLabel as String: "appClip"
    ] as CFDictionary
    let attributesToUpdate = [kSecValueData: credentialData] as CFDictionary
    SecItemUpdate(query, attributesToUpdate)
```

*Full App queries the keychain data corresponding to kSecAttrLabel:*

```swift
let query = [kSecAttrService: service, 
            kSecAttrAccount: account, 
            kSecClass: kSecClassGenericPassword,
            kSecReturnData: true, 
            kSecAttrLabel as String: "appClip"] 
            as CFDictionary 
var result: AnyObject? SecItemCopyMatching(query, &result)
```

### How to Make QR codes/URLs/Messages More Effective

 A major feature of Clip is that when the camera scans the QR code, Safari opens the corresponding URL, and Message sends the corresponding URL. App Clip cards will automatically display in the camera, Safari, and Message. 
 
 This feature mainly requires the configuration of the domain, including the AASA file, metadata on the web, and advanced Clip experience setting in AppstoreConnect：

```html
"appclips": {
        "apps":
        ["ABCDE12345.com.example.MyApp.Clip"]
}

<meta name="apple-itunes-app"
      content="app-id=myAppStoreID, app-clip-bundle-id=appClipBundleID, app-clip-display=card">

```

### App Clip Testing Process

The typical process for users to use Clip is as follows:

- Scan the QR code/Safari to open the URL
- Display App Clip cards
- Click "Open" to download and use Clip
  
Because it differs from the full App, the above steps to display App Clip cards require Apple's services. The clip will not be updated if the App does not pass the AppStore review and is not published. In order to test a new version of Clip, we need to configure up to three test URLs in TestFlight and then click and start it in TestFlight, which is equivalent to passing the URL as a startup parameter to Clip, and Clip will then make corresponding processing based on the URL.

## Conclusion

App Clip is a relatively new type of App added to iOS in recent years. Its original design intention is to encourage users to access an App quickly, which enhances user participation experience, and ultimately increase App conversion rate.

Hobnob benefitted from a Clip to improve adoption and conversion. It has received overwhelmingly positive feedback from users. And the benefit of a Clip App to Hobnob - it leveraged the existing app’s functionality meaning it was low cost to produce.  In addition to completing the development of basic Clip functions, it also further improves the value of Clip from aspects such as user data continuity and additional live activity/dynamic island. The Clip we developed has received positive comments from users.

However, Clip development is very different from App development. This article discusses the experience from project establishment, development, configuration and post-testing methods, as well as some core logic codes. We hope to help developers successfully complete App Clip development through our experience.