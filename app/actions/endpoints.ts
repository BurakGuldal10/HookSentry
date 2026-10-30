"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { generateSecretKey } from "@/lib/crypto";
import { CreateEndpointInput, UpdateEndpointInput } from "@/lib/types";
import { validateWebhookUrl } from "@/lib/ssrf";

/**
 * Secret key'i istemciye göndermeden önce maskeler
 */
function maskSecretKey(secret: string): string {
  if (!secret) return "whsec_********";
  if (secret.length <= 12) return "whsec_********";
  return `${secret.substring(0, 10)}...${secret.substring(secret.length - 4)}`;
}

/**
 * Tüm endpointleri listeler (Secret key güvenli şekilde maskelenir)
 */
export async function getEndpoints() {
  try {
    const endpoints = await prisma.endpoint.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: {
            events: true,
            deadLetterEvents: true,
          },
        },
      },
    });

    const sanitized = endpoints.map((ep) => ({
      ...ep,
      secretKey: maskSecretKey(ep.secretKey),
    }));

    return { success: true, data: sanitized };
  } catch (error: any) {
    console.error("getEndpoints error:", error);
    return { success: false, error: "Endpointler yüklenemedi." };
  }
}

/**
 * Tek bir endpoint detayını getirir
 */
export async function getEndpointById(id: string) {
  try {
    const endpoint = await prisma.endpoint.findUnique({
      where: { id },
      include: {
        events: {
          take: 20,
          orderBy: { createdAt: "desc" },
          include: {
            attempts: {
              orderBy: { attemptNumber: "desc" },
            },
          },
        },
        deadLetterEvents: {
          take: 10,
          orderBy: { archivedAt: "desc" },
        },
      },
    });

    if (!endpoint) {
      return { success: false, error: "Endpoint bulunamadı." };
    }

    return {
      success: true,
      data: {
        ...endpoint,
        secretKey: maskSecretKey(endpoint.secretKey),
      },
    };
  } catch (error: any) {
    console.error("getEndpointById error:", error);
    return { success: false, error: "Endpoint detayı yüklenemedi." };
  }
}

/**
 * Yeni endpoint oluşturur (SSRF koruması ve DoS sınırları ile)
 */
export async function createEndpoint(input: CreateEndpointInput) {
  try {
    // 1. İsim ve Karakter Sınırı
    const name = input.name?.trim();
    if (!name || name.length === 0 || name.length > 100) {
      return { success: false, error: "Endpoint adı 1 ile 100 karakter arasında olmalıdır." };
    }

    // 2. SSRF Güvenlik Doğrulaması
    const urlValidation = validateWebhookUrl(input.url);
    if (!urlValidation.isValid) {
      return { success: false, error: urlValidation.error };
    }

    // 3. Güvenlik Sınırları (DoS Koruması)
    const rateLimitPerMin = Math.min(Math.max(Number(input.rateLimitPerMin) || 60, 1), 6000);
    const timeoutMs = Math.min(Math.max(Number(input.timeoutMs) || 5000, 1000), 30000); // 1s - 30s
    const maxRetries = Math.min(Math.max(Number(input.maxRetries) || 5, 0), 10); // max 10 retry

    const secretKey = input.secretKey?.trim() || generateSecretKey();

    const newEndpoint = await prisma.endpoint.create({
      data: {
        name,
        url: input.url.trim(),
        description: input.description?.trim().substring(0, 500) || null,
        secretKey,
        rateLimitPerMin,
        timeoutMs,
        maxRetries,
        status: "ACTIVE",
      },
    });

    revalidatePath("/");
    // İlk oluşturulduğunda kullanıcı görsün diye tam secret döner
    return { success: true, data: newEndpoint };
  } catch (error: any) {
    console.error("createEndpoint error:", error);
    return { success: false, error: "Endpoint oluşturulamadı." };
  }
}

/**
 * Endpoint günceller (SSRF koruması ve DoS sınırları ile)
 */
