/*
 * Audience-facing, CSS-rendered customer phone simulation.
 * RCS sender fields and Android rich-card layout:
 * https://www.twilio.com/docs/rcs/onboarding
 * https://www.twilio.com/docs/content/twiliocard
 * Verified sender badge on an invited test device:
 * https://www.twilio.com/en-us/blog/get-started-rcs-twilio
 * Enhanced Branded Calling iPhone elements: https://www.twilio.com/docs/voice/branded-calling/us-enhanced
 */

import { SMS_BODY_PREFIX, buildSmsBody, buildSmsCaseUrl } from './sms-content.js';

const visibleSteps = new Set([
  'smsSent',
  'smsIgnored',
  'rcsSent',
  'unknownRinging',
  'unknownMissed',
  'brandedRinging',
  'reached',
]);

const icon = (name, extraClass = '') => {
  const paths = {
    phone: '<path d="M6.3 3.7c-.4-.4-.9-.6-1.4-.5L2.8 3.7c-.6.1-1 .7-.9 1.3.5 7.4 6.4 13.3 13.8 13.8.6 0 1.2-.3 1.3-.9l.5-2.1c.1-.5-.1-1-.5-1.4l-2.4-2.4c-.4-.4-1-.5-1.5-.3l-1.6.8a12.6 12.6 0 0 1-4.9-4.9l.8-1.6c.2-.5.1-1.1-.3-1.5L6.3 3.7Z"/>',
    phoneDown: '<path d="M5.2 15.1c5.5-3.7 10.1-3.7 15.6 0l-2.1 2.8c-.3.4-.8.6-1.3.5l-2.3-.6c-.4-.1-.7-.4-.8-.8l-.4-1.3a12.3 12.3 0 0 0-3.8 0L9.7 17c-.1.4-.4.7-.8.8l-2.3.6c-.5.1-1-.1-1.3-.5l-2.1-2.8Z"/>',
    message: '<path d="M20.1 10.8c0 4.4-3.7 7.9-8.3 7.9-1.1 0-2.2-.2-3.1-.6l-4.1 1 .9-3.7a7.6 7.6 0 0 1-2-5c0-4.4 3.7-7.9 8.3-7.9s8.3 3.6 8.3 8.3Z"/>',
    bell: '<path d="M18.1 8.6a6.1 6.1 0 0 0-12.2 0c0 7-2.3 7.3-2.3 8.3h16.8c0-1-2.3-1.3-2.3-8.3ZM10 20.1h4"/>',
    chevron: '<path d="m15.2 5.6-6.4 6.4 6.4 6.4"/>',
    chevronDown: '<path d="m5.8 9 6.2 6.2L18.2 9"/>',
    video: '<rect x="3" y="6" width="12.5" height="12" rx="2.4"/><path d="m15.5 10 5-3v10l-5-3"/>',
    mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M6 11a6 6 0 0 0 12 0M12 17v4M9 21h6"/>',
    grid: '<circle cx="5" cy="5" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="19" cy="5" r="1"/><circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="19" r="1"/><circle cx="12" cy="19" r="1"/><circle cx="19" cy="19" r="1"/>',
    speaker: '<path d="M4 10h4l5-4v12l-5-4H4zM16 8a5 5 0 0 1 0 8M18.5 5.5a8.5 8.5 0 0 1 0 13"/>',
    plus: '<path d="M12 4v16M4 12h16"/>',
    person: '<circle cx="12" cy="8" r="3.3"/><path d="M5.4 19.8c.9-3.3 3.1-5 6.6-5s5.7 1.7 6.6 5"/>',
    lock: '<rect x="7" y="10" width="10" height="9" rx="2"/><path d="M9 10V7a3 3 0 0 1 6 0v3"/>',
    camera: '<rect x="2.5" y="7" width="19" height="12" rx="2.5"/><path d="M7 7l1.4-2h7.2L17 7"/><circle cx="12" cy="13" r="3"/>',
    flash: '<path d="M13.5 2 6 13h5.3l-.8 9L18 11h-5.3L13.5 2Z"/>',
    compose: '<path d="M14 4h5v5M9.5 14.5 19 5M18 13v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h5"/>',
    check: '<path d="m5 12.5 4.5 4.4L19 7.5"/>',
    plusCircle: '<circle cx="12" cy="12" r="9"/><path d="M12 7v10M7 12h10"/>',
    arrowLeft: '<path d="m12 5-7 7 7 7M5 12h14"/>',
    moreVertical: '<circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.4 2.4 3.6 5.4 3.6 9s-1.2 6.6-3.6 9c-2.4-2.4-3.6-5.4-3.6-9S9.6 5.4 12 3Z"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 7 8 6 8-6"/>',
    shield: '<path d="M12 2.5 20 6v6.1c0 4.5-3 7.8-8 9.4-5-1.6-8-4.9-8-9.4V6l8-3.5Z"/><path d="m8.5 12 2.3 2.3 4.8-5"/>',
    document: '<path d="M6 2.5h8l4 4V21H6V2.5Z"/><path d="M14 2.5V7h4M9 12h6M9 16h6"/>',
  };

  return `<svg class="phone-icon ${extraClass}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || ''}</svg>`;
};

