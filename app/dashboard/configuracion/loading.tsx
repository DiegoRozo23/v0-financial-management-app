import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-48 mt-2" />
      </div>

      <Skeleton className="h-10 w-64" />

      <Skeleton className="h-[600px]" />
    </div>
  )
}
