import test from 'node:test';
import assert from 'node:assert/strict';

let bootCount = 0;
const capturedShotVariants = {
  'branded-calling/1': ['/architecture-shots/branded-calling/1.png'],
  'branded-calling/2': [
    '/architecture-shots/branded-calling/2-1.png',
    '/architecture-shots/branded-calling/2-2.png',
  ],
  'rcs/1': [
    '/architecture-shots/rcs/1-1.png',
    '/architecture-shots/rcs/1-2.png',
  ],
  'shaken-stir/2': [
    '/architecture-shots/shaken-stir/2-1.png',
    '/architecture-shots/shaken-stir/2-2.png',
  ],
};

function state(overrides = {}) {
  return {
    step: 'reached',
    audienceView: 'bank',
    audienceViewRevision: 0,
    smsMode: 'none',
    smsSid: null,
    smsStatus: null,
    messageMode: 'simulated',
    messageChannel: 'simulated',
    callMode: 'simulated',
    callPreviewDevice: 'android',
    messageSid: null,
    callSid: null,
    chargeDecision: 'unrecognized',
    decisionSource: 'presenter',
    messageStatus: null,
    callStatus: null,
    events: [],
    ...overrides,
  };
}

async function boot(path, initialState, {
  historyState = null, config = {}, shotVariants = capturedShotVariants,
  shotManifestAvailable = true, staticShotFiles = [],
} = {}) {
  const locationUrl = new URL('http://demo.test' + path);
  // A browser Location exposes search, but not URL.searchParams.
  const location = {
    get href() { return locationUrl.href; },
    set href(value) { locationUrl.href = value; },
    get pathname() { return locationUrl.pathname; },
    get search() { return locationUrl.search; },
    get hash() { return locationUrl.hash; },
  };
  const rootListeners = new Map();
  const root = {
    innerHTML: '',
    addEventListener(type, listener) { rootListeners.set(type, listener); },
    querySelector() { return null; },
    querySelectorAll() { return []; },
  };
  const document = {
    title: '',
    activeElement: null,
    documentElement: { dataset: { theme: 'light' } },
    getElementById(id) { return id === 'app' ? root : null; },
  };
  const window = {
    location,
    history: {
      state: historyState,
      replaceState(nextState, _title, pathAndQuery) {
        this.state = nextState;
        location.href = new URL(pathAndQuery, location.href).href;
      },
    },
    addEventListener() {},
    clearTimeout,
    setTimeout,
  };
  let stream;
  globalThis.document = document;
  globalThis.window = window;
  globalThis.EventSource = class {
    constructor() { stream = this; }
  };
  globalThis.fetch = async (url, options = {}) => ({
    ok: url !== '/api/architecture-shots' || shotManifestAvailable
      ? options.method !== 'HEAD' || staticShotFiles.includes(url)
      : false,
    status: url === '/api/architecture-shots' && !shotManifestAvailable ? 404 : 200,
    json: async () => url === '/api/presenter/session'
      ? { authenticated: true }
      : url === '/api/architecture-shots'
        ? shotVariants
        : { state: initialState, config: { smsReady: false, rcsReady: false, voiceReady: false, ...config } },
  });

  await import('../public/app.js?presenter-navigation=' + ++bootCount);

  return {
    root,
    window,
    document,
    click(selector, dataset = {}) {
      const element = { dataset };
      rootListeners.get('click')?.({ target: {
        closest(candidate) { return candidate === selector ? element : null; },
      } });
    },
    send(nextState) {
      stream.onmessage({ data: JSON.stringify({ state: nextState, config: { smsReady: false, rcsReady: false, voiceReady: false, ...config } }) });
    },
  };
}

function currentActions(html) {
  return html.match(/<div class="current-actions">([\s\S]*?)<\/div>/)?.[1] ?? '';
}

