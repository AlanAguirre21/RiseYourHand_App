import { computedValue, flattenQuestions, formatAnswer, isEmptyAnswer } from './answers.js';

// Very long links get cut, so the long answers are shortened in the message
const ANSWER_MAX = 300;

const APP_NAME = 'LevantaMano';
const SIGNATURE = 'ZF ESL · Smart Factory';
const ZF_BLUE = '#0057B7';
const LOGO_PX = 56;

// Shorter labels than the questions of the form; a question that is not here keeps its own text
const LABELS = {
  employee: 'Reportada por',
  color: 'Color',
  status: 'Estatus',
  creation_date: 'Fecha de creación',
  expiration_date: 'Fecha de vencimiento',
  area: 'Área',
  details: 'Detalles',
};

const shorten = text => (text.length > ANSWER_MAX ? `${text.slice(0, ANSWER_MAX)}…` : text);
const labelOf = question => LABELS[question.key] ?? question.text.trim().replace(/[:：]$/, '');

const escapeHtml = text => String(text)
  .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');

// Mail programs do not show SVG images: the logo travels as a PNG drawn from the SVG of the assets
export function loadLogoPng(src, size = LOGO_PX * 2) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      canvas.getContext('2d').drawImage(image, 0, 0, size, size);
      resolve(canvas.toDataURL('image/png'));
    };
    image.onerror = () => reject(new Error('No se pudo cargar el logo.'));
    image.src = src;
  });
}

// Copies the message with its format (and as plain text for the programs that take no format).
// It goes through a selection, not through navigator.clipboard, which only exists on https
export function copyRichText(html, text) {
  const holder = document.createElement('div');
  holder.contentEditable = 'true';
  holder.style.cssText = 'position:fixed;left:-9999px;top:0;background:#fff;color:#000;';
  holder.innerHTML = html;
  document.body.appendChild(holder);

  const selection = window.getSelection();
  const range = document.createRange();
  range.selectNodeContents(holder);
  selection.removeAllRanges();
  selection.addRange(range);

  holder.addEventListener('copy', e => {
    e.clipboardData.setData('text/html', html);
    e.clipboardData.setData('text/plain', text);
    e.preventDefault();
  });
  let copied = false;
  try {
    copied = document.execCommand('copy');
  } finally {
    selection.removeAllRanges();
    holder.remove();
  }
  return copied;
}

// Tables and inline styles only: it is what Outlook keeps when the message is pasted
function buildHtml({ title, greeting, intro, rows, trackingUrl, sender, logo }) {
  const font = "font-family:'Segoe UI',Arial,Helvetica,sans-serif;";
  const cell = `${font}font-size:14px;padding:9px 12px;border-bottom:1px solid #e5e5ea;vertical-align:top;`;
  const dataRows = rows.map(([label, value]) => `
        <tr>
          <td width="170" style="${cell}color:#6e6e73;">${escapeHtml(label)}</td>
          <td style="${cell}color:#1d1d1f;font-weight:600;">${escapeHtml(value).replaceAll('\n', '<br>')}</td>
        </tr>`).join('');

  return `
<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:100%;border-collapse:collapse;background:#ffffff;">
  <tr>
    <td style="padding:20px 24px 16px 24px;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
        <tr>
          ${logo ? `<td style="padding-right:14px;"><img src="${logo}" width="${LOGO_PX}" height="${LOGO_PX}" alt="ZF" style="display:block;border:0;"></td>` : ''}
          <td style="${font}">
            <div style="font-size:18px;font-weight:700;color:${ZF_BLUE};">${APP_NAME}</div>
            <div style="font-size:12px;color:#6e6e73;">${SIGNATURE}</div>
          </td>
        </tr>
      </table>
    </td>
  </tr>
  <tr><td style="height:4px;line-height:4px;font-size:0;background:${ZF_BLUE};">&nbsp;</td></tr>
  <tr>
    <td style="${font}padding:24px 24px 8px 24px;color:#1d1d1f;">
      <div style="font-size:20px;font-weight:700;color:${ZF_BLUE};margin:0 0 14px 0;">${escapeHtml(title)}</div>
      <p style="font-size:14px;line-height:1.5;margin:0 0 10px 0;">${escapeHtml(greeting)}</p>
      <p style="font-size:14px;line-height:1.5;margin:0 0 6px 0;">${escapeHtml(intro)}</p>
    </td>
  </tr>
  <tr>
    <td style="padding:8px 24px 8px 24px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;border-top:1px solid #e5e5ea;">${dataRows}
      </table>
    </td>
  </tr>
  <tr>
    <td style="padding:16px 24px 8px 24px;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
        <tr>
          <td style="background:${ZF_BLUE};padding:10px 20px;">
            <a href="${escapeHtml(trackingUrl)}" style="${font}font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;">Ver el seguimiento de la manita</a>
          </td>
        </tr>
      </table>
    </td>
  </tr>
  <tr>
    <td style="${font}padding:16px 24px 20px 24px;font-size:14px;line-height:1.5;color:#1d1d1f;">
      Atentamente,<br><strong>${escapeHtml(sender)}</strong><br>
      <span style="font-size:12px;color:#6e6e73;">${SIGNATURE} · ${APP_NAME}</span>
    </td>
  </tr>
  <tr>
    <td style="${font}padding:12px 24px;font-size:11px;color:#6e6e73;background:#f5f5f7;border-top:1px solid #e5e5ea;">
      Mensaje generado desde ${APP_NAME}, el sistema de registro y seguimiento de manitas.
    </td>
  </tr>
</table>`;
}

