import { prisma } from "@/lib/prisma";
import { calculateBackoffMs, signWebhookPayload } from "@/lib/crypto";

export interface DeliveryResult {
  success: boolean;
  attemptNumber: number;
  statusCode?: number;
  executionTimeMs: number;
  error?: string;
  responseBody?: string;
}

/**
 * Bir webhook olayını hedef URL'e iletir ve sonucunu veritabanına yazar
 */
export async function deliverWebhookEvent(eventId: string): Promise<DeliveryResult> {
  const startTime = Date.now();

  const event = await prisma.webhookEvent.findUnique({
    where: { id: eventId },
    include: {
      endpoint: true,
      attempts: {
        orderBy: { attemptNumber: "desc" },
        take: 1,
      },
    },
  });

  if (!event) {
    throw new Error(`WebhookEvent bulunamadı: ${eventId}`);
  }

  const endpoint = event.endpoint;
  const currentAttempt = (event.attempts[0]?.attemptNumber || 0) + 1;

  // Endpoint pasifse teslimat durdurulur
  if (endpoint.status !== "ACTIVE") {
    return {
      success: false,
      attemptNumber: currentAttempt,
      executionTimeMs: 0,
      error: "Endpoint aktif değil, teslimat iptal edildi.",
    };
  }

  // Durumu PROCESSING olarak güncelle
  await prisma.webhookEvent.update({
    where: { id: event.id },
    data: { status: "PROCESSING" },
  });

  // İmzayı hazırla (Hedef sunucuya Stripe standardında HMAC gönderilir)
  const signatureData = signWebhookPayload(event.payload, endpoint.secretKey);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), endpoint.timeoutMs);

  let statusCode: number | undefined;
  let responseBody: string | undefined;
  let errorMessage: string | undefined;
  let isSuccess = false;

  try {
    const res = await fetch(endpoint.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "HookSentry/1.0 (+https://hooksentry.dev)",
        "X-HookSentry-Event-Id": event.id,
        "X-HookSentry-Attempt": String(currentAttempt),
        "X-HookSentry-Signature": signatureData.signature,
        "Stripe-Signature": signatureData.signature,
      },
      body: event.payload,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    statusCode = res.status;

    try {
      const text = await res.text();
      // İlk 2KB yanıtı sakla (bellek şişmesini önle)
      responseBody = text.substring(0, 2048);
    } catch {
      responseBody = "";
    }

    // 2xx yanıtları başarılı kabul edilir
    if (res.ok) {
      isSuccess = true;
    } else {
      errorMessage = `Hedef sunucu ${res.status} ${res.statusText} döndü.`;
    }
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === "AbortError") {
      errorMessage = `Zaman aşımı: ${endpoint.timeoutMs}ms içinde yanıt alınamadı.`;
    } else {
      errorMessage = err.message || "Ağ hatası veya sunucuya ulaşılamadı.";
    }
  }

  const executionTimeMs = Date.now() - startTime;

  // 1. DeliveryAttempt kaydını oluştur
  await prisma.deliveryAttempt.create({
    data: {
      eventId: event.id,
      endpointId: endpoint.id,
      attemptNumber: currentAttempt,
      responseStatus: statusCode || null,
      responseBody: responseBody || null,
      executionTimeMs,
      status: isSuccess ? "SUCCESS" : statusCode ? "FAILED" : "TIMEOUT",
      errorMessage: errorMessage || null,
    },
  });

  // 2. WebhookEvent durumunu güncelle (Başarılı vs Tekrar Dene / DLQ)
  if (isSuccess) {
    await prisma.webhookEvent.update({
      where: { id: event.id },
      data: {
        status: "DELIVERED",
        retryCount: currentAttempt,
        nextRetryAt: null,
      },
    });
  } else {
    // Retry veya DLQ kararı
    if (currentAttempt >= endpoint.maxRetries) {
      // Maksimum deneme bitti -> DLQ'ya taşı
      await prisma.webhookEvent.update({
        where: { id: event.id },
        data: {
          status: "EXHAUSTED",
          retryCount: currentAttempt,
          nextRetryAt: null,
        },
      });

      // DeadLetterQueue kaydı
      await prisma.deadLetterQueue.upsert({
        where: { eventId: event.id },
        create: {
          eventId: event.id,
          endpointId: endpoint.id,
          reason: `Maksimum deneme sınırına (${endpoint.maxRetries}) ulaşıldı: ${errorMessage}`,
        },
        update: {
          reason: `Maksimum deneme sınırına (${endpoint.maxRetries}) ulaşıldı: ${errorMessage}`,
          archivedAt: new Date(),
        },
      });
    } else {
      // Exponential Backoff ile sonraki deneme zamanını hesapla
      const backoffMs = calculateBackoffMs(currentAttempt);
      const nextRetryAt = new Date(Date.now() + backoffMs);

      await prisma.webhookEvent.update({
        where: { id: event.id },
        data: {
          status: "FAILED",
          retryCount: currentAttempt,
          nextRetryAt,
        },
      });
    }
  }

  return {
    success: isSuccess,
    attemptNumber: currentAttempt,
    statusCode,
    executionTimeMs,
    error: errorMessage,
    responseBody,
  };
}
