import puppeteer from 'puppeteer-core';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const mdPath = path.join(__dirname, 'FORGOT_PASSWORD_WHATSAPP_OTP.md');
const htmlPath = path.join(__dirname, 'FORGOT_PASSWORD_WHATSAPP_OTP.html');
const pdfPath = path.join(__dirname, 'FORGOT_PASSWORD_WHATSAPP_OTP.pdf');

const { marked } = await import('marked');
marked.setOptions({ gfm: true, breaks: false });

const md = fs.readFileSync(mdPath, 'utf8');
const body = marked.parse(md);

const styles = `
  @page { size: A4; margin: 14mm 12mm; }
  body { font-family: 'Segoe UI', system-ui, sans-serif; font-size: 9.5pt; color: #1e293b; line-height: 1.5; }
  .cover { text-align: center; padding: 70px 30px; page-break-after: always;
    background: linear-gradient(160deg, #f0fdf4, #ecfdf5); min-height: 88vh;
    display: flex; flex-direction: column; align-items: center; justify-content: center; }
  .cover img { width: 90px; margin-bottom: 20px; }
  .cover h1 { font-size: 24px; color: #0f172a; }
  .cover .badge { display: inline-block; background: #059669; color: #fff; padding: 6px 16px;
    border-radius: 20px; font-weight: 600; font-size: 11px; margin-top: 12px; }
  .cover .team { margin-top: 24px; font-size: 12px; }
  .cover .team span { display: inline-block; background: #10b981; color: #fff; padding: 6px 16px; border-radius: 20px; margin: 4px; font-weight: 600; }
  h1 { font-size: 17px; color: #0f172a; border-bottom: 2px solid #10b981; padding-bottom: 5px; margin: 24px 0 10px; page-break-after: avoid; }
  h2 { font-size: 13px; color: #334155; margin: 18px 0 8px; page-break-after: avoid; }
  h3 { font-size: 11px; margin: 12px 0 6px; }
  table { width: 100%; border-collapse: collapse; margin: 8px 0 14px; font-size: 8.5pt; page-break-inside: avoid; }
  th { background: #059669; color: #fff; padding: 5px 8px; text-align: left; }
  td { padding: 4px 8px; border-bottom: 1px solid #e2e8f0; vertical-align: top; }
  tr:nth-child(even) td { background: #f8fafc; }
  ul, ol { margin: 6px 0 10px 18px; font-size: 9pt; }
  li { margin-bottom: 2px; }
  pre { background: #0f172a; color: #e2e8f0; padding: 10px; border-radius: 6px; font-size: 7.5pt; white-space: pre-wrap; }
  code { background: #f1f5f9; padding: 1px 4px; border-radius: 3px; font-size: 8pt; }
  .content h1:first-child { display: none; }
  strong { color: #0f172a; }
`;

const logoPath = path.join(__dirname, 'techhub-logo.png');
const logoHtml = fs.existsSync(logoPath) ? `<img src="techhub-logo.png" alt="TechHub"/>` : '';

const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"/>
<title>Forgot Password & WhatsApp OTP | TechHub</title><style>${styles}</style></head><body>
<div class="cover">
  ${logoHtml}
  <p style="color:#059669;font-weight:600;letter-spacing:2px;">TECHHUB</p>
  <h1>SupportFlow — Future Lane</h1>
  <p style="font-size:15px;font-weight:500;">Forgot Password & WhatsApp OTP</p>
  <span class="badge">Deferred — implement later</span>
  <p style="font-size:12px;color:#475569;margin-top:16px;">Meta Cloud API R&amp;D · Email + WhatsApp recovery</p>
  <div class="team">
    <span>Zain Ali</span>
    <span>Maryam Ali</span>
  </div>
  <p style="margin-top:20px;font-size:10px;color:#64748b;">TechHub · Internal Document · Confidential</p>
</div>
<div class="content">${body}</div></body></html>`;

fs.writeFileSync(htmlPath, html);

const executablePath = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
].find((p) => fs.existsSync(p));

if (!executablePath) { console.error('Chrome/Edge not found'); process.exit(1); }

const browser = await puppeteer.launch({ executablePath, headless: true, args: ['--no-sandbox'] });
const page = await browser.newPage();
await page.goto(`file:///${htmlPath.replace(/\\/g, '/')}`, { waitUntil: 'networkidle0' });
await page.pdf({
  path: pdfPath, format: 'A4', printBackground: true,
  margin: { top: '12mm', right: '10mm', bottom: '16mm', left: '10mm' },
  displayHeaderFooter: true, headerTemplate: '<div></div>',
  footerTemplate: `<div style="width:100%;font-size:7px;color:#64748b;padding:0 10mm;display:flex;justify-content:space-between;font-family:Segoe UI,sans-serif;">
    <span>© 2026 TechHub · Confidential</span><span>Forgot Password & WhatsApp OTP (Future)</span>
    <span>Page <span class="pageNumber"></span> / <span class="totalPages"></span></span></div>`,
});
await browser.close();
console.log(`PDF: ${pdfPath}`);
