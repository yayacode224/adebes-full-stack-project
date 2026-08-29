/**
 * Deux initiales au plus, pour la pastille d'identité.
 *
 * Partagé par la barre latérale et la barre supérieure : les deux affichent la
 * même personne au même moment, et deux implémentations auraient fini par
 * diverger sur un cas limite — un nom composé, une adresse sans point.
 *
 * Sur une adresse e-mail, seule la partie avant `@` est lue : « CG » pour
 * `contact@gmail.com` désignerait le fournisseur de messagerie, pas la
 * personne connectée.
 *
 * `full_name` étant nullable en base, l'appelant passe déjà `fullName ?? email`.
 */
export function initiales(nom: string): string {
  const base = nom.includes("@") ? nom.split("@")[0] : nom;

  const mots = base
    .split(/[\s._-]+/)
    .filter(Boolean)
    .slice(0, 2);

  if (mots.length === 0) return "?";

  return mots.map((mot) => mot[0]!.toUpperCase()).join("");
}
