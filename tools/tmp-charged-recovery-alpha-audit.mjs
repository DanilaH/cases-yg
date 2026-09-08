import { chromium } from 'playwright';
import fs from 'node:fs/promises';

const outDir = process.env.AUDIT_OUT ?? 'tmp-final-result-panel-audit';
await fs.mkdir(outDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
const page = await context.newPage();
const errors = [];
page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`));
page.on('console', (msg) => {
  if (msg.type() === 'error') errors.push(`console: ${msg.text()}`);
});
page.on('requestfailed', (request) => errors.push(`requestfailed: ${request.url()} ${request.failure()?.errorText ?? ''}`));

await page.goto('http://127.0.0.1:5173/?platform=mock&debug=1', { waitUntil: 'domcontentloaded' });
await page.locator('canvas').waitFor({ state: 'visible' });
await page.waitForFunction(() => Boolean(window.__mptAuditGame?.scene?.getScene('OpeningScene')));

const debug = page.getByRole('button', { name: 'DEBUG', exact: true });
if (await debug.count()) await debug.click();
const legendary = page.getByRole('button', { name: 'Force Legendary (Charged)', exact: true });
await Promise.all([
  page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 10000 }),
  legendary.click(),
]);
await page.locator('canvas').waitFor({ state: 'visible' });
await page.waitForFunction(() => Array.isArray(window.__mptRecoveryAudit) && window.__mptRecoveryAudit.length >= 2);
await page.waitForTimeout(420);

const samples = await page.evaluate(() => window.__mptRecoveryAudit ?? []);
const pouchValues = samples.map((sample) => sample.pouchAlpha).filter((value) => typeof value === 'number');
const auraValues = samples.map((sample) => sample.auraAlpha).filter((value) => typeof value === 'number');
const hasIntermediate = (values) => values.some((value) => value > 0.05 && value < 0.95);
const nonIncreasing = (values) => values.every((value, index) => index === 0 || value <= values[index - 1] + 0.08);

const assertions = [
  {
    name: 'recovery probe captured multiple animation frames',
    pass: samples.length >= 5,
    detail: `samples=${samples.length}`,
  },
  {
    name: 'recovered pouch fades through intermediate alpha',
    pass: pouchValues.length >= 3 && hasIntermediate(pouchValues),
    detail: JSON.stringify(pouchValues),
  },
  {
    name: 'Charged aura fades through intermediate alpha',
    pass: auraValues.length >= 3 && hasIntermediate(auraValues),
    detail: JSON.stringify(auraValues),
  },
  {
    name: 'recovered pouch alpha trends downward',
    pass: nonIncreasing(pouchValues),
    detail: JSON.stringify(pouchValues),
  },
  {
    name: 'Charged aura alpha trends downward',
    pass: nonIncreasing(auraValues),
    detail: JSON.stringify(auraValues),
  },
  {
    name: 'Charged aura is destroyed after recovery exit',
    pass: samples.at(-1)?.auraActive === false && samples.at(-1)?.auraAlpha === null,
    detail: JSON.stringify(samples.at(-1)),
  },
];

for (const assertion of assertions) {
  if (!assertion.pass) errors.push(`assertion: ${assertion.name} — ${assertion.detail}`);
}

await page.screenshot({ path: `${outDir}/11-charged-recovery-alpha-final.png`, fullPage: true });
await fs.writeFile(
  `${outDir}/recovery-alpha-report.json`,
  JSON.stringify({ errors, assertions, samples }, null, 2),
);
await browser.close();

if (errors.length) {
  console.error(errors.join('\n'));
  process.exitCode = 1;
}
