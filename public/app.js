import { renderPhone } from './phone.js';
import { architectureGuideHref, architectureShotForPage, renderArchitectureGuide } from './architecture-guide.js';

const root = document.getElementById('app');
const isPresenter = window.location.pathname === '/presenter';
const homeUrl = new URL(window.location.href);
const audiencePaths = new Set(['/bank', '/architecture', '/architecture/details']);
const bankHomeRequested = homeUrl.pathname === '/bank' && homeUrl.searchParams.get('home') === '1';
const bankCaseRequested = homeUrl.pathname === '/bank' && homeUrl.searchParams.get('case') === '1' && !bankHomeRequested;
const customerViewPinned = window.history.state?.customerViewPinned === true
  || (bankCaseRequested && window.history.state?.presenterFollow !== true)
  || (bankHomeRequested && homeUrl.searchParams.get('customer') === '1');
const audiencePageRequested = audiencePaths.has(homeUrl.pathname)
  && homeUrl.searchParams.get('view') === '1';
const savedAudiencePage = !customerViewPinned && window.history.state?.audiencePathOverride === homeUrl.pathname
  && audiencePaths.has(homeUrl.pathname);
const initialAudiencePathOverride = !customerViewPinned && (bankHomeRequested || audiencePageRequested || savedAudiencePage || homeUrl.pathname === '/architecture/details')
  ? homeUrl.pathname : null;
if (bankHomeRequested || audiencePageRequested || (bankCaseRequested && customerViewPinned)) {
  homeUrl.searchParams.delete('home');
  homeUrl.searchParams.delete('view');
  homeUrl.searchParams.delete('customer');
  if (bankHomeRequested) homeUrl.searchParams.delete('case');
  window.history.replaceState(customerViewPinned ? { customerViewPinned: true } : { audiencePathOverride: homeUrl.pathname }, '', homeUrl.pathname + homeUrl.search + homeUrl.hash);
}
if (isPresenter && (window.location.hash || new URLSearchParams(window.location.search).has('token'))) {
  const cleanUrl = new URL(window.location.href);
  cleanUrl.hash = '';
  cleanUrl.searchParams.delete('token');
  window.history.replaceState(null, '', cleanUrl.pathname + cleanUrl.search);
}
const SOURCES = {
  trustHub: 'https://www.twilio.com/docs/trust-hub',
  rcsOnboarding: 'https://www.twilio.com/docs/rcs/onboarding',
  rcsTutorial: 'https://www.twilio.com/en-us/blog/developers/tutorials/product/build-rcs-business-messaging-campaign-twilio',
  rcsSend: 'https://www.twilio.com/docs/rcs/send-an-rcs-message',
  messagingServices: 'https://www.twilio.com/docs/messaging/services',
  tollFreeUseCases: 'https://www.twilio.com/docs/messaging/compliance/toll-free/console-onboarding',
  card: 'https://www.twilio.com/docs/content/twiliocard',
  contentApi: 'https://www.twilio.com/docs/content/content-api-resources',
  calls: 'https://www.twilio.com/docs/voice/api/call-resource',
  relay: 'https://www.twilio.com/docs/voice/conversationrelay',
  relayTwiML: 'https://www.twilio.com/docs/voice/twiml/connect/conversationrelay',
  relayMessages: 'https://www.twilio.com/docs/voice/conversationrelay/websocket-messages',
  relayBestPractices: 'https://www.twilio.com/docs/voice/conversationrelay/best-practices',
  relayInsights: 'https://www.twilio.com/docs/voice/voice-insights/conversation-relay-insights-dashboard',
  branded: 'https://www.twilio.com/docs/voice/branded-calling/us-enhanced',
  conversations: 'https://www.twilio.com/docs/conversations',
  orchestrator: 'https://www.twilio.com/docs/conversations/orchestrator',
  orchestratorChannels: 'https://www.twilio.com/docs/conversations/orchestrator/concepts/channels',
  orchestratorGrouping: 'https://www.twilio.com/docs/conversations/orchestrator/concepts/core',
  memory: 'https://www.twilio.com/docs/conversations/memory',
  agentConnect: 'https://www.twilio.com/docs/conversations/agent-connect/overview',
  agentConnectLegal: 'https://www.twilio.com/docs/conversations/agent-connect',
};

const SCENES = {
  idle: { chapter: 'The customer account', caption: 'Anthony’s account on an ordinary afternoon.', short: 'Ready to begin', cue: 'Introduce Anthony Dellavecchia and the fictional Twilio Bank account. The audience sees the account view; Anthony has not opened the app yet.' },
  flagged: { chapter: 'Urgent fraud question', caption: 'The bank flags a $9,800.00 vehicle deposit that needs Anthony’s answer.', short: 'Purchase flagged', cue: 'The bank needs to ask Anthony whether the charge is his. Start with a simulated unknown-number call and ask whether he would answer.' },
  unknownRinging: { chapter: 'Call attempt · Unknown number', caption: 'A number Anthony does not recognize appears on his phone.', short: 'Unknown call ringing', cue: 'This call display is simulated; no call was placed. Anthony sees only a number, with no clear reason to trust an urgent call. Pause and ask the audience what they would do.' },
  unknownMissed: { chapter: 'Call attempt · Ignored', caption: 'Anthony lets the unfamiliar number ring out. The fraud question remains unanswered.', short: 'Unknown call ignored', cue: 'Anthony ignored the simulated unknown call. Now place the real branded AI call so the audience can compare the caller identity and hear the fraud question answered.' },
  brandedRinging: { chapter: 'Urgent answer · Branded Calling', caption: 'The approved business identity makes the call recognizable.', short: 'Branded call ringing', cue: 'Answer your real phone and say “No, I do not recognize that charge.” The spoken answer should update the bank app. Your Android 13 handset may show less branding than the illustration.' },
  reached: { chapter: 'Urgent answer · Recorded', caption: 'Anthony’s answer from the call is visible in the bank app.', short: 'Answer recorded', cue: 'Point to Anthony’s recorded answer. For “No,” the demo can send a lower-urgency case update next. No real card or bank case was changed.' },
  smsSent: { chapter: 'Case update · Plain SMS', caption: 'Preview the full case-status text from a number-only sender. Anthony has not opened it.', short: 'SMS case update shown', cue: 'The urgent decision already happened by phone. This message view lets the audience read the full SMS; it does not mean Anthony opened it. The body says “Twilio Bank,” but the sender is only a phone number.' },
  smsIgnored: { chapter: 'Case update · SMS ignored', caption: 'Anthony hesitates over the number-only follow-up and leaves it unopened.', short: 'SMS update ignored', cue: 'Anthony’s fraud report is already recorded. He ignores this later SMS because the sender is just a number. Now show the same kind of case update from the branded RCS sender.' },
  rcsSent: { chapter: 'Case update · Branded RCS', caption: 'Twilio Bank’s recognizable sender and case link make the follow-up useful.', short: 'RCS case update shown', cue: 'Show the actual tester handset beside the illustrated Android phone. Open the simulated verified business profile if useful, then show the View case URL action. Anthony can inspect the source before opening the case page.' },
  caseViewed: { chapter: 'Case update · Viewed', caption: 'Anthony opens the fictional case-status page from the trusted update.', short: 'Case status viewed', cue: 'Point to the case-status page and its recorded phone decision. This page is a fictional banking app preview; it does not create a real fraud investigation.' },
};

let snapshot = null;
let architectureShotVariants = {};
let audiencePathOverride = initialAudiencePathOverride;
let presenterAuthenticated = isPresenter ? null : false;
let loginPending = false;
let loginError = '';
let pendingAction = null;
let actionError = '';
let transportError = '';
let deferredPresenterFocus = null;
let lastPhoneCueKey = '';
let pulsingPhoneCueKey = '';
let phoneCuePulseTimer = null;
let rcsProfileTab = null;

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[character]));
}

function highlightCode(source, focusLines) {
  return source.split('\n').map((line) => {
    if (!focusLines.some((fragment) => line.includes(fragment))) return escapeHtml(line);
    const firstCharacter = line.search(/\S/);
    if (firstCharacter < 0) return escapeHtml(line);
    return escapeHtml(line.slice(0, firstCharacter))
      + '<mark class="appendix-code-highlight">'
      + escapeHtml(line.slice(firstCharacter))
      + '</mark>';
  }).join('\n');
}

function icon(name, size = 20) {
  const paths = {
    home: '<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V10Z"/><path d="M9 21v-7h6v7"/>',
    card: '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/>',
    activity: '<path d="M3 12h4l3-7 4 14 3-7h4"/>',
    shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/>',
    bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9Z"/><path d="M10 21h4"/>',
    chevron: '<path d="m9 18 6-6-6-6"/>',
    arrow: '<path d="M5 12h14"/><path d="m13 6 6 6-6 6"/>',
    phone: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7l.5 3a2 2 0 0 1-.6 1.7L7.2 10a16 16 0 0 0 6.8 6.8l1.6-1.8a2 2 0 0 1 1.7-.6l3 .5a2 2 0 0 1 1.7 2Z"/>',
    message: '<path d="M21 11.5a8.4 8.4 0 0 1-8.5 8.5 9 9 0 0 1-4-.9L3 21l1.9-5.5a9 9 0 0 1-.9-4A8.4 8.4 0 0 1 12.5 3a8.4 8.4 0 0 1 8.5 8.5Z"/>',
    refresh: '<path d="M20 11a8 8 0 0 0-14.9-3M4 4v4h4"/><path d="M4 13a8 8 0 0 0 14.9 3M20 20v-4h-4"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    moon: '<path d="M20.5 14.1A8.6 8.6 0 0 1 9.9 3.5 8.6 8.6 0 1 0 20.5 14.1Z"/>',
    external: '<path d="M14 4h6v6"/><path d="m10 14 10-10"/><path d="M20 13v7H4V4h7"/>',
    check: '<path d="m4 12 5 5L20 6"/>',
    alert: '<path d="m12 3 10 18H2L12 3Z"/><path d="M12 9v4m0 4h.01"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    eye: '<path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z"/><circle cx="12" cy="12" r="2.5"/>',
    layers: '<path d="m12 2 9 5-9 5-9-5 9-5Zm-9 10 9 5 9-5M3 17l9 5 9-5"/>',
  };
  return `<svg class="icon" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.layers}</svg>`;
}

