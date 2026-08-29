"use client";

import { useState } from "react";
import { FaWhatsapp } from "react-icons/fa6";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { whatsappLink } from "@/lib/site-config";
import { cn } from "@/lib/utils";

const SUGGESTIONS = [5000, 10000, 25000, 50000];
const format = new Intl.NumberFormat("fr-FR");

/**
 * Choix du montant du don.
 *
 * Il n'y a pas encore de passerelle de paiement : le montant sélectionné est
 * injecté dans le message WhatsApp pré-rempli, ce qui rend ces boutons
 * réellement fonctionnels plutôt que décoratifs — la règle « aucun bouton sans
 * action réelle » (section 17) s'applique aussi ici.
 *
 * Le jour où un prestataire de paiement est retenu (CinetPay, Mobile Money…),
 * seul le gestionnaire du bouton principal est à remplacer.
 */
export function DonationAmounts() {
  const [selected, setSelected] = useState<number | null>(10000);
  const [custom, setCustom] = useState("");

  const customAmount = Number(custom.replace(/\D/g, ""));
  const amount = custom ? (customAmount > 0 ? customAmount : null) : selected;

  const message = amount
    ? `Bonjour ADEBES, je souhaite faire un don de ${format.format(amount)} FCFA. Pouvez-vous m'indiquer la marche à suivre ?`
    : "Bonjour ADEBES, je souhaite faire un don. Pouvez-vous m'indiquer la marche à suivre ?";

  return (
    <div className="flex flex-col gap-5 rounded-2xl border border-border bg-card p-6">
      <div>
        <h2 className="font-heading text-lg font-bold text-foreground">
          Choisissez un montant
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Montant indicatif : il sera repris dans votre message pour accélérer
          l&apos;échange.
        </p>
      </div>

      <div
        role="group"
        aria-label="Montants suggérés"
        className="grid grid-cols-2 gap-2.5 sm:grid-cols-4"
      >
        {SUGGESTIONS.map((value) => {
          const active = !custom && selected === value;

          return (
            <button
              key={value}
              type="button"
              aria-pressed={active}
              onClick={() => {
                setSelected(value);
                setCustom("");
              }}
              className={cn(
                "flex h-14 flex-col items-center justify-center rounded-xl border text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                active
                  ? "border-brand-green-ink bg-brand-green/12 text-brand-green-ink dark:border-brand-green dark:text-brand-green"
                  : "border-border bg-background text-foreground hover:border-primary/40 hover:bg-muted",
              )}
            >
              {format.format(value)}
              <span className="text-[0.7rem] font-normal text-muted-foreground">
                FCFA
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="custom-amount" className="text-sm font-medium">
          Ou saisissez un autre montant
        </Label>
        <div className="flex items-center gap-2">
          <Input
            id="custom-amount"
            inputMode="numeric"
            placeholder="Ex. 15 000"
            value={custom}
            onChange={(event) => setCustom(event.target.value)}
            className="h-11"
          />
          <span className="text-sm font-medium text-muted-foreground">FCFA</span>
        </div>
      </div>

      <Button asChild variant="whatsapp" size="lg" className="w-full">
        <a
          href={whatsappLink(message)}
          target="_blank"
          rel="noreferrer noopener"
        >
          <FaWhatsapp className="size-4" aria-hidden="true" />
          {amount
            ? `Donner ${format.format(amount)} FCFA via WhatsApp`
            : "Faire un don via WhatsApp"}
        </a>
      </Button>

      <p className="text-xs leading-relaxed text-muted-foreground">
        Un membre de l&apos;équipe vous répond et vous accompagne dans la
        transaction. Aucun paiement n&apos;est prélevé depuis ce site.
      </p>
    </div>
  );
}
