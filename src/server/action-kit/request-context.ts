import "server-only";

import { headers } from "next/headers";

/**
 * Adresse IP de l'appelant, pour la limitation de débit et le journal d'audit.
 *
 * Derrière Vercel, `x-forwarded-for` contient la chaîne des relais traversés ;
 * la première entrée est le client d'origine.
 *
 * ⚠️  Cette valeur est DÉCLARATIVE : un client peut forger l'en-tête. Elle
 * suffit à freiner un script naïf, ce qui est tout ce qu'on attend d'une
 * limitation par IP — mais elle ne doit jamais servir à une décision
 * d'autorisation. L'autorisation, c'est la session et le rôle relu en base.
 */
export async function adresseAppelante(): Promise<string> {
  const entetes = await headers();

  const transmise = entetes.get("x-forwarded-for");
  if (transmise) {
    const premiere = transmise.split(",")[0]?.trim();
    if (premiere) return premiere;
  }

  return entetes.get("x-real-ip")?.trim() ?? "inconnue";
}

/**
 * IP au format `inet` de PostgreSQL, ou `null`.
 *
 * `audit_logs.ip` est typée `inet` : une valeur non analysable ferait échouer
 * l'insertion. Mieux vaut un journal sans IP qu'une action qui échoue parce
 * que son journal n'a pas pu s'écrire.
 */
export async function adresseAppelanteInet(): Promise<string | null> {
  const ip = await adresseAppelante();
  return ip !== "inconnue" && /^[0-9a-fA-F.:]+$/.test(ip) ? ip : null;
}

/** Navigateur de l'appelant, conservé au journal d'audit. */
export async function userAgentAppelant(): Promise<string | null> {
  const entetes = await headers();
  return entetes.get("user-agent");
}