const brandMark = () => '<img class="phone-twilio-mark" src="/twilio-bug.svg" alt="" aria-hidden="true" />';
const brandedCallerName = 'Twilio Bank';
const rcsVerifiedMark = () => `<span class="phone-rcs-verified-mark" aria-hidden="true">${icon('check')}</span>`;

const statusBar = (tone = 'light') => `
  <div class="phone-status phone-status-${tone}" aria-hidden="true">
    <span class="phone-status-time">9:41</span>
    <span class="phone-dynamic-island"></span>
    <span class="phone-status-icons">
      <span class="phone-signal"><i></i><i></i><i></i><i></i></span>
      <svg class="phone-wifi" viewBox="0 0 20 16" fill="none"><path d="M1.5 5.2c4.8-4.3 12.2-4.3 17 0M4.7 8.6c3.1-2.7 7.5-2.7 10.6 0M8.1 12c1.1-.8 2.7-.8 3.8 0" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="10" cy="14.3" r="1.2" fill="currentColor"/></svg>
      <span class="phone-battery"><span></span></span>
    </span>
  </div>`;

const homeIndicator = (tone = 'light') => `<span class="phone-home-indicator phone-home-indicator-${tone}" aria-hidden="true"></span>`;

const androidStatusBar = (tone = 'light') => `
  <div class="phone-android-status phone-android-status-${tone}" aria-hidden="true">
    <span>9:41</span>
    <span class="phone-android-camera"></span>
    <span class="phone-status-icons">
      <span class="phone-signal"><i></i><i></i><i></i><i></i></span>
      <svg class="phone-wifi" viewBox="0 0 20 16" fill="none"><path d="M1.5 5.2c4.8-4.3 12.2-4.3 17 0M4.7 8.6c3.1-2.7 7.5-2.7 10.6 0M8.1 12c1.1-.8 2.7-.8 3.8 0" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="10" cy="14.3" r="1.2" fill="currentColor"/></svg>
      <span class="phone-battery"><span></span></span>
    </span>
  </div>`;

const callAction = (glyph, label, kind = 'neutral') => `
  <div class="phone-call-action">
    <span class="phone-call-action-disc phone-call-action-disc-${kind}">${icon(glyph)}</span>
    <span class="phone-call-action-label">${label}</span>
  </div>`;

