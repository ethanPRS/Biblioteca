import { Construction } from "lucide-react";

export function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center h-full w-full p-8 bg-[#F8FAFC]">
      <div className="bg-white p-12 rounded-3xl border border-neutral-100 shadow-sm flex flex-col items-center max-w-md text-center">
        <div className="w-16 h-16 bg-[#B5DBF7]/20 rounded-2xl flex items-center justify-center mb-6">
          <Construction className="w-8 h-8 text-[#2B74FF]" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2 tracking-tight">Página en construcción</h2>
        <p className="text-neutral-500 font-medium">
          Esta sección del sistema Ducky University se encuentra en desarrollo y estará disponible muy pronto.
        </p>
      </div>
    </div>
  );
}