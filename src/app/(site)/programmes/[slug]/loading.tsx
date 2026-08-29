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
      <section className="py-14 lg:py-20">
        <Container size="wide">
          <div className="grid gap-10 lg:grid-cols-12 lg:gap-14">
            <div className="lg:col-span-7">
              <Skeleton className="h-8 w-64" />
              <div className="mt-6 flex flex-col gap-3">
                {Array.from({ length: 4 }).map((_, index) => (
                  <Skeleton key={index} className="h-16 w-full rounded-xl" />
                ))}
              </div>
            </div>
            <div className="lg:col-span-5">
              <div className="rounded-2xl border border-border p-6">
                <Skeleton className="size-11 rounded-xl" />
                <div className="mt-4">
                  <TextBlockSkeleton lines={4} />
                </div>
                <Skeleton className="mt-6 h-11 w-full rounded-lg" />
              </div>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
