# راهنمای جامع راه‌اندازی و اجرای پروژه (لوکال و سرور)

این راهنما شامل آموزش‌های کامل جهت تنظیم متغیرهای محیطی، اجرای پروژه به صورت لوکال در سیستم‌عامل‌های مختلف (ویندوز، لینوکس، مک، ترموکس) و همچنین استقرار (Deploy) روی سرور واقعی (VPS) می‌باشد.

---

## 📋 فهرست مطالب
1. [تنظیم متغیرهای محیطی (`.env`)](#1-تنظیم-متغیرهای-محیطی-env)
2. [اجرای لوکال در ویندوز (Windows)](#2-اجرای-لوکال-در-ویندوز-windows)
3. [اجرای لوکال در لینوکس و مک (Linux & macOS)](#3-اجرای-لوکال-در-لینوکس-و-مک-linux--macos)
4. [اجرای لوکال در ترموکس اندروید (Termux)](#4-اجرای-لوکال-در-ترموکس-اندروید-termux)
5. [استقرار روی سرور واقعی (Production VPS Deployment)](#5-استقرار-روی-سرور-واقعی-production-vps-deployment)

---

## 🔑 1. تنظیم متغیرهای محیطی (`.env`)

قبل از اجرای برنامه، ابتدا یک نسخه از فایل `.env.example` را کپی کرده و نام آن را به `.env` تغییر دهید:

```bash
cp .env.example .env
```

محتوای فایل `.env` شامل مقادیر زیر است:

```env
# پورت اجرای برنامه (پیش‌فرض 3000)
PORT=3000

# وضعیت تعمیرات (true برای فعال‌سازی حالت تعمیرات / false برای عملکرد عادی)
MAINTENANCE_MODE=false

# لینک دیتابیس اصلی PostgreSQL (مثلاً از Supabase, Neon یا دیتابیس لوکال)
DATABASE_URL=postgresql://username:password@localhost:5432/mydb

# لینک دیتابیس Redis جهت مدیریت همزمانی و روم‌های آنلاین (مثلاً از Upstash یا Redis لوکال)
REDIS_URL=rediss://default:password@your-redis-endpoint.upstash.io:6379
```

### توضیح پارامترها:
* **`MAINTENANCE_MODE`**: اگر مقدار آن را برابر `true` قرار دهید، سایت به حالت "در دست تعمیر" رفته و کاربران پیام تعمیرات را مشاهده خواهند کرد. برای غیرفعال کردن کافیست آن را `false` بگذارید.
* **`REDIS_URL`**: برای ذخیره‌سازی وضعیت اتاق‌های بازی آنلاین و سرعت بالای درخواست‌ها استفاده می‌شود. می‌توانید از اکانت رایگان [Upstash](https://upstash.com) استفاده کنید.
* **`DATABASE_URL`**: جهت ذخیره اطلاعات کاربران و آمار بازی‌ها.

---

## 💻 2. اجرای لوکال در ویندوز (Windows)

### پیش‌نیازها:
* دانلود و نصب **Node.js** (نسخه LTS) از سایت رسمی [nodejs.org](https://nodejs.org).

### مراحل اجرا:
1. ترمینال (`CMD` یا `PowerShell`) را در پوشه پروژه باز کنید.
2. بسته‌های مورد نیاز را نصب کنید:
   ```cmd
   npm install
   ```
3. فایل تنظیمات محیطی را ایجاد کنید (مطابق بخش اول):
   ```cmd
   copy .env.example .env
   ```
4. پروژه را در حالت توسعه (Dev Mode) اجرا کنید:
   ```cmd
   npm run dev
   ```
5. مرورگر خود را باز کرده و به آدرس `http://localhost:3000` بروید.

---

## 🐧 3. اجرای لوکال در لینوکس و مک (Linux & macOS)

### پیش‌نیازها:
* نصب Node.js نسخه 18 یا بالاتر:
  ```bash
  # روی اوبونتو / دبیان
  sudo apt update
  sudo apt install -y nodejs npm
  ```

### مراحل اجرا:
1. ترمینال را در پوشه پروژه باز کنید.
2. وابستگی‌های پروژه را نصب کنید:
   ```bash
   npm install
   ```
3. فایل `.env` را بسازید:
   ```bash
   cp .env.example .env
   ```
4. برنامه را اجرا کنید:
   ```bash
   npm run dev
   ```
5. به آدرس `http://localhost:3000` در مرورگر مراجعه نمایید.

---

## 📱 4. اجرای لوکال در ترموکس اندروید (Termux)

برنامه **Termux** به شما اجازه می‌دهد محیط لینوکس کامل را روی گوشی اندرویدی خود داشته باشید.

### مراحل نصب و اجرا در Termux:
1. برنامه Termux را اجرا کرده و پکیج‌ها را بروزرسانی کنید:
   ```bash
   pkg update && pkg upgrade -y
   ```
2. ابزارهای مورد نیاز (Node.js, Git, Python و کامپایلرها) را نصب کنید:
   ```bash
   pkg install nodejs-lts git python make g++ -y
   ```
3. وارد پوشه پروژه شوید:
   ```bash
   cd path/to/your/project
   ```
4. ماژول‌ها را نصب کنید:
   ```bash
   npm install
   ```
5. فایل `.env` را ایجاد نمایید:
   ```bash
   cp .env.example .env
   ```
6. پروژه را روشن کنید:
   ```bash
   npm run dev
   ```
7. حالا مرورگر گوشی خود (Chrome یا Firefox) را باز کرده و به آدرس زیر بروید:
   ```text
   http://localhost:3000
   ```

---

## 🚀 5. استقرار روی سرور واقعی (Production VPS Deployment)

برای اجرای پروژه روی یک سرور لینوکس واقعی (اوبونتو/دبیان) به صورت دائم و ۲۴ ساعته، روش‌های زیر توصیه می‌شود.

### روش اول: اجرای مستقیم با PM2 و Nginx (توصیه شده)

#### ۱. آماده‌سازی سرور:
وارد SSH سرور خود شوید و Node.js را نصب کنید:
```bash
sudo apt update && sudo apt upgrade -y
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs nginx
sudo npm install -g pm2
```

#### ۲. نصب وابستگی‌ها و بیلد پروژه:
وارد پوشه پروژه در سرور شوید:
```bash
npm install
cp .env.example .env
# مقادیر واقعی DATABASE_URL و REDIS_URL را داخل .env تنظیم کنید
nano .env

# ساخت فایل خروجی پروداکشن (Build)
npm run build
```

#### ۳. اجرا با PM2 (جهت زنده ماندن پروسه ۲۴ ساعته):
```bash
pm2 start dist/server.cjs --name "ludo-game"
pm2 save
pm2 startup
```
*دستورات مفید PM2:*
* مشاهده وضعیت: `pm2 status`
* مشاهده لاگ‌ها: `pm2 logs ludo-game`
* ری‌استارت پروژه: `pm2 restart ludo-game`

#### ۴. تنظیم Reverse Proxy با Nginx (اتصال دامنه و پورت):
فایل تنظیمات Nginx را ویرایش کنید:
```bash
sudo nano /etc/nginx/sites-available/default
```
محتوای زیر را جایگزین کنید (جای `your-domain.com` دامنه خود را بگذارید):
```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```
سپس Nginx را تست و ری‌استارت کنید:
```bash
sudo nginx -t
sudo systemctl restart nginx
```

#### ۵. فعال‌سازی SSL مجانی (HTTPS):
با استفاده از Certbot دامنه خود را به SSL رایگان مجهز کنید:
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

---

### روش دوم: استقرار با داکر (Docker)

اگر مایلید از داکر استفاده کنید، یک فایل به نام `Dockerfile` در ریشه پروژه ایجاد کنید:

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY --from=builder /app/dist ./dist
ENV NODE_ENV=production
EXPOSE 3000
CMD ["node", "dist/server.cjs"]
```

سپس برای ساخت و اجرای کانتینر دستورات زیر را وارد کنید:
```bash
docker build -t ludo-game .
docker run -d -p 3000:3000 --env-file .env --name ludo-game-app ludo-game
```

---

🎉 **پروژه شما آماده استفاده است!**