const LOGO_CID = 'zf-logo';

// Base64 in lines of 76 characters, as mail files want it
const wrap76 = base64 => base64.match(/.{1,76}/g)?.join('\r\n') ?? '';
function base64Utf8(text) {
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

// The message as a mail file (.eml). "X-Unsent" makes Outlook open it as a draft ready to be sent,
// with its recipient, subject, format and logo; the logo goes inside the file as an inline image
function buildEml({ to, subject, text, html, logo }) {
  const related = 'levantamano-related';
  const alternative = 'levantamano-alternative';
  const part = (type, content) => [
    `Content-Type: ${type}; charset="UTF-8"`,
    'Content-Transfer-Encoding: base64',
    '',
    wrap76(base64Utf8(content)),
  ];
  const lines = [
    ...(to ? [`To: ${to}`] : []),
    `Subject: =?UTF-8?B?${base64Utf8(subject)}?=`,
    'X-Unsent: 1',
    'MIME-Version: 1.0',
    `Content-Type: multipart/related; boundary="${related}"; type="multipart/alternative"`,
    '',
    `--${related}`,
    `Content-Type: multipart/alternative; boundary="${alternative}"`,
    '',
    `--${alternative}`,
    ...part('text/plain', text),
    `--${alternative}`,
    ...part('text/html', `<html><body style="margin:0;padding:0;">${html}</body></html>`),
    `--${alternative}--`,
  ];
  if (logo) {
    lines.push(
      `--${related}`,
      'Content-Type: image/png; name="zf-logo.png"',
      'Content-Transfer-Encoding: base64',
      `Content-ID: <${LOGO_CID}>`,
      'Content-Disposition: inline; filename="zf-logo.png"',
      '',
      wrap76(logo.slice(logo.indexOf(',') + 1)),
    );
  }
  lines.push(`--${related}--`, '');
  return lines.join('\r\n');
}

// Saves the mail file; opening it shows the draft in Outlook
export function downloadEml(eml, name) {
  const url = URL.createObjectURL(new Blob([eml], { type: 'message/rfc822' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = `${name.replace(/[\\/:*?"<>|]+/g, ' ').trim().slice(0, 80) || 'Nueva manita'}.eml`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// Message for the champion of a manita that was just registered. "champion" is { name, email };
// without an email the message has no recipient. "logo" is the PNG of loadLogoPng (optional).
// A link can only carry plain text, so the formatted message cannot open by itself in Outlook: it
// is copied, and pasted into a mail that opens with just the recipient and the subject.
//   eml       - the message as a mail file: Outlook opens it as a draft with the format and the logo
//   html      - the message with the ZF format and logo, to be copied
//   text      - the whole message as plain text (what is pasted where no format is taken)
//   compose   - link that opens Outlook on the web with the recipient and the subject, body empty
//   plainWeb  - the same link with the message as plain text, for when pasting is not possible
export function championMail({ form, response, champion, sender, trackingUrl, logo }) {
  const questions = flattenQuestions(form);
  const byKey = new Map(response.answers.map(a => [a.questionKey, a.value]));
  const manita = computedValue(response, 'hand_name');

  const rows = questions
    .filter(q => !q.champions && !isEmptyAnswer(byKey.get(q.key)))
    .map(q => [labelOf(q), shorten(String(formatAnswer(q, byKey.get(q.key))))]);

  const title = 'Nueva manita a tu cargo';
  const subject = manita ? `[${APP_NAME}] ${title}: ${manita}` : `[${APP_NAME}] ${title}`;
  const greeting = `Estimado(a) ${champion.name}:`;
  const intro = `Te informamos que se registró una nueva manita en ${APP_NAME} y fuiste asignado(a) como su champion. Estos son sus datos:`;

  const body = [
    greeting,
    '',
    intro,
    '',
    'DATOS DE LA MANITA',
    '------------------------------',
    ...rows.map(([label, value]) => `• ${label}: ${value}`),
    '------------------------------',
    '',
    'SEGUIMIENTO',
    `Consulta la manita y registra su avance en: ${trackingUrl}`,
    '',
    'Atentamente,',
    sender,
    `${SIGNATURE} · ${APP_NAME}`,
  ].join('\r\n');

  const to = champion.email ?? '';
  const compose = `https://outlook.office.com/mail/deeplink/compose?to=${encodeURIComponent(to)}&subject=${encodeURIComponent(subject)}`;
  return {
    compose,
    plainWeb: `${compose}&body=${encodeURIComponent(body)}`,
    text: [`Para: ${to}`, `Asunto: ${subject}`, '', body].join('\r\n'),
    html: buildHtml({ title, greeting, intro, rows, trackingUrl, sender, logo }),
    eml: buildEml({
      to, subject, text: body, logo,
      html: buildHtml({ title, greeting, intro, rows, trackingUrl, sender, logo: logo ? `cid:${LOGO_CID}` : null }),
    }),
    fileName: subject,
  };
}
