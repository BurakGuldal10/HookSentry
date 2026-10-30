import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyWebhookSignature } from "@/lib/crypto";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now();
  const { id: endpointId } = await params;

  try {
    // 1. Endpoint kontrolü
    const endpoint = await prisma.endpoint.findUnique({
      where: { id: endpointId },
    });

    if (!endpoint) {
      return NextResponse.json(
        { error: "Endpoint bulunamadı." },
        { status: 404 }
      );
    }

    if (endpoint.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "Endpoint aktif değil veya duraklatılmış." },
        { status: 403 }
      );
    }

    // 2. Raw Body ve Header'ları alma
    const rawBody = await request.text();
    if (!rawBody || rawBody.length === 0) {
      return NextResponse.json(
        { error: "İstek gövdesi (payload) boş olamaz." },
        { status: 400 }
      );
    }

    // Maksimum payload boyutu koruması: 2MB (DoS koruması)
    if (rawBody.length > 2 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Payload çok büyük. Maksimum 2MB desteklenir." },
        { status: 413 }
      );
    }

    // Header'ları ayıklama
    const headersObj: Record<string, string> = {};
    request.headers.forEach((value, key) => {
      headersObj[key.toLowerCase()] = value;
    });

    // Yaygın imza header'ları (Stripe: stripe-signature, GitHub: x-hub-signature-256, Generic: x-signature)
    const signatureHeader =
      headersObj["stripe-signature"] ||
      headersObj["x-signature"] ||
      headersObj["x-hub-signature-256"] ||
      headersObj["x-webhook-signature"] ||
      "";

    // Olay tipi tespiti
    let eventType = "webhook.incoming";
    try {
      const parsed = JSON.parse(rawBody);
      if (parsed.type) eventType = parsed.type;
      else if (parsed.event) eventType = parsed.event;
      else if (parsed.action) eventType = parsed.action;
    } catch {
      // JSON değilse ham metin olarak kalır
    }

    // 3. İsteğe Bağlı İmza Doğrulama Kontrolü (Secret tanımlıysa)
    let isSignatureValid = false;
    if (signatureHeader && endpoint.secretKey) {
      const verifyResult = verifyWebhookSignature(
        rawBody,
        signatureHeader,
        endpoint.secretKey
      );
      isSignatureValid = verifyResult.isValid;
    }

    // 4. WebhookEvent Kaydı
    const newEvent = await prisma.webhookEvent.create({
      data: {
        endpointId: endpoint.id,
        eventType,
        payload: rawBody,
        headers: JSON.stringify(headersObj),
        status: "PENDING",
      },
    });

    const durationMs = Date.now() - startTime;

    return NextResponse.json(
      {
        success: true,
        message: "Webhook başarıyla teslim alındı ve kuyruğa eklendi.",
        eventId: newEvent.id,
        isVerified: isSignatureValid,
        durationMs,
      },
      { status: 202 }
    );
  } catch (error: any) {
    console.error("Ingest API Error:", error);
    return NextResponse.json(
      { error: "Dahili sunucu hatası.", details: error.message },
      { status: 500 }
    );
  }
}
