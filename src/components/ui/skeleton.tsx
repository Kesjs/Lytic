import { cn } from "~/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-ink-muted/10", className)}
      {...props}
    />
  )
}

export { Skeleton }
