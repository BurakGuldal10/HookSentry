"use client";

import { useState } from "react";
import { Plus, X, Globe, Shield, RefreshCw, Clock } from "lucide-react";
import { createEndpoint } from "@/app/actions/endpoints";

export function EndpointModal({
  isOpen,
  onClose,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    url: "",
    description: "",
    rateLimitPerMin: 60,
    timeoutMs: 5000,
    maxRetries: 5,
  });

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await createEndpoint({
      name: formData.name,
      url: formData.url,
      description: formData.description,
      rateLimitPerMin: Number(formData.rateLimitPerMin),
      timeoutMs: Number(formData.timeoutMs),
      maxRetries: Number(formData.maxRetries),
    });

    setLoading(false);

    if (res.success) {
      onSuccess();
      onClose();
    } else {
      setError(res.error || "Endpoint kaydedilirken hata oluştu.");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-indigo-400" />
            <h2 className="text-base font-semibold text-white">Yeni Webhook Endpoint Tanımla</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 text-sm text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-xl">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Endpoint İsmi *
            </label>
            <input
              type="text"
              required
              placeholder="Örn: Stripe Ödeme Gateway veya Sipariş Senkronu"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Hedef URL (Webhook Target) *
            </label>
            <input
              type="url"
              required
              placeholder="https://api.domain.com/v1/webhooks"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm font-mono text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
              value={formData.url}
              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Açıklama (Opsiyonel)
            </label>
            <textarea
              rows={2}
              placeholder="Bu uç noktanın görevini veya bağlı olduğu servisi açıklayın..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all resize-none"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-3 gap-3 pt-2">
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1 flex items-center gap-1">
                <Clock className="h-3 w-3 text-slate-500" />
                Limit (Req/Dk)
              </label>
              <input
                type="number"
                min="1"
                max="6000"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                value={formData.rateLimitPerMin}
                onChange={(e) => setFormData({ ...formData, rateLimitPerMin: Number(e.target.value) })}
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1 flex items-center gap-1">
                <Shield className="h-3 w-3 text-slate-500" />
                Timeout (ms)
              </label>
              <input
                type="number"
                min="500"
                max="60000"
                step="500"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                value={formData.timeoutMs}
                onChange={(e) => setFormData({ ...formData, timeoutMs: Number(e.target.value) })}
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1 flex items-center gap-1">
                <RefreshCw className="h-3 w-3 text-slate-500" />
                Maks Tekrar
              </label>
              <input
                type="number"
                min="0"
                max="10"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                value={formData.maxRetries}
                onChange={(e) => setFormData({ ...formData, maxRetries: Number(e.target.value) })}
              />
            </div>
          </div>

          <p className="text-[11px] text-slate-500 leading-relaxed pt-1">
            * Kayıt tamamlandığında bu uç nokta için güvenli SHA-256 HMAC Secret anahtarı otomatik üretilecektir.
          </p>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white transition-colors"
            >
              Vazgeç
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50"
            >
              {loading ? "Kaydediliyor..." : "Endpoint'i Kaydet"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
