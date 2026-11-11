# 🛡️ HookSentry

> **Enterprise-Ready Webhook Ingestion, Dead-Letter Queue (DLQ) & Intelligent Retry SaaS**

HookSentry, Stripe, Shopify, GitHub ve özel webhook sağlayıcılarından gelen kritik olayların asla kaybolmamasını sağlayan modern bir webhook ağ geçidi (API Gateway) ve gözlemleme panelidir.

---

## ⚡ Özellikler

- **🔒 SSRF Kalkanı & Güvenlik:** `127.0.0.1`, RFC 1918 özel IP'ler ve AWS/GCP `169.254.169.254` instance metadata adreslerine karşı iç ağ taraması kalkanı.
- **🔑 Timing-Safe HMAC Doğrulaması:** Zamanlama saldırılarını (timing attack) önleyen `crypto.timingSafeEqual` destekli HMAC-SHA256 imza doğrulayıcı.
- **🔄 Üstel Geri Çekilme (Exponential Backoff with Full Jitter):** Hedef sunucu hata verdiğinde (5xx, timeout) üstel aralıklarla otomatik yeniden deneme döngüsü.
- **⏰ Otomatik Retry Worker (Cron API):** `/api/v1/cron/retry` endpoint'i ile süresi gelmiş başarısız webhook'ları arka planda otomatik yeniden fırlatma.
- **🛑 Dead-Letter Queue (DLQ):** Belirlenen deneme sınırı aşıldığında başarısız webhook'ları karantinaya alma ve tek tıkla **Replay (Yeniden Gönderme)** imkânı.
- **📊 Canlı Dashboard & Metrikler:** Aktif endpoint'ler, teslimat başarı oranları, yanıt gecikmesi (ms) ve ham JSON payload inceleyicisi.
- **🩺 Sağlık Kontrolü (Healthcheck):** `/api/health` üzerinden veritabanı gecikmesi ve sistem durum izleme.

---

## 🛠️ Mimari ve Teknoloji Yığını

- **Full-Stack Çerçeve:** Next.js 15 (App Router, Server Actions)
- **Dil:** TypeScript (Strict mode)
- **Veritabanı & ORM:** Prisma ORM + SQLite (Yerel & PostgreSQL / Supabase uyumlu)
- **Stil & Arayüz:** Tailwind CSS + Lucide Icons
- **Kriptografi:** Node.js Native `crypto` (HMAC-SHA256, CSPRNG randomBytes)

---

## 🚀 Hızlı Başlangıç

### 1. Bağımlılıkları Yükleyin
```bash
npm install
```

### 2. Veritabanını İlklendirin
```bash
npx prisma db push
```

### 3. Geliştirme Sunucusunu Başlatın
```bash
npm run dev
```

Tarayıcınızda [http://localhost:3000](http://localhost:3000) adresine gidin.

---

## 📡 Webhook Gönderme (Ingest API)

Oluşturduğunuz endpoint'e webhook göndermek için:

```bash
curl -X POST http://localhost:3000/api/v1/ingest/<ENDPOINT_ID> \
  -H "Content-Type: application/json" \
  -H "Stripe-Signature: t=1730000000,v1=<HASH>" \
  -d '{"event": "payment_intent.succeeded", "amount": 4900}'
```

---

## 👨‍💻 Geliştirici & Mimari Ekibi

Bu proje çoklu uzman ajan ekibi tarafından tasarlanmış ve geliştirilmiştir:
- **Mimar Selim:** Sistem Mimarisi & Veri Modeli
- **Vanlı:** Full-Stack & API Geliştirme
- **Ali Oda:** Siber Güvenlik (SSRF & Kriptografi)
- **Jony:** QA & Test Doğrulama
- **Armut:** Proje Liderliği & Release Yönetimi
