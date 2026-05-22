import { useEffect } from "react";
import { toast } from "sonner";

export function ToastNotifier() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const msg = params.get("toast");
    const type = params.get("toastType") || "success";

    if (msg) {
      const fn =
        type === "error"
          ? toast.error
          : type === "warning"
          ? toast.warning
          : type === "info"
          ? toast.info
          : toast.success;
      fn(decodeURIComponent(msg));

      params.delete("toast");
      params.delete("toastType");
      const next = params.toString();
      const url =
        window.location.pathname + (next ? `?${next}` : "") + window.location.hash;
      window.history.replaceState({}, "", url);
    }
  }, []);

  return null;
}