function bugMark(className = '') {
  return `<svg class="bug-mark ${className}" viewBox="0 0 46 46" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path fill="currentColor" d="M17.25 33.17C19.69 33.17 21.67 31.19 21.67 28.75C21.67 26.31 19.69 24.33 17.25 24.33C14.81 24.33 12.83 26.31 12.83 28.75C12.83 31.19 14.81 33.17 17.25 33.17ZM17.25 21.67C19.69 21.67 21.67 19.69 21.67 17.25C21.67 14.81 19.69 12.83 17.25 12.83C14.81 12.83 12.83 14.81 12.83 17.25C12.83 19.69 14.81 21.67 17.25 21.67ZM28.75 33.17C31.19 33.17 33.17 31.19 33.17 28.75C33.17 26.31 31.19 24.33 28.75 24.33C26.31 24.33 24.33 26.31 24.33 28.75C24.33 31.19 26.31 33.17 28.75 33.17ZM28.75 21.67C31.19 21.67 33.17 19.69 33.17 17.25C33.17 14.81 31.19 12.83 28.75 12.83C26.31 12.83 24.33 14.81 24.33 17.25C24.33 19.69 26.31 21.67 28.75 21.67ZM23 0C35.46 0 46 10.54 46 23C46 35.46 35.46 46 23 46C10.54 46 0 35.46 0 23C0 10.54 10.54 0 23 0ZM23 6.19C13.74 6.19 6.19 13.48 6.19 22.69C6.19 31.9 13.74 39.81 23 39.81C32.26 39.81 39.81 31.9 39.81 22.69C39.81 13.48 32.26 6.19 23 6.19Z"/></svg>`;
}

function themeButton() {
  const light = document.documentElement.dataset.theme === 'light';
  return `<button type="button" class="theme-button" data-theme-toggle aria-label="Switch to ${light ? 'dark' : 'light'} theme" title="Switch to ${light ? 'dark' : 'light'} theme">${icon(light ? 'moon' : 'sun', 18)}</button>`;
}

function brand(variant = '') {
  return `<a class="brand ${variant}" href="${customerViewPinned ? '/bank?home=1&amp;customer=1' : '/bank?home=1'}" aria-label="Twilio Bank home"><span class="brand-bug">${bugMark()}</span><span class="brand-name">twilio<span>bank</span></span></a>`;
}

function rcsFallbackSelected(state) {
  return state.messageMode === 'live' && state.messageChannel === 'fallback';
}

function illustratedRcsAvailable(state) {
  return state.step === 'rcsSent'
    && (state.messageChannel !== 'fallback' || state.rcsExampleShown)
    && !['sms', 'fallback', 'smsFallback'].includes(state.messageMode);
}

function sceneFor(state) {
  const scene = SCENES[state.step] || SCENES.idle;
  if (state.step === 'reached' && ['recognized', 'unrecognized'].includes(state.chargeDecision)) {
    const spoken = state.decisionSource === 'voice';
    return state.chargeDecision === 'unrecognized'
      ? { ...scene, caption: 'Anthony reported the charge as unrecognized on the call; his answer is on screen.', short: 'Fraud report received', cue: `${spoken ? 'The live voice answer updated the bank app automatically.' : 'This is a presenter-selected simulation of Anthony’s answer.'} Point to the green response marker. The urgent question has been answered; send the lower-urgency case update next. No real bank action was taken.` }
      : { ...scene, caption: 'Anthony recognized the purchase; the demo ends without a fraud-case update.', short: 'Purchase recognized', cue: `${spoken ? 'The live voice answer updated the bank app automatically.' : 'This is a presenter-selected simulation of Anthony’s answer.'} Point to the recorded response. There is no fraud report to follow up on, so move to the architecture summary.` };
  }
  if (state.step === 'smsSent') {
    if (state.smsMode === 'live' && ['failed', 'undelivered', 'canceled'].includes(String(state.smsStatus || '').toLowerCase())) {
      return { ...scene, short: 'SMS not delivered', caption: 'Twilio reports that the case update did not reach the phone. The message view remains illustrative.', cue: 'The live SMS did not arrive. Show the request status, then continue the fictional follow-up using the simulated message preview.' };
    }
    if (state.smsMode === 'live' && String(state.smsStatus || '').toLowerCase() === 'delivered') {
      return { ...scene, short: 'SMS delivered', caption: 'Twilio reports delivery from a phone-number sender. The illustrated conversation previews the full text.', cue: 'Check the real handset. The illustrated conversation lets everyone read the SMS; Anthony has not opened it in the story. Its sender is just a number. Mark it ignored next.' };
    }
    return state.smsMode === 'live'
      ? { ...scene, short: 'SMS request accepted', caption: 'Twilio accepted the SMS request; delivery is unconfirmed. The message view previews its full text.', cue: 'Check your real handset, then refresh status if needed. The illustrated conversation shows the full text for the audience; Anthony has not opened it in the story.' }
      : { ...scene, short: 'SMS preview shown', cue: 'The illustrated conversation shows the full SMS so everyone can read it. No message was sent, and Anthony has not opened it in the story. Point out the number-only header, then mark it ignored.' };
  }
  if (state.step === 'rcsSent') {
    const messageStatus = String(state.messageStatus || '').toLowerCase();
    if (state.rcsExampleShown && state.messageChannel === 'fallback') {
      return { ...scene, short: 'RCS example on screen', caption: 'The live request used SMS/MMS fallback. This branded RCS card is a labeled illustration of the intended experience.', cue: 'Compare the number-only fallback on your real handset with this illustrative RCS card and sender profile. The live request did not deliver RCS; use the Console Sender and Content Template to explain what the rich path would provide.' };
    }
    if (state.messageMode === 'live' && state.messageChannel === 'rcs' && messageStatus === 'read') {
      return { ...scene, short: 'RCS read', caption: 'Twilio reports that the RCS case update was read. Opening the case is a separate action.', cue: 'The refreshed Message resource reports RCS read. Show the actual tester handset beside this illustrated Android phone, then open View case.' };
    }
    if (state.messageMode === 'live' && state.messageChannel === 'rcs' && messageStatus === 'delivered') {
      return { ...scene, short: 'RCS delivery confirmed', caption: 'Twilio reports delivery over RCS. The Android case card remains an illustration.', cue: 'The refreshed Message resource reports delivery from the RCS sender. Show the actual tester handset beside this illustrated Android phone, then open View case.' };
    }
    if (state.messageMode === 'live' && state.messageChannel === 'fallback' && ['delivered', 'read'].includes(messageStatus)) {
      return { ...scene, short: 'RCS fallback delivered', caption: 'The RCS request delivered a text fallback from a phone-number sender.', cue: 'The refreshed Message resource reports delivery from a phone-number sender. This fallback is separate from the earlier deliberate SMS and has no RCS business profile. Continue to the fictional case page as a preview.' };
    }
    if (state.messageMode === 'live' && ['failed', 'undelivered', 'canceled'].includes(String(state.messageStatus || '').toLowerCase())) {
      return { ...scene, short: 'Message not delivered', caption: 'Twilio reports that the live case update was not delivered. The Android card remains an example.', cue: 'The live message did not reach the phone. Use the status and Console logs to explain what happened, then continue the fictional story with the simulated card if useful.' };
    }
    if (rcsFallbackSelected(state)) {
      return { ...scene, short: 'RCS fallback selected', caption: 'The later RCS request used a number-based text sender; delivery is not confirmed yet.', cue: 'Check the actual handset and delivery status. This SMS/MMS fallback is separate from the earlier SMS. The illustrated phone shows a number-only case update, with no RCS sender profile.' };
    }
    return state.messageMode === 'live'
      ? { ...scene, short: 'RCS request accepted', caption: 'Twilio accepted the case-update RCS request. Delivery has not been confirmed yet.', cue: 'Check the tester handset and refresh status. The illustrated RCS sender has a recognizable profile and View case action; actual rendering depends on the device.' }
      : { ...scene, short: 'RCS preview shown', cue: 'This is a preview; no message was sent. The Android view illustrates a recognizable RCS sender and a View case URL action for the reported charge.' };
  }
  if (state.step === 'brandedRinging') {
    if (state.callMode === 'live' && ['failed', 'busy', 'no-answer', 'canceled'].includes(String(state.callStatus || '').toLowerCase())) {
      return { ...scene, short: 'Call did not connect', caption: 'Twilio reports that the live call did not connect.', cue: 'Check the reported call status and your Twilio logs. You can still explain the fictional outcome with the illustrated phone.' };
    }
    if (state.callPreviewDevice === 'android') {
      return {
        ...scene,
        short: 'Android call-reason example',
        caption: 'This illustrated Android 14+ call shows where a registered reason can appear with the name and logo.',
        cue: `${state.callMode === 'live' ? 'Answer your real phone and say “No, I do not recognize that charge.” The spoken answer should update the bank app automatically. ' : 'This is a preview; no call was placed. Choose a simulated answer with the presenter buttons. '}“Card security alert” on the simulated Android 14+ phone is an example, not a confirmed reason in your approved bundle.`,
      };
    }
    return state.callMode === 'live'
      ? { ...scene, short: 'iPhone display comparison', caption: 'This illustrated iPhone shows name and logo, the elements Twilio lists for supported iPhones.', cue: 'Watch your real handset and say “No, I do not recognize that charge.” The bank app should update from the call. This iPhone is a simulated display comparison; switch back to Android 14+ to show an example reason.' }
      : { ...scene, short: 'iPhone display comparison', caption: 'This illustrated iPhone shows name and logo, the elements Twilio lists for supported iPhones.', cue: 'This is a preview; no call was placed. Choose a simulated answer with the presenter buttons. Switch back to Android 14+ to show an example reason.' };
  }
  return scene;
}

function presenterSceneFor(state) {
  if (state.audienceView === 'architecture') {
    return {
      short: 'Architecture overview',
      caption: 'The trust pattern behind the customer story.',
      cue: 'Trace an urgent decision into Branded Calling, then a lower-urgency update into RCS. Show the deliberate SMS comparison and the separate RCS-to-SMS fallback.',
    };
  }
  if (state.audienceView === 'technicalNotes') {
    return {
      short: 'Implementation guide',
      caption: 'Open a setup path from the trust architecture.',
      cue: 'Click RCS, Branded Calling, SHAKEN/STIR, CNAM, or Voice Integrity for the Console steps and API example. Each page has a Back to architecture link.',
    };
  }
  const scene = sceneFor(state);
  if (state.step === 'rcsSent' && illustratedRcsAvailable(state)) {
    return {
      ...scene,
      cue: `${scene.cue} Point out the verified-sender check. Click Twilio Bank at the top of the illustrated phone to show its business profile, then use Back and View case.`,
    };
  }
  return scene;
}

