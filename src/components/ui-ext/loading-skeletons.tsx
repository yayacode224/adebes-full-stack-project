import { Container } from "@/components/layout/container";
import { Skeleton } from "@/components/ui/skeleton";

/** Squelette du hero, aux mêmes dimensions que le hero réel : pas de saut de mise en page. */
export function HeroSkeleton() {
  return (
    <div className="-mt-16 flex min-h-[19rem] items-end bg-muted pb-10 pt-28 sm:min-h-[22rem] lg:-mt-20 lg:min-h-[26rem] lg:pb-14 lg:pt-36">
      <Container size="wide">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="mt-4 h-9 w-full max-w-xl" />
        <Skeleton className="mt-3 h-4 w-full max-w-md" />
      </Container>
    </div>
  );
}

export function CardGridSkeleton({
  count = 6,
  ratio = "aspect-[4/3]",
}: {
  count?: number;
  ratio?: string;
}) {
  return (
    <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, index) => (
        <li
          key={index}
          className="overflow-hidden rounded-2xl border border-border"
        >
          <Skeleton className={`${ratio} w-full rounded-none`} />
          <div className="flex flex-col gap-3 p-5">
            <Skeleton className="size-10 rounded-xl" />
            <Skeleton className="h-5 w-4/5" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </li>
      ))}
    </ul>
  );
}

export function TextBlockSkeleton({ lines = 5 }: { lines?: number }) {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          className="h-4"
          style={{ width: index === lines - 1 ? "60%" : "100%" }}
        />
      ))}
    </div>
  );
}
