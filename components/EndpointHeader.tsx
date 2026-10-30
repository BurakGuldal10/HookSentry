"use client";

import Link from "next/link";
import { Plus, Database, AlertOctagon } from "lucide-react";
import { seedDemoData } from "@/app/actions/endpoints";
import { useState } from "react";

export function EndpointHeader({
  endpointCount,
  onOpenModal,
}: {
  endpointCount?: number;
  onOpenModal?: () => void;
}) {
  const [loading, setLoading] = useState(false);

  const handleSeed = async () => {
    setLoading(true);
    try {
      const res = await seedDemoData();
      if (!res.success && res.message) {
        alert(res.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-white flex items-center space-x-2">
          <span>Uç Noktalar (Endpoints)</span>
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          Webhook'ların dinlendiği, HMAC ile imzalanıp hedef sisteminize aktarıldığı aktif hatlar.
        </p>
      </div>

      <div className="flex items-center space-x-3 w-full sm:w-auto">
        <Link
          href="/dlq"
          className="flex-1 sm:flex-none flex items-center justify-center space-x-2 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 border border-rose-500/30 hover:border-rose-500/60 text-rose-400 rounded-lg text-sm font-medium transition-colors"
        >
          <AlertOctagon className="w-4 h-4" />
          <span>DLQ Havuzu</span>
        </Link>

        <button
          onClick={handleSeed}
          disabled={loading}
          className="flex-1 sm:flex-none flex items-center justify-center space-x-2 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-sm font-medium text-slate-300 transition-colors disabled:opacity-50"
        >
          <Database className="w-4 h-4 text-indigo-400" />
          <span>{loading ? "Yükleniyor..." : "Demo Yükle"}</span>
        </button>

        <button
          onClick={onOpenModal}
          className="flex-1 sm:flex-none flex items-center justify-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-semibold transition-colors shadow-lg shadow-indigo-500/20"
        >
          <Plus className="w-4 h-4" />
          <span>Yeni Endpoint</span>
        </button>
      </div>
    </div>
  );
}
