---
published: true
title: "Drive iOS App Downloads with Clip"
author: ["Eric Qi / iOS engineer"]
createTime: 2025-03-04
tags: ["iOS", "App", "App Clip", "app downloads"]
thumb: "ArticleImage.png"
thumb_h: "ArticleImage.png"
intro: "Excited to use App Clips to help promote your app? In this article, a case study illustrates how App Clips can be used as a promotional tool to drive app downloads and engagement. The study introduces the key advantages of App Clips, discusses why it increases app downloads, and explains some technical development considerations and testing perspectives based on a recent 57Blocks project."
---

Our client, Hobnob, created an app for event planning that allows users to manage everything from invitations to guest lists to ticket sales and share content before, during, and after the event. This event planning app has been in the AppStore for over five years and has over 90,000 reviews. Hobnob spent thousands on monthly advertising to drive engagement and conversion, but the app didn’t stand out and wasn’t downloaded often in the highly competitive AppStore.

This is a challenge we have seen many times. We have observed some key reasons why apps aren’t downloaded:

- If users don’t quickly understand how an app will add value to their lives, they won’t download it.
- Increasingly complex app functionality requires a higher learning curve for users to perform simple tasks. Rather than spending time learning to use a new app, most will either not download it or continue to find new ways to use familiar apps.
- The large file size of an app makes downloading time-consuming and takes up mobile phone storage space.
- Moreover, a new app may not be trusted, potentially exposing personal privacy issues.
  
Ideally, a trial version of an app would solve these problems. And Apple created just that with their offering of App Clip.

## Key Advantages of App Clip

  Hobnob wanted to increase downloads and attract more attention to their app, but after running multiple marketing campaigns, they ran out of ideas. The company needed a new approach.
  
  We introduced them to App Clip. An App Clip is a relatively new form of an app launched in iOS14. Its purpose is to allow users to complete quick tasks from the main app without installing the entire app.

  During our research, we learned that App Clips can:

1. **Increase app conversion rates**

   The average cost per acquisition (CPA) was <a href="https://splitmetrics.com/blog/apple-search-ads-cost/" title="ref">$2.58 in 2023</a>. Research shows that integrating App Clips into iOS applications can  <a href="https://www.appsflyer.com/blog/tips-strategy/increase-app-downloads/" title="ref">increase the conversion rate to download and use an app by over 20%</a>.

   If App Clip users are satisfied with their experience, they are more likely to install the complete app to access all its features.


2. **Provide a better user experience**

   App Clips enable customers to use an app's key features without downloading the entire app. This scenario is ideal for one-time use functions such as restaurant ordering, renting bicycles, and other one-off activities.

   It enhances user participation by offering a defined, quick task that is easy to learn. By making the app easy to try and experience its usefulness, users are encouraged to download the entire app, subsequently increasing the conversion rate.

3. **Offer numerous engagement options**

   Integrating technologies like QR Codes, NFC Tags, App Clip Codes, Safari, Links in Messages, and cards in Maps in a Clip is straightforward. It's very versatile and flexible.
<img src=./ClipImage1.jpg height="230"/>
4. **Reduced development costs**

    They require less development time (and cost less) to create because only part of the App’s functionality is reused or modified.
5. **Offer faster download times**

    Since the app file size is smaller, it can be downloaded and used quickly.

6. **Provide security and privacy**

    iOS will automatically delete the App Clip after a period of inactivity, and users can be anonymous since no account is required to access any functionality.

7. **App Clips have a wide range of uses**

 - TikTok used Clip to encourage users to try and eventually install the TikTok app.
    <img src=./ClipImage4.png height="230"/>

- <a href="https://x.com/illscience/status/1879273352013267154?s=46&t=jqD_eUNYNaL8-a-0NmDklA" title="Explode">Explode</a>, an app still under development, has received widespread attention for its Clip functionality.
- App Clips can be used to pay for parking when leaving the lot.


However, there are a few disadvantages. Pictures cannot be stored locally, APN notifications are only valid for eight hours, and some iOS frameworks cannot be used.

