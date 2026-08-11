/**
 * Gabarits d'emails transactionnels.
 *
 * Tout est en styles INLINE : Gmail, Outlook et la plupart des webmails
 * suppriment les balises <style>. Les couleurs sont celles de la DA
 * (`packages/design-tokens`) recopiées ici en dur — c'est la seule duplication
 * assumée du projet, faute de pouvoir charger un CSS externe dans un email.
 */
const NAVY = "#0B2A4A";
const AZURE = "#14507F";
const GOLD = "#C9A227";
const TEXT = "#0B1A2A";
const MUTED = "#5A6B7D";
const BORDER = "#D8E3EF";

export interface MailLayoutOptions {
  title: string;
  preheader: string;
  bodyHtml: string;
  footerNote?: string;
}

export function renderLayout({
  title,
  preheader,
  bodyHtml,
  footerNote,
}: MailLayoutOptions): string {
  return `<!doctype html>
<html lang="fr">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(title)}</title></head>
<body style="margin:0;padding:0;background:#F5F8FC;font-family:Helvetica,Arial,sans-serif;color:${TEXT};">
  <span style="display:none;font-size:1px;color:#F5F8FC;max-height:0;overflow:hidden;">${escapeHtml(preheader)}</span>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F5F8FC;padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#FFFFFF;border:1px solid ${BORDER};border-radius:16px;overflow:hidden;">
        <tr>
          <td style="background:linear-gradient(135deg,${NAVY} 0%,${AZURE} 58%,${GOLD} 100%);background-color:${AZURE};padding:28px 32px;">
            <div style="color:#FFFFFF;font-size:13px;letter-spacing:2px;text-transform:uppercase;opacity:.85;">Forum International du Hadj</div>
            <div style="color:#FFFFFF;font-size:26px;font-weight:700;margin-top:6px;">FI-HADJ</div>
          </td>
        </tr>
        <tr><td style="height:3px;background:${GOLD};"></td></tr>
        <tr><td style="padding:32px;font-size:15px;line-height:24px;">${bodyHtml}</td></tr>
        <tr>
          <td style="padding:20px 32px 28px;border-top:1px solid ${BORDER};font-size:12px;line-height:18px;color:${MUTED};">
            ${footerNote ? `<p style="margin:0 0 10px;">${footerNote}</p>` : ""}
            <p style="margin:0;">SESAP &amp; CDIDES — Commissariat Général du FI-HADJ<br>
            Abidjan, Côte d'Ivoire · +225 27 22 29 42 98</p>
            <p style="margin:10px 0 0;">Vous recevez ce message parce que vous avez utilisé un formulaire du site fi-hadj.ci.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

export function button(label: string, url: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0;"><tr>
    <td style="background:${NAVY};border-radius:999px;">
      <a href="${escapeHtml(url)}" style="display:inline-block;padding:12px 26px;color:#FFFFFF;text-decoration:none;font-weight:600;font-size:14px;">${escapeHtml(label)}</a>
    </td></tr></table>`;
}

/** Encadré doré — la référence d'inscription, l'information à retenir. */
export function highlight(label: string, value: string): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;border:1px solid ${GOLD};border-radius:12px;background:#FFFBEF;">
    <tr><td style="padding:16px 20px;">
      <div style="font-size:12px;text-transform:uppercase;letter-spacing:1px;color:${MUTED};">${escapeHtml(label)}</div>
      <div style="font-size:22px;font-weight:700;color:${NAVY};margin-top:4px;letter-spacing:1px;">${escapeHtml(value)}</div>
    </td></tr></table>`;
}

export function detailsTable(rows: readonly [string, string][]): string {
  const body = rows
    .filter(([, v]) => v)
    .map(
      ([k, v]) =>
        `<tr><td style="padding:6px 0;color:${MUTED};width:170px;vertical-align:top;">${escapeHtml(k)}</td>
             <td style="padding:6px 0;font-weight:600;">${escapeHtml(v)}</td></tr>`,
    )
    .join("");
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;margin:16px 0;">${body}</table>`;
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
