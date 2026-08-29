import type { Metadata } from "next";

import { ResetPasswordForm } from "@/components/forms/reset-password-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Nouveau mot de passe",
  robots: { index: false, follow: false },
};

/**
 * Écran atteint depuis le lien reçu par e-mail.
 *
 * Supabase ouvre une session de récupération en traitant le fragment de l'URL
 * (`#access_token=…`). Ce fragment n'est PAS transmis au serveur : c'est le
 * client Supabase, dans le navigateur, qui le consomme et pose les cookies.
 *
 * Le formulaire n'a donc rien à lire dans l'URL ; la Server Action vérifie
 * simplement qu'une session existe, et répond « lien expiré » sinon.
 */
export default function ReinitialiserMotDePassePage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Choisir un nouveau mot de passe</CardTitle>
        <CardDescription>
          Ce lien n&apos;est utilisable qu&apos;une seule fois.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <ResetPasswordForm />
      </CardContent>
    </Card>
  );
}
