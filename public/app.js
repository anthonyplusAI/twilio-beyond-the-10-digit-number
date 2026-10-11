import { renderPhone } from './phone.js';

const root = document.getElementById('app');
const presenterToken = window.location.pathname === '/presenter'
  ? (new URLSearchParams(window.location.hash.slice(1)).get('token') || '')
  : '';
const SOURCES = {
  trustHub: 'https://www.twilio.com/docs/trust-hub',
  rcsOnboarding: 'https://www.twilio.com/docs/rcs/onboarding',
  rcsTutorial: 'https://www.twilio.com/en-us/blog/developers/tutorials/product/build-rcs-business-messaging-campaign-twilio',
  rcsSend: 'https://www.twilio.com/docs/rcs/send-an-rcs-message',
  card: 'https://www.twilio.com/docs/content/twiliocard',
  calls: 'https://www.twilio.com/docs/voice/api/call-resource',
  branded: 'https://www.twilio.com/docs/voice/branded-calling/us-enhanced',
};

const SCENES = {
  idle: { chapter: 'The customer view', caption: 'Anthony checks his accounts on an ordinary afternoon.', short: 'Ready to begin', cue: 'Introduce Anthony Dellavecchia and the fictional Twilio Bank account. One card charge will anchor the entire story.' },
  flagged: { chapter: 'The moment that matters', caption: 'A $9,800.00 vehicle deposit needs Anthony’s attention.', short: 'Purchase flagged', cue: 'A $9,800.00 vehicle deposit is flagged. Our goal is to reach Anthony quickly enough to review it.' },
  unknownRinging: { chapter: 'Attempt 1 · Unknown number', caption: 'The call arrives without a recognizable identity.', short: 'Unknown call ringing', cue: 'Pause on the phone. Ask the audience whether they would answer this unknown number.' },
  unknownMissed: { chapter: 'Attempt 1 · Missed', caption: 'Anthony ignores the call, and the charge remains unconfirmed.', short: 'Call ignored', cue: 'This is the cost of low trust: an important alert is still unresolved.' },
  rewound: { chapter: 'Replay · Same purchase', caption: 'The event is the same. The communication experience changes.', short: 'Ready for trusted outreach', cue: 'Rewind to the same purchase. Show how a recognizable message can carry context before a follow-up call.' },
  rcsSent: { chapter: 'Attempt 2 · Rich message', caption: 'The illustrated phone shows purchase details in a branded message.', short: 'RCS alert shown', cue: 'If configured, this action sent a real rich-card request to an invited RCS tester. Confirm delivery on your actual handset. The iPhone view is illustrative.' },
  noResponse: { chapter: 'Attempt 2 · No response', caption: 'No reply arrives, so the application escalates the outreach.', short: 'No response', cue: 'No response is a presenter-selected state here. In an app, you would use your own timing and event logic to decide when to call.' },
  brandedRinging: { chapter: 'Attempt 2 · Branded call', caption: 'A follow-up call identifies the registered business.', short: 'Branded call ringing', cue: 'The approved caller name is Twilio. The iPhone shows name and logo; switch to the Android 14+ example to illustrate where a call reason can appear.' },
  reached: { chapter: 'The outcome · Contact made', caption: 'Anthony can now review the charge with the bank.', short: 'Customer reached', cue: 'We have improved the chance to connect. Marking reached is a story action, not proof derived from a Twilio call status.' },
};

let snapshot = null;
let pendingAction = null;
let actionError = '';
let transportError = '';
let deferredPresenterFocus = null;

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[character]));
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
  return `<div class="brand ${variant}"><span class="brand-bug">${bugMark()}</span><span class="brand-name">twilio<span>bank</span></span></div>`;
}

