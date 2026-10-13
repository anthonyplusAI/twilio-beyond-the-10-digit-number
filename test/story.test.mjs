import test from 'node:test';
import assert from 'node:assert/strict';
import { createDemo } from '../server/app.mjs';

test('fraud alert story goes from SMS to RCS to unknown call to branded call', async () => {
  const demo = createDemo({}, () => { throw new Error('Unexpected live request'); }, () => {});
  const advance = async (action, step) => {
    const { state } = await demo.act(action);
    assert.equal(state.step, step, action);
  };

  await advance('flagPurchase', 'flagged');
  await assert.rejects(demo.act('showUnknownCall'), { code: 'INVALID_TRANSITION' });
  await advance('previewSms', 'smsSent');
  await advance('ignoreSms', 'smsIgnored');
  await advance('previewRcs', 'rcsSent');
  await assert.rejects(demo.act('showUnknownCall'), { code: 'INVALID_TRANSITION' });
  await advance('markNoResponse', 'noResponse');
  assert.match(demo.snapshot().state.events.at(-1).detail, /away from his phone and did not see the message/);
  await assert.rejects(demo.act('previewBrandedCall'), { code: 'INVALID_TRANSITION' });
  await advance('showUnknownCall', 'unknownRinging');
  await advance('ignoreUnknownCall', 'unknownMissed');
  await advance('previewBrandedCall', 'brandedRinging');

  assert.deepEqual(demo.snapshot().state.events.map(({ title }) => title), [
    'Unusual purchase flagged',
    'SMS alert previewed',
    'Unbranded SMS ignored',
    'RCS alert previewed',
    'RCS alert missed',
    'Unknown number rings',
    'Unknown call ignored',
    'Branded call previewed',
  ]);
});
