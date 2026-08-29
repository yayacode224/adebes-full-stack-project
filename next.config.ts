import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    /**
     * AVIF puis WebP : le premier format accepté par le navigateur est servi.
     * Sur une connexion mobile camerounaise, l'écart de poids avec un JPEG
     * d'origine est de l'ordre de 50 à 70 %.
     */
    formats: ["image/avif", "image/webp"],

    /**
     * Images de marque livrées avec le dépôt (`/public/images/…`) : logo,
     * icônes, image Open Graph par défaut. Restreindre explicitement les
     * chemins autorisés évite qu'un chemin arbitraire soit passé à
     * l'optimiseur.
     */
    localPatterns: [
      { pathname: "/images/**", search: "" },
      { pathname: "/documents/**", search: "" },
    ],

    /**
     * Médias éditoriaux servis par Supabase Storage (décision D5).
     *
     * Sans cette entrée, `next/image` refuse toutes les images de la
     * médiathèque — c'est la première cause d'écran vide au Lot 7.
     *
     * Le nom d'hôte est écrit en dur : `remotePatterns` n'accepte pas de
     * variable d'environnement, la valeur doit être analysable au build. Il
     * correspond à `NEXT_PUBLIC_SUPABASE_URL` dans `.env.local` — les deux
     * doivent être changés ensemble si le projet Supabase change.
     *
     * `pathname` est restreint aux objets publics : une URL signée ou un
     * chemin d'administration ne passera pas par l'optimiseur.
     */
    remotePatterns: [
      {
        protocol: "https",
        hostname: "vulqavwbfybwqrufgctj.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },

  /**
   * L'en-tête `X-Powered-By` révèle la pile technique utilisée sans apporter
   * aucun bénéfice.
   */
  poweredByHeader: false,

  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // Empêche l'interprétation d'un fichier dans un type différent de
          // celui annoncé.
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Le site n'a pas vocation à être affiché dans une iframe tierce.
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          // Ne transmet l'URL complète qu'aux pages du même site.
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          // Aucune de ces API n'est utilisée par le site.
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