test('the urgent fraud story starts with an unknown call and then offers a live branded call', async () => {
  const app = await boot('/presenter', state({ step: 'flagged', chargeDecision: null }), { config: { voiceReady: true, smsReady: true } });

  assert.match(app.root.innerHTML, /<span class="step-index">02 \/ 10<\/span>/);
  assert.match(currentActions(app.root.innerHTML), /data-action="showUnknownCall"/);
  assert.doesNotMatch(currentActions(app.root.innerHTML), /data-action="sendSms"|data-action="sendRcs"/);

  app.send(state({ step: 'unknownRinging', chargeDecision: null }));
  assert.match(app.root.innerHTML, /<span class="step-index">03 \/ 10<\/span>/);
  assert.match(currentActions(app.root.innerHTML), /data-action="ignoreUnknownCall"/);

  app.send(state({ step: 'unknownMissed', chargeDecision: null }));
  assert.match(app.root.innerHTML, /<span class="step-index">04 \/ 10<\/span>/);
  assert.match(app.root.innerHTML, /current-scene-phone/);
  assert.match(currentActions(app.root.innerHTML), /data-action="placeCall"/);
  assert.match(currentActions(app.root.innerHTML), /data-action="previewBrandedCall"/);
});

test('the call is where Anthony answers the fraud question', async () => {
  const app = await boot('/presenter', state({ step: 'brandedRinging', chargeDecision: null, callMode: 'live', callSid: 'CA123' }));

  assert.match(app.root.innerHTML, /<span class="step-index">05 \/ 10<\/span>/);
  assert.match(app.root.innerHTML, /Answer and speak/);
  assert.match(currentActions(app.root.innerHTML), /data-action="confirmPurchase"/);
  assert.match(currentActions(app.root.innerHTML), /data-action="reportUnrecognized"/);
  assert.doesNotMatch(currentActions(app.root.innerHTML), /data-action="sendSms"|data-action="sendRcs"/);
});

test('a fraud report unlocks the SMS case update but a recognized purchase ends the story', async () => {
  const app = await boot('/presenter', state({ step: 'reached', chargeDecision: 'unrecognized' }), { config: { smsReady: true } });

  assert.match(app.root.innerHTML, /<span class="step-index">06 \/ 10<\/span>/);
  assert.match(app.root.innerHTML, /current-scene-phone/);
  assert.match(currentActions(app.root.innerHTML), /data-action="sendSms"/);
  assert.match(currentActions(app.root.innerHTML), /data-action="previewSms"/);
  assert.doesNotMatch(currentActions(app.root.innerHTML), /data-action="showArchitecture"/);

  app.send(state({ step: 'reached', chargeDecision: 'recognized' }));
  assert.match(currentActions(app.root.innerHTML), /data-action="showArchitecture"/);
  assert.doesNotMatch(currentActions(app.root.innerHTML), /data-action="sendSms"|data-action="sendRcs"/);
});

test('the case-status SMS remains number-only and is tracked separately from RCS', async () => {
  const app = await boot('/presenter', state({ step: 'smsSent', smsMode: 'live', smsSid: 'SM123', smsStatus: 'accepted' }), {
    config: { smsSenderDisplay: '+18884379561' },
  });

  assert.match(app.root.innerHTML, /<span class="step-index">07 \/ 10<\/span>/);
  assert.match(currentActions(app.root.innerHTML), /data-action="ignoreSms"/);
  assert.match(app.root.innerHTML, /<dt>SMS SID<\/dt><dd>SM123<\/dd>/);
  assert.match(app.root.innerHTML, /<dt>RCS SID<\/dt><dd>—<\/dd>/);
  assert.match(app.root.innerHTML, /Check your phone now/);
  const audience = await boot('/bank', state({ step: 'smsSent', smsMode: 'live' }), {
    config: { smsSenderDisplay: '+18884379561' },
  });
  assert.match(audience.root.innerHTML, /<strong>\+1 \(888\) 437-9561<\/strong>/);
});

test('scheduled SMS is called out before the presenter expects a phone delivery', async () => {
  const app = await boot('/presenter', state({ step: 'smsSent', smsMode: 'live', smsSid: 'SM123', smsStatus: 'scheduled' }));

  assert.match(app.root.innerHTML, /SMS scheduled for later/);
  assert.match(app.root.innerHTML, /has not reached the phone/);
  assert.doesNotMatch(app.root.innerHTML, /Check your phone now/);
  assert.match(currentActions(app.root.innerHTML), /data-action="refreshStatuses"/);
  assert.match(currentActions(app.root.innerHTML), /data-action="ignoreSms"/);

  app.send(state({ step: 'smsSent', smsMode: 'live', smsSid: 'SM123', smsStatus: 'delivered' }));
  assert.match(app.root.innerHTML, /SMS delivered/);
  assert.match(app.root.innerHTML, /Check your phone now/);
});

