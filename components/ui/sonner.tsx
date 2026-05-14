"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import { CircleCheck, Info, AlertTriangle, XCircle, Loader2 } from "lucide-react"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      richColors
      closeButton
      position="top-center"
      icons={{
        success: <CircleCheck className="size-5 text-emerald-500" />,
        info: <Info className="size-5 text-blue-500" />,
        warning: <AlertTriangle className="size-5 text-amber-500" />,
        error: <XCircle className="size-5 text-rose-500" />,
        loading: <Loader2 className="size-5 animate-spin text-primary" />,
      }}
      toastOptions={{
        classNames: {
          toast: "group toast group-[.toaster]:bg-background/80 group-[.toaster]:backdrop-blur-xl group-[.toaster]:text-foreground group-[.toaster]:border-border/50 group-[.toaster]:shadow-2xl group-[.toaster]:rounded-2xl group-[.toaster]:px-4 group-[.toaster]:py-3 group-[.toaster]:font-medium group-[.toaster]:text-sm",
          description: "group-[.toast]:text-muted-foreground group-[.toast]:text-xs group-[.toast]:font-normal",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground group-[.toast]:font-bold group-[.toast]:rounded-lg",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground group-[.toast]:font-bold group-[.toast]:rounded-lg",
          success: "group-[.toaster]:border-emerald-500/20 group-[.toaster]:bg-emerald-500/5",
          error: "group-[.toaster]:border-rose-500/20 group-[.toaster]:bg-rose-500/5",
          warning: "group-[.toaster]:border-amber-500/20 group-[.toaster]:bg-amber-500/5",
          info: "group-[.toaster]:border-blue-500/20 group-[.toaster]:bg-blue-500/5",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
