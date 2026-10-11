/*
 * Audience-facing, CSS-rendered customer phone simulation.
 * RCS action layout on iOS: https://www.twilio.com/docs/content/twiliocard
 * Enhanced Branded Calling iPhone elements: https://www.twilio.com/docs/voice/branded-calling/us-enhanced
 */

const visibleSteps = new Set([
  'unknownRinging',
  'unknownMissed',
  'rcsSent',
  'noResponse',
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
  };

  return `<svg class="phone-icon ${extraClass}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || ''}</svg>`;
};

const brandMark = () => '<img class="phone-twilio-mark" src="/twilio-bug.svg" alt="" aria-hidden="true" />';

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

const androidStatusBar = () => `
  <div class="phone-android-status" aria-hidden="true">
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
  <div class="phone-screen phone-screen-call" aria-label="${branded ? 'Illustrated incoming branded call showing Twilio' : 'Illustrated incoming call from an unfamiliar phone number'}">
    ${statusBar()}
    <div class="phone-call-content">
      <div class="phone-call-identity">
        <div class="phone-call-avatar ${branded ? 'phone-call-avatar-branded' : ''}">
          ${branded ? brandMark() : icon('person', 'phone-call-person')}
        </div>
        <div class="phone-call-name ${branded ? '' : 'phone-call-name-unknown'}">${branded ? 'Twilio' : '+1 (415) 555-0148'}</div>
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
    <div class="phone-screen phone-screen-lock" aria-label="Illustrated lock screen showing a missed call from an unfamiliar number">
      ${statusBar()}
      <div class="phone-lock-content">
        <div class="phone-lock-icon">${icon('lock')}</div>
        <div class="phone-lock-date">${date}</div>
        <div class="phone-lock-time">9:41</div>
        <div class="phone-notification">
          <div class="phone-notification-meta">
            <span class="phone-notification-app">${icon('phone')} Phone</span>
            <span>now</span>
          </div>
          <strong>Missed Call</strong>
          <span>+1 (415) 555-0148</span>
        </div>
      </div>
      <div class="phone-lock-shortcuts" aria-hidden="true">
        <span>${icon('flash')}</span><span>${icon('camera')}</span>
      </div>
      ${homeIndicator()}
    </div>`;
};

// A twilio/card can contain media, title/body text, and QUICK_REPLY actions.
// On iOS, those actions appear in a dropdown: https://www.twilio.com/docs/content/twiliocard
const rcsCard = () => `
  <article class="phone-rcs-card" aria-label="Twilio Bank card purchase to review: Midlife Crisis Motors, $9,800.00 vehicle deposit, card ending 4829">
    <img class="phone-rcs-card-visual" src="/rcs-alert-card.png" alt="Twilio Bank card security graphic for a $9,800.00 vehicle deposit at Midlife Crisis Motors on card ending 4829" />
    <div class="phone-rcs-card-body">
      <h3>Card purchase to review</h3>
      <p>A $9,800.00 vehicle deposit at Midlife Crisis Motors was charged to card ending 4829. Was this you?</p>
    </div>
  </article>`;

const messageScreen = (sms = false) => `
  <div class="phone-screen phone-screen-messages" aria-label="Illustrated ${sms ? 'text fallback' : 'RCS'} fraud alert conversation with Twilio Bank">
    ${statusBar('dark')}
    <div class="phone-messages-nav">
      <span class="phone-messages-back">${icon('chevron')} <span>Messages</span></span>
      <span class="phone-messages-contact">
        <span class="phone-messages-avatar ${sms ? '' : 'phone-messages-avatar-branded'}">${sms ? '+1' : brandMark()}</span>
        <strong>${sms ? '+1 (415) 555-0148' : 'Twilio Bank'}</strong>
        ${icon('chevronDown')}
      </span>
      <span class="phone-messages-compose">${icon('compose')}</span>
    </div>
    <div class="phone-messages-thread">
      <div class="phone-messages-date">Today 9:41 AM</div>
      ${sms ? `<div class="phone-messages-bubble">
        DEMO — Twilio Bank: Did you make a $9,800.00 vehicle deposit at Midlife Crisis Motors on card ending 4829? Reply YES or NO. No real account is affected.
      </div>` : `
      ${rcsCard()}
      <div class="phone-rcs-menu" aria-label="RCS suggested replies shown as an iPhone-style dropdown">
        <div class="phone-rcs-menu-heading">Reply options ${icon('chevronDown')}</div>
        <div class="phone-rcs-menu-item">Yes, it was me ${icon('chevron')}</div>
        <div class="phone-rcs-menu-item">No, not me ${icon('chevron')}</div>
      </div>`}
    </div>
    <div class="phone-messages-input" aria-hidden="true">
      <span class="phone-messages-plus">${icon('plusCircle')}</span>
      <span class="phone-messages-input-field">${sms ? 'Text Message' : 'Text Message · RCS'} <span class="phone-messages-mic">${icon('mic')}</span></span>
    </div>
    ${homeIndicator('dark')}
  </div>`;

