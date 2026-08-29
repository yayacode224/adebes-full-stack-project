"use server";

import { Resend } from "resend";

import {
  contactSchema,
  volunteerSchema,
  type ContactInput,
  type VolunteerInput,
} from "@/lib/schemas";
import { contact, siteConfig } from "@/lib/site-config";
import { getLibellesBenevolat } from "@/server/queries/programmes.query";

export type FormResult =
  | { ok: true; message: string }
  | { ok: false; message: string; fieldErrors?: Record<string, string> };

/**
 * Une variable d'environnement déclarée mais vide est une chaîne vide, pas
 * `undefined` : on la nettoie systématiquement avant de la considérer comme
 * renseignée.
 */
function env(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

const RESEND_API_KEY = env(process.env.RESEND_API_KEY);
const CONTACT_TO = env(process.env.CONTACT_EMAIL_TO) ?? contact.email;
const CONTACT_FROM = env(process.env.CONTACT_EMAIL_FROM);

/**
 * Message affiché lorsque l'envoi d'e-mail n'est pas configuré.
 *
 * Plutôt que de faire croire à un envoi réussi, on l'annonce et on redirige
 * vers les canaux qui, eux, fonctionnent. C'est le seul comportement
 * acceptable pour une association : un message de bénévole perdu en silence
 * est pire qu'une erreur affichée.
 */
const NOT_CONFIGURED = `L'envoi automatique n'est pas encore activé. Écrivez-nous directement à ${contact.email} ou sur WhatsApp au ${contact.phoneDisplay}.`;

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderRows(rows: [string, string][]): string {
  return rows
    .filter(([, value]) => value.trim().length > 0)
    .map(
      ([label, value]) =>
        `<tr><td style="padding:6px 12px 6px 0;color:#55708f;font-size:13px;vertical-align:top">${escapeHtml(label)}</td><td style="padding:6px 0;color:#0f2d52;font-size:14px;white-space:pre-wrap">${escapeHtml(value)}</td></tr>`,
    )
    .join("");
}

function wrapEmail(title: string, rows: [string, string][]): string {
  return `<div style="font-family:system-ui,-apple-system,Segoe UI,sans-serif;background:#fafafa;padding:24px">
  <div style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #d9e2ec;border-radius:12px;padding:24px">
    <h1 style="margin:0 0 4px;font-size:18px;color:#0f2d52">${escapeHtml(title)}</h1>
    <p style="margin:0 0 20px;font-size:13px;color:#55708f">Envoyé depuis ${escapeHtml(siteConfig.url)}</p>
    <table style="width:100%;border-collapse:collapse">${renderRows(rows)}</table>
  </div>
</div>`;
}

async function sendEmail({
  subject,
  html,
  replyTo,
}: {
  subject: string;
  html: string;
  replyTo: string;
}): Promise<FormResult> {
  if (!RESEND_API_KEY || !CONTACT_FROM) {
    console.warn(
      "[ADEBES] RESEND_API_KEY ou CONTACT_EMAIL_FROM manquant : e-mail non envoyé.",
    );
    return { ok: false, message: NOT_CONFIGURED };
  }

  try {
    const resend = new Resend(RESEND_API_KEY);
    const { error } = await resend.emails.send({
      from: CONTACT_FROM,
      to: CONTACT_TO,
      replyTo,
      subject,
      html,
    });

    if (error) {
      console.error("[ADEBES] Erreur Resend :", error);
      return {
        ok: false,
        message: `Votre message n'a pas pu être envoyé. Réessayez, ou contactez-nous au ${contact.phoneDisplay}.`,
      };
    }

    return {
      ok: true,
      message: "Message bien reçu. Nous vous répondons dans les meilleurs délais.",
    };
  } catch (cause) {
    console.error("[ADEBES] Échec d'envoi :", cause);
    return {
      ok: false,
      message: `Une erreur technique est survenue. Écrivez-nous à ${contact.email}.`,
    };
  }
}

export async function submitContact(input: ContactInput): Promise<FormResult> {
  const parsed = contactSchema.safeParse(input);

  if (!parsed.success) {
    return { ok: false, message: "Certains champs sont invalides." };
  }

  // Champ piège rempli : robot. On répond « ok » sans rien envoyer, pour ne
  // pas lui indiquer que le piège a été détecté.
  if (parsed.data.website) {
    return { ok: true, message: "Message bien reçu." };
  }

  const { name, email, phone, subject, message } = parsed.data;

  return sendEmail({
    subject: `[Contact ADEBES] ${subject} — ${name}`,
    replyTo: email,
    html: wrapEmail("Nouveau message depuis le formulaire de contact", [
      ["Nom", name],
      ["E-mail", email],
      ["Téléphone", phone ?? ""],
      ["Sujet", subject],
      ["Message", message],
    ]),
  });
}

export async function submitVolunteer(
  input: VolunteerInput,
): Promise<FormResult> {
  const parsed = volunteerSchema.safeParse(input);

  if (!parsed.success) {
    return { ok: false, message: "Certains champs sont invalides." };
  }

  if (parsed.data.website) {
    return { ok: true, message: "Candidature bien reçue." };
  }

  const { name, email, phone, city, domain, availability, message } =
    parsed.data;

  /*
    ═════════════════════════════════════════════════════════════════════════
     LE DOMAINE EST VÉRIFIÉ ICI, ET NULLE PART AILLEURS (§8A.2, Lot 8A)
    ═════════════════════════════════════════════════════════════════════════

    `volunteerSchema` ne valide que la FORME du champ (`z.string().min(1)`) :
    un schéma partagé client/serveur est évalué à l'import, il ne peut pas
    interroger la base. L'appartenance à la liste réelle des domaines est donc
    vérifiée à cet endroit — le seul qui soit hors de portée du navigateur.

    Sans cette vérification, un POST direct ferait arriver dans la boîte de
    l'association une candidature pour un domaine inventé, indistinguable
    d'une vraie.

    Le message NOMME les domaines disponibles : quelqu'un dont le formulaire
    est resté ouvert pendant qu'un programme était dépublié doit comprendre
    quoi faire, pas seulement qu'il s'est trompé.
  */
  const domainesAutorises = await getLibellesBenevolat();

  if (!domainesAutorises.includes(domain)) {
    return {
      ok: false,
      message:
        domainesAutorises.length === 0
          ? "Les domaines d'engagement ne sont pas disponibles pour le moment. Écrivez-nous directement, nous vous orienterons."
          : `Ce domaine d'engagement n'existe plus. Choisissez-en un autre : ${domainesAutorises.join(", ")}.`,
      fieldErrors: { domain: "Choisissez un domaine dans la liste." },
    };
  }

  const result = await sendEmail({
    subject: `[Bénévolat ADEBES] ${domain} — ${name}`,
    replyTo: email,
    html: wrapEmail("Nouvelle candidature de bénévole", [
      ["Nom", name],
      ["E-mail", email],
      ["Téléphone", phone],
      ["Ville", city],
      ["Domaine d'intérêt", domain],
      ["Disponibilités", availability],
      ["Message", message ?? ""],
    ]),
  });

  return result.ok
    ? {
        ok: true,
        message:
          "Candidature bien reçue. Un membre de l'équipe vous recontacte rapidement.",
      }
    : result;
}
