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

test('the first SMS shows a number-only sender and the exact charge alert without a branded profile', () => {
  const sms = renderPhone({ step: 'smsSent', smsMode: 'simulated' });

  assert.match(sms, /data-phone-step="smsSent"/);
  assert.match(sms, /Illustrated SMS conversation from an unfamiliar phone number/);
  assert.match(sms, /\+1 \(800\) 555-0148/);
  assert.match(sms, /Twilio Bank: Did you make a \$9,800\.00 charge at Midlife Crisis Motors\? Open your banking app to review it\./);
  assert.match(sms, /Simulated SMS view/);
  assert.doesNotMatch(sms, /src="\/twilio-bug\.svg"/);
  assert.doesNotMatch(sms, /phone-rcs-card/);
});

test('the first SMS uses the configured US sender while the later RCS fallback stays illustrative', () => {
  const config = { smsSenderDisplay: '+18884379561' };
  const sms = renderPhone({ step: 'smsSent', smsMode: 'live' }, config);
  const ignored = renderPhone({ step: 'smsIgnored', smsMode: 'live' }, config);
  const fallback = renderPhone({ step: 'rcsSent', messageMode: 'live', messageChannel: 'fallback' }, config);

  assert.match(sms, /<strong>\+1 \(888\) 437-9561<\/strong>/);
  assert.match(ignored, /<strong>\+1 \(888\) 437-9561<\/strong>/);
  assert.doesNotMatch(sms, /\+1 \(800\) 555-0148/);
  assert.match(fallback, /<strong>\+1 \(800\) 555-0148<\/strong>/);
  assert.doesNotMatch(fallback, /\+1 \(888\) 437-9561/);
});

test('an ignored live SMS stays visible and is not confused with the later RCS status', () => {
  const ignored = renderPhone({ step: 'smsIgnored', smsMode: 'live', smsStatus: 'delivered' });
  const rcs = renderPhone({
    step: 'rcsSent',
    smsMode: 'live',
    smsStatus: 'delivered',
    messageMode: 'simulated',
    messageChannel: 'simulated',
  });

  assert.match(ignored, /data-phone-step="smsIgnored"/);
  assert.match(ignored, /Simulated SMS view · live SMS delivery confirmed/);
  assert.match(ignored, /Twilio Bank: Did you make a \$9,800\.00 charge/);
  assert.match(rcs, /data-phone-step="rcsSent"/);
  assert.match(rcs, /src="\/rcs-sender-logo\.png"/);
  assert.match(rcs, /phone-rcs-card/);
  assert.doesNotMatch(rcs, /Simulated SMS view/);
});

test('RCS chat offers the sender profile from an Android-style header', () => {
  const chat = renderPhone({ step: 'rcsSent', messageMode: 'simulated' });

  assert.match(chat, /class="phone-device phone-device-android"/);
  assert.match(chat, /<button[^>]*data-rcs-profile-open[^>]*>/);
  assert.match(chat, /src="\/rcs-sender-logo\.png"/);
  assert.match(chat, /<button[^>]*data-rcs-profile-open[^>]*>[\s\S]*?Twilio Bank[\s\S]*?<\/button>/);
  assert.doesNotMatch(chat, /data-rcs-profile-back/);
});

test('Android RCS rich card keeps both suggested replies inside the card', () => {
  const chat = renderPhone({ step: 'noResponse' });

  assert.match(chat, /<article class="phone-rcs-card"[\s\S]*?Yes, it was me[\s\S]*?No, not me[\s\S]*?<\/article>/);
  assert.doesNotMatch(chat, /iPhone-style dropdown|phone-rcs-menu/);
});

test('RCS sender Info profile shows brand assets and contact details with a back button', () => {
  const profile = renderPhone({ step: 'rcsSent' }, {}, { rcsProfileTab: 'info' });

  assert.match(profile, /class="phone-device phone-device-android"/);
  assert.match(profile, /data-rcs-profile-back/);
  assert.match(profile, /class="phone-rcs-profile-scroll" data-profile-tab="info"/);
  assert.match(profile, /src="\/rcs-sender-banner\.png"/);
  assert.match(profile, /src="\/rcs-sender-logo\.png"/);
  assert.match(profile, /Twilio Bank/);
  assert.match(profile, /Card security alerts and account updates from Twilio Bank\./);
  assert.match(profile, /data-rcs-profile-tab="info"[^>]*aria-selected="true"/);
  assert.match(profile, /data-rcs-profile-tab="options"[^>]*aria-selected="false"/);
  assert.match(profile, /Call[\s\S]*Website[\s\S]*Email/);
  assert.match(profile, /\+1 \(888\) 437-9561/);
  assert.match(profile, /www\.twiliobank\.example/);
  assert.match(profile, /help@twiliobank\.example/);
  assert.doesNotMatch(profile, /twiliobank\.example\/privacy/);
});

test('RCS sender Options profile shows privacy and terms without opening external links', () => {
  const profile = renderPhone({ step: 'noResponse' }, {}, { rcsProfileTab: 'options' });

  assert.match(profile, /class="phone-rcs-profile-scroll" data-profile-tab="options"/);
  assert.match(profile, /data-rcs-profile-tab="info"[^>]*aria-selected="false"/);
  assert.match(profile, /data-rcs-profile-tab="options"[^>]*aria-selected="true"/);
  assert.match(profile, /Privacy policy[\s\S]*twiliobank\.example\/privacy/);
  assert.match(profile, /Terms of service[\s\S]*twiliobank\.example\/terms/);
  assert.doesNotMatch(profile, /<a\b/);
});

test('sender profile is unavailable on first SMS and RCS SMS fallback', () => {
  const states = [
    { step: 'smsSent' },
    { step: 'smsIgnored' },
    { step: 'rcsSent', messageChannel: 'fallback' },
    { step: 'noResponse', messageMode: 'smsFallback' },
  ];

  for (const state of states) {
    const phone = renderPhone(state, {}, { rcsProfileTab: 'info' });
    assert.doesNotMatch(phone, /data-rcs-profile-open|data-rcs-profile-back|data-rcs-profile-tab/);
    assert.doesNotMatch(phone, /phone-screen-rcs-profile|phone-device-android/);
    assert.match(phone, /phone-status-dark/);
  }
});
