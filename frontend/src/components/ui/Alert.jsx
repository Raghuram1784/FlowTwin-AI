import * as React from "react"
import { cva } from "class-variance-authority"
import { cn } from "./Button"

const alertVariants = cva(
  "relative w-full rounded-2xl border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground text-xs leading-relaxed",
  {
    variants: {
      variant: {
        default: "bg-background text-foreground border-border",
        destructive:
          "border-destructive/50 text-destructive bg-destructive/10 dark:border-destructive [&>svg]:text-destructive",
        warning:
          "border-amber-500/50 text-amber-900 bg-amber-500/10 dark:text-amber-200 [&>svg]:text-amber-500",
        success:
          "border-emerald-500/50 text-emerald-900 bg-emerald-500/10 dark:text-emerald-200 [&>svg]:text-emerald-500",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const Alert = React.forwardRef(({ className, variant, ...props }, ref) => (
  <div
    ref={ref}
    role="alert"
    className={cn(alertVariants({ variant }), className)}
    {...props}
  />
))
Alert.displayName = "Alert"

const AlertTitle = React.forwardRef(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn("mb-1 font-semibold leading-none tracking-tight text-sm", className)}
    {...props}
  />
))
AlertTitle.displayName = "AlertTitle"

const AlertDescription = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-xs opacity-90 [&_p]:leading-relaxed", className)}
    {...props}
  />
))
AlertDescription.displayName = "AlertDescription"

export { Alert, AlertTitle, AlertDescription }