function phoneCueFor(state, config) {
  if (presenterAuthenticated && state.step === 'unknownMissed' && config.voiceReady) {
    return { key: 'ready:call', label: 'Real phone step', detail: pendingAction === 'placeCall' ? 'Placing the AI agent call to your test phone…' : 'Click Place AI agent call, then answer your phone and speak with the agent.' };
  }
  if (presenterAuthenticated && state.step === 'reached' && state.chargeDecision === 'unrecognized' && config.smsReady) {
    return { key: 'ready:sms', label: 'Real phone step', detail: pendingAction === 'sendSms' ? 'Sending the case-status SMS to your test phone…' : 'Click Send live SMS to show the number-only case update on your test phone.' };
  }
  if (presenterAuthenticated && state.step === 'smsIgnored' && config.rcsReady) {
    return { key: 'ready:rcs', label: 'Real phone step', detail: pendingAction === 'sendRcs' ? 'Sending the case update to your test phone…' : 'Click Send live RCS to send the branded case update to your test phone.' };
  }
  if (state.step === 'smsSent' && state.smsMode === 'live') {
    if (['failed', 'undelivered', 'canceled'].includes(String(state.smsStatus || '').toLowerCase())) return null;
    return { key: `sms:${state.smsSid || 'pending'}`, label: 'Check your phone now', detail: String(state.smsStatus || '').toLowerCase() === 'delivered' ? 'Look for the SMS from a phone number. Twilio reports delivery.' : 'Look for the SMS from a phone number. Twilio accepted the request; delivery is not confirmed yet.' };
  }
  if (state.step === 'rcsSent' && state.messageMode === 'live') {
    if (['failed', 'undelivered', 'canceled'].includes(String(state.messageStatus || '').toLowerCase())) return null;
    if (state.rcsExampleShown && state.messageChannel === 'fallback') {
      return { key: `message-example:${state.messageSid || 'pending'}`, label: 'Compare with your phone', detail: 'Your phone received number-only fallback; the shared screen shows a labeled RCS illustration.' };
    }
    const messageStatus = String(state.messageStatus || '').toLowerCase();
    const delivered = ['delivered', 'read'].includes(messageStatus);
    const detail = state.messageChannel === 'fallback'
      ? `Look for the later RCS request’s SMS fallback. ${delivered ? 'Twilio reports delivery from a phone-number sender.' : 'Delivery is not confirmed yet.'}`
      : state.messageChannel === 'rcs'
        ? `Look for the branded case update on your test handset. ${messageStatus === 'read' ? 'Twilio reports RCS read.' : delivered ? 'Twilio reports RCS delivery.' : 'Delivery is not confirmed yet.'}`
        : 'Look for the branded case update on your test handset. Twilio accepted the request; delivery is not confirmed yet.';
    return { key: `message:${state.messageSid || 'pending'}`, label: 'Check your phone now', detail };
  }
  if (state.step === 'brandedRinging' && state.callMode === 'live') {
    if (['completed', 'failed', 'busy', 'no-answer', 'canceled'].includes(String(state.callStatus || '').toLowerCase())) return null;
    return { key: `call:${state.callSid || 'pending'}`, label: 'Answer and speak', detail: 'Say “No, I do not recognize that charge.” The bank app should update automatically. The illustrated Android call reason may differ from your handset.' };
  }
  return null;
}

function updatePhoneCuePulse(phoneCue) {
  const key = phoneCue?.key || '';
  if (!key) {
    lastPhoneCueKey = '';
    return;
  }
  if (key === lastPhoneCueKey) return;
  lastPhoneCueKey = key;
  pulsingPhoneCueKey = key;
  window.clearTimeout(phoneCuePulseTimer);
  phoneCuePulseTimer = window.setTimeout(() => {
    if (pulsingPhoneCueKey !== key) return;
    pulsingPhoneCueKey = '';
    root.querySelector('.current-scene-attention')?.classList.remove('current-scene-attention');
  }, 1300);
}

function focusedPresenterControl() {
  const active = document.activeElement;
  if (!active || !root.contains(active)) return null;
  if (active.matches('[data-action]')) return { type: 'action', action: active.dataset.action, quick: Boolean(active.closest('.current-actions')) };
  if (active.matches('[data-theme-toggle]')) return { type: 'theme' };
  if (active.matches('[data-dismiss-error]')) return { type: 'dismiss' };
  if (active.matches('.open-audience')) return { type: 'audience' };
  if (active.matches('.presenter-notes summary')) return { type: 'notes' };
  return null;
}

function restorePresenterFocus(intent) {
  if (!intent) return;
  let target;
  if (intent.type === 'action') {
    const buttons = [...root.querySelectorAll('[data-action]:not(:disabled)')];
    target = buttons.find((button) => button.dataset.action === intent.action && Boolean(button.closest('.current-actions')) === intent.quick)
      || buttons.find((button) => button.dataset.action === intent.action)
      || root.querySelector('.current-actions [data-action]:not(:disabled)');
  } else if (intent.type === 'theme') target = root.querySelector('[data-theme-toggle]');
  else if (intent.type === 'dismiss') target = root.querySelector('[data-dismiss-error]') || root.querySelector('.current-actions [data-action]:not(:disabled)');
  else if (intent.type === 'audience') target = root.querySelector('.open-audience');
  else if (intent.type === 'notes') target = root.querySelector('.presenter-notes summary');
  target?.focus({ preventScroll: true });
}

function render() {
  const path = window.location.pathname;
  if (path !== '/bank') rcsProfileTab = null;
  if (path === '/presenter' && presenterAuthenticated !== true) {
    document.title = 'Presenter sign in · Twilio Bank';
    if (presenterAuthenticated === null) {
      if (!root.querySelector('.presenter-auth-loading')) {
        root.innerHTML = `<div class="loading-screen presenter-auth-loading" role="status"><div class="loading-mark">••<br />••</div><p>Checking presenter access…</p></div>`;
      }
    } else if (!root.querySelector('.presenter-login-shell')) {
      renderPresenterLogin();
    }
    return;
  }
  if (!snapshot) return;
  const state = snapshot.state;
  if (path === '/presenter') {
    deferredPresenterFocus = focusedPresenterControl() || deferredPresenterFocus;
    const notesOpen = Boolean(root.querySelector('.presenter-notes[open]'));
    const phoneCue = phoneCueFor(state, snapshot.config);
    updatePhoneCuePulse(phoneCue);
    document.title = 'Presenter controls · Twilio Bank';
    root.innerHTML = renderPresenter(state, snapshot.config, phoneCue);
    if (notesOpen) root.querySelector('.presenter-notes')?.setAttribute('open', '');
    if (!pendingAction) {
      restorePresenterFocus(deferredPresenterFocus);
      deferredPresenterFocus = null;
    }
  } else if (path === '/architecture' || path === '/architecture/details') {
    const detailsOnly = path === '/architecture/details';
    const topic = new URLSearchParams(window.location.search).get('topic') || '';
    document.title = detailsOnly ? 'Implementation guide · Twilio Bank' : 'Architecture · Twilio Bank';
    root.innerHTML = detailsOnly ? renderArchitectureGuide(topic, architectureShotVariants) : renderArchitecture(state, false);
  } else {
    const showingCase = new URLSearchParams(window.location.search).get('case') === '1';
    document.title = showingCase ? 'Case status · Twilio Bank' : 'Customer account · Twilio Bank';
    const previousProfileScroll = root.querySelector('.phone-rcs-profile-scroll');
    const profileScrollTop = previousProfileScroll?.dataset.profileTab === rcsProfileTab
      ? previousProfileScroll.scrollTop : 0;
    root.innerHTML = showingCase ? renderCaseStatus(state) : renderBank(state, snapshot.config);
    const currentProfileScroll = root.querySelector('.phone-rcs-profile-scroll');
    if (currentProfileScroll) currentProfileScroll.scrollTop = profileScrollTop;
  }
}

function renderPresenterLogin() {
  root.innerHTML = `<div class="presenter-login-shell">
    <header class="presenter-topbar">${brand()}${themeButton()}</header>
    <main class="presenter-login-main"><section class="presenter-login-card" aria-labelledby="presenter-login-title">
      <div class="presenter-login-symbol">${icon('shield', 25)}</div>
      <h1 id="presenter-login-title">Presenter sign in</h1>
      <p>Enter the password to run Anthony’s fraud alert story.</p>
      <form data-presenter-login autocomplete="off" aria-busy="${loginPending}">
        <label for="presenter-password">Password</label>
        <input id="presenter-password" name="password" type="password" autocomplete="off" autocapitalize="none" autocorrect="off" spellcheck="false" required ${loginError ? 'aria-invalid="true" aria-describedby="presenter-login-error"' : ''} ${loginPending ? 'disabled' : ''} />
        ${loginError ? `<p class="presenter-login-error" id="presenter-login-error" role="alert">${icon('alert', 15)} ${escapeHtml(loginError)}</p>` : ''}
        <button type="submit" ${loginPending ? 'disabled' : ''}>${loginPending ? 'Signing in…' : 'Open presenter controls'} ${icon('arrow', 18)}</button>
      </form>
    </section></main>
  </div>`;
  if (!loginPending) root.querySelector('#presenter-password')?.focus({ preventScroll: true });
}

function syncAudienceRoute() {
  if (!snapshot || isPresenter) return;
  if (customerViewPinned) return;
  if (audiencePathOverride === window.location.pathname) return;
  const wanted = snapshot.state.audienceView === 'technicalNotes' ? '/architecture/details'
    : snapshot.state.audienceView === 'architecture' ? '/architecture'
      : snapshot.state.step === 'caseViewed' ? '/bank?case=1' : '/bank';
  if (window.location.pathname + window.location.search !== wanted) window.history.replaceState(wanted === '/bank?case=1' ? { presenterFollow: true } : null, '', wanted);
}