const incomingCall = (branded = false) => `
  <div class="phone-screen phone-screen-call" aria-label="${branded ? `Illustrated incoming branded call showing ${brandedCallerName}` : 'Illustrated incoming call from an unfamiliar phone number'}">
    ${statusBar()}
    <div class="phone-call-content">
      <div class="phone-call-identity">
        <div class="phone-call-avatar ${branded ? 'phone-call-avatar-branded' : ''}">
          ${branded ? brandMark() : icon('person', 'phone-call-person')}
        </div>
        <div class="phone-call-name ${branded ? '' : 'phone-call-name-unknown'}">${branded ? brandedCallerName : '+1 (415) 555-0148'}</div>
        <div class="phone-call-kind">${branded ? 'Incoming call' : 'mobile'}</div>
      </div>
      <div class="phone-call-bottom">
        <div class="phone-call-secondary">
          ${callAction('bell', 'Remind Me')}
          ${callAction('message', 'Message')}
        </div>
        <div class="phone-call-answer-row">
          ${callAction('phoneDown', 'Decline', 'decline')}
          ${callAction('phone', 'Accept', 'accept')}
        </div>
      </div>
    </div>
    ${homeIndicator()}
  </div>`;

const missedCall = () => {
  const date = new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date());
  return `
    <div class="phone-screen phone-screen-lock phone-screen-android-lock" aria-label="Illustrated Android lock screen showing a missed call from an unfamiliar number">
      ${androidStatusBar()}
      <div class="phone-lock-content">
        <div class="phone-lock-icon">${icon('lock')}</div>
        <div class="phone-lock-date">${date}</div>
        <div class="phone-lock-time">9:41</div>
        <div class="phone-notification">
          <div class="phone-notification-meta">
            <span class="phone-notification-app">${icon('phone')} Phone</span>
            <span>now</span>
          </div>
          <strong>Missed call</strong>
          <span>+1 (415) 555-0148</span>
        </div>
      </div>
      <span class="phone-android-home-indicator" aria-hidden="true"></span>
    </div>`;
};

// An RCS card can carry a URL action that opens the business's case page.
// https://www.twilio.com/docs/content/twiliocard
const rcsCard = () => `
  <article class="phone-rcs-card" aria-label="Twilio Bank fraud case update for Midlife Crisis Motors, $9,800.00 vehicle deposit, card ending 4829">
    <img class="phone-rcs-card-visual" src="/rcs-case-update-card.png" alt="Twilio Bank fraud report received graphic" />
    <div class="phone-rcs-card-body">
      <h3>Fraud report received</h3>
      <p>Your report about the $9,800.00 Midlife Crisis Motors charge is being reviewed.</p>
    </div>
    <div class="phone-rcs-card-actions">
      <a class="phone-rcs-card-action" href="/bank?case=1" target="_blank" rel="noopener noreferrer" aria-label="View the fictional fraud case in Twilio Bank">View case</a>
    </div>
  </article>`;

const rcsMessageScreen = () => `
  <div class="phone-screen phone-screen-rcs-chat" aria-label="Illustrated Android RCS case update conversation with Twilio Bank">
    ${androidStatusBar('dark')}
    <div class="phone-rcs-chat-nav">
      <span class="phone-rcs-chat-back" aria-hidden="true">${icon('arrowLeft')}</span>
      <button class="phone-rcs-chat-sender" type="button" data-rcs-profile-open aria-label="View verified Twilio Bank business profile">
        <img class="phone-rcs-chat-logo" src="/rcs-sender-logo.png" alt="" />
        <span class="phone-rcs-chat-sender-name"><span class="phone-rcs-chat-sender-title"><strong>Twilio Bank</strong>${rcsVerifiedMark()}</span><small>Verified business</small></span>
      </button>
      <span class="phone-rcs-chat-more" aria-hidden="true">${icon('moreVertical')}</span>
    </div>
    <div class="phone-rcs-chat-thread">
      <div class="phone-rcs-chat-date">Today · 9:41 AM</div>
      ${rcsCard()}
    </div>
    <div class="phone-rcs-chat-input" aria-hidden="true">
      <span class="phone-rcs-chat-plus">${icon('plusCircle')}</span>
      <span class="phone-rcs-chat-input-field">RCS message <span>${icon('mic')}</span></span>
    </div>
    <span class="phone-android-home-indicator phone-android-home-indicator-dark" aria-hidden="true"></span>
  </div>`;

