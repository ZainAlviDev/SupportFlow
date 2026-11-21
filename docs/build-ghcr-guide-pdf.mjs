import puppeteer from 'puppeteer-core';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const mdPath = path.join(__dirname, 'GHCR_CI_SETUP_GUIDE.md');
const htmlPath = path.join(__dirname, 'GHCR_CI_SETUP_GUIDE.html');
const pdfPath = path.join(__dirname, 'GHCR_CI_SETUP_GUIDE.pdf');

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
  .cover h1 { font-size: 24px; color: #0f172a; margin: 12px 0; }
  .cover .badge { display: inline-block; background: #059669; color: #fff; padding: 6px 18px;
    border-radius: 20px; font-weight: 600; font-size: 11px; margin: 4px; }
  h1 { font-size: 16px; color: #0f172a; border-bottom: 2px solid #059669; padding-bottom: 5px;
    margin: 22px 0 10px; page-break-after: avoid; }
  h2 { font-size: 12.5px; color: #334155; margin: 16px 0 7px; page-break-after: avoid; }
  h3 { font-size: 10.5px; margin: 10px 0 5px; color: #475569; }
  table { width: 100%; border-collapse: collapse; margin: 8px 0 12px; font-size: 8pt; page-break-inside: avoid; }
  th { background: #059669; color: #fff; padding: 5px 8px; text-align: left; }
  td { padding: 4px 8px; border-bottom: 1px solid #e2e8f0; vertical-align: top; }
  tr:nth-child(even) td { background: #f8fafc; }
  ul, ol { margin: 6px 0 10px 18px; font-size: 8.5pt; }
  li { margin-bottom: 3px; }
  pre { background: #0f172a; color: #e2e8f0; padding: 10px; border-radius: 6px;
    font-size: 7.5pt; white-space: pre-wrap; page-break-inside: avoid; }
  code { background: #f1f5f9; padding: 1px 4px; border-radius: 3px; font-size: 7.5pt; }
  .content h1:first-child { display: none; }
  strong { color: #0f172a; }
  hr { border: none; border-top: 1px solid #e2e8f0; margin: 16px 0; }
`;

const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"/>
<title>SupportFlow GHCR CI/CD Setup Guide</title><style>${styles}</style></head><body>
<div class="cover">
  <p style="color:#059669;font-weight:600;letter-spacing:2px;">TECHHUB · SUPPORTFLOW</p>
  <h1>Docker & GHCR CI/CD<br/>Setup Guide</h1>
  <p style="font-size:13px;color:#475569;margin-top:8px;">GitHub Actions · Container Registry · Deploy Flow</p>
  <p style="font-size:11px;color:#64748b;margin-top:6px;">Version 1.0 · July 2026</p>
  <div style="margin-top:24px;">
    <span class="badge">Manual Run</span>
    <span class="badge">PR Merge Trigger</span>
    <span class="badge">9 Microservices</span>
  </div>
  <p style="margin-top:24px;font-size:10px;color:#64748b;">github.com/merium6/SupportFlow</p>
</div>
<div class="content">${body}</div></body></html>`;

fs.writeFileSync(htmlPath, html);

const executablePath = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
].find((p) => fs.existsSync(p));

if (!executablePath) {
  console.error('Chrome/Edge not found. HTML saved at:', htmlPath);
  process.exit(1);
}

const browser = await puppeteer.launch({ executablePath, headless: true, args: ['--no-sandbox'] });
const page = await browser.newPage();
await page.goto(`file:///${htmlPath.replace(/\\/g, '/')}`, { waitUntil: 'networkidle0' });
await page.pdf({
  path: pdfPath,
  format: 'A4',
  printBackground: true,
  margin: { top: '12mm', right: '10mm', bottom: '16mm', left: '10mm' },
  displayHeaderFooter: true,
  headerTemplate: '<div></div>',
  footerTemplate: `<div style="width:100%;font-size:7px;color:#64748b;padding:0 10mm;display:flex;justify-content:space-between;font-family:Segoe UI,sans-serif;">
    <span>© 2026 TechHub · SupportFlow GHCR Guide v1.0</span>
    <span>Page <span class="pageNumber"></span> / <span class="totalPages"></span></span></div>`,
});
await browser.close();
console.log(`PDF created: ${pdfPath}`);
