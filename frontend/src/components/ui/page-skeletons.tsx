import { Skeleton } from "@/components/ui/skeleton";
import { Container } from "@/components/layout/container";

export function CatalogGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <Container className="py-10">
      <Skeleton className="h-8 w-48" />
      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: count }).map((_, index) => (
          <div key={index} className="space-y-3">
            <Skeleton className="aspect-[4/3] w-full rounded-lg" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/3" />
          </div>
        ))}
      </div>
    </Container>
  );
}

export function CheckoutPageSkeleton() {
  return (
    <Container className="py-10">
      <Skeleton className="h-8 w-40" />
      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4">
          <Skeleton className="h-6 w-36" />
          <Skeleton className="h-28 w-full rounded-lg" />
          <Skeleton className="h-28 w-full rounded-lg" />
          <Skeleton className="h-10 w-40" />
        </div>
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    </Container>
  );
}

export function CartPageSkeleton() {
  return (
    <Container className="py-10">
      <Skeleton className="h-8 w-32" />
      <div className="mt-8 space-y-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="flex gap-4">
            <Skeleton className="size-20 shrink-0 rounded-md" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-4 w-1/4" />
            </div>
          </div>
        ))}
      </div>
    </Container>
  );
}

export function AdminTableSkeleton() {
  return (
    <div className="mx-auto w-full max-w-screen-2xl space-y-4 px-4 py-8 sm:px-6 lg:px-8">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-10 w-full max-w-md" />
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className="h-12 w-full" />
        ))}
      </div>
    </div>
  );
}
