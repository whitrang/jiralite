import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const spinnerVariants = cva(
  "inline-block animate-spin rounded-full border-solid border-current border-r-transparent",
  {
    variants: {
      size: {
        sm: "h-4 w-4 border-2",
        default: "h-8 w-8 border-[3px]",
        lg: "h-12 w-12 border-[4px]",
        xl: "h-16 w-16 border-[5px]",
      },
      variant: {
        default: "text-primary",
        secondary: "text-gray-400",
        white: "text-white",
        primary: "text-purple-600",
        success: "text-green-600",
        danger: "text-red-600",
      },
    },
    defaultVariants: {
      size: "default",
      variant: "primary",
    },
  }
)

export interface SpinnerProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof spinnerVariants> {
  label?: string
}

function Spinner({
  className,
  size,
  variant,
  label,
  ...props
}: SpinnerProps) {
  return (
    <div
      role="status"
      aria-label={label || "Loading"}
      className={cn("inline-flex items-center gap-2", className)}
      {...props}
    >
      <div className={cn(spinnerVariants({ size, variant }))} />
      {label && (
        <span className="text-sm text-gray-600">{label}</span>
      )}
    </div>
  )
}

export { Spinner, spinnerVariants }

