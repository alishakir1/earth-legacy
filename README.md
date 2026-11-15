# Earth Legacy

لعبة أحاجي حضارات بالعربية والإنجليزية، بمصدر مشترك لأندرويد وiOS. تطوير 404 Artifact.

**لغة اللعبة:** JavaScript وTypeScript، مع Capacitor 8.6.2 لتغليفها كتطبيق Android وiOS. هذا مشروع تطبيق كامل يعمل دون إنترنت، وليس رابطاً إلى موقع مستضاف.

## المحتوى واللعب

115 مستوى و30 مجموعة حضارية وثقافية: 102 شخصية تاريخية و13 مخلوقاً أسطورياً. تفتح المستويات بالتتابع على الكرة الأرضية، وتظهر هوية الشخصية بعد حل صورتها. يشمل المتحف، مجموعات القطع، المساعدة، أحجية اليوم، الحفظ التلقائي، العربية والإنجليزية. الصعوبة تتكرر: 24 ثم 40 ثم 60 قطعة. لا إعلانات ولا مشتريات مدفوعة.

## تشغيل المشروع

يتطلب Node.js 22 أو أحدث. من مجلد المشروع:

```sh
npm ci
npm run check
npm run build
npm run preview
```

تفتح المعاينة على `http://127.0.0.1:4173`.

## Android

Android Studio 2025.2.1 أو أحدث، JDK 21، وAndroid SDK 36. الحد الأدنى للتطبيق Android 8.

```sh
npm run android
```

أو للبناء من الطرفية:

```sh
npm run sync:android
cd android
./gradlew assembleDebug
```

على Windows استخدم `gradlew.bat`. APK التجريبي داخل `android/app/build/outputs/apk/debug/`. يستخدم التطبيق التجريبي الحزمة `com.erth.jigsaw.debug` حتى لا يستبدل التطبيق المثبت. بناء release يستخدم `com.erth.jigsaw` ويتطلب توقيع صاحب المشروع قبل توزيعه. لا توجد مفاتيح توقيع أو كلمات مرور في المستودع.

النسخة السابقة 0.5.0 تستخدم نفس أصل التخزين `https://appassets.androidplatform.net`. حافظنا عليه لاستيراد التقدم المحلي عند التحديث بنفس الحزمة والتوقيع. لا تحذف بيانات التطبيق عند التحديث. يُنسخ الحفظ أيضاً إلى Preferences محلياً على الجهاز؛ لا توجد مزامنة سحابية.

## iPhone وiPad

Mac مع Xcode 26 أو أحدث. الحد الأدنى لهذا التطبيق iOS 15.4. يستخدم Swift Package Manager؛ لا يحتاج CocoaPods.

```sh
npm ci
npm run ios
```

في Xcode اختر فريق Apple Developer الخاص بك لتشغيله على هاتف أو أرشفته للنشر. يمكن البناء للمحاكي دون شهادة توزيع. ملف المشروع: `ios/App/App.xcodeproj`، والمخطط `App`.

```sh
npm run sync:ios
xcodebuild -project ios/App/App.xcodeproj -scheme App -configuration Debug -sdk iphonesimulator -destination 'generic/platform=iOS Simulator' CODE_SIGNING_ALLOWED=NO build
```

لا تعني اختبارات WebKit على Windows أن تطبيق iOS بُني أو اختُبر على iPhone. راجع تقرير التحقق لمعرفة ما أُنجز فعلاً.

## الاختبارات

```sh
npx playwright install chromium webkit
npm run check
npm test
npm run test:legacy
```

لتشغيل مجموعات اللعب الخمس على WebKit:

```sh
TEST_ENGINE=webkit npm run test:legacy
```

على PowerShell: `$env:TEST_ENGINE='webkit'; npm run test:legacy`.

اختبارات الربط الأصلي تستخدم بديلاً اختبارياً لواجهات Capacitor للتحقق من ترتيب الحفظ، الاستعادة، زر الرجوع، التوقف، والروابط. لا تمثل اختبار جهاز فعلي. اختبارات اللعب تنفذ نقرات وسحباً حقيقياً داخل محركات المتصفح. التقارير واللقطات تتولد في `artifacts/`.

## تنظيم المصدر

- `www/`: اللعبة والصور والمحتوى والمصادر؛ يعدل المطور هذا المصدر المشترك.
- `src/native.ts`: الربط مع حفظ الجهاز وزر الرجوع وروابط المصادر ودورة حياة التطبيق.
- `android/` و`ios/`: المشروعان الأصليان وإعدادات البناء والأيقونات.
- `tests/`: اختبارات اللعب والربط الأصلي.
- `scripts/`: بناء الملفات وفحص المحتوى والمعاينة والاختبارات.
- `.github/workflows/`: فحص المشروع وبناء Android ومحاكي iOS، دون نشر إلى المتاجر.

`dist/` ونسخ الأصول داخل المشروعين تتولد بواسطة `npm run sync` ولا تُعدل يدوياً. مجلد `app/` في GitHub محفوظ كأرشيف للإصدار 0.5.0؛ المصدر الحالي يبدأ من جذر المستودع و`www/`. ملفات البحث التاريخي لم تُغيّر في هذا النقل. الصور تصورات فنية، ومراجعة المحتوى المتخصصة وحقوق نشر الصور تجارياً ما زالتا قيد العمل. وجود الصور في المستودع لا يمنح حقوق توزيع جديدة.

مرجع الإعداد: [Capacitor](https://capacitorjs.com/docs/getting-started/environment-setup)، و[متطلبات خصوصية iOS](https://capacitorjs.com/docs/ios/privacy-manifest).
