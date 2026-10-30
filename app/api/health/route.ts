import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const startTime = Date.now();
    // Veritabanı sorgusu ile sağlık kontrolü
    const endpointCount = await prisma.endpoint.count();
    const eventCount = await prisma.webhookEvent.count();
    const dlqCount = await prisma.deadLetterQueue.count();
    const dbLatencyMs = Date.now() - startTime;

    return NextResponse.json(
      {
        status: "healthy",
        service: "HookSentry Webhook Gateway",
        version: "1.0.0",
        timestamp: new Date().toISOString(),
        database: {
          connected: true,
          latencyMs: dbLatencyMs,
          endpoints: endpointCount,
          totalEvents: eventCount,
          deadLetterEvents: dlqCount,
        },
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        status: "unhealthy",
        service: "HookSentry Webhook Gateway",
        error: error.message || "Database connection failed",
      },
      { status: 503 }
    );
  }
}