function renderBank(state, config) {
  const scene = sceneFor(state);
  const flagged = state.step !== 'idle';
  const contacted = ['unknownRinging', 'unknownMissed', 'brandedRinging', 'reached', 'smsSent', 'smsIgnored', 'rcsSent'].includes(state.step);
  const phone = renderPhone(state, config, { rcsProfileTab });
  const transactionStatus = state.chargeDecision === 'unrecognized' ? 'Fraud report received'
    : state.chargeDecision === 'recognized' ? 'Answer recorded' : 'Review needed';

  return `<div class="audience-shell bank-shell${contacted ? ' bank-shell-contact' : ''}">
    <aside class="bank-sidebar" aria-label="Banking navigation">
      <div>${brand('brand-in-sidebar')}<div class="sidebar-caption">Personal banking</div></div>
      <nav class="sidebar-nav" aria-label="Account sections">
        <span class="nav-item nav-active">${icon('home', 19)}<span>Overview</span></span>
        <span class="nav-item">${icon('card', 19)}<span>My cards</span></span>
        <span class="nav-item">${icon('activity', 19)}<span>Activity</span></span>
        <span class="nav-item">${icon('shield', 19)}<span>Security</span></span>
      </nav>
      <div class="sidebar-bottom"><span class="demo-dot"></span> Fictional demo account</div>
    </aside>
    <div class="bank-body">
      <header class="bank-topbar">${brand('brand-in-mobile-topbar')}<span class="bank-topbar-title">Overview</span><div class="bank-topbar-right"><span class="bank-service-status"><span class="service-dot"></span> All accounts connected</span>${themeButton()}<span class="avatar" aria-label="Anthony Dellavecchia account">AD</span></div></header>
      <main class="bank-canvas">
        <div class="scene-strip"><div><span class="scene-kicker">${escapeHtml(scene.chapter)}</span><span class="scene-caption">${escapeHtml(scene.caption)}</span></div><span class="scene-demo-note">Fictional scenario</span></div>
        <div class="bank-stage ${contacted ? 'contact-active' : ''}">
          <div class="bank-content-column">
            <div class="bank-greeting"><p>Good afternoon, Anthony</p><h1>Your money, in view.</h1><span>Here’s what’s happening with your accounts today.</span></div>
            <div class="account-overview">
              <section class="balance-panel" aria-label="Checking account"><div class="panel-top"><span>Everyday checking</span>${icon('chevron', 18)}</div><div class="balance-value">$12,480<span>.60</span></div><div class="balance-bottom"><span>Available balance</span><span>•• 1914</span></div></section>
              <section class="plastic-card" aria-label="Twilio Bank credit card"><div class="plastic-glow"></div><div class="plastic-top"><span>twilio bank</span>${bugMark('card-bug')}</div><div class="plastic-chip"><i></i><i></i><i></i><i></i></div><div class="plastic-bottom"><span>•••• &nbsp;•••• &nbsp;•••• &nbsp;4829</span><span>Anthony Dellavecchia</span></div></section>
            </div>
            ${flagged ? renderFraudAlert(state) : ''}
            <section class="activity-panel"><div class="section-header"><div><h2>Recent activity</h2><p>Your latest account and card activity</p></div><span class="period-pill">This week</span></div><div class="activity-list">
              ${flagged ? renderTransaction('Midlife Crisis Motors', `Vehicle deposit · ${transactionStatus}`, 'MM', '−$9,800.00', 'transaction-alert') : ''}
              ${renderTransaction('Hearth & Home', 'Card purchase · Yesterday', 'HH', '−$42.18')}
              ${renderTransaction('Direct deposit', 'Payroll · Wednesday', 'DD', '+$2,850.00', 'transaction-credit')}
              ${renderTransaction('Cloud Nine Coffee', 'Card purchase · Tuesday', 'CN', '−$6.75')}
            </div></section>
          </div>
          ${phone ? `<div class="bank-phone-column">${phone}</div>` : ''}
        </div>
      </main>
    </div>
  </div>`;
}

function renderCaseStatus(state) {
  const hasReport = state.chargeDecision === 'unrecognized';
  const responseSource = state.decisionSource === 'voice'
    ? 'Anthony reported the charge during the live call.'
    : 'Anthony’s response was selected in the presenter simulation.';
  return `<div class="audience-shell bank-shell case-status-page">
    <aside class="bank-sidebar" aria-label="Banking navigation">
      <div>${brand('brand-in-sidebar')}<div class="sidebar-caption">Personal banking</div></div>
      <nav class="sidebar-nav" aria-label="Account sections">
        <span class="nav-item">${icon('home', 19)}<span>Overview</span></span>
        <span class="nav-item">${icon('card', 19)}<span>My cards</span></span>
        <span class="nav-item">${icon('activity', 19)}<span>Activity</span></span>
        <span class="nav-item nav-active">${icon('shield', 19)}<span>Security</span></span>
      </nav>
      <div class="sidebar-bottom"><span class="demo-dot"></span> Fictional demo account</div>
    </aside>
    <div class="bank-body">
      <header class="bank-topbar">${brand('brand-in-mobile-topbar')}<span class="bank-topbar-title">Case status</span><div class="bank-topbar-right"><span class="bank-service-status"><span class="service-dot"></span> All accounts connected</span>${themeButton()}<span class="avatar" aria-label="Anthony Dellavecchia account">AD</span></div></header>
      <main class="bank-canvas case-canvas">
        <div class="case-navigation"><a href="${customerViewPinned ? '/bank?home=1&amp;customer=1' : '/bank?home=1'}">← Back to overview</a><span>Twilio Bank · Fictional demo</span></div>
        <div class="case-heading"><span class="case-eyebrow">Card security</span><h1>${hasReport ? 'Fraud report received' : 'No fraud report yet'}</h1><p>${hasReport ? 'Anthony’s answer is on file in this fictional banking app.' : 'The fraud question has not been answered in this demo.'}</p></div>
        ${hasReport ? `<section class="case-panel" aria-label="Fictional fraud case status">
          <div class="case-panel-status"><span class="case-status-icon">${icon('check', 21)}</span><div><strong>Report received</strong><small>The charge needs further review</small></div><span class="case-status-pill">Status update</span></div>
          <div class="case-purchase"><span>Reported transaction</span><div><h2>Midlife Crisis Motors</h2><strong>$9,800.00</strong></div><p>Vehicle deposit · Credit card ending 4829</p></div>
          <div class="case-steps" aria-label="Case progress"><div><span class="case-step-marker">${icon('check', 15)}</span><div><strong>Purchase flagged</strong><p>Twilio Bank noticed the vehicle deposit.</p></div></div><div><span class="case-step-marker">${icon('check', 15)}</span><div><strong>Anthony answered the call</strong><p>${escapeHtml(responseSource)}</p></div></div><div><span class="case-step-marker case-step-pending">${icon('clock', 15)}</span><div><strong>Further review</strong><p>Next steps would be handled by the bank outside this demo.</p></div></div></div>
        </section>` : '<section class="case-panel case-empty"><p>Return to the account overview and run the fraud call first.</p></section>'}
        <p class="case-demo-note">Fictional demo: this page does not freeze a card, open a real case, or start an investigation.</p>
      </main>
    </div>
  </div>`;
}

function renderFraudAlert(state) {
  const answered = ['recognized', 'unrecognized'].includes(state.chargeDecision);
  const unrecognized = answered && state.chargeDecision === 'unrecognized';
  const spoken = answered && state.decisionSource === 'voice';
  const status = !answered ? 'Needs your review' : spoken ? 'Response received' : 'Simulated response';
  const heading = !answered ? 'Do you recognize this purchase?'
    : unrecognized ? 'Anthony reported this charge.' : 'Anthony recognizes this purchase.';
  const detail = !answered ? 'Please review this recent charge on your card ending in 4829.'
    : unrecognized ? 'His answer was recorded. This demo has not changed a real card or started a bank investigation.'
      : 'His answer is recorded for this demo. No real card action was taken.';
  const answer = unrecognized ? 'No, not mine' : 'Yes, I made it';
  return `<section class="fraud-alert${answered ? ' fraud-reached' : ''}${unrecognized ? ' fraud-unrecognized' : ''}" aria-live="polite">
    <div class="fraud-icon">${icon(answered ? 'check' : 'shield', 23)}</div>
    <div class="fraud-content">
      <div class="fraud-heading"><span>Card security</span><span class="fraud-status">${status}</span></div>
      <h2>${heading}</h2><p>${detail}</p>
      ${answered ? `<div class="fraud-answer${unrecognized ? ' fraud-answer-review' : ''}"><span>Purchase decision</span><strong>${answer}</strong><small>${spoken ? 'Decision recorded from the live call' : 'Selected by the presenter · simulation'}</small></div>` : ''}
      <div class="purchase-detail"><div><strong>Midlife Crisis Motors</strong><span>Vehicle deposit · credit card •••• 4829</span></div><strong>$9,800.00</strong></div>
    </div>
  </section>`;
}

function renderTransaction(name, sub, initials, amount, extra = '') {
  return `<div class="transaction-row ${extra}"><span class="transaction-icon">${escapeHtml(initials)}</span><span class="transaction-copy"><strong>${escapeHtml(name)}</strong><small>${escapeHtml(sub)}</small></span><strong class="transaction-amount">${escapeHtml(amount)}</strong></div>`;
}

