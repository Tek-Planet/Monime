import { cn } from "@/lib/utils"

interface LeCurrencyProps {
  className?: string
}

export function LeCurrency({ className }: LeCurrencyProps) {
  return (
    <span className={cn("font-semibold text-sm", className)}>Le</span>
  )
}
