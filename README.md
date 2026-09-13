# نظام محاسبة تاجر ملابس

نظام محاسبة داخلي **خاص** (مستخدم واحد فقط) لتاجر يستورد ملابس رجالي/حريمي بجميع أنواعها، ويوزّعها بالجملة على تجار آخرين (عملاء).

## الميزات الرئيسية

- **إدارة الأصناف والمخزون**: تسجيل كل صنف مع تتبع الكمية المستوردة، المباعة، المتبقية، والفاقد
- **إدارة التجار (العملاء)**: سجل مستقل لكل تاجر مع فواتيره ومديونيته ودفعاته
- **الفواتير**: إنشاء فواتير توزيع بضاعة مع حالة الدفع
- **الدفعات**: تسجيل الدفعات المتخصصة من المديونية
- **الفاقد**: تسجيل أي كمية خرجت من المخزون دون بيع
- **التقارير**: تقارير مبيعات، مديونية، مخزون، أرباح/خسائر — قابلة للتصدير Excel و Word
- **لوحة تحكم**: مؤشرات ورسوم بيانية للمبيعات والأرباح والمديونية

## المكدس التقني

| الطبقة | التقنية |
|--------|---------|
| الواجهة | Next.js 14 (App Router) + TypeScript |
| التنسيق | TailwindCSS + خط Cairo + RTL |
| إدارة الحالة | Zustand + TanStack Query |
| قاعدة البيانات | Supabase (Postgres) |
| التصدير | exceljs + docx |
| الرسوم البيانية | recharts |

## متطلبات التشغيل

- Node.js 18+
- حساب Supabase
- npm أو yarn

## خطوات التشغيل المحلي

### 1. استنساخ المشروع

```bash
git clone <repository-url>
cd clothing-accounting
```

### 2. تثبيت التبعيات

```bash
npm install
```

### 3. إعداد متغيرات البيئة

انسخ ملف `.env.example` إلى `.env.local`:

```bash
cp .env.example .env.local
```

ثم قم بتعديل المتغيرات:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Auth - Single User
APP_USERNAME=admin
APP_PASSWORD_HASH=your_bcrypt_hashed_password
SESSION_SECRET=your_iron_session_secret_min_32_chars
```

### 4. إنشاء كلمة مرور مشفرة

```bash
node scripts/generate-password.js your_password
```

سيتم طباعة القيمة المشفرة، أضفها إلى `.env.local`.

### 5. إعداد قاعدة البيانات

1. اذهب إلى مشروع Supabase الخاص بك
2. انتقل إلى SQL Editor
3. نفذ محتوى ملف `supabase/migrations/001_init.sql`

### 6. تشغيل المشروع

```bash
npm run dev
```

افتح المتصفح على: `http://localhost:3000`

## هيكل المشروع

```
clothing-accounting/
├── app/
│   ├── (auth)/
│   │   └── login/           # صفحة تسجيل الدخول
│   ├── (dashboard)/
│   │   ├── dashboard/       # لوحة التحكم
│   │   ├── products/        # إدارة الأصناف
│   │   ├── merchants/       # إدارة التجار
│   │   ├── invoices/        # الفواتير
│   │   ├── payments/        # الدفعات
│   │   ├── losses/          # الفاقد
│   │   └── reports/         # التقارير
│   └── api/
│       ├── auth/            # API المصادقة
│       └── export/          # API التصدير
├── components/
│   ├── layout/              # مكونات التخطيط
│   └── ui/                  # مكونات UI العامة
├── lib/
│   ├── auth/                # المصادقة
│   ├── supabase/            # إعدادات Supabase
│   ├── store.ts             # Zustand store
│   └── types.ts             # أنواع TypeScript
└── supabase/
    └── migrations/          # هجرات قاعدة البيانات
```

## النشر على Vercel

1. ارفع المشروع على GitHub
2. اربط المستودع مع Vercel
3. أضف متغيرات البيئة في إعدادات Vercel
4. انشر المشروع

## ملاحظات مهمة

- كل عملية تغيير المخزون تمر عبر `inventory_movements`
- الحسابات المالية تتم عبر SQL views في Supabase
- النظام مصمم لمستخدم واحد فقط (لا حاجة لنظام صلاحيات)

## الدعم

للمساعدة أو الإبلاغ عن مشاكل، يرجى فتح issue في المستودع.
