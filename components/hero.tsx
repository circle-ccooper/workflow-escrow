import React from "react";
import { Shield, Zap } from "lucide-react";

export default function Header() {
  return (
    <header className="relative py-16 overflow-hidden">
      {/* Background subtle gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-50 dark:to-slate-950 opacity-20" />

      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center gap-8">
          <h1 className="sr-only">Secure Transaction Platform</h1>

          {/* Main headline */}
          <div className="relative">
            <div className="flex items-center justify-center gap-4 mb-4">
              <Shield className="w-8 h-8 text-blue-500" />
              <Zap className="w-8 h-8 text-amber-500" />
            </div>
            <p className="text-4xl md:text-5xl lg:text-6xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-amber-600 !leading-tight">
              Safe Trades, Instant Release
            </p>
            <p className="mt-4 text-xl md:text-2xl text-center text-slate-600 dark:text-slate-400">
              The Modern Way to Close Deals
            </p>
          </div>

          {/* Decorative line */}
          <div className="w-full max-w-3xl">
            <div className="h-px bg-gradient-to-r from-transparent via-slate-400 dark:via-slate-600 to-transparent opacity-20" />
          </div>

          {/* Trust indicators */}
          <div className="flex flex-wrap justify-center gap-8 text-sm text-slate-600 dark:text-slate-400">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span>Bank-Grade Security</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              <span>24/7 Automated</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-amber-500" />
              <span>Instant Settlement</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
