import { Container } from "@/components/layout/container";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CardGridSkeleton,
  HeroSkeleton,
} from "@/components/ui-ext/loading-skeletons";

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
          <div className="mt-10">
            <CardGridSkeleton count={3} ratio="aspect-[3/2]" />
          </div>
        </Container>
      </section>
    </>
  );
}