test('after SMS is ignored, the next real-phone step sends a branded RCS case update', async () => {
  const app = await boot('/presenter', state({ step: 'smsIgnored' }), { config: { rcsReady: true } });

  assert.match(app.root.innerHTML, /<span class="step-index">08 \/ 10<\/span>/);
  assert.match(app.root.innerHTML, /current-scene-phone/);
  assert.match(app.root.innerHTML, /Click Send live RCS/);
  assert.match(currentActions(app.root.innerHTML), /data-action="sendRcs"/);
  assert.match(currentActions(app.root.innerHTML), /data-action="previewRcs"/);
});

test('RCS offers View case even when a live request uses SMS fallback', async () => {
  const app = await boot('/presenter', state({ step: 'rcsSent', messageMode: 'simulated' }));

  assert.match(app.root.innerHTML, /<span class="step-index">09 \/ 10<\/span>/);
  assert.match(currentActions(app.root.innerHTML), /data-action="viewCase"/);
  assert.doesNotMatch(currentActions(app.root.innerHTML), /data-action="markNoResponse"/);

  app.send(state({
    step: 'rcsSent',
    smsMode: 'live',
    smsStatus: 'delivered',
    messageMode: 'live',
    messageChannel: 'fallback',
    messageStatus: 'sent',
  }));
  assert.match(app.root.innerHTML, /<h2>RCS fallback selected<\/h2>/);
  assert.match(app.root.innerHTML, /separate from the earlier SMS/);
  assert.match(currentActions(app.root.innerHTML), /data-action="viewCase"/);
  assert.match(currentActions(app.root.innerHTML), /data-action="showRcsExample"/);

  app.send(state({
    step: 'rcsSent',
    messageMode: 'live',
    messageChannel: 'fallback',
    messageStatus: 'delivered',
    rcsExampleShown: true,
  }));
  assert.match(app.root.innerHTML, /RCS example on screen/);
  assert.match(currentActions(app.root.innerHTML), /data-action="showActualFallback"/);

  const audience = await boot('/bank', state({
    step: 'rcsSent',
    messageMode: 'live',
    messageChannel: 'fallback',
    messageStatus: 'delivered',
    rcsExampleShown: true,
  }));
  audience.click('[data-rcs-profile-open]');
  assert.match(audience.root.innerHTML, /data-rcs-profile-back/);
});

test('a read RCS status is shown as confirmed on the presenter and audience', async () => {
  const readState = state({ step: 'rcsSent', messageMode: 'live', messageChannel: 'rcs', messageStatus: 'read' });
  const presenter = await boot('/presenter', readState);
  const audience = await boot('/bank', readState);

  assert.match(presenter.root.innerHTML, /RCS read/);
  assert.match(presenter.root.innerHTML, /Twilio reports RCS read/);
  assert.match(audience.root.innerHTML, /live RCS read confirmed/);
  assert.doesNotMatch(presenter.root.innerHTML, /Delivery is not confirmed yet/);
});

test('the spoken decision persists across messaging and opens a fictional case page', async () => {
  const app = await boot('/bank', state({ step: 'smsIgnored', chargeDecision: 'unrecognized', decisionSource: 'voice' }));

  assert.match(app.root.innerHTML, /Response received/);
  assert.match(app.root.innerHTML, /Decision recorded from the live call/);
  assert.match(app.root.innerHTML, /No, not mine/);

  app.send(state({ step: 'caseViewed', chargeDecision: 'unrecognized', decisionSource: 'voice', audienceViewRevision: 1 }));
  assert.equal(app.window.location.pathname, '/bank');
  assert.equal(app.window.location.search, '?case=1');
  assert.equal(app.document.title, 'Case status · Twilio Bank');
  assert.match(app.root.innerHTML, /Fraud report received/);
  assert.match(app.root.innerHTML, /Midlife Crisis Motors/);
  assert.match(app.root.innerHTML, /Back to overview/);
  assert.match(app.root.innerHTML, /href="\/bank\?home=1"/);
  assert.match(app.root.innerHTML, /Fictional demo/);
});

