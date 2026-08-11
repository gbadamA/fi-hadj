import { Injectable, Logger, type OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createTransport, type Transporter } from "nodemailer";
import type { Edition, Registration } from "@prisma/client";
import {
  REGISTRATION_TYPE_LABELS,
  formatDateRange,
  formatFullName,
  type Civility,
  type RegistrationType,
} from "@fihadj/shared-types";
import { button, detailsTable, highlight, renderLayout } from "./mail.templates";

@Injectable()
export class MailService implements OnModuleInit {
  private readonly logger = new Logger(MailService.name);
  private transporter: Transporter | null = null;
  private from!: string;
  private webUrl!: string;

  constructor(private readonly config: ConfigService) {}

  onModuleInit(): void {
    this.from = this.config.get<string>("MAIL_FROM") ?? "FI-HADJ <no-reply@fi-hadj.ci>";
    this.webUrl = this.config.get<string>("PUBLIC_WEB_URL") ?? "http://localhost:3050";

    const host = this.config.get<string>("SMTP_HOST");
    if (!host) {
      // Pas de SMTP configuré : on trace au lieu d'échouer. Une inscription ne
      // doit jamais être perdue parce que la messagerie n'est pas branchée.
      this.logger.warn("SMTP non configuré — les emails seront seulement journalisés.");
      return;
    }
    this.transporter = createTransport({
      host,
      port: Number(this.config.get<string>("SMTP_PORT") ?? 587),
      secure: this.config.get<string>("SMTP_SECURE") === "true",
      auth: this.config.get<string>("SMTP_USER")
        ? {
            user: this.config.get<string>("SMTP_USER"),
            pass: this.config.get<string>("SMTP_PASSWORD"),
          }
        : undefined,
    });
  }

  private async send(options: {
    to: string;
    subject: string;
    html: string;
    attachments?: { filename: string; content: Buffer; contentType: string }[];
  }): Promise<void> {
    if (!this.transporter) {
      this.logger.log(`[email simulé] à ${options.to} — ${options.subject}`);
      return;
    }
    try {
      await this.transporter.sendMail({ from: this.from, ...options });
      this.logger.log(`Email envoyé à ${options.to} — ${options.subject}`);
    } catch (error) {
      // Un SMTP indisponible ne doit pas annuler l'inscription déjà enregistrée.
      this.logger.error(`Échec d'envoi à ${options.to} : ${String(error)}`);
    }
  }

  private eventLine(edition: Edition): string {
    return `${formatDateRange(edition.startDate, edition.endDate)} — ${edition.venue}, ${edition.city}`;
  }

  private who(registration: Registration): string {
    return formatFullName(
      registration.civility as Civility,
      registration.firstName,
      registration.lastName,
    );
  }

  /** Accusé de réception — l'inscription est enregistrée, pas encore validée. */
  async sendRegistrationReceived(registration: Registration, edition: Edition): Promise<void> {
    const html = renderLayout({
      title: "Inscription enregistrée",
      preheader: `Votre demande ${registration.reference} est bien enregistrée.`,
      bodyHtml: `
        <p style="margin:0 0 12px;">Bonjour ${this.who(registration)},</p>
        <p style="margin:0 0 12px;">Votre demande d'inscription au <strong>${edition.title}</strong>
        en qualité de <strong>${REGISTRATION_TYPE_LABELS[registration.type as RegistrationType]}</strong>
        a bien été enregistrée.</p>
        ${highlight("Votre référence", registration.reference)}
        <p style="margin:0 0 12px;">Conservez cette référence : elle vous sera demandée à l'accueil.
        Le Commissariat Général examine chaque demande ; vous recevrez votre badge par email
        dès la validation.</p>
        ${detailsTable([
          ["Événement", edition.title],
          ["Thème", edition.theme],
          ["Dates et lieu", this.eventLine(edition)],
          ["Organisation", registration.organization ?? ""],
          ["Pays", registration.country],
        ])}
        ${button("Consulter le programme", `${this.webUrl}/programme`)}`,
      footerNote:
        "Cette confirmation ne vaut pas encore autorisation d'accès : attendez la validation et le badge.",
    });
    await this.send({
      to: registration.email,
      subject: `FI-HADJ — inscription enregistrée (${registration.reference})`,
      html,
    });
  }

