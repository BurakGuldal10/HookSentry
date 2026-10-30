"use client";

import { useState } from "react";
import { Key, Copy, Check, Trash2, Power, ExternalLink, Activity, AlertCircle } from "lucide-react";
import { deleteEndpoint, updateEndpoint } from "@/app/actions/endpoints";
import { useRouter } from "next/navigation";

export function EndpointCard({ endpoint }: { endpoint: any }) {
  const [copied, setCopied] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const isPaused = endpoint.status === "PAUSED";
  const isInactive = endpoint.status === "INACTIVE";

  function copySecret() {
    navigator.clipboard.writeText(endpoint.secretKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleToggleStatus() {
    setLoading(true);
    const nextStatus = endpoint.status === "ACTIVE" ? "PAUSED" : "ACTIVE";
    await updateEndpoint({ id: endpoint.id, status: nextStatus });
    setLoading(false);
    router.refresh();
  }

  async function handleDelete() {
    if (confirm(`'${endpoint.name}' endpointini silmek istediğinize emin misiniz?`)) {
      setLoading(true);
      await deleteEndpoint(endpoint.id);
      setLoading(false);
      router.refresh();
    }
  }

  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 hover:border-slate-700/80 transition-all duration-200 shadow-sm flex flex-col justify-between group">
      <div>
        {/* Başlık ve Durum */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <div className="flex items-center gap-2">
              <span
                className={`h-2.5 w-2.5 rounded-full ${
                  endpoint.status === "ACTIVE"
                    ? "bg-emerald-400 ring-4 ring-emerald-500/10"
                    : endpoint.status === "PAUSED"
                    ? "bg-amber-400 ring-4 ring-amber-500/10"
                    : "bg-slate-500"
                }`}
              />
              <h3 className="font-semibold text-white text-base group-hover:text-indigo-300 transition-colors">
                {endpoint.name}
              </h3>
            </div>
            {endpoint.description && (
              <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                {endpoint.description}
              </p>
            )}
          </div>

          <span
            className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-md font-semibold tracking-wider ${
              endpoint.status === "ACTIVE"
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                : endpoint.status === "PAUSED"
                ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                : "bg-slate-800 text-slate-400 border border-slate-700"
            }`}
          >
            {endpoint.status}
          </span>
        </div>

        {/* Hedef URL */}
        <div className="bg-slate-950/80 rounded-xl px-3 py-2 border border-slate-800/80 my-3 flex items-center justify-between gap-2">
          <code className="text-xs text-indigo-300 font-mono truncate">
            {endpoint.url}
          </code>
          <a
            href={endpoint.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-500 hover:text-slate-300 transition-colors"
            title="Harici bağlantıyı aç"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>

        {/* Secret Anahtarı */}
        <div className="bg-slate-950/40 rounded-xl p-2.5 border border-slate-800/50 mb-4 text-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="flex items-center gap-1.5 text-[11px] font-medium">
              <Key className="h-3 w-3 text-indigo-400" />
              HMAC Secret Key
            </span>
            <button
              onClick={() => setShowSecret(!showSecret)}
              className="text-[10px] text-indigo-400 hover:underline"
            >
              {showSecret ? "Gizle" : "Göster"}
            </button>
          </div>
          <div className="flex items-center justify-between gap-2 font-mono text-[11px]">
            <span className="text-slate-300 truncate">
              {showSecret ? endpoint.secretKey : `${endpoint.secretKey.slice(0, 8)}••••••••••••••••`}
            </span>
            <button
              onClick={copySecret}
              className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors"
              title="Kopyala"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>

        {/* Parametre Metrikleri */}
        <div className="grid grid-cols-3 gap-2 py-2 border-t border-b border-slate-800/60 text-center">
          <div>
            <div className="text-[10px] text-slate-500 uppercase font-mono">Limit</div>
            <div className="text-xs font-semibold text-slate-200 mt-0.5">{endpoint.rateLimitPerMin}/dk</div>
          </div>
          <div>
            <div className="text-[10px] text-slate-500 uppercase font-mono">Timeout</div>
            <div className="text-xs font-semibold text-slate-200 mt-0.5">{endpoint.timeoutMs}ms</div>
          </div>
          <div>
            <div className="text-[10px] text-slate-500 uppercase font-mono">Max Retry</div>
            <div className="text-xs font-semibold text-slate-200 mt-0.5">{endpoint.maxRetries}x</div>
          </div>
        </div>

        {/* Sayaçlar */}
        <div className="flex items-center justify-between text-xs text-slate-400 pt-3">
          <div className="flex items-center gap-1.5">
            <Activity className="h-3.5 w-3.5 text-indigo-400" />
            <span>Olaylar: <strong className="text-white">{endpoint._count?.events || 0}</strong></span>
          </div>
          <div className="flex items-center gap-1.5">
            <AlertCircle className="h-3.5 w-3.5 text-rose-400" />
            <span>DLQ: <strong className="text-rose-400">{endpoint._count?.deadLetterEvents || 0}</strong></span>
          </div>
        </div>
      </div>

      {/* Aksiyon Butonları */}
      <div className="flex items-center justify-end gap-2 pt-4 mt-2 border-t border-slate-800/40">
        <button
          onClick={handleToggleStatus}
          disabled={loading}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
            endpoint.status === "ACTIVE"
              ? "text-amber-400 hover:bg-amber-500/10 border border-amber-500/20"
              : "text-emerald-400 hover:bg-emerald-500/10 border border-emerald-500/20"
          }`}
        >
          <Power className="h-3 w-3" />
          {endpoint.status === "ACTIVE" ? "Durdur" : "Etkinleştir"}
        </button>

        <button
          onClick={handleDelete}
          disabled={loading}
          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors border border-transparent hover:border-rose-500/20"
          title="Endpoint'i Sil"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
