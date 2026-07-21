import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const exists = file => fs.existsSync(path.join(root, file));
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const checks = [];

const check = (name, pass, detail = '') => checks.push({ name, pass: Boolean(pass), detail });

[
  'database/schema.sql',
  'database/nosql-collections.json',
  'backend/functions/src/services/intelligenceEngine.js',
  'backend/functions/src/services/mlLifecycle.js',
  'backend/appsail/ai-service/app.py',
  'backend/cron/index.js',
  'backend/circuits/index.js',
  'src/components/demo/PresenterOverlay.tsx',
  'src/components/intelligence/EnterprisePanels.tsx',
  'docs/PHASE3_PRODUCTION_READINESS.md',
  'docs/PHASE4_ML_LIFECYCLE.md',
].forEach(file => check(`Required file: ${file}`, exists(file)));

try {
  JSON.parse(read('catalyst.json'));
  check('Catalyst JSON is valid', true);
  const catalyst = JSON.parse(read('catalyst.json'));
  check('Catalyst functions configured', catalyst.functions?.source === 'backend/functions');
  check('Catalyst AppSail AI service configured', catalyst.appsail?.targets?.some(t => t.name === 'ciap-ai-service'));
  check('Catalyst cron and circuits configured', catalyst.cron?.source && catalyst.circuits?.source);
} catch (error) {
  check('Catalyst JSON is valid', false, error.message);
}

try {
  JSON.parse(read('database/nosql-collections.json'));
  check('NoSQL collection manifest is valid JSON', true);
} catch (error) {
  check('NoSQL collection manifest is valid JSON', false, error.message);
}

const schema = exists('database/schema.sql') ? read('database/schema.sql') : '';
['CaseMaster', 'Accused', 'Victim', 'ArrestSurrender', 'ChargesheetDetails', 'MLModelRegistry', 'HumanFeedback'].forEach(table => {
  check(`Official/derived table present: ${table}`, schema.includes(table));
});

const packageJson = JSON.parse(read('package.json'));
check('Demo seed script configured', packageJson.scripts?.['demo:seed']);
check('Final QA script configured', packageJson.scripts?.qa);

const allSource = ['src', 'backend', 'database', 'scripts']
  .flatMap(dir => fs.existsSync(dir) ? fs.readdirSync(dir, { recursive: true }).map(file => path.join(dir, file)) : [])
  .filter(file => /\.(ts|tsx|js|mjs|json|sql)$/i.test(file) && !file.includes('node_modules') && !file.includes('coverage') && !file.includes('dist') && !file.endsWith('final-qa.mjs'))
  .map(file => read(file))
  .join('\n');
check('No Firebase/Supabase/AWS architecture leakage', !/firebase|supabase|aws lambda/i.test(allSource));
check('No legacy FIR table query usage', !/FROM\s+FIR\b|table\(['"]FIR['"]\)/.test(allSource));
check('Presenter demo walkthrough exists', allSource.includes('demoWalkthroughSteps'));
check('Explainable AI copy exists', allSource.includes('Important Features') && allSource.includes('Historical Evidence'));

const report = [
  '# CIAP Final QA Report',
  '',
  `Generated: ${new Date().toISOString()}`,
  '',
  '## Results',
  '',
  ...checks.map(item => `- ${item.pass ? 'PASS' : 'FAIL'}: ${item.name}${item.detail ? ` - ${item.detail}` : ''}`),
  '',
  '## Recommendation',
  '',
  checks.every(item => item.pass)
    ? 'Ready for competition demonstration. Run `npm run demo:seed -- --count=50000` before the live demo if the demo-data CSVs are not already present.'
    : 'Resolve failed checks before submission.',
  '',
].join('\n');

fs.writeFileSync(path.join(root, 'docs', 'FINAL_QA_REPORT.md'), report);
console.log(report);
process.exit(checks.every(item => item.pass) ? 0 : 1);
