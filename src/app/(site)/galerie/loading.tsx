import { Container } from "@/components/layout/container";
import { Skeleton } from "@/components/ui/skeleton";
import { HeroSkeleton } from "@/components/ui-ext/loading-skeletons";

export default function Loading() {
  return (
    <>
      <HeroSkeleton />
      <section className="py-14 lg:py-20">
        <Container size="wide">
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className="h-9 w-28 rounded-lg" />
            ))}
          </div>

          <ul className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <li key={index}>
                <Skeleton className="aspect-square w-full rounded-xl" />
              </li>
            ))}
          </ul>
        </Container>
      </section>
    </>
  );
}
