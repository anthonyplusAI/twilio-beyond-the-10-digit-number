import test from 'node:test';
import assert from 'node:assert/strict';
import { renderPhone } from '../public/phone.js';

test('illustrative Android incoming call shows an example reason while iPhone comparison does not', () => {
  const android = renderPhone({ step: 'brandedRinging', callPreviewDevice: 'android' });
  const iphone = renderPhone({ step: 'brandedRinging', callPreviewDevice: 'iphone' });

  assert.match(android, /<span>Call reason<\/span>/);
  assert.match(android, /Simulated Android 14\+ · example reason/);
  assert.match(android, /Card security alert/);
  assert.doesNotMatch(iphone, /Card security alert/);
});
