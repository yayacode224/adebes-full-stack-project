"use client";

import { Info, TriangleAlert } from "lucide-react";
import { useRouter } from "next/navigation";
import { useFormContext, useWatch } from "react-hook-form";
import { toast } from "sonner";

import type { FieldDescriptor } from "@/core/cms/blocks/types";
import { estNomAFournir, type TeamMember } from "@/core/cms/entities/team-member";
import {
  teamMemberFormSchema,
  type TeamMemberFormInput,
} from "@/core/cms/schemas/team-member.schema";
import {
  creerMembreEquipeAction,
  mettreAJourMembreEquipeAction,
} from "@/server/actions/team.actions";

import { SchemaForm } from "../forms/schema-form";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  LE FORMULAIRE D'UNE FICHE D'ÉQUIPE — création et modification
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * §8D du Rapport 2. Un seul composant pour les deux écrans : les champs sont
 * les mêmes, seul l'appel de fin diffère. Deux formulaires auraient été deux
 * occasions de laisser diverger une contrainte de saisie.
 *
 * ---------------------------------------------------------------------------
 * AUCUN JSX DE FORMULAIRE N'EST ÉCRIT ICI
 * ---------------------------------------------------------------------------
 * Quatre descripteurs et `<SchemaForm>`. C'est la propriété nº 2 du §10 du
 * Rapport 1, et elle apporte gratuitement ce qu'on oublie en écrivant un
 * formulaire à la main : libellé associé, `role="alert"`, `aria-describedby`,
 * champs à 44 px, `text-base` sous `md:`, barre d'enregistrement collante
 * au-dessus de la zone sûre.
 *
 * La seule chose écrite à la main est l'AVERTISSEMENT SUR LE NOM, et ce n'est
 * pas un champ : c'est une explication, rendue en `children` juste au-dessus
 * de la barre d'enregistrement.
 *
 * ---------------------------------------------------------------------------
 * PAS DE CHAMP `reference`, DONC AUCUNE OPTION À FOURNIR
 * ---------------------------------------------------------------------------
 * C'est la différence la plus visible avec le formulaire du Lot 8C : une fiche
 * d'équipe ne pointe vers rien d'autre qu'un média. Ce composant ne reçoit
 * donc aucune prop `programmes`, et les écrans n'ont aucune liste à lire avant
 * de le rendre.
 */

/** Les quatre champs du §8D, dans l'ordre de saisie. */
function champsMembre(): readonly FieldDescriptor[] {
  return [
    {
      kind: "text",
      name: "name",
      label: "Nom",
      required: true,
      maxLength: 120,
      placeholder: "Aminata Ndongo",
      hint: "Le nom tel qu'il doit apparaître sur la page « Qui sommes-nous ». Tant qu'il reste « [À COMPLÉTER] », la fiche ne peut pas être mise en ligne.",
    },
    {
      kind: "text",
      name: "role",
      label: "Fonction",
      required: true,
      maxLength: 120,
      placeholder: "Coordination des programmes",
      hint: "Ce que la personne fait dans l'association. Affiché sous son nom.",
    },
    {
      kind: "textarea",
      name: "bio",
      label: "Biographie",
      maxLength: 400,
      rows: 3,
      hint: "Facultative. Une phrase : parcours ou domaine de responsabilité. Laissée vide, aucun paragraphe ne s'affiche sur la carte.",
    },
    {
      kind: "media",
      name: "photoMediaId",
      label: "Photo",
      accept: "image",
      hint: "Facultative. Sans photo, un emplacement coloré s'affiche à sa place — jamais l'image de quelqu'un d'autre.",
    },
  ];
}

/** Les clés du formulaire — pour rattacher une erreur serveur au bon champ. */
const CLES_FORMULAIRE = [
  "name",
  "role",
  "bio",
  "photoMediaId",
] as const satisfies readonly (keyof TeamMemberFormInput)[];

/** Valeurs d'un formulaire vierge. Aucune n'est inventée : elles sont vides. */
const VALEURS_VIERGES: TeamMemberFormInput = {
  name: "",
  role: "",
  bio: "",
  photoMediaId: null,
};

