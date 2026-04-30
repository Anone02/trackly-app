# 📊 Trackly — Smart Job Application Tracker

**Trackly** adalah ekosistem pelacakan lamaran kerja _full-stack_ yang mengintegrasikan _dashboard_ web modern dengan **Telegram Bot** untuk entri data secara _real-time_. Proyek ini dirancang untuk mengelola alur kerja pencarian kerja dengan sinkronisasi data lintas platform yang mulus dan analitik yang mendalam.

## 🚀 Fitur Utama

- **Dual-Entry System**: Input data lamaran kerja melalui _dashboard_ web atau langsung lewat **Telegram Bot API**.
- **Real-time Analytics**: Visualisasi data interaktif untuk memantau _rejection rate_, tren volume lamaran, dan sumber lamaran kerja (LinkedIn, Glints, dsb).
- **Secure Authentication**: Sistem login aman menggunakan **JWT**, **Bcrypt** hashing, dan **Next.js Middleware** dengan _httpOnly cookies_.
- **Data Integrity**: Validasi skema data yang ketat menggunakan **Zod** dan lapisan normalisasi untuk memastikan kebersihan data sebelum masuk ke database.
- **High-End UI/UX**: Antarmuka responsif yang terinspirasi dari standar SaaS modern (Stripe/Linear) menggunakan **Tailwind CSS**, **shadcn/ui**, dan **Framer Motion**.

## 🛠️ Tech Stack

- **Frontend/Backend**: [Next.js 15+](https://nextjs.org/) (App Router), TypeScript, Server Actions.
- **Database**: [PostgreSQL](https://www.postgresql.org/) (Supabase), [Prisma ORM](https://www.prisma.io/).
- **Security**: JWT, Bcrypt, Row Level Security (RLS).
- **Integrations**: Telegram Bot API, Zod Validation.
- **Deployment**: [Vercel](https://vercel.com/), GitHub Actions.

## 🏗️ Arsitektur Sistem & Performa

Proyek ini mengimplementasikan prinsip **Serverless Architecture** dan **Data Engineering** yang solid:

- **Data Pipeline**: Pesan dari Telegram diproses melalui _state-machine conversation flow_ sebelum divalidasi oleh **Zod** dan disimpan ke database.
- **Database Optimization**: Skema PostgreSQL dioptimalkan dengan **Strategic Indexing** pada kolom frekuensi tinggi seperti `status` dan `user_id` untuk mengurangi latensi dashboard.
- **DevOps & CI/CD**: Otomatisasi _pipeline_ menggunakan **GitHub Actions** untuk memastikan _build_ yang stabil dan _deployment_ tanpa _downtime_ ke **Vercel**.

## 🚦 Memulai (Local Development)

1.  **Clone repositori**:

    ```bash
    git clone [https://github.com/username/trackly-app.git](https://github.com/username/trackly-app.git)
    ```

2.  **Instal dependensi**:

    ```bash
    npm install
    ```

3.  **Setup Environment Variables**:
    Buat file `.env` di direktori akar dan tambahkan kunci berikut:
    ```env
    DATABASE_URL="your_postgresql_url"
    DIRECT_URL="your_direct_postgresql_url"
    JWT_SECRET="your_secret_key"
    TELEGRAM_BOT_TOKEN="your_bot_token"
    ```