Since the benefits far outweighed the disadvantages, Hobnob thought the App Clip was a great idea and commissioned 57Blocks to develop a version of their original app. We built an App Clip specifically for parties. A host can send or print a QR Code for guests to install the App Clip and share photos taken during a party. The feedback has been positive, and guests continue to download and use the App Clip.

One developer developed and launched the Clip version of their app within two months. Although we could have leveraged some of the existing code to give us a head start, we decided to start fresh to avoid referencing code sections, and to reduce complexity and file size.  Within months, the App Clip attracted new users, providing the client a new growth channel without incurring marketing and advertising costs.

<img src=./ClipImage2.jpg height="230"/>

## Technical Development

Although an App Clip may reuse an app's code directly and be efficient to create, the entire development, configuration, and testing process differs from that of traditional Apps.

- Although an App Clip cannot exist independently and is based on the existing app, some Xcode development work is required to create the final product.
- The App Clip's primary purpose is to entice users to download and continue to use the entire app.
- Clips only provide the app's core functional modules. Due to Apple restrictions, the maximum size of an App Clip in its uncompressed state cannot exceed 15MB (iOS16 and above, iOS15 and below cannot exceed 10MB).
- The small size requires more stringent feature requirements to ensure users can flash download and open the App Clip.
  
One potential impediment: Since the codes in the entire app usually reference each other, an App Clip may have to reference module B to reference module A, and then reference module C, and so forth. This increases code complexity and size rapidly.

That is why we recommend that the App Clip code be as independent as possible from the full app. Should you consider rewriting the App Clip code, the workload is not significant.

In addition to completing the development of essential App Clip functions, user data continuity and additional live activity/dynamic island further improve its value.

<img src=./ClipImage3.jpg height="230"/>

## 57Blocks App Clip Developer Notes: A Code Reference Workaround


*In some scenarios where code reference is required, macro definitions can be used. For example, in App `Build Setting` -> `Other Swift Flags` add `-DFULL_APP`, and determine whether it is an App in the code:*

```swift
#if FULL_APP
      //do something in App
#else
      //do something in Clip
```

 *Local data can be passed to the full App through the app group. First, you need to enable `"App Groups"` at Capability, then in Clip:*

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

*This App Clip logs in via credentials, uses keychain to pass login information, and kSecAttrLabel to distinguish keychain entries:*

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

 A noteworthy feature of this App Clip is that when the camera scans the QR code, Safari opens the corresponding URL, and Message sends the corresponding URL. App Clip cards will automatically display in the camera, Safari, and Message.

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
  
Because it differs from the full app, the above steps to display App Clip cards require Apple's services. The App Clip won't be updated if it does not pass the AppStore review and is not published. In order to test a new version of this App Clip, we needed to configure up to three test URLs in TestFlight and then click and start it in TestFlight, which is equivalent to passing the URL as a startup parameter to the App Clip. It will then begin processing based on the URL.

## Conclusion

App Clip is a relatively new type of app that has been added to iOS in recent years. Its original design intention is to encourage users to access an app quickly, enhancing the user experience and ultimately increasing the app conversion rate.

Hobnob benefitted from a Clip to improve adoption and conversion. It has received overwhelmingly positive feedback from users. And the benefit of a Clip App to Hobnob - it leveraged the existing app’s functionality meaning it was low cost to produce.  In addition to completing the development of basic Clip functions, it also further improves the value of Clip from aspects such as user data continuity and additional live activity/dynamic island. The Clip we developed has received positive comments from users.

Our event planning App Clip:
- Helped Hobnob improve adoption and conversion.
- Received overwhelmingly positive feedback from users.
- Leveraged the existing app's functionality so it was low-cost to produce.
- Further improves the value by enabling better user data continuity and additional live activity/dynamic island.
- Has received positive user feedback.

However, keep in mind that App Clip development is very different from standard app development. We hope that 57Blocks’ experience in project establishment, development, configuration, post-testing methods, and sharing some core logic codes helps developers streamline and successfully complete App Clip development.
