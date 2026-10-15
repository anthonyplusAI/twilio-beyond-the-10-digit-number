import test from 'node:test';
import assert from 'node:assert/strict';
import { createDemo } from '../server/app.mjs';

function previewOnlyDemo() {
  return createDemo({}, () => { throw new Error('Unexpected live request'); }, () => {});
}

async function advance(demo, action, step) {
  const { state } = await demo.act(action);
  assert.equal(state.step, step, action);
  return state;
}

test('voice resolves the urgent charge before SMS and RCS deliver a lower-urgency case update', async () => {
  const demo = previewOnlyDemo();

  await advance(demo, 'flagPurchase', 'flagged');
  await assert.rejects(demo.act('previewSms'), { code: 'INVALID_TRANSITION' });
  await advance(demo, 'showUnknownCall', 'unknownRinging');
  await advance(demo, 'ignoreUnknownCall', 'unknownMissed');
  await advance(demo, 'previewBrandedCall', 'brandedRinging');
  await assert.rejects(demo.act('previewRcs'), { code: 'INVALID_TRANSITION' });

  const answered = await advance(demo, 'reportUnrecognized', 'reached');
  assert.equal(answered.chargeDecision, 'unrecognized');
  assert.equal(answered.decisionSource, 'presenter');

  await advance(demo, 'previewSms', 'smsSent');
  await advance(demo, 'ignoreSms', 'smsIgnored');
  await advance(demo, 'previewRcs', 'rcsSent');
  const viewed = await advance(demo, 'viewCase', 'caseViewed');
  assert.equal(viewed.chargeDecision, 'unrecognized');
  assert.equal(viewed.decisionSource, 'presenter');
  assert.equal(viewed.events.at(-1).kind, 'simulated');
  assert.equal(viewed.audienceView, 'bank');
  assert.equal(viewed.audienceViewRevision, 1);

  assert.deepEqual(viewed.events.map(({ title }) => title), [
    'Unusual purchase flagged',
    'Unknown number rings',
    'Unknown call ignored',
    'Branded call previewed',
    'Presenter marked purchase as unrecognized',
    'SMS case update previewed',
    'Unbranded SMS ignored',
    'RCS case update previewed',
    'Case details opened in simulated bank app',
  ]);
  await assert.rejects(demo.act('markNoResponse'), { code: 'UNKNOWN_ACTION' });
});

test('a recognized purchase ends the fraud story without sending case follow-up messages', async () => {
  const demo = previewOnlyDemo();
  await advance(demo, 'flagPurchase', 'flagged');
  await advance(demo, 'showUnknownCall', 'unknownRinging');
  await advance(demo, 'ignoreUnknownCall', 'unknownMissed');
  await advance(demo, 'previewBrandedCall', 'brandedRinging');
  const answered = await advance(demo, 'confirmPurchase', 'reached');
  assert.equal(answered.chargeDecision, 'recognized');

  for (const action of ['previewSms', 'sendSms', 'previewRcs', 'sendRcs', 'viewCase']) {
    await assert.rejects(demo.act(action), { code: 'INVALID_TRANSITION' }, action);
  }
  assert.equal((await demo.act('showArchitecture')).state.audienceView, 'architecture');
  assert.equal(demo.snapshot().state.events.some(({ title }) => /case update/i.test(title)), false);
});

test('RCS readiness requires the new case-update template instead of the old fraud-question SID', () => {
  const env = {
    TWILIO_ACCOUNT_SID: `AC${'a'.repeat(32)}`,
    TWILIO_AUTH_TOKEN: 'test-token',
    TWILIO_MESSAGING_SERVICE_SID: `MG${'b'.repeat(32)}`,
    DEMO_TO_NUMBER: '+14155550199',
  };
  const oldTemplate = createDemo({ ...env, TWILIO_RCS_CONTENT_SID: `HX${'c'.repeat(32)}` }, () => {}, () => {});
  assert.equal(oldTemplate.snapshot().config.rcsReady, false);
  const caseTemplate = createDemo({ ...env, TWILIO_RCS_CASE_CONTENT_SID: `HX${'d'.repeat(32)}` }, () => {}, () => {});
  assert.equal(caseTemplate.snapshot().config.rcsReady, true);
});
