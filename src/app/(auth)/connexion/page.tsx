import type { Metadata } from "next";
import Link from "next/link";

import { SignInForm } from "@/components/forms/sign-in-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Connexion",
  // Les écrans du CMS n'ont aucune raison d'être indexés.
  robots: { index: false, follow: false },
};

export default async function ConnexionPage({ searchParams }: PageProps<"/connexion">) {
  // `searchParams` est une Promesse en Next.js 16.
  const parametres = await searchParams;

  const brut = parametres.suivant;
  const suivant = typeof brut === "string" ? brut : undefined;

  const erreur = parametres.erreur;
  const compteDesactive = erreur === "compte-desactive";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Connexion à l&apos;espace de gestion</CardTitle>
        <CardDescription>
          Cet espace est réservé à l&apos;équipe d&apos;ADEBES.
        </CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-5">
        {compteDesactive ? (
          <p
            role="alert"
            className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive"
          >
            Votre accès a été désactivé. Contactez un administrateur.
          </p>
        ) : null}

        {/*
          `suivant` est transmis au formulaire, mais il est REVALIDÉ côté
          serveur avant toute redirection (`cheminDeRetour`) : un paramètre
          d'URL est une donnée d'utilisateur, pas une instruction.
        */}
        <SignInForm suivant={suivant} />

        <p className="text-center text-sm">
          <Link
            href="/mot-de-passe-oublie"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            Mot de passe oublié ?
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