  /** Validation + badge PDF en pièce jointe. */
  async sendRegistrationValidated(
    registration: Registration,
    edition: Edition,
    badge: Buffer,
  ): Promise<void> {
    const html = renderLayout({
      title: "Inscription validée",
      preheader: `Votre badge FI-HADJ ${registration.reference} est en pièce jointe.`,
      bodyHtml: `
        <p style="margin:0 0 12px;">Bonjour ${this.who(registration)},</p>
        <p style="margin:0 0 12px;">Le Commissariat Général a le plaisir de confirmer votre
        inscription au <strong>${edition.title}</strong>.</p>
        ${highlight("Votre référence", registration.reference)}
        <p style="margin:0 0 12px;"><strong>Votre badge est joint à cet email.</strong>
        Imprimez-le ou présentez-le sur votre téléphone : le QR code sera scanné à l'entrée.</p>
        ${detailsTable([
          ["Qualité", REGISTRATION_TYPE_LABELS[registration.type as RegistrationType]],
          ["Dates et lieu", this.eventLine(edition)],
        ])}
        ${button("Préparer ma venue", `${this.webUrl}/programme`)}`,
    });
    await this.send({
      to: registration.email,
      subject: `FI-HADJ — inscription validée, votre badge (${registration.reference})`,
      html,
      attachments: [
        {
          filename: `badge-${registration.reference}.pdf`,
          content: badge,
          contentType: "application/pdf",
        },
      ],
    });
  }

  async sendRegistrationRejected(
    registration: Registration,
    edition: Edition,
    reason: string | null,
  ): Promise<void> {
    const html = renderLayout({
      title: "Suite donnée à votre inscription",
      preheader: `Votre demande ${registration.reference} n'a pas pu être retenue.`,
      bodyHtml: `
        <p style="margin:0 0 12px;">Bonjour ${this.who(registration)},</p>
        <p style="margin:0 0 12px;">Après examen, votre demande d'inscription au
        <strong>${edition.title}</strong> (référence ${registration.reference})
        n'a pas pu être retenue.</p>
        ${reason ? `<p style="margin:0 0 12px;"><strong>Motif :</strong> ${reason}</p>` : ""}
        <p style="margin:0 0 12px;">Pour toute question, le Commissariat Général reste à votre
        disposition via le formulaire de contact du site.</p>
        ${button("Nous contacter", `${this.webUrl}/contact`)}`,
    });
    await this.send({
      to: registration.email,
      subject: `FI-HADJ — suite donnée à votre inscription (${registration.reference})`,
      html,
    });
  }

  /** Rappel avant l'ouverture du forum (cahier §8 « rappels avant l'événement »). */
  async sendEventReminder(
    registration: Registration,
    edition: Edition,
    daysBefore: number,
  ): Promise<void> {
    const html = renderLayout({
      title: "Le forum approche",
      preheader: `Plus que ${daysBefore} jour(s) avant le FI-HADJ.`,
      bodyHtml: `
        <p style="margin:0 0 12px;">Bonjour ${this.who(registration)},</p>
        <p style="margin:0 0 12px;">Le <strong>${edition.title}</strong> ouvre dans
        <strong>${daysBefore} jour${daysBefore > 1 ? "s" : ""}</strong>.</p>
        ${detailsTable([
          ["Dates et lieu", this.eventLine(edition)],
          ["Votre référence", registration.reference],
        ])}
        <p style="margin:0 0 12px;">Pensez à vous munir de votre badge et d'une pièce d'identité.</p>
        ${button("Voir le programme", `${this.webUrl}/programme`)}`,
    });
    await this.send({
      to: registration.email,
      subject: `FI-HADJ — J-${daysBefore} avant l'ouverture`,
      html,
    });
  }

  async sendContactAcknowledgement(params: {
    name: string;
    email: string;
    subject: string;
  }): Promise<void> {
    const html = renderLayout({
      title: "Message bien reçu",
      preheader: "Le Commissariat Général a bien reçu votre message.",
      bodyHtml: `
        <p style="margin:0 0 12px;">Bonjour ${params.name},</p>
        <p style="margin:0 0 12px;">Nous avons bien reçu votre message
        « ${params.subject} ». Le Commissariat Général vous répondra dans les meilleurs délais.</p>`,
    });
    await this.send({
      to: params.email,
      subject: "FI-HADJ — nous avons bien reçu votre message",
      html,
    });
  }

  /** Notifie le compte d'un nouvel accès créé au back-office. */
  async sendAccountCreated(params: {
    to: string;
    fullName: string;
    roleLabel: string;
    temporaryPassword: string;
    adminUrl: string;
  }): Promise<void> {
    const html = renderLayout({
      title: "Votre accès au back-office FI-HADJ",
      preheader: "Un compte vient d'être créé pour vous.",
      bodyHtml: `
        <p style="margin:0 0 12px;">Bonjour ${params.fullName},</p>
        <p style="margin:0 0 12px;">Un accès au système de gestion du FI-HADJ vous a été ouvert
        avec le rôle <strong>${params.roleLabel}</strong>.</p>
        ${detailsTable([
          ["Identifiant", params.to],
          ["Mot de passe provisoire", params.temporaryPassword],
        ])}
        ${button("Ouvrir le back-office", params.adminUrl)}`,
      footerNote: "Changez ce mot de passe dès votre première connexion.",
    });
    await this.send({ to: params.to, subject: "FI-HADJ — votre accès au back-office", html });
  }
}