export function TeamMemberForm({
  membre,
}: {
  /** `undefined` = création. */
  membre?: TeamMember;
}) {
  const router = useRouter();
  const creation = membre === undefined;

  const valeurs: TeamMemberFormInput = membre
    ? {
        name: membre.name,
        role: membre.role,
        // `null` en base, `""` dans le champ : un `<textarea>` ne sait pas
        // représenter l'absence. La conversion inverse est faite à l'envoi.
        bio: membre.bio ?? "",
        photoMediaId: membre.photoMediaId,
      }
    : VALEURS_VIERGES;

  return (
    <SchemaForm<TeamMemberFormInput>
      fields={champsMembre()}
      schema={teamMemberFormSchema}
      defaultValues={valeurs}
      submitLabel={creation ? "Créer la fiche" : "Enregistrer les modifications"}
      onSubmit={async (saisie, outils) => {
        /*
          `"" → null` : le SEUL endroit du lot où cette conversion est faite.

          Le domaine distingue « pas de biographie » (`null`) de « biographie
          vide » (`""`) — la carte publique n'affiche le paragraphe que s'il y a
          du texte. Laisser passer `""` remplirait la colonne d'une chaîne vide
          qui se comporterait comme `null` partout sauf dans les requêtes, où
          `bio is null` cesserait de la trouver.
        */
        const charge = { ...saisie, bio: saisie.bio.trim() || null };

        const resultat = creation
          ? await creerMembreEquipeAction(charge)
          : await mettreAJourMembreEquipeAction({ id: membre.id, ...charge });

        if (resultat.ok) {
          if (creation) {
            toast.success(
              "Fiche créée, en brouillon. Elle n'est pas encore visible sur le site.",
            );
            router.push(`/dashboard/equipe/${resultat.data.id}`);
          } else {
            toast.success("Modifications enregistrées.");
            // Les données de la page viennent du rendu serveur : sans ce
            // rafraîchissement, l'en-tête garderait l'ancien nom.
            router.refresh();
          }
          return;
        }

        /*
          Erreur de champ → sous le champ concerné ; erreur générale →
          bandeau en tête de formulaire.

          Les clés sont parcourues depuis la liste connue plutôt que depuis la
          réponse : `setError` attend un chemin du formulaire, et une clé venue
          du serveur n'en est pas un tant qu'on ne l'a pas vérifiée.
        */
        for (const cle of CLES_FORMULAIRE) {
          const message = resultat.fieldErrors?.[cle];
          if (message) outils.setError(cle, { message });
        }

        return resultat.message;
      }}
    >
      <AvertissementNom />
    </SchemaForm>
  );
}

/**
 * L'avertissement sur le nom encore à fournir.
 *
 * ---------------------------------------------------------------------------
 * POURQUOI IL CHANGE DE TEXTE PLUTÔT QUE DE DISPARAÎTRE
 * ---------------------------------------------------------------------------
 * Même raisonnement qu'au Lot 8C pour la case d'accord : un avertissement qui
 * s'efface récompense le fait de le faire taire. Ici, il reste et rappelle ce
 * qui a été saisi — ce qui rend l'état lisible d'un coup d'œil quand on rouvre
 * une fiche des mois plus tard.
 *
 * Il explique aussi, AVANT d'enregistrer, pourquoi le bouton « Publier » de
 * l'en-tête est grisé. Sans lui, la fiche paraîtrait complète et le refus
 * arriverait sans motif visible.
 *
 * `<SchemaForm>` rend ses `children` À L'INTÉRIEUR de son `FormProvider` : ce
 * composant lit donc le formulaire par `useFormContext()`, sans qu'aucune prop
 * n'ait à traverser.
 */
function AvertissementNom() {
  const { control } = useFormContext<TeamMemberFormInput>();
  const nom = useWatch({ control, name: "name" });

  const aFournir = estNomAFournir(nom ?? "");
  const Icone = aFournir ? TriangleAlert : Info;

  return (
    <div
      // `aria-live` : la saisie du nom change ce texte. Sans annonce, une
      // personne au lecteur d'écran corrigerait le champ sans savoir que le
      // message au-dessus vient d'être remplacé.
      aria-live="polite"
      className={
        aFournir
          ? "flex gap-3 rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm"
          : "flex gap-3 rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm"
      }
    >
      <Icone
        className={
          aFournir
            ? "mt-0.5 size-4 shrink-0 text-destructive"
            : "mt-0.5 size-4 shrink-0 text-muted-foreground"
        }
        aria-hidden="true"
      />

      {aFournir ? (
        <p className="text-muted-foreground">
          <span className="font-medium text-foreground">
            Ce nom reste à fournir.
          </span>{" "}
          « {nom} » est un marqueur, pas un nom : il s&apos;afficherait tel quel
          sur la page « Qui sommes-nous ». Vous pouvez enregistrer cette fiche
          en brouillon dès maintenant — y déposer une photo, préciser la
          fonction — mais elle ne pourra pas être mise en ligne tant que le nom
          réel n&apos;est pas saisi. Aucun nom ne doit être inventé.
        </p>
      ) : (
        <p className="text-muted-foreground">
          <span className="font-medium text-foreground">
            Ce nom sera affiché publiquement
          </span>{" "}
          sur la page « Qui sommes-nous », avec la fonction et, si elle est
          renseignée, la biographie. Vérifiez son orthographe : c&apos;est
          souvent la première chose qu&apos;un donateur lit d&apos;une
          association.
        </p>
      )}
    </div>
  );
}
