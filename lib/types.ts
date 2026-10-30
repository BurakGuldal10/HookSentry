// HookSentry Çekirdek Tip Tanımları

export type EndpointStatus = "ACTIVE" | "INACTIVE" | "PAUSED";
export type EventStatus = "PENDING" | "PROCESSING" | "DELIVERED" | "FAILED" | "EXHAUSTED";
export type AttemptStatus = "SUCCESS" | "FAILED" | "TIMEOUT";

export interface Endpoint {
  id: string;
  name: string;
  url: string;
  description?: string | null;
  secretKey: string;
  rateLimitPerMin: number; // Dakikalık hız limiti (token bucket / sliding window)
  timeoutMs: number;       // İstek zaman aşımı (örn. 5000ms)
  maxRetries: number;      // Maksimum deneme sayısı (örn. 5)
  status: EndpointStatus;
  createdAt: Date;
  updatedAt: Date;
  _count?: {
    events: number;
    deadLetterEvents: number;
  };
}

export interface WebhookEvent {
  id: string;
  endpointId: string;
  payload: string;         // JSON string payload
  headers?: string | null; // Özel headerlar (JSON string)
  eventType: string;       // örn: 'order.created', 'payment.success'
  status: EventStatus;
  retryCount: number;
  nextRetryAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  endpoint?: Endpoint;
  attempts?: DeliveryAttempt[];
}

export interface DeliveryAttempt {
  id: string;
  eventId: string;
  endpointId: string;
  responseStatus?: number | null; // HTTP Status Code (200, 500, vb.)
  responseBody?: string | null;
  executionTimeMs: number;        // Yanıt süresi milisaniye
  status: AttemptStatus;
  errorMessage?: string | null;
  attemptNumber: number;
  createdAt: Date;
}

export interface DeadLetterQueue {
  id: string;
  eventId: string;
  endpointId: string;
  reason: string;                 // DLQ'ya düşüş nedeni ('MAX_RETRIES_EXCEEDED', 'UNREACHABLE_HOST', vb.)
  archivedAt: Date;
  event?: WebhookEvent;
  endpoint?: Endpoint;
}

// Form & Action Input Tipleri
export interface CreateEndpointInput {
  name: string;
  url: string;
  description?: string;
  rateLimitPerMin?: number;
  timeoutMs?: number;
  maxRetries?: number;
  secretKey?: string;
}

export interface UpdateEndpointInput extends Partial<CreateEndpointInput> {
  id: string;
  status?: EndpointStatus;
}
