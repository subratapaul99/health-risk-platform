import { useCallback, useState } from "react";
import { AlertCircle, CheckCircle2, X } from "lucide-react";

export function useToasts() {
  const [toasts, setToasts] = useState([]);

  const pushToast = useCallback((message, kind = "error") => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, message, kind }]);
    setTimeout(() => {
      setToasts((t) => t.filter((toast) => toast.id !== id));
    }, 5000);
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts((t) => t.filter((toast) => toast.id !== id));
  }, []);

  return { toasts, pushToast, dismissToast };
}

export function ToastStack({ toasts, onDismiss }) {
  if (!toasts.length) return null;
  return (
    <div className="toast-stack no-print">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast-${t.kind}`}>
          {t.kind === "error" ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
          <span>{t.message}</span>
          <button className="toast-close" onClick={() => onDismiss(t.id)}>
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
