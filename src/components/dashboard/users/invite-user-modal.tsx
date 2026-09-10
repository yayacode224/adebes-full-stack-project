"use client";

import { Button } from "@/components/ui/button";
import type { FieldDescriptor } from "@/core/cms/blocks/types";
import {
  inviteUserSchema,
  type InviteUserInput,
} from "@/core/cms/schemas/user-account.schema";
import { ROLE_DESCRIPTIONS, ROLE_LABELS, USER_ROLES } from "@/core/rbac/roles";
import { inviterUtilisateurAction } from "@/server/actions/users.actions";

import { SchemaForm } from "../forms/schema-form";
import { FormModal } from "../modals/form-modal";

/**
 * Invitation d'un compte (§13.1 du Rapport 2).
 *
 * L'invitation envoie un e-mail via `auth.admin.inviteUserByEmail()` : la
 * personne reçoit un lien, choisit son mot de passe, puis arrive au dashboard
 * avec le rôle défini ici. Inviter est ouvert à l'administrateur
 * (`user:create`) ; le rôle attribué peut aller jusqu'à `super_admin`, acte
 * délibéré et tracé au journal (`user.invite`).
 */
const CHAMPS: readonly FieldDescriptor[] = [
  {
    kind: "text",
    name: "email",
    label: "Adresse e-mail",
    required: true,
    placeholder: "prenom.nom@exemple.org",
    hint: "L'invitation et le lien de création du mot de passe y seront envoyés.",
  },
  {
    kind: "text",
    name: "fullName",
    label: "Nom de la personne",
    required: true,
    placeholder: "Prénom Nom",
  },
  {
    kind: "select",
    name: "role",
    label: "Rôle",
    required: true,
    options: USER_ROLES.map((role) => ({
      value: role,
      label: `${ROLE_LABELS[role]} — ${ROLE_DESCRIPTIONS[role]}`,
    })),
    hint: "Le rôle peut être changé plus tard par un super administrateur.",
  },
];

const CLES_FORMULAIRE = ["email", "fullName", "role"] as const;

const VALEURS_VIERGES: InviteUserInput = {
  email: "",
  fullName: "",
  role: "editor",
};

export function InviteUserModal({
  open,
  onOpenChange,
  onInvited,
}: {
  open: boolean;
  onOpenChange: (ouvert: boolean) => void;
  /** Reçoit le message de succès à afficher — l'appelant rafraîchit la liste. */
  onInvited: (message: string) => void;
}) {
  return (
    <FormModal
      open={open}
      onOpenChange={onOpenChange}
      title="Inviter un compte"
      description="Un e-mail d'invitation en français, aux couleurs d'ADEBES, sera envoyé à cette adresse."
    >
      <SchemaForm<InviteUserInput>
        fields={CHAMPS}
        schema={inviteUserSchema}
        defaultValues={VALEURS_VIERGES}
        columns={1}
        submitLabel="Envoyer l'invitation"
        secondaryAction={
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
        }
        onSubmit={async (saisie, outils) => {
          const resultat = await inviterUtilisateurAction(saisie);

          if (resultat.ok) {
            onOpenChange(false);
            onInvited(
              `Invitation envoyée à ${resultat.data.email}. Le compte apparaît ci-dessous, en attente de première connexion.`,
            );
            return;
          }

          for (const cle of CLES_FORMULAIRE) {
            const message = resultat.fieldErrors?.[cle];
            if (message) outils.setError(cle, { message });
          }

          return resultat.message;
        }}
      />
    </FormModal>
  );
}
