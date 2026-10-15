import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const scriptPath = fileURLToPath(new URL('../scripts/create-rcs-template.mjs', import.meta.url));

test('the case-update Content Template has the RCS card, View case action, and text fallback', () => {
  const result = spawnSync(process.execPath, [scriptPath, '--dry-run'], {
    encoding: 'utf8',
    timeout: 5_000,
    env: { PUBLIC_BASE_URL: 'https://bank.example.test' },
  });

  assert.equal(result.status, 0, result.stderr);
  const template = JSON.parse(result.stdout);
  assert.equal(template.types['twilio/card'].title, 'Fraud report received');
  assert.match(template.types['twilio/card'].body, /case|report/i);
  assert.deepEqual(template.types['twilio/card'].media, ['https://bank.example.test/rcs-case-update-card.png']);
  assert.deepEqual(template.types['twilio/card'].actions, [{
    type: 'URL',
    title: 'View case',
    id: 'view_case',
    url: 'https://bank.example.test/bank?case=1',
  }]);
  assert.match(template.types['twilio/text'].body, /fraud report.*being reviewed.*View case status/i);
  assert.doesNotMatch(JSON.stringify(template), /Was this you|Yes, it was me|No, not me/i);
});