const rcsProfileRow = (glyph, value, label) => `
  <div class="phone-rcs-profile-row">
    <span class="phone-rcs-profile-row-icon" aria-hidden="true">${icon(glyph)}</span>
    <span class="phone-rcs-profile-row-text"><strong>${value}</strong><small>${label}</small></span>
  </div>`;

const rcsProfileScreen = (tab) => `
  <div class="phone-screen phone-screen-rcs-profile" aria-label="Illustrated RCS business profile for Twilio Bank">
    ${androidStatusBar('dark')}
    <div class="phone-rcs-profile-nav">
      <button class="phone-rcs-profile-back" type="button" data-rcs-profile-back aria-label="Back to Twilio Bank chat">${icon('arrowLeft')}</button>
    </div>
    <div class="phone-rcs-profile-scroll" data-profile-tab="${tab}">
      <div class="phone-rcs-profile-banner"><img src="/rcs-sender-banner.png" alt="" aria-hidden="true" /></div>
      <div class="phone-rcs-profile-identity">
        <img class="phone-rcs-profile-logo" src="/rcs-sender-logo.png" alt="Twilio Bank logo" />
        <div class="phone-rcs-profile-title"><h2>Twilio Bank</h2>${rcsVerifiedMark()}</div>
        <span class="phone-rcs-profile-verified">Verified business</span>
        <p>Card security alerts and account updates from Twilio Bank.</p>
      </div>
      <div class="phone-rcs-profile-shortcuts" aria-label="Contact options shown for this sender">
        <div class="phone-rcs-profile-shortcut"><span aria-hidden="true">${icon('phone')}</span><strong>Call</strong></div>
        <div class="phone-rcs-profile-shortcut"><span aria-hidden="true">${icon('globe')}</span><strong>Website</strong></div>
        <div class="phone-rcs-profile-shortcut"><span aria-hidden="true">${icon('mail')}</span><strong>Email</strong></div>
      </div>
      <div class="phone-rcs-profile-tabs" role="tablist" aria-label="Business profile sections">
        <button class="phone-rcs-profile-tab ${tab === 'info' ? 'is-active' : ''}" type="button" role="tab" data-rcs-profile-tab="info" aria-selected="${tab === 'info'}" aria-controls="phone-rcs-profile-panel">Info</button>
        <button class="phone-rcs-profile-tab ${tab === 'options' ? 'is-active' : ''}" type="button" role="tab" data-rcs-profile-tab="options" aria-selected="${tab === 'options'}" aria-controls="phone-rcs-profile-panel">Options</button>
      </div>
      <div class="phone-rcs-profile-panel" id="phone-rcs-profile-panel" role="tabpanel" aria-label="${tab === 'info' ? 'Business contact details' : 'Business policies'}">
        ${tab === 'info' ? `
          ${rcsProfileRow('phone', '+1 (888) 437-9561', 'Customer service')}
          ${rcsProfileRow('globe', 'www.twiliobank.example', 'Website')}
          ${rcsProfileRow('mail', 'help@twiliobank.example', 'Customer support')}` : `
          ${rcsProfileRow('shield', 'Privacy policy', 'twiliobank.example/privacy')}
          ${rcsProfileRow('document', 'Terms of service', 'twiliobank.example/terms')}`}
      </div>
    </div>
    <span class="phone-android-home-indicator phone-android-home-indicator-dark" aria-hidden="true"></span>
  </div>`;

const fallbackSmsBody = 'Twilio Bank: Your fraud report for the $9,800.00 Midlife Crisis Motors charge is being reviewed. View case status in your banking app.';
const illustrativeSmsSender = '+1 (800) 555-0148';

