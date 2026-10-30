import crypto from "crypto";

/**
 * Yeni bir webhook imza gizli anahtarı üretir (whsec_...)
 * 24 byte (192-bit) CSPRNG entropisi sunar.
 */
export function generateSecretKey(): string {
  const randomBytes = crypto.randomBytes(24).toString("hex");
  return `whsec_${randomBytes}`;
}

/**
 * Payload ve secret kullanarak Stripe standardında HMAC-SHA256 imzası üretir.
 * Format: t={timestamp},v1={hash}
 */
export function signWebhookPayload(payload: string, secret: string, timestamp?: number): {
  signature: string;
  timestamp: number;
} {
  const ts = timestamp || Math.floor(Date.now() / 1000);
  const cleanSecret = secret.startsWith("whsec_") ? secret.replace("whsec_", "") : secret;
  const signaturePayload = `${ts}.${payload}`;
  
  const hash = crypto
    .createHmac("sha256", cleanSecret)
    .update(signaturePayload)
    .digest("hex");

  return {
    signature: `t=${ts},v1=${hash}`,
    timestamp: ts,
  };
}

/**
 * Gelen webhook imzasını timing attack'lara karşı güvenli (timingSafeEqual) şekilde doğrular.
 */
export function verifyWebhookSignature(
  payload: string,
  signatureHeader: string,
  secret: string,
  toleranceSeconds: number = 300
): { isValid: boolean; error?: string } {
  try {
    if (!signatureHeader || !secret) {
      return { isValid: false, error: "İmza header'ı veya secret key eksik." };
    }

    // Format çözümleme: t=123456789,v1=abcdef...
    const parts = signatureHeader.split(",");
    let timestamp: number | null = null;
    let signatureHash: string | null = null;

    for (const part of parts) {
      const [key, value] = part.split("=");
      if (key === "t") timestamp = parseInt(value, 10);
      if (key === "v1") signatureHash = value;
    }

    if (!timestamp || !signatureHash) {
      return { isValid: false, error: "Geçersiz imza header formatı." };
    }

    // Zaman aşımı kontrolü (Replay attack önlemi)
    const currentTimestamp = Math.floor(Date.now() / 1000);
    if (Math.abs(currentTimestamp - timestamp) > toleranceSeconds) {
      return { isValid: false, error: "Zaman aşımı: İmza süresi tolerans dışı (Replay Attack riski)." };
    }

    // Beklenen hash hesabı
    const cleanSecret = secret.startsWith("whsec_") ? secret.replace("whsec_", "") : secret;
    const signaturePayload = `${timestamp}.${payload}`;
    const expectedHash = crypto
      .createHmac("sha256", cleanSecret)
      .update(signaturePayload)
      .digest("hex");

    // Timing-Safe Equal ile sabit sürede karşılaştırma (Timing Attack Kalkanı)
    const expectedBuffer = Buffer.from(expectedHash, "utf8");
    const actualBuffer = Buffer.from(signatureHash, "utf8");

    if (expectedBuffer.length !== actualBuffer.length) {
      return { isValid: false, error: "İmza uyuşmuyor." };
    }

    const isMatch = crypto.timingSafeEqual(expectedBuffer, actualBuffer);
    return isMatch ? { isValid: true } : { isValid: false, error: "İmza doğrulaması başarısız." };
  } catch {
    return { isValid: false, error: "İmza doğrulama hatası." };
  }
}

/**
 * Üstel geri çekilme (Exponential Backoff with Full Jitter) hesaplar
 * delay = min(maxInterval, initialInterval * 2^(attempt - 1)) + jitter
 */
export function calculateBackoffMs(
  attempt: number,
  initialIntervalMs: number = 1000,
  maxIntervalMs: number = 300000 // 5 dakika max
): number {
  const exponential = initialIntervalMs * Math.pow(2, Math.max(0, attempt - 1));
  const capped = Math.min(exponential, maxIntervalMs);
  const jitter = Math.random() * (capped * 0.1); // %10 rastgele jitter
  return Math.floor(capped + jitter);
}
