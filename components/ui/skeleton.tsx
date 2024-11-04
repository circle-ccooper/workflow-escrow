import { cn } from "@/lib/utils";

const baseClasses = "animate-pulse rounded-md bg-muted" as const;

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn(baseClasses, className)} {...props} />;
}

export { Skeleton };