const escapeHtml = (value) => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#39;');

function formatSmsSender(sender) {
  if (typeof sender !== 'string' || !/^\+[1-9]\d{7,14}$/.test(sender)) return illustrativeSmsSender;
  const usNumber = /^\+1(\d{3})(\d{3})(\d{4})$/.exec(sender);
  return usNumber ? `+1 (${usNumber[1]}) ${usNumber[2]}-${usNumber[3]}` : sender;
}

const unreadSmsNotification = (sender, body, ignored = false) => {
  const date = new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date());
  return `
    <div class="phone-screen phone-screen-lock" aria-label="Illustrated lock screen showing an unread SMS from ${sender}">
      ${statusBar()}
      <div class="phone-lock-content">
        <div class="phone-lock-icon">${icon('lock')}</div>
        <div class="phone-lock-date">${date}</div>
        <div class="phone-lock-time">9:41</div>
        <div class="phone-notification">
          <div class="phone-notification-meta">
            <span class="phone-notification-app">${icon('message')} Messages</span>
            <span>${ignored ? '2 min ago' : 'now'}</span>
          </div>
          <strong>${sender}</strong>
          <span class="phone-notification-text">${escapeHtml(body)}</span>
        </div>
      </div>
      <div class="phone-lock-shortcuts" aria-hidden="true">
        <span>${icon('flash')}</span><span>${icon('camera')}</span>
      </div>
      ${homeIndicator()}
    </div>`;
};

const smsMessageScreen = (smsSender = illustrativeSmsSender, body = fallbackSmsBody, label = 'Illustrated SMS fallback conversation from a phone number') => {
  return `
  <div class="phone-screen phone-screen-messages" aria-label="${label}">
    ${statusBar('dark')}
    <div class="phone-messages-nav">
      <span class="phone-messages-back">${icon('chevron')} <span>Messages</span></span>
      <span class="phone-messages-contact">
        <span class="phone-messages-avatar phone-messages-avatar-plain">${icon('person')}</span>
        <strong>${smsSender}</strong>
        ${icon('chevronDown')}
      </span>
      <span class="phone-messages-compose">${icon('compose')}</span>
    </div>
    <div class="phone-messages-thread">
      <div class="phone-messages-date">Today 9:41 AM</div>
      <div class="phone-messages-bubble">
        ${body}
      </div>
    </div>
    <div class="phone-messages-input" aria-hidden="true">
      <span class="phone-messages-plus">${icon('plusCircle')}</span>
      <span class="phone-messages-input-field">Text Message <span class="phone-messages-mic">${icon('mic')}</span></span>
    </div>
    ${homeIndicator('dark')}
  </div>`;
};

const connectedCall = () => `
  <div class="phone-screen phone-screen-call phone-screen-connected" aria-label="Illustrated connected call with ${brandedCallerName}">
    ${statusBar()}
    <div class="phone-call-content">
      <div class="phone-call-identity phone-call-identity-connected">
        <div class="phone-call-avatar phone-call-avatar-branded">${brandMark()}</div>
        <div class="phone-call-name">${brandedCallerName}</div>
        <div class="phone-call-kind">00:18</div>
      </div>
      <div class="phone-connected-bottom">
        <div class="phone-connected-grid">
          ${callAction('mic', 'mute')}
          ${callAction('grid', 'keypad')}
          ${callAction('speaker', 'audio')}
          ${callAction('plus', 'add call')}
          ${callAction('video', 'video')}
          ${callAction('person', 'contacts')}
        </div>
        <div class="phone-connected-end">${callAction('phoneDown', 'End call', 'decline')}</div>
      </div>
    </div>
    ${homeIndicator()}
  </div>`;

