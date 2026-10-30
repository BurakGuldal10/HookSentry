import Link from "next/link";
import { getDeadLetterEvents } from "@/app/actions/dlq";
import { DlqTable } from "@/components/DlqTable";
import { ArrowLeft, AlertOctagon } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DlqPage() {
  const result = await getDeadLetterEvents();
  const items = result.success ? result.data || [] : [];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Üst Navigasyon */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-5">
          <div className="flex items-center space-x-4">
            <Link
              href="/"
              className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center space-x-2">
                <AlertOctagon className="w-6 h-6 text-rose-500" />
                <h1 className="text-2xl font-bold tracking-tight text-white">
                  Dead-Letter Queue (DLQ)
                </h1>
              </div>
              <p className="text-sm text-slate-400 mt-1">
                Tüm denemeleri tükenmiş veya kritik hata almış başarısız webhook'ların karantina havuzu.
              </p>
            </div>
          </div>
          <div className="bg-rose-500/10 border border-rose-500/20 px-3.5 py-1.5 rounded-full text-xs font-semibold text-rose-400">
            {items.length} Başarısız Olay
          </div>
        </div>

        {/* DLQ Tablosu */}
        <DlqTable items={items} />
      </div>
    </div>
  );
}