function sceneFor(state) {
  const scene = SCENES[state.step] || SCENES.idle;
  if (state.step === 'rcsSent') {
    if (state.messageMode === 'live' && state.messageChannel === 'rcs') {
      return { ...scene, short: 'RCS delivery confirmed', caption: 'Twilio reports delivery over RCS. The iPhone card remains an illustration.', cue: 'The refreshed Message resource reports delivery from the RCS sender. Show the actual tester handset beside this illustrated iPhone.' };
    }
    if (state.messageMode === 'live' && state.messageChannel === 'fallback') {
      return { ...scene, short: 'Fallback delivery confirmed', caption: 'Twilio reports delivery from a phone-number sender. The illustrated phone now shows the text fallback.', cue: 'The refreshed Message resource reports delivery from a phone-number sender. Explain how the Messaging Service used fallback, then show the actual phone.' };
    }
    if (state.messageMode === 'live' && ['failed', 'undelivered', 'canceled'].includes(String(state.messageStatus || '').toLowerCase())) {
      return { ...scene, short: 'Message not delivered', caption: 'Twilio reports that the live message was not delivered. The iPhone card remains an example.', cue: 'The live message did not reach the phone. Use the status and Console logs to explain what happened, then continue the fictional story with the simulated card if useful.' };
    }
    return state.messageMode === 'live'
      ? { ...scene, short: 'Message request accepted', caption: 'Twilio accepted the message request. Its delivery channel is not confirmed yet.', cue: 'Twilio accepted the rich-card request to the invited tester. Confirm delivery on your actual handset, then refresh status. The iPhone view is illustrative.' }
      : { ...scene, short: 'RCS preview shown', cue: 'This is a preview. No message was sent. The iPhone view illustrates a rich RCS card for the same purchase.' };
  }
  if (state.step === 'brandedRinging') {
    if (state.callPreviewDevice === 'android') {
      return {
        ...scene,
        short: 'Android call-reason example',
        caption: 'A supported Android 14+ device can show the registered call reason with the name and logo.',
        cue: '“Card security alert” is an illustrative reason; the approved reason on your actual bundle is unverified. This Android phone is simulated. Twilio documents call reasons on supported Android 14+ devices.',
      };
    }
    return state.callMode === 'live'
      ? { ...scene, short: 'Call request accepted', caption: 'Twilio accepted the outbound call. The iPhone view illustrates supported display.', cue: 'Twilio accepted the outbound call request. Watch your actual handset for the call. The approved caller name is Twilio; the audience iPhone is a simulation.' }
      : { ...scene, short: 'Branded call preview', cue: 'This is a preview. No call was placed. The iPhone illustrates how the approved Twilio identity can appear on a supported device.' };
  }
  return scene;
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
  if (!snapshot) return;
  const path = window.location.pathname;
  const state = snapshot.state;
  if (path === '/presenter') {
    deferredPresenterFocus = focusedPresenterControl() || deferredPresenterFocus;
    const notesOpen = Boolean(root.querySelector('.presenter-notes[open]'));
    document.title = 'Presenter controls · Twilio Bank';
    root.innerHTML = renderPresenter(state, snapshot.config);
    if (notesOpen) root.querySelector('.presenter-notes')?.setAttribute('open', '');
    if (!pendingAction) {
      restorePresenterFocus(deferredPresenterFocus);
      deferredPresenterFocus = null;
    }
  } else if (state.audienceView === 'architecture') {
    document.title = 'Architecture · Twilio Bank';
    root.innerHTML = renderArchitecture(state);
  } else {
    document.title = 'Customer account · Twilio Bank';
    root.innerHTML = renderBank(state);
  }
}

function syncAudienceRoute() {
  if (!snapshot || window.location.pathname === '/presenter') return;
  const wanted = snapshot.state.audienceView === 'architecture' ? '/architecture' : '/bank';
  if (window.location.pathname !== wanted) window.history.replaceState(null, '', wanted);
}

