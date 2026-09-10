"use client";

import { Loader2 } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { UserAccount } from "@/core/cms/entities/user-account";
import {
  isUserRole,
  ROLE_DESCRIPTIONS,
  ROLE_LABELS,
  USER_ROLES,
  type UserRole,
} from "@/core/rbac/roles";
import { changerRoleUtilisateurAction } from "@/server/actions/users.actions";

/**
 * Changer le rôle d'un compte (§13.1 du Rapport 2).
 *
 * Réservé au super administrateur : le bouton qui ouvre cette boîte n'est
 * rendu que si `can(actor, 'user:update')`. Les garde-fous du §13.2 (« pas son
 * propre rôle », dernier super administrateur) sont côté serveur, doublés par
 * `guard_last_super_admin` — le message affiché ici est celui que renvoie
 * l'action.
 *
 * ⚠️  L'appelant monte ce composant avec `key={compte.id}` : le choix de rôle
 * repart donc de la valeur du compte à chaque ouverture, sans `useEffect` de
 * resynchronisation.
 */
export function ChangeRoleDialog({
  compte,
  open,
  onOpenChange,
  onChanged,
}: {
  compte: UserAccount | null;
  open: boolean;
  onOpenChange: (ouvert: boolean) => void;
  onChanged: () => void;
}) {
  const [role, setRole] = useState<UserRole>(compte?.role ?? "editor");
  const [enCours, demarrer] = useTransition();

  if (!compte) return null;

  const inchange = role === compte.role;

  function confirmer() {
    if (!compte || inchange || enCours) return;

    demarrer(async () => {
      const resultat = await changerRoleUtilisateurAction({
        userId: compte.id,
        role,
      });

      if (!resultat.ok) {
        toast.error(resultat.message, { duration: 10000 });
        return;
      }

      toast.success(
        `${compte.fullName ?? compte.email} est maintenant « ${ROLE_LABELS[resultat.data.account.role]} ».`,
      );
      onOpenChange(false);
      onChanged();
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(ouvert) => {
        if (enCours) return;
        onOpenChange(ouvert);
      }}
    >
      <DialogContent showCloseButton={false} className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-balance">
            Rôle de {compte.fullName ?? compte.email}
          </DialogTitle>
          <DialogDescription>
            Le changement prend effet à la prochaine requête de la personne
            concernée.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2">
          <Label htmlFor="role-compte">Nouveau rôle</Label>
          <Select
            value={role}
            onValueChange={(valeur) => {
              if (isUserRole(valeur)) setRole(valeur);
            }}
          >
            <SelectTrigger id="role-compte" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {USER_ROLES.map((r) => (
                <SelectItem key={r} value={r}>
                  {ROLE_LABELS[r]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-sm text-muted-foreground">{ROLE_DESCRIPTIONS[role]}</p>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            disabled={enCours}
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto"
          >
            Annuler
          </Button>
          <Button
            type="button"
            disabled={enCours || inchange}
            onClick={confirmer}
            className="w-full sm:w-auto"
          >
            {enCours ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                Traitement…
              </>
            ) : (
              "Changer le rôle"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
