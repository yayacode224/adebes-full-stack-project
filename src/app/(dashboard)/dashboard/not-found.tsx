import { ArrowLeft, SearchX } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

/**
 * 404 du dashboard.
 *
 * ---------------------------------------------------------------------------
 * POURQUOI ELLE EXISTE
 * ---------------------------------------------------------------------------
 * `src/app/not-found.tsx` est la 404 du site public : elle titre « Page
 * introuvable » et propose « Faire un don ». Servie à un administrateur qui a
 * suivi un lien périmé vers un programme supprimé, elle est au mieux
 * déroutante — et elle le fait sortir de son espace de travail.
 *
 * ---------------------------------------------------------------------------
 * MESURÉ EN RECETTE : ELLE NE S'AFFICHE PAS DANS LA COQUILLE
 * ---------------------------------------------------------------------------
 * Contrairement à ce que laisse croire la formule « `not-found.js` s'insère
 * entre `loading.js` et `page.js` », un `notFound()` levé dans une route
 * DYNAMIQUE fait rendre à Next.js une coquille d'erreur (`<html
 * id="__next_error__">`) : les layouts au-dessus ne sont PAS rejoués. Vérifié
 * sur le serveur de production — la charge utile de `/dashboard/inconnu` ne
 * contient ni barre latérale ni barre supérieure.
 *
 * Cette page se met donc en page TOUTE SEULE : son propre fond, ses propres
 * marges, sa propre hauteur. La supposer enveloppée par `<DashboardShell>`
 * aurait donné un bloc collé au bord de l'écran.
 *
 * ---------------------------------------------------------------------------
 * CE QU'ELLE COUVRE, ET CE QU'ELLE NE COUVRE PAS
 * ---------------------------------------------------------------------------
 * Elle répond aux appels à `notFound()` levés dans le segment `/dashboard` —
 * dont celui du fourre-tout `[...segments]`, qui rattrape toute adresse de
 * gestion ne correspondant à aucune entrée de navigation.
 *
 * Elle ne remplace pas la 404 racine pour une URL qui ne correspond à AUCUNE
 * route de l'application : la doc de `not-found.js` est explicite sur ce
 * point. Le fourre-tout est précisément ce qui fait qu'une adresse sous
 * `/dashboard` est toujours appariée, donc toujours traitée ici.
 */
export default function DashboardNotFound() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-muted/30 px-4 py-12">
      <div className="flex w-full max-w-md flex-col items-center gap-5 rounded-xl border border-border bg-card px-6 py-10 text-center">
        <SearchX className="size-9 text-muted-foreground" aria-hidden="true" />

        <div className="space-y-2">
          <h1 className="font-heading text-xl font-semibold tracking-tight">
            Écran introuvable
          </h1>
          <p className="text-sm text-muted-foreground">
            Cette adresse ne correspond à aucun écran de gestion. Le contenu a
            peut-être été supprimé, ou le lien est périmé.
          </p>
        </div>

        <Button asChild variant="outline" className="w-full sm:w-auto">
          <Link href="/dashboard">
            <ArrowLeft className="size-4" aria-hidden="true" />
            Revenir au tableau de bord
          </Link>
        </Button>
      </div>
    </div>
  );
}
