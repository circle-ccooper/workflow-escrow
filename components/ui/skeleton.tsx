import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
const baseClasses = "animate-pulse rounded-md bg-muted" as const;

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(baseClasses, className)}
      {...props}
    />
  )
}
      {...props}
    />
  )
}

export { Skeleton }
