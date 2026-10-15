import test from 'node:test';
import assert from 'node:assert/strict';
import { renderPhone } from '../public/phone.js';

test('the unknown incoming and missed calls use the same Android handset without branded identity', () => {
  const incoming = renderPhone({ step: 'unknownRinging' });
  const missed = renderPhone({ step: 'unknownMissed' });
  const branded = renderPhone({ step: 'brandedRinging', callPreviewDevice: 'android' });

  for (const preview of [incoming, missed, branded]) {
    assert.match(preview, /class="phone-device phone-device-android"/);
    assert.match(preview, /class="phone-android-status/);
    assert.doesNotMatch(preview, /phone-dynamic-island/);
  }

  assert.match(incoming, /phone-screen-android-call/);
  assert.match(incoming, /Incoming call/);
  assert.match(incoming, /\+1 \(415\) 555-0148/);
  assert.match(missed, /phone-screen-android-lock/);
  assert.match(missed, /Missed call/);
  assert.match(missed, /\+1 \(415\) 555-0148/);
  for (const preview of [incoming, missed]) {
    assert.doesNotMatch(preview, /src="\/twilio-bug\.svg"|Verified business|Call reason|Card security alert/);
  }
});

test('the urgent call previews the approved Twilio identity and an illustrative Android call reason', () => {
  const android = renderPhone({ step: 'brandedRinging', callPreviewDevice: 'android' });
  const iphone = renderPhone({ step: 'brandedRinging', callPreviewDevice: 'iphone' });

  assert.match(android, /<div class="phone-android-name">Twilio<\/div>/);
  assert.match(android, /<span>Call reason<\/span>/);
  assert.match(android, /Simulated Android 14\+ · example reason/);
  assert.match(android, /Card security alert/);
  assert.doesNotMatch(iphone, /Card security alert/);
});

test('the post-call SMS gives a lower-urgency case update from a number-only sender', () => {
  const sms = renderPhone({ step: 'smsSent', smsMode: 'simulated', chargeDecision: 'unrecognized' });

  assert.match(sms, /data-phone-step="smsSent"/);
  assert.match(sms, /Illustrated SMS case-update conversation from a phone number/);
  assert.match(sms, /phone-messages-thread/);
  assert.doesNotMatch(sms, /phone-screen-lock|phone-notification/);
  assert.match(sms, /\+1 \(800\) 555-0148/);
  assert.match(sms, /Twilio Bank: We received your report about the \$9,800\.00 Midlife Crisis Motors charge\. View case status in your banking app\./);
  assert.match(sms, /Illustrative SMS message preview/);
  assert.doesNotMatch(sms, /Did you make|Was this you|Yes, it was me|No, not me/);
  assert.doesNotMatch(sms, /phone-rcs-card|phone-rcs-verified-mark/);
});

test('the live SMS preview uses its configured sender while the later RCS fallback remains separate', () => {
  const config = { smsSenderDisplay: '+18884379561' };
  const sms = renderPhone({ step: 'smsSent', smsMode: 'live' }, config);
  const ignored = renderPhone({ step: 'smsIgnored', smsMode: 'live' }, config);
  const fallback = renderPhone({ step: 'rcsSent', messageMode: 'live', messageChannel: 'fallback' }, config);

  assert.match(sms, /<strong>\+1 \(888\) 437-9561<\/strong>/);
  assert.match(ignored, /<strong>\+1 \(888\) 437-9561<\/strong>/);
  assert.match(fallback, /<strong>\+1 \(888\) 437-9561<\/strong>/);
  assert.doesNotMatch(fallback, /phone-rcs-verified-mark|rcs-sender-logo/);
  assert.match(fallback, /case status/i);
});

test('an ignored SMS remains an unread number-only notification before the RCS follow-up', () => {
  const ignored = renderPhone({ step: 'smsIgnored', smsMode: 'live', smsStatus: 'delivered' });
  const rcs = renderPhone({ step: 'rcsSent', messageMode: 'simulated' });

  assert.match(ignored, /Illustrated lock screen showing an unread SMS/);
  assert.match(ignored, /2 min ago/);
  assert.match(ignored, /Simulated unread SMS notification · live SMS delivery confirmed/);
  assert.match(ignored, /We received your report/);
  assert.match(rcs, /data-phone-step="rcsSent"/);
  assert.match(rcs, /src="\/rcs-sender-logo\.png"/);
  assert.match(rcs, /phone-rcs-card/);
});

test('a read RCS remains a confirmed branded delivery', () => {
  const read = renderPhone({ step: 'rcsSent', messageMode: 'live', messageChannel: 'rcs', messageStatus: 'read' });

  assert.match(read, /live RCS read confirmed/);
  assert.doesNotMatch(read, /delivery unconfirmed/);
});

test('the RCS case update has a recognizable sender and a View case link', () => {
  const chat = renderPhone({ step: 'rcsSent', messageMode: 'simulated' });

  assert.match(chat, /class="phone-device phone-device-android"/);
  assert.match(chat, /data-rcs-profile-open/);
  assert.match(chat, /Verified business/);
  assert.match(chat, /src="\/rcs-case-update-card\.png"/);
  assert.match(chat, /Fraud report received/);
  assert.match(chat, /<a[^>]*href="\/bank\?case=1"[^>]*target="_blank"[^>]*rel="noopener noreferrer"[^>]*>View case<\/a>/);
  assert.doesNotMatch(chat, /Yes, it was me|No, not me|Was this you/);
});

test('the RCS business profile still shows its logo, banner, contacts, and policies', () => {
  const info = renderPhone({ step: 'rcsSent' }, {}, { rcsProfileTab: 'info' });
  const options = renderPhone({ step: 'rcsSent' }, {}, { rcsProfileTab: 'options' });

  assert.match(info, /data-rcs-profile-back/);
  assert.match(info, /src="\/rcs-sender-banner\.png"/);
  assert.match(info, /src="\/rcs-sender-logo\.png"/);
  assert.match(info, /Verified business/);
  assert.match(info, /\+1 \(888\) 437-9561/);
  assert.match(info, /www\.twiliobank\.example/);
  assert.match(info, /help@twiliobank\.example/);
  assert.match(options, /Privacy policy[\s\S]*twiliobank\.example\/privacy/);
  assert.match(options, /Terms of service[\s\S]*twiliobank\.example\/terms/);
});

test('the number-only RCS fallback cannot open a branded sender profile', () => {
  const fallback = renderPhone({ step: 'rcsSent', messageMode: 'live', messageChannel: 'fallback' }, {}, { rcsProfileTab: 'info' });

  assert.doesNotMatch(fallback, /data-rcs-profile-open|data-rcs-profile-back|data-rcs-profile-tab/);
  assert.doesNotMatch(fallback, /phone-rcs-verified-mark|Verified business/);
  assert.match(fallback, /Illustrated SMS fallback conversation/);
  assert.match(fallback, /View case status/i);
});

test('a presenter-selected RCS example shows the branded illustration after live SMS fallback', () => {
  const state = { step: 'rcsSent', messageMode: 'live', messageChannel: 'fallback', messageStatus: 'delivered', rcsExampleShown: true };
  const chat = renderPhone(state);
  const profile = renderPhone(state, {}, { rcsProfileTab: 'info' });

  assert.match(chat, /class="phone-device phone-device-android"/);
  assert.match(chat, /src="\/rcs-sender-logo\.png"/);
  assert.match(chat, /src="\/rcs-case-update-card\.png"/);
  assert.match(chat, /Illustrative RCS example after live SMS\/MMS fallback/);
  assert.doesNotMatch(chat, /Illustrated SMS fallback conversation/);
  assert.match(profile, /src="\/rcs-sender-banner\.png"/);
  assert.match(profile, /Illustrative RCS example after live SMS\/MMS fallback · business profile/);
  assert.equal(state.messageChannel, 'fallback');
});