function renderArchitecture(_state, detailsOnly = false) {
  const templatePayload = `POST https://content.twilio.com/v1/Content
Authorization: Basic <base64(account_sid:auth_token)>
Content-Type: application/json

{
  "friendly_name": "twilio_bank_case_update_webinar_demo_v2",
  "language": "en",
  "types": {
    "twilio/card": {
      "title": "Fraud report received",
      "body": "Your report about the $9,800.00 Midlife Crisis Motors charge is being reviewed.",
      "media": ["https://app.example/rcs-case-update-card.png"],
      "actions": [{
        "type": "URL",
        "title": "View case",
        "id": "view_case",
        "url": "https://app.example/bank?case=1"
      }]
    },
    "twilio/text": {
      "body": "Twilio Bank: Your fraud report for the $9,800.00 Midlife Crisis Motors charge is being reviewed. View case status in your banking app."
    }
  }
}`;
  const smsRequest = `import twilio from "twilio";
const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);
await client.messages.create({
  to: "+15551234567",
  messagingServiceSid: process.env.TWILIO_MESSAGING_SERVICE_SID,
  from: process.env.TWILIO_SMS_FROM,
  body: "Twilio Bank: We received your report about the $9,800.00 Midlife Crisis Motors charge. View case status in your banking app."
});`;
  const messageRequest = `import twilio from "twilio";
const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);
await client.messages.create({
  to: "+15551234567",
  messagingServiceSid: process.env.TWILIO_MESSAGING_SERVICE_SID,
  contentSid: process.env.TWILIO_RCS_CASE_CONTENT_SID
});`;
  const callRequest = `import twilio from "twilio";
const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);
const response = new twilio.twiml.VoiceResponse();
response.connect().conversationRelay({
  url: "wss://app.example/voice-relay",
  language: "en-US",
  transcriptionProvider: "Deepgram",
  ttsProvider: "ElevenLabs",
  voice: process.env.TWILIO_ELEVENLABS_VOICE_ID,
  welcomeGreeting: "Hi Anthony, this is the Twilio Bank virtual assistant. I am calling about a nine thousand eight hundred dollar vehicle deposit at Midlife Crisis Motors. Do you recognize this charge?",
  welcomeGreetingInterruptible: "speech",
  interruptible: "speech",
  reportInputDuringAgentSpeech: "speech"
});
await client.calls.create({
  to: "+15551234567",
  from: process.env.TWILIO_VOICE_FROM,
  twiml: response.toString(),
  timeLimit: 180
});`;
  const websocketReply = `ws.send(JSON.stringify({
  type: "text",
  token: "I can help ",
  last: false,
  interruptible: true,
  preemptible: false
}));
ws.send(JSON.stringify({
  type: "text",
  token: "with that.",
  last: true,
  interruptible: true,
  preemptible: false
}));`;

  return `<div class="audience-shell architecture-shell${detailsOnly ? ' architecture-details-only' : ''}">
    <header class="architecture-topbar">
      ${brand()}
      <div class="architecture-topbar-right">${detailsOnly ? '<a href="/architecture?view=1">Back to overview</a>' : '<a href="/architecture/details?view=1">Implementation guide</a>'}${themeButton()}</div>
    </header>

    <main class="architecture-main">
      <section class="architecture-slide" aria-labelledby="architecture-title">
        <div class="architecture-intro">
          <h1 id="architecture-title">Trust begins before they tap or answer.</h1>
        </div>

        <section class="architecture-map" aria-label="Application outreach and customer trust flow">
          <div class="map-origin">
            <span class="map-stage">Your application</span>
            <span class="map-origin-symbol">${icon('activity', 30)}</span>
            <strong>Choose a channel.</strong>
          </div>

          <div class="map-arrow" aria-hidden="true"></div>

          <div class="map-channels">
            <a class="map-channel map-channel-call" href="${architectureGuideHref('branded-calling')}" aria-label="Branded Calling path: open setup guide">
              <div class="map-channel-copy">
                <h2>Branded Calling</h2>
                <p class="map-channel-summary">Name, logo, reason · ConversationRelay</p>
                <span class="map-channel-link" aria-hidden="true">${icon('arrow', 20)}</span>
              </div>
              <div class="call-art" aria-label="Illustrative branded incoming call from Twilio with an example call reason">
                <span class="call-art-logo">${bugMark()}</span>
                <span class="call-art-identity"><small>Incoming call</small><strong>Twilio</strong><span>Card security alert</span></span>
                <span class="call-art-answer">${icon('phone', 18)}</span>
              </div>
            </a>

            <a class="map-channel map-channel-rcs" href="${architectureGuideHref('rcs')}" aria-label="RCS messaging path: open setup guide">
              <div class="map-channel-copy">
                <h2>RCS messaging</h2>
                <p class="map-channel-summary">Verified sender · rich actions · SMS fallback</p>
                <span class="map-channel-link" aria-hidden="true">${icon('arrow', 20)}</span>
              </div>
              <div class="message-art" aria-label="Illustrative branded RCS case update from Twilio Bank">
                <div class="message-art-header">
                  <span class="message-art-logo">${bugMark()}</span>
                  <span><strong>Twilio Bank</strong></span>
                </div>
                <div class="message-art-body">Fraud report received</div>
                <div class="message-art-action">View case ${icon('chevron', 14)}</div>
              </div>
            </a>
          </div>

          <div class="map-arrow" aria-hidden="true"></div>

          <div class="map-outcome">
            <span class="map-stage">Customer</span>
            <strong class="map-outcome-summary">Recognize.<br><span>Respond.</span></strong>
          </div>
        </section>

        <section class="architecture-trust" aria-labelledby="architecture-trust-title">
          <div class="architecture-trust-heading">
            <h2 id="architecture-trust-title">Voice trust</h2>
          </div>
          <nav class="architecture-trust-links" aria-label="Explore voice trust setup">
            <a class="trust-layer" href="${architectureGuideHref('shaken-stir')}" aria-label="SHAKEN/STIR setup: required for US Enhanced Branded Calling; caller ID authentication">
              <span class="trust-layer-icon">${icon('shield', 24)}</span>
              <span class="trust-layer-copy"><span class="trust-layer-status trust-layer-status-required">Required for Enhanced</span><strong>SHAKEN/STIR</strong><span class="trust-layer-description">Caller ID authentication</span></span>
              <span class="trust-layer-arrow">${icon('chevron', 18)}</span>
            </a>
            <a class="trust-layer" href="${architectureGuideHref('cnam')}" aria-label="CNAM setup: optional caller name registration">
              <span class="trust-layer-icon">${icon('eye', 24)}</span>
              <span class="trust-layer-copy"><span class="trust-layer-status trust-layer-status-optional">Optional</span><strong>CNAM</strong><span class="trust-layer-description">Caller name</span></span>
              <span class="trust-layer-arrow">${icon('chevron', 18)}</span>
            </a>
            <a class="trust-layer" href="${architectureGuideHref('voice-integrity')}" aria-label="Voice Integrity setup: recommended but optional for US Enhanced Branded Calling; address spam labels">
              <span class="trust-layer-icon">${icon('activity', 24)}</span>
              <span class="trust-layer-copy"><span class="trust-layer-status trust-layer-status-recommended">Recommended</span><strong>Voice Integrity</strong><span class="trust-layer-description">Spam labeling</span></span>
              <span class="trust-layer-arrow">${icon('chevron', 18)}</span>
            </a>
          </nav>
        </section>

        <footer class="architecture-footer">
          <nav aria-label="Twilio documentation sources">
            <span>Twilio sources</span>
            <a href="${SOURCES.rcsSend}" target="_blank" rel="noopener noreferrer">RCS + fallback</a>
            <a href="${SOURCES.branded}" target="_blank" rel="noopener noreferrer">Branded Calling</a>
            <a href="${SOURCES.relayTwiML}" target="_blank" rel="noopener noreferrer">ConversationRelay</a>
          </nav>
        </footer>
      </section>
    </main>

    <main class="architecture-appendix">
      <div class="architecture-appendix-inner">
        <div class="appendix-heading"><span class="appendix-kicker">Behind the overview</span><h1>How the trust moment is built</h1><p>Identity gets the customer’s attention. Routing and conversation logic turn that attention into a useful interaction.</p></div>

        <section class="appendix-setup" aria-label="Identity setup">
          <div class="appendix-section-heading"><span>01 / Identity</span><h2>Make the business recognizable</h2></div>
          <div class="appendix-setup-grid">
            <article><span>Business identity</span><h3>Register the business</h3><p>Keep business details and verification workflows in Trust Hub.</p><a href="${SOURCES.trustHub}" target="_blank" rel="noopener noreferrer">Trust Hub docs ${icon('external', 13)}</a></article>
            <article><span>Calling identity</span><h3>Approve the calling number</h3><p>Assign the number to a Branded Calling bundle. Display of name, logo, and reason depends on device and carrier.</p><a href="${SOURCES.branded}" target="_blank" rel="noopener noreferrer">US Enhanced Branded Calling ${icon('external', 13)}</a></article>
            <article><span>Messaging identity</span><h3>Set up RCS and fallback</h3><p>Pair an approved RCS sender with an SMS/MMS sender in a Messaging Service. Invited testers can try RCS earlier.</p><a href="${SOURCES.rcsOnboarding}" target="_blank" rel="noopener noreferrer">RCS onboarding ${icon('external', 13)}</a></article>
          </div>
        </section>

        <section class="appendix-voice" aria-labelledby="appendix-voice-title">
          <div class="appendix-voice-heading"><div><span>02 / Live voice</span><h2 id="appendix-voice-title">What happens after the call is answered</h2><p>Twilio runs the speech layer. Your application controls the conversation and brings its own agent or model.</p></div></div>
          <div class="relay-diagram" aria-label="Caller audio passes through ConversationRelay, which sends a transcribed prompt over WebSocket to your application and agent. Agent text streams back for speech playback.">
            <div class="relay-nodes">
              <div class="relay-node relay-node-caller"><span class="relay-node-icon">${icon('phone', 23)}</span><span class="relay-node-label">Person</span><strong>Caller</strong><small>Speaks and listens</small></div>
              <span class="relay-connector" aria-hidden="true">↔</span>
              <div class="relay-node relay-node-twilio"><span class="relay-node-icon">${bugMark()}</span><span class="relay-node-label">Twilio voice</span><strong>ConversationRelay</strong><small>Speech to text · text to speech</small></div>
              <span class="relay-connector" aria-hidden="true">↔</span>
              <div class="relay-node relay-node-app"><span class="relay-node-icon">${icon('layers', 23)}</span><span class="relay-node-label">Your infrastructure</span><strong>WebSocket app</strong><small>Events, state, and business rules</small></div>
              <span class="relay-connector" aria-hidden="true">↔</span>
              <div class="relay-node relay-node-agent"><span class="relay-node-icon">${icon('activity', 23)}</span><span class="relay-node-label">Your choice</span><strong>Agent or model</strong><small>Decides what to say</small></div>
            </div>
            <div class="relay-events">
              <div><span>IN / Speech</span><p>Twilio sends transcribed caller speech as a <code>prompt</code> event.</p></div>
              <div><span>OUT / Reply</span><p>Your app streams <code>text</code> to Twilio for speech playback.</p></div>
              <div><span>BARGE-IN / Interrupt</span><p>If the caller talks over playback, Twilio sends an <code>interrupt</code> event.</p></div>
            </div>
          </div>
          <p class="appendix-source">Twilio sources: <a href="${SOURCES.relayTwiML}" target="_blank" rel="noopener noreferrer">ConversationRelay</a> · <a href="${SOURCES.relayMessages}" target="_blank" rel="noopener noreferrer">WebSocket events</a> · <a href="${SOURCES.relayBestPractices}" target="_blank" rel="noopener noreferrer">Streaming guidance</a> · <a href="${SOURCES.relayInsights}" target="_blank" rel="noopener noreferrer">Voice Insights</a></p>
        </section>

        <section class="appendix-scale" aria-labelledby="appendix-scale-title">
          <div class="appendix-section-heading"><span>03 / Optional extension</span><h2 id="appendix-scale-title">Carry trust into the next conversation</h2><p>Twilio’s newer Conversations layer can group an RCS message and a voice call for one customer. The demo does not yet connect to it. <a href="${SOURCES.orchestratorChannels}" target="_blank" rel="noopener noreferrer">Supported channels</a> · <a href="${SOURCES.orchestratorGrouping}" target="_blank" rel="noopener noreferrer">Grouping</a></p></div>
          <div class="appendix-scale-grid">
            <article><span>Organize</span><h3>Conversation Orchestrator</h3><p>Groups RCS text and voice transcripts by customer profile when configured.</p><a href="${SOURCES.orchestratorGrouping}" target="_blank" rel="noopener noreferrer">Twilio docs ${icon('external', 13)}</a></article>
            <article><span>Remember</span><h3>Conversation Memory</h3><p>Lets an agent retrieve relevant customer context across interactions.</p><a href="${SOURCES.memory}" target="_blank" rel="noopener noreferrer">Twilio docs ${icon('external', 13)}</a></article>
            <article><span>Connect</span><h3>Twilio Agent Connect</h3><p>A self-hosted SDK that connects your own agent to Twilio channels and these services.</p><a href="${SOURCES.agentConnect}" target="_blank" rel="noopener noreferrer">Twilio docs ${icon('external', 13)}</a></article>
          </div>
          <p class="appendix-scale-note">These services are optional for this demo. Twilio states <a href="${SOURCES.agentConnectLegal}" target="_blank" rel="noopener noreferrer">Agent Connect</a>, <a href="${SOURCES.orchestrator}" target="_blank" rel="noopener noreferrer">Orchestrator</a>, and <a href="${SOURCES.memory}" target="_blank" rel="noopener noreferrer">Memory</a> are not PCI compliant and should not be used in PCI workflows. <a href="${SOURCES.conversations}" target="_blank" rel="noopener noreferrer">Explore Twilio Conversations</a></p>
        </section>

        <section class="appendix-requests" aria-label="Illustrative Twilio API requests">
          <div class="appendix-requests-heading"><div class="appendix-section-heading"><span>04 / Example requests</span><h2>What the application sends</h2></div><p>Underlined lines show the key Twilio parameters. Replace example SIDs, numbers, and URLs before using these payloads.</p></div>
          <div class="appendix-request-grid">
            <details class="appendix-request">
              <summary><span>Branded call and voice session</span><small>View code ${icon('chevron', 14)}</small></summary>
              <div class="appendix-request-body">
                <h4>Call from an approved number <small>Branded identity and live voice</small></h4><pre><code>${highlightCode(callRequest, ['response.connect().conversationRelay(', '  url: "wss:', '  transcriptionProvider:', '  ttsProvider:', '  interruptible:', '  from:', '  twiml:'])}</code></pre>
                <h4>Stream the reply over WebSocket <small>Speech chunks and final marker</small></h4><pre><code>${highlightCode(websocketReply, ['  type: "text"', '  token:', '  last:'])}</code></pre>
                <p>The approved bundle on the From number supplies its display identity where supported. Your agent or model supplies the reply text. <a href="${SOURCES.calls}" target="_blank" rel="noopener noreferrer">Calls API</a> · <a href="${SOURCES.relayMessages}" target="_blank" rel="noopener noreferrer">WebSocket messages</a></p>
              </div>
            </details>
            <details class="appendix-request">
              <summary><span>SMS and RCS send requests</span><small>View code ${icon('chevron', 14)}</small></summary>
              <div class="appendix-request-body">
                <h4>After the fraud call: send a case-status SMS <small>Choose the phone-number sender</small></h4><pre><code>${highlightCode(smsRequest, ['  to:', '  messagingServiceSid:', '  from:', '  body:'])}</code></pre>
                <p><strong>Live webinar test.</strong> When configured, this sends the fictional case update to the presenter's fixed test phone. The verified toll-free number currently lists marketing; align its registration with the traffic before using it for production case updates. <a href="${SOURCES.tollFreeUseCases}" target="_blank" rel="noopener noreferrer">Twilio toll-free verification</a></p>
                <p>This deliberate SMS send specifies both the Messaging Service and its phone-number sender. It is separate from SMS/MMS fallback on the later RCS request. <a href="${SOURCES.messagingServices}" target="_blank" rel="noopener noreferrer">Messaging Service sender selection</a></p>
                <h4>Create the case-update Content Template once <small>RCS card with a URL action and text fallback</small></h4><pre><code>${highlightCode(templatePayload, ['"twilio/card"', '"title": "Fraud report received', '"body": "Your report', '"media":', '"actions":', '"title": "View case', '"url": "https:', '"twilio/text"', '"body": "Twilio Bank:'])}</code></pre>
                <h4>Send it for each case update <small>Recipient, sender, template</small></h4><pre><code>${highlightCode(messageRequest, ['  to:', '  messagingServiceSid:', '  contentSid:'])}</code></pre>
                <p>The RCS request uses an HX template with card and text variants. The View case action needs a public URL. A ContentSid send does not also include a Body field. <a href="${SOURCES.card}" target="_blank" rel="noopener noreferrer">Twilio card</a> · <a href="${SOURCES.contentApi}" target="_blank" rel="noopener noreferrer">Content API</a> · <a href="${SOURCES.rcsSend}" target="_blank" rel="noopener noreferrer">RCS fallback</a></p>
              </div>
            </details>
          </div>
        </section>
      </div>
    </main>
  </div>`;

}

