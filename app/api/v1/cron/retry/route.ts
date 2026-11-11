import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { deliverWebhookEvent } from "@/lib/dispatcher";

export const dynamic = "force-dynamic";

/**
 * Otomatik Retry Cron / Worker Endpoint'i
 * GET veya POST ile tetiklenebilir.
 * nextRetryAt zamanı gelmiş başarısız webhook'ları tarar ve yeniden iletir.
 */
export async function GET(request: NextRequest) {
  return handleCronRetry(request);
}

export async function POST(request: NextRequest) {
  return handleCronRetry(request);
}

async function handleCronRetry(request: NextRequest) {
  const startTime = Date.now();

  try {
    // 1. İsteğe Bağlı CRON_SECRET Güvenlik Kontrolü
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && cronSecret !== "hooksentry_cron_secret_change_me_in_prod") {
      const authHeader = request.headers.get("authorization");
      if (authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json(
          { error: "Yetkisiz erişim. Geçersiz veya eksik CRON_SECRET." },
          { status: 401 }
        );
      }
    }

    // 2. Yeniden denenme zamanı (nextRetryAt) gelmiş olayları sorgula (Tek seferde en fazla 20 adet)
    const now = new Date();
    const pendingRetries = await prisma.webhookEvent.findMany({
      where: {
        status: "FAILED",
        nextRetryAt: {
          lte: now,
        },
      },
      take: 20,
      orderBy: { nextRetryAt: "asc" },
      include: {
        endpoint: {
          select: { id: true, name: true, status: true },
        },
      },
    });

    if (pendingRetries.length === 0) {
      return NextResponse.json({
        success: true,
        message: "Süresi gelmiş bekleyen retry olayı yok.",
        processedCount: 0,
        durationMs: Date.now() - startTime,
      });
    }

    // 3. Olayları sırayla ilet
    const results = [];
    for (const event of pendingRetries) {
      // Endpoint pasifse atla
      if (event.endpoint.status !== "ACTIVE") {
        continue;
      }

      try {
        const deliveryResult = await deliverWebhookEvent(event.id);
        results.push({
          eventId: event.id,
          endpoint: event.endpoint.name,
          success: deliveryResult.success,
          attemptNumber: deliveryResult.attemptNumber,
          statusCode: deliveryResult.statusCode,
          error: deliveryResult.error,
        });
      } catch (err: any) {
        results.push({
          eventId: event.id,
          endpoint: event.endpoint.name,
          success: false,
          error: err.message,
        });
      }
    }

    return NextResponse.json({
      success: true,
      processedCount: results.length,
      durationMs: Date.now() - startTime,
      results,
    });
  } catch (error: any) {
    console.error("Cron Retry Error:", error);
    return NextResponse.json(
      { error: "Cron retry işlemi sırasında hata oluştu.", details: error.message },
      { status: 500 }
    );
  }
}
