import { SettingsTabs } from "@/components/dashboard/settings/settings-tabs";

/**
 * Layout partagé des six écrans de réglages (§10.1 du Rapport 2).
 *
 * Ne vérifie aucune permission : `settings:read` et `navigation:read` sont
 * accordées aux MÊMES rôles (`super_admin`, `admin` — absentes de `editor`,
 * `core/rbac/permissions.ts`), donc quiconque atteint l'une de ces six pages
 * a le droit de voir les six onglets. La garde reste sur chaque `page.tsx`
 * (`requirePermission`), jamais ici — même règle que le layout racine du
 * dashboard, qui ne fait que filtrer sa navigation, pas l'autoriser.
 */
export default function ReglagesLayout({
  children,
}: LayoutProps<"/dashboard/reglages">) {
  return (
    <div className="flex flex-col gap-6">
      <SettingsTabs />
      {children}
    </div>
  );
}
