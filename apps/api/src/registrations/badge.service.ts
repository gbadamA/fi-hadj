import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import PDFDocument from "pdfkit";
import { toBuffer as qrToBuffer } from "qrcode";
import type { Edition, Registration } from "@prisma/client";
import {
  REGISTRATION_TYPE_LABELS,
  formatDateRange,
  formatFullName,
  type Civility,
  type RegistrationType,
} from "@fihadj/shared-types";

const NAVY = "#0B2A4A";
const AZURE = "#14507F";
const GOLD = "#C9A227";
const INK = "#0B1A2A";
const MUTED = "#5A6B7D";

/** Couleur de la pastille de qualité — miroir de `registrationColors` de la DA. */
const TYPE_COLOR: Record<RegistrationType, string> = {
  PARTICIPANT: "#2E7CB8",
  EXPOSANT: "#0E9F6E",
  SPONSOR: GOLD,
};

/**
 * Badge d'accès en PDF.
 *
 * PDFKit plutôt que Puppeteer : pas de Chromium à installer sur le serveur, pas
 * de rendu HTML à attendre, et un badge est un document à géométrie fixe — le
 * dessiner directement est plus simple que de le mettre en page en CSS.
 *
 * Format 100 × 140 mm : tient dans un porte-badge à cordon standard.
 */
@Injectable()
export class BadgeService {
  constructor(private readonly config: ConfigService) {}

  async generate(registration: Registration, edition: Edition): Promise<Buffer> {
    const width = mm(100);
    const height = mm(140);
    const doc = new PDFDocument({ size: [width, height], margin: 0 });

    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    const done = new Promise<Buffer>((resolve) => {
      doc.on("end", () => resolve(Buffer.concat(chunks)));
    });

    const type = registration.type as RegistrationType;
    const accent = TYPE_COLOR[type];

    // ── Bandeau supérieur : dégradé signature de la DA ──
    const headerHeight = mm(34);
    const header = doc.linearGradient(0, 0, width, headerHeight);
    header.stop(0, NAVY).stop(0.6, AZURE).stop(1, GOLD);
    doc.rect(0, 0, width, headerHeight).fill(header);

    doc
      .fillColor("#FFFFFF")
      .font("Helvetica")
      .fontSize(7)
      .text("FORUM INTERNATIONAL DU HADJ", 0, mm(8), { width, align: "center", characterSpacing: 2 });
    doc
      .font("Helvetica-Bold")
      .fontSize(26)
      .text("FI-HADJ", 0, mm(13), { width, align: "center", characterSpacing: 1 });
    doc
      .font("Helvetica")
      .fontSize(7.5)
      .fillColor("#FFFFFF")
      .text(`${edition.year} · ${edition.city}`, 0, mm(25), { width, align: "center" });

    // Filet doré — l'accent rare de la DA.
    doc.rect(0, headerHeight, width, mm(1.2)).fill(GOLD);

    // ── Qualité du porteur ──
    const chipWidth = mm(46);
    const chipY = headerHeight + mm(7);
    doc.roundedRect((width - chipWidth) / 2, chipY, chipWidth, mm(7), mm(3.5)).fill(accent);
    doc
      .fillColor("#FFFFFF")
      .font("Helvetica-Bold")
      .fontSize(8)
      .text(REGISTRATION_TYPE_LABELS[type].toUpperCase(), 0, chipY + mm(2.2), {
        width,
        align: "center",
        characterSpacing: 1,
      });

    // ── Identité ──
    const name = formatFullName(
      registration.civility as Civility,
      registration.firstName,
      registration.lastName,
    );
    doc
      .fillColor(INK)
      .font("Helvetica-Bold")
      .fontSize(name.length > 26 ? 14 : 17)
      .text(name, mm(6), chipY + mm(12), { width: width - mm(12), align: "center" });

    let cursor = doc.y + mm(1.5);
    if (registration.organization) {
      doc
        .fillColor(AZURE)
        .font("Helvetica-Bold")
        .fontSize(9.5)
        .text(registration.organization, mm(6), cursor, { width: width - mm(12), align: "center" });
      cursor = doc.y + mm(0.5);
    }
    if (registration.position) {
      doc
        .fillColor(MUTED)
        .font("Helvetica")
        .fontSize(8.5)
        .text(registration.position, mm(6), cursor, { width: width - mm(12), align: "center" });
      cursor = doc.y;
    }
    doc
      .fillColor(MUTED)
      .font("Helvetica")
      .fontSize(8)
      .text(registration.country, mm(6), cursor + mm(1), {
        width: width - mm(12),
        align: "center",
      });

    // ── QR code : la référence, vérifiable au poste de contrôle ──
    const verifyUrl = `${this.config.get<string>("PUBLIC_WEB_URL") ?? ""}/badge/${registration.reference}`;
    const qr = await qrToBuffer(verifyUrl, {
      errorCorrectionLevel: "M",
      margin: 0,
      width: 600,
      color: { dark: NAVY, light: "#FFFFFF" },
    });
    const qrSize = mm(38);
    const qrY = height - mm(58);
    doc.image(qr, (width - qrSize) / 2, qrY, { width: qrSize, height: qrSize });

    doc
      .fillColor(INK)
      .font("Helvetica-Bold")
      .fontSize(11)
      .text(registration.reference, 0, qrY + qrSize + mm(3), {
        width,
        align: "center",
        characterSpacing: 1,
      });

    // ── Pied : rappel des dates et du lieu ──
    doc.rect(0, height - mm(13), width, mm(13)).fill(NAVY);
    doc
      .fillColor("#FFFFFF")
      .font("Helvetica")
      .fontSize(7)
      .text(formatDateRange(edition.startDate, edition.endDate), 0, height - mm(10), {
        width,
        align: "center",
      });
    doc
      .fontSize(6.5)
      .fillColor("#C8D8E8")
      .text(`${edition.venue}, ${edition.city}`, 0, height - mm(6.5), {
        width,
        align: "center",
      });

    doc.end();
    return done;
  }
}

/** Millimètres → points PostScript (1 pt = 1/72 pouce). */
function mm(value: number): number {
  return (value * 72) / 25.4;
}