// Illustrative supported-Android call screen. The reason shown here is an example,
// not a claim that this presenter’s approved bundle contains that exact reason.
// https://www.twilio.com/docs/voice/branded-calling/us-enhanced
const androidCall = (connected = false, branded = true) => `
  <div class="phone-screen phone-screen-android-call ${connected ? 'phone-screen-android-connected' : ''}" aria-label="${branded ? `Illustrated Android 14 or later ${connected ? 'connected' : 'incoming'} branded call from ${brandedCallerName}${connected ? '' : ' with example call reason Card security alert'}` : 'Illustrated Android 14 or later incoming call from an unfamiliar phone number'}">
    ${androidStatusBar()}
    <div class="phone-android-call-label">${connected ? 'Ongoing call' : 'Incoming call'}</div>
    <div class="phone-android-call-identity${branded ? '' : ' phone-android-call-identity-unbranded'}">
      ${branded ? `<span class="phone-android-verified">${icon('check')} Verified business</span>` : ''}
      <div class="phone-android-avatar${branded ? '' : ' phone-android-avatar-unknown'}">${branded ? brandMark() : icon('person')}</div>
      <div class="phone-android-name${branded ? '' : ' phone-android-name-unknown'}">${branded ? brandedCallerName : '+1 (415) 555-0148'}</div>
      ${branded ? connected ? '<div class="phone-android-duration">00:18</div>' : '<div class="phone-android-reason"><span>Call reason</span><strong>Card security alert</strong></div>' : '<div class="phone-android-call-kind">Mobile</div>'}
    </div>
    ${connected ? `
      <div class="phone-android-connected-controls">
        <div class="phone-android-tools">
          ${callAction('mic', 'Mute')}
          ${callAction('grid', 'Keypad')}
          ${callAction('speaker', 'Speaker')}
          ${callAction('plus', 'Add call')}
          ${callAction('video', 'Video')}
          ${callAction('person', 'Contacts')}
        </div>
        <div class="phone-android-end">${callAction('phoneDown', 'End call', 'decline')}</div>
      </div>` : `
      <div class="phone-android-incoming-controls">
        <div class="phone-android-secondary">
          ${callAction('bell', 'Remind me')}
          ${callAction('message', 'Message')}
        </div>
        <div class="phone-android-answer">
          ${callAction('phoneDown', 'Decline', 'decline')}
          ${callAction('phone', 'Answer', 'accept')}
        </div>
      </div>`}
    <span class="phone-android-home-indicator" aria-hidden="true"></span>
  </div>`;

