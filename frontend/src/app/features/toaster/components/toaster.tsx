"use client";

import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "./toast";
import { useToast } from "@/app/features/toaster/hooks/useToast";

export function Toaster() {
  const { toasts } = useToast();

  return (
    <ToastProvider>
      {toasts.map(
        ({ id, title, description, action, icon, position, ...props }) => (
          <Toast key={id} {...props}>
            <div className="flex">
              {icon && <div className="mr-3 mt-0.5">{icon}</div>}
              <div className="grid gap-1">
                {title && <ToastTitle>{title}</ToastTitle>}
                {description && (
                  <ToastDescription>{description}</ToastDescription>
                )}
              </div>
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      )}
      <ToastViewport
        className="fixed flex flex-col gap-2 p-4 sm:max-w-[420px]"
        position={toasts[0]?.position || "bottom-right"}
      />
    </ToastProvider>
  );
}
