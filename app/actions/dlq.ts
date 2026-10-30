"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { deliverWebhookEvent } from "@/lib/dispatcher";

/**
 * Tüm Dead-Letter Queue (DLQ) kayıtlarını getirir
 */
export async function getDeadLetterEvents() {
  try {
    const items = await prisma.deadLetterQueue.findMany({
      orderBy: { archivedAt: "desc" },
      include: {
        endpoint: {
          select: {
            id: true,
            name: true,
            url: true,
          },
        },
        event: {
          include: {
            attempts: {
              orderBy: { attemptNumber: "desc" },
              take: 3,
            },
          },
        },
      },
    });

    return { success: true, data: items };
  } catch (error: any) {
    console.error("getDeadLetterEvents error:", error);
    return { success: false, error: "DLQ kayıtları yüklenemedi." };
  }
}

/**
 * Tek bir DLQ olayını yeniden iletir (Replay)
 */
export async function replayDeadLetterEvent(dlqId: string) {
  try {
    const dlq = await prisma.deadLetterQueue.findUnique({
      where: { id: dlqId },
    });

    if (!dlq) {
      return { success: false, error: "DLQ kaydı bulunamadı." };
    }

    // Webhook olayını tekrar dene
    const result = await deliverWebhookEvent(dlq.eventId);

    // Başarılı olduysa DLQ kaydından kaldır
    if (result.success) {
      await prisma.deadLetterQueue.delete({
        where: { id: dlqId },
      });
    }

    revalidatePath("/dlq");
    revalidatePath("/");
    return { success: true, result };
  } catch (error: any) {
    console.error("replayDeadLetterEvent error:", error);
    return { success: false, error: error.message || "Yeniden iletim başarısız oldu." };
  }
}

/**
 * DLQ kaydını arayüzden siler
 */
export async function deleteDeadLetterEvent(dlqId: string) {
  try {
    await prisma.deadLetterQueue.delete({
      where: { id: dlqId },
    });

    revalidatePath("/dlq");
    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    console.error("deleteDeadLetterEvent error:", error);
    return { success: false, error: "DLQ kaydı silinemedi." };
  }
}