function renderEventLog(events, limit = 20) {
  if (!events.length) return `<div class="event-empty">No events yet. Begin the story from the private presenter tab.</div>`;
  return `<ol class="event-list">${events.slice().reverse().slice(0, limit).map((event) => {
    const kind = event.kind || 'system';
    const label = kind === 'real' ? 'Live Twilio' : kind === 'simulated' ? 'Simulated' : 'Story state';
    const time = event.at ? new Date(event.at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', second: '2-digit' }) : '';
    return `<li class="event-row"><span class="event-time">${escapeHtml(time)}</span><span class="event-kind event-${escapeHtml(kind)}">${escapeHtml(label)}</span><div class="event-copy"><strong>${escapeHtml(event.title)}</strong>${event.detail ? `<p>${escapeHtml(event.detail)}</p>` : ''}</div></li>`;
  }).join('')}</ol>`;
}

function presenterButton(action, label, options = {}) {
  const disabled = Boolean(options.disabled || pendingAction);
  const primary = options.primary ? ' action-primary' : '';
  const live = options.live ? ' action-live' : '';
  const future = options.live && options.futureStep ? ' action-future' : '';
  const unavailable = options.live && options.unavailable ? ' action-unavailable' : '';
  const selected = pendingAction === action ? ' action-pending' : '';
  const badge = options.live ? `<span class="action-kind">${options.unavailable ? 'Setup needed' : 'Real phone'}</span>` : options.simulated ? `<span class="action-kind action-kind-sim">Simulation</span>` : '';
  const note = options.unavailable || (options.futureStep ? `Unlocks at step ${options.futureStep}` : '');
  return `<button type="button" class="action-button${primary}${live}${future}${unavailable}${selected}" data-action="${escapeHtml(action)}" ${disabled ? 'disabled' : ''}><span class="action-button-label">${escapeHtml(pendingAction === action ? 'Working…' : label)}${note ? `<small>${escapeHtml(note)}</small>` : ''}</span>${badge}</button>`;
}

function renderRcsFallbackToggle(state) {
  if (state.step !== 'rcsSent' || state.messageMode !== 'live' || state.messageChannel !== 'fallback') return '';
  return state.rcsExampleShown
    ? presenterButton('showActualFallback', 'Show live fallback view', { simulated: true })
    : presenterButton('showRcsExample', 'Show intended RCS example', { simulated: true });
}

function renderNextActions(state, config) {
  switch (state.step) {
    case 'idle': return presenterButton('flagPurchase', 'Flag purchase', { primary: true });
    case 'flagged': return presenterButton('showUnknownCall', 'Show unknown call', { primary: true, simulated: true });
    case 'unknownRinging': return presenterButton('ignoreUnknownCall', 'Anthony ignores it', { primary: true, simulated: true });
    case 'unknownMissed': return `${presenterButton('placeCall', 'Place AI agent call', { primary: config.voiceReady, disabled: !config.voiceReady, live: true, unavailable: !config.voiceReady && 'Configure AI call to enable' })}${presenterButton('previewBrandedCall', 'Show call preview', { primary: !config.voiceReady, simulated: true })}`;
    case 'brandedRinging': return `${state.callMode === 'live' ? '<span class="voice-awaiting" role="status">Waiting for the spoken answer. Manual choices are backup.</span>' : '<span class="voice-awaiting" role="status">Choose a simulated answer to finish the preview.</span>'}${presenterButton('confirmPurchase', 'Yes, I made it', { simulated: true })}${presenterButton('reportUnrecognized', 'No, not mine', { simulated: true })}`;
    case 'reached':
      if (state.chargeDecision === 'unrecognized' && state.audienceView === 'bank') {
        return `${presenterButton('sendSms', 'Send live SMS', { primary: config.smsReady, disabled: !config.smsReady, live: true, unavailable: !config.smsReady && 'Configure SMS to enable' })}${presenterButton('previewSms', 'Show SMS preview', { primary: !config.smsReady, simulated: true })}`;
      }
      return state.audienceView === 'bank'
        ? presenterButton('showArchitecture', 'Show architecture', { primary: true })
        : state.audienceView === 'architecture'
          ? presenterButton('showTechnicalNotes', 'Show setup guide', { primary: true })
          : `<span class="story-complete" role="status">${icon('check', 17)} Story complete</span>`;
    case 'smsSent': return presenterButton('ignoreSms', 'Anthony ignores SMS', { primary: true, simulated: true });
    case 'smsIgnored': return `${presenterButton('sendRcs', 'Send live RCS', { primary: config.rcsReady, disabled: !config.rcsReady, live: true, unavailable: !config.rcsReady && 'Configure RCS to enable' })}${presenterButton('previewRcs', 'Show RCS preview', { primary: !config.rcsReady, simulated: true })}`;
    case 'rcsSent': return `${presenterButton('viewCase', 'View case status', { primary: true, simulated: true })}${renderRcsFallbackToggle(state)}`;
    case 'caseViewed': return state.audienceView === 'bank'
      ? presenterButton('showArchitecture', 'Show architecture', { primary: true })
      : state.audienceView === 'architecture'
        ? presenterButton('showTechnicalNotes', 'Show setup guide', { primary: true })
        : `<span class="story-complete" role="status">${icon('check', 17)} Story complete</span>`;
    default: return '';
  }
}

