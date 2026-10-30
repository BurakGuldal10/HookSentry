import { getEndpoints } from "@/app/actions/endpoints";
import { EndpointHeader } from "@/components/EndpointHeader";
import { EndpointCard } from "@/components/EndpointCard";
import { ShieldCheck, Zap, Layers, AlertTriangle } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const result = await getEndpoints();
  const endpoints = result.success ? result.data || [] : [];

  // Toplam Metrikler
  const totalEvents = endpoints.reduce((acc, ep) => acc + (ep._count?.events || 0), 0);
  const totalDlq = endpoints.reduce((acc, ep) => acc + (ep._count?.deadLetterEvents || 0), 0);
  const activeCount = endpoints.filter((ep) => ep.status === "ACTIVE").length;

  return (
    <div className="space-y-8">
      {/* İstatistik Özet Kartları */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex items-center gap-4">
          <div className="p-3 bg-indigo-500/10 rounded-xl border border-indigo-500/20 text-indigo-400">
            <Layers className="h-6 w-6" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">Toplam Endpoint</div>
            <div className="text-2xl font-bold text-white mt-0.5">{endpoints.length}</div>
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-emerald-400">
            <Zap className="h-6 w-6" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">Aktif Endpointler</div>
            <div className="text-2xl font-bold text-emerald-400 mt-0.5">{activeCount}</div>
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex items-center gap-4">
          <div className="p-3 bg-cyan-500/10 rounded-xl border border-cyan-500/20 text-cyan-400">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">İşlenen Webhook</div>
            <div className="text-2xl font-bold text-cyan-400 mt-0.5">{totalEvents}</div>
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex items-center gap-4">
          <div className="p-3 bg-rose-500/10 rounded-xl border border-rose-500/20 text-rose-400">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">Dead Letter (DLQ)</div>
            <div className="text-2xl font-bold text-rose-400 mt-0.5">{totalDlq}</div>
          </div>
        </div>
      </div>

      {/* Endpoint Yönetim Bölümü */}
      <section className="bg-slate-900/30 border border-slate-800/80 rounded-3xl p-6 sm:p-8 backdrop-blur-sm">
        <EndpointHeader endpointCount={endpoints.length} />

        {endpoints.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="h-16 w-16 bg-slate-800/60 rounded-2xl border border-slate-700/80 mx-auto flex items-center justify-center text-slate-400 mb-4">
              <Layers className="h-8 w-8 text-indigo-400" />
            </div>
            <h3 className="text-lg font-semibold text-white">Henüz Bir Endpoint Eklenmedi</h3>
            <p className="text-slate-400 text-sm max-w-md mx-auto mt-1 mb-6">
              Sisteminizden veya harici servislerden gelen webhook bildirimlerini karşılamak ve güvenle dağıtmak için ilk hedefinizi ekleyin.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
            {endpoints.map((ep) => (
              <EndpointCard key={ep.id} endpoint={ep} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
