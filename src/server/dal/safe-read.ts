import "server-only";

/**
 * Sépare la lecture, qui peut lever, de la construction du JSX qui en
 * dépend — jamais l'inverse.
 *
 * `react-hooks/error-boundaries` (règle ESLint du compilateur React) refuse
 * qu'un composant soit construit à l'intérieur d'un `try`/`catch` : React ne
 * rend pas la JSX immédiatement à l'appel, une erreur de RENDU échapperait
 * donc au `catch` qui l'entoure — seule une erreur de LECTURE y est
 * réellement attrapée, ce qui rend le bloc trompeur à la relecture.
 *
 * Les six écrans de réglages du Lot 10 lisent tous un port qui peut lever
 * (`SupabaseSettingsRepository`, `SupabaseNavigationRepository`, absence de
 * `Result` côté lecture — voir `settings.port.ts`) avant de construire leur
 * JSX. Cette fonction fait UNE fois ce que chacun aurait sinon réimplémenté :
 * la lecture reste dans son `try`, le choix de la JSX à rendre vient après,
 * dans l'appelant.
 */
export async function lireOuErreur<T>(
  lire: () => Promise<T>,
): Promise<{ ok: true; value: T } | { ok: false; message: string }> {
  try {
    return { ok: true, value: await lire() };
  } catch (erreur) {
    return {
      ok: false,
      message: erreur instanceof Error ? erreur.message : "Erreur inconnue.",
    };
  }
}
