"use client";

import { useState } from "react";
import { replayDeadLetterEvent, deleteDeadLetterEvent } from "@/app/actions/dlq";
import { RefreshCw, Trash2, CheckCircle, Code, Clock } from "lucide-react";

export function DlqTable({ items }: { items: any[] }) {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [selectedPayload, setSelectedPayload] = useState<string | null>(null);

  const handleReplay = async (id: string) => {
    setLoadingId(id);
    try {
      const res = await replayDeadLetterEvent(id);
      if (res.success) {
        alert("Webhook başarıyla yeniden iletildi ve DLQ havuzundan kaldırıldı!");
      } else {
        alert("Yeniden deneme başarısız oldu: " + res.error);
      }
    } finally {
      setLoadingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bu DLQ kaydını silmek istediğinize emin misiniz?")) return;
    setLoadingId(id);
    try {
      await deleteDeadLetterEvent(id);
    } finally {
      setLoadingId(null);
    }
  };

  if (items.length === 0) {
    return (
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-12 text-center">
        <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-3 opacity-90" />
        <h3 className="text-lg font-semibold text-white">Harika! DLQ Havuzu Tertemiz</h3>
        <p className="text-slate-400 text-sm mt-1 max-w-md mx-auto">
          Şu anda teslimatı başarısız olmuş veya karantinaya alınmış hiçbir webhook olayı bulunmamaktadır.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950/60 text-xs uppercase text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-6 py-4 font-semibold">Endpoint</th>
                <th className="px-6 py-4 font-semibold">Olay Tipi</th>
                <th className="px-6 py-4 font-semibold">Hata Nedeni</th>
                <th className="px-6 py-4 font-semibold">Tarih</th>
                <th className="px-6 py-4 font-semibold text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-white">{item.endpoint?.name}</div>
                    <div className="text-xs text-slate-500 font-mono truncate max-w-xs">
                      {item.endpoint?.url}
                    </div>
                  </td>
                  <td className="px-6 py-4 font-mono text-xs text-indigo-300">
                    {item.event?.eventType || "webhook.incoming"}
                  </td>
                  <td className="px-6 py-4 text-xs text-rose-400 max-w-md">
                    {item.reason}
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-400 whitespace-nowrap">
                    <div className="flex items-center space-x-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      <span>{new Date(item.archivedAt).toLocaleString("tr-TR")}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => setSelectedPayload(item.event?.payload)}
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors title='Payload Görüntüle'"
                      >
                        <Code className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleReplay(item.id)}
                        disabled={loadingId === item.id}
                        className="flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
                      >
                        <RefreshCw
                          className={`w-3.5 h-3.5 ${
                            loadingId === item.id ? "animate-spin" : ""
                          }`}
                        />
                        <span>Replay</span>
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        disabled={loadingId === item.id}
                        className="p-1.5 bg-slate-800 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payload Modal */}
      {selectedPayload && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-2xl w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-semibold text-white">Ham Webhook Payload</h3>
              <button
                onClick={() => setSelectedPayload(null)}
                className="text-slate-400 hover:text-white text-sm"
              >
                Kapat
              </button>
            </div>
            <pre className="bg-slate-950 p-4 rounded-lg font-mono text-xs text-emerald-400 overflow-x-auto max-h-96">
              {JSON.stringify(JSON.parse(selectedPayload || "{}"), null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
