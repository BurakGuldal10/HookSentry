"use client";

import { useState } from "react";
import { Plus, Database, Sparkles } from "lucide-react";
import { EndpointModal } from "./EndpointModal";
import { seedDemoData } from "@/app/actions/endpoints";
import { useRouter } from "next/navigation";

export function EndpointHeader({ endpointCount }: { endpointCount: number }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const router = useRouter();

  async function handleSeed() {
    setSeeding(true);
    await seedDemoData();
    setSeeding(false);
    router.refresh();
  }

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
            Webhook Hedef Uç Noktaları (Endpoints)
            <span className="text-xs bg-slate-800 text-slate-300 font-mono px-2.5 py-0.5 rounded-full border border-slate-700">
              {endpointCount} Kayıtlı
            </span>
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Gelen webhook yüklerinin iletileceği hedefleri yönetin, güvenlik anahtarlarını ve rate limit parametrelerini yapılandırın.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {endpointCount === 0 && (
            <button
              onClick={handleSeed}
              disabled={seeding}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-slate-300 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 rounded-xl transition-all disabled:opacity-50"
            >
              <Database className="h-4 w-4 text-amber-400" />
              {seeding ? "Oluşturuluyor..." : "Demo Verileri Yükle"}
            </button>
          )}

          <button
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 active:scale-95 rounded-xl shadow-lg shadow-indigo-600/25 transition-all"
          >
            <Plus className="h-4 w-4" />
            Yeni Endpoint Ekle
          </button>
        </div>
      </div>

      <EndpointModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={() => router.refresh()}
      />
    </>
  );
}