const connectedCall = () => `
  <div class="phone-screen phone-screen-call phone-screen-connected" aria-label="Illustrated connected call with Twilio">
    ${statusBar()}
    <div class="phone-call-content">
      <div class="phone-call-identity phone-call-identity-connected">
        <div class="phone-call-avatar phone-call-avatar-branded">${brandMark()}</div>
        <div class="phone-call-name">Twilio</div>
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
const androidCall = (connected = false) => `
  <div class="phone-screen phone-screen-android-call ${connected ? 'phone-screen-android-connected' : ''}" aria-label="Illustrated Android 14 or later ${connected ? 'connected' : 'incoming'} branded call from Twilio${connected ? '' : ' with example call reason Card security alert'}">
    ${androidStatusBar()}
    <div class="phone-android-call-label">${connected ? 'Ongoing call' : 'Incoming call'}</div>
    <div class="phone-android-call-identity">
      <span class="phone-android-verified">${icon('check')} Verified business</span>
      <div class="phone-android-avatar">${brandMark()}</div>
      <div class="phone-android-name">Twilio</div>
      ${connected ? '<div class="phone-android-duration">00:18</div>' : '<div class="phone-android-reason"><span>Call reason</span><strong>Card security alert</strong></div>'}
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

export function renderPhone(state = {}) {
  const step = state?.step;
  if (!visibleSteps.has(step)) return '';

  const brandedCall = step === 'brandedRinging' || step === 'reached';
  const androidPreview = brandedCall && state.callPreviewDevice === 'android';
  const isSms = state.messageChannel === 'fallback' || ['sms', 'fallback', 'smsFallback'].includes(state.messageMode);
  const liveMessage = ['rcsSent', 'noResponse'].includes(step) && state.messageMode === 'live';
  const liveMessageFailed = ['failed', 'undelivered', 'canceled'].includes(String(state.messageStatus || '').toLowerCase());
  const messageCaption = !liveMessage ? 'Simulated customer phone'
    : state.messageChannel === 'rcs' ? 'Simulated RCS view · live RCS delivery confirmed'
      : state.messageChannel === 'fallback' ? 'Simulated text view · number-based fallback confirmed'
        : liveMessageFailed ? 'Simulated RCS example · live delivery failed'
          : 'Simulated RCS example · live channel unconfirmed';
  const caption = brandedCall
    ? androidPreview ? 'Simulated Android 14+ · example reason' : 'Simulated iPhone call · name and logo only'
    : messageCaption;
  const screen = step === 'unknownRinging' ? incomingCall(false)
    : step === 'unknownMissed' ? missedCall()
      : step === 'rcsSent' || step === 'noResponse' ? messageScreen(isSms)
        : androidPreview ? androidCall(step === 'reached')
          : step === 'brandedRinging' ? incomingCall(true)
            : connectedCall();

  return `
    <aside class="phone-stage" aria-label="Simulated customer phone">
      <div class="phone-device ${androidPreview ? 'phone-device-android' : ''}" data-phone-step="${step}">
        <div class="phone-side-button phone-side-button-left"></div>
        <div class="phone-side-button phone-side-button-right"></div>
        ${screen}
      </div>
      <p class="phone-caption"><span class="phone-caption-dot"></span> ${caption}</p>
    </aside>`;
}
