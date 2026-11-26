# Building the Android APK

The Android app is a [Capacitor 7](https://capacitorjs.com) wrapper around the same `www/` folder used by the website. All assets are packaged inside the APK; the app requests **no Android permissions** (INTERNET is explicitly removed in `AndroidManifest.xml`). Links to external websites open in the phone's browser.

Requirements: Node 20+, JDK 21, Android SDK (platform 35, build-tools 35.0.0).

```bash
npm install
npx cap sync android
# signing credentials live OUTSIDE the repository
export ICHING_KEYSTORE_PROPS=/path/to/keystore.properties
cd android && ./gradlew assembleRelease
# -> android/app/build/outputs/apk/release/app-release.apk
```

`keystore.properties`:
```
storeFile=/path/to/release.jks
storePassword=…
keyAlias=iching
keyPassword=…
```

Verify:
```bash
apksigner verify --verbose --print-certs app-release.apk
aapt dump permissions app-release.apk
sha256sum app-release.apk
```

Release signing certificate (v0.1-rc1): `CN=I Ching Living Oracle, OU=Jalam1001, O=Jalam1001, C=US`, RSA 4096,
SHA-256 `ea:ae:9a:0a:c5:9a:2c:3b:1b:dd:1b:4b:d5:82:db:51:9c:b0:bc:68:d6:47:cb:5b:12:c2:c4:77:b6:e5:d1:0b`.
Future updates must be signed with the same key to install over this version.

Application ID `io.github.jalam1001.ichingoracle`, versionName `0.1-rc1`, versionCode 1, minSdk 23 (Android 6.0), targetSdk 35.