function renderBank(state) {
  const scene = sceneFor(state);
  const flagged = state.step !== 'idle';
  const contacted = ['unknownRinging', 'unknownMissed', 'rcsSent', 'noResponse', 'brandedRinging', 'reached'].includes(state.step);
  const resolved = state.step === 'reached';
  const phone = renderPhone(state);
  const currentStatus = resolved ? 'Contact made' : 'Needs your review';

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
      <header class="bank-topbar"><span class="bank-topbar-title">Overview</span><div class="bank-topbar-right"><span class="bank-service-status"><span class="service-dot"></span> All accounts connected</span>${themeButton()}<span class="avatar" aria-label="Anthony Dellavecchia account">AD</span></div></header>
      <main class="bank-canvas">
        <div class="scene-strip"><div><span class="scene-kicker">${escapeHtml(scene.chapter)}</span><span class="scene-caption">${escapeHtml(scene.caption)}</span></div><span class="scene-demo-note">Fictional scenario</span></div>
        <div class="bank-stage ${contacted ? 'contact-active' : ''}">
          <div class="bank-content-column">
            <div class="bank-greeting"><p>Good afternoon, Anthony</p><h1>Your money, in view.</h1><span>Here’s what’s happening with your accounts today.</span></div>
            <div class="account-overview">
              <section class="balance-panel" aria-label="Checking account"><div class="panel-top"><span>Everyday checking</span>${icon('chevron', 18)}</div><div class="balance-value">$12,480<span>.60</span></div><div class="balance-bottom"><span>Available balance</span><span>•• 1914</span></div></section>
              <section class="plastic-card" aria-label="Twilio Bank credit card"><div class="plastic-glow"></div><div class="plastic-top"><span>twilio bank</span>${bugMark('card-bug')}</div><div class="plastic-chip"><i></i><i></i><i></i><i></i></div><div class="plastic-bottom"><span>•••• &nbsp;•••• &nbsp;•••• &nbsp;4829</span><span>Anthony Dellavecchia</span></div></section>
            </div>
            ${flagged ? `<section class="fraud-alert ${resolved ? 'fraud-reached' : ''}" aria-live="polite"><div class="fraud-icon">${icon(resolved ? 'check' : 'shield', 23)}</div><div class="fraud-content"><div class="fraud-heading"><span>Card security</span><span class="fraud-status">${escapeHtml(currentStatus)}</span></div><h2>${resolved ? 'We connected with you.' : 'Do you recognize this purchase?'}</h2><p>${resolved ? 'We reached you about this charge. Please confirm whether it was yours.' : 'Please review this recent charge on your card ending in 4829.'}</p><div class="purchase-detail"><div><strong>Midlife Crisis Motors</strong><span>Vehicle deposit · credit card •••• 4829</span></div><strong>$9,800.00</strong></div></div></section>` : ''}
            <section class="activity-panel"><div class="section-header"><div><h2>Recent activity</h2><p>Your latest account and card activity</p></div><span class="period-pill">This week</span></div><div class="activity-list">
              ${flagged ? renderTransaction('Midlife Crisis Motors', 'Vehicle deposit · Review needed', 'MM', '−$9,800.00', 'transaction-alert') : ''}
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

function renderTransaction(name, sub, initials, amount, extra = '') {
  return `<div class="transaction-row ${extra}"><span class="transaction-icon">${escapeHtml(initials)}</span><span class="transaction-copy"><strong>${escapeHtml(name)}</strong><small>${escapeHtml(sub)}</small></span><strong class="transaction-amount">${escapeHtml(amount)}</strong></div>`;
}

function renderArchitecture(state) {
  const scene = sceneFor(state);
  return `<div class="audience-shell architecture-shell">
    <header class="architecture-topbar">${brand()}<span class="architecture-nav-title">How the experience works</span><div class="architecture-topbar-right"><span class="architecture-live-dot"></span> ${escapeHtml(scene.short)} ${themeButton()}</div></header>
    <main class="architecture-main">
      <div class="architecture-heading"><div><p class="architecture-kicker">One purchase. Two communication paths.</p><h1>Identity changes the moment of contact.</h1><p>Here is the routing behind Anthony’s fraud alert. Each channel has its own sender setup; the application decides when to escalate.</p></div><div class="architecture-amount"><span>Charge under review</span><strong>$9,800.00</strong><small>Midlife Crisis Motors</small></div></div>
      <section class="flow-section" aria-label="Communication routing diagram"><div class="flow-section-title"><h2>The contact flow</h2><span>RCS → SMS when unavailable · Voice after no response</span></div>
        <div class="flow-row">
          <div class="flow-node flow-incident"><span class="flow-node-icon">${icon('card', 21)}</span><small>01 · Bank application</small><h3>Purchase flagged</h3><p>Your app decides this event needs outreach.</p></div>
          <div class="flow-arrow" aria-hidden="true">${icon('arrow', 25)}</div>
          <div class="flow-node flow-messaging"><span class="flow-node-icon">${icon('message', 21)}</span><small>02 · Messaging Service</small><h3>Choose the best available channel</h3><div class="channel-branches"><div class="channel-branch"><span class="branch-dot"></span><div><strong>RCS first</strong><span>Rich card with purchase details</span></div></div><div class="channel-branch channel-fallback"><span class="branch-dot"></span><div><strong>SMS fallback</strong><span>If RCS is unavailable and SMS is configured</span></div></div></div></div>
          <div class="flow-arrow" aria-hidden="true">${icon('arrow', 25)}</div>
          <div class="flow-node flow-decision"><span class="flow-node-icon">${icon('clock', 21)}</span><small>03 · Application logic</small><h3>No response?</h3><p>Your app determines when to follow up. This step is controlled by the presenter here.</p></div>
          <div class="flow-arrow" aria-hidden="true">${icon('arrow', 25)}</div>
          <div class="flow-node flow-voice"><span class="flow-node-icon">${icon('phone', 21)}</span><small>04 · Voice + approved number</small><h3>Call from Twilio</h3><p>The real registered caller name is “Twilio.” Display depends on carrier and device.</p></div>
        </div>
        <div class="flow-note"><span>${icon('shield', 16)} Sender identity is established separately for each channel.</span><a href="${SOURCES.rcsSend}" target="_blank" rel="noopener noreferrer">Twilio routing docs ${icon('external', 14)}</a></div>
      </section>
      <section class="identity-section" aria-label="Identity setup"><div class="section-header"><div><h2>Where identity is established</h2><p>Registrations that support the experience shown above</p></div></div><div class="identity-grid">
        <div class="identity-item"><div class="identity-number">01</div><div><h3>Business profile</h3><p>Trust Hub holds business identity information used for verification workflows.</p><a href="${SOURCES.trustHub}" target="_blank" rel="noopener noreferrer">Trust Hub docs ${icon('external', 13)}</a></div></div>
        <div class="identity-item"><div class="identity-number">02</div><div><h3>RCS sender</h3><p>A sender can message invited testers while approval is pending.</p><a href="${SOURCES.rcsOnboarding}" target="_blank" rel="noopener noreferrer">RCS onboarding ${icon('external', 13)}</a></div></div>
        <div class="identity-item"><div class="identity-number">03</div><div><h3>Branded Calling</h3><p>The approved number uses “Twilio.” Logo and call reason depend on handset support.</p><a href="${SOURCES.branded}" target="_blank" rel="noopener noreferrer">US Enhanced guide ${icon('external', 13)}</a></div></div>
      </div></section>
      <section class="api-section" aria-label="API requests"><div class="section-header"><div><h2>What the application sends</h2><p>Two API calls, with the recipient fixed in the local server configuration</p></div></div><div class="api-grid"><article class="api-call"><div class="api-call-header"><span>${icon('message', 17)} Rich alert</span><a href="${SOURCES.rcsSend}" target="_blank" rel="noopener noreferrer">Twilio docs ${icon('external', 13)}</a></div><pre><code>POST /2010-04-01/Accounts/{AccountSid}/Messages.json
To=DEMO_TO_NUMBER
MessagingServiceSid=MG…
ContentSid=HX…</code></pre></article><article class="api-call"><div class="api-call-header"><span>${icon('phone', 17)} Follow-up call</span><a href="${SOURCES.calls}" target="_blank" rel="noopener noreferrer">Twilio docs ${icon('external', 13)}</a></div><pre><code>POST /2010-04-01/Accounts/{AccountSid}/Calls.json
To=DEMO_TO_NUMBER
From=APPROVED_NUMBER
Twiml=&lt;Response&gt;…&lt;/Response&gt;</code></pre></article></div><p class="api-section-note">The Messaging Service selects RCS or a configured SMS sender. The decision to call after no reply belongs to your application.</p></section>
      <section class="event-section" aria-label="Demo event log"><div class="section-header"><div><h2>What happened in this run</h2><p>Live API actions and story simulations are labeled separately.</p></div><span class="event-count">${state.events.length} events</span></div>${renderEventLog(state.events)}</section>
      <p class="architecture-disclaimer">The Twilio Bank account, Midlife Crisis Motors charge, and phone screens are fictional. A request accepted by the API is not proof of handset delivery or a human answering. <a href="${SOURCES.calls}" target="_blank" rel="noopener noreferrer">Calls API</a> · <a href="${SOURCES.rcsTutorial}" target="_blank" rel="noopener noreferrer">RCS tester walkthrough</a></p>
    </main>
  </div>`;
}

function renderEventLog(events, limit = 20) {
  if (!events.length) return `<div class="event-empty">No events yet. Begin the story from the private presenter tab.</div>`;
  return `<ol class="event-list">${events.slice().reverse().slice(0, limit).map((event) => {
    const kind = event.kind || 'system';
    const label = kind === 'real' ? 'Live Twilio API' : kind === 'simulated' ? 'Simulated' : 'Story state';
    const time = event.at ? new Date(event.at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', second: '2-digit' }) : '';
    return `<li class="event-row"><span class="event-time">${escapeHtml(time)}</span><span class="event-kind event-${escapeHtml(kind)}">${escapeHtml(label)}</span><div class="event-copy"><strong>${escapeHtml(event.title)}</strong>${event.detail ? `<p>${escapeHtml(event.detail)}</p>` : ''}</div></li>`;
  }).join('')}</ol>`;
}

function presenterButton(action, label, options = {}) {
  const disabled = Boolean(options.disabled || pendingAction || !presenterToken);
  const primary = options.primary ? ' action-primary' : '';
  const live = options.live ? ' action-live' : '';
  const selected = pendingAction === action ? ' action-pending' : '';
  const badge = options.live ? `<span class="action-kind">Live API</span>` : options.simulated ? `<span class="action-kind action-kind-sim">Simulation</span>` : '';
  return `<button type="button" class="action-button${primary}${live}${selected}" data-action="${escapeHtml(action)}" ${disabled ? 'disabled' : ''}><span>${escapeHtml(pendingAction === action ? 'Working…' : label)}</span>${badge}</button>`;
}

function renderNextActions(state, config) {
  switch (state.step) {
    case 'idle': return presenterButton('flagPurchase', 'Flag purchase', { primary: true });
    case 'flagged': return presenterButton('showUnknownCall', 'Show unknown call', { primary: true });
    case 'unknownRinging': return presenterButton('ignoreUnknownCall', 'Anthony ignores it', { primary: true });
    case 'unknownMissed': return presenterButton('rewind', 'Rewind', { primary: true });
    case 'rewound': return `${presenterButton('sendRcs', 'Send live RCS', { primary: config.rcsReady, disabled: !config.rcsReady, live: true })}${presenterButton('previewRcs', 'Show RCS preview', { primary: !config.rcsReady })}`;
    case 'rcsSent': return presenterButton('markNoResponse', 'Mark no response', { primary: true });
    case 'noResponse': return `${presenterButton('placeCall', 'Place live call', { primary: config.voiceReady, disabled: !config.voiceReady, live: true })}${presenterButton('previewBrandedCall', 'Show call preview', { primary: !config.voiceReady })}`;
    case 'brandedRinging': return `${presenterButton('markReached', 'Mark customer reached', { primary: true })}${state.callPreviewDevice === 'android'
      ? presenterButton('showIphoneCallExample', 'Compare iPhone display', { simulated: true })
      : presenterButton('showAndroidReasonExample', 'Show Android call reason', { simulated: true })}`;
    case 'reached': return state.audienceView === 'architecture'
      ? `<span class="story-complete" role="status">${icon('check', 17)} Story complete</span>`
      : presenterButton('showArchitecture', 'Show architecture', { primary: true });
    default: return '';
  }
}

function renderPresenter(state, config) {
  const scene = sceneFor(state);
  const step = state.step;
  const rcsReady = Boolean(config.rcsReady);
  const voiceReady = Boolean(config.voiceReady);
  const canRcs = step === 'rewound';
  const canCall = step === 'noResponse';
  const canCompareCall = step === 'brandedRinging' || step === 'reached';
  const channelLabel = {
    simulated: 'Preview only',
    pending: 'Pending confirmation',
    rcs: 'RCS confirmed',
    fallback: 'Number-based fallback confirmed',
    unknown: 'Unverified',
  }[state.messageChannel] || '—';
  return `<div class="presenter-shell">
    <header class="presenter-topbar">${brand()}<div class="presenter-topbar-right"><span class="private-badge">${icon('eye', 15)} Private presenter view</span>${themeButton()}</div></header>
    <main class="presenter-main"><div class="presenter-heading"><div><p class="presenter-kicker">Live webinar control room</p><h1>Run Anthony’s fraud alert story</h1><p>Keep this tab private. Share the separate audience window in your webinar.</p></div><a class="open-audience" href="/bank" target="twilio-bank-audience">Open audience window ${icon('external', 16)}</a></div>
      <div class="presenter-grid"><div class="presenter-controls">
        ${!presenterToken ? `<div class="connection-banner" role="alert">${icon('shield', 17)} Open the private Presenter URL printed in the server terminal to enable controls.</div>` : ''}
        ${actionError ? `<div class="error-banner" role="alert">${icon('alert', 18)}<span>${escapeHtml(actionError)}</span><button type="button" data-dismiss-error aria-label="Dismiss error">×</button></div>` : ''}
        ${transportError ? `<div class="connection-banner" role="status">${icon('refresh', 17)} ${escapeHtml(transportError)}</div>` : ''}
        <section class="current-scene"><div class="current-scene-copy"><span class="current-scene-label">On screen now</span><h2>${escapeHtml(scene.short)}</h2><p>${escapeHtml(scene.caption)}</p></div><div class="current-scene-side"><span class="step-index">${String(Object.keys(SCENES).indexOf(step) + 1).padStart(2, '0')} / 09</span><div class="current-actions">${renderNextActions(state, config)}</div></div></section>
        <section class="control-group"><div class="group-heading"><span>01</span><div><h2>Set the scene</h2><p>The same charge drives both attempts.</p></div></div><div class="action-stack">${presenterButton('flagPurchase', 'Flag the $9,800.00 charge', { disabled: step !== 'idle', primary: step === 'idle', simulated: true })}</div></section>
        <section class="control-group"><div class="group-heading"><span>02</span><div><h2>The anonymous call</h2><p>Show what Anthony sees without caller identity.</p></div></div><div class="action-stack two-up">${presenterButton('showUnknownCall', 'Show unknown call', { disabled: step !== 'flagged', primary: step === 'flagged', simulated: true })}${presenterButton('ignoreUnknownCall', 'Anthony ignores it', { disabled: step !== 'unknownRinging', primary: step === 'unknownRinging', simulated: true })}</div></section>
        <section class="control-group"><div class="group-heading"><span>03</span><div><h2>Replay with context</h2><p>Send the rich alert, then escalate if there is no reply.</p></div></div><div class="action-stack">
          ${presenterButton('rewind', 'Rewind to the same charge', { disabled: step !== 'unknownMissed', primary: step === 'unknownMissed', simulated: true })}
          <div class="action-stack two-up">${presenterButton('sendRcs', 'Send live rich RCS', { disabled: !canRcs || !rcsReady, primary: canRcs && rcsReady, live: true })}${presenterButton('previewRcs', 'Show RCS preview', { disabled: !canRcs, primary: canRcs && !rcsReady, simulated: true })}</div>
          ${presenterButton('markNoResponse', 'Mark no response', { disabled: step !== 'rcsSent', primary: step === 'rcsSent', simulated: true })}
          <div class="action-stack two-up">${presenterButton('placeCall', 'Place live call from approved number', { disabled: !canCall || !voiceReady, primary: canCall && voiceReady, live: true })}${presenterButton('previewBrandedCall', 'Show call preview', { disabled: !canCall, primary: canCall && !voiceReady, simulated: true })}</div>
          ${canCompareCall ? `<div class="call-preview-options"><div class="call-preview-copy"><strong>Compare supported displays</strong><small>“Card security alert” is an illustrative Android 14+ reason; your registered reason is unverified.</small></div><div class="action-stack two-up">${presenterButton('showIphoneCallExample', 'iPhone · name + logo', { disabled: state.callPreviewDevice === 'iphone', simulated: true })}${presenterButton('showAndroidReasonExample', 'Android 14+ · add reason', { disabled: state.callPreviewDevice === 'android', simulated: true })}</div></div>` : ''}
          ${presenterButton('markReached', 'Mark customer reached', { disabled: step !== 'brandedRinging', primary: step === 'brandedRinging', simulated: true })}
        </div></section>
        <section class="control-group control-group-tools"><div class="group-heading"><span>04</span><div><h2>Explain the build</h2><p>Switch the shared window to the diagram and event log.</p></div></div><div class="action-stack two-up">${presenterButton('showArchitecture', 'Show architecture', { disabled: state.audienceView === 'architecture', primary: step === 'reached' && state.audienceView !== 'architecture' })}${presenterButton('showBank', 'Show bank app', { disabled: state.audienceView === 'bank' })}</div><div class="action-stack two-up">${presenterButton('refreshStatuses', 'Refresh live statuses', { disabled: !state.messageSid && !state.callSid })}${presenterButton('reset', 'Reset story', { disabled: step === 'idle' && !state.events.length })}</div></section>
      </div><aside class="presenter-sidebar">
        <section class="presenter-panel"><div class="panel-title"><h2>What to say now</h2><span>${icon('message', 18)}</span></div><p class="cue-text">${escapeHtml(scene.cue)}</p></section>
        <section class="presenter-panel"><div class="panel-title"><h2>Live setup</h2><span>${icon('shield', 18)}</span></div><div class="readiness-row"><span class="readiness-indicator ${rcsReady ? 'ready' : ''}"></span><div><strong>Rich RCS test</strong><small>${rcsReady ? `Configured for ${escapeHtml(config.recipientMasked || 'demo recipient')} · confirm tester invitation` : 'Add RCS credentials, tester, and Content SID to .env'}</small></div></div><div class="readiness-row"><span class="readiness-indicator ${voiceReady ? 'ready' : ''}"></span><div><strong>Branded call</strong><small>${voiceReady ? `Configured from ${escapeHtml(config.callerMasked || 'caller')} to ${escapeHtml(config.recipientMasked || 'recipient')}` : 'Add your approved calling number and recipient to .env'}</small></div></div><p class="panel-hint">Configured means the values are present and well formed; it does not verify sender approval or handset display. See <code>PRESENTER.md</code> for setup.</p></section>
        <section class="presenter-panel"><div class="panel-title"><h2>Latest API results</h2><span>${icon('activity', 18)}</span></div><dl class="result-list"><div><dt>Message SID</dt><dd>${escapeHtml(state.messageSid || '—')}</dd></div><div><dt>Message status</dt><dd>${escapeHtml(state.messageStatus || '—')}</dd></div><div><dt>Delivery channel</dt><dd>${escapeHtml(channelLabel)}</dd></div><div><dt>Call SID</dt><dd>${escapeHtml(state.callSid || '—')}</dd></div><div><dt>Call status</dt><dd>${escapeHtml(state.callStatus || '—')}</dd></div></dl><p class="panel-hint">“Accepted” confirms an API request, not delivery. A completed call does not prove a person answered.</p></section>
        <section class="presenter-panel presenter-event-panel"><div class="panel-title"><h2>Recent events</h2><span class="event-count">${state.events.length}</span></div>${renderEventLog(state.events, 5)}</section>
        <details class="presenter-notes"><summary>Device and channel notes</summary><p>Your Samsung Android 13 is outside Twilio’s documented Samsung Android 14+ support for US Enhanced Branded Calling. The iPhone and Android 14+ views are simulations. The approved caller name is “Twilio”; “Card security alert” illustrates a possible call reason and is not confirmed as the reason in your bundle. Twilio lists call-reason display on supported Android devices, while its iPhone entries list name and logo only.</p><p>Before RCS approval, send only to a tester who accepted the sender invitation. The SMS branch is illustrated, not sent as part of this rehearsal.</p><div><a href="${SOURCES.branded}" target="_blank" rel="noopener noreferrer">Calling guide ${icon('external', 13)}</a><a href="${SOURCES.rcsTutorial}" target="_blank" rel="noopener noreferrer">RCS tester tutorial ${icon('external', 13)}</a></div></details>
      </aside></div>
    </main>
  </div>`;
}

function applySnapshot(next) {
  if (!next || !next.state || !next.config) return;
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
    transportError = 'The local demo server is unavailable. Restart it and reload this tab.';
    root.innerHTML = `<div class="fatal-error"><h1>Couldn’t load the demo</h1><p>${escapeHtml(transportError)}</p><button type="button" onclick="location.reload()">Try again</button></div>`;
  }
}

async function runAction(action) {
  if (pendingAction || !presenterToken) return;
  pendingAction = action;
  actionError = '';
  render();
  try {
    const response = await fetch('/api/action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Presenter-Token': presenterToken },
      body: JSON.stringify({ action }),
    });
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

root.addEventListener('click', (event) => {
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
    render();
  }
});

window.addEventListener('storage', (event) => {
  if (event.key === 'twilio-bank-theme-v2') {
    document.documentElement.dataset.theme = event.newValue || 'light';
    render();
  }
});

window.addEventListener('popstate', () => { syncAudienceRoute(); render(); });

await loadSnapshot();
const stream = new EventSource('/api/events');
stream.onmessage = (event) => {
  try { applySnapshot(JSON.parse(event.data)); } catch (_) {}
};
stream.onerror = () => {
  transportError = 'Reconnecting to the local demo server…';
  if (window.location.pathname === '/presenter') render();
};
