import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Lock, LogOut } from 'lucide-react';

export default function ImpersonationBanner() {
  const { isImpersonating, auditedFirmName, stopImpersonation } = useAuth();

  if (!isImpersonating) return null;

  return (
    <div className="sticky top-0 z-[90] bg-amber-500 text-slate-950 px-4 py-2.5 flex items-center justify-between font-bold text-xs shadow-md border-b border-amber-600">
      <div className="flex items-center gap-2">
        <Lock className="w-4 h-4 animate-pulse text-slate-950" />
        <span>
          SUPER ADMIN IMPERSONATION MODE: Viewing <span className="underline font-black">"{auditedFirmName}"</span> (Audit Mode • View-Only • Changes Locked)
        </span>
      </div>
      <button
        onClick={stopImpersonation}
        className="px-3.5 py-1.5 bg-slate-950 hover:bg-slate-800 text-white rounded-xl text-xs font-black shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
      >
        <LogOut className="w-3.5 h-3.5" />
        Exit Impersonation ✕
      </button>
    </div>
  );
}
