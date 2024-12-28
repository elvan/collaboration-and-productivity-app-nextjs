import { toast as sonnerToast } from "sonner"

interface ToastOptions {
  duration?: number
  position?: "top-right" | "top-center" | "top-left" | "bottom-right" | "bottom-center" | "bottom-left"
}

const defaultOptions: ToastOptions = {
  duration: 3000,
  position: "top-right",
}

const toast = {
  success: (message: string, options?: ToastOptions) => {
    sonnerToast.success(message, { ...defaultOptions, ...options })
  },
  error: (message: string, options?: ToastOptions) => {
    sonnerToast.error(message, { ...defaultOptions, ...options })
  },
  info: (message: string, options?: ToastOptions) => {
    sonnerToast.info(message, { ...defaultOptions, ...options })
  },
  warning: (message: string, options?: ToastOptions) => {
    sonnerToast.warning(message, { ...defaultOptions, ...options })
  },
}

export default toast
