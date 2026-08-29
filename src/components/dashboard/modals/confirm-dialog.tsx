"use client";

import { Loader2 } from "lucide-react";
import { useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/**
 * Confirmation d'une action irréversible.
 *
 * ---------------------------------------------------------------------------
 * TROIS RÈGLES DU §12 DU RAPPORT 1, TOUTES VÉRIFIABLES À LA RELECTURE
 * ---------------------------------------------------------------------------
 * 1. **Nommer l'élément concerné.** « Supprimer *Éducation* ? », jamais
 *    « Êtes-vous sûr ? ». L'utilisateur doit pouvoir vérifier qu'il s'agit bien
 *    de la ligne qu'il visait — c'est la dernière occasion de rattraper un
 *    clic sur la mauvaise ligne d'un tableau.
 * 2. **Expliquer la conséquence.** « Cette action est définitive. »
 * 3. **Un verbe d'action sur le bouton.** « Supprimer », jamais « OK ». Un
 *    « OK » ne dit pas ce qu'il valide, et se clique par réflexe.
 *
 * ---------------------------------------------------------------------------
 * ORDRE DES BOUTONS — L'ACTION DESTRUCTIVE EN DERNIER SUR MOBILE
 * ---------------------------------------------------------------------------
 * L'ordre du DOM est **Annuler puis Confirmer**, et il n'a pas besoin d'être
 * inversé :
 *
 *   * en colonne (mobile), il place l'action destructive **en bas** — le pouce
 *     l'atteint après avoir traversé « Annuler », et l'appui réflexe sur le
 *     premier bouton venu ne détruit rien ;
 *   * en ligne (`sm:`), il la place **à droite**, à sa position habituelle ;
 *   * au clavier, la tabulation rencontre d'abord le choix sûr.
 *
 * C'est aussi pourquoi le `flex-col-reverse` par défaut de `DialogFooter` est
 * remplacé par `flex-col` : conservé, il aurait remonté « Supprimer » en tête
 * de pile.
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  cancelLabel = "Annuler",
  variant = "destructive",
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (ouvert: boolean) => void;
  /** Nomme l'élément : « Supprimer le programme Éducation ? ». */
  title: string;
  /** Dit la conséquence : « Cette action est définitive. ». */
  description: ReactNode;
  /** Un verbe : « Supprimer », « Archiver », « Quitter sans enregistrer ». */
  confirmLabel: string;
  cancelLabel?: string;
  variant?: "destructive" | "default";
  /**
   * Peut être asynchrone : le bouton passe en attente et se verrouille, ce qui
   * évite la double soumission — la faute la plus courante sur une connexion
   * lente, et la plus coûteuse sur une suppression.
   */
  onConfirm: () => void | Promise<void>;
}) {
  const [enCours, setEnCours] = useState(false);

  async function confirmer() {
    if (enCours) return;
    setEnCours(true);
    try {
      await onConfirm();
    } finally {
      setEnCours(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(ouvert) => {
        // Une action en cours ne doit pas voir sa modale disparaître sous
        // elle : l'utilisateur croirait l'opération annulée.
        if (enCours) return;
        onOpenChange(ouvert);
      }}
    >
      <DialogContent showCloseButton={false} className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-balance">{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            disabled={enCours}
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto"
          >
            {cancelLabel}
          </Button>

          <Button
            type="button"
            variant={variant === "destructive" ? "destructive" : "default"}
            disabled={enCours}
            onClick={confirmer}
            className="w-full sm:w-auto"
          >
            {enCours ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                Traitement…
              </>
            ) : (
              confirmLabel
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
