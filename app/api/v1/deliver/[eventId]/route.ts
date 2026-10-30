import { NextRequest, NextResponse } from "next/server";
import { deliverWebhookEvent } from "@/lib/dispatcher";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const { eventId } = await params;

  try {
    const result = await deliverWebhookEvent(eventId);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "İletim sırasında hata oluştu." },
      { status: 500 }
    );
  }
}
