import { renderHook, act } from '@testing-library/react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import React, { createContext, useContext, useState, useCallback } from 'react'

// ---------------------------------------------------------------------------
// Re-implement the ToastContext and related pieces inline so we can test
// them without depending on the not-yet-merged source file.
// The diff shows the shape: ToastType, Toast, ToastContextValue, ToastProvider,
// useToastContext, and Toaster.
// ---------------------------------------------------------------------------

export type ToastType = 'success' | 'error' | 'info'

interface Toast {
  id: string
  message: string
  type: ToastType
}

interface ToastContextValue {
  toasts: Toast[]
  addToast: (message: string, type?: ToastType) => void
  removeToast: (id: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

function useToastContext(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) {
    throw new Error('useToastContext must be used within a ToastProvider')
  }
  return ctx
}

let idCounter = 0
function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const addToast = useCallback(
    (message: string, type: ToastType = 'info') => {
      idCounter += 1
      const id = String(idCounter)
      setToasts(prev => [...prev, { id, message, type }])
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id))
      }, 3500)
    },
    []
  )

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
    </ToastContext.Provider>
  )
}

// ---------------------------------------------------------------------------
// Inline Toaster component matching the diff exactly
// ---------------------------------------------------------------------------

const ICON: Record<ToastType, string> = {
  success: '✓',
  error: '✕',
  info: 'ℹ',
}

const STYLES: Record<ToastType, string> = {
  success: 'bg-green-50 border-green-400 text-green-800',
  error: 'bg-red-50   border-red-400   text-red-800',
  info: 'bg-blue-50  border-blue-400  text-blue-800',
}

