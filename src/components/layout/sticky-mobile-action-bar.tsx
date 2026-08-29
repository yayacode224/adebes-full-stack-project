"use client";

import { Heart } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FaWhatsapp } from "react-icons/fa6";

import { whatsappLink, whatsappMessages } from "@/lib/site-config";

/**
 * Barre d'action fixe, mobile uniquement (audit §7 : « garder la conversion
 * accessible à tout moment du scroll »).
 *
 * Le `padding-bottom` correspondant est appliqué au `<body>` via
 * `.pb-action-bar` : la barre ne masque donc jamais la fin du contenu.
 *
 * Sur /don, le raccourci vers le don ferait doublon avec la page elle-même ;
 * seul WhatsApp subsiste, en pleine largeur. La barre reste présente pour que
 * la hauteur réservée en bas de page ne varie pas d'une page à l'autre.
 */
export function StickyMobileActionBar() {
  const pathname = usePathname();
  const surPageDon = pathname === "/don";

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur-md lg:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="mx-auto flex max-w-md items-center gap-2 px-4 py-2.5">
        {surPageDon ? null : (
          <Link
            href="/don"
            className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-brand-green-ink text-sm font-semibold text-white transition-colors hover:bg-[#276a2a] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring dark:bg-brand-green dark:text-[#06121e]"
          >
            <Heart className="size-4" aria-hidden="true" />
            Faire un don
          </Link>
        )}

        <a
          href={whatsappLink(whatsappMessages.contact)}
          target="_blank"
          rel="noreferrer noopener"
          className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-whatsapp-ink text-sm font-semibold text-white transition-colors hover:bg-[#0f7a6d] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring dark:bg-whatsapp dark:text-[#06121e]"
        >
          <FaWhatsapp className="size-4" aria-hidden="true" />
          WhatsApp
        </a>
      </div>
    </div>
  );
}