test('the RCS business profile closes when the case page takes over', async () => {
  const app = await boot('/bank', state({ step: 'rcsSent', messageMode: 'simulated' }));

  assert.match(app.root.innerHTML, /data-rcs-profile-open/);
  app.click('[data-rcs-profile-open]');
  assert.match(app.root.innerHTML, /data-rcs-profile-back/);
  app.send(state({ step: 'rcsSent', messageMode: 'simulated', messageStatus: 'delivered' }));
  assert.match(app.root.innerHTML, /data-rcs-profile-back/);
  app.click('[data-rcs-profile-tab]', { rcsProfileTab: 'options' });
  assert.match(app.root.innerHTML, /Privacy policy/);

  app.send(state({ step: 'caseViewed', audienceViewRevision: 1 }));
  assert.doesNotMatch(app.root.innerHTML, /data-rcs-profile-open|data-rcs-profile-back/);
  assert.equal(app.window.location.search, '?case=1');
});

test('the presenter can continue from case view to architecture and setup guides', async () => {
  const app = await boot('/presenter', state({ step: 'caseViewed', chargeDecision: 'unrecognized' }));

  assert.match(app.root.innerHTML, /<span class="step-index">10 \/ 10<\/span>/);
  assert.match(currentActions(app.root.innerHTML), /data-action="showArchitecture"/);
  app.send(state({ step: 'caseViewed', audienceView: 'architecture', audienceViewRevision: 1 }));
  assert.match(currentActions(app.root.innerHTML), /data-action="showTechnicalNotes"/);
  assert.match(app.root.innerHTML, /<h2>Architecture overview<\/h2>/);
  app.send(state({ step: 'caseViewed', audienceView: 'technicalNotes', audienceViewRevision: 2 }));
  assert.match(app.root.innerHTML, /<h2>Implementation guide<\/h2>/);
});

test('the case link opens the fictional case while the bank logo can return home', async () => {
  const casePage = await boot('/bank?case=1', state({ step: 'rcsSent' }));
  assert.equal(casePage.window.location.search, '?case=1');
  assert.match(casePage.root.innerHTML, /class="audience-shell bank-shell case-status-page"/);
  assert.match(casePage.root.innerHTML, /Fraud report received/);
  assert.match(casePage.root.innerHTML, /href="\/bank\?home=1&amp;customer=1"/);

  casePage.send(state({ step: 'rcsSent', audienceView: 'architecture', audienceViewRevision: 1 }));
  assert.equal(casePage.window.location.pathname, '/bank', 'a customer-opened case must stay on the case page');
  assert.equal(casePage.window.location.search, '?case=1');

  const home = await boot('/bank?home=1', state({ step: 'caseViewed' }));
  assert.equal(home.window.location.pathname, '/bank');
  assert.equal(home.window.location.search, '');
  assert.match(home.root.innerHTML, /Your money, in view/);
  assert.doesNotMatch(home.root.innerHTML, /class="case-status-page"/);

  const customerHome = await boot('/bank?home=1&customer=1', state({ step: 'caseViewed' }));
  customerHome.send(state({ step: 'caseViewed', audienceView: 'architecture', audienceViewRevision: 1 }));
  assert.equal(customerHome.window.location.pathname, '/bank');
  assert.equal(customerHome.window.location.search, '');
  assert.match(customerHome.root.innerHTML, /Your money, in view/);
});

test('architecture shows the urgent call before the case-update RCS path', async () => {
  const app = await boot('/architecture', state({ step: 'caseViewed', audienceView: 'architecture' }));
  const overview = app.root.innerHTML;

  assert.ok(overview.indexOf('href="/architecture/details?topic=branded-calling&view=1"') < overview.indexOf('href="/architecture/details?topic=rcs&view=1"'));
  assert.match(overview, /Fraud report received/);
  assert.match(overview, /View case/);
  assert.match(overview, /topic=shaken-stir/);
  assert.match(overview, /topic=cnam/);
  assert.match(overview, /topic=voice-integrity/);
  assert.doesNotMatch(overview, /Review recent card activity/);
});