function renderPresenter(state, config, phoneCue) {
  const scene = presenterSceneFor(state);
  const step = state.step;
  const smsReady = Boolean(config.smsReady);
  const rcsReady = Boolean(config.rcsReady);
  const voiceReady = Boolean(config.voiceReady);
  const canSms = step === 'reached' && state.chargeDecision === 'unrecognized';
  const canRcs = step === 'smsIgnored';
  const canCall = step === 'unknownMissed';
  const currentStepIndex = Object.keys(SCENES).indexOf(step);
  const smsFutureStep = smsReady && currentStepIndex < 5 ? '06/10' : '';
  const rcsFutureStep = rcsReady && currentStepIndex < 7 ? '08/10' : '';
  const callFutureStep = voiceReady && currentStepIndex < 3 ? '04/10' : '';
  const canCompareCall = step === 'brandedRinging' || step === 'reached';
  const channelLabel = {
    simulated: 'Preview only',
    pending: 'Pending confirmation',
    rcs: 'RCS confirmed',
    fallback: 'RCS request used SMS/MMS fallback',
    unknown: 'Unverified',
  }[state.messageChannel] || '—';
  return `<div class="presenter-shell">
    <header class="presenter-topbar">${brand()}<div class="presenter-topbar-right"><span class="private-badge">${icon('eye', 15)} Private presenter view</span>${themeButton()}</div></header>
    <main class="presenter-main"><div class="presenter-heading"><div><p class="presenter-kicker">Live webinar control room</p><h1>Run Anthony’s fraud alert story</h1><p>Keep this tab private. Share the separate audience window in your webinar.</p></div><a class="open-audience" href="/bank" target="twilio-bank-audience">Open audience window ${icon('external', 16)}</a></div>
      <div class="presenter-grid"><div class="presenter-controls">
        ${actionError ? `<div class="error-banner" role="alert">${icon('alert', 18)}<span>${escapeHtml(actionError)}</span><button type="button" data-dismiss-error aria-label="Dismiss error">×</button></div>` : ''}
        ${transportError ? `<div class="connection-banner" role="status">${icon('refresh', 17)} ${escapeHtml(transportError)}</div>` : ''}
        <section class="current-scene${phoneCue ? ' current-scene-phone' : ''}${phoneCue?.key === pulsingPhoneCueKey ? ' current-scene-attention' : ''}"><div class="current-scene-copy"><span class="current-scene-label">${state.audienceView === 'bank' ? 'On screen now' : 'Presenter-selected page'}</span><h2>${escapeHtml(scene.short)}</h2><p>${escapeHtml(scene.caption)}</p>${phoneCue ? `<div class="current-scene-phone-cue" role="status"><strong>${icon('phone', 16)} ${escapeHtml(phoneCue.label)}</strong><span>${escapeHtml(phoneCue.detail)}</span></div>` : ''}</div><div class="current-scene-side"><span class="step-index">${String(currentStepIndex + 1).padStart(2, '0')} / 10</span><div class="current-actions">${renderNextActions(state, config)}</div><button type="button" class="restart-story-button" data-action="reset" ${step === 'idle' && !state.events.length || pendingAction ? 'disabled' : ''}>${icon('refresh', 14)} ${escapeHtml(pendingAction === 'reset' ? 'Restarting…' : 'Restart story')}</button></div></section>
        <section class="control-group"><div class="group-heading"><span>01</span><div><h2>Set the scene</h2><p>The bank flags one charge. Anthony has not opened the app.</p></div></div><div class="action-stack">${presenterButton('flagPurchase', 'Flag the $9,800.00 charge', { disabled: step !== 'idle', primary: step === 'idle', simulated: true })}</div></section>
        <section class="control-group"><div class="group-heading"><span>02</span><div><h2>The unknown call</h2><p>A simulated number-only call is easy to ignore when the bank needs an urgent answer.</p></div></div><div class="action-stack two-up">${presenterButton('showUnknownCall', 'Show unknown call', { disabled: step !== 'flagged', primary: step === 'flagged', simulated: true })}${presenterButton('ignoreUnknownCall', 'Anthony ignores it', { disabled: step !== 'unknownRinging', primary: step === 'unknownRinging', simulated: true })}</div></section>
        <section class="control-group"><div class="group-heading"><span>03</span><div><h2>The branded call</h2><p>Anthony recognizes the caller and answers the urgent fraud question by voice.</p></div></div><div class="action-stack">
          <div class="action-stack two-up">${presenterButton('placeCall', 'Place live AI agent call', { disabled: !canCall || !voiceReady, primary: canCall && voiceReady, live: true, futureStep: callFutureStep, unavailable: !voiceReady && 'Configure AI call to enable' })}${presenterButton('previewBrandedCall', 'Show call preview', { disabled: !canCall, primary: canCall && !voiceReady, simulated: true })}</div>
          ${canCompareCall ? `<div class="call-preview-options"><div class="call-preview-copy"><strong>Compare supported displays</strong><small>Android 14+ is the default call example. “Card security alert” is illustrative; the reason in your approved bundle is unverified.</small></div><div class="action-stack two-up">${presenterButton('showIphoneCallExample', 'iPhone · name + logo', { disabled: state.callPreviewDevice === 'iphone', simulated: true })}${presenterButton('showAndroidReasonExample', 'Android 14+ · example reason', { disabled: state.callPreviewDevice === 'android', simulated: true })}</div></div>` : ''}
          <div class="decision-manual"><p>${step === 'brandedRinging' && state.callMode === 'live' ? 'The live call should set the answer automatically. Use these only if the voice answer is missed.' : 'Manual choices show a simulated answer for the story.'}</p><div class="action-stack two-up">${presenterButton('confirmPurchase', 'Yes, I made it', { disabled: step !== 'brandedRinging', simulated: true })}${presenterButton('reportUnrecognized', 'No, not mine', { disabled: step !== 'brandedRinging', simulated: true })}</div></div>
        </div></section>
        <section class="control-group"><div class="group-heading"><span>04</span><div><h2>The number-only case update</h2><p>After the call, Anthony hesitates over a case-status SMS from a plain number.</p></div></div><div class="action-stack">
          <div class="action-stack two-up">${presenterButton('sendSms', 'Send live SMS', { disabled: !canSms || !smsReady, primary: canSms && smsReady, live: true, futureStep: smsFutureStep, unavailable: !smsReady && 'Configure SMS to enable' })}${presenterButton('previewSms', 'Show SMS preview', { disabled: !canSms, primary: canSms && !smsReady, simulated: true })}</div>
          ${presenterButton('ignoreSms', 'Anthony ignores the SMS', { disabled: step !== 'smsSent', primary: step === 'smsSent', simulated: true })}
        </div></section>
        <section class="control-group"><div class="group-heading"><span>05</span><div><h2>The branded RCS case update</h2><p>Anthony can check the sender and open the fictional case page from a rich card.</p></div></div><div class="action-stack">
          <div class="action-stack two-up">${presenterButton('sendRcs', 'Send live rich RCS', { disabled: !canRcs || !rcsReady, primary: canRcs && rcsReady, live: true, futureStep: rcsFutureStep, unavailable: !rcsReady && 'Configure RCS to enable' })}${presenterButton('previewRcs', 'Show RCS preview', { disabled: !canRcs, primary: canRcs && !rcsReady, simulated: true })}</div>
          ${renderRcsFallbackToggle(state)}
          ${presenterButton('viewCase', 'Open fictional case page', { disabled: step !== 'rcsSent', primary: step === 'rcsSent', simulated: true })}
        </div></section>
        <section class="control-group control-group-tools"><div class="group-heading"><span>06</span><div><h2>Explain the build</h2><p>Open the trust overview, then click a setup path.</p></div></div><div class="action-stack two-up">${presenterButton('showArchitecture', 'Show architecture', { primary: (step === 'caseViewed' || step === 'reached' && state.chargeDecision === 'recognized') && state.audienceView === 'bank' })}${presenterButton('showTechnicalNotes', 'Show setup guide', { primary: (step === 'caseViewed' || step === 'reached' && state.chargeDecision === 'recognized') && state.audienceView === 'architecture' })}</div><div class="action-stack">${presenterButton('showBank', 'Show bank app')}${presenterButton('refreshStatuses', 'Refresh live statuses', { disabled: !state.smsSid && !state.messageSid && !state.callSid })}</div></section>
      </div><aside class="presenter-sidebar">
        <section class="presenter-panel"><div class="panel-title"><h2>What to say now</h2><span>${icon('message', 18)}</span></div><p class="cue-text">${escapeHtml(scene.cue)}</p></section>
        <section class="presenter-panel"><div class="panel-title"><h2>Live setup</h2><span>${icon('shield', 18)}</span></div><div class="readiness-row"><span class="readiness-indicator ${voiceReady ? 'ready' : ''}"></span><div><strong>Branded AI agent call</strong><small>${voiceReady ? `Configured ${escapeHtml(config.callerMasked || 'caller')} → ${escapeHtml(config.recipientMasked || 'recipient')} · Relay + OpenAI` : 'Set the approved number, recipient, OPENAI_API_KEY, and public relay URL (wss://) on the server'}</small></div></div><div class="readiness-row"><span class="readiness-indicator ${smsReady ? 'ready' : ''}"></span><div><strong>Case-status SMS</strong><small>${smsReady ? `Configured from ${escapeHtml(config.smsSenderMasked || 'SMS sender')} to ${escapeHtml(config.recipientMasked || 'demo recipient')}` : 'Configure an SMS sender in the Messaging Service and set TWILIO_SMS_FROM'}</small></div></div><div class="readiness-row"><span class="readiness-indicator ${rcsReady ? 'ready' : ''}"></span><div><strong>RCS case update</strong><small>${rcsReady ? `Configured for ${escapeHtml(config.recipientMasked || 'demo recipient')} · confirm tester invitation` : 'Configure an invited RCS tester and TWILIO_RCS_CASE_CONTENT_SID on the server'}</small></div></div><p class="panel-hint">Configured means values are present and well formed; it does not verify delivery, ConversationRelay onboarding, public reachability, or handset display. See <code>PRESENTER.md</code> for setup.</p></section>
        <section class="presenter-panel"><div class="panel-title"><h2>Live status and answer</h2><span>${icon('activity', 18)}</span></div><dl class="result-list"><div><dt>SMS SID</dt><dd>${escapeHtml(state.smsSid || '—')}</dd></div><div><dt>SMS status</dt><dd>${escapeHtml(state.smsStatus || '—')}</dd></div><div><dt>RCS SID</dt><dd>${escapeHtml(state.messageSid || '—')}</dd></div><div><dt>RCS request status</dt><dd>${escapeHtml(state.messageStatus || '—')}</dd></div><div><dt>RCS delivery channel</dt><dd>${escapeHtml(channelLabel)}</dd></div><div><dt>Call SID</dt><dd>${escapeHtml(state.callSid || '—')}</dd></div><div><dt>Call status</dt><dd>${escapeHtml(state.callStatus || '—')}</dd></div><div><dt>Anthony’s answer</dt><dd>${state.chargeDecision === 'recognized' ? 'Recognized purchase' : state.chargeDecision === 'unrecognized' ? 'Did not recognize' : '—'}</dd></div><div><dt>Answer source</dt><dd>${state.decisionSource === 'voice' ? 'Live voice' : state.decisionSource === 'presenter' ? 'Presenter simulation' : '—'}</dd></div></dl><p class="panel-hint">“Accepted” confirms an API request, not delivery. A completed call does not establish a purchase decision.</p></section>
        <section class="presenter-panel presenter-event-panel"><div class="panel-title"><h2>Recent events</h2><span class="event-count">${state.events.length}</span></div>${renderEventLog(state.events, 5)}</section>
        <details class="presenter-notes"><summary>Device and channel notes</summary><p>Your Samsung Android 13 is outside Twilio’s documented Samsung Android 14+ support for US Enhanced Branded Calling. The iPhone and Android 14+ views are simulations. The approved caller name is “Twilio”; “Card security alert” illustrates a possible call reason and is not confirmed as the reason in your bundle. Twilio lists call-reason display on supported Android devices, while its iPhone entries list name and logo only.</p><p>The call reason comes from your approved Branded Calling registration, not the TwiML. ConversationRelay transcribes caller speech and voices agent replies with ElevenLabs; the application server gets responses from OpenAI. The demo can capture a spoken purchase decision; manual choices are labeled simulations.</p><p>The post-call SMS is a deliberate send from a phone-number sender. It is separate from SMS/MMS fallback if the later RCS request cannot use RCS. Before RCS approval, send only to a tester who accepted the sender invitation.</p><div><a href="${SOURCES.messagingServices}" target="_blank" rel="noopener noreferrer">Messaging Services ${icon('external', 13)}</a><a href="${SOURCES.branded}" target="_blank" rel="noopener noreferrer">Calling guide ${icon('external', 13)}</a><a href="${SOURCES.relay}" target="_blank" rel="noopener noreferrer">ConversationRelay ${icon('external', 13)}</a><a href="${SOURCES.rcsTutorial}" target="_blank" rel="noopener noreferrer">RCS tester tutorial ${icon('external', 13)}</a></div></details>
      </aside></div>
    </main>
  </div>`;
}

