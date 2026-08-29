"use client";

import { Check, Link2, Share2 } from "lucide-react";
import { useState, useSyncExternalStore } from "react";
import { FaFacebookF, FaWhatsapp } from "react-icons/fa6";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

/**
 * Partage d'un article.
 *
 * Sur mobile, l'API Web Share native ouvre le sélecteur du système (WhatsApp,
 * SMS, e-mail…) : c'est le geste attendu et le plus efficace. Sur desktop, où
 * elle est rarement disponible, on retombe sur des liens de partage directs et
 * une copie du lien.
 *
 * La détection se fait après montage : `navigator` n'existe pas au rendu
 * serveur, et supposer sa présence provoquerait une erreur d'hydratation.
 */
export function ShareButtons({
  title,
  url,
}: {
  title: string;
  /** URL absolue de l'article. */
  url: string;
}) {
  const [copied, setCopied] = useState(false);

  /**
   * Capacité du navigateur, lue sans effet ni rendu en cascade : le snapshot
   * serveur vaut `false`, le snapshot client interroge `navigator`. React
   * réconcilie les deux proprement après hydratation.
   */
  const canShare = useSyncExternalStore(
    () => () => {},
    () => "share" in navigator,
    () => false,
  );

  async function nativeShare() {
    try {
      await navigator.share({ title, url });
    } catch {
      // L'utilisateur a annulé le partage : rien à signaler.
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Lien copié dans le presse-papier");
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error("Impossible de copier le lien. Copiez-le depuis la barre d'adresse.");
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="mr-1 text-sm font-medium text-muted-foreground">
        Partager :
      </span>

      {canShare ? (
        <Button variant="outline" size="sm" onClick={nativeShare}>
          <Share2 className="size-4" aria-hidden="true" />
          Partager
        </Button>
      ) : null}

      <Button asChild variant="outline" size="sm">
        <a
          href={`https://wa.me/?text=${encodeURIComponent(`${title} — ${url}`)}`}
          target="_blank"
          rel="noreferrer noopener"
          aria-label="Partager sur WhatsApp (nouvelle fenêtre)"
        >
          <FaWhatsapp className="size-4" aria-hidden="true" />
          WhatsApp
        </a>
      </Button>

      <Button asChild variant="outline" size="sm">
        <a
          href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`}
          target="_blank"
          rel="noreferrer noopener"
          aria-label="Partager sur Facebook (nouvelle fenêtre)"
        >
          <FaFacebookF className="size-4" aria-hidden="true" />
          Facebook
        </a>
      </Button>

      <Button variant="outline" size="sm" onClick={copyLink}>
        {copied ? (
          <Check className="size-4" aria-hidden="true" />
        ) : (
          <Link2 className="size-4" aria-hidden="true" />
        )}
        {copied ? "Copié" : "Copier le lien"}
      </Button>
    </div>
  );
}