test('implementation guides advance one sourced, highlighted setup step at a time', async () => {
  const index = await boot('/architecture/details', state({ step: 'caseViewed', audienceView: 'technicalNotes' }));
  assert.match(index.root.innerHTML, /topic=rcs/);
  assert.match(index.root.innerHTML, /topic=branded-calling/);
  assert.match(index.root.innerHTML, /Back to architecture/);

  const rcsOverview = await boot('/architecture/details?topic=rcs&view=1', state({ step: 'caseViewed', audienceView: 'technicalNotes' }));
  assert.match(rcsOverview.root.innerHTML, /Step 1 of 8/);
  assert.match(rcsOverview.root.innerHTML, /What it does/);
  assert.match(rcsOverview.root.innerHTML, /Why it matters/);
  assert.match(rcsOverview.root.innerHTML, /sender people can inspect/);
  assert.match(rcsOverview.root.innerHTML, /step=2&amp;view=1|step=2&view=1/);

  const rcsSetup = await boot('/architecture/details?topic=rcs&step=2&view=1', state({ step: 'caseViewed', audienceView: 'technicalNotes' }));
  assert.match(rcsSetup.root.innerHTML, /guide-main--scroll/);
  assert.match(rcsSetup.root.innerHTML, /guide-console-visual--stack/);
  const consoleMarkup = rcsSetup.root.innerHTML;
  const screenshotEnd = consoleMarkup.lastIndexOf('</figure>');
  const instructionsStart = consoleMarkup.indexOf('class="guide-console-instructions"');
  assert.ok(instructionsStart > screenshotEnd, 'instructions remain visible when the screenshot loads');
  assert.ok(consoleMarkup.indexOf('Show Public details', instructionsStart) > instructionsStart);
  assert.match(consoleMarkup, /architecture-shots\/rcs\/1-1\.png/);
  assert.match(consoleMarkup, /architecture-shots\/rcs\/1-2\.png/);
  assert.ok(consoleMarkup.indexOf('1-1.png') < consoleMarkup.indexOf('1-2.png'));
  assert.equal((consoleMarkup.match(/<img src="\/architecture-shots\/rcs\/1-/g) || []).length, 2);
  assert.doesNotMatch(consoleMarkup, /Real Console screenshot pending/);
  const rcsTester = await boot('/architecture/details?topic=rcs&step=3&view=1', state({ step: 'caseViewed', audienceView: 'technicalNotes' }));
  assert.match(rcsTester.root.innerHTML, /Make me a tester/);
  assert.match(rcsTester.root.innerHTML, /architecture-shots\/rcs\/2\.png/);
  const rcsGoogle = await boot('/architecture/details?topic=rcs&step=4&view=1', state({ step: 'caseViewed', audienceView: 'technicalNotes' }));
  assert.match(rcsGoogle.root.innerHTML, /Google registration/);
  assert.match(rcsGoogle.root.innerHTML, /architecture-shots\/rcs\/3\.png/);
  const rcsUs = await boot('/architecture/details?topic=rcs&step=5&view=1', state({ step: 'caseViewed', audienceView: 'technicalNotes' }));
  assert.match(rcsUs.root.innerHTML, /US registration/);
  assert.match(rcsUs.root.innerHTML, /architecture-shots\/rcs\/4\.png/);
  const rcsService = await boot('/architecture/details?topic=rcs&step=6&view=1', state({ step: 'caseViewed', audienceView: 'technicalNotes' }));
  assert.match(rcsService.root.innerHTML, /Finish the Messaging Service setup/);
  assert.match(rcsService.root.innerHTML, /sender pool/i);
  assert.match(rcsService.root.innerHTML, /SMS\/MMS-capable number/);
  assert.match(rcsService.root.innerHTML, /architecture-shots\/rcs\/5\.png/);
  assert.doesNotMatch(rcsService.root.innerHTML, /Advanced Opt-Out/);
  const rcsTemplate = await boot('/architecture/details?topic=rcs&step=7&view=1', state({ step: 'caseViewed', audienceView: 'technicalNotes' }));
  assert.equal(rcsTemplate.window.location.search, '?topic=rcs&step=7');
  assert.match(rcsTemplate.root.innerHTML, /Console builder cannot create that type/);
  assert.match(rcsTemplate.root.innerHTML, /create-templates-with-the-content-template-builder/);
  assert.match(rcsTemplate.root.innerHTML, /Fraud report received/);
  assert.match(rcsTemplate.root.innerHTML, /View case/);
  assert.match(rcsTemplate.root.innerHTML, /content\.twilio\.com\/v1\/Content/);
  assert.match(rcsTemplate.root.innerHTML, /guide-code-line is-focus/);
  rcsTemplate.send(state({ step: 'caseViewed', audienceView: 'technicalNotes' }));
  assert.match(rcsTemplate.root.innerHTML, /Step 7 of 8/, 'a live refresh should keep the selected step');

  const rcsSend = await boot('/architecture/details?topic=rcs&step=8&view=1', state({ step: 'caseViewed', audienceView: 'technicalNotes' }));
  assert.match(rcsSend.root.innerHTML, /TWILIO_RCS_CASE_CONTENT_SID/);
  assert.match(rcsSend.root.innerHTML, /messagingServiceSid/);
  assert.match(rcsSend.root.innerHTML, /Back to architecture →/);

  const callingSetup = await boot('/architecture/details?topic=branded-calling&view=1', state({ step: 'caseViewed', audienceView: 'technicalNotes' }));
  assert.match(callingSetup.root.innerHTML, /Step 1 of 9/);
  assert.match(callingSetup.root.innerHTML, /Why it matters/);
  const callingProfile = await boot('/architecture/details?topic=branded-calling&step=2&view=1', state({ step: 'caseViewed', audienceView: 'technicalNotes' }));
  assert.match(callingProfile.root.innerHTML, /<img src="\/architecture-shots\/branded-calling\/1\.png"/);
  assert.doesNotMatch(callingProfile.root.innerHTML, /Real Console screenshot pending/);
  const callingIdentity = await boot('/architecture/details?topic=branded-calling&step=3&view=1', state({ step: 'caseViewed', audienceView: 'technicalNotes' }));
  const callingIdentityHtml = callingIdentity.root.innerHTML;
  assert.match(callingIdentityHtml, /guide-main--scroll/);
  assert.match(callingIdentityHtml, /Registrations → Branded calling → Create registration/);
  assert.match(callingIdentityHtml, /guide-console-visual--stack/);
  assert.match(callingIdentityHtml, /architecture-shots\/branded-calling\/2-1\.png/);
  assert.match(callingIdentityHtml, /architecture-shots\/branded-calling\/2-2\.png/);
  assert.ok(callingIdentityHtml.indexOf('2-1.png') < callingIdentityHtml.indexOf('2-2.png'));
  assert.equal((callingIdentityHtml.match(/<img src="\/architecture-shots\/branded-calling\/2-/g) || []).length, 2);
  assert.ok(callingIdentityHtml.indexOf('On this screen') > callingIdentityHtml.lastIndexOf('</figure>'));
  const callingRegulation = await boot('/architecture/details?topic=branded-calling&step=5&view=1', state({ step: 'caseViewed', audienceView: 'technicalNotes' }));
  assert.match(callingRegulation.root.innerHTML, /Compliance\/Regulations/);
  assert.match(callingRegulation.root.innerHTML, /BRANDED_REGULATION_VERSION/);
  const callingApi = await boot('/architecture/details?topic=branded-calling&step=6&view=1', state({ step: 'caseViewed', audienceView: 'technicalNotes' }));
  assert.match(callingApi.root.innerHTML, /Private beta/);
  assert.match(callingApi.root.innerHTML, /authorizedRepresentative1/);
  assert.match(callingApi.root.innerHTML, /authorizedContact/);
  assert.match(callingApi.root.innerHTML, /displayCallReason/);
  assert.match(callingApi.root.innerHTML, /BRANDED_REGISTRATION_ID/);
  assert.doesNotMatch(callingApi.root.innerHTML, /not a complete request/);
  const callingLoa = await boot('/architecture/details?topic=branded-calling&step=7&view=1', state({ step: 'caseViewed', audienceView: 'technicalNotes' }));
  assert.match(callingLoa.root.innerHTML, /LETTER_OF_AUTHORIZATION/);
  assert.match(callingLoa.root.innerHTML, /DocumentLinks/);
  const callingAssign = await boot('/architecture/details?topic=branded-calling&step=8&view=1', state({ step: 'caseViewed', audienceView: 'technicalNotes' }));
  assert.match(callingAssign.root.innerHTML, /ResourceAssignments/);
  assert.match(callingAssign.root.innerHTML, /PENDING_REVIEW/);
  const callingCall = await boot('/architecture/details?topic=branded-calling&step=9&view=1', state({ step: 'caseViewed', audienceView: 'technicalNotes' }));
  assert.match(callingCall.root.innerHTML, /TWILIO_VOICE_FROM/);
  assert.match(callingCall.root.innerHTML, /client\.calls\.create/);
  assert.match(callingCall.root.innerHTML, /conversationRelay/);
  assert.match(callingCall.root.innerHTML, /TWILIO_CONVERSATION_RELAY_URL/);

  for (const topic of ['shaken-stir', 'cnam', 'voice-integrity']) {
    const overview = await boot(`/architecture/details?topic=${topic}&view=1`, state({ step: 'caseViewed', audienceView: 'technicalNotes' }));
    assert.match(overview.root.innerHTML, /What it does/);
    assert.match(overview.root.innerHTML, /Why it matters/);
    const setup = await boot(`/architecture/details?topic=${topic}&step=2&view=1`, state({ step: 'caseViewed', audienceView: 'technicalNotes' }));
    assert.match(setup.root.innerHTML, new RegExp(`architecture-shots/${topic}/1\\.png`));
    if (topic === 'shaken-stir') {
      const registration = await boot('/architecture/details?topic=shaken-stir&step=3&view=1', state({ step: 'caseViewed', audienceView: 'technicalNotes' }));
      const html = registration.root.innerHTML;
      assert.match(html, /Step 3 of 6/);
      assert.match(html, /Registrations → SHAKEN\/STIR → Create registration/);
      assert.match(html, /If creating a Trust Product, complete its details and submit it for review/);
      assert.ok(html.indexOf('2-1.png') < html.indexOf('2-2.png'));
      assert.equal((html.match(/<img src="\/architecture-shots\/shaken-stir\/2-/g) || []).length, 2);
      assert.doesNotMatch(html, /Real Console screenshot pending/);
    } else {
      const registration = await boot(`/architecture/details?topic=${topic}&step=3&view=1`, state({ step: 'caseViewed', audienceView: 'technicalNotes' }));
      const html = registration.root.innerHTML;
      assert.match(html, /Step 3 of 7/);
      assert.match(html, /Create registration/);
      assert.match(html, /optional.*API/i);
      assert.match(html, new RegExp(`architecture-shots/${topic}/2\\.png`));
      assert.match(html, /Real Console screenshot pending/);
    }
    const profileNumber = await boot(`/architecture/details?topic=${topic}&step=4&view=1`, state({ step: 'caseViewed', audienceView: 'technicalNotes' }));
    assert.match(profileNumber.root.innerHTML, /customerProfilesChannelEndpointAssignment\.create/);
    assert.match(profileNumber.root.innerHTML, /Optional API:/);
    const create = await boot(`/architecture/details?topic=${topic}&step=5&view=1`, state({ step: 'caseViewed', audienceView: 'technicalNotes' }));
    assert.match(create.root.innerHTML, /trustProducts\.create/);
    assert.match(create.root.innerHTML, /guide-code-line is-focus/);
    const finish = await boot(`/architecture/details?topic=${topic}&step=6&view=1`, state({ step: 'caseViewed', audienceView: 'technicalNotes' }));
    assert.match(finish.root.innerHTML, /pending-review/);
    assert.match(finish.root.innerHTML, /twilio\.com\/docs/);
    if (topic !== 'shaken-stir') {
      const finalConsole = await boot(`/architecture/details?topic=${topic}&step=7&view=1`, state({ step: 'caseViewed', audienceView: 'technicalNotes' }));
      assert.match(finalConsole.root.innerHTML, topic === 'cnam' ? /Caller Name Lookup/ : /Inspect registration status/);
      assert.match(finalConsole.root.innerHTML, new RegExp(`architecture-shots/${topic}/3\\.png`));
    }
  }
});

test('RCS screenshots load from static files when a running server lacks the manifest endpoint', async () => {
  const app = await boot('/architecture/details?topic=rcs&step=2&view=1',
    state({ step: 'caseViewed', audienceView: 'technicalNotes' }), {
      shotManifestAvailable: false,
      staticShotFiles: [
        '/architecture-shots/rcs/1-1.png',
        '/architecture-shots/rcs/1-2.png',
      ],
    });
  const html = app.root.innerHTML;
  assert.match(html, /guide-main--scroll/);
  assert.match(html, /guide-console-visual--stack/);
  assert.equal((html.match(/<img src="\/architecture-shots\/rcs\/1-/g) || []).length, 2);
  assert.ok(html.indexOf('1-1.png') < html.indexOf('1-2.png'));
  assert.doesNotMatch(html, /architecture-shots\/rcs\/1\.png/);
});

test('single screenshots load from static files when a running server lacks the manifest endpoint', async () => {
  const app = await boot('/architecture/details?topic=branded-calling&step=2&view=1',
    state({ step: 'caseViewed', audienceView: 'technicalNotes' }), {
      shotManifestAvailable: false,
      staticShotFiles: ['/architecture-shots/branded-calling/1.png'],
    });
  assert.match(app.root.innerHTML, /<img src="\/architecture-shots\/branded-calling\/1\.png"/);
  assert.doesNotMatch(app.root.innerHTML, /Real Console screenshot pending/);
});

test('single screenshots load when an older manifest omits them', async () => {
  const app = await boot('/architecture/details?topic=branded-calling&step=2&view=1',
    state({ step: 'caseViewed', audienceView: 'technicalNotes' }), {
      shotVariants: {},
      staticShotFiles: ['/architecture-shots/branded-calling/1.png'],
    });
  assert.match(app.root.innerHTML, /<img src="\/architecture-shots\/branded-calling\/1\.png"/);
  assert.doesNotMatch(app.root.innerHTML, /Real Console screenshot pending/);
});

test('every highlighted API line has a concise explanation', async () => {
  const codeSteps = {
    'branded-calling': [5, 6, 7, 8, 9],
    rcs: [7, 8, 9],
    'shaken-stir': [4, 5, 6],
    cnam: [4, 5, 6],
    'voice-integrity': [4, 5, 6],
  };
  for (const [topic, steps] of Object.entries(codeSteps)) {
    for (const step of steps) {
      const app = await boot(`/architecture/details?topic=${topic}&step=${step}&view=1`,
        state({ step: 'caseViewed', audienceView: 'technicalNotes' }));
      const html = app.root.innerHTML;
      const highlighted = (html.match(/class="guide-code-line is-focus(?: is-current)?"/g) || []).length;
      const notes = (html.match(/data-guide-line-note="[^"]+"/g) || []).length;
      assert.ok(highlighted > 0, `${topic} step ${step} has a highlighted line`);
      assert.equal(notes, highlighted, `${topic} step ${step} explains every line`);
      assert.match(html, /<p data-guide-focus-note>[^<]+<\/p>/);
    }
  }
});

test('the audience follows presenter navigation and manual page choice survives a refresh', async () => {
  const app = await boot('/architecture', state({ step: 'caseViewed', audienceView: 'architecture', audienceViewRevision: 1 }));
  assert.equal(app.document.title, 'Architecture · Twilio Bank');

  app.send(state({ step: 'caseViewed', audienceView: 'technicalNotes', audienceViewRevision: 2 }));
  assert.equal(app.window.location.pathname, '/architecture/details');
  assert.equal(app.document.title, 'Implementation guide · Twilio Bank');

  app.send(state({ step: 'caseViewed', audienceView: 'bank', audienceViewRevision: 3 }));
  assert.equal(app.window.location.pathname, '/bank');
  assert.equal(app.window.location.search, '?case=1');
  assert.equal(app.window.history.state?.presenterFollow, true);

  const reloadedCase = await boot('/bank?case=1', state({ step: 'caseViewed', audienceView: 'bank', audienceViewRevision: 3 }), { historyState: app.window.history.state });
  reloadedCase.send(state({ step: 'caseViewed', audienceView: 'architecture', audienceViewRevision: 4 }));
  assert.equal(reloadedCase.window.location.pathname, '/architecture');

  const architectureState = state({ step: 'caseViewed', audienceView: 'architecture', audienceViewRevision: 10 });
  const explicitHome = await boot('/bank?home=1', architectureState);
  const reloadedHome = await boot('/bank', architectureState, { historyState: explicitHome.window.history.state });
  assert.equal(reloadedHome.window.location.pathname, '/bank');
  assert.equal(reloadedHome.document.title, 'Customer account · Twilio Bank');
  reloadedHome.send(state({ step: 'caseViewed', audienceView: 'architecture', audienceViewRevision: 11 }));
  assert.equal(reloadedHome.window.location.pathname, '/architecture');
});
