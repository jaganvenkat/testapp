'use client'

import { useToastContext } from '@/context/ToastContext'
import type { ToastType } from '@/context/ToastContext'

const ICON: Record<ToastType, string> = {
  success: '✓',
  error:   '✕',
  info:    'ℹ',
}

const STYLES: Record<ToastType, string> = {
  success: 'bg-green-50 border-green-400 text-green-800',
  error:   'bg-red-50   border-red-400   text-red-800',
  info:    'bg-blue-50  border-blue-400  text-blue-800',
}

export default function Toaster() {
  const { toasts, removeToast } = useToastContext()

  if (toasts.length === 0) return null

  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      data-testid="toaster"
      className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 w-80"
    >
      {toasts.map(toast => (
        <div
          key={toast.id}
          role="alert"
          data-testid="toast"
          data-type={toast.type}
          className={`flex items-start gap-3 rounded-lg border px-4 py-3 shadow-md text-sm animate-in slide-in-from-right-4 ${STYLES[toast.type]}`}
        >
          <span aria-hidden className="mt-0.5 font-bold shrink-0">{ICON[toast.type]}</span>
          <span className="flex-1">{toast.message}</span>
          <button
            aria-label="Dismiss notification"
            data-testid="toast-dismiss"
            onClick={() => removeToast(toast.id)}
            className="shrink-0 opacity-60 hover:opacity-100 transition-opacity"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  )
}
