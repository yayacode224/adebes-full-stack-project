"use client";

import { Ban, CircleCheck, Mail, Trash2, UserCog } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import type { MediaAsset } from "@/core/cms/entities/media-asset";
import {
  estInvitationEnAttente,
  type UserAccount,
} from "@/core/cms/entities/user-account";
import { ROLE_LABELS, USER_ROLES } from "@/core/rbac/roles";
import { formatDateHeure } from "@/lib/dates";
import { cn } from "@/lib/utils";
import {
  changerActivationUtilisateurAction,
  supprimerUtilisateurAction,
} from "@/server/actions/users.actions";

import { DataTable } from "../data-table/data-table";
import type { Column } from "../data-table/types";
import { PageHeader } from "../layout/page-header";
import { MediaThumbnail } from "../media/media-thumbnail";
import { ConfirmDialog } from "../modals/confirm-dialog";
import { ChangeRoleDialog } from "./change-role-dialog";
import { InviteUserModal } from "./invite-user-modal";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  L'ÉCRAN `/dashboard/utilisateurs` (§13.1 du Rapport 2)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Liste : avatar, nom, e-mail, rôle, état, dernière connexion. Actions :
 * inviter, changer le rôle, activer/désactiver, supprimer.
 *
 * Le partage des droits vient des props, elles-mêmes calculées par `can()` sur
 * la page (jamais un test de rôle) :
 *
 *   • `peutInviter`     → `user:create` (administrateur inclus)
 *   • `peutGererComptes`→ `user:update` (super administrateur seul) : rôle et
 *     état d'activité
 *   • `peutSupprimer`   → `user:delete` (super administrateur seul)
 *
 * Les garde-fous du §13.2 qui portent sur SOI-MÊME sont doublés ici en
 * désactivant l'entrée de menu avec son motif — la Server Action refuserait de
 * toute façon, mais laisser cliquer pour afficher une erreur, c'est promettre
 * puis reprendre.
 */
