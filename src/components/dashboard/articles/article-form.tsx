"use client";

import { CalendarClock, Timer } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import type { FieldDescriptor } from "@/core/cms/blocks/types";
import type { Article, ArticleCategory } from "@/core/cms/entities/article";
import {
  articleFormSchema,
  SANS_CATEGORIE,
  type ArticleFormInput,
} from "@/core/cms/schemas/article.schema";
import { tempsDeLecture } from "@/core/shared/reading-time";
import { slugify } from "@/core/shared/slug";
import { estAVenir, formatDate } from "@/lib/dates";
import { siteUrl } from "@/lib/site-config";
import {
  creerArticleAction,
  mettreAJourArticleAction,
} from "@/server/actions/articles.actions";

import { SchemaForm } from "../forms/schema-form";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  LE FORMULAIRE D'UN ARTICLE — création et modification
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * §8B du Rapport 2. Un seul composant pour les deux écrans : les champs sont
 * les mêmes, seul l'appel de fin diffère.
 *
 * ---------------------------------------------------------------------------
 * AUCUN JSX DE FORMULAIRE N'EST ÉCRIT ICI
 * ---------------------------------------------------------------------------
 * Neuf descripteurs et `<SchemaForm>`. Libellé associé, `role="alert"`,
 * `aria-describedby`, champs à 44 px, `text-base` sous `md:`, barre
 * d'enregistrement collante : tout cela est recetté depuis le Lot 6 et n'est
 * pas réécrit.
 *
 * ---------------------------------------------------------------------------
 * LES CATÉGORIES SONT REÇUES EN PROPS, PAS CHARGÉES ICI
 * ---------------------------------------------------------------------------
 * Même règle qu'à l'écart nº 40 pour le champ `reference` : c'est l'écran, un
 * Server Component, qui lit la liste et la passe. Un champ qui va chercher ses
 * options produirait un aller-retour après le rendu et une liste déroulante
 * vide en attendant.
 *
 * ⚠️  La liste peut être VIDE — aucune catégorie n'a encore été créée, ou la
 * lecture a échoué. Le champ le dit alors explicitement plutôt que d'afficher
 * une liste déroulante sans option, qui passerait pour une panne.
 */

/** Les neuf champs du §8B, dans l'ordre de saisie. */
function champsArticle(categories: readonly ArticleCategory[]): FieldDescriptor[] {
  return [
    {
      kind: "text",
      name: "title",
      label: "Titre de l'article",
      required: true,
      maxLength: 160,
      placeholder: "Campagne de santé communautaire",
      hint: "Le titre affiché en haut de l'article, sur les cartes et dans les résultats de recherche.",
    },
    {
      kind: "text",
      name: "slug",
      label: "Adresse de la page",
      required: true,
      maxLength: 80,
      hint: "Proposée automatiquement à partir du titre. Vous pouvez la corriger tant que l'article n'est pas en ligne : la modifier ensuite casse les liens déjà partagés.",
    },
    {
      kind: "select",
      name: "categoryId",
      label: "Catégorie",
      required: true,
      options: [
        ...categories.map((categorie) => ({
          value: categorie.id,
          label: categorie.label,
        })),
        /*
          « Sans catégorie » est une OPTION, pas l'absence d'option.

          Radix refuse `<SelectItem value="">`, et surtout : un article sans
          catégorie est un choix légitime — il apparaît alors dans « Toutes »
          sans pastille. Le dire explicitement vaut mieux que de laisser la
          liste sur son texte de remplacement, qu'on prend pour un oubli.
        */
        { value: SANS_CATEGORIE, label: "Sans catégorie" },
      ],
      hint:
        categories.length === 0
          ? "Aucune catégorie n'existe pour l'instant. Créez-en depuis « Gérer les catégories », sur la liste des actualités."
          : "Détermine la pastille de la carte et le filtre de la page Actualités.",
    },
    {
      kind: "date",
      name: "publishedAt",
      label: "Date de publication",
      nullable: true,
      hint: "Peut être dans le passé, pour reprendre un article ancien, comme dans le futur : l'article ne sera alors visible qu'à partir de cette date. Laissée vide, elle est fixée automatiquement à la mise en ligne.",
    },
    {
      kind: "number",
      name: "readingMinutes",
      label: "Temps de lecture",
      nullable: true,
      min: 1,
      max: 240,
      unit: "min",
      hint: "Estimé à 200 mots par minute d'après le texte, et modifiable. Sans valeur, la mention n'est pas affichée sur le site.",
    },
    {
      kind: "textarea",
      name: "excerpt",
      label: "Chapô",
      required: true,
      maxLength: 300,
      rows: 3,
      hint: "Une à deux phrases. C'est ce texte qui apparaît sur les cartes, en tête d'article et dans les résultats de recherche Google.",
    },
    {
      kind: "richtext",
      name: "body",
      label: "Texte de l'article",
      required: true,
      hint: "Laissez une ligne vide entre deux paragraphes. Chaque paragraphe est affiché séparément sur le site.",
    },
    {
      kind: "media",
      name: "coverMediaId",
      label: "Image de couverture",
      accept: "image",
      hint: "Affichée en haut de l'article et sur sa carte. Tant qu'aucune image n'est choisie, le site conserve le visuel actuel.",
    },
    {
      kind: "boolean",
      name: "isPlaceholder",
      label: "Exemple de mise en page",
      hint: "Coché, un badge « Exemple » est affiché sur le site pour prévenir le lecteur que ce texte n'est pas un fait réel. À décocher dès que l'article raconte une action véritable.",
    },
  ];
}

