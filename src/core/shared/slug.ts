/**
 * Fabrication d'adresses de page (« slugs »).
 *
 * Le contenu est en français : accents, apostrophes, œ et cédilles sont la
 * norme, pas l'exception. Une fonction de slug écrite pour l'anglais produit
 * ici des adresses fausses (« ducation », « protection-de-lenvironnement »).
 *
 * Cas de référence, tirés du contenu réel du site :
 *
 *   « Éducation »                      → education
 *   « Protection de l'environnement »  → protection-de-l-environnement
 *   « Women's Empowerment »            → women-s-empowerment
 *   « Santé & bien-être »              → sante-bien-etre
 */

/** Longueur maximale d'un slug — au-delà, l'URL devient illisible. */
export const SLUG_MAX_LENGTH = 80;

/**
 * Ligatures que la décomposition Unicode NFD ne sépare pas.
 *
 * « œ » et « æ » sont des caractères à part entière, pas des lettres accentuées :
 * NFD les laisse intacts et ils disparaîtraient au filtrage. « Sœur » deviendrait
 * « sur ».
 */
const LIGATURES: Record<string, string> = {
  œ: "oe",
  Œ: "oe",
  æ: "ae",
  Æ: "ae",
  ø: "o",
  Ø: "o",
  ß: "ss",
};

export function slugify(valeur: string): string {
  return (
    valeur
      // 1. Ligatures d'abord : NFD ne les traite pas.
      .replace(/[œŒæÆøØß]/g, (c) => LIGATURES[c] ?? c)
      .toLowerCase()
      // 2. NFD sépare « é » en « e » + accent aigu combinant…
      .normalize("NFD")
      // 3. …que l'on retire. L'intervalle est écrit en échappements explicites
      //    (bloc « Combining Diacritical Marks ») : des caractères combinants
      //    collés dans le code source sont invisibles à la relecture et
      //    survivent mal aux copier-coller.
      .replace(/[\u0300-\u036f]/g, "")
      // 4. Tout ce qui n'est ni lettre ASCII ni chiffre devient un tiret —
      //    apostrophes comprises, sous leurs deux formes (U+0027 droite et
      //    U+2019 typographique, que les traitements de texte insèrent seuls).
      //
      //    Un tiret et non du vide : « Protection de l'environnement » donne
      //    « protection-de-l-environnement », pas « protection-de-lenvironnement ».
      .replace(/[^a-z0-9]+/g, "-")
      // 5. Tirets consécutifs réduits à un seul.
      .replace(/-+/g, "-")
      // 6. Tirets de bord retirés.
      .replace(/^-|-$/g, "")
      .slice(0, SLUG_MAX_LENGTH)
      // 7. La troncature a pu recréer un tiret final.
      .replace(/-$/, "")
  );
}

/** Un slug est-il déjà sous sa forme canonique ? */
export function isValidSlug(valeur: string): boolean {
  return valeur.length > 0 && slugify(valeur) === valeur;
}

/**
 * Rend un slug unique au sein d'une liste existante, en suffixant un nombre.
 *
 * « education » → « education-2 » → « education-3 »…
 *
 * La numérotation commence à 2 : le premier « education » n'a pas de suffixe,
 * donc le suivant est bien le deuxième. Un « education-1 » suggérerait qu'il
 * existe un « education-0 ».
 *
 * La troncature tient compte du suffixe pour ne jamais dépasser la longueur
 * maximale.
 */
export function uniqueSlug(
  souhaite: string,
  existants: readonly string[],
): string {
  const base = slugify(souhaite);
  const pris = new Set(existants);
  if (!pris.has(base)) return base;

  for (let n = 2; ; n += 1) {
    const suffixe = `-${n}`;
    const tronque = base.slice(0, SLUG_MAX_LENGTH - suffixe.length).replace(/-$/, "");
    const candidat = `${tronque}${suffixe}`;
    if (!pris.has(candidat)) return candidat;
  }
}
