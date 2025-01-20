---
title: "Drive iOS App Downloads with Clip"
author: ["Eric Qi / iOS engineer"]
createTime: 2024-12-25
tags: ["iOS", "App", "App Clip"]
thumb: "ArticleImage.png"
thumb_h: "ArticleImage.png"
intro: "This article state why customers need App Clips based on actual company cases, and then introduces what App Clip is, why it is beneficial to app downloads, and explains some considerations from the development and testing perspectives based on company project."
---

Our company has been helping to develop an App in the past few years. The App has 90k+ reviews on the AppStore and a lot of users. Although this App is great, the client spent a lot of resources, including money and energy, to stand out in the highly competitive AppStore and gain more users. But sometimes a lot of investment does not get the expected feedback, and the user growth is not as expected. At this time, the client took a fancy to App Clip, a relatively new App implementation method, and commissioned us to develop the Clip version corresponding to the App. After investigation, we quickly completed the development of the Clip version with only a small number of developers and launched it as scheduled. After the launch, we observed that users would try to use App Clip, and attracted a lot of new users through App Clip. The client was very satisfied that he had obtained a new user growth channel without continuous investment, such as advertising costs.

Next, we will start from what App Clip is and then explain why to use App Clip. Finally, we will share the development process of App Clip through some of our experiences in the development process.

## What is App Clip？

  An App Clip is a small part of your App that’s discoverable at the moment it’s needed and lets people complete a quick task from your App — even before installing your full App.

  Clip was launched on iOS14 and is a relatively new iOS feature

1. **Part of the App.** It cannot exist independently of the App and needs to be developed in Xcode based on the existing App. Its main purpose is to make users willing to download the App and continue to use it after experiencing it.
2. **Only provides the core functional modules of the App.** Due to Apple restrictions, the maximum size of Clip in the uncompressed state does not exceed 15MB (iOS16 and above, iOS15 and below does not exceed 10MB). The very small size has more stringent requirements on the features provided by Clip while ensuring that users can flash download and open it for use.

## Why use App Clips？

1. **Users are reluctant to install new Apps easily.**

- App functions are becoming more and more complex nowadays, and users need to learn just for some simple tasks.
- the large size makes downloading time-consuming and takes up mobile phone storage space.
- it will expose some personal privacy, and many considerations will make users reluctant to easily download an unused app.

On the other hand App Clip only provides key features and is very fast to download. The system will automatically delete App Clip after a period of inactivity. Users can use it anonymously without logging in and only registering when it is not necessary.

2. **App advertising costs are high, and the conversion rate is not very ideal.** $2.58 – this was the average cost-per-acquisition (CPA) for the entire 2023. Clip is developed on the basis of App, and the development cost is significantly lower than that of App. It can be quickly developed and applied at a lower cost. Research shows that integrating App Clips into iOS applications can increase the conversion rate by more than 20%.

3. **User engagement and experience are improved.** Clip provides a quick and easy way for users to use the key features of the App without downloading the full App. This is very beneficial for one-time use scenarios, such as restaurant ordering, renting bicycles, etc. And because it provides a taste of the app’s functionality, Clip will entice users to download the full App, thereby increasing App conversion rate.

4. **Many ways to experience Clip.** QR Codes, NFC Tags, App Clip Codes, Safari, Links in Messages, cards in Maps.

    <img src=./ClipImage1.jpg height="230"/>

5. **App Clip has a huge market.** Take China's WeChat Mini Program as an example. Mini Programs can almost compete with AppStore in China. The key is that Mini Programs are easy to obtain and use, and there is no need to install Apps specifically. However, Mini Programs are of no help in converting to apps, and even hinder the installation of Apps. This is related to WeChat's positioning of Mini Programs. It is not for promoting apps but to maintain users on WeChat and earn high profits by charging service fees.

However, in addition to some one-time use scenarios, Clip is more about converting users to full App users. Many measures and restrictions have been taken, for example, some iOS frameworks cannot be used, pictures cannot be stored locally in Clip, APNs notifications are only valid for 8 hours, and prompts to download App can be popped up on appropriate pages.