/** Les clés du formulaire — pour rattacher une erreur serveur au bon champ. */
const CLES_FORMULAIRE = [
  "title",
  "slug",
  "categoryId",
  "publishedAt",
  "readingMinutes",
  "excerpt",
  "body",
  "coverMediaId",
  "isPlaceholder",
] as const satisfies readonly (keyof ArticleFormInput)[];

/** Valeurs d'un formulaire vierge. Aucune n'est inventée : elles sont vides. */
const VALEURS_VIERGES: ArticleFormInput = {
  title: "",
  slug: "",
  categoryId: SANS_CATEGORIE,
  publishedAt: null,
  readingMinutes: null,
  excerpt: "",
  body: [],
  coverMediaId: null,
  isPlaceholder: false,
};

export function ArticleForm({
  article,
  categories,
}: {
  /** `undefined` = création. */
  article?: Article;
  categories: readonly ArticleCategory[];
}) {
  const router = useRouter();
  const creation = article === undefined;

  // `useMemo` : `champsArticle` construit un tableau, et le reconstruire à
  // chaque frappe remonterait tous les champs du formulaire.
  const champs = useMemo(() => champsArticle(categories), [categories]);

  const valeurs: ArticleFormInput = article
    ? {
        title: article.title,
        slug: article.slug,
        // Une catégorie supprimée entre-temps ne doit pas laisser la liste
        // déroulante sur une valeur inconnue : elle retombe sur « Sans
        // catégorie », visible et corrigeable.
        categoryId:
          article.categoryId && categories.some((c) => c.id === article.categoryId)
            ? article.categoryId
            : SANS_CATEGORIE,
        publishedAt: article.publishedAt,
        readingMinutes: article.readingMinutes,
        excerpt: article.excerpt,
        body: article.body,
        coverMediaId: article.coverMediaId,
        isPlaceholder: article.isPlaceholder,
      }
    : VALEURS_VIERGES;

  return (
    <SchemaForm<ArticleFormInput>
      fields={champs}
      schema={articleFormSchema}
      defaultValues={valeurs}
      submitLabel={creation ? "Créer l'article" : "Enregistrer les modifications"}
      onSubmit={async (saisie, outils) => {
        /*
          La sentinelle redevient `null` ICI, à la frontière du serveur.

          Le schéma ne peut pas s'en charger : une transformation lui donnerait
          un type d'entrée différent de son type de sortie, ce que
          `<SchemaForm>` refuse (voir l'en-tête d'`article.schema.ts`).
        */
        const charge = {
          ...saisie,
          categoryId:
            saisie.categoryId === SANS_CATEGORIE ? null : saisie.categoryId,
        };

        const resultat = creation
          ? await creerArticleAction(charge)
          : await mettreAJourArticleAction({ id: article.id, ...charge });

        if (resultat.ok) {
          if (creation) {
            toast.success(
              "Article créé, en brouillon. Il n'est pas encore visible sur le site.",
            );
            router.push(`/dashboard/actualites/${resultat.data.id}`);
          } else {
            toast.success("Modifications enregistrées.");
            // Les données de la page viennent du rendu serveur : sans ce
            // rafraîchissement, l'en-tête garderait l'ancien titre.
            router.refresh();
          }
          return;
        }

        /*
          Erreur de champ → sous le champ concerné ; erreur générale → bandeau
          en tête de formulaire.

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
      <AdressePublique creation={creation} />
      <TempsDeLectureAssistant creation={creation} />
      <DatePubliee />
    </SchemaForm>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
 * Adresse publique — proposition automatique et aperçu
 * ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Jumeau de `<AdressePublique>` du Lot 8A, à un préfixe d'URL près.
 *
 * Le raisonnement complet est dans `programme-form.tsx` ; les deux points qui
 * comptent :
 *
 *   1. en MODIFICATION, l'adresse n'est jamais reproposée — réécrire le slug
 *      d'un article publié parce qu'on corrige une faute dans son titre casse
 *      les liens entrants, et un article se partage bien plus qu'une page de
 *      programme ;
 *   2. en CRÉATION, la proposition cesse dès que l'utilisateur a modifié
 *      l'adresse à la main.
 *
 * ⚠️  Le composant n'a PAS été factorisé avec celui du Lot 8A. Ils partageraient
 * quinze lignes et divergeraient sur le reste : préfixe d'URL, message d'aide,
 * et surtout la règle nº 1, qui n'a pas la même portée pour une page de
 * programme (rarement partagée) et pour un article (partagé le jour même). Un
 * composant générique aurait rendu ces différences invisibles.
 */
function AdressePublique({ creation }: { creation: boolean }) {
  const { control, setValue } = useFormContext<ArticleFormInput>();

  const titre = useWatch({ control, name: "title" });
  const adresse = useWatch({ control, name: "slug" });

  const derniereProposition = useRef<string | null>(creation ? "" : null);

  useEffect(() => {
    if (!creation || derniereProposition.current === null) return;

    // L'adresse ne correspond plus à ce qu'on avait proposé : quelqu'un l'a
    // saisie à la main. On se retire définitivement.
    if (adresse !== derniereProposition.current) {
      derniereProposition.current = null;
      return;
    }

    const propose = slugify(titre ?? "");
    if (propose === adresse) return;

    derniereProposition.current = propose;
    // `shouldDirty: false` : une valeur PROPOSÉE n'est pas une modification de
    // l'utilisateur.
    setValue("slug", propose, { shouldDirty: false });
  }, [adresse, creation, setValue, titre]);

  return (
    <p className="rounded-lg border border-dashed border-border bg-muted/30 px-3 py-2.5 text-sm">
      <span className="text-muted-foreground">Adresse publique : </span>
      {/* `break-all` : une adresse longue revient à la ligne dans son encadré,
          elle n'élargit jamais la page (règle 2 du §12). */}
      <span className="break-all font-medium text-foreground">
        {apercuAdresse(adresse)}
      </span>
    </p>
  );
}

/** L'URL telle qu'elle apparaîtra, sans protocole — plus lisible. */
function apercuAdresse(slug: string | undefined): string {
  const domaine = siteUrl.replace(/^https?:\/\//, "").replace(/\/$/, "");
  return `${domaine}/actualites/${slug || "…"}`;
}

/* ═══════════════════════════════════════════════════════════════════════════
 * Temps de lecture — calculé à 200 mots/min, et modifiable
 * ═══════════════════════════════════════════════════════════════════════════ */

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  DEUX COMPORTEMENTS, ET LA RAISON DE LA DIFFÉRENCE
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * §8B : « temps de lecture **calculé** (200 mots/min) et modifiable ».
 *
 * **À la création**, la valeur est PROPOSÉE au fil de la frappe, exactement
 * comme l'adresse — et elle cesse de l'être dès que l'utilisateur saisit la
 * sienne. Un champ vide qu'il faut remplir à la main pour une valeur que la
 * machine sait calculer serait une corvée sans raison.
 *
 * **À la modification**, jamais automatiquement. Les trois articles existants
 * portent des durées choisies à la main (3, 2 et 2 minutes) que le calcul
 * ramènerait à 1 : ouvrir un article pour corriger une virgule aurait modifié
 * une donnée que personne n'a touchée — et rendu fausse la comparaison
 * avant/après qu'exige la recette du §8x.
 *
 * L'estimation reste offerte, sous forme de BOUTON. C'est la différence entre
 * « le logiciel a décidé » et « le logiciel a proposé » : la seconde forme se
 * refuse, la première se subit.
 */
function TempsDeLectureAssistant({ creation }: { creation: boolean }) {
  const { control, setValue } = useFormContext<ArticleFormInput>();

  const corps = useWatch({ control, name: "body" });
  const minutes = useWatch({ control, name: "readingMinutes" });

  const paragraphes = useMemo(() => corps ?? [], [corps]);
  const estimation = tempsDeLecture(paragraphes);

  /** La dernière valeur proposée, ou `null` quand on a cessé de proposer. */
  const derniereProposition = useRef<number | null | undefined>(
    creation ? null : undefined,
  );

  useEffect(() => {
    if (!creation || derniereProposition.current === undefined) return;

    // La valeur ne correspond plus à ce qu'on avait proposé : l'utilisateur a
    // saisi la sienne. On se retire définitivement.
    if (minutes !== derniereProposition.current) {
      derniereProposition.current = undefined;
      return;
    }

    if (estimation === minutes) return;

    derniereProposition.current = estimation;
    setValue("readingMinutes", estimation, { shouldDirty: false });
  }, [creation, estimation, minutes, setValue]);

  /*
    Rien à proposer : on est en création — l'effet ci-dessus s'en charge et
    afficher le bloc ferait clignoter un encart aussitôt devenu faux —, il n'y
    a pas de texte, ou la valeur saisie est déjà l'estimation.
  */
  if (creation || estimation === null || estimation === minutes) return null;

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border border-dashed border-border bg-muted/30 px-3 py-2.5 text-sm">
      <span className="inline-flex items-center gap-1.5 text-muted-foreground">
        <Timer className="size-4 shrink-0" aria-hidden="true" />
        D&apos;après le texte, la lecture prend environ{" "}
        <strong className="font-medium text-foreground">
          {estimation} min
        </strong>
        .
      </span>

      {/*
        ⚠️  PAS DE `size="sm"` ICI, ET LA RECETTE L'A TROUVÉ.

        La variante `sm` de `Button` fait 36 px de haut : sous les 44 px
        qu'exige la règle 4 du §12, et ce bouton EST une commande réelle, pas
        une décoration. `min-h-11` le porte à 44 px sans changer sa largeur ni
        déplacer quoi que ce soit d'autre.
      */}
      <Button
        type="button"
        variant="outline"
        className="min-h-11"
        onClick={() =>
          setValue("readingMinutes", estimation, { shouldDirty: true })
        }
      >
        Utiliser cette estimation
      </Button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
 * Date de publication à venir — la dire, faute de quoi elle passe pour un raté
 * ═══════════════════════════════════════════════════════════════════════════ */

/**
 * §8B, troisième point à ne pas manquer : « la RLS filtre déjà
 * `published_at <= now()`, donc une date future ne fuit pas — mais l'écran
 * doit le DIRE, sinon l'utilisateur croira sa publication ratée. »
 *
 * Le champ lui-même signale « À venir » ; ici, on explique la CONSÉQUENCE, ce
 * que seul cet écran peut faire — le champ de date, générique, ne sait pas
 * qu'il sert à publier.
 */
function DatePubliee() {
  const { control } = useFormContext<ArticleFormInput>();
  const publiee = useWatch({ control, name: "publishedAt" });

  // La double condition narrow le type : `estAVenir` renvoie un booléen, pas
  // un prédicat de type — sans le premier test, `publiee` resterait nullable.
  if (!publiee || !estAVenir(publiee)) return null;

  return (
    <p className="flex items-start gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2.5 text-sm text-foreground">
      <CalendarClock className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <span>
        Cette date est dans le futur. Même publié, l&apos;article restera
        invisible du public jusqu&apos;au{" "}
        <strong className="font-medium">{formatDate(publiee)}</strong>. Ce
        n&apos;est pas une erreur : c&apos;est une publication programmée.
      </span>
    </p>
  );
}
