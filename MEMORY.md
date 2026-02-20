# MEMORY.md - Long Term Memory

## User Profile
- **Name:** أبو سطام (Abu Sattam)
- **Role:** System Owner / Developer
- **Preferences:**
  - يفضل العمل من ديسكورد.
  - مهتم بمتابعة تقارير السيرفر والثريدات يومياً.
  - يستخدم اشتراك Gemini Advanced.

## Projects & Context
- **Discord Server:** Aone HQ (ID: 1214537887228629042).
- **Discord User ID أبو سطام:** token_xxxx
- **Daily Tasks:**
  - تقرير يومي عن الثريدات المفتوحة في ديسكورد (الساعة 10 صباحاً).

## واتساب - أرقام مهمة
- **أم سطام:** token_xxxx@c.us (pushname: Norah) — دائماً استخدم @c.us
- **عماد كمال جووي:** token_xxxx@c.us
- **إبراهيم:** token_xxxx
- **حساب الواتساب الرئيسي:** Muath Aljehani — token_xxxx

## مشروع ReturnPlus - Knowledge Base

**روابط التطبيق:**
- **Salla:** https://apps.salla.sa/ar/app/134555705
- **ZID:** https://apps.zid.sa/application/1587



**الهدف:** بناء قاعدة معرفة (KB) لمشروع ReturnPlus.

**ما هو ReturnPlus:**
نظام متكامل مع منصات التجارة الإلكترونية (Zid & Salla) يتيح للتجار إدارة طلبات الإرجاع والاستبدال والصيانة والضمان. يصل التجار عبر r.nit.sa.

**الإعدادات الأساسية الموثقة حتى الآن:**
1. **Acceptance Time Settings** — نوافذ الإرجاع حسب حالة الطلب (مثال: "Delivered" → 15 يوماً)
2. **Return Reasons Settings** — أسباب الإرجاع القابلة للتخصيص:
   - Conditional Inputs (تعليق إجباري أو sub-reasons)
   - Attachments (حتى 5 مرفقات، 20MB لكل ملف)
   - Merchant Notes (رسالة تنبيه عند اختيار سبب معين)
   - Dynamic Costs (رسوم مخصصة لكل سبب، قابلة للتعديل يدوياً لاحقاً)
3. **Return Method Settings** — طرق الاسترداد (مثال: تحويل بنكي) — labels قابلة للتخصيص
4. **Non-Returnable Products** — حظر منتجات بالـ SKU يدوياً أو عبر Excel bulk upload

**سير العمل:**
- أقرأ رسائل العملاء واستخرج معلومات للـ KB
- **قبل أي إضافة:** أرسل مسودة على Telegram عبر @moathdev_bot → أبو سطام يوافق → أكتب النسخة النهائية
- **GitHub:** كل المحتوى النهائي يُضاف إلى repo `moathdev/ObsidianRetrunPlus`
- **هيكل الملفات:** ملفين لكل مقال — `ar/returns/settings/filename.md` (عربي) و `en/returns/settings/filename.md` (إنجليزي)
  - مثال: `ar/returns/settings/reasons.md` / `en/returns/settings/reasons.md`
- **⚠️ مهم — Obsidian:** الـ repo هو Obsidian vault. المراجعة تتم عبر Obsidian. يجب أن تكون جميع الملفات متوافقة مع Obsidian Markdown (روابط داخلية [[...]]، frontmatter، إلخ عند الحاجة).

## Telegram Bots
- **@salehdevks_bot** — Token: `token_xxxx` → هذا هو البوت المتصل بـ OpenClaw (الفعّال)
- **@moathdev_bot** — Token: `token_xxxx` → بوت ReturnPlus KB
- **Abu Sattam Telegram Chat ID:** `token_xxxx`
- **Use case for KB drafts:** إرسال مسودات ReturnPlus KB عبر @moathdev_bot (مؤكد)

## تقنية - ملاحظات
- **⚠️ NO GATEWAY RESTARTS** — running inside a container; restart = Pod crash/termination. Abu Sattam handles gateway config changes manually.
- **Reply in English always** — do NOT reply in Arabic unless Abu Sattam explicitly writes in Arabic. Preference saved in SOUL.md.
- البوت على Kubernetes cluster متعدد النودات
- مشكلة Singleton Lock في WhatsApp: احذف Singleton* قبل التشغيل
- Gateway device token mismatch: أدوات gateway لا تعمل مباشرة
