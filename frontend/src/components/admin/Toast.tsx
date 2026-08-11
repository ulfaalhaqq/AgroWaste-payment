"use client";

import React, { createContext, useContext, useState, useCallback } from "react";

export type ToastType = "success" | "error" | "info";

interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
}

const ToastContext = createContext<{
  showToast: (message: string, type?: ToastType) => void;
}>({ showToast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = useCallback(
    (message: string, type: ToastType = "success") => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4000);
    },
    [],
  );

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div
        aria-live="polite"
        className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] flex flex-col items-center gap-2 pointer-events-none"
      >
        {toasts.map((toast) => (
          <ToastCard key={toast.id} {...toast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

const dotColors: Record<ToastType, string> = {
  success: "bg-emerald-400",
  error: "bg-red-400",
  info: "bg-sky-400",
};

function ToastCard({ message, type }: ToastItem) {
  return (
    <div
      role="status"
      className="flex items-center gap-3 px-5 py-3.5 bg-[#181818]/90 backdrop-blur-md border border-white/10 rounded-2xl shadow-2xl text-white pointer-events-auto max-w-md animate-fade-in"
    >
      <span
        className={`w-2.5 h-2.5 rounded-full shrink-0 ${dotColors[type]}`}
        aria-hidden="true"
      />
      <span className="text-xs font-semibold leading-relaxed tracking-wide">{message}</span>
    </div>
  );
}