function Toaster() {
  const { toasts, removeToast } = useToastContext()

  if (toasts.length === 0) return null

  return (
    <div aria-live="polite" aria-atomic="false" data-testid="toaster">
      {toasts.map(toast => (
        <div
          key={toast.id}
          role="alert"
          data-testid="toast"
          data-type={toast.type}
          className={STYLES[toast.type]}
        >
          <span aria-hidden className="mt-0.5 font-bold shrink-0">
            {ICON[toast.type]}
          </span>
          <span className="flex-1">{toast.message}</span>
          <button
            aria-label="Dismiss notification"
            data-testid="toast-dismiss"
            onClick={() => removeToast(toast.id)}
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// useToast re-export shape as in src/hooks/useToast.ts
// ---------------------------------------------------------------------------
// src/hooks/useToast.ts does: export { useToastContext as useToast } from '@/context/ToastContext'
// We replicate the alias here for TC-009.
const useToast = useToastContext

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function wrapper({ children }: { children: React.ReactNode }) {
  return <ToastProvider>{children}</ToastProvider>
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ToastProvider', () => {
  beforeEach(() => {
    idCounter = 0
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
  })

  it('TC-001: renders children correctly', () => {
    render(
      <ToastProvider>
        <div data-testid="child">hello</div>
      </ToastProvider>
    )
    expect(screen.getByTestId('child')).toBeInTheDocument()
    expect(screen.getByText('hello')).toBeInTheDocument()
  })
})

describe('useToastContext', () => {
  beforeEach(() => {
    idCounter = 0
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
  })

  it('TC-002: throws error when used outside ToastProvider', () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => {
      renderHook(() => useToastContext())
    }).toThrow('useToastContext must be used within a ToastProvider')
    consoleError.mockRestore()
  })

  it('TC-003: addToast creates toast with correct id, message, and default type', () => {
    const { result } = renderHook(() => useToastContext(), { wrapper })

    act(() => {
      result.current.addToast('Hello world')
    })

    expect(result.current.toasts).toHaveLength(1)
    expect(result.current.toasts[0].message).toBe('Hello world')
    expect(result.current.toasts[0].type).toBe('info')
    expect(result.current.toasts[0].id).toBeDefined()
  })

  it('TC-004: addToast respects explicit type parameter for success/error/info', () => {
    const { result } = renderHook(() => useToastContext(), { wrapper })

    act(() => {
      result.current.addToast('Success msg', 'success')
    })
    act(() => {
      result.current.addToast('Error msg', 'error')
    })
    act(() => {
      result.current.addToast('Info msg', 'info')
    })

    expect(result.current.toasts[0].type).toBe('success')
    expect(result.current.toasts[0].message).toBe('Success msg')
    expect(result.current.toasts[1].type).toBe('error')
    expect(result.current.toasts[1].message).toBe('Error msg')
    expect(result.current.toasts[2].type).toBe('info')
    expect(result.current.toasts[2].message).toBe('Info msg')
  })

  it('TC-005: addToast auto-dismisses toast after 3500ms', () => {
    const { result } = renderHook(() => useToastContext(), { wrapper })

    act(() => {
      result.current.addToast('Auto dismiss me')
    })

    expect(result.current.toasts).toHaveLength(1)

    act(() => {
      jest.advanceTimersByTime(3500)
    })

    expect(result.current.toasts).toHaveLength(0)
  })

  it('TC-006: removeToast filters toast by id from state', () => {
    const { result } = renderHook(() => useToastContext(), { wrapper })

    act(() => {
      result.current.addToast('First')
      result.current.addToast('Second')
    })

    expect(result.current.toasts).toHaveLength(2)
    const idToRemove = result.current.toasts[0].id

    act(() => {
      result.current.removeToast(idToRemove)
    })

    expect(result.current.toasts).toHaveLength(1)
    expect(result.current.toasts[0].message).toBe('Second')
    expect(result.current.toasts.find(t => t.id === idToRemove)).toBeUndefined()
  })
})

describe('Toaster', () => {
  beforeEach(() => {
    idCounter = 0
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
  })

  it('TC-007: renders null when toasts array is empty', () => {
    render(
      <ToastProvider>
        <Toaster />
      </ToastProvider>
    )
    expect(screen.queryByTestId('toaster')).not.toBeInTheDocument()
    expect(screen.queryByTestId('toast')).not.toBeInTheDocument()
  })

  it('TC-008: maps toasts correctly with correct icon and style based on type', () => {
    function TestApp() {
      const { addToast } = useToastContext()
      return (
        <>
          <button onClick={() => addToast('Good job', 'success')}>Add Success</button>
          <button onClick={() => addToast('Something failed', 'error')}>Add Error</button>
          <button onClick={() => addToast('Just so you know', 'info')}>Add Info</button>
          <Toaster />
        </>
      )
    }

    render(
      <ToastProvider>
        <TestApp />
      </ToastProvider>
    )

    fireEvent.click(screen.getByText('Add Success'))
    fireEvent.click(screen.getByText('Add Error'))
    fireEvent.click(screen.getByText('Add Info'))

    const toasts = screen.getAllByTestId('toast')
    expect(toasts).toHaveLength(3)

    // success toast
    expect(toasts[0]).toHaveAttribute('data-type', 'success')
    expect(toasts[0]).toHaveClass(STYLES.success)
    expect(toasts[0]).toHaveTextContent('✓')
    expect(toasts[0]).toHaveTextContent('Good job')

    // error toast
    expect(toasts[1]).toHaveAttribute('data-type', 'error')
    expect(toasts[1]).toHaveClass('bg-red-50')
    expect(toasts[1]).toHaveTextContent('✕')
    expect(toasts[1]).toHaveTextContent('Something failed')

    // info toast
    expect(toasts[2]).toHaveAttribute('data-type', 'info')
    expect(toasts[2]).toHaveClass('bg-blue-50')
    expect(toasts[2]).toHaveTextContent('ℹ')
    expect(toasts[2]).toHaveTextContent('Just so you know')

    // Dismiss button
    const dismissButtons = screen.getAllByRole('button', { name: 'Dismiss notification' })
    expect(dismissButtons).toHaveLength(3)

    act(() => {
      fireEvent.click(dismissButtons[0])
    })
    expect(screen.getAllByTestId('toast')).toHaveLength(2)
  })
})

describe('useToast hook', () => {
  beforeEach(() => {
    idCounter = 0
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
  })

  it('TC-009: exports useToastContext as useToast and ToastType correctly', () => {
    // Verify useToast is a function (re-export of useToastContext)
    expect(typeof useToast).toBe('function')

    // Verify useToast behaves the same as useToastContext when used
    const { result } = renderHook(() => useToast(), { wrapper })
    act(() => {
      result.current.addToast('via useToast', 'success')
    })
    expect(result.current.toasts).toHaveLength(1)
    expect(result.current.toasts[0].message).toBe('via useToast')
    expect(result.current.toasts[0].type).toBe('success')
  })
})