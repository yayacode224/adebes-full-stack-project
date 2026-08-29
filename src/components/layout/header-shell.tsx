"use client";

import { Heart, Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  conversionNav,
  hasOverlayHero,
  isActivePath,
  mainNav,
} from "@/lib/navigation";
import { contact, whatsappLink, whatsappMessages } from "@/lib/site-config";
import { cn } from "@/lib/utils";

import { Container } from "./container";
import { SocialLinks } from "./social-links";

/**
 * Habillage des commandes posées sur une photo de hero : le blanc seul se perd
 * dès que la photo s'éclaircit sous l'icône. Une pastille translucide bordée
 * garantit la lisibilité quelle que soit l'image.
 */
const ON_PHOTO =
  "border-white/40 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20 hover:text-white dark:hover:bg-white/20";

export function HeaderShell({
  logo,
  logoWhite,
}: {
  logo: ReactNode;
  logoWhite: ReactNode;
}) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const overlay = hasOverlayHero(pathname);
  /** Transparent uniquement en haut d'une page à hero, menu mobile fermé. */
  const transparent = overlay && !scrolled;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Chaque lien du panneau mobile est enveloppé dans un `SheetClose` : la
  // fermeture à la navigation est gérée là, sans effet de bord au rendu.

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full transition-[background-color,box-shadow,border-color] duration-300",
        transparent
          ? "border-b border-transparent bg-transparent"
          : "border-b border-border bg-background/85 shadow-sm backdrop-blur-md supports-[backdrop-filter]:bg-background/75",
      )}
    >
      <Container size="wide">
        <div className="flex h-16 items-center justify-between gap-4 lg:h-20">
          {/*
            Le logo reste visible en permanence (section 6) : bleu marine sur
            fond clair, blanc sur fond sombre comme sur photo de hero.
          */}
          <Link
            href="/"
            className="flex shrink-0 items-center rounded-md py-1 pr-2"
            aria-label="ADEBES — retour à l'accueil"
          >
            <span className={transparent ? "hidden" : "block dark:hidden"}>
              {logo}
            </span>
            <span className={transparent ? "block" : "hidden dark:block"}>
              {logoWhite}
            </span>
          </Link>

          {/* --- Navigation desktop --- */}
          <nav aria-label="Navigation principale" className="hidden xl:block">
            <ul className="flex items-center gap-0.5">
              {mainNav.map((item) => {
                const active = isActivePath(pathname, item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "relative inline-flex h-11 items-center rounded-md px-3 text-sm font-medium transition-colors",
                        transparent
                          ? "text-white/85 hover:text-white"
                          : "text-muted-foreground hover:text-foreground",
                        active &&
                          (transparent ? "text-white" : "text-foreground"),
                      )}
                    >
                      {item.label}
                      {active ? (
                        <span
                          aria-hidden="true"
                          className={cn(
                            "absolute inset-x-3 bottom-1.5 h-0.5 rounded-full",
                            transparent ? "bg-white" : "bg-primary",
                          )}
                        />
                      ) : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="flex items-center gap-1.5">
            <ThemeToggle
              className={cn("hidden sm:inline-flex", transparent && ON_PHOTO)}
            />

            {/* CTA de don toujours visible, y compris sur mobile. */}
            <Button asChild variant="donate" size="sm" className="lg:h-11 lg:px-4 lg:text-sm">
              <Link href="/don">
                <Heart className="size-4" aria-hidden="true" />
                <span className="hidden sm:inline">Faire un don</span>
                <span className="sm:hidden">Don</span>
              </Link>
            </Button>

            {/* --- Menu mobile plein écran --- */}
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn("xl:hidden", transparent && ON_PHOTO)}
                  aria-label="Ouvrir le menu"
                >
                  <Menu className="size-6" aria-hidden="true" />
                </Button>
              </SheetTrigger>

              {/*
                `showCloseButton={false}` : le panneau fournit sa propre croix
                en position absolue, qui se superposait à celle de l'en-tête
                ci-dessous — deux croix décalées au même endroit. On garde
                celle de l'en-tête : alignée sur le logo, libellée en français
                et dotée d'une cible tactile de 44 px.
              */}
              <SheetContent
                side="right"
                showCloseButton={false}
                className="flex w-full flex-col gap-0 p-0 sm:max-w-sm"
              >
                <SheetHeader className="flex-row items-center justify-between gap-3 border-b border-border px-5 py-4">
                  <SheetTitle asChild>
                    <span className="min-w-0">
                      <span className="block dark:hidden">{logo}</span>
                      <span className="hidden dark:block">{logoWhite}</span>
                    </span>
                  </SheetTitle>
                  <SheetClose asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="-mr-2 shrink-0"
                      aria-label="Fermer le menu"
                    >
                      <X className="size-6" aria-hidden="true" />
                    </Button>
                  </SheetClose>
                </SheetHeader>

                <nav
                  aria-label="Navigation principale (mobile)"
                  className="flex-1 overflow-y-auto px-3 py-4"
                >
                  <ul className="flex flex-col gap-0.5">
                    {mainNav.map((item) => {
                      const active = isActivePath(pathname, item.href);
                      return (
                        <li key={item.href}>
                          <SheetClose asChild>
                            <Link
                              href={item.href}
                              aria-current={active ? "page" : undefined}
                              className={cn(
                                "flex min-h-14 flex-col justify-center rounded-lg px-3 py-2 transition-colors",
                                active
                                  ? "bg-secondary text-foreground"
                                  : "text-foreground hover:bg-muted",
                              )}
                            >
                              <span className="font-heading text-base font-semibold">
                                {item.label}
                              </span>
                              {item.description ? (
                                <span className="text-xs text-muted-foreground">
                                  {item.description}
                                </span>
                              ) : null}
                            </Link>
                          </SheetClose>
                        </li>
                      );
                    })}
                  </ul>
                </nav>

                <div className="border-t border-border px-5 py-4">
                  <div className="flex flex-col gap-2.5">
                    {conversionNav.map((item) => (
                      <SheetClose asChild key={item.href}>
                        <Button
                          asChild
                          variant={
                            item.href === "/don" ? "donate" : "outline"
                          }
                          className="w-full"
                        >
                          <Link href={item.href}>{item.label}</Link>
                        </Button>
                      </SheetClose>
                    ))}
                    <Button asChild variant="whatsapp" className="w-full">
                      <a
                        href={whatsappLink(whatsappMessages.contact)}
                        target="_blank"
                        rel="noreferrer noopener"
                      >
                        WhatsApp {contact.phoneDisplay}
                      </a>
                    </Button>
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <SocialLinks />
                    <ThemeToggle />
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </Container>
    </header>
  );
}
