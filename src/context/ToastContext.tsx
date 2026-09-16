import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react';

export type ToastVariant = 'success' | 'error';

export type ToastOptions = {
  message: string;
  variant?: ToastVariant;
  durationMs?: number;
};

type ToastState = {
  id: number;
  message: string;
  variant: ToastVariant;
  durationMs: number;
};

type ToastContextValue = {
  toast: ToastState | null;
  showToast: (message: string, options?: Omit<ToastOptions, 'message'>) => void;
  hideToast: () => void;
};

const DEFAULT_DURATION_MS = 4000;

const ToastContext = createContext<ToastContextValue | null>(null);

type Props = {
  children: React.ReactNode;
};

export function ToastProvider({ children }: Props) {
  const [toast, setToast] = useState<ToastState | null>(null);
  const nextIdRef = useRef(0);

  const hideToast = useCallback(() => {
    setToast(null);
  }, []);

  const showToast = useCallback(
    (message: string, options?: Omit<ToastOptions, 'message'>) => {
      nextIdRef.current += 1;
      setToast({
        id: nextIdRef.current,
        message,
        variant: options?.variant ?? 'success',
        durationMs: options?.durationMs ?? DEFAULT_DURATION_MS,
      });
    },
    []
  );

  const value = useMemo<ToastContextValue>(
    () => ({
      toast,
      showToast,
      hideToast,
    }),
    [toast, showToast, hideToast]
  );

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast debe usarse dentro de ToastProvider');
  }
  return context;
}
