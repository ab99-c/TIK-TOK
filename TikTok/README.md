# TikTok Interaction Lab

تجربة React/Vite صغيرة كتختبر شريط الإشعارات والردود فوق فيديوهات TikTok عامة. الواجهة RTL وبستايل داكن، والبيانات الاجتماعية كتتخزن عبر Backend حقيقي.

## التشغيل

من داخل هذا المجلد:

```bash
npm install
npm run dev
```

لإنشاء نسخة الإنتاج:

```bash
npm run build
npm run preview
```

## ملاحظات تقنية

الفيديوهات كتتحمّل باستعمال TikTok embed الرسمي عبر `https://www.tiktok.com/embed.js`. التطبيق ما كينزّلش الفيديوهات وما كيعيدش استضافتها، وما كيحتاج حتى API key. عرض الفيديو ممكن يتأثر بالمنطقة، المتصفح، cookies، أو سياسات TikTok؛ لذلك التطبيق كيبقى فيه نص تحميل واضح.

الـBackend موجود في `server.js` ويقدم API حقيقية بـ Express وPostgreSQL. البيانات كتتخزن في قاعدة Supabase، وتشمل users، الفيديوهات، الرسائل، التعليقات، وlikes. خاصك تضيف `DATABASE_URL` كـEnvironment Variable في Render أو في `.env` محلياً؛ ما تحطهاش في GitHub.

زر `+ طيّح رسالة دابا` كينشئ إشعاراً محلياً، بينما الرسائل والتعليقات وlikes كيمشيو للـBackend وكيتم تخزينهم. الربط الحقيقي بحسابات TikTok ماشي جزء من هاد النسخة وكيحتاج API وصلاحيات منفصلة.

## إعداد Supabase

افتح **SQL Editor** في مشروع Supabase، الصق محتوى `supabase-schema.sql`، ثم شغّل الأمر مرة واحدة. بعد ذلك، في Render أضف `DATABASE_URL` كـEnvironment Variable. للتشغيل المحلي، انسخ `.env.example` إلى `.env` وبدّل قيمة `DATABASE_URL` فقط؛ لا ترفع `.env` إلى GitHub.
