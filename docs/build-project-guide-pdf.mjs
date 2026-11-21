import puppeteer from 'puppeteer-core';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const mdPath = path.join(__dirname, 'PROJECT_GUIDE.md');
const htmlPath = path.join(__dirname, 'PROJECT_GUIDE.html');
const pdfPath = path.join(__dirname, 'PROJECT_GUIDE.pdf');

const { marked } = await import('marked');
marked.setOptions({ gfm: true, breaks: false });

const md = fs.readFileSync(mdPath, 'utf8');
const body = marked.parse(md);

const styles = `
  @page { size: A4; margin: 12mm 10mm; }
  body { font-family: 'Segoe UI', system-ui, sans-serif; font-size: 8.5pt; color: #1e293b; line-height: 1.45; }
  .cover { text-align: center; padding: 60px 30px; page-break-after: always;
    background: linear-gradient(160deg, #eef2ff, #f0fdf4); min-height: 88vh;
    display: flex; flex-direction: column; align-items: center; justify-content: center; }
  .cover h1 { font-size: 22px; color: #0f172a; margin: 12px 0; }
  .cover .badge { display: inline-block; background: #4f46e5; color: #fff; padding: 5px 14px;
    border-radius: 20px; font-weight: 600; font-size: 10px; margin: 3px; }
  h1 { font-size: 14px; color: #0f172a; border-bottom: 2px solid #4f46e5; padding-bottom: 4px;
    margin: 18px 0 8px; page-break-after: avoid; }
  h2 { font-size: 11.5px; color: #334155; margin: 14px 0 6px; page-break-after: avoid; }
  h3 { font-size: 10px; margin: 10px 0 4px; color: #475569; }
  table { width: 100%; border-collapse: collapse; margin: 6px 0 10px; font-size: 7.5pt; page-break-inside: avoid; }
  th { background: #4f46e5; color: #fff; padding: 4px 6px; text-align: left; }
  td { padding: 3px 6px; border-bottom: 1px solid #e2e8f0; vertical-align: top; }
  tr:nth-child(even) td { background: #f8fafc; }
  ul, ol { margin: 4px 0 8px 16px; font-size: 8pt; }
  li { margin-bottom: 2px; }
  pre { background: #0f172a; color: #e2e8f0; padding: 8px; border-radius: 6px;
    font-size: 7pt; white-space: pre-wrap; page-break-inside: avoid; }
  code { background: #f1f5f9; padding: 1px 3px; border-radius: 3px; font-size: 7pt; }
  .content h1:first-child { display: none; }
  strong { color: #0f172a; }
  hr { border: none; border-top: 1px solid #e2e8f0; margin: 12px 0; }
`;

const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"/>
<title>SupportFlow Project Guide</title><style>${styles}</style></head><body>
<div class="cover">
  <p style="color:#4f46e5;font-weight:600;letter-spacing:2px;">TECHHUB · SUPPORTFLOW</p>
  <h1>Complete Project Guide</h1>
  <p style="font-size:12px;color:#475569;">Backend + Frontend + Docker + CI/CD</p>
  <p style="font-size:10px;color:#64748b;">Version 1.0 · July 2026</p>
  <div style="margin-top:20px;">
    <span class="badge">VS Code Setup</span>
    <span class="badge">All Files Explained</span>
    <span class="badge">Next.js + .NET 8</span>
  </div>
</div>
<div class="content">${body}</div></body></html>`;

fs.writeFileSync(htmlPath, html);

const executablePath = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
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
  margin: { top: '10mm', right: '8mm', bottom: '14mm', left: '8mm' },
  displayHeaderFooter: true,
  headerTemplate: '<div></div>',
  footerTemplate: `<div style="width:100%;font-size:6.5px;color:#64748b;padding:0 8mm;display:flex;justify-content:space-between;font-family:Segoe UI,sans-serif;">
    <span>© 2026 TechHub · SupportFlow Project Guide v1.0</span>
    <span>Page <span class="pageNumber"></span> / <span class="totalPages"></span></span></div>`,
});
await browser.close();
console.log(`PDF created: ${pdfPath}`);