export async function updateEndpoint(input: UpdateEndpointInput) {
  try {
    const existing = await prisma.endpoint.findUnique({
      where: { id: input.id },
    });

    if (!existing) {
      return { success: false, error: "Güncellenecek endpoint bulunamadı." };
    }

    // URL güncelleniyorsa SSRF kontrolü
    if (input.url) {
      const urlValidation = validateWebhookUrl(input.url);
      if (!urlValidation.isValid) {
        return { success: false, error: urlValidation.error };
      }
    }

    const updated = await prisma.endpoint.update({
      where: { id: input.id },
      data: {
        ...(input.name ? { name: input.name.trim().substring(0, 100) } : {}),
        ...(input.url ? { url: input.url.trim() } : {}),
        ...(input.description !== undefined ? { description: input.description?.trim().substring(0, 500) || null } : {}),
        ...(input.rateLimitPerMin ? { rateLimitPerMin: Math.min(Math.max(Number(input.rateLimitPerMin), 1), 6000) } : {}),
        ...(input.timeoutMs ? { timeoutMs: Math.min(Math.max(Number(input.timeoutMs), 1000), 30000) } : {}),
        ...(input.maxRetries !== undefined ? { maxRetries: Math.min(Math.max(Number(input.maxRetries), 0), 10) } : {}),
        ...(input.status ? { status: input.status } : {}),
      },
    });

    revalidatePath("/");
    return {
      success: true,
      data: {
        ...updated,
        secretKey: maskSecretKey(updated.secretKey),
      },
    };
  } catch (error: any) {
    console.error("updateEndpoint error:", error);
    return { success: false, error: "Endpoint güncellenemedi." };
  }
}

/**
 * Endpoint siler
 */
export async function deleteEndpoint(id: string) {
  try {
    await prisma.endpoint.delete({
      where: { id },
    });

    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    console.error("deleteEndpoint error:", error);
    return { success: false, error: "Endpoint silinemedi." };
  }
}

/**
 * Geliştirme ve denetim için demo verisi oluşturur
 */
export async function seedDemoData() {
  try {
    const count = await prisma.endpoint.count();
    if (count > 0) {
      return { success: false, message: "Veritabanında zaten kayıtlı endpointler bulunmaktadır." };
    }

    const ep1 = await prisma.endpoint.create({
      data: {
        name: "Stripe Ödeme Webhook'u (Prod)",
        url: "https://api.mysaas.com/webhooks/stripe",
        description: "Müşteri ödemeleri, abonelik ve fatura güncellemeleri",
        secretKey: generateSecretKey(),
        rateLimitPerMin: 120,
        timeoutMs: 5000,
        maxRetries: 5,
        status: "ACTIVE",
      },
    });

    const ep2 = await prisma.endpoint.create({
      data: {
        name: "Shopify Sipariş Senkronizasyonu",
        url: "https://erp.mysaas.com/integrations/shopify",
        description: "Sipariş oluşturma ve kargo takip durumları",
        secretKey: generateSecretKey(),
        rateLimitPerMin: 60,
        timeoutMs: 8000,
        maxRetries: 3,
        status: "ACTIVE",
      },
    });

    // 1 başarılı event
    const successEvent = await prisma.webhookEvent.create({
      data: {
        endpointId: ep1.id,
        eventType: "payment_intent.succeeded",
        payload: JSON.stringify({ id: "pi_3Mtw", amount: 4900, currency: "usd" }),
        status: "DELIVERED",
      },
    });

    await prisma.deliveryAttempt.create({
      data: {
        eventId: successEvent.id,
        endpointId: ep1.id,
        attemptNumber: 1,
        responseStatus: 200,
        executionTimeMs: 142,
        status: "SUCCESS",
        responseBody: JSON.stringify({ received: true }),
      },
    });

    // 1 DLQ'ya düşmüş event
    const failedEvent = await prisma.webhookEvent.create({
      data: {
        endpointId: ep2.id,
        eventType: "orders/create",
        payload: JSON.stringify({ order_id: 10928, total_price: "249.00" }),
        status: "EXHAUSTED",
        retryCount: 3,
      },
    });

    await prisma.deliveryAttempt.createMany({
      data: [
        {
          eventId: failedEvent.id,
          endpointId: ep2.id,
          attemptNumber: 1,
          responseStatus: 504,
          executionTimeMs: 8000,
          status: "FAILED",
          errorMessage: "Gateway Timeout",
        },
        {
          eventId: failedEvent.id,
          endpointId: ep2.id,
          attemptNumber: 2,
          responseStatus: 504,
          executionTimeMs: 8000,
          status: "FAILED",
          errorMessage: "Gateway Timeout",
        },
        {
          eventId: failedEvent.id,
          endpointId: ep2.id,
          attemptNumber: 3,
          responseStatus: 500,
          executionTimeMs: 1200,
          status: "FAILED",
          errorMessage: "Internal Server Error",
        },
      ],
    });

    await prisma.deadLetterQueue.create({
      data: {
        endpointId: ep2.id,
        eventId: failedEvent.id,
        reason: "Maksimum deneme sınırına (3) ulaşıldı ve hedef sunucu yanıt vermedi.",
      },
    });

    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    console.error("seedDemoData error:", error);
    return { success: false, error: "Demo verisi yüklenemedi." };
  }
}