## Implementation of App Clip in 57Blocks’s project

1. **57Blocks has a successful case of Clip development.** In a short period of time, we developed an App Clip that focuses on offline parties. The host can send the URL/QR Code of the party to the guest to install Clip and take photos in Clip to upload the wonderful moments of the party. In addition, the actual QR code/AppClip code can be printed and placed at the party site to let the guest participate. Clip users have good feedback, and guests are also willing to continue downloading the App to use it.

<img src=./ClipImage2.jpg height="230"/>

2. At the same time, in order to further improve the user experience, **Clip also adds activity/dynamic island,** which can notify important information through local update or APNs. As a new feature launched in iOS16, App/Clip uses this technology to not only improve user engagement and freshness, but also enhance the value of the App itself.

<img src=./ClipImage3.jpg height="230"/>

3. **Some difficulties and solutions in Clip development.** Clip is a relatively new feature, and the entire development, configuration, and testing process are somewhat different from traditional Apps.

  - **Clip development code should be as independent as possible from App. Clip is a part of App**

From the perspective of development efficiency, the fastest way is to directly reuse the code in App. However, because the codes in App usually reference each other, Clip may have to reference module B in order to reference module A, and then reference module C, etc. This will make the Clip code complex and the size increase rapidly. We recommend that Clip code be as independent as possible from App. You can consider rewriting Clip code. According to our implementation, the actual workload is not large.

*In some scenarios where code reference is required, macro definitions can be used. For example, in App `Build Setting` -> `Other Swift Flags` add `-DFULL_APP`, and determine whether it is an App in the code:*

```swift
#if FULL_APP
      //do something in App
#else
      //do something in Clip
```

  - **Maintain user clip and app experience consistency**

 *The local data of Clip can be passed to the full App through the app group. First, you need to enable `"App Groups"` at Capability, then in Clip:*

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
     let query = [ kSecAttrService: service, kSecAttrAccount: account, kSecClass: kSecClassGenericPassword, kSecReturnData: true kSecAttrLabel as String: "appClip" ] as CFDictionary var result: AnyObject? SecItemCopyMatching(query, &result)
```

- **Make QR code/URL/Message etc. effective.** A major feature of Clip is that when the camera scans the QR code, Safari opens the corresponding URL, and Message sends the corresponding URL, App Clip cards will automatically display in the camera, Safari, and Message. This feature mainly requires the configuration of domain, including AASA file, meta data in web, advanced Clip experience setting in AppstoreConnect：

```html
    "appclips": {
        "apps": ["ABCDE12345.com.example.MyApp.Clip"]
    }

    <meta name="apple-itunes-app" content="app-id=myAppStoreID, app-clip-bundle-id=appClipBundleID, app-clip-display=card">

```

4. **App Clip testing process.** The typical process for users to use Clip is as follows: scan QR code/Safari to open the URL -> display App Clip cards -> click Open to download and use Clip. Because it is different from the full App, the above steps to display App Clip cards require Apple's services. If the App does not pass AppStore review and published, Clip will not be updated. In order to test new version of Clip, we need to configure up to 3 test URLs in TestFlight, and then click and start it in TestFlight, which is equivalent to passing the URL as a startup parameter to Clip, and Clip will then make corresponding processing based on the URL.

## Conclusion

App Clip is a relatively new form of App that has only been added to iOS in recent years. Its original design intention is to facilitate users to use App, enhance user participation experience, and ultimately achieve the purpose of increasing App conversion rate.

This article first analyzes what Clip is and why Clip is used. Finally, combined with the actual project developed by the company as an example, it shows that adding Clip to App is a method with high development efficiency and relatively low cost. In addition to completing the development of basic Clip functions, it also further improves the value of Clip from aspects such as user data continuity and additional live activity/dynamic island. The Clip we developed has received positive comments from users.

However, Clip development is very different from App development. This article discusses the experience from project establishment, development, configuration and post-testing methods, as well as some core logic codes. We hope to help developers successfully complete App Clip development through our experience.