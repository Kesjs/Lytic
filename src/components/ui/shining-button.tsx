import * as React from "react"
import { cn } from "~/lib/utils"

const ShiningButton = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, children, ...props }, ref) => {
  return (
    <button
      ref={ref}
      className={cn(
        "group relative inline-flex items-center justify-center overflow-hidden rounded-md border border-brand/30 bg-brand/5 px-4 py-2 text-sm font-medium text-brand transition-colors hover:bg-brand/10 disabled:pointer-events-none disabled:opacity-50",
        className
      )}
      {...props}
    >
      <div className="absolute inset-0 flex h-full w-full justify-center [transform:skew(-12deg)_translateX(-150%)] group-hover:duration-1000 group-hover:[transform:skew(-12deg)_translateX(150%)]">
        <div className="relative h-full w-8 bg-brand/20 blur" />
      </div>
      <span className="relative flex items-center gap-2">{children}</span>
    </button>
  )
})
ShiningButton.displayName = "ShiningButton"

export { ShiningButton }
