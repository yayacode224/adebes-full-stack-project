import { Container } from "@/components/layout/container";
import { Skeleton } from "@/components/ui/skeleton";
import {
  HeroSkeleton,
  TextBlockSkeleton,
} from "@/components/ui-ext/loading-skeletons";

export default function Loading() {
  return (
    <>
      <HeroSkeleton />
      <article className="py-12 lg:py-16">
        <Container size="narrow">
          <div className="flex flex-wrap gap-4 border-b border-border pb-6">
            <Skeleton className="h-6 w-24 rounded-full" />
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-6 w-28" />
          </div>
          <div className="mt-8">
            <TextBlockSkeleton lines={8} />
          </div>
        </Container>
      </article>
    </>
  );
}