export function renderPhone(state = {}, config = {}, { rcsProfileTab = null, arrivalKind = null } = {}) {
  const step = state?.step;
  if (!visibleSteps.has(step)) return '';

  const arrivalClass = (step === 'unknownRinging' || step === 'brandedRinging') && arrivalKind === 'call'
    ? ' phone-device-buzz-call'
    : (step === 'smsSent' || step === 'rcsSent') && arrivalKind === 'message'
      ? ' phone-device-buzz-message' : '';

  const smsCaseUrl = config?.smsCaseUrl || buildSmsCaseUrl();
  const firstSmsBody = buildSmsBody(smsCaseUrl);
  const escapedSmsCaseUrl = escapeHtml(smsCaseUrl);
  const firstSmsMarkup = `${escapeHtml(SMS_BODY_PREFIX)}<a class="phone-sms-link" href="${escapedSmsCaseUrl}" target="_blank" rel="noopener noreferrer">${escapedSmsCaseUrl}</a>`;

  const brandedCall = step === 'brandedRinging' || step === 'reached';
  const androidPreview = brandedCall && state.callPreviewDevice === 'android';
  const unknownCall = step === 'unknownRinging' || step === 'unknownMissed';
  const firstSms = step === 'smsSent' || step === 'smsIgnored';
  const isSmsFallback = state.messageChannel === 'fallback' || ['sms', 'fallback', 'smsFallback'].includes(state.messageMode);
  const rcsFallbackExample = step === 'rcsSent' && isSmsFallback && state.rcsExampleShown === true;
  const rcsScene = step === 'rcsSent' && (!isSmsFallback || rcsFallbackExample);
  const activeRcsProfileTab = step === 'rcsSent' && rcsScene && ['info', 'options'].includes(rcsProfileTab) ? rcsProfileTab : null;
  const liveSms = firstSms && state.smsMode === 'live';
  const liveSmsFailed = ['failed', 'undelivered', 'canceled'].includes(String(state.smsStatus || '').toLowerCase());
  const liveMessage = step === 'rcsSent' && state.messageMode === 'live';
  const liveMessageFailed = ['failed', 'undelivered', 'canceled'].includes(String(state.messageStatus || '').toLowerCase());
  const smsView = step === 'smsSent' ? 'Illustrative SMS message preview' : 'Simulated unread SMS notification';
  const smsExample = step === 'smsSent' ? 'Illustrative SMS message preview' : 'Simulated unread SMS example';
  const smsCaption = !liveSms ? smsView
    : String(state.smsStatus || '').toLowerCase() === 'delivered' ? `${smsView} · live SMS delivery confirmed`
      : liveSmsFailed ? `${smsExample} · live delivery failed`
        : `${smsExample} · live delivery unconfirmed`;
  const rcsView = 'Simulated RCS view';
  const textView = 'Simulated text view';
  const rcsExample = 'Simulated RCS example';
  const messageCaption = firstSms ? smsCaption
    : !liveMessage ? state.messageChannel === 'fallback' ? textView : rcsView
      : liveMessageFailed ? `${rcsExample} · live delivery failed`
        : state.messageChannel === 'rcs' && String(state.messageStatus || '').toLowerCase() === 'read' ? `${rcsView} · live RCS read confirmed`
          : state.messageChannel === 'rcs' && String(state.messageStatus || '').toLowerCase() === 'delivered' ? `${rcsView} · live RCS delivery confirmed`
            : state.messageChannel === 'fallback' && ['delivered', 'read'].includes(String(state.messageStatus || '').toLowerCase()) ? `${textView} · number-based fallback confirmed`
            : `${state.messageChannel === 'fallback' ? textView : rcsExample} · live delivery unconfirmed`;
  const caption = rcsFallbackExample ? `Illustrative RCS example after live SMS/MMS fallback${activeRcsProfileTab ? ' · business profile' : ''}`
    : activeRcsProfileTab ? 'Simulated RCS business profile'
    : brandedCall ? androidPreview ? 'Simulated Android 14+ · example reason' : 'Simulated iPhone call · name and logo only'
      : unknownCall ? 'Simulated Android 14+ unbranded call · no call placed'
      : messageCaption;
  const screen = step === 'unknownRinging' ? androidCall(false, false)
    : step === 'unknownMissed' ? missedCall()
      : step === 'smsIgnored' ? unreadSmsNotification(formatSmsSender(config?.smsSenderDisplay), firstSmsBody, true)
        : step === 'smsSent' ? smsMessageScreen(formatSmsSender(config?.smsSenderDisplay), firstSmsMarkup, 'Illustrated SMS case-update conversation from a phone number')
        : step === 'rcsSent' ? !rcsScene ? smsMessageScreen(formatSmsSender(config?.smsSenderDisplay)) : activeRcsProfileTab ? rcsProfileScreen(activeRcsProfileTab) : rcsMessageScreen()
        : androidPreview ? androidCall(step === 'reached')
          : step === 'brandedRinging' ? incomingCall(true)
            : connectedCall();

  return `
    <aside class="phone-stage" aria-label="Simulated customer phone">
      <div class="phone-device ${androidPreview || unknownCall || rcsScene ? 'phone-device-android' : ''}${arrivalClass}" data-phone-step="${step}">
        <div class="phone-side-button phone-side-button-left"></div>
        <div class="phone-side-button phone-side-button-right"></div>
        ${screen}
      </div>
      <p class="phone-caption"><span class="phone-caption-dot"></span> ${caption}</p>
    </aside>`;
}
