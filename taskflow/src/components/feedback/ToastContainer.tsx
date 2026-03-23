import { useToastStore } from "@/stores/toast-store";

export function ToastContainer() {
  const toasts = useToastStore(state => state.toasts);
  const removeToast = useToastStore(state => state.removeToast);

  return (
    <div className="fixed bottom-4 right-4 space-y-2 z-50">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`px-4 py-3 rounded-lg shadow-lg text-white ${
            toast.type === 'success' ? 'bg-green-500' :
            toast.type === 'error' ? 'bg-red-500' : 'bg-blue-500'
          }`}
        >
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm">{toast.message}</p>
            <button onClick={() => removeToast(toast.id)} className="text-white/80 hover:text-white">
              ×
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}