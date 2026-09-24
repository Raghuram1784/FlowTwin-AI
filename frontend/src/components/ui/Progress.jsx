import * as React from "react"
import { cn } from "./Button"
import { motion } from "framer-motion"

function Progress({ value = 0, max = 100, className, indicatorClassName, color = "primary" }) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100))

  const colorMap = {
    primary: "bg-primary",
    teal: "bg-teal-500",
    amber: "bg-amber-500",
    rose: "bg-rose-500",
    emerald: "bg-emerald-500",
    destructive: "bg-destructive",
  }

  return (
    <div
      role="progressbar"
      aria-valuenow={value}
      aria-valuemax={max}
      className={cn(
        "relative h-2 w-full overflow-hidden rounded-full bg-secondary",
        className
      )}
    >
      <motion.div
        className={cn("h-full rounded-full transition-all", colorMap[color] || "bg-primary", indicatorClassName)}
        initial={{ width: 0 }}
        animate={{ width: `${percentage}%` }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      />
    </div>
  )
}

export { Progress }