function applySnapshot(next) {
  if (!next || !next.state || !next.config) return;
  if (!illustratedRcsAvailable(next.state)
    || next.state.audienceView !== 'bank'
    || snapshot?.state.step !== next.state.step
    || snapshot?.state.audienceViewRevision !== next.state.audienceViewRevision) rcsProfileTab = null;
  if (snapshot && (snapshot.state.audienceView !== next.state.audienceView
    || snapshot.state.audienceViewRevision !== next.state.audienceViewRevision)) audiencePathOverride = null;
  snapshot = next;
  transportError = '';
  syncAudienceRoute();
  render();
}

async function loadSnapshot() {
  try {
    const response = await fetch('/api/state', { cache: 'no-store' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    applySnapshot(await response.json());
  } catch (error) {
    transportError = 'The demo server is unavailable. Reload this tab to try again.';
    root.innerHTML = `<div class="fatal-error"><h1>Couldn’t load the demo</h1><p>${escapeHtml(transportError)}</p><button type="button" onclick="location.reload()">Try again</button></div>`;
  }
}

async function loadArchitectureShotVariants() {
  let manifestLoaded = false;
  try {
    const response = await fetch('/api/architecture-shots', { cache: 'no-store' });
    if (response.ok) {
      const variants = await response.json();
      if (variants && typeof variants === 'object' && !Array.isArray(variants)) {
        architectureShotVariants = variants;
        manifestLoaded = true;
      }
    }
  } catch (_) {}
  if (window.location.pathname !== '/architecture/details') return;

  // A server started before single images were added to its manifest can
  // still serve them. Probe the open guide step when its entry is missing.
  const topic = new URLSearchParams(window.location.search).get('topic') || '';
  const shot = architectureShotForPage(topic, window.location.search);
  if (!shot || architectureShotVariants[shot]?.length) return;
  const variants = [];
  if (!manifestLoaded) {
    for (let number = 1; number <= 100; number++) {
      let found = null;
      for (const extension of ['png', 'jpg', 'jpeg', 'webp']) {
        const filename = `/architecture-shots/${shot}-${number}.${extension}`;
        try {
          if ((await fetch(filename, { method: 'HEAD', cache: 'no-store' })).ok) {
            found = filename;
            break;
          }
        } catch (_) {}
      }
      if (!found) break;
      variants.push(found);
    }
  }
  if (!variants.length) {
    for (const extension of ['png', 'jpg', 'jpeg', 'webp']) {
      const filename = `/architecture-shots/${shot}.${extension}`;
      try {
        if ((await fetch(filename, { method: 'HEAD', cache: 'no-store' })).ok) {
          variants.push(filename);
          break;
        }
      } catch (_) {}
    }
  }
  if (variants.length) architectureShotVariants[shot] = variants;
}

async function checkPresenterSession() {
  try {
    const response = await fetch('/api/presenter/session', { cache: 'no-store', credentials: 'same-origin' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    presenterAuthenticated = (await response.json()).authenticated === true;
  } catch (_) {
    presenterAuthenticated = false;
    loginError = 'Couldn’t check presenter access. Enter the password to try again.';
  }
  render();
}

async function loginPresenter(form) {
  if (loginPending) return;
  const input = form.elements.namedItem('password');
  const password = input.value;
  input.value = '';
  loginPending = true;
  loginError = '';
  renderPresenterLogin();
  try {
    const response = await fetch('/api/presenter/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ password }),
    });
    if (response.status === 401) {
      loginError = 'That password didn’t work. Try again.';
      return;
    }
    if (!response.ok || (await response.json()).authenticated !== true) {
      loginError = `Couldn’t sign in (HTTP ${response.status}). Try again.`;
      return;
    }
    presenterAuthenticated = true;
    actionError = '';
    if (!snapshot) await loadSnapshot();
  } catch (_) {
    loginError = 'Couldn’t sign in. Check the connection and try again.';
  } finally {
    loginPending = false;
    if (presenterAuthenticated) render();
    else renderPresenterLogin();
  }
}

async function runAction(action) {
  if (pendingAction || !presenterAuthenticated) return;
  pendingAction = action;
  actionError = '';
  render();
  try {
    const response = await fetch('/api/action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ action }),
    });
    if (response.status === 401) {
      presenterAuthenticated = false;
      loginError = 'Your presenter session ended. Enter the password to continue.';
      deferredPresenterFocus = null;
      return;
    }
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || `The action failed (HTTP ${response.status}).`);
    applySnapshot(data);
  } catch (error) {
    actionError = error.message || 'The action failed.';
  } finally {
    pendingAction = null;
    render();
  }
}

root.addEventListener('submit', (event) => {
  const form = event.target.closest('[data-presenter-login]');
  if (!form) return;
  event.preventDefault();
  loginPresenter(form);
});

root.addEventListener('click', (event) => {
  if (!isPresenter && snapshot && illustratedRcsAvailable(snapshot.state)) {
    if (event.target.closest('[data-rcs-profile-open]')) {
      rcsProfileTab = 'info';
      render();
      root.querySelector('[data-rcs-profile-back]')?.focus({ preventScroll: true });
      return;
    }
    if (event.target.closest('[data-rcs-profile-back]') && rcsProfileTab) {
      rcsProfileTab = null;
      render();
      root.querySelector('[data-rcs-profile-open]')?.focus({ preventScroll: true });
      return;
    }
    const profileTab = event.target.closest('[data-rcs-profile-tab]')?.dataset.rcsProfileTab;
    if (rcsProfileTab && ['info', 'options'].includes(profileTab)) {
      rcsProfileTab = profileTab;
      render();
      root.querySelector(`[data-rcs-profile-tab="${profileTab}"]`)?.focus({ preventScroll: true });
      return;
    }
  }
  const action = event.target.closest('[data-action]');
  if (action && !action.disabled) {
    if (window.location.pathname === '/presenter') deferredPresenterFocus = { type: 'action', action: action.dataset.action, quick: Boolean(action.closest('.current-actions')) };
    runAction(action.dataset.action);
    return;
  }
  if (event.target.closest('[data-dismiss-error]')) { actionError = ''; render(); return; }
  if (event.target.closest('[data-theme-toggle]')) {
    const next = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light';
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem('twilio-bank-theme-v2', next); } catch (_) {}
    if (isPresenter && presenterAuthenticated === false) {
      const button = root.querySelector('[data-theme-toggle]');
      if (button) { button.outerHTML = themeButton(); root.querySelector('[data-theme-toggle]')?.focus(); }
    } else render();
  }
});

window.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape' || !rcsProfileTab || window.location.pathname !== '/bank') return;
  rcsProfileTab = null;
  render();
  root.querySelector('[data-rcs-profile-open]')?.focus({ preventScroll: true });
});

window.addEventListener('storage', (event) => {
  if (event.key === 'twilio-bank-theme-v2') {
    document.documentElement.dataset.theme = event.newValue || 'light';
    if (isPresenter && presenterAuthenticated === false) {
      const button = root.querySelector('[data-theme-toggle]');
      if (button) button.outerHTML = themeButton();
    } else render();
  }
});

window.addEventListener('popstate', () => { syncAudienceRoute(); render(); });

if (isPresenter) await Promise.all([loadSnapshot(), checkPresenterSession()]);
else {
  await loadArchitectureShotVariants();
  await loadSnapshot();
}
const stream = new EventSource('/api/events');
stream.onmessage = (event) => {
  try { applySnapshot(JSON.parse(event.data)); } catch (_) {}
};
stream.onerror = () => {
  transportError = 'Reconnecting to the local demo server…';
  if (window.location.pathname === '/presenter') render();
};