export function UsersClient({
  comptes,
  avatars,
  moiId,
  peutInviter,
  peutGererComptes,
  peutSupprimer,
}: {
  comptes: UserAccount[];
  avatars: Record<string, MediaAsset>;
  /** L'identifiant du compte courant — pour les garde-fous « soi-même ». */
  moiId: string;
  peutInviter: boolean;
  peutGererComptes: boolean;
  peutSupprimer: boolean;
}) {
  const router = useRouter();

  const [inviteOuverte, setInviteOuverte] = useState(false);
  const [roleCible, setRoleCible] = useState<UserAccount | null>(null);
  const [aBasculer, setABasculer] = useState<UserAccount | null>(null);
  const [aSupprimer, setASupprimer] = useState<UserAccount | null>(null);

  async function basculerActivation(compte: UserAccount, actif: boolean) {
    const resultat = await changerActivationUtilisateurAction({
      userId: compte.id,
      isActive: actif,
    });

    if (!resultat.ok) {
      toast.error(resultat.message, { duration: 10000 });
      return;
    }

    toast.success(
      actif
        ? `L'accès de ${compte.fullName ?? compte.email} est rétabli.`
        : `${compte.fullName ?? compte.email} n'a plus accès au dashboard. Sa session sera coupée à sa prochaine action.`,
    );
    router.refresh();
  }

  async function supprimer(compte: UserAccount) {
    const resultat = await supprimerUtilisateurAction({ userId: compte.id });

    if (!resultat.ok) {
      toast.error(resultat.message, { duration: 10000 });
      return;
    }

    toast.success(`Le compte de ${compte.email} a été supprimé.`);
    router.refresh();
  }

  const colonnes: Column<UserAccount>[] = [
    {
      key: "avatar",
      header: "Avatar",
      width: "3.5rem",
      cell: (compte) => {
        const media = compte.avatarMediaId
          ? avatars[compte.avatarMediaId]
          : undefined;

        return (
          <span className="flex size-9 items-center justify-center overflow-hidden rounded-full bg-muted text-xs font-semibold text-muted-foreground">
            {media ? (
              <MediaThumbnail asset={media} sizes="36px" />
            ) : (
              <span aria-hidden="true">{initiales(compte)}</span>
            )}
          </span>
        );
      },
    },
    {
      key: "fullName",
      header: "Nom",
      sortable: true,
      sortValue: (compte) => (compte.fullName ?? compte.email).toLowerCase(),
      cell: (compte) => (
        <span className="flex min-w-0 flex-col">
          <span className="truncate font-medium text-foreground">
            {compte.fullName ?? "—"}
            {compte.id === moiId ? (
              <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                (vous)
              </span>
            ) : null}
          </span>
          <span className="truncate text-xs text-muted-foreground">
            {compte.email}
          </span>
        </span>
      ),
    },
    {
      key: "role",
      header: "Rôle",
      sortable: true,
      sortValue: (compte) => USER_ROLES.indexOf(compte.role),
      cell: (compte) => (
        <span className="inline-flex items-center rounded-full border border-border px-2 py-0.5 text-xs font-medium whitespace-nowrap text-foreground">
          {ROLE_LABELS[compte.role]}
        </span>
      ),
    },
    {
      key: "isActive",
      header: "État",
      sortable: true,
      sortValue: (compte) => (compte.isActive ? 0 : 1),
      cell: (compte) => (
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium whitespace-nowrap",
            compte.isActive
              ? "border-accent-foreground/25 bg-accent text-accent-foreground"
              : "border-dashed border-border text-muted-foreground",
          )}
        >
          <span
            aria-hidden="true"
            className={cn(
              "size-1.5 rounded-full",
              compte.isActive ? "bg-success" : "bg-muted-foreground/50",
            )}
          />
          {compte.isActive ? "Actif" : "Désactivé"}
        </span>
      ),
    },
    {
      key: "lastSeenAt",
      header: "Dernière connexion",
      hideOnMobile: true,
      sortable: true,
      sortValue: (compte) => compte.lastSeenAt ?? "",
      cell: (compte) =>
        estInvitationEnAttente(compte) ? (
          <span className="text-muted-foreground">Invitation en attente</span>
        ) : (
          <span className="text-muted-foreground">
            {formatDateHeure(compte.lastSeenAt as string)}
          </span>
        ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Utilisateurs"
        description="Les comptes qui accèdent au dashboard. L'identité est gérée par Supabase Auth ; le rôle et l'état d'activité se règlent ici."
        actions={
          peutInviter ? (
            <Button type="button" onClick={() => setInviteOuverte(true)}>
              <Mail className="size-4" aria-hidden="true" />
              Inviter un compte
            </Button>
          ) : undefined
        }
      />

      <DataTable<UserAccount>
        data={comptes}
        columns={colonnes}
        getRowId={(compte) => compte.id}
        primaryColumnKey="fullName"
        badgeColumnKey="isActive"
        itemLabel="compte"
        emptyState={{
          title: "Aucun compte",
          description:
            "Invitez une première personne : elle recevra un e-mail pour définir son mot de passe.",
          action: peutInviter ? (
            <Button type="button" onClick={() => setInviteOuverte(true)}>
              <Mail className="size-4" aria-hidden="true" />
              Inviter un compte
            </Button>
          ) : undefined,
        }}
        search={{
          placeholder: "Rechercher un nom ou une adresse…",
          keys: ["fullName", "email"],
        }}
        filters={[
          {
            key: "role",
            label: "Rôle",
            options: USER_ROLES.map((role) => ({
              value: role,
              label: ROLE_LABELS[role],
            })),
            match: (compte, valeur) => compte.role === valeur,
          },
          {
            key: "isActive",
            label: "État",
            options: [
              { value: "actif", label: "Actif" },
              { value: "inactif", label: "Désactivé" },
            ],
            match: (compte, valeur) =>
              valeur === "actif" ? compte.isActive : !compte.isActive,
          },
        ]}
        pagination={{ pageSize: 25 }}
        rowActions={
          peutGererComptes || peutSupprimer
            ? (compte) => {
                const soiMeme = compte.id === moiId;

                return [
                  ...(peutGererComptes
                    ? [
                        {
                          label: "Changer le rôle",
                          icon: UserCog,
                          disabled: soiMeme,
                          disabledReason: soiMeme
                            ? "Vous ne pouvez pas modifier votre propre rôle."
                            : undefined,
                          onSelect: () => setRoleCible(compte),
                        },
                        compte.isActive
                          ? {
                              label: "Désactiver l'accès",
                              icon: Ban,
                              disabled: soiMeme,
                              disabledReason: soiMeme
                                ? "Vous ne pouvez pas désactiver votre propre compte."
                                : undefined,
                              onSelect: () => setABasculer(compte),
                            }
                          : {
                              label: "Rétablir l'accès",
                              icon: CircleCheck,
                              onSelect: () =>
                                void basculerActivation(compte, true),
                            },
                      ]
                    : []),
                  ...(peutSupprimer
                    ? [
                        {
                          label: "Supprimer le compte",
                          icon: Trash2,
                          variant: "destructive" as const,
                          disabled: soiMeme,
                          disabledReason: soiMeme
                            ? "Vous ne pouvez pas supprimer votre propre compte."
                            : undefined,
                          onSelect: () => setASupprimer(compte),
                        },
                      ]
                    : []),
                ];
              }
            : undefined
        }
      />

      {peutInviter ? (
        <InviteUserModal
          open={inviteOuverte}
          onOpenChange={setInviteOuverte}
          onInvited={(message) => {
            toast.success(message);
            router.refresh();
          }}
        />
      ) : null}

      {peutGererComptes ? (
        <ChangeRoleDialog
          key={roleCible?.id ?? "aucun"}
          compte={roleCible}
          open={roleCible !== null}
          onOpenChange={(ouvert) => {
            if (!ouvert) setRoleCible(null);
          }}
          onChanged={() => router.refresh()}
        />
      ) : null}

      <ConfirmDialog
        open={aBasculer !== null}
        onOpenChange={(ouvert) => {
          if (!ouvert) setABasculer(null);
        }}
        title={
          aBasculer
            ? `Désactiver l'accès de ${aBasculer.fullName ?? aBasculer.email} ?`
            : "Désactiver ce compte ?"
        }
        description="La personne ne pourra plus accéder au dashboard. Sa session en cours sera coupée à sa prochaine action. Le compte et son contenu restent ; l'accès peut être rétabli à tout moment."
        confirmLabel="Désactiver l'accès"
        onConfirm={async () => {
          if (aBasculer) await basculerActivation(aBasculer, false);
          setABasculer(null);
        }}
      />

      <ConfirmDialog
        open={aSupprimer !== null}
        onOpenChange={(ouvert) => {
          if (!ouvert) setASupprimer(null);
        }}
        title={
          aSupprimer
            ? `Supprimer le compte de ${aSupprimer.email} ?`
            : "Supprimer ce compte ?"
        }
        description="Le compte et son identité sont supprimés définitivement. Les contenus qu'il a créés restent, mais ne lui seront plus rattachés. Cette action est irréversible."
        confirmLabel="Supprimer le compte"
        onConfirm={async () => {
          if (aSupprimer) await supprimer(aSupprimer);
          setASupprimer(null);
        }}
      />
    </div>
  );
}

/** Deux initiales pour l'avatar par défaut. */
function initiales(compte: UserAccount): string {
  const source = (compte.fullName ?? compte.email).trim();
  const morceaux = source.split(/\s+/).filter(Boolean);
  if (morceaux.length >= 2) {
    return (morceaux[0][0] + morceaux[1][0]).toUpperCase();
  }
  return source.slice(0, 2).toUpperCase();
}
