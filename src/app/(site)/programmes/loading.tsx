import { Container } from "@/components/layout/container";
import {
  CardGridSkeleton,
  HeroSkeleton,
} from "@/components/ui-ext/loading-skeletons";

export default function Loading() {
  return (
    <>
      <HeroSkeleton />
      <section className="py-16 lg:py-24">
        <Container size="wide">
          <CardGridSkeleton count={6} />
        </Container>
      </section>
    </>
  );
}
